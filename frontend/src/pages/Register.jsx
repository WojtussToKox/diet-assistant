import { useState } from "react";
import { API_BASE } from "../services/api";

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNextStep = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) { setError("Hasła się nie zgadzają."); return; }
        setError(""); setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const response = await fetch(`${API_BASE}/users/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, password_confirm: confirmPassword, first_name: firstName, height_cm: parseFloat(height), weight_kg: parseFloat(weight) }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const k = Object.keys(data)[0];
                throw new Error(k ? `${k}: ${data[k][0] || data[k]}` : "Błąd rejestracji.");
            }
            onRegisterSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 font-['Inter'] relative" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
            <div className="w-full max-w-[440px] z-10">
                <div className="text-center mb-8">
                    <h1 className="font-black text-3xl tracking-tight mb-2">Join us</h1>
                    <p className="text-sm font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Step {step} of 2</p>
                </div>

                <div className="p-8 rounded-[24px] shadow-sm relative" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="absolute top-0 left-0 w-full h-1.5 rounded-[24px] overflow-hidden" style={{ background: 'var(--color-background)' }}>
                        <div className="h-full transition-all duration-300 ease-out" style={{ width: step === 1 ? "50%" : "100%", background: 'var(--color-accent)' }}></div>
                    </div>

                    <form onSubmit={step === 1 ? handleNextStep : handleRegister}>
                        {error && <div className="mb-6 p-4 rounded-xl text-sm font-semibold text-center" style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}>{error}</div>}

                        {step === 1 && (
                            <>
                                <div className="space-y-4 mb-8">
                                    <label className="block">
                                        <span className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Username</span>
                                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-3 outline-none rounded-xl" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                                    </label>
                                    <label className="block">
                                        <span className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Email</span>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 outline-none rounded-xl" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                                    </label>
                                    <label className="block">
                                        <span className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Password</span>
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 outline-none rounded-xl font-mono tracking-widest" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                                    </label>
                                    <label className="block">
                                        <span className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Confirm password</span>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 outline-none rounded-xl font-mono tracking-widest" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-sm border-0 cursor-pointer transition-opacity" style={{ background: 'var(--color-accent)', color: '#fff' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                    Continue →
                                </button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="space-y-4 mb-8">
                                    <label className="block">
                                        <span className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Name</span>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-3 outline-none rounded-xl" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="block flex-1">
                                            <span className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Height (cm)</span>
                                            <input type="number" min="100" max="250" value={height} onChange={(e) => setHeight(e.target.value)} required className="w-full px-4 py-3 outline-none rounded-xl" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                                        </label>
                                        <label className="block flex-1">
                                            <span className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Weight (kg)</span>
                                            <input type="number" min="30" max="300" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required className="w-full px-4 py-3 outline-none rounded-xl" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl font-bold text-sm cursor-pointer" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                        ← Return
                                    </button>
                                    <button type="submit" disabled={loading} className="flex-[2] py-3.5 rounded-xl font-bold text-sm border-0 cursor-pointer disabled:opacity-50" style={{ background: 'var(--color-accent)', color: '#fff' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                        {loading ? "Signing up..." : "Sign up"}
                                    </button>
                                </div>
                            </>
                        )}
                        <p className="text-center text-sm mt-6 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                            Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-bold bg-transparent border-none cursor-pointer p-0" style={{ color: 'var(--color-accent)' }}>Sign in</button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}