import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button as Btn } from "../components/ui/Button";
import { useState, useEffect, useRef } from "react";
import { FaTimes, FaUsers } from "react-icons/fa";

// SearchablePlanSelect
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
                            className="w-full p-2 text-sm outline-none rounded-lg border border-border transition-colors"
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
                                <span className="truncate">{plan.name}</span>
                                <span className="text-[10px] ml-2 shrink-0 opacity-70">{plan.daily_calories_goal} kcal</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// PatientCard
function PatientCard({ patient, reload, toast, onCustomizePlan }) {
    const { data: plans, reload: reloadPlans } = useList(`/diet-plans/`);
    const [assigning, setAssigning] = useState(false);

    const patientPlans = plans.filter(p => p.patient === patient.id);
    const activePlan = patientPlans.length > 0 ? patientPlans[patientPlans.length - 1] : null;

    const availablePlans = plans.filter(p => p.patient === null);
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

    const assignPlan = async (planId) => {
        setAssigning(true);
        try {
            await apiFetch(`/diet-plans/${planId}/assign_to_patient/`, { // NOWA WERSJA
                method: "POST",
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
                    <FaTimes />
                </button>
            </div>

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
                    <div className="flex justify-between items-center mt-1">
                        <div className="font-medium text-sm truncate pr-2" style={{ color: 'var(--color-text)' }}>
                            {activePlan.name}
                        </div>
                        <Btn size="sm" variant="secondary" onClick={() => onCustomizePlan(activePlan.id)}>
                            Customize
                        </Btn>
                    </div>
                </div>
            )}

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

    const handle = async (id, action) => {
        setActing(id);
        try {
            await apiFetch(`/users/dietitian-requests/${id}/${action}/`, { method: "POST" });
            toast(`Request ${action === 'accept' ? 'accepted' : 'rejected'}.`, "success");
            reload();
            if (action === 'accept') onAccepted();
        } catch (e) {
            toast("Error: " + e.message, "error");
        } finally {
            setActing(null);
        }
    };

    if (loading || pending.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="m-0 text-lg font-bold" style={{ color: 'var(--color-text)' }}>Cooperation requests</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent)', color: '#fff' }}>
                    {pending.length} {pending.length === 1 ? 'new request' : 'new requests'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {pending.map(r => (
                    <div key={r.id} className="p-4 rounded-2xl flex flex-col justify-between border border-accent/30" style={{ background: 'var(--color-accent-xlight)' }}>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-60" style={{ color: 'var(--color-accent)' }}>Pending request</div>
                            <div className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>{r.patient_name}</div>
                            {r.message && (
                                <div className="mt-2 text-sm italic opacity-80" style={{ color: 'var(--color-text)' }}>
                                    "{r.message}"
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Btn
                                variant="secondary" size="sm"
                                disabled={acting === r.id}
                                onClick={() => handle(r.id, 'reject')}
                            >
                                Reject
                            </Btn>
                            <Btn
                                size="sm"
                                disabled={acting === r.id}
                                onClick={() => handle(r.id, 'accept')}
                            >
                                Accept
                            </Btn>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DietitianDashboard({ user, toast, onCustomizePlan }) {
    const { data: patients, loading, reload } = useList("/users/my-patients/");

    return (
        <div className="pb-16 animate-fadeUp">
            <div className="mb-8">
                <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    My Patients
                </h2>
                <p className="m-0 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {loading ? '…' : `${patients.length} assigned patients`}
                </p>
            </div>

            <PendingRequests toast={toast} onAccepted={reload} />

            {loading ? <Spinner /> : patients.length === 0 ? (
                <EmptyState icon={<FaUsers className="text-4xl opacity-50" />} title="No patients"
                    sub="New patients can send you a cooperation request." />
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {patients.map(p => <PatientCard key={p.id} patient={p} reload={reload} toast={toast} onCustomizePlan={onCustomizePlan} />)}
                </div>
            )}
        </div>
    );
}