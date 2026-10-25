import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Smartphone, Sparkles, Store } from "lucide-react";

export default function SellerInvitationSection() {
  const benefits = [
    {
      icon: Store,
      title: "Your Own Storefront Link",
      description: "Get a dedicated page at charwinstores.com/s/your-brand with your logo, banner, and bio. Perfect for your Instagram bio and WhatsApp status.",
      highlight: "Personal brand link",
    },
    {
      icon: MessageCircle,
      title: "Direct WhatsApp & MoMo Orders",
      description: "Shoppers select sizes and click to order straight to your personal WhatsApp with ready-to-pay details. Zero middleman fees.",
      highlight: "Direct customer contact",
    },
    {
      icon: ShieldCheck,
      title: "Hand-Vetted for Trust",
      description: "Every vendor and product is personally vetted by the Charwin team. Shoppers know they are buying from genuine, reliable sellers.",
      highlight: "Verified community",
    },
    {
      icon: Smartphone,
      title: "Quick Mobile Uploads",
      description: "Snap or upload photos directly from your phone. Set colors, sizes, and stock in seconds with our streamlined seller studio.",
      highlight: "Easy inventory management",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#1C0B30] via-[#2A1047] to-[#170828] py-20 text-white sm:py-28">
      {/* Decorative background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[38rem] w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_#8B5BC7_0%,_transparent_65%)] opacity-30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-10 -z-10 h-80 w-80 rounded-full bg-[#55239A] opacity-40 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-purple-200 backdrop-blur-md">
            <Sparkles size={14} className="text-[#D6C0F0]" />
            <span>BECOME A VENDOR · CHARWIN MARKETPLACE</span>
          </div>

          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-medium tracking-tight text-white sm:text-5xl lg:text-6xl">
            Have a collection to sell? <br className="hidden sm:inline" />
            <span className="italic text-[#D6C0F0]">Let’s grow together.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-purple-100/80 sm:text-lg">
            Sell alongside Charwin Stores in our handpicked fashion e-marketplace.
            Get your own custom storefront link, reach new shoppers across Ghana, and close sales
            directly through WhatsApp and Mobile Money.
          </p>

          {/* Interactive URL Badge Preview */}
          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-xs sm:text-sm text-purple-100 backdrop-blur">
            <span className="font-mono text-[#D6C0F0]">charwinstores.com/s/</span>
            <span className="rounded-md bg-[#55239A] px-2 py-0.5 font-mono font-semibold text-white shadow-sm">
              your-brand-name
            </span>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-purple-300/30 hover:bg-white/[0.09] hover:shadow-2xl hover:shadow-purple-950/40"
              >
                <div>
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5BC7] to-[#55239A] text-white shadow-md shadow-purple-950/50 transition group-hover:scale-110">
                    <Icon size={22} />
                  </div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                    {benefit.highlight}
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-medium text-white sm:text-2xl">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-xs leading-6 text-purple-100/75 sm:text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust & Vetting Guarantee Card */}
        <div className="mt-12 rounded-3xl border border-purple-300/20 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.08] p-6 backdrop-blur sm:p-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex items-start gap-4">
              <div className="hidden rounded-full bg-[#8B5BC7]/30 p-2.5 text-[#D6C0F0] sm:block">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white sm:text-lg">
                  Personally vetted for quality and customer trust
                </h4>
                <p className="mt-1 max-w-xl text-xs text-purple-200/80 sm:text-sm">
                  We review every vendor profile and new listing before it goes live. This ensures shoppers know they are getting genuine, quality pieces — protecting you and your brand reputation.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
              <Link
                href="/seller/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#35115F] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#F3EAFD]"
              >
                <span>Apply as a vendor</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/seller/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-purple-100 transition hover:bg-white/10"
              >
                Already registered? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
