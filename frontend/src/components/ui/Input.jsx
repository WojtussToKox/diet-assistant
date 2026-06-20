export function Input({ label, value, onChange, type = "text", placeholder, required, min, max, step }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
          {label}{required && <span style={{ color: 'var(--color-accent)' }}> *</span>}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className="w-full box-border px-4 py-2.5 text-sm rounded-xl outline-none transition-all font-['Inter']"
        style={{
          background: 'var(--color-background)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
      />
    </label>
  );
}