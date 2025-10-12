export default function AdminPageHeader({ title, subtitle, searchQuery, searchResultsCount, totalCount }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="text-white/60 mt-1">{subtitle}</p>
      {searchQuery && (
        <div className="mt-2 text-sm text-white/70">
          Showing results for: <span className="text-[#6DDFFF] font-medium">"{searchQuery}"</span>
          {searchResultsCount === 0 && <span className="text-red-400 ml-2">No results found</span>}
        </div>
      )}
    </div>
  );
}



