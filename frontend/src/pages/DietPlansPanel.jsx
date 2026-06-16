import { useState } from "react";
import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Button as Btn } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";

export default function DietPlansPanel({ toast }) {
  const { data: plans, loading, reload } = useList("/diet-plans/");
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: "", patient: "", start_date: "", end_date: "", daily_calories_goal: "" });
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm({ name: "", patient: "", start_date: "", end_date: "", daily_calories_goal: "" });
    setModal("add");
  };

  const openDetail = async (plan) => {
    try {
      const d = await apiFetch(`/diet-plans/${plan.id}/`);
      setDetail(d);
    } catch { toast("Błąd ładowania", "error"); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, patient: Number(form.patient), daily_calories_goal: Number(form.daily_calories_goal) };
      if (modal === "add") {
        await apiFetch("/diet-plans/", { method: "POST", body: JSON.stringify(payload) });
        toast("Plan diety utworzony", "success");
      } else {
        await apiFetch(`/diet-plans/${modal.id}/`, { method: "PUT", body: JSON.stringify(payload) });
        toast("Plan zaktualizowany", "success");
      }
      setModal(null); reload();
    } catch (e) { toast("Błąd: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Usunąć plan diety?")) return;
    try {
      await apiFetch(`/diet-plans/${id}/`, { method: "DELETE" });
      toast("Plan usunięty", "success"); reload();
    } catch { toast("Błąd usuwania", "error"); }
  };

  const daysBetween = (start, end) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1;
  };

  const isActive = (plan) => {
    const today = new Date().toISOString().slice(0, 10);
    return plan.start_date <= today && today <= plan.end_date;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="m-0 text-2xl font-bold text-text">Plany Diety</h2>
          <p className="m-0 mt-1 text-text-muted text-sm">{plans.length} planów</p>
        </div>
        <Btn onClick={openAdd}>＋ Nowy plan</Btn>
      </div>

      {loading ? <Spinner /> : plans.length === 0 ? (
        <EmptyState icon="📋" title="Brak planów diety" sub="Utwórz plan, przypisz go do pacjenta i dodaj dzienne menu." action={<Btn onClick={openAdd}>Utwórz plan</Btn>} />
      ) : (
        <div className="grid gap-3">
          {plans.map(plan => (
            <Card key={plan.id} hover onClick={() => openDetail(plan)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-bold text-base text-text">{plan.name}</span>
                    {isActive(plan) ? <Badge variant="accent">Aktywny</Badge> : <Badge variant="muted">Nieaktywny</Badge>}
                  </div>
                  <div className="flex gap-4 text-[13px] text-text-muted">
                    <span>👤 Pacjent #{plan.patient}</span>
                    <span>📅 {plan.start_date} → {plan.end_date}</span>
                    <span>⏱️ {daysBetween(plan.start_date, plan.end_date)} dni</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-mono font-bold text-xl text-accent leading-none">{plan.daily_calories_goal}</div>
                    <div className="text-[11px] text-text-muted mt-1">kcal/dzień</div>
                  </div>
                  <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                    <Btn variant="ghost" size="sm" onClick={() => { setForm({ name: plan.name, patient: String(plan.patient), start_date: plan.start_date, end_date: plan.end_date, daily_calories_goal: String(plan.daily_calories_goal) }); setModal(plan); }}>✏️</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => remove(plan.id)}>🗑️</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && <DietPlanDetail plan={detail} onClose={() => setDetail(null)} toast={toast} />}

      {modal && (
        <Modal title={modal === "add" ? "Nowy plan diety" : "Edytuj plan"} onClose={() => setModal(null)}>
          <div className="grid gap-3.5">
            <Input label="Nazwa planu" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required placeholder="np. Plan odchudzający" />
            <Input label="ID Pacjenta" type="number" value={form.patient} onChange={v => setForm(f => ({ ...f, patient: v }))} required placeholder="np. 2" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data rozpoczęcia" type="date" value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} required />
              <Input label="Data zakończenia" type="date" value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} required />
            </div>
            <Input label="Cel kaloryczny (kcal/dzień)" type="number" value={form.daily_calories_goal} onChange={v => setForm(f => ({ ...f, daily_calories_goal: v }))} required placeholder="np. 2000" min="0" />
            <div className="flex gap-2.5 justify-end mt-1">
              <Btn variant="secondary" onClick={() => setModal(null)}>Anuluj</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Tworzenie…" : "Zapisz plan"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Komponenty wewnętrzne używane wyłącznie w widoku diet
function DietPlanDetail({ plan, onClose, toast }) {
  const { data: menus, loading, reload } = useList(`/daily-menus/?diet_plan=${plan.id}`, [plan.id]);
  const { data: recipes } = useList("/recipes/");
  const [addMenuModal, setAddMenuModal] = useState(false);
  const [mealModal, setMealModal] = useState(null);
  const [dayNum, setDayNum] = useState("");
  const [mealForm, setMealForm] = useState({ meal_type: "", recipe: "" });
  const [saving, setSaving] = useState(false);

  const MEAL_TYPES = [
    { value: "BREAKFAST", label: "Śniadanie" },
    { value: "LUNCH", label: "II Śniadanie" },
    { value: "DINNER", label: "Obiad" },
    { value: "SNACK", label: "Podwieczorek" },
    { value: "SUPPER", label: "Kolacja" },
  ];

  const addMenu = async () => {
    if (!dayNum) return;
    setSaving(true);
    try {
      await apiFetch("/daily-menus/", { method: "POST", body: JSON.stringify({ diet_plan: plan.id, day_number: Number(dayNum) }) });
      toast("Dzień dodany", "success"); setAddMenuModal(false); setDayNum(""); reload();
    } catch (e) { toast("Błąd: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const removeMenu = async (id) => {
    if (!window.confirm("Usunąć ten dzień?")) return;
    try {
      await apiFetch(`/daily-menus/${id}/`, { method: "DELETE" });
      toast("Dzień usunięty", "success"); reload();
    } catch { toast("Błąd", "error"); }
  };

  const addMeal = async () => {
    setSaving(true);
    try {
      await apiFetch("/scheduled-meals/", { method: "POST", body: JSON.stringify({ daily_menu: mealModal.id, meal_type: mealForm.meal_type, recipe: Number(mealForm.recipe) }) });
      toast("Posiłek dodany", "success"); setMealModal(null); setMealForm({ meal_type: "", recipe: "" }); reload();
    } catch (e) { toast("Błąd: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const removeMeal = async (id) => {
    try {
      await apiFetch(`/scheduled-meals/${id}/`, { method: "DELETE" });
      toast("Posiłek usunięty", "success"); reload();
    } catch { toast("Błąd", "error"); }
  };

  const sorted = [...menus].sort((a, b) => a.day_number - b.day_number);

  return (
    <Modal title={`📋 ${plan.name}`} onClose={onClose} width="max-w-[680px]">
      <div className="flex gap-4 mb-5 flex-wrap">
        <div className="py-2.5 px-4 bg-background rounded-lg flex-1 min-w-[120px]">
          <div className="text-[11px] text-text-muted mb-0.5">PACJENT</div>
          <div className="font-bold text-text">#{plan.patient}</div>
        </div>
        <div className="py-2.5 px-4 bg-background rounded-lg flex-1 min-w-[120px]">
          <div className="text-[11px] text-text-muted mb-0.5">OKRES</div>
          <div className="font-bold text-text text-[13px]">{plan.start_date} — {plan.end_date}</div>
        </div>
        <div className="py-2.5 px-4 bg-accent-xlight rounded-lg flex-1 min-w-[120px]">
          <div className="text-[11px] text-accent mb-0.5">CEL KALORII</div>
          <div className="font-bold text-accent text-lg font-mono leading-none">{plan.daily_calories_goal} kcal</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h4 className="m-0 text-[15px] font-bold text-text">Dni planu ({sorted.length})</h4>
        <Btn variant="secondary" size="sm" onClick={() => setAddMenuModal(true)}>＋ Dodaj dzień</Btn>
      </div>

      {loading ? <Spinner /> : sorted.length === 0 ? (
        <div className="p-5 text-center text-text-muted text-sm bg-background rounded-xl">
          Brak dni. Dodaj pierwszy dzień planu.
        </div>
      ) : (
        <div className="grid gap-2.5">
          {sorted.map(menu => (
            <DayMenuCard key={menu.id} menu={menu} recipes={recipes} onAddMeal={() => setMealModal(menu)} onRemoveMeal={removeMeal} onRemoveMenu={() => removeMenu(menu.id)} toast={toast} />
          ))}
        </div>
      )}

      {addMenuModal && (
        <Modal title="Dodaj dzień" onClose={() => setAddMenuModal(false)} width="max-w-[360px]">
          <Input label="Numer dnia" type="number" value={dayNum} onChange={setDayNum} min="1" required placeholder="np. 1" />
          <div className="flex gap-2.5 justify-end mt-4">
            <Btn variant="secondary" onClick={() => setAddMenuModal(false)}>Anuluj</Btn>
            <Btn onClick={addMenu} disabled={saving || !dayNum}>Dodaj</Btn>
          </div>
        </Modal>
      )}

      {mealModal && (
        <Modal title={`Dodaj posiłek — Dzień ${mealModal.day_number}`} onClose={() => setMealModal(null)} width="max-w-[400px]">
          <div className="grid gap-3.5">
            <Select label="Typ posiłku" value={mealForm.meal_type} onChange={v => setMealForm(f => ({ ...f, meal_type: v }))} options={MEAL_TYPES} placeholder="Wybierz typ…" required />
            <Select label="Przepis" value={mealForm.recipe} onChange={v => setMealForm(f => ({ ...f, recipe: v }))} options={recipes.map(r => ({ value: String(r.id), label: r.name }))} placeholder="Wybierz przepis…" required />
            <div className="flex gap-2.5 justify-end mt-1">
              <Btn variant="secondary" onClick={() => setMealModal(null)}>Anuluj</Btn>
              <Btn onClick={addMeal} disabled={saving || !mealForm.meal_type || !mealForm.recipe}>Dodaj posiłek</Btn>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function DayMenuCard({ menu, recipes, onAddMeal, onRemoveMeal, onRemoveMenu }) {
  const [expanded, setExpanded] = useState(true);
  const { data: meals, reload } = useList(`/scheduled-meals/?daily_menu=${menu.id}`, [menu.id]);

  const MEAL_LABELS = { BREAKFAST: "Śniadanie", LUNCH: "II Śniadanie", DINNER: "Obiad", SNACK: "Podwieczorek", SUPPER: "Kolacja" };
  const MEAL_ICONS = { BREAKFAST: "🌅", LUNCH: "🍎", DINNER: "🍽️", SNACK: "🥐", SUPPER: "🌙" };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-background cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-[15px] text-text">Dzień {menu.day_number}</span>
          <Badge variant="accent">{meals.length} posiłków</Badge>
        </div>
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <Btn variant="ghost" size="sm" onClick={onAddMeal}>＋ Posiłek</Btn>
          <Btn variant="ghost" size="sm" onClick={onRemoveMenu}>🗑️</Btn>
          <span className="text-text-muted cursor-pointer px-2 py-1 text-sm ml-1" onClick={() => setExpanded(e => !e)}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pt-2 pb-3">
          {meals.length === 0 ? (
            <div className="py-3 text-text-muted text-[13px] text-center">Brak posiłków — dodaj pierwszy.</div>
          ) : (
            <div className="grid gap-1.5 mt-2">
              {meals.map(meal => (
                <div key={meal.id} className="flex justify-between items-center py-2 px-3 bg-surface rounded-lg border border-border">
                  <span className="text-[13px]">
                    {MEAL_ICONS[meal.meal_type] || "🍴"} <strong>{MEAL_LABELS[meal.meal_type] || meal.meal_type}</strong>
                    {" · "}
                    <span className="text-text-muted">{recipes.find(r => r.id === meal.recipe)?.name ?? `Przepis #${meal.recipe}`}</span>
                  </span>
                  <button onClick={() => { onRemoveMeal(meal.id); reload(); }} className="bg-transparent border-none cursor-pointer text-text-muted text-sm px-1.5 py-0.5 rounded hover:bg-background">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}