import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const setupMessage = error === "setup"
    ? "Check that your Supabase project URL, publishable key, and connection are ready."
    : error === "unauthorized"
      ? "Sign in with the store admin account."
      : undefined;

  return (
    <main className="min-h-screen bg-[#f7f4fa] px-5 py-12">
      <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(43,22,65,.12)] md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col justify-between bg-[#35115f] p-9 text-white sm:p-12">
            <Link href="/" className="text-sm font-semibold tracking-[.18em]">CHARWIN STORES</Link>
            <div className="my-16">
              <p className="mb-4 text-xs font-semibold tracking-[.22em] text-purple-200">THE BACK ROOM</p>
              <h1 className="max-w-sm text-4xl leading-tight sm:text-5xl">Your shop, in your hands.</h1>
              <p className="mt-5 max-w-sm leading-7 text-purple-100/80">Manage the collection, keep stock current, and add new finds as they arrive.</p>
            </div>
            <p className="text-xs text-purple-200/70">Private store management</p>
          </div>
          <div className="p-8 sm:p-12">
            <p className="text-sm font-semibold tracking-[.2em] text-[#8b5bc7]">WELCOME BACK</p>
            <h2 className="mt-3 text-3xl">Admin sign in</h2>
            <p className="mt-3 text-sm leading-6 text-[#625b68]">Use the Supabase Auth account configured for Charwin Stores.</p>
            {setupMessage && <p role="status" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{setupMessage}</p>}
            <LoginForm />
            <p className="mt-8 text-center text-xs text-[#817888]">Shopper? <Link href="/shop" className="font-semibold text-[#55239a] hover:underline">Browse the store</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
