import type { Metadata } from "next";
import Link from "next/link";
import { SellerLoginForm } from "@/components/seller/auth-forms";

export const metadata: Metadata = { title: "Seller sign in" };

export default async function SellerLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams;
  const message = error === "setup" ? "Seller access is not available yet. Check that the marketplace migration has been applied." : error === "unauthorized" ? "Sign in to manage your shop." : error === "shop" ? "This account does not have a registered shop yet." : undefined;
  return <main className="min-h-screen bg-[#f7f4fa] px-5 py-12"><div className="mx-auto grid min-h-[75vh] max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(43,22,65,.12)] md:grid-cols-2">
    <div className="flex flex-col justify-between bg-[#35115f] p-9 text-white sm:p-12"><Link href="/" className="text-sm font-semibold tracking-[.18em]">CHARWIN STORES</Link><div className="my-16"><p className="mb-4 text-xs font-semibold tracking-[.22em] text-purple-200">SELLER STUDIO</p><h1 className="max-w-sm text-4xl leading-tight sm:text-5xl">Your shop, in your hands.</h1><p className="mt-5 max-w-sm leading-7 text-purple-100/80">Add your finds, watch orders, and build a shop customers can trust.</p></div><p className="text-xs text-purple-200/70">Seller accounts are reviewed before shops go live.</p></div>
    <div className="p-8 sm:p-12"><p className="text-sm font-semibold tracking-[.2em] text-[#8b5bc7]">WELCOME BACK</p><h2 className="mt-3 text-3xl">Seller sign in</h2><p className="mt-3 text-sm leading-6 text-[#625b68]">Use the email and password you registered with.</p>{message && <p role="status" className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>}<SellerLoginForm notice={notice}/><p className="mt-8 text-center text-xs text-[#817888]">Marketplace admin? <Link href="/admin/login" className="font-semibold text-[#55239a] hover:underline">Admin sign in</Link></p></div>
  </div></main>;
}
