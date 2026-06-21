import { useState } from "react";
import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button as Btn } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FaSearch, FaUserMd, FaClipboardList } from "react-icons/fa";

function StatusBadge({ status }) {
    const styles = {
        PENDING: { background: '#FEF3C7', color: '#92400E' },
        ACCEPTED: { background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' },
        REJECTED: { background: '#FEF2F2', color: '#991B1B' },
    };
    const labels = { PENDING: 'Pending', ACCEPTED: 'Accepted', REJECTED: 'Rejected' };
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
    const [modal, setModal] = useState(null);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");
    const [acting, setActing] = useState(null);

    const sendRequest = async () => {
        setSending(true);
        try {
            await apiFetch("/users/dietitian-requests/", {
                method: "POST",
                body: JSON.stringify({
                    dietitian: modal.id,
                    message: message || ""
                })
            });
            toast("Request sent successfully!", "success");
            setModal(null);
            setMessage("");
            reload();
        } catch (e) {
            toast("Error: " + e.message, "error");
        } finally {
            setSending(false);
        }
    };

    const cancelRequest = async (id) => {
        setActing(id);
        try {
            await apiFetch(`/users/dietitian-requests/${id}/`, { method: "DELETE" });
            toast("Request cancelled", "success");
            reload();
        } catch (e) {
            toast("Error: " + e.message, "error");
        } finally {
            setActing(null);
        }
    };

    const filtered = dietitians.filter(d =>
        (d.first_name || d.username).toLowerCase().includes(search.toLowerCase()) ||
        (d.email || "").toLowerCase().includes(search.toLowerCase())
    );

    const getDietitianName = (id) => {
        const d = dietitians.find(doc => doc.id === id);
        if (!d) return `User #${id}`;
        return d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : d.username;
    };
    

    return (
        <div className="pb-16 animate-fadeUp flex gap-8 items-start">

            {/* Left column: Dietitians list */}
            <div className="flex-1">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Find a Dietitian</h2>
                        <p className="m-0 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>Browse specialists and send a cooperation request</p>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                        <FaSearch />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                    />
                </div>

                {loadingD ? <Spinner /> : filtered.length === 0 ? (
                    <EmptyState icon={<FaUserMd className="text-4xl opacity-50" />} title="No results" sub="No dietitians found matching your criteria." />
                ) : (
                    <div className="grid gap-3">
                        {filtered.map(d => {
                            const initials = (d.first_name || d.username).slice(0, 2).toUpperCase();

                            // We are looking to see if the user has already sent an inquiry to this specific dietitian
                            const userRequest = requests.find(r => r.dietitian === d.id);

                            return (
                                <div key={d.id} className="p-4 rounded-2xl flex items-center justify-between" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                                            style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
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

                                    {/* We display the status or Modal opening button based on the query status */}
                                    <div>
                                        {userRequest?.status === 'ACCEPTED' ? (
                                            <span className="text-sm px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                                                Accepted
                                            </span>
                                        ) : userRequest?.status === 'PENDING' ? (
                                            <span className="text-sm px-3 py-1.5 rounded-lg font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                                Request Sent
                                            </span>
                                        ) : (
                                            <Btn onClick={() => setModal(d)}>
                                                Send Request
                                            </Btn>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Right column: My requests */}
            <div className="w-80 shrink-0 flex flex-col gap-3">
                <div className="px-1 mb-2">
                    <h3 className="m-0 text-base font-bold" style={{ color: 'var(--color-text)' }}>My Requests</h3>
                    <p className="m-0 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>Status of your requests</p>
                </div>

                {loadingR || loadingD ? <Spinner /> : requests.length === 0 ? (
                    <EmptyState icon={<FaClipboardList className="text-4xl opacity-50" />} title="No active requests" sub="You haven't sent any cooperation requests yet." />
                ) : (
                    requests.map(r => (
                        <div key={r.id} className="p-4 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>To:</div>
                                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{getDietitianName(r.dietitian)}</div>
                                </div>
                                <StatusBadge status={r.status} />
                            </div>

                            {r.message && (
                                <div className="text-xs p-2.5 rounded-lg mb-3" style={{ background: 'var(--color-background)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                    "{r.message}"
                                </div>
                            )}

                            {r.status === 'PENDING' && (
                                <button
                                    onClick={() => cancelRequest(r.id)}
                                    disabled={acting === r.id}
                                    className="w-full py-2 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-colors disabled:opacity-50"
                                    style={{ background: '#FEF2F2', color: '#EF4444' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                                >
                                    {acting === r.id ? "Cancelling..." : "Cancel request"}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {modal && (
                <Modal title="Send cooperation request" onClose={() => setModal(null)} width="max-w-[480px]">
                    <div className="p-4 rounded-xl mb-5 flex items-center gap-3" style={{ background: 'var(--color-background)' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                            {(modal.first_name || modal.username).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Dietitian:</div>
                            <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{modal.first_name ? `${modal.first_name} ${modal.last_name || ''}` : modal.username}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block">
                            <span className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                                Message (optional)
                            </span>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Write a few words about yourself and your goal..."
                                rows={3}
                                className="w-full box-border px-4 py-3 text-sm rounded-xl outline-none resize-y transition-colors"
                                style={{
                                    background: 'var(--color-background)',
                                    border: '1.5px solid var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </label>
                        <div className="flex gap-2.5 justify-end mt-6">
                            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
                            <Btn onClick={sendRequest} disabled={sending}>
                                {sending ? "Sending..." : "Send request"}
                            </Btn>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}