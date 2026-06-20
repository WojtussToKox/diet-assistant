export const Card = ({ children, onClick, hover = false, className = "" }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border border-l-4 border-l-accent rounded-xl px-6 py-5 transition-all duration-150
        ${onClick ? "cursor-pointer" : "cursor-default"}
        ${hover ? "hover:shadow-[0_8px_24px_rgba(45,106,79,0.12)] hover:-translate-y-0.5" : "shadow-sm"}
        ${className}
      `}
    >
      {children}
    </div>
  );
};