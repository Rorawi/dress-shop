import { LoaderCircle } from "lucide-react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[#eee9f3] ${className}`} />;
}

export default function AdminPageLoading() {
  return (
    <div className="mx-auto max-w-7xl" role="status" aria-live="polite" aria-busy="true">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="h-10 w-56 rounded-lg" />
          <SkeletonBlock className="h-4 w-72 max-w-[70vw] rounded-full" />
        </div>
        <LoaderCircle aria-hidden="true" className="mt-2 animate-spin text-[#8b5bc7]" size={22} />
        <span className="sr-only">Loading admin page</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-5 rounded-2xl border border-[#ece6f0] bg-white p-5">
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonBlock className="h-9 w-16 rounded-lg" />
            <SkeletonBlock className="h-3 w-36 rounded-full" />
          </div>
        ))}
      </div>

      <div className="mt-9 rounded-2xl border border-[#ece6f0] bg-white p-6">
        <SkeletonBlock className="h-7 w-48 rounded-lg" />
        <SkeletonBlock className="mt-3 h-4 w-64 max-w-[70vw] rounded-full" />
        <div className="mt-8 space-y-4">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-4/5" />
        </div>
      </div>
    </div>
  );
}
