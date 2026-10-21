"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, ImagePlus, LoaderCircle, MessageCircle, Sparkles, Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { optimizePhoto } from "@/lib/admin/image-utils";
import type { AdminCategoryOption, AdminSubcategoryOption } from "@/components/admin/types";

type SelectedPhoto = { key: string; file: File };
type ParsedMessage = { name: string; description: string; sizes: string[]; wholesalePrice: number | null; retailPrice: number | null };
type ImageAnalysis = { name: string; description: string; colors: string[]; department: string; gender: string };

const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const SHOE_SIZES = ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"];
const slugify = (text: string) => text.normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function readPrice(text: string): number | null {
  const match = text.match(/(?:GHS|GH\s*[¢₵]|[¢₵])\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:GHS|GH\s*[¢₵]|[¢₵])/i);
  if (!match) return null;
  const amount = Number((match[1] ?? match[2]).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function parseMessage(text: string): ParsedMessage {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sizes: string[] = [];
  const sizeLine = lines.find((line) => /(?:available\s+)?sizes?\s*[:\-]/i.test(line));
  if (sizeLine) {
    const value = sizeLine.replace(/^.*?(?:available\s+)?sizes?\s*[:\-]\s*/i, "").replace(/\bonly\b/gi, "");
    const matches = value.match(/UK\s*\d+|(?:[2-5]\s*XL|XS|S|M|L|XL)/gi) ?? [];
    for (const match of matches) {
      const normalized = /^UK/i.test(match) ? `UK ${match.replace(/\D/g, "")}` : match.replace(/\s+/g, "").toUpperCase();
      if (!sizes.includes(normalized)) sizes.push(normalized);
    }
  }

  const titleIndex = lines.findIndex((line) => !/(?:available\s+)?sizes?\s*[:\-]|wholesale|retail|selling\s+price|shop\s+price/i.test(line));
  const name = titleIndex >= 0 ? lines[titleIndex].replace(/\s+/g, " ").slice(0, 110) : "New shop find";
  const description = lines.filter((line, index) => index !== titleIndex && !/(?:available\s+)?sizes?\s*[:\-]|wholesale\s+price|retail\s+price|selling\s+price|shop\s+price/i.test(line)).join("\n");
  const wholesaleLine = lines.find((line) => /wholesale\s+price/i.test(line));
  const retailLine = lines.find((line) => /(?:retail|selling|shop)\s+price/i.test(line));

  return {
    name,
    description,
    sizes: sizes.filter((size) => [...CLOTHING_SIZES, ...SHOE_SIZES].includes(size)),
    wholesalePrice: wholesaleLine ? readPrice(wholesaleLine) : null,
    retailPrice: retailLine ? readPrice(retailLine) : null,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the optimized photo."));
    reader.onerror = () => reject(new Error("Could not read the optimized photo."));
    reader.readAsDataURL(blob);
  });
}

export default function WhatsAppImport({ categories, subcategories }: { categories: AdminCategoryOption[]; subcategories: AdminSubcategoryOption[] }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const parsed = useMemo(() => parseMessage(caption), [caption]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [gender, setGender] = useState<"women" | "men" | "unisex" | "kids" | null>("unisex");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  function updateCaption(value: string) {
    setCaption(value);
    const next = parseMessage(value);
    setName(next.name === "New shop find" ? "" : next.name);
    setDescription(next.description);
    setPrice(next.retailPrice === null ? "" : String(next.retailPrice));
  }

  function selectPhotos(list: FileList | null) {
    if (!list?.length) return;
    const selected = Array.from(list);
    if (photos.length + selected.length > 8) {
      setError("A product can have up to 8 photos.");
      return;
    }
    setError("");
    setPhotos((current) => [...current, ...selected.map((file) => ({ key: crypto.randomUUID(), file }))]);
    if (fileInput.current) fileInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
  }

  async function analyzePhoto() {
    if (!photos.length) { setAnalysisError("Choose at least one product photo first."); return; }
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisMessage("");
    try {
      const optimized = await optimizePhoto(photos[0].file);
      if (optimized.size > 2_800_000) throw new Error("This photo is still too large for analysis. Choose a smaller image.");
      const imageDataUrl = await blobToDataUrl(optimized);
      const response = await fetch("/api/admin/analyze-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, caption }),
      });
      const result = await response.json() as { analysis?: ImageAnalysis; error?: string };
      if (!response.ok || !result.analysis) throw new Error(result.error || "Could not analyze this product photo.");

      const suggestion = result.analysis;
      if (suggestion.name) setName(suggestion.name);
      if (suggestion.description) setDescription(suggestion.description);
      setColorsText(suggestion.colors.join(", "));
      if (["women", "men", "unisex", "kids"].includes(suggestion.gender)) setGender(suggestion.gender as "women" | "men" | "unisex" | "kids");
      const suggestedCategory = categories.find((category) => category.department === suggestion.department);
      if (suggestedCategory) {
        setCategoryId(suggestedCategory.id);
        setSubcategoryId("");
      }
      setAnalysisMessage("Photo suggestions filled in. Check the details and correct anything the AI got wrong.");
    } catch (caught) {
      setAnalysisError(caught instanceof Error ? caught.message : "Could not analyze this product photo.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function importDraft() {
    const cleanName = name.trim();
    const amount = price.trim() === "" ? 0 : Number(price);
    if (!photos.length) { setError("Add at least one product photo."); return; }
    if (!cleanName || !categoryId || !Number.isFinite(amount) || amount < 0) { setError("Add a product name, category, and a valid storefront price. Leave the price empty if you still need to decide it."); return; }

    setPending(true);
    setError("");
    setNotice("");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setPending(false);
      setError("Your admin session has expired. Sign in again to import this product.");
      return;
    }

    let productId: string | null = null;
    const uploadedPaths: string[] = [];
    try {
      const idSuffix = crypto.randomUUID().slice(0, 8);
      const { data: created, error: createError } = await supabase.from("products").insert({
        name: cleanName,
        slug: `${slugify(cleanName) || "new-shop-find"}-${idSuffix}`,
        description: description.trim(),
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        gender,
        price: amount,
        is_published: false,
      }).select("id").single();
      if (createError || !created) throw createError ?? new Error("Could not create the product draft.");
      productId = created.id;

      const imageRows = [];
      for (const [index, photo] of photos.entries()) {
        setProgress(`Optimizing and uploading photo ${index + 1} of ${photos.length}…`);
        const optimized = await optimizePhoto(photo.file);
        const path = `${user.id}/${productId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        imageRows.push({ product_id: productId, storage_path: path, alt_text: cleanName, position: index, is_primary: index === 0 });
      }
      const { error: imageError } = await supabase.from("product_images").insert(imageRows);
      if (imageError) throw imageError;

      const sizesToAdd = selectedCategory?.department === "bags" ? ["One size"] : parsed.sizes;
      const colorsToAdd = colorsText.split(",").map((color) => color.trim()).filter(Boolean);
      if (sizesToAdd.length) {
        setProgress("Adding detected sizes to the draft…");
        const variants = sizesToAdd.flatMap((size) => (colorsToAdd.length ? colorsToAdd : ["Default"]).map((color) => ({ product_id: productId, size, color, stock: 0 })));
        const { error: variantError } = await supabase.from("product_variants").insert(variants);
        if (variantError) throw variantError;
      }

      setNotice("Draft created. Review the colour and enter stock for each size before publishing.");
      router.push(`/admin/products/${productId}`);
      router.refresh();
    } catch (caught) {
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      if (productId) await supabase.from("products").delete().eq("id", productId);
      setError(caught instanceof Error ? caught.message : "Could not import this draft.");
    } finally {
      setPending(false);
      setProgress("");
    }
  }

  return <section className="mt-8 rounded-2xl border border-[#e9e1f0] bg-white p-5 sm:p-7">
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4eafb] text-[#55239a]"><MessageCircle size={20} /></span>
      <div><p className="text-xs font-semibold tracking-[.16em] text-[#8b5bc7]">WHATSAPP INTAKE</p><h2 className="mt-1 text-2xl">Turn a message into a product draft</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#817888]">On your phone, choose the photos and paste the WhatsApp caption here. We’ll pick out the name and sizes, then let you review everything before it can appear in the shop.</p></div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <label className="block text-sm font-semibold text-[#29232f]">WhatsApp product message<textarea value={caption} onChange={(event) => updateCaption(event.target.value)} rows={8} placeholder={'ORIGINAL DESIGN HOODIES\nAVAILABLE SIZES: L, XL, 2XL, 3XL ONLY\nWHOLESALE PRICE: GH₵100\nLimited quantity'} className="mt-2 w-full rounded-xl border border-[#e6e0eb] px-4 py-3 text-sm leading-6 outline-none focus:border-[#8b5bc7] focus:ring-4 focus:ring-purple-100" /></label>
        <p className="mt-2 flex items-center gap-2 text-xs text-[#817888]"><FileText size={14} />Caption parsing stays local. AI photo analysis sends the first selected photo and caption to your configured provider.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={pending || photos.length >= 8} onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-[#d9cce7] px-4 py-2.5 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-50"><ImagePlus size={16} /> Choose photos</button>
          <button type="button" disabled={pending || photos.length >= 8} onClick={() => cameraInput.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-[#d9cce7] px-4 py-2.5 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-50"><Upload size={16} /> Take a photo</button>
          <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => selectPhotos(event.target.files)} />
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => selectPhotos(event.target.files)} />
        </div>
        {photos.length > 0 && <ul className="mt-3 space-y-1 text-xs text-[#625b68]">{photos.map((photo, index) => <li key={photo.key} className="flex items-center justify-between gap-3 rounded-lg bg-[#faf8fc] px-3 py-2"><span className="truncate">{index + 1}. {photo.file.name}</span><button type="button" onClick={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))} className="shrink-0 font-semibold text-[#55239a] hover:underline">Remove</button></li>)}</ul>}
        <button type="button" disabled={analyzing || pending || photos.length === 0} onClick={analyzePhoto} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f4eafb] px-4 py-2.5 text-sm font-semibold text-[#55239a] hover:bg-[#eadcf7] disabled:cursor-not-allowed disabled:opacity-50">{analyzing ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}{analyzing ? "Analyzing photo…" : "Suggest details with AI"}</button>
        {analysisMessage && <p role="status" className="mt-3 text-xs leading-5 text-emerald-800">{analysisMessage}</p>}
        {analysisError && <p role="alert" className="mt-3 text-xs leading-5 text-red-800">{analysisError}</p>}
      </div>

      <div className="rounded-xl bg-[#faf8fc] p-4 sm:p-5">
        <h3 className="font-semibold text-[#29232f]">Review listing details</h3>
        <label className="mt-4 block text-sm font-medium">Product name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={110} className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b5bc7]" /></label>
        <label className="mt-3 block text-sm font-medium">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b5bc7]" /></label>
        <label className="mt-3 block text-sm font-medium">Department category<select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }} className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="mt-3 block text-sm font-medium">Shop section (optional)<select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm"><option value="">Choose a section</option>{subcategories.filter((subcategory) => subcategory.category_id === categoryId).map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></label>
        <label className="mt-3 block text-sm font-medium">Fit<select value={gender ?? "unknown"} onChange={(event) => setGender(event.target.value === "unknown" ? null : event.target.value as "women" | "men" | "unisex" | "kids")} className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm"><option value="unisex">Unisex</option><option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option><option value="unknown">Not specified</option></select></label>
        <label className="mt-3 block text-sm font-medium">Detected colour options<input value={colorsText} onChange={(event) => setColorsText(event.target.value)} placeholder="e.g. Cream, Navy" className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b5bc7]" /><span className="mt-1 block text-xs font-normal text-[#817888]">{selectedCategory?.department === "bags" || parsed.sizes.length > 0 ? "Colours become selectable options with zero stock until you update them." : "Add explicit sizes in the caption for colours to be attached to those options; otherwise set sizes and colours in the editor."}</span></label>
        <label className="mt-3 block text-sm font-medium">Storefront price (GHS)<input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Enter the retail price" className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b5bc7]" /></label>
        {price.trim() === "" && <p className="mt-2 text-xs leading-5 text-amber-900">No retail price was detected. The draft will have a GHS 0 placeholder; set the customer price in the editor before publishing.</p>}
        {parsed.sizes.length > 0 && <div className="mt-4"><p className="text-sm font-medium">Detected sizes</p><div className="mt-2 flex flex-wrap gap-2">{parsed.sizes.map((size) => <span key={size} className="rounded-lg border border-[#d9cce7] bg-white px-3 py-1.5 text-xs font-semibold text-[#55239a]">{size}</span>)}</div><p className="mt-2 text-xs leading-5 text-[#817888]">They’ll be added with zero stock and any listed colours. Confirm options and stock in the editor before publishing.</p></div>}
        {parsed.wholesalePrice !== null && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950"><strong>Wholesale price detected: GH₵{parsed.wholesalePrice.toFixed(2)}.</strong> It won’t be copied to the storefront price or saved; this catalog has no private cost field.</p>}
        {parsed.retailPrice !== null && <p className="mt-2 text-xs text-emerald-800">Retail price label found and filled in above. Confirm it before importing.</p>}
      </div>
    </div>

    {categories.length === 0 && <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">Add a category in <Link href="/admin/settings" className="font-semibold underline">Shop settings</Link> first.</p>}
    {pending && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-[#f8f4fc] px-4 py-3 text-sm text-[#55239a]"><LoaderCircle size={17} className="animate-spin" />{progress || "Preparing draft…"}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check size={16} />{notice}</p>}
    <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={importDraft} disabled={pending || categories.length === 0} className="rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115f] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Importing…" : "Create unpublished draft"}</button><span className="text-xs text-[#817888]">Nothing goes live until you finish stock and publish it.</span></div>
  </section>;
}
