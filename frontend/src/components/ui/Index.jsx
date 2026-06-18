import { useEffect } from "react";

// Modal
export function Modal({ title, onClose, children, width = "max-w-[520px]" }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`w-full ${width} max-h-[90vh] overflow-y-auto rounded-2xl animate-fadeUp`}
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                }}
            >
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <h3 className="m-0 text-base font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border-0 cursor-pointer text-lg transition-all"
                        style={{ background: 'var(--color-background)', color: 'var(--color-text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-background)'}
                    >
                        ✕
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

// Card
export function Card({ children, hover = false, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`rounded-2xl p-5 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => {
                if (hover) {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }
            }}
            onMouseLeave={e => {
                if (hover) {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }
            }}
        >
            {children}
        </div>
    );
}

// Badge
export function Badge({ children, variant = "default" }) {
    const styles = {
        accent: { background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' },
        muted: { background: 'var(--color-background)', color: 'var(--color-text-muted)' },
        macro: { background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' },
        default: { background: 'var(--color-background)', color: 'var(--color-text-muted)' },
    };
    return (
        <span className="inline-block text-xs px-2.5 py-0.5 rounded-lg font-semibold font-mono" style={styles[variant] || styles.default}>
            {children}
        </span>
    );
}

// Spinner
export function Spinner() {
    return (
        <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        </div>
    );
}

// MacroBar
export function MacroBar({ protein = 0, fat = 0, carbs = 0, calories }) {
    const p = Number(protein), f = Number(fat), c = Number(carbs);
    const total = p * 4 + f * 9 + c * 4;
    const pPct = total ? (p * 4 / total) * 100 : 0;
    const fPct = total ? (f * 9 / total) * 100 : 0;
    const cPct = total ? (c * 4 / total) * 100 : 0;
    const fmt = (n) => Number(n).toFixed(1);

    return (
        <div>
            {/* Segmented bar */}
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-3">
                {pPct > 0 && <div className="h-full rounded-l-full" style={{ width: `${pPct}%`, background: '#3B82F6' }} />}
                {fPct > 0 && <div className="h-full" style={{ width: `${fPct}%`, background: '#F59E0B' }} />}
                {cPct > 0 && <div className="h-full rounded-r-full" style={{ width: `${cPct}%`, background: '#10B981' }} />}
                {total === 0 && <div className="h-full w-full rounded-full" style={{ background: 'var(--color-border)' }} />}
            </div>
            {/* Labels */}
            <div className="flex gap-4">
                {[
                    { label: "Białko", value: p, unit: "g", color: "#3B82F6" },
                    { label: "Tłuszcz", value: f, unit: "g", color: "#F59E0B" },
                    { label: "Węgle", value: c, unit: "g", color: "#10B981" },
                    ...(calories !== undefined ? [{ label: "Kalorie", value: Number(calories).toFixed(0), unit: "kcal", color: "#8B5CF6" }] : []),
                ].map(({ label, value, unit, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-text)' }}>{fmt(value)}{unit}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// EmptyState
export function EmptyState({ icon, title, sub, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 opacity-60">{icon}</div>
            <div className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</div>
            {sub && <div className="text-sm mb-6 max-w-[280px]" style={{ color: 'var(--color-text-muted)' }}>{sub}</div>}
            {action}
        </div>
    );
}

// Select
export function Select({ label, value, onChange, options = [], placeholder, required }) {
    return (
        <label className="block">
            {label && (
                <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    {label}{required && <span style={{ color: 'var(--color-accent)' }}> *</span>}
                </span>
            )}
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                className="w-full box-border px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all appearance-none cursor-pointer font-['Inter']"
                style={{
                    background: 'var(--color-background)',
                    border: '1.5px solid var(--color-border)',
                    color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            >
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} style={{ color: 'var(--color-text)', background: 'var(--color-surface)' }}>{opt.label}</option>
                ))}
            </select>
        </label>
    );
}