import { useState } from "react";
import { apiFetch } from "../services/api";
import { useTheme } from "../App";

function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
}
function MoonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
    );
}
function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    );
}
function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}
function LogoutIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

function Section({ icon, title, children }) {
    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
                <h3 className="m-0 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function FieldRow({ label, hint, children }) {
    return (
        <div className="flex items-start justify-between gap-6 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</div>
                {hint && <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{hint}</div>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div>
            {label && <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{label}</label>}
            <input
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-['Inter'] outline-none transition-all"
                style={{
                    background: 'var(--color-background)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                {...props}
            />
        </div>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className="flex items-center gap-2.5 border-0 bg-transparent cursor-pointer p-0"
            role="switch"
            aria-checked={checked}
        >
            <div
                className="relative w-11 h-6 rounded-full transition-all duration-300"
                style={{ background: checked ? 'var(--color-accent)' : 'var(--color-border)' }}
            >
                <div
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                    style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
                />
            </div>
            {label && <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</span>}
        </button>
    );
}

export default function SettingsPanel({ user, setUser, toast, onLogout }) {
    const { dark, toggle } = useTheme();

    // Profile form
    const [profileForm, setProfileForm] = useState({
        first_name: user?.first_name || "",
        email: user?.email || "",
        height_cm: user?.height_cm || "",
        weight_kg: user?.weight_kg || "",
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [passForm, setPassForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
    const [savingPass, setSavingPass] = useState(false);

    const [confirmLogout, setConfirmLogout] = useState(false);

    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            const updated = await apiFetch("/users/me/", {
                method: "PATCH",
                body: JSON.stringify(profileForm),
            });
            setUser(updated);
            toast("Profil zaktualizowany", "success");
        } catch (e) {
            toast("Błąd: " + e.message, "error");
        } finally {
            setSavingProfile(false);
        }
    };

    const changePassword = async () => {
        if (passForm.new_password !== passForm.confirm_password) {
            toast("Hasła się nie zgadzają", "error");
            return;
        }
        setSavingPass(true);
        try {
            await apiFetch("/users/change-password/", {
                method: "POST",
                body: JSON.stringify({ old_password: passForm.old_password, new_password: passForm.new_password }),
            });
            toast("Hasło zostało zmienione", "success");
            setPassForm({ old_password: "", new_password: "", confirm_password: "" });
        } catch (e) {
            toast("Błąd: " + e.message, "error");
        } finally {
            setSavingPass(false);
        }
    };

    const name = user?.first_name || user?.username || "User";
    const initials = name.slice(0, 2).toUpperCase();

    return (
        <div className="animate-fadeUp space-y-6 pb-16">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>Ustawienia</h1>
                <p className="text-sm mt-1 m-0" style={{ color: 'var(--color-text-muted)' }}>Zarządzaj swoim kontem i preferencjami</p>
            </div>

            {/* Avatar + name card */}
            <div className="rounded-2xl p-6 flex items-center gap-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                    {initials}
                </div>
                <div>
                    <div className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>{name}</div>
                    <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</div>
                    <div className="text-xs mt-1.5 px-2 py-0.5 rounded-md inline-block font-medium"
                        style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                        Aktywne konto
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <Section icon={<SunIcon />} title="Wygląd">
                <FieldRow label="Motyw" hint="Przełącz między jasnym i ciemnym interfejsem">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'var(--color-background)' }}>
                        <span style={{ color: dark ? 'var(--color-text-muted)' : 'var(--color-accent)', opacity: dark ? 0.5 : 1 }}><SunIcon /></span>
                        <Toggle checked={dark} onChange={toggle} />
                        <span style={{ color: dark ? 'var(--color-accent)' : 'var(--color-text-muted)', opacity: dark ? 1 : 0.5 }}><MoonIcon /></span>
                    </div>
                </FieldRow>
            </Section>

            {/* Profile */}
            <Section icon={<UserIcon />} title="Dane profilu">
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <Input
                        label="Imię"
                        value={profileForm.first_name}
                        onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))}
                        placeholder="Twoje imię"
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="adres@email.com"
                    />
                    <Input
                        label="Wzrost (cm)"
                        type="number"
                        value={profileForm.height_cm}
                        onChange={e => setProfileForm(f => ({ ...f, height_cm: e.target.value }))}
                        min="100" max="250"
                    />
                    <Input
                        label="Waga (kg)"
                        type="number"
                        value={profileForm.weight_kg}
                        onChange={e => setProfileForm(f => ({ ...f, weight_kg: e.target.value }))}
                        min="30" max="300" step="0.1"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border-0 disabled:opacity-50"
                        style={{ background: 'var(--color-accent)', color: '#fff' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        {savingProfile ? "Zapisywanie…" : "Zapisz zmiany"}
                    </button>
                </div>
            </Section>

            {/* Password */}
            <Section icon={<LockIcon />} title="Zmiana hasła">
                <div className="space-y-3 mb-5">
                    <Input
                        label="Aktualne hasło"
                        type="password"
                        value={passForm.old_password}
                        onChange={e => setPassForm(f => ({ ...f, old_password: e.target.value }))}
                        placeholder="••••••••"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Nowe hasło"
                            type="password"
                            value={passForm.new_password}
                            onChange={e => setPassForm(f => ({ ...f, new_password: e.target.value }))}
                            placeholder="••••••••"
                        />
                        <Input
                            label="Powtórz hasło"
                            type="password"
                            value={passForm.confirm_password}
                            onChange={e => setPassForm(f => ({ ...f, confirm_password: e.target.value }))}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={changePassword}
                        disabled={savingPass || !passForm.old_password || !passForm.new_password}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border-0 disabled:opacity-40"
                        style={{ background: 'var(--color-accent)', color: '#fff' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        {savingPass ? "Zmienianie…" : "Zmień hasło"}
                    </button>
                </div>
            </Section>

            {/* Logout */}
            <Section icon={<LogoutIcon />} title="Sesja">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Wyloguj się</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Zakończy Twoją aktualną sesję</div>
                    </div>
                    {!confirmLogout ? (
                        <button
                            onClick={() => setConfirmLogout(true)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border-0"
                            style={{ background: '#FEF2F2', color: '#EF4444' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                        >
                            Wyloguj się
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Na pewno?</span>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-0"
                                style={{ background: '#EF4444', color: '#fff' }}
                            >
                                Tak, wyloguj
                            </button>
                            <button
                                onClick={() => setConfirmLogout(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-0"
                                style={{ background: 'var(--color-background)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                            >
                                Anuluj
                            </button>
                        </div>
                    )}
                </div>
            </Section>

            <p className="text-xs text-center pb-2" style={{ color: 'var(--color-text-subtle)' }}>DietAssistant v2.0 · Wszystkie dane są bezpieczne</p>
        </div>
    );
}