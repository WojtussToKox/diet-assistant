import { useState } from "react";
import { apiFetch } from "../services/api";
import { useTheme } from "../App";
import { FaRegMoon, FaSun, FaLock, FaUser, FaSignOutAlt } from "react-icons/fa";
import { Input } from "../components/ui/Input";
import { Button as Btn } from "../components/ui/Button";

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
            toast("Profile updated successfully", "success");
        } catch (e) {
            toast("Error: " + e.message, "error");
        } finally {
            setSavingProfile(false);
        }
    };

    const changePassword = async () => {
        if (passForm.new_password !== passForm.confirm_password) {
            toast("Passwords do not match", "error");
            return;
        }
        setSavingPass(true);
        try {
            await apiFetch("/users/change-password/", {
                method: "POST",
                body: JSON.stringify({ old_password: passForm.old_password, new_password: passForm.new_password }),
            });
            toast("Password changed successfully", "success");
            setPassForm({ old_password: "", new_password: "", confirm_password: "" });
        } catch (e) {
            toast("Error: " + e.message, "error");
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
                <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>Settings</h1>
                <p className="text-sm mt-1 m-0" style={{ color: 'var(--color-text-muted)' }}>Manage your account and preferences</p>
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
                        Active account
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <Section icon={<FaSun />} title="Appearance">
                <FieldRow label="Theme" hint="Switch between light and dark interface">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'var(--color-background)' }}>
                        <span style={{ color: dark ? 'var(--color-text-muted)' : 'var(--color-accent)', opacity: dark ? 0.5 : 1 }}><FaSun /></span>
                        <Toggle checked={dark} onChange={toggle} />
                        <span style={{ color: dark ? 'var(--color-accent)' : 'var(--color-text-muted)', opacity: dark ? 1 : 0.5 }}><FaRegMoon /></span>
                    </div>
                </FieldRow>
            </Section>

            {/* Profile */}
            <Section icon={<FaUser />} title="Profile Data">
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <Input
                        label="First Name"
                        value={profileForm.first_name}
                        onChange={v => setProfileForm(f => ({ ...f, first_name: v }))}
                        placeholder="Your name"
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={v => setProfileForm(f => ({ ...f, email: v }))}
                        placeholder="address@email.com"
                    />
                    <Input
                        label="Height (cm)"
                        type="number"
                        value={profileForm.height_cm}
                        onChange={v => setProfileForm(f => ({ ...f, height_cm: v }))}
                        min="100" max="250"
                    />
                    <Input
                        label="Weight (kg)"
                        type="number"
                        value={profileForm.weight_kg}
                        onChange={v => setProfileForm(f => ({ ...f, weight_kg: v }))}
                        min="30" max="300" step="0.1"
                    />
                </div>
                <div className="flex justify-end">
                    <Btn onClick={saveProfile} disabled={savingProfile}>
                        {savingProfile ? "Saving..." : "Save changes"}
                    </Btn>
                </div>
            </Section>

            {/* Password */}
            <Section icon={<FaLock />} title="Change Password">
                <div className="space-y-3 mb-5">
                    <Input
                        label="Current password"
                        type="password"
                        value={passForm.old_password}
                        onChange={e => setPassForm(f => ({ ...f, old_password: e.target.value }))}
                        placeholder="••••••••"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="New password"
                            type="password"
                            value={passForm.new_password}
                            onChange={e => setPassForm(f => ({ ...f, new_password: e.target.value }))}
                            placeholder="••••••••"
                        />
                        <Input
                            label="Confirm password"
                            type="password"
                            value={passForm.confirm_password}
                            onChange={e => setPassForm(f => ({ ...f, confirm_password: e.target.value }))}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Btn onClick={changePassword} disabled={savingPass || !passForm.old_password || !passForm.new_password}>
                        {savingPass ? "Changing..." : "Change password"}
                    </Btn>
                </div>
            </Section>

            {/* Logout */}
            <Section icon={<FaSignOutAlt />} title="Session">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Log out</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Ends your current session</div>
                    </div>
                    {!confirmLogout ? (
                        <Btn
                            onClick={() => setConfirmLogout(true)}
                            style={{ background: '#FEF2F2', color: '#EF4444', border: 'none' }}
                        >
                            Log out
                        </Btn>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Are you sure?</span>
                            <Btn
                                onClick={onLogout}
                                style={{ background: '#EF4444', color: '#fff', border: 'none' }}
                            >
                                Yes, log out
                            </Btn>
                            <Btn
                                variant="secondary"
                                onClick={() => setConfirmLogout(false)}
                            >
                                Cancel
                            </Btn>
                        </div>
                    )}
                </div>
            </Section>

        </div>
    );
}