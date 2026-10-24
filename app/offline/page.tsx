import Link from "next/link";

export default function OfflinePage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#fcfbfd] px-5 text-center"><div className="max-w-md"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#8b5bc7]">CHARWIN STORES</p><h1 className="mt-4 text-4xl">You’re offline</h1><p className="mt-3 text-sm leading-6 text-[#625b68]">Reconnect to browse current products, shop pages, and order details.</p><Link href="/" className="mt-6 inline-block rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white">Try again</Link></div></main>;
}
