import { useState } from "react";
import { API_BASE } from "../services/api";
import { MdFastfood } from "react-icons/md";

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE}/token/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) throw new Error("Incorrect login or password.");

            const data = await response.json();
            localStorage.setItem("access_token", data.access);
            if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
            onLoginSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-['Inter']" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>

            <div className="hidden lg:flex w-[450px] flex-col justify-between p-12 shrink-0 border-r" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div>
                    <h1 className="font-black text-4xl tracking-tight mb-4 flex" style={{ color: 'var(--color-text)' }}><MdFastfood className="mr-2" />Diet Assistant</h1>
                    <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                        A place where you control what you eat.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
                <div className="w-full max-w-[400px] z-10">
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="font-black text-3xl tracking-tight mb-2">Good to see you again! 👋</h2>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Log onto your account.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl text-sm font-semibold text-center" style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Login</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 outline-none transition-colors font-mono rounded-xl"
                                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 outline-none transition-colors font-mono tracking-widest rounded-xl"
                                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full py-4 rounded-xl font-bold text-sm transition-all border-0 cursor-pointer mt-4 disabled:opacity-50"
                            style={{ background: 'var(--color-accent)', color: '#fff' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {loading ? "Logging on..." : "Log in →"}
                        </button>

                        <p className="text-center text-sm mt-6 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                            Not registered yet?{" "}
                            <button
                                type="button"
                                onClick={onSwitchToRegister}
                                className="font-bold bg-transparent border-none cursor-pointer p-0"
                                style={{ color: 'var(--color-accent)' }}
                            >
                                Sign up
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}