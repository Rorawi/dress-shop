"use client";
/* eslint-disable @next/next/no-img-element -- These previews come from this shop's public product storage. */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { optimizePhoto } from "@/lib/admin/image-utils";

type ProductImage = { id: string; storage_path: string | null; source_url: string | null; alt_text: string; position: number; is_primary: boolean };

export default function ProductImageManager({ shopId, productId, images }: { shopId: string; productId: string; images: ProductImage[] }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function addPhotos(files: File[]) {
    if (!files.length) return;
    if (images.length + files.length > 8) return setError("A product can have up to eight photos.");
    if (files.some((file) => !file.type.startsWith("image/"))) return setError("Choose image files only.");
    setBusy(true); setError(""); setMessage("");
    const uploadedPaths: string[] = [];
    const insertedImageIds: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const optimized = await optimizePhoto(file);
        const path = `${shopId}/${productId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const { data: inserted, error: insertError } = await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: `Product photo ${images.length + index + 1}`, position: images.length + index, is_primary: images.length === 0 && index === 0 }).select("id").single();
        if (insertError) throw insertError;
        if (inserted) insertedImageIds.push(inserted.id);
      }
      setMessage("Photos added. The listing has returned to review.");
      router.refresh();
    } catch (cause) {
      if (insertedImageIds.length) await supabase.from("product_images").delete().in("id", insertedImageIds);
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      setError(cause instanceof Error ? cause.message : "Could not add these photos.");
    } finally { setBusy(false); }
  }

  async function removePhoto(image: ProductImage) {
    if (images.length < 2) return setError("Keep at least one photo on a product. Delete the product if you no longer need it.");
    if (!window.confirm("Remove this product photo? The listing will return to review.")) return;
    setBusy(true); setError(""); setMessage("");
    const { error: deleteError } = await supabase.from("product_images").delete().eq("id", image.id).eq("product_id", productId);
    if (deleteError) {
      setError(deleteError.message); setBusy(false); return;
    }
    let cleanupFailed = false;
    if (image.storage_path) {
      const { error: storageError } = await supabase.storage.from("product-images").remove([image.storage_path]);
      cleanupFailed = Boolean(storageError);
    }
    if (image.is_primary) {
      const { data: remaining } = await supabase.from("product_images").select("id").eq("product_id", productId).order("position").limit(1).maybeSingle();
      if (remaining) await supabase.from("product_images").update({ is_primary: true }).eq("id", remaining.id);
    }
    setMessage(cleanupFailed ? "Photo removed from the listing. Storage cleanup needs admin attention." : "Photo removed. The listing has returned to review.");
    router.refresh();
    setBusy(false);
  }

  return <section className="mt-5 border-t border-[#eee9f1] pt-4"><h3 className="text-sm font-semibold">Product photos</h3><div className="mt-3 flex flex-wrap gap-3">{images.map((image) => { const url = image.source_url ?? (image.storage_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${image.storage_path}` : null); return <div key={image.id} className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#f4eff9]">{url && <img src={url} alt={image.alt_text || "Product photo"} className="h-full w-full object-cover"/>}<button type="button" disabled={busy} onClick={() => void removePhoto(image)} aria-label="Remove product photo" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm font-semibold text-white disabled:opacity-50">×</button></div>; })}<label className="flex h-20 w-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#c6afd9] px-3 text-center text-xs font-semibold text-[#55239a]">{busy ? "Working…" : "Add photos"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(event) => { void addPhotos(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }}/></label></div>{error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}{message && <p role="status" className="mt-3 text-xs text-emerald-800">{message}</p>}</section>;
}
