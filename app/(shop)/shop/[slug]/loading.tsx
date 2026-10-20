export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-[3/4] bg-[#E6E0EB] rounded-2xl" />
        <div className="space-y-6">
          <div className="h-4 bg-[#E6E0EB] rounded w-24" />
          <div className="h-10 bg-[#E6E0EB] rounded w-3/4" />
          <div className="h-8 bg-[#E6E0EB] rounded w-32" />
          <div className="space-y-2">
            <div className="h-4 bg-[#E6E0EB] rounded" />
            <div className="h-4 bg-[#E6E0EB] rounded w-5/6" />
          </div>
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 w-20 bg-[#E6E0EB] rounded-lg" />)}
          </div>
          <div className="h-14 bg-[#E6E0EB] rounded-full" />
        </div>
      </div>
    </div>
  );
}
