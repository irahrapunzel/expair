export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] p-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#151B2B] rounded-xl p-6 border border-white/10">
              <div className="h-4 w-24 bg-white/10 rounded mb-4" />
              <div className="h-10 w-20 bg-white/10 rounded mb-4" />
              <div className="h-3 w-32 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Tables skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-[#151B2B] rounded-xl p-6 border border-white/10">
              <div className="h-6 w-48 bg-white/10 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-12 bg-white/5 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Activity skeleton */}
        <div className="bg-[#151B2B] rounded-xl p-6 border border-white/10">
          <div className="h-6 w-48 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}