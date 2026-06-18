import { useState } from "react";
import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button as Btn } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";

function StatusBadge({ status }) {
    const styles = {
        PENDING: { background: '#FEF3C7', color: '#92400E' },
        ACCEPTED: { background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' },
        REJECTED: { background: '#FEF2F2', color: '#991B1B' },
    };
    const labels = { PENDING: 'Oczekuje', ACCEPTED: 'Zaakceptowano', REJECTED: 'Odrzucono' };
    return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={styles[status] || {}}>
            {labels[status] || status}
        </span>
    );
}

export default function FindDietitian({ toast }) {
    const { data: dietitians, loading: loadingD } = useList("/users/dietitians/");
    const { data: requests, loading: loadingR, reload } = useList("/users/dietitian-requests/");
    const [modal, setModal] = useState(null); // dietitian object
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const pendingIds = new Set(
        requests.filter(r => r.status === 'PENDING').map(r => r.dietitian)
    );
    const acceptedIds = new Set(
        requests.filter(r => r.status === 'ACCEPTED').map(r => r.dietitian)
    );

    const sendRequest = async () => {
        setSending(true);
        try {
            await apiFetch("/users/dietitian-requests/", {
                method: "POST",
                body: JSON.stringify({ dietitian: modal.id, message }),
            });
            toast("Prośba wysłana!", "success");
            setModal(null);
            setMessage("");
            reload();
        } catch (e) {
            toast("Błąd: " + e.message, "error");
        } finally {
            setSending(false);
        }
    };

    const removeDietitian = async (dietitianId) => {
        if (!window.confirm("Are you sure you want to end cooperation with this dietitian?")) return;

        try {
            await apiFetch(`/users/end-cooperation/${dietitianId}/`, { method: "POST" });
            toast("Cooperation ended successfully.", "success");
            reload();
        } catch (e) {
            toast("Error: " + e.message, "error");
        }
    };

    return (
        <div className="pb-16 animate-fadeUp">
            <div className="mb-8">
                <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Znajdź dietetyka
                </h2>
                <p className="m-0 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Wyślij prośbę o współpracę — dietetyk musi ją zaakceptować
                </p>
            </div>

            {/* Wysłane prośby */}
            {requests.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3"
                        style={{ color: 'var(--color-text-muted)' }}>
                        Twoje prośby
                    </h3>
                    <div className="grid gap-2">
                        {requests.map(r => (
                            <div key={r.id}
                                className="flex items-center justify-between px-5 py-3.5 rounded-2xl"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <div>
                                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                                        {r.dietitian_name || r.dietitian_username}
                                    </div>
                                    {r.message && (
                                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                            "{r.message}"
                                        </div>
                                    )}
                                </div>
                                <StatusBadge status={r.status} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lista dietetyków */}
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3"
                style={{ color: 'var(--color-text-muted)' }}>
                Dostępni dietetycy
            </h3>

            {loadingD ? <Spinner /> : dietitians.length === 0 ? (
                <EmptyState icon="🩺" title="Brak dietetyków" sub="Nie ma jeszcze żadnych dietetyków w systemie." />
            ) : (
                <div className="grid gap-3">
                    {dietitians.map(d => {
                        const isPending = pendingIds.has(d.id);
                        const isAccepted = acceptedIds.has(d.id);
                        const initials = (d.first_name || d.username).slice(0, 1).toUpperCase();

                        return (
                            <div key={d.id}
                                className="flex items-center justify-between px-5 py-4 rounded-2xl"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                                        style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                                        {initials}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                                            {d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : d.username}
                                        </div>
                                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                            {d.email || `@${d.username}`}
                                        </div>
                                    </div>
                                </div>

                                {isAccepted ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                                            style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                                            Your dietitian ✓
                                        </span>
                                        <button
                                            onClick={() => removeDietitian(d.id)}
                                            className="text-xs font-bold px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-colors"
                                            style={{ background: '#FEF2F2', color: '#EF4444' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                                        >
                                            End
                                        </button>
                                    </div>
                                ) : isPending ? (
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                                        style={{ background: '#FEF3C7', color: '#92400E' }}>
                                        Prośba wysłana
                                    </span>
                                ) : (
                                    <Btn size="sm" onClick={() => setModal(d)}>
                                        Wyślij prośbę
                                    </Btn>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {modal && (
                <Modal title={`Prośba do ${modal.first_name || modal.username}`} onClose={() => setModal(null)}>
                    <div className="grid gap-4">
                        <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
                            Dietetyk otrzyma powiadomienie i zdecyduje czy chce Cię przyjąć.
                        </p>
                        <label className="block">
                            <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: 'var(--color-text-muted)' }}>
                                Wiadomość (opcjonalnie)
                            </span>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Napisz kilka słów o sobie i swoim celu…"
                                rows={3}
                                className="w-full box-border px-4 py-3 text-sm rounded-xl outline-none resize-y"
                                style={{
                                    background: 'var(--color-background)',
                                    border: '1.5px solid var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </label>
                        <div className="flex gap-2.5 justify-end">
                            <Btn variant="secondary" onClick={() => setModal(null)}>Anuluj</Btn>
                            <Btn onClick={sendRequest} disabled={sending}>
                                {sending ? "Wysyłanie…" : "Wyślij prośbę"}
                            </Btn>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}