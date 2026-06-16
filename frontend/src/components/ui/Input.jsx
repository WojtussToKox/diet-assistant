export const Input = ({ label, value, onChange, type = "text", placeholder, min, step, required, error }) => (
  <label className="block">
    {label && (
      <span className="block text-[13px] font-semibold text-text mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </span>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      className={`w-full box-border px-3 py-2 text-sm border-[1.5px] rounded-lg outline-none transition-colors duration-150
        ${error 
          ? 'border-danger bg-danger-light focus:border-danger' 
          : 'border-border bg-surface focus:border-accent'
        }`}
    />
    {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
  </label>
);