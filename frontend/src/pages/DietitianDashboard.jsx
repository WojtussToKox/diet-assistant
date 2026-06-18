import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { useState } from "react";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button as Btn } from "../components/ui/Button";
import { AiOutlineUserDelete } from "react-icons/ai";

function PatientCard({ patient, reload, toast }) {
    const { data: plans } = useList(`/diet-plans/`);
    const patientPlans = plans.filter(p => p.patient === patient.id);
    const today = new Date().toISOString().slice(0, 10);
    const activePlan = patientPlans.find(
        p => p.start_date <= today && today <= p.end_date
    );

    const initials = (patient.first_name || patient.username).slice(0, 1).toUpperCase();

    const removePatient = async () => {
        const name = patient.first_name || patient.username;
        if (!window.confirm(`Are you sure you want to end cooperation with patient ${name}?`)) return;

        try {
            await apiFetch(`/users/end-cooperation/${patient.id}/`, { method: "POST" });
            toast("Cooperation ended successfully.", "success");
            reload();
        } catch (e) {
            toast("Error: " + e.message, "error");
        }
    };

    return (
        <div className="rounded-2xl p-5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                        {patient.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : patient.username}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {patient.email || `@${patient.username}`}
                    </div>
                </div>

                <button
                    onClick={removePatient}
                    title="End cooperation"
                    className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-colors shrink-0"
                    style={{ background: '#FEF2F2', color: '#EF4444' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                >
                    <AiOutlineUserDelete />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {patient.height_cm && (
                    <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-background)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Height</span>
                        <div className="font-mono font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                            {patient.height_cm} cm
                        </div>
                    </div>
                )}
                {patient.weight_kg && (
                    <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-background)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Weight</span>
                        <div className="font-mono font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                            {patient.weight_kg} kg
                        </div>
                    </div>
                )}
            </div>

            {/* Plany diety pacjenta */}
            {patientPlans.length > 0 ? (
                <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: 'var(--color-text-muted)' }}>
                        Plany diety ({patientPlans.length})
                    </div>
                    {patientPlans.slice(0, 2).map(plan => (
                        <div key={plan.id} className="flex justify-between items-center px-3 py-2 rounded-lg text-xs"
                            style={{ background: 'var(--color-background)' }}>
                            <span className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                {plan.name}
                            </span>
                            <span className="font-mono shrink-0 ml-2" style={{ color: 'var(--color-accent)' }}>
                                {plan.daily_calories_goal} kcal
                            </span>
                        </div>
                    ))}
                    {patientPlans.length > 2 && (
                        <div className="text-xs text-center py-1" style={{ color: 'var(--color-text-muted)' }}>
                            +{patientPlans.length - 2} więcej
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-xs text-center py-3 rounded-lg"
                    style={{ background: 'var(--color-background)', color: 'var(--color-text-muted)' }}>
                    Brak planów diety
                </div>
            )}
        </div>
    );
}

function PendingRequests({ toast, onAccepted }) {
    const { data: requests, loading, reload } = useList("/users/dietitian-requests/");
    const [acting, setActing] = useState(null);

    const pending = requests.filter(r => r.status === 'PENDING');
    if (loading || pending.length === 0) return null;

    const handle = async (id, action) => {
        setActing(id);
        try {
            await apiFetch(`/users/dietitian-requests/${id}/${action}/`, { method: "POST" });
            toast(action === 'accept' ? "Zaakceptowano!" : "Odrzucono.", "success");
            reload();
            if (action === 'accept') onAccepted();
        } catch (e) {
            toast("Błąd: " + e.message, "error");
        } finally {
            setActing(null);
        }
    };

    return (
        <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3"
                style={{ color: 'var(--color-text-muted)' }}>
                Oczekujące prośby ({pending.length})
            </h3>
            <div className="grid gap-2">
                {pending.map(r => (
                    <div key={r.id}
                        className="flex items-center justify-between px-5 py-4 rounded-2xl"
                        style={{
                            background: 'var(--color-surface)',
                            border: '2px solid #FCD34D',
                        }}>
                        <div>
                            <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                                {r.patient_name || r.patient_username}
                            </div>
                            {r.message && (
                                <div className="text-xs mt-1 italic" style={{ color: 'var(--color-text-muted)' }}>
                                    "{r.message}"
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Btn
                                size="sm"
                                variant="secondary"
                                disabled={acting === r.id}
                                onClick={() => handle(r.id, 'reject')}
                            >
                                Odrzuć
                            </Btn>
                            <Btn
                                size="sm"
                                disabled={acting === r.id}
                                onClick={() => handle(r.id, 'accept')}
                            >
                                Akceptuj
                            </Btn>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DietitianDashboard({ user, toast }) {
    const { data: patients, loading, reload } = useList("/users/my-patients/");

    return (
        <div className="pb-16 animate-fadeUp">
            <div className="mb-8">
                <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Moi podopieczni
                </h2>
                <p className="m-0 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {loading ? '…' : `${patients.length} przypisanych pacjentów`}
                </p>
            </div>

            <PendingRequests toast={toast} onAccepted={reload} />

            {loading ? <Spinner /> : patients.length === 0 ? (
                <EmptyState icon="👥" title="Brak podopiecznych"
                    sub="Nowi pacjenci mogą wysłać Ci prośbę o współpracę." />
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {patients.map(p => <PatientCard key={p.id} patient={p} reload={reload} toast={toast} />)}
                </div>
            )}
        </div>
    );
}