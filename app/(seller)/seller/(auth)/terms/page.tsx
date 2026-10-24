import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Seller agreement" };

const terms = [
  ["Accurate listings", "List only items you are allowed to sell. Keep prices, stock, photos, descriptions, and payment details accurate. Do not claim a brand or product feature that you cannot verify."],
  ["Prohibited items", "Do not list counterfeit goods sold as genuine brands, weapons, illegal drugs, stolen goods, explicit adult content, hazardous items, or anything illegal in Ghana. The marketplace may update its prohibited-items list."],
  ["Review and enforcement", "New listings and material changes stay hidden until approved. Charwin Stores may remove reported or prohibited content, issue warnings, suspend access, or ban a shop. A good standing history may qualify a shop for low-risk automated review when that setting is enabled."],
  ["Orders and payment", "Customers contact your shop through WhatsApp. You are responsible for confirming each order, delivery, and payment directly with the customer. Charwin Stores does not receive or hold customer payments and is not a party to payment disputes."],
  ["Customer service and privacy", "Respond to customer questions and order requests promptly. Use customer contact and delivery details only to fulfill the order, and keep your account credentials private."],
  ["Subscription and access", "Trial and subscription dates are managed by the marketplace team. An expired shop may become unavailable after the configured grace period. Contact the marketplace team to record a renewal."],
];

export default function SellerTermsPage() {
  return <main className="min-h-screen bg-[#f7f4fa] px-5 py-12"><article className="mx-auto max-w-3xl rounded-[2rem] bg-white p-7 shadow-[0_24px_80px_rgba(43,22,65,.12)] sm:p-12"><Link href="/seller/signup" className="text-sm font-semibold text-[#55239a]">← Back to seller sign-up</Link><p className="mt-10 text-xs font-semibold tracking-[.2em] text-[#8b5bc7]">CHARWIN STORES MARKETPLACE</p><h1 className="mt-3 text-4xl">Seller agreement</h1><p className="mt-3 text-sm leading-6 text-[#625b68]">Please read these operating rules before you create a seller account.</p><div className="mt-8 space-y-6">{terms.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#625b68]">{body}</p></section>)}</div><Link href="/seller/signup" className="mt-10 inline-flex rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white">Return to sign-up</Link></article></main>;
}
