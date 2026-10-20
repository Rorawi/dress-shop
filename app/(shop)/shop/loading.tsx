export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-10 bg-[#E6E0EB] rounded w-48 mb-2" />
      <div className="h-4 bg-[#E6E0EB] rounded w-32 mb-8" />
      <div className="flex gap-8">
        <div className="hidden lg:block w-64 space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-[#E6E0EB] rounded" />)}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-[#E6E0EB] rounded-xl mb-3" />
              <div className="h-4 bg-[#E6E0EB] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[#E6E0EB] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
