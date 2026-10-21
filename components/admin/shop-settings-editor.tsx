"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buildWhatsAppUrl, isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import type { AdminCategoryOption, AdminSubcategoryOption, AdminTagOption } from "@/components/admin/types";

type Props = {
  initialSettings: { shop_name: string; whatsapp_number: string; currency: string; announcement_banner: string; featured_season_tag_id: string | null };
  categories: AdminCategoryOption[];
  subcategories: AdminSubcategoryOption[];
  tags: (AdminTagOption & { sort_order: number })[];
};

const inputClass = "mt-2 w-full rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5bc7] focus:ring-4 focus:ring-purple-100";
const slugify = (text: string) => text.normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function ShopSettingsEditor({ initialSettings, categories: initialCategories, subcategories: initialSubcategories, tags: initialTags }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [shopName, setShopName] = useState(initialSettings.shop_name || "Charwin Stores");
  const [whatsapp, setWhatsapp] = useState(normalizeWhatsAppNumber(initialSettings.whatsapp_number));
  const [currency, setCurrency] = useState(initialSettings.currency || "GHS");
  const [announcement, setAnnouncement] = useState(initialSettings.announcement_banner || "");
  const [seasonTag, setSeasonTag] = useState(initialSettings.featured_season_tag_id || "");
  const [categories, setCategories] = useState(initialCategories);
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [tags, setTags] = useState(initialTags);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState(initialCategories[0]?.id ?? "");
  const [department, setDepartment] = useState<"clothing" | "underwear">("clothing");
  const [tagName, setTagName] = useState("");
  const [tagKind, setTagKind] = useState<AdminTagOption["kind"]>("general");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const testWhatsAppUrl = buildWhatsAppUrl(whatsapp, `Hello ${shopName.trim() || "Charwin Stores"}, I’m testing the WhatsApp chat link.`);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const phone = normalizeWhatsAppNumber(whatsapp);
    if (whatsapp.trim() && !isValidWhatsAppNumber(phone)) {
      setBusy(false);
      return setError("Enter a valid WhatsApp number with its country code, between 8 and 15 digits. For Ghana, use +233 followed by the number.");
    }
    const { error: saveError } = await supabase.from("site_settings").upsert({
      id: true,
      shop_name: shopName.trim() || "Charwin Stores",
      whatsapp_number: phone || null,
      currency: currency.trim().toUpperCase().slice(0, 3) || "GHS",
      announcement_banner: announcement.trim() || null,
      featured_season_tag_id: seasonTag || null,
    });
    setBusy(false);
    if (saveError) return setError(saveError.message);
    setWhatsapp(phone);
    setMessage("Shop settings saved.");
    router.refresh();
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setBusy(true); setError(""); setMessage("");
    const { data, error: createError } = await supabase.from("categories").insert({ name: categoryName.trim(), slug: slugify(categoryName), department, sort_order: categories.length, is_active: true }).select("id,name,department,sort_order,is_active").single();
    setBusy(false);
    if (createError) return setError(createError.message);
    setCategories((current) => [...current, data]);
    setCategoryName("");
    setMessage("Category added.");
    router.refresh();
  }

  async function toggleCategory(category: AdminCategoryOption) {
    setBusy(true); setError(""); setMessage("");
    const { error: updateError } = await supabase.from("categories").update({ is_active: !category.is_active }).eq("id", category.id);
    setBusy(false);
    if (updateError) return setError(updateError.message);
    setCategories((current) => current.map((item) => item.id === category.id ? { ...item, is_active: !item.is_active } : item));
    setMessage("Category updated.");
    router.refresh();
  }

  async function addSubcategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subcategoryName.trim() || !subcategoryCategoryId) return;
    setBusy(true); setError(""); setMessage("");
    const sortOrder = subcategories.filter((item) => item.category_id === subcategoryCategoryId).length;
    const { data, error: createError } = await supabase.from("subcategories").insert({ name: subcategoryName.trim(), slug: slugify(subcategoryName), category_id: subcategoryCategoryId, sort_order: sortOrder, is_active: true }).select("id,name,slug,category_id,sort_order,is_active").single();
    setBusy(false);
    if (createError) return setError(createError.message);
    const categoryName = categories.find((category) => category.id === subcategoryCategoryId)?.name ?? "Category";
    setSubcategories((current) => [...current, { ...data, categoryName }]);
    setSubcategoryName("");
    setMessage("Shop section added.");
    router.refresh();
  }

  async function toggleSubcategory(subcategory: AdminSubcategoryOption) {
    setBusy(true); setError(""); setMessage("");
    const { error: updateError } = await supabase.from("subcategories").update({ is_active: !subcategory.is_active }).eq("id", subcategory.id);
    setBusy(false);
    if (updateError) return setError(updateError.message);
    setSubcategories((current) => current.map((item) => item.id === subcategory.id ? { ...item, is_active: !item.is_active } : item));
    setMessage("Shop section updated.");
    router.refresh();
  }

  async function moveSubcategory(subcategory: AdminSubcategoryOption, direction: -1 | 1) {
    const siblings = subcategories.filter((item) => item.category_id === subcategory.category_id).sort((left, right) => left.sort_order - right.sort_order);
    const index = siblings.findIndex((item) => item.id === subcategory.id);
    const target = siblings[index + direction];
    if (!target) return;
    setBusy(true); setError(""); setMessage("");
    const [first, second] = await Promise.all([
      supabase.from("subcategories").update({ sort_order: target.sort_order }).eq("id", subcategory.id),
      supabase.from("subcategories").update({ sort_order: subcategory.sort_order }).eq("id", target.id),
    ]);
    setBusy(false);
    if (first.error || second.error) return setError(first.error?.message ?? second.error?.message ?? "Could not change the order.");
    setSubcategories((current) => current.map((item) => item.id === subcategory.id ? { ...item, sort_order: target.sort_order } : item.id === target.id ? { ...item, sort_order: subcategory.sort_order } : item));
    router.refresh();
  }

  async function addTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tagName.trim()) return;
    setBusy(true); setError(""); setMessage("");
    const { data, error: createError } = await supabase.from("tags").insert({ name: tagName.trim(), slug: slugify(tagName), kind: tagKind, sort_order: tags.length }).select("id,name,slug,kind,sort_order").single();
    setBusy(false);
    if (createError) return setError(createError.message);
    setTags((current) => [...current, data]);
    setTagName("");
    setMessage("Tag added.");
    router.refresh();
  }

  async function removeTag(tag: AdminTagOption) {
    if (!window.confirm(`Remove the “${tag.name}” tag from the shop?`)) return;
    setBusy(true); setError(""); setMessage("");
    const { error: deleteError } = await supabase.from("tags").delete().eq("id", tag.id);
    setBusy(false);
    if (deleteError) return setError(deleteError.message);
    setTags((current) => current.filter((item) => item.id !== tag.id));
    if (seasonTag === tag.id) setSeasonTag("");
    setMessage("Tag removed.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      <section className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7">
        <div><h2 className="text-2xl">Storefront settings</h2><p className="mt-1 text-sm text-[#817888]">These details appear across your public store.</p></div>
        <form onSubmit={saveSettings} className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">Shop name<input className={inputClass} value={shopName} onChange={(event) => setShopName(event.target.value)} /></label>
          <label className="block text-sm font-medium">WhatsApp number<input className={inputClass} type="tel" inputMode="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+233 24 123 4567" /><span className="mt-1 block text-xs font-normal text-[#817888]">Use an international number. Ghana local numbers beginning with 0 are converted automatically.</span>{testWhatsAppUrl ? <a href={testWhatsAppUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[#55239a] underline underline-offset-2">Test this WhatsApp number</a> : <span className="mt-2 block text-xs text-[#817888]">Enter a valid number to enable a test chat.</span>}</label>
          <label className="block text-sm font-medium">Currency<input className={inputClass} maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value)} /></label>
          <label className="block text-sm font-medium">Seasonal collection<select className={inputClass} value={seasonTag} onChange={(event) => setSeasonTag(event.target.value)}><option value="">No featured season</option>{tags.filter((tag) => tag.kind === "seasonal").map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
          <label className="block text-sm font-medium sm:col-span-2">Announcement banner<input className={inputClass} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="A short note for the homepage" /></label>
          <div className="sm:col-span-2"><button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115f] disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : null}Save storefront settings</button></div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7">
        <div><h2 className="text-2xl">Categories</h2><p className="mt-1 text-sm text-[#817888]">Build your shop navigation: boxers, singlets, plain T-shirts, thrift finds and two-piece sets.</p></div>
        <form onSubmit={addCategory} className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <label className="sr-only" htmlFor="new-category">Category name</label><input id="new-category" className="rounded-xl border border-[#e6e0eb] px-4 py-3 text-sm outline-none focus:border-[#8b5bc7]" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category name" />
          <label className="sr-only" htmlFor="category-department">Department</label><select id="category-department" className="rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm" value={department} onChange={(event) => setDepartment(event.target.value as typeof department)}><option value="clothing">Clothing</option><option value="underwear">Underwear</option></select>
          <button disabled={busy || !categoryName.trim()} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cce7] px-5 py-3 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-40"><Plus size={16} /> Add category</button>
        </form>
        <div className="mt-5 divide-y divide-[#f0ecf2]">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{category.name}</p><p className="mt-1 text-xs text-[#817888]">{category.department === "underwear" ? "Underwear" : "Clothing"}</p></div><button disabled={busy} onClick={() => toggleCategory(category)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${category.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{category.is_active ? "Active" : "Inactive"}</button></div>)}{categories.length === 0 && <p className="py-5 text-sm text-[#817888]">No categories yet. Create one above.</p>}</div>
      </section>

      <section className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7">
        <div><h2 className="text-2xl">Shop sections</h2><p className="mt-1 text-sm text-[#817888]">These are the sections customers browse. Add Boxers, Singlets, T-shirts, and Matching sets, then arrange their order.</p></div>
        <form onSubmit={addSubcategory} className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <label className="sr-only" htmlFor="new-subcategory">Section name</label><input id="new-subcategory" className="rounded-xl border border-[#e6e0eb] px-4 py-3 text-sm outline-none focus:border-[#8b5bc7]" value={subcategoryName} onChange={(event) => setSubcategoryName(event.target.value)} placeholder="New shop section" />
          <label className="sr-only" htmlFor="subcategory-category">Category group</label><select id="subcategory-category" className="rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm" value={subcategoryCategoryId} onChange={(event) => setSubcategoryCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <button disabled={busy || !subcategoryName.trim() || categories.length === 0} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cce7] px-5 py-3 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-40"><Plus size={16} /> Add section</button>
        </form>
        <div className="mt-5 divide-y divide-[#f0ecf2]">{categories.map((category) => {
          const rows = subcategories.filter((item) => item.category_id === category.id).sort((left, right) => left.sort_order - right.sort_order);
          if (!rows.length) return null;
          return <div key={category.id} className="py-3"><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#817888]">{category.name}</p><div className="space-y-1">{rows.map((subcategory, index) => <div key={subcategory.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#fcfaff]"><div className="flex-1"><p className="text-sm font-medium">{subcategory.name}</p></div><div className="flex items-center"><button type="button" disabled={busy || index === 0} onClick={() => moveSubcategory(subcategory, -1)} aria-label={`Move ${subcategory.name} up`} className="rounded p-1.5 text-[#817888] hover:bg-[#f4eff9] hover:text-[#55239a] disabled:opacity-30"><ChevronUp size={16} /></button><button type="button" disabled={busy || index === rows.length - 1} onClick={() => moveSubcategory(subcategory, 1)} aria-label={`Move ${subcategory.name} down`} className="rounded p-1.5 text-[#817888] hover:bg-[#f4eff9] hover:text-[#55239a] disabled:opacity-30"><ChevronDown size={16} /></button></div><button type="button" disabled={busy} onClick={() => toggleSubcategory(subcategory)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${subcategory.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{subcategory.is_active ? "Active" : "Inactive"}</button></div>)}</div></div>;
        })}{subcategories.length === 0 && <p className="py-5 text-sm text-[#817888]">No shop sections yet. Add your first one above.</p>}</div>
      </section>

      <section className="rounded-2xl border border-[#ece6f0] bg-white p-5 sm:p-7">
        <div><h2 className="text-2xl">Tags and collections</h2><p className="mt-1 text-sm text-[#817888]">Use these for thrift collections, edits, and seasonal promotions.</p></div>
        <form onSubmit={addTag} className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <label className="sr-only" htmlFor="new-tag">Tag name</label><input id="new-tag" className="rounded-xl border border-[#e6e0eb] px-4 py-3 text-sm outline-none focus:border-[#8b5bc7]" value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="New collection or tag" />
          <label className="sr-only" htmlFor="tag-kind">Tag type</label><select id="tag-kind" className="rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm" value={tagKind} onChange={(event) => setTagKind(event.target.value as typeof tagKind)}><option value="general">General</option><option value="collection">Collection</option><option value="seasonal">Seasonal</option></select>
          <button disabled={busy || !tagName.trim()} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cce7] px-5 py-3 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-40"><Plus size={16} /> Add tag</button>
        </form>
        <div className="mt-5 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag.id} className="inline-flex items-center gap-2 rounded-full border border-[#e6e0eb] bg-[#fcfbfd] py-1 pl-3.5 pr-1.5 text-sm"><span>{tag.name}</span><span className="text-xs text-[#817888]">{tag.kind}</span><button title={`Remove ${tag.name}`} disabled={busy} onClick={() => removeTag(tag)} className="rounded-full p-1.5 text-[#817888] hover:bg-red-50 hover:text-[#b42318]"><Trash2 size={14} /></button></span>)}{tags.length === 0 && <p className="text-sm text-[#817888]">No tags yet. Create your first collection above.</p>}</div>
      </section>
    </div>
  );
}
