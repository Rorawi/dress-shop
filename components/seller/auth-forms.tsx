"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginSeller, registerSeller, type SellerAuthState } from "@/app/(seller)/seller/actions";

const field = "mt-2 w-full rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5bc7] focus:ring-4 focus:ring-purple-100";
const initial: SellerAuthState = {};

export function SellerLoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginSeller, initial);
  return <form action={action} className="mt-7 space-y-5">
    {notice === "check-email" && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Your shop is registered. Check your email to verify your sign-in, then return here.</p>}
    <label className="block text-sm font-medium">Email<input className={field} type="email" name="email" autoComplete="username" required/></label>
    <label className="block text-sm font-medium">Password<input className={field} type="password" name="password" autoComplete="current-password" required/></label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
    <button disabled={pending} className="w-full rounded-full bg-[#55239a] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#35115f] disabled:opacity-50">{pending ? "Signing in…" : "Sign in to your shop"}</button>
    <p className="text-center text-sm text-[#625b68]">New seller? <Link href="/seller/signup" className="font-semibold text-[#55239a] hover:underline">Create a shop</Link></p>
  </form>;
}

export function SellerSignupForm({ prohibitedItems }: { prohibitedItems: string[] }) {
  const [state, action, pending] = useActionState(registerSeller, initial);
  return <form action={action} className="mt-7 grid gap-4 sm:grid-cols-2">
    <label className="block text-sm font-medium">Shop name<input className={field} name="shop_name" required maxLength={180}/></label>
    <label className="block text-sm font-medium">Your name<input className={field} name="owner_name" required maxLength={180} autoComplete="name"/></label>
    <label className="block text-sm font-medium">Email<input className={field} type="email" name="email" required autoComplete="email"/></label>
    <label className="block text-sm font-medium">Your phone number<input className={field} name="phone" required inputMode="tel" placeholder="233…" maxLength={30}/></label>
    <label className="block text-sm font-medium">Shop WhatsApp number<input className={field} name="whatsapp_number" required inputMode="tel" placeholder="233…" maxLength={15}/></label>
    <label className="block text-sm font-medium">Shop location<input className={field} name="location" required placeholder="Accra, Ghana" maxLength={120}/></label>
    <label className="block text-sm font-medium">Verification link (required)<input className={field} type="url" name="verification_social_url" placeholder="https://instagram.com/yourshop" required/><span className="mt-1 block text-xs text-[#817888]">Share an established social account or website. You can provide an ID document to the marketplace team separately.</span></label>
    <div className="rounded-xl bg-[#fcfbfd] p-4 sm:col-span-2"><p className="text-sm font-semibold">Customer payment options</p><p className="mt-1 text-xs text-[#817888]">You can change these later in your shop profile. Charwin Stores does not collect customer payments.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs font-medium">MoMo number<input className={field} name="momo_number" inputMode="numeric" placeholder="233…" maxLength={15}/></label><label className="text-xs font-medium">Network<select className={field} name="momo_network" defaultValue=""><option value="">Select</option>{["MTN", "Telecel", "AirtelTigo"].map((network) => <option key={network}>{network}</option>)}</select></label><label className="text-xs font-medium">MoMo account name<input className={field} name="momo_account_name" maxLength={100}/></label></div><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" name="accepts_cash_on_delivery" defaultChecked/>Accept cash on delivery</label></div>
    <label className="block text-sm font-medium sm:col-span-2">Password<input className={field} type="password" name="password" minLength={10} autoComplete="new-password" required/><span className="mt-1 block text-xs text-[#817888]">Use at least 10 characters.</span></label>
    <div className="rounded-xl border border-[#ece6f0] bg-[#fcfbfd] p-4 text-sm leading-6 text-[#625b68] sm:col-span-2"><h2 className="font-semibold text-[#17141c]">Prohibited items</h2><ul className="mt-2 list-disc space-y-1 pl-5">{prohibitedItems.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-3">Orders and payments are arranged directly between you and each customer. Charwin Stores does not collect customer money.</p><Link href="/seller/terms" className="mt-3 inline-block font-semibold text-[#55239a] underline">Read the seller agreement</Link></div>
    <label className="flex items-start gap-3 text-sm leading-6 text-[#625b68] sm:col-span-2"><input className="mt-1" type="checkbox" name="accept_terms" required/><span>I have read and accept the <Link href="/seller/terms" className="font-semibold text-[#55239a] underline">seller agreement</Link>, including the prohibited-items rules.</span></label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 sm:col-span-2">{state.error}</p>}
    <button disabled={pending} className="rounded-full bg-[#55239a] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#35115f] disabled:opacity-50 sm:col-span-2">{pending ? "Creating your shop…" : "Register as a seller"}</button>
    <p className="text-center text-sm text-[#625b68] sm:col-span-2">Already registered? <Link href="/seller/login" className="font-semibold text-[#55239a] hover:underline">Sign in</Link></p>
  </form>;
}
