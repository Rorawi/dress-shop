import Link from "next/link";

export default function ProductNotFound() {
  return <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">A little detour</p>
    <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-medium">We couldn’t find that piece.</h1>
    <p className="mt-3 text-sm leading-6 text-[#625B68]">It may have moved on to a new home. Browse the current Charwin collection to find another favorite.</p>
    <Link href="/shop" className="mt-7 rounded-full bg-[#55239A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#35115F]">Explore the collection</Link>
  </div>;
}
