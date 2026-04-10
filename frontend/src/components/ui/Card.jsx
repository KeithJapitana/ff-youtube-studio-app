export function Card({ children, className = "", ...props }) {
  return (
    <div className={`card-cinematic ${className}`} {...props}>
      {children}
    </div>
  );
}
