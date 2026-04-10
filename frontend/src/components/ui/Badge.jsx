export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "px-3 py-1 bg-white/5 border border-white/10 text-white/70 text-sm rounded-full",
    brand: "px-3 py-1 bg-brand-secondary/20 border border-brand-secondary/30 text-brand-secondary text-sm rounded-full",
    success: "px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm rounded-full",
  };

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
