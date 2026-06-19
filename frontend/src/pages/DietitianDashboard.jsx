import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button as Btn } from "../components/ui/Button";
import { AiOutlineUserDelete } from "react-icons/ai";
import { useState, useEffect, useRef } from "react";

function SearchablePlanSelect({ plans, currentPlanId, onAssign, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentPlan = plans.find(p => p.id === currentPlanId);
    const filtered = plans.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative w-full mt-3" ref={wrapperRef}>
            <div
                className={`p-2.5 rounded-xl text-sm cursor-pointer border transition-colors ${isOpen ? 'border-accent' : 'border-border'} flex justify-between items-center`}
                style={{ background: 'var(--color-background)', color: currentPlan ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="truncate">{currentPlan ? currentPlan.name : "Assign a diet plan..."}</span>
                <span className="text-xs">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-48 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-border">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search plan by name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full p-2 text-sm outline-none rounded-lg border border-border"
                            style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}
                        />
                    </div>
                    <div className="overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>No plans found</div>
                        ) : filtered.map(plan => (
                            <div
                                key={plan.id}
                                onClick={() => {
                                    onAssign(plan.id);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                className="p-2 text-sm rounded-lg cursor-pointer transition-colors flex justify-between items-center"
                                style={{ color: 'var(--color-text)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-xlight)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text)'; }}
                            >
                                <div className="min-w-0">
                                    <span className="truncate block">{plan.name}</span>
                                    {plan.dietitian_name && (
                                        <span className="text-[10px] opacity-60 block">{plan.dietitian_name}</span>
                                    )}
                                </div>
                                <span className="text-[10px] ml-2 shrink-0 opacity-70">{plan.daily_calories_goal} kcal</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PatientCard({ patient, reload, toast }) {
    const { data: plans, reload: reloadPlans } = useList(`/diet-plans/`);
    const [assigning, setAssigning] = useState(false);

    // Find active plan for this patient
    const patientPlans = plans.filter(p => p.patient === patient.id);
    const activePlan = patientPlans.length > 0 ? patientPlans[patientPlans.length - 1] : null;

    // Filter available plans to show only unassigned templates OR the currently assigned one
    const availablePlans = plans.filter(p => p.patient === null || p.patient === patient.id);

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

    // PATCH request to assign the plan to the patient
    const assignPlan = async (planId) => {
        setAssigning(true);
        try {
            await apiFetch(`/diet-plans/${planId}/`, {
                method: "PATCH",
                body: JSON.stringify({ patient: patient.id })
            });
            toast("Diet plan assigned successfully!", "success");
            reloadPlans();
        } catch (e) {
            toast("Error assigning plan: " + e.message, "error");
        } finally {
            setAssigning(false);
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
                    ✕
                </button>
            </div>

            {/* Display active plan info if it exists */}
            {activePlan && (
                <div className="px-4 py-3 rounded-xl mb-3" style={{ background: 'var(--color-background)' }}>
                    <div className="flex justify-between items-start mb-1">
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                            Active plan
                        </div>
                        <div className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
                            {activePlan.daily_calories_goal} kcal / day
                        </div>
                    </div>
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                        {activePlan.name}
                    </div>
                    {activePlan.dietitian_name && (
                        <div className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                            autor: {activePlan.dietitian_name}
                        </div>
                    )}
                </div>
            )}

            {/* Searchable Dropdown for assigning a plan */}
            <SearchablePlanSelect
                plans={availablePlans}
                currentPlanId={activePlan?.id}
                onAssign={assignPlan}
                disabled={assigning}
            />
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