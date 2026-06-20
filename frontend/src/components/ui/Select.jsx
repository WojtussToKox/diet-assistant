export const Select = ({ label, value, onChange, options, placeholder, required }) => (
  <label className="block">
    {label && (
      <span className="block text-[13px] font-semibold text-text mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </span>
    )}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full box-border px-3 py-2 text-sm border-[1.5px] border-border rounded-lg bg-surface outline-none cursor-pointer focus:border-accent
        ${value ? "text-text" : "text-text-muted"}
      `}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);