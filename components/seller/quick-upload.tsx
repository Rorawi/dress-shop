"use client";
/* eslint-disable @next/next/no-img-element -- Browser-created product previews are not remote content. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, LoaderCircle, Sparkles, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { optimizePhoto } from "@/lib/admin/image-utils";

type Category = { id: string; name: string; department: string };
type Subcategory = { id: string; name: string; category_id: string };
type Brand = { id: string; name: string };
type Tag = { id: string; name: string };
type Analysis = { name: string; description: string; colors: string[]; department: string; gender: string; category_suggestion: string; subcategory_suggestion: string; sleeve_length: "short" | "long" | "three_quarter" | "sleeveless" | "unknown"; moderation_verdict: "looks_fine" | "needs_review" | "likely_prohibited"; moderation_reason: string };
type SharedDraft = { id: string; name: string; description: string; category_id: string; subcategory_id: string | null; gender: string | null; price: number | string; moderation_verdict: Analysis["moderation_verdict"] | null; moderation_reason: string | null; images: string[]; caption: string };
const input = "mt-2 w-full rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5bc7] focus:ring-4 focus:ring-purple-100";
const slugify = (value: string) => value.normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function fileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this photo."));
    reader.onerror = () => reject(new Error("Could not read this photo."));
    reader.readAsDataURL(file);
  });
}

export default function QuickUpload({ categories, subcategories, brands, tags, shopId, initialShared, shareError }: { categories: Category[]; subcategories: Subcategory[]; brands: Brand[]; tags: Tag[]; shopId: string; initialShared: SharedDraft | null; shareError?: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const galleryInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [name, setName] = useState(initialShared?.name ?? "");
  const [description, setDescription] = useState(initialShared?.description ?? initialShared?.caption ?? "");
  const [categoryId, setCategoryId] = useState(initialShared?.category_id ?? categories[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(initialShared?.subcategory_id ?? "");
  const [brandId, setBrandId] = useState("");
  const [sleeveLength, setSleeveLength] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [gender, setGender] = useState(initialShared?.gender ?? "unisex");
  const [price, setPrice] = useState(String(initialShared?.price ?? ""));
  const [color, setColor] = useState("Default");
  const [variantLines, setVariantLines] = useState("One size: 0");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(shareError ?? "");

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function chooseFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const chosen = Array.from(fileList);
    if (chosen.length > 8) { setError("Choose up to eight photos for one product draft."); return; }
    if (chosen.some((file) => !file.type.startsWith("image/"))) { setError("Only image files can be added to a product draft."); return; }
    if (chosen.some((file) => file.size > 25 * 1024 * 1024)) { setError("Each source photo must be smaller than 25 MB."); return; }
    setFiles(chosen); setError(""); setAnalysis(null);
    if (galleryInput.current) galleryInput.current.value = "";
  }

  async function suggestDetails() {
    const firstFile = files[0];
    const firstSharedUrl = initialShared?.images[0];
    if (!firstFile && !firstSharedUrl) return setError("Add a product photo before requesting suggestions.");
    setBusy(true); setError(""); setMessage("");
    try {
      const optimized = firstFile ? await optimizePhoto(firstFile) : await fetch(firstSharedUrl!).then((response) => response.blob());
      const imageDataUrl = await fileAsDataUrl(optimized);
      const categoryOptions = [...categories.map((category) => category.name), ...subcategories.map((subcategory) => subcategory.name)];
      const response = await fetch("/api/admin/analyze-product-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl, caption: description, productId: initialShared?.id, categoryOptions }) });
      const data = await response.json();
      if (!response.ok || !data.analysis) throw new Error(data.error || "Could not generate product suggestions.");
      const suggestions = data.analysis as Analysis;
      setAnalysis(suggestions);
      setName(suggestions.name);
      setDescription(suggestions.description);
      setColor(suggestions.colors.join(", ") || "Default");
      if (suggestions.gender !== "unknown") setGender(suggestions.gender);
      if (suggestions.sleeve_length !== "unknown") setSleeveLength(suggestions.sleeve_length);
      const suggestedCategory = categories.find((category) => category.name.toLowerCase() === suggestions.category_suggestion.toLowerCase());
      if (suggestedCategory) setCategoryId(suggestedCategory.id);
      const suggestedSubcategory = subcategories.find((subcategory) => subcategory.name.toLowerCase() === suggestions.subcategory_suggestion.toLowerCase());
      if (suggestedSubcategory) { setCategoryId(suggestedSubcategory.category_id); setSubcategoryId(suggestedSubcategory.id); }
      setMessage("Suggestions are ready. Review every detail before saving your draft.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not analyze this photo."); }
    finally { setBusy(false); }
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericPrice = Number(price);
    const sizes = variantLines.split(",").map((line) => {
      const [variantSize, rawStock] = line.split(":");
      return { size: variantSize?.trim() ?? "", stock: Number(rawStock?.trim()) };
    }).filter((variant) => variant.size);
    const colors = [...new Set(color.split(",").map((value) => value.trim().slice(0, 40)).filter(Boolean))];
    if (!colors.length) colors.push("Default");
    const variants = sizes.flatMap((variant) => colors.map((variantColor) => ({ ...variant, color: variantColor })));
    if (!name.trim() || !categoryId || !Number.isFinite(numericPrice) || numericPrice <= 0 || !variants.length || variants.some((variant) => !Number.isInteger(variant.stock) || variant.stock < 0)) return setError("Enter a product name, category, price greater than zero, and size: stock variants such as S:2, M:3.");
    if (!initialShared && files.length === 0) return setError("Choose at least one product photo.");
    setBusy(true); setError(""); setMessage("");
    let productId = initialShared?.id ?? null;
    const uploadedPaths: string[] = [];
    try {
      if (initialShared) {
        const { error: updateError } = await supabase.from("products").update({ name: name.trim(), slug: `${slugify(name) || "shop-find"}-${initialShared.id.slice(0, 8)}`, description: description.trim(), category_id: categoryId, subcategory_id: subcategoryId || null, brand_id: brandId || null, sleeve_length: sleeveLength || null, gender, price: numericPrice }).eq("id", initialShared.id).eq("shop_id", shopId);
        if (updateError) throw updateError;
      } else {
        const { data: product, error: insertError } = await supabase.from("products").insert({
          shop_id: shopId, name: name.trim(), slug: `${slugify(name) || "shop-find"}-${crypto.randomUUID().slice(0, 8)}`,
          description: description.trim(), category_id: categoryId, subcategory_id: subcategoryId || null, brand_id: brandId || null, sleeve_length: sleeveLength || null, gender, price: numericPrice,
          is_published: false, moderation_status: "pending",
        }).select("id").single();
        if (insertError || !product) throw insertError ?? new Error("Could not create the product draft.");
        productId = product.id;
        for (const [position, file] of files.entries()) {
          const optimized = await optimizePhoto(file);
          const path = `${shopId}/${productId}/${crypto.randomUUID()}.webp`;
          const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
          if (uploadError) throw uploadError;
          uploadedPaths.push(path);
          const { error: imageError } = await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: `${name.trim()} photo ${position + 1}`, position, is_primary: position === 0 });
          if (imageError) throw imageError;
        }
      }
      const { error: variantError } = await supabase.from("product_variants").upsert(variants.map((variant) => ({ product_id: productId, size: variant.size.slice(0, 40), color: variant.color || "Default", stock: variant.stock })), { onConflict: "product_id,size,color" });
      if (variantError) throw variantError;
      const { error: clearTagsError } = await supabase.from("product_tags").delete().eq("product_id", productId);
      if (clearTagsError) throw clearTagsError;
      if (selectedTagIds.length) {
        const { error: tagError } = await supabase.from("product_tags").insert(selectedTagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));
        if (tagError) throw tagError;
      }
      if (initialShared) await supabase.from("seller_upload_drafts").delete().eq("product_id", initialShared.id);
      let savedMessage = "Draft saved. The marketplace team will review it before it goes live.";
      if (!initialShared && analysis && files[0]) {
        try {
          const optimized = await optimizePhoto(files[0]);
          const imageDataUrl = await fileAsDataUrl(optimized);
      const response = await fetch("/api/admin/analyze-product-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl, caption: description, productId }) });
          if (!response.ok) savedMessage = "Draft saved. The AI pre-check could not be saved, so this listing remains in the normal review queue.";
        } catch {
          savedMessage = "Draft saved. The AI pre-check could not be saved, so this listing remains in the normal review queue.";
        }
      }
      setMessage(savedMessage);
      setFiles([]); setName(""); setDescription(""); setCategoryId(categories[0]?.id ?? ""); setSubcategoryId(""); setBrandId(""); setSleeveLength(""); setSelectedTagIds([]); setGender("unisex"); setColor("Default"); setPrice(""); setVariantLines("One size: 0"); setAnalysis(null);
      router.replace("/seller/quick-upload");
      router.refresh();
    } catch (cause) {
      if (!initialShared && uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      if (!initialShared && productId) await supabase.from("products").delete().eq("id", productId);
      setError(cause instanceof Error ? cause.message : "Could not save this product draft.");
    } finally { setBusy(false); }
  }

  const shownPreviews = initialShared ? initialShared.images : previews;
  return <div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold tracking-[.18em] text-[#8b5bc7]">QUICK INTAKE</p><h1 className="mt-2 text-4xl">Add product photos</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#625b68]">Group up to eight photos into one draft, review optional AI suggestions, then add price and stock. Nothing publishes until the marketplace reviews it.</p></div></div>
    {!categories.length && <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">The marketplace has not set up product categories yet. Contact the marketplace team before uploading.</p>}
    {initialShared?.caption && <p className="mt-6 rounded-xl bg-purple-50 p-4 text-sm leading-6 text-purple-950"><strong>Shared text:</strong> {initialShared.caption}</p>}
    {shownPreviews.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{shownPreviews.map((url, index) => <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl bg-[#f4eff9]"><img src={url} alt={`Product photo ${index + 1}`} className="h-full w-full object-cover"/><span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">Photo {index + 1}</span></div>)}</div> : <div className="mt-6 flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9cce7] bg-white px-5 text-center"><ImagePlus className="text-[#8b5bc7]" size={30}/><p className="mt-3 font-semibold">Choose multiple views of one item</p><p className="mt-1 text-sm text-[#817888]">JPG, PNG, WebP or phone photos · up to 8 images</p></div>}
    {!initialShared && <div className="mt-4 flex flex-wrap gap-3"><input ref={galleryInput} type="file" accept="image/*" multiple className="hidden" onChange={(event) => chooseFiles(event.currentTarget.files)}/><button type="button" disabled={busy || !categories.length} onClick={() => galleryInput.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-[#d9cce7] px-5 py-3 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-50"><ImagePlus size={17}/> Choose photos</button><button type="button" disabled={busy || !categories.length} onClick={() => { if (galleryInput.current) { galleryInput.current.accept = "image/*"; galleryInput.current.capture = "environment"; galleryInput.current.click(); } }} className="inline-flex items-center gap-2 rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115f] disabled:opacity-50"><Camera size={17}/> Take photo</button><button type="button" disabled={busy || (!files.length && !initialShared)} onClick={suggestDetails} className="inline-flex items-center gap-2 rounded-full border border-[#d9cce7] px-5 py-3 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-50"><Sparkles size={17}/> {busy ? "Working…" : "Suggest details with AI"}</button>{files.length > 0 && <button type="button" onClick={() => setFiles([])} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#625b68]"><X size={16}/> Clear photos</button>}</div>}
    {analysis && <div className={`mt-5 rounded-xl p-4 text-sm ${analysis.moderation_verdict === "likely_prohibited" ? "bg-red-50 text-red-900" : analysis.moderation_verdict === "needs_review" ? "bg-amber-50 text-amber-950" : "bg-emerald-50 text-emerald-900"}`}><p className="font-semibold">Automated pre-check: {analysis.moderation_verdict.replaceAll("_", " ")}</p><p className="mt-1 leading-6">{analysis.moderation_reason || "No concern detected by the automated check."} This is only a suggestion; a marketplace reviewer decides whether the listing can go live.</p><p className="mt-2 text-xs">Suggested department: {analysis.department} · visible colours: {analysis.colors.length ? analysis.colors.join(", ") : "not clear"}</p></div>}
    <form onSubmit={saveDraft} className="mt-7 grid gap-4 rounded-2xl border border-[#ece6f0] bg-white p-5 sm:grid-cols-2 sm:p-7"><label className="text-sm font-medium sm:col-span-2">Product name<input className={input} value={name} onChange={(event) => setName(event.target.value)} required maxLength={110} placeholder="e.g. Blue woven shoulder bag"/></label><label className="text-sm font-medium">Category<select className={input} value={categoryId} onChange={(event) => { setCategoryId(event.target.value); if (subcategories.find((item) => item.id === subcategoryId)?.category_id !== event.target.value) setSubcategoryId(""); }} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-sm font-medium">Gender / department<select className={input} value={gender} onChange={(event) => setGender(event.target.value)}>{[["women", "Women"], ["men", "Men"], ["unisex", "Unisex"], ["kids", "Kids"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-medium">Price (GHS)<input className={input} value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0.01" step="0.01" required/></label><label className="text-sm font-medium">Colors (comma-separated)<input className={input} value={color} onChange={(event) => setColor(event.target.value)} maxLength={120} placeholder="Blue, White"/></label><label className="text-sm font-medium sm:col-span-2">Sizes and stock<textarea className={input} value={variantLines} onChange={(event) => setVariantLines(event.target.value)} rows={2} placeholder="S:2, M:3, L:1 or One size: 4"/><span className="mt-1 block text-xs text-[#817888]">Each listed size is combined with each colour.</span></label><label className="text-sm font-medium sm:col-span-2">Description<textarea className={input} value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={800} placeholder="Describe what you can confirm about this item."/></label>
      <label className="text-sm font-medium">Subcategory<select className={input} value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">Select if available</option>{subcategories.filter((item) => item.category_id === categoryId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm font-medium">Brand<select className={input} value={brandId} onChange={(event) => setBrandId(event.target.value)}><option value="">No brand / not known</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><span className="mt-1 block text-xs text-[#817888]">AI never guesses a brand from a photo.</span></label><label className="text-sm font-medium">Sleeve length<select className={input} value={sleeveLength} onChange={(event) => setSleeveLength(event.target.value)}><option value="">Not applicable / unknown</option>{[["short", "Short"], ["long", "Long"], ["three_quarter", "Three-quarter"], ["sleeveless", "Sleeveless"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="sm:col-span-2"><p className="text-sm font-medium">Tags</p><div className="mt-2 flex flex-wrap gap-2">{tags.map((tag) => <label key={tag.id} className="inline-flex items-center gap-2 rounded-full border border-[#e6e0eb] px-3 py-2 text-xs"><input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={(event) => setSelectedTagIds((current) => event.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id))}/>{tag.name}</label>)}{!tags.length && <p className="text-xs text-[#817888]">The marketplace has not added tags yet.</p>}</div></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 sm:col-span-2">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:col-span-2">{message}</p>}<button disabled={busy || !categories.length} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#55239a] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#35115f] disabled:opacity-50 sm:col-span-2">{busy && <LoaderCircle size={16} className="animate-spin"/>}{busy ? "Saving draft…" : "Save draft for review"}</button>
    </form>
    {analysis && <p className="mt-3 text-xs leading-5 text-[#817888]">AI suggestions: category {analysis.category_suggestion || "not clear"}; subcategory {analysis.subcategory_suggestion || "not clear"}; sleeve length {analysis.sleeve_length.replaceAll("_", " ")}. The chosen values remain editable above.</p>}
    <p className="mt-3 text-xs leading-5 text-[#817888]">Android sellers can share photos from another app to Charwin Stores. iPhone does not support the Android share-to-app flow; use Choose photos or Take photo here.</p>
  </div>;
}
