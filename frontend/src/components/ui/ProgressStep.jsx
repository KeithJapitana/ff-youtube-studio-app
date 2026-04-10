export function ProgressStep({ number, label, isActive, isCompleted, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!isActive && !isCompleted}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 w-full text-left ${
        isActive
          ? "bg-brand-primary/20 border border-brand-secondary/30"
          : isCompleted
          ? "bg-white/5 border border-white/10 hover:bg-white/10"
          : "bg-transparent border border-transparent opacity-40"
      }`}
    >
      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isActive
          ? "bg-brand-secondary text-white"
          : isCompleted
          ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
          : "bg-white/5 border border-white/10 text-white/40"
      }`}>
        {isCompleted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <span className="font-bold">{number}</span>
        )}
      </div>
      <div className="text-left">
        <p className={`font-medium ${isActive ? "text-white" : isCompleted ? "text-white/70" : "text-white/40"}`}>
          {label}
        </p>
        {isCompleted && !isActive && (
          <p className="text-xs text-emerald-400">Completed</p>
        )}
      </div>
    </button>
  );
}
