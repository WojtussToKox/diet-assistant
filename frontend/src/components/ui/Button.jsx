export const Button = ({ children, onClick, variant = "primary", size = "md", disabled, className = "" }) => {
  const baseClasses = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2 text-sm",
    lg: "px-7 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-accent text-white hover:bg-[#245A42]",
    secondary: "bg-transparent text-accent border-[1.5px] border-accent hover:bg-accent-xlight",
    ghost: "bg-transparent text-text-muted hover:bg-background hover:text-text",
    danger: "bg-danger text-white hover:bg-[#B91C1C]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};