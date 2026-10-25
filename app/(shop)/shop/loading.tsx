import { Sparkles } from "lucide-react";

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-[#FCFBFD]">
      {/* Top Header Filter Bar Skeleton */}
      <section className="border-b border-[#E6E0EB] bg-[#F8F5FA] px-4 py-8 sm:px-6 sm:py-11 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 h-3 w-24 animate-pulse rounded bg-[#E6E0EB]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-[#E6E0EB]" />
              <div className="h-10 w-64 animate-pulse rounded-xl bg-[#E6E0EB]" />
              <div className="h-4 w-40 animate-pulse rounded bg-[#E6E0EB]" />
            </div>
            <div className="h-12 w-full max-w-sm animate-pulse rounded-full bg-[#E6E0EB]" />
          </div>
        </div>
      </section>

      {/* Main Grid & Sidebar Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Floating loading notification */}
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E6E0EB] bg-white px-4 py-1.5 text-xs font-semibold text-[#35115F] shadow-sm">
            <Sparkles size={14} className="animate-spin text-[#55239A]" />
            <span>Finding matching pieces…</span>
          </div>
          <div className="h-8 w-36 animate-pulse rounded-full bg-[#E6E0EB]" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-[#EEEAF0] bg-white p-5 space-y-4">
              <div className="h-5 w-20 animate-pulse rounded bg-[#E6E0EB]" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1.5 pt-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-[#E6E0EB]" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-[#F5F1F8]" />
                </div>
              ))}
            </div>
          </aside>

          {/* Product Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#EEEAF0] bg-white p-3 space-y-3">
                <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-gradient-to-b from-[#F5F1F8] to-[#E9E1F0]" />
                <div className="space-y-2 pt-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#E6E0EB]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#E6E0EB]" />
                  <div className="h-5 w-24 animate-pulse rounded-md bg-[#E6E0EB]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
