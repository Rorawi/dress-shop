import Link from "next/link";
import { ArrowUpRight, Eye, Package, Plus, ShoppingBag, Tags } from "lucide-react";
import { requireShopAdmin } from "@/lib/supabase/admin";

export default async function AdminOverviewPage() {
  const { supabase, user } = await requireShopAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,is_published,is_hidden,created_at,product_variants(stock)")
    .order("created_at", { ascending: false });
  const products = data ?? [];
  const liveCount = products.filter((product) => product.is_published && !product.is_hidden).length;
  const soldOutCount = products.filter((product) => {
    const variants = product.product_variants ?? [];
    return variants.length > 0 && variants.every((variant) => Number(variant.stock) === 0);
  }).length;
  const draftCount = products.filter((product) => !product.is_published || product.is_hidden).length;
  const cards = [
    { label: "All products", value: products.length, icon: Package, note: "In your catalog" },
    { label: "On the storefront", value: liveCount, icon: Eye, note: "Published and visible" },
    { label: "Sold out", value: soldOutCount, icon: ShoppingBag, note: "Every size is out of stock" },
    { label: "Draft or hidden", value: draftCount, icon: Tags, note: "Only visible to you" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold tracking-[.18em] text-[#8b5bc7]">YOUR SHOP AT A GLANCE</p>
          <h1 className="mt-2 text-4xl">Good to see you.</h1>
          <p className="mt-2 text-sm text-[#625b68]">Signed in as {user.email}</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115f]"><Plus size={17} /> Add a product</Link>
      </div>

      {error && <div role="alert" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Catalog API connection failed.</strong> Confirm that <code>charwin_store</code> is exposed in Supabase Data API settings and the app is using that schema. <span className="mt-2 block text-xs">Supabase response: {error.message}</span></div>}

      <section aria-label="Catalog summary" className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, note }) => (
          <article key={label} className="rounded-2xl border border-[#ece6f0] bg-white p-5 shadow-[0_4px_18px_rgba(43,22,65,.035)]">
            <div className="flex items-center justify-between"><span className="text-sm text-[#625b68]">{label}</span><Icon size={19} className="text-[#8b5bc7]" strokeWidth={1.8} /></div>
            <p className="mt-5 text-4xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-[#817888]">{note}</p>
          </article>
        ))}
      </section>

      <section className="mt-9 overflow-hidden rounded-2xl border border-[#ece6f0] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee9f1] px-6 py-5">
          <div><h2 className="text-2xl">Recently added</h2><p className="mt-1 text-sm text-[#817888]">The latest pieces in your collection.</p></div>
          <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm font-semibold text-[#55239a] hover:underline">All products <ArrowUpRight size={16} /></Link>
        </div>
        {products.length === 0 ? (
          <div className="px-6 py-12 text-center"><p className="text-sm text-[#625b68]">Your collection is ready for its first piece.</p><Link href="/admin/products/new" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#55239a] hover:underline"><Plus size={16} /> Add a product</Link></div>
        ) : (
          <div className="divide-y divide-[#f0ecf2]">
            {products.slice(0, 6).map((product) => (
              <Link key={product.id} href={`/admin/products/${product.id}`} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#fcfaff]">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{product.name}</p><p className="mt-1 text-xs text-[#817888]">Added {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(product.created_at))}</p></div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${product.is_published && !product.is_hidden ? "bg-emerald-50 text-emerald-800" : "bg-[#f2eef5] text-[#625b68]"}`}>{product.is_hidden ? "Hidden" : product.is_published ? "Live" : "Draft"}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
