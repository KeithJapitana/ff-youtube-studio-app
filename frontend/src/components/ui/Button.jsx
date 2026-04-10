export function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-tertiary hover:shadow-lg hover:shadow-brand-primary/25 active:scale-[0.98]",
    secondary: "px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 hover:border-white/20",
    ghost: "px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg",
    danger: "px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 hover:border-red-500/50",
    outline: "px-6 py-3 border border-brand-secondary/40 text-brand-secondary rounded-xl hover:bg-brand-secondary/10 hover:border-brand-secondary/60",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
