"use client";
/* eslint-disable @next/next/no-img-element -- Admin previews are already optimized WebP images or selected local files. */

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { optimizePhoto } from "@/lib/admin/image-utils";
import { toCatalogColorOption } from "@/lib/catalog-colors";
import type { AdminBrandOption, AdminCategoryOption, AdminSubcategoryOption, AdminTagOption, ProductEditorRecord } from "@/components/admin/types";

type Props = {
  categories: AdminCategoryOption[];
  subcategories: AdminSubcategoryOption[];
  brands: AdminBrandOption[];
  tags: AdminTagOption[];
  product?: ProductEditorRecord;
};
type NewPhoto = { key: string; file: File; preview: string };
type VariantDraft = { localId: string; size: string; color: string; stock: string };

const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] as const;
const SHOE_SIZES = ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"] as const;
const STANDARD_SIZES = [...CLOTHING_SIZES, ...SHOE_SIZES] as const;
type StandardSize = typeof STANDARD_SIZES[number];

function isStandardSize(size: string): size is StandardSize {
  return STANDARD_SIZES.some((availableSize) => availableSize === size);
}

function toSlug(value: string) {
  return value.normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const fieldClass = "mt-2 w-full rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8b5bc7] focus:ring-4 focus:ring-purple-100";
const labelClass = "block text-sm font-medium text-[#29232f]";

export default function ProductEditor({ categories, subcategories, brands, tags, product }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product?.slug));
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories.find((category) => category.is_active)?.id ?? categories[0]?.id ?? "");
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const isBagProduct = selectedCategory?.department === "bags";
  const isShoeProduct = selectedCategory?.department === "shoes";
  const availableSizes = isShoeProduct ? SHOE_SIZES : CLOTHING_SIZES;
  const availableSizeSet = new Set<string>(availableSizes);
  const [subcategoryId, setSubcategoryId] = useState(product?.subcategory_id ?? "");
  const [brandId, setBrandId] = useState(product?.brand_id ?? "");
  const [gender, setGender] = useState(product?.gender ?? "unisex");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compare_at_price ? String(product.compare_at_price) : "");
  const [style, setStyle] = useState(product?.style ?? "");
  const [sleeveLength, setSleeveLength] = useState(product?.sleeve_length ?? "");
  const [featured, setFeatured] = useState(product?.is_featured ?? false);
  const [discreetImage, setDiscreetImage] = useState(product?.discreet_image ?? false);
  const [hidden, setHidden] = useState(product?.is_hidden ?? false);
  const [variants, setVariants] = useState<VariantDraft[]>(() => (product?.variants ?? []).flatMap((variant, index) => {
    const size = variant.size.trim().toUpperCase();
    if (isBagProduct && size === "ONE SIZE") {
      return [{ localId: variant.id ?? `saved-${index}`, size: "One size", color: variant.color, stock: String(variant.stock) }];
    }
    return isStandardSize(size)
      ? [{ localId: variant.id ?? `saved-${index}`, size, color: variant.color, stock: String(variant.stock) }]
      : [];
  }));
  const hasLegacySizes = (product?.variants ?? []).some((variant) => !isStandardSize(variant.size.trim().toUpperCase()));
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(product?.tagIds ?? []);
  const [images, setImages] = useState(product?.images ?? []);
  const [photos, setPhotos] = useState<NewPhoto[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function changeCategory(nextCategoryId: string) {
    const nextCategory = categories.find((category) => category.id === nextCategoryId);
    if (nextCategory?.department !== selectedCategory?.department) {
      setVariants([]);
    }
    setCategoryId(nextCategoryId);
    if (subcategories.find((subcategory) => subcategory.id === subcategoryId)?.category_id !== nextCategoryId) setSubcategoryId("");
  }

  function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const selected = Array.from(files);
    if (images.length + photos.length + selected.length > 8) {
      setError("A product can have up to 8 photos.");
      return;
    }
    setPhotos((current) => [...current, ...selected.map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function toggleSize(size: string) {
    setVariants((current) => current.some((variant) => variant.size === size)
      ? current.filter((variant) => variant.size !== size)
      : [...current, { localId: crypto.randomUUID(), size, color: "Default", stock: "" }]);
  }

  function addColorOption(size: string) {
    setVariants((current) => [...current, { localId: crypto.randomUUID(), size, color: "", stock: "" }]);
  }

  function addBagColorOption() {
    setVariants((current) => [...current, { localId: crypto.randomUUID(), size: "One size", color: "", stock: "" }]);
  }

  function updateVariant(localId: string, key: "color" | "stock", value: string) {
    setVariants((current) => current.map((variant) => variant.localId === localId ? { ...variant, [key]: value } : variant));
  }

  async function saveProduct(publish: boolean) {
    setPending(true);
    setError("");
    setNotice("");
    const cleanName = name.trim();
    const cleanSlug = toSlug(slug || name);
    const amount = Number(price);
    const compareAmount = compareAtPrice ? Number(compareAtPrice) : null;
    if (!cleanName || !categoryId || !Number.isFinite(amount) || amount < 0 || !cleanSlug || (compareAmount !== null && (!Number.isFinite(compareAmount) || compareAmount < amount))) {
      setPending(false);
      setError("Add a product name, category, valid price, and a compare-at price that is at least the product price.");
      return;
    }
    const validVariants = variants.map((variant) => ({
        size: variant.size.trim().toUpperCase() === "ONE SIZE" ? "One size" : variant.size.trim().toUpperCase(),
        color: variant.color.trim(),
        stock: variant.stock.trim() === "" ? Number.NaN : Number(variant.stock),
      })).filter((variant) => !isBagProduct || variant.size === "One size");
    if (validVariants.length === 0) {
      setPending(false);
      setError(isBagProduct ? "Add at least one colour and stock count for this bag." : "Select at least one size and enter its stock count before saving.");
      return;
    }
    if (validVariants.some((variant) => (!isBagProduct && !availableSizeSet.has(variant.size)) || !variant.color || !Number.isInteger(variant.stock) || variant.stock < 0)) {
      setPending(false);
      setError("Add a colour and a whole-number stock count for every selected size option.");
      return;
    }
    const combinations = validVariants.map((variant) => `${variant.size}\u0000${variant.color.toLowerCase()}`);
    if (new Set(combinations).size !== combinations.length) {
      setPending(false);
      setError("Each size and colour combination must be unique.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPending(false); setError("Your admin session has expired. Sign in again to continue."); return; }

    const productValues = {
      name: cleanName,
      slug: cleanSlug,
      description: description.trim(),
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      brand_id: brandId || null,
      gender: gender || null,
      sleeve_length: sleeveLength.trim() || null,
      style: style.trim() || null,
      price: amount,
      compare_at_price: compareAmount,
      is_published: publish,
      is_hidden: hidden && !publish,
      is_featured: featured,
      discreet_image: discreetImage,
    };

    let productId = product?.id;
    let databaseError: string | null = null;
    if (productId) {
      const { error: updateError } = await supabase.from("products").update(productValues).eq("id", productId);
      databaseError = updateError?.message ?? null;
    } else {
      const { data: created, error: createError } = await supabase.from("products").insert(productValues).select("id").single();
      databaseError = createError?.message ?? null;
      productId = created?.id;
    }
    if (databaseError || !productId) { setPending(false); setError(databaseError || "Could not create the product."); return; }

    const { error: deleteVariantsError } = await supabase.from("product_variants").delete().eq("product_id", productId);
    if (deleteVariantsError) { setPending(false); setError(deleteVariantsError.message); return; }
    const { error: insertVariantsError } = await supabase.from("product_variants").insert(validVariants.map((variant) => ({ ...variant, product_id: productId })));
    if (insertVariantsError) { setPending(false); setError(insertVariantsError.message); return; }

    const { error: deleteTagLinksError } = await supabase.from("product_tags").delete().eq("product_id", productId);
    if (deleteTagLinksError) { setPending(false); setError(deleteTagLinksError.message); return; }
    if (selectedTagIds.length) {
      const { error: insertTagsError } = await supabase.from("product_tags").insert(selectedTagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));
      if (insertTagsError) { setPending(false); setError(insertTagsError.message); return; }
    }

    const retainedIds = new Set(images.map((image) => image.id));
    const removedImages = (product?.images ?? []).filter((image) => !retainedIds.has(image.id));
    if (removedImages.length) {
      const { error: removeRowsError } = await supabase.from("product_images").delete().in("id", removedImages.map((image) => image.id));
      if (removeRowsError) { setPending(false); setError(removeRowsError.message); return; }
      const paths = removedImages.flatMap((image) => image.storage_path ? [image.storage_path] : []);
      if (paths.length) await supabase.storage.from("product-images").remove(paths);
    }

    const imageRows = images.map((image, index) => ({
      product_id: productId,
      storage_path: image.storage_path,
      source_url: image.source_url,
      alt_text: image.alt_text || cleanName,
      position: index,
      is_primary: index === 0,
    }));
    if (imageRows.length) {
      const { error: positionError } = await Promise.all(imageRows.map((row, index) => {
        const image = images[index];
        return supabase.from("product_images").update({ position: row.position, is_primary: row.is_primary }).eq("id", image.id);
      })).then((results) => ({ error: results.find((result) => result.error)?.error ?? null }));
      if (positionError) { setPending(false); setError(positionError.message); return; }
    }

    for (const [index, photo] of photos.entries()) {
      try {
        const optimized = await optimizePhoto(photo.file);
        const path = `${user.id}/${productId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        const { error: rowError } = await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: cleanName, position: images.length + index, is_primary: images.length + index === 0 });
        if (rowError) {
          await supabase.storage.from("product-images").remove([path]);
          throw rowError;
        }
      } catch (uploadError) {
        setPending(false);
        setError(uploadError instanceof Error ? `Product saved, but a photo could not be added: ${uploadError.message}` : "Product saved, but a photo could not be added.");
        return;
      }
    }

    setNotice(publish ? "Product published." : "Draft saved.");
    setPending(false);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/products" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#625b68] hover:text-[#55239a]"><ArrowLeft size={16} /> Products</Link>
      <div className="mb-7"><p className="text-sm font-semibold tracking-[.18em] text-[#8b5bc7]">{product ? "EDIT THE DETAILS" : "ADD A NEW FIND"}</p><h1 className="mt-2 text-4xl">{product ? product.name : "New product"}</h1><p className="mt-2 text-sm text-[#625b68]">Add your details and photos here. Products stay as drafts until you publish them.</p></div>

      <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7">
            <h2 className="text-2xl">Product details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>Product name<input className={fieldClass} value={name} onChange={(event) => { setName(event.target.value); if (!slugEdited) setSlug(toSlug(event.target.value)); }} placeholder="e.g. Soft cotton boxer brief" /></label>
              <label className={`${labelClass} sm:col-span-2`}>URL slug<input className={fieldClass} value={slug} onChange={(event) => { setSlug(event.target.value); setSlugEdited(true); }} placeholder="product-name" /></label>
              <label className={`${labelClass} sm:col-span-2`}>Description<textarea className={`${fieldClass} min-h-28 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell shoppers what makes this piece special." /></label>
              <label className={labelClass}>Category<select className={fieldClass} value={categoryId} onChange={(event) => changeCategory(event.target.value)}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_active ? "" : " (inactive)"}</option>)}</select></label>
              <label className={labelClass}>Shop section<select className={fieldClass} value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">Choose a section</option>{subcategories.filter((subcategory) => subcategory.category_id === categoryId).map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}{subcategory.is_active ? "" : " (inactive)"}</option>)}</select></label>
              <label className={labelClass}>Brand<select className={fieldClass} value={brandId} onChange={(event) => setBrandId(event.target.value)}><option value="">No brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
              <label className={labelClass}>For<select className={fieldClass} value={gender ?? "unisex"} onChange={(event) => setGender(event.target.value as typeof gender)}><option value="unisex">Unisex</option><option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option></select></label>
              <label className={labelClass}>Style<input className={fieldClass} value={style ?? ""} onChange={(event) => setStyle(event.target.value)} placeholder="e.g. everyday, thrift find" /></label>
              <label className={labelClass}>Sleeve length<input className={fieldClass} value={sleeveLength ?? ""} onChange={(event) => setSleeveLength(event.target.value)} placeholder="e.g. short sleeve" /></label>
              <label className={labelClass}>Price (GHS)<input className={fieldClass} type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" /></label>
              <label className={labelClass}>Compare-at price (GHS)<input className={fieldClass} type="number" min="0" step="0.01" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} placeholder="Optional" /></label>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#eee9f1] pt-5">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="accent-[#55239a]" /> Add to Showroom edits</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={discreetImage} onChange={(event) => setDiscreetImage(event.target.checked)} className="accent-[#55239a]" /> Blur image until shopper confirms 18+</label>
              {product && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} className="accent-[#55239a]" /> Hide from storefront</label>}
            </div>
          </div>

          <div className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl">Photos</h2><p className="mt-1 text-sm text-[#817888]">Up to 8 photos. They’ll be resized and saved as WebP.</p></div><button type="button" onClick={() => fileInput.current?.click()} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#ded4e8] px-4 py-2.5 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc]"><ImagePlus size={17} /> Add photos</button></div>
            <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => addPhotos(event.target.files)} />
            {images.length + photos.length === 0 ? <button type="button" onClick={() => fileInput.current?.click()} className="mt-5 flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#ded4e8] bg-[#fcfaff] text-center hover:border-[#8b5bc7]"><ImagePlus className="mb-2 text-[#8b5bc7]" /><span className="text-sm font-semibold">Choose product photos</span><span className="mt-1 text-xs text-[#817888]">JPG, PNG, HEIC or WebP</span></button> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image) => { const url = image.source_url || (image.storage_path ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl : ""); return <div key={image.id} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f3eff5]"><img src={url} alt={image.alt_text || name} className="h-full w-full object-cover" /><button type="button" aria-label="Remove photo" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))} className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-[#625b68] shadow hover:text-[#b42318]"><X size={15} /></button>{image.position === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold">Cover</span>}</div>; })}{photos.map((photo) => <div key={photo.key} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f3eff5]"><img src={photo.preview} alt={photo.file.name} className="h-full w-full object-cover" /><button type="button" aria-label="Remove selected photo" onClick={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))} className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-[#625b68] shadow hover:text-[#b42318]"><X size={15} /></button>{images.length === 0 && photo.key === photos[0]?.key && <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold">Cover</span>}</div>)}</div>}
          </div>

          <div className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7">
            <div><h2 className="text-2xl">{isBagProduct ? "Colours and stock" : isShoeProduct ? "Shoe sizes and stock" : "Sizes and stock"}</h2><p className="mt-1 text-sm text-[#817888]">{isBagProduct ? "Bags don’t need size options. Add the colours you carry and stock for each one." : isShoeProduct ? "Select the UK shoe sizes you carry and enter the stock for each one." : "Select the sizes you carry. Shoppers can choose from these sizes on the product page."}</p><p className="mt-1 text-xs text-[#817888]">{isBagProduct ? "Customers will be able to choose a colour swatch." : "Enter the same colour name for each size in that colour; customers will see it as one selectable swatch."}</p></div>
            {isBagProduct ? <div className="mt-5 space-y-3">
              <button type="button" onClick={addBagColorOption} className="inline-flex items-center gap-1 text-xs font-semibold text-[#55239a] hover:underline"><Plus size={14} /> Add colour</button>
              {variants.filter((variant) => variant.size === "One size").map((variant) => <div key={variant.localId} className="grid grid-cols-[minmax(0,1fr)_100px_36px] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_140px_36px]">
                <label className={`${labelClass} text-xs`}>Colour<div className="mt-2 flex items-center gap-2"><span className="h-5 w-5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: toCatalogColorOption(variant.color).hex }} /><input className={`${fieldClass} mt-0`} value={variant.color} onChange={(event) => updateVariant(variant.localId, "color", event.target.value)} placeholder="Black, Lilac, or #55239A" /></div></label>
                <label className={`${labelClass} text-xs`}>Stock<input className={fieldClass} type="text" inputMode="numeric" pattern="[0-9]*" value={variant.stock} onChange={(event) => updateVariant(variant.localId, "stock", event.target.value)} placeholder="0" /></label>
                <button type="button" aria-label={`Remove ${variant.color || "colour"} option`} onClick={() => setVariants((current) => current.filter((item) => item.localId !== variant.localId))} className="mb-1 rounded-lg p-2 text-[#817888] hover:bg-red-50 hover:text-[#b42318]"><Trash2 size={16} /></button>
              </div>)}
              {variants.filter((variant) => variant.size === "One size").length === 0 && <p className="rounded-xl border border-dashed border-[#d9cce7] px-4 py-5 text-center text-sm text-[#817888]">Add at least one colour to enter its stock.</p>}
            </div> : <>
              {hasLegacySizes && <p className="mt-4 rounded-xl bg-[#f8f4fc] px-4 py-3 text-xs leading-5 text-[#625b68]">This product has an older size option that isn’t in the standard size list. Select the actual sizes and stock below; saving replaces the old option.</p>}
              <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
                {availableSizes.map((size) => {
                  const selected = variants.some((variant) => variant.size === size);
                  return <button key={size} type="button" aria-pressed={selected} onClick={() => toggleSize(size)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-100 ${selected ? "border-[#55239a] bg-[#f4eff9] text-[#55239a]" : "border-[#e6e0eb] bg-white text-[#625b68] hover:border-[#8b5bc7]"}`}>{size}</button>;
                })}
              </div>
              {variants.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[#d9cce7] px-4 py-5 text-center text-sm text-[#817888]">Choose at least one size above to add stock.</p> : <div className="mt-5 space-y-3">
                {availableSizes.filter((size) => variants.some((variant) => variant.size === size)).map((size) => {
                  const sizeVariants = variants.filter((variant) => variant.size === size);
                  return <div key={size} className="rounded-xl border border-[#eee9f1] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#29232f]">Size {size}</p><button type="button" onClick={() => addColorOption(size)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#55239a] hover:underline"><Plus size={14} /> Add colour</button></div>
                    <div className="space-y-3">{sizeVariants.map((variant) => <div key={variant.localId} className="grid grid-cols-[minmax(0,1fr)_100px_36px] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_140px_36px]">
                      <label className={`${labelClass} text-xs`}>Colour<div className="mt-2 flex items-center gap-2"><span className="h-5 w-5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: toCatalogColorOption(variant.color).hex }} /><input className={`${fieldClass} mt-0`} value={variant.color} onChange={(event) => updateVariant(variant.localId, "color", event.target.value)} placeholder="Black, Lilac, or #55239A" /></div></label>
                      <label className={`${labelClass} text-xs`}>Stock<input className={fieldClass} type="text" inputMode="numeric" pattern="[0-9]*" value={variant.stock} onChange={(event) => updateVariant(variant.localId, "stock", event.target.value)} placeholder="0" /></label>
                      <button type="button" aria-label={`Remove ${size} ${variant.color || "colour"} option`} onClick={() => setVariants((current) => current.filter((item) => item.localId !== variant.localId))} className="mb-1 rounded-lg p-2 text-[#817888] hover:bg-red-50 hover:text-[#b42318]"><Trash2 size={16} /></button>
                    </div>)}</div>
                  </div>;
                })}
              </div>}
            </>}
          </div>

          <div className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7"><h2 className="text-2xl">Tags</h2><p className="mt-1 text-sm text-[#817888]">Tags help shoppers find the right collection and seasonal edits.</p><div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => { const selected = selectedTagIds.includes(tag.id); return <button key={tag.id} type="button" aria-pressed={selected} onClick={() => setSelectedTagIds((current) => selected ? current.filter((id) => id !== tag.id) : [...current, tag.id])} className={`rounded-full border px-3.5 py-2 text-sm transition ${selected ? "border-[#55239a] bg-[#f4eff9] font-semibold text-[#55239a]" : "border-[#e6e0eb] text-[#625b68] hover:border-[#8b5bc7]"}`}>{tag.name}</button>; })}{tags.length === 0 && <p className="text-sm text-[#817888]">Create your first tags in <Link href="/admin/settings" className="font-semibold text-[#55239a] underline">Shop settings</Link>.</p>}</div></div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-[#ece6f0] bg-white p-5"><h2 className="text-xl">Ready to save?</h2><p className="mt-2 text-sm leading-6 text-[#817888]">Save a draft while you gather details, or publish when it’s ready for shoppers.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-800">{error}</p>}{notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">{notice}</p>}<button disabled={pending} type="button" onClick={() => saveProduct(false)} className="mt-5 w-full rounded-full border border-[#d9cce7] px-5 py-3 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-50">{pending ? <LoaderCircle size={16} className="mx-auto animate-spin" /> : "Save as draft"}</button><button disabled={pending} type="button" onClick={() => saveProduct(true)} className="mt-3 w-full rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115f] disabled:opacity-50">{pending ? <LoaderCircle size={16} className="mx-auto animate-spin" /> : product?.is_published ? "Save and publish" : "Publish product"}</button></div>
          <p className="px-2 text-xs leading-5 text-[#817888]">Photo uploads are resized to 1800px and converted to WebP in your browser before sending to Supabase Storage.</p>
        </aside>
      </div>
    </div>
  );
}
