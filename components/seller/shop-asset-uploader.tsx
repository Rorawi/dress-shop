"use client";
/* eslint-disable @next/next/no-img-element -- The seller chooses the image and sees its freshly uploaded preview. */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { optimizePhoto } from "@/lib/admin/image-utils";

type AssetKind = "logo_url" | "banner_url" | "verification_document_path";

export default function ShopAssetUploader({ shopId, logoUrl, bannerUrl, verificationDocumentPath }: { shopId: string; logoUrl: string | null; bannerUrl: string | null; verificationDocumentPath: string | null }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [busy, setBusy] = useState<AssetKind | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload(kind: AssetKind, file: File | undefined) {
    if (!file) return;
    if (kind === "verification_document_path") {
      if (!(file.type.startsWith("image/") || file.type === "application/pdf")) return setError("Choose an image or PDF for verification.");
      if (file.size > 10 * 1024 * 1024) return setError("Choose a verification file smaller than 10 MB.");
    } else {
    if (!file.type.startsWith("image/")) return setError("Choose an image file for the shop profile.");
    if (file.size > 15 * 1024 * 1024) return setError("Choose an image smaller than 15 MB.");
    }
    setBusy(kind); setError(""); setMessage("");
    const extension = file.type === "application/pdf" ? "pdf" : "webp";
    const bucket = kind === "verification_document_path" ? "verification-documents" : "shop-assets";
    const prefix = kind === "logo_url" ? "logo" : kind === "banner_url" ? "banner" : "verification";
    const path = `${shopId}/${prefix}-${crypto.randomUUID()}.${extension}`;
    try {
      const optimized = kind === "verification_document_path" && file.type === "application/pdf" ? file : await optimizePhoto(file);
      const contentType = file.type === "application/pdf" ? "application/pdf" : "image/webp";
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, optimized, { contentType, upsert: false, cacheControl: kind === "verification_document_path" ? "3600" : "31536000" });
      if (uploadError) throw uploadError;
      const update = kind === "verification_document_path" ? { [kind]: path } : { [kind]: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl };
      const { error: updateError } = await supabase.from("shops").update(update).eq("id", shopId);
      if (updateError) {
        await supabase.storage.from(bucket).remove([path]);
        throw updateError;
      }
      if (kind === "verification_document_path" && verificationDocumentPath) await supabase.storage.from(bucket).remove([verificationDocumentPath]);
      setMessage(kind === "logo_url" ? "Shop logo updated." : kind === "banner_url" ? "Shop banner updated." : "Private verification document uploaded.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload this shop image.");
    } finally { setBusy(null); }
  }

  return <section className="mt-8 rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7"><h2 className="text-2xl">Shop photos and verification</h2><p className="mt-2 text-sm leading-6 text-[#625b68]">Upload a logo and a wide banner to give your public shop page its own identity. Images are resized and saved as WebP. Verification documents stay in a private bucket and are only available to your shop and marketplace admins.</p><div className="mt-5 grid gap-5 sm:grid-cols-2">{([ ["logo_url", "Shop logo", logoUrl], ["banner_url", "Shop banner", bannerUrl] ] as const).map(([kind, label, url]) => <label key={kind} className="block rounded-xl border border-[#ece6f0] p-4 text-sm font-semibold">{label}<div className={`mt-3 overflow-hidden rounded-xl bg-[#f4eff9] ${kind === "logo_url" ? "aspect-square max-w-48" : "aspect-[2/1]"}`}>{url ? <img src={url} alt={`Current ${label.toLowerCase()}`} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-xs font-normal text-[#817888]">No image uploaded</div>}</div><input className="mt-3 block w-full text-xs font-normal" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy !== null} onChange={(event) => { void upload(kind, event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}/><span className="mt-2 block text-xs font-normal text-[#817888]">{busy === kind ? "Uploading…" : "JPEG, PNG, or WebP · 15 MB max"}</span></label>)}</div><label className="mt-5 block rounded-xl border border-[#ece6f0] p-4 text-sm font-semibold">Private verification document<p className="mt-1 text-xs font-normal text-[#817888]">{verificationDocumentPath ? "A verification document is on file." : "Optional when your verification link already shows an established account."}</p><input className="mt-3 block w-full text-xs font-normal" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy !== null} onChange={(event) => { void upload("verification_document_path", event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}/><span className="mt-2 block text-xs font-normal text-[#817888]">{busy === "verification_document_path" ? "Uploading…" : "JPEG, PNG, WebP, or PDF · 10 MB max"}</span></label>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>}</section>;
}
