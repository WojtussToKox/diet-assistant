export const Badge = ({ children, variant = "accent" }) => {
  const variants = {
    accent: "bg-accent-xlight text-accent",
    muted: "bg-border text-text-muted",
    danger: "bg-danger-light text-danger",
    macro: "bg-macro-calories/20 text-macro-calories",
  };
  
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${variants[variant]}`}>
      {children}
    </span>
  );
};