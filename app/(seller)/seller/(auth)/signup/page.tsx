import type { Metadata } from "next";
import Link from "next/link";
import { SellerSignupForm } from "@/components/seller/auth-forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create a seller shop" };

export default async function SellerSignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  let prohibitedItems = ["Counterfeit goods sold as genuine brands", "Weapons", "Illegal drugs", "Stolen goods", "Adult explicit content", "Hazardous items", "Anything illegal in Ghana"];
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("site_settings").select("prohibited_items").eq("id", true).maybeSingle();
    if (data?.prohibited_items?.length) prohibitedItems = data.prohibited_items;
  } catch { /* Keep the standard policy list visible until the database is configured. */ }
  return <main className="min-h-screen bg-[#f7f4fa] px-5 py-12"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-7 shadow-[0_24px_80px_rgba(43,22,65,.12)] sm:p-12">
    <Link href="/" className="text-sm font-semibold tracking-[.18em] text-[#35115f]">CHARWIN STORES</Link><p className="mt-10 text-xs font-semibold tracking-[.2em] text-[#8b5bc7]">JOIN THE MARKETPLACE</p><h1 className="mt-3 text-4xl">Create your shop</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#625b68]">Register your business details and a public profile link for verification. Your shop and listings remain private until approved by the marketplace team.</p>
    {error === "shop" && <p role="status" className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Finish setting up your shop to use the seller studio.</p>}
    <SellerSignupForm prohibitedItems={prohibitedItems}/>
  </div></main>;
}
