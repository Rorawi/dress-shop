import Link from "next/link";
import { ClipboardCheck, Flag, Store } from "lucide-react";
import { requireShopAdmin } from "@/lib/supabase/admin";

export default async function MarketplaceAdminPage() {
  const { supabase } = await requireShopAdmin();
  const [shops, products, reports, orders, orderItems] = await Promise.all([
    supabase.from("shops").select("id,name,status,verification_status"),
    supabase.from("products").select("id,name,shop_id,moderation_status"),
    supabase.from("reports").select("id,status"),
    supabase.from("orders").select("id,shop_id,total,status"),
    supabase.from("order_items").select("product_id,shop_id,product_name,quantity"),
  ]);
  const items = [
    { href: "/admin/marketplace/shops", label: "Seller shops", count: shops.data?.filter((shop) => shop.verification_status === "pending").length ?? 0, note: "Pending verification", icon: Store },
    { href: "/admin/marketplace/review", label: "Product review queue", count: products.data?.filter((product) => product.moderation_status === "pending").length ?? 0, note: "Listings awaiting review", icon: ClipboardCheck },
    { href: "/admin/marketplace/reports", label: "Customer reports", count: reports.data?.filter((report) => report.status === "new").length ?? 0, note: "New reports", icon: Flag },
  ];
  const shopOrders = new Map<string, number>();
  for (const order of orders.data ?? []) shopOrders.set(order.shop_id, (shopOrders.get(order.shop_id) ?? 0) + 1);
  const topShops = [...(shops.data ?? [])].map((shop) => ({ name: shop.name, orders: shopOrders.get(shop.id) ?? 0 })).sort((a, b) => b.orders - a.orders).slice(0, 5);
  const topProductsMap = new Map<string, { name: string; quantity: number }>();
  for (const item of orderItems.data ?? []) {
    const key = item.product_id ?? item.product_name;
    const current = topProductsMap.get(key) ?? { name: item.product_name, quantity: 0 };
    current.quantity += item.quantity;
    topProductsMap.set(key, current);
  }
  const topProducts = [...topProductsMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold tracking-[.18em] text-[#8b5bc7]">MARKETPLACE OPERATIONS</p><h1 className="mt-2 text-4xl">Seller review</h1><p className="mt-2 text-sm text-[#625b68]">Verify shops, review listings, and respond to customer reports.</p><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      { label: "Shops", value: shops.data?.length ?? 0, note: (shops.data?.filter((shop) => shop.status === "active" && shop.verification_status === "approved").length ?? 0) + " active and verified" },
      { label: "Products", value: products.data?.length ?? 0, note: (products.data?.filter((product) => product.moderation_status === "approved").length ?? 0) + " approved" },
      { label: "Order requests", value: orders.data?.length ?? 0, note: "Logged across all shops" },
      { label: "Open reports", value: reports.data?.filter((report) => report.status === "new").length ?? 0, note: "Waiting for review" },
    ].map((metric) => <article key={metric.label} className="rounded-2xl border border-[#ece6f0] bg-white p-5"><p className="text-sm text-[#625b68]">{metric.label}</p><p className="mt-3 text-4xl font-semibold">{metric.value}</p><p className="mt-1 text-xs text-[#817888]">{metric.note}</p></article>)}</section><section className="mt-6 grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-[#ece6f0] bg-white p-6"><h2 className="text-xl font-semibold">Top shops by logged orders</h2>{topShops.length ? <ol className="mt-4 space-y-3">{topShops.map((shop, index) => <li key={shop.name} className="flex items-center justify-between gap-4 text-sm"><span>{index + 1}. {shop.name}</span><span className="font-semibold">{shop.orders} orders</span></li>)}</ol> : <p className="mt-4 text-sm text-[#817888]">Order counts will appear here.</p>}</article><article className="rounded-2xl border border-[#ece6f0] bg-white p-6"><h2 className="text-xl font-semibold">Top products by quantity ordered</h2>{topProducts.length ? <ol className="mt-4 space-y-3">{topProducts.map((product, index) => <li key={product.name + "-" + index} className="flex items-center justify-between gap-4 text-sm"><span className="truncate">{index + 1}. {product.name}</span><span className="shrink-0 font-semibold">{product.quantity} units</span></li>)}</ol> : <p className="mt-4 text-sm text-[#817888]">Product order counts will appear here.</p>}</article></section><section className="mt-8 grid gap-4 md:grid-cols-3">{items.map(({ href, label, count, note, icon: Icon }) => <Link key={href} href={href} className="rounded-2xl border border-[#ece6f0] bg-white p-6 transition hover:border-[#c6afd9]"><Icon className="text-[#8b5bc7]" size={22}/><h2 className="mt-5 text-xl font-semibold">{label}</h2><p className="mt-3 text-4xl font-semibold">{count}</p><p className="mt-1 text-xs text-[#817888]">{note}</p></Link>)}</section>
    <section className="mt-7 rounded-2xl border border-[#ece6f0] bg-white p-6"><h2 className="text-xl font-semibold">Review guidance</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#625b68]">AI checks provide a pre-check only. Product approvals, shop verification, suspensions and bans are recorded in the moderation log for admin review.</p><Link href="/admin/marketplace/settings" className="mt-4 inline-block text-sm font-semibold text-[#55239a] hover:underline">Manage moderation rules →</Link></section>
  </div>;
}
