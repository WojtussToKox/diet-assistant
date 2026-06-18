export function Button({ children, onClick, variant = "primary", size = "md", disabled = false, className = "" }) {
  const base = "inline-flex items-center justify-center font-semibold border-0 cursor-pointer transition-all rounded-xl disabled:opacity-40 disabled:cursor-not-allowed";

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
  };

  const variants = {
    primary: {
      background: 'var(--color-accent)',
      color: '#fff',
    },
    secondary: {
      background: 'var(--color-background)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-muted)',
    },
  };

  const style = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${className}`}
      style={style}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}