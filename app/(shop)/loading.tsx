import { Sparkles } from "lucide-react";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#FCFBFD]">
      {/* Top Banner Skeleton */}
      <div className="border-b border-[#E6E0EB] bg-[#F8F5FA] px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-4 flex h-6 w-36 animate-pulse items-center justify-center rounded-full bg-[#E6E0EB]" />
            <div className="mx-auto h-12 w-3/4 animate-pulse rounded-2xl bg-[#E6E0EB]" />
            <div className="mx-auto mt-4 h-4 w-1/2 animate-pulse rounded-lg bg-[#E6E0EB]" />
            <div className="mt-8 flex justify-center gap-3">
              <div className="h-12 w-44 animate-pulse rounded-full bg-[#55239A]/20" />
              <div className="h-12 w-36 animate-pulse rounded-full bg-[#E6E0EB]" />
            </div>
          </div>
        </div>
      </div>

      {/* Branded loading notification */}
      <div className="mx-auto -mt-6 flex max-w-xs items-center justify-center gap-2 rounded-full border border-[#E6E0EB] bg-white px-5 py-2.5 shadow-md">
        <Sparkles size={16} className="animate-spin text-[#55239A]" />
        <span className="text-xs font-semibold text-[#35115F]">Loading collection…</span>
      </div>

      {/* Products Grid Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-[#E6E0EB]" />
            <div className="h-7 w-48 animate-pulse rounded-lg bg-[#E6E0EB]" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-[#E6E0EB]" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#EEEAF0] bg-white p-3 space-y-3">
              <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-gradient-to-b from-[#F5F1F8] to-[#E9E1F0]" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#E6E0EB]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#E6E0EB]" />
                <div className="h-5 w-24 animate-pulse rounded-md bg-[#E6E0EB] pt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
