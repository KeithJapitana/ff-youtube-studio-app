export function ThumbnailCard({ src, quality, selected, onClick }) {
  return (
    <div
      className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
        selected
          ? "ring-2 ring-brand-secondary ring-offset-2 ring-offset-base-950"
          : "ring-1 ring-white/10 hover:ring-white/30"
      }`}
      onClick={onClick}
    >
      <img
        src={src}
        alt={`YouTube thumbnail ${quality}`}
        className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-2 left-2">
        <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white/80 text-xs font-medium rounded">
          {quality}
        </span>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-7 h-7 bg-brand-secondary rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
