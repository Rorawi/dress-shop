export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-[85vh] bg-[#FCFBFD]" />
      <div className="py-16 max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-[#E6E0EB] rounded-xl" />
            <div className="h-4 bg-[#E6E0EB] rounded w-3/4" />
            <div className="h-4 bg-[#E6E0EB] rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
