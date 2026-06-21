import { useState, useEffect } from "react";
import { useList } from "../hooks/useList";
import { Button as Btn } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiArrowLeft } from "react-icons/fi";
import { apiFetch } from "../services/api";
import { exportShoppingListCsv } from "../services/api";
import { FiDownload } from "react-icons/fi";

const DAYS = [
  { id: 1, name: "Monday" }, { id: 2, name: "Tuesday" }, { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" }, { id: 5, name: "Friday" }, { id: 6, name: "Saturday" }, { id: 7, name: "Sunday" }
];

const MEALS = [
  { id: "BREAKFAST", name: "BREAKFAST", icon: "🍳" },
  { id: "LUNCH", name: "LUNCH", icon: "🥪" },
  { id: "DINNER", name: "DINNER", icon: "🍲" },
  { id: "SNACK", name: "SNACK", icon: "🍎" },
  { id: "SUPPER", name: "SUPPER", icon: "🌙" },
];

export default function DietPlansPanel({ toast, user, targetPlanId, setTargetPlanId, returnPage, onReturn }) {
  const { data: plans, loading: loadingPlans, reload: reloadPlans } = useList("/diet-plans/");
  const { data: recipes } = useList("/recipes/");
  const { data: products } = useList("/products/");

  // view: "list" | "builder" (edycja/dietetyk) | "view-readonly" (podgląd dla pacjenta)
  const [view, setView] = useState("list");
  const [form, setForm] = useState({ name: "", daily_calories_goal: "2000" });
  const [boardMeals, setBoardMeals] = useState([]);
  const [sidebarTab, setSidebarTab] = useState("recipes");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null); // null = tworzenie nowego, number = edycja istniejącego
  const [loadingPlanDetail, setLoadingPlanDetail] = useState(false);
  const [viewingPlan, setViewingPlan] = useState(null); // dane planu w trybie podglądu
  const [analytics, setAnalytics] = useState(null);
  const [activePlanId, setActivePlanId] = useState(() => {const saved = localStorage.getItem('activePlanId');return saved ? Number(saved) : null;});
  const role = user?.role;
  const isDietitian = role === "DIETITIAN";

  const openBuilder = () => {
    setEditingPlanId(null);
    setForm({ name: "New plan", daily_calories_goal: "2000" });
    setBoardMeals([]);
    setAnalytics(null);
    setView("builder");
  };

  // Wspólna funkcja do ładowania szczegółów planu (używana zarówno przy edycji jak i podglądzie)
  const loadPlanMeals = (detail) => {
    const loadedMeals = [];
    (detail.daily_menus || []).forEach(menu => {
      (menu.meals || []).forEach(meal => {
        const isRecipe = !!meal.recipe;
        const itemId = isRecipe ? meal.recipe : meal.product;
        const sourceList = isRecipe ? recipes : products;
        const sourceItem = sourceList.find(i => i.id === itemId);

        loadedMeals.push({
          uuid: crypto.randomUUID(),
          dayId: menu.day_of_week,
          mealId: meal.meal_type,
          isRecipe,
          itemId,
          name: sourceItem ? sourceItem.name : (isRecipe ? "Recipe" : "Product"),
          weight: meal.weight_in_grams,
        });
      });
    });
    return loadedMeals;
  };

  const openEdit = async (plan) => {
    setLoadingPlanDetail(true);
    try {
      const detail = await apiFetch(`/diet-plans/${plan.id}/`);

      try {
        const stats = await apiFetch(`/diet-plans/${plan.id}/analytics/`);
        setAnalytics(stats);
      } catch(e) { setAnalytics(null); }

      setEditingPlanId(plan.id);
      setForm({
        name: detail.name,
        daily_calories_goal: String(detail.daily_calories_goal),
      });
      setBoardMeals(loadPlanMeals(detail));
      setView("builder");
    } catch (e) {
      toast("Błąd ładowania planu: " + e.message, "error");
    } finally {
      setLoadingPlanDetail(false);
    }
  };

  useEffect(() => {
    if (targetPlanId && plans.length > 0) {
      const planToOpen = plans.find(p => p.id === targetPlanId);
      if (planToOpen) {
        openEdit(planToOpen);
        setTargetPlanId(null);
      }
    }
  }, [targetPlanId, plans]);

  const handleExit = () => {
    if (returnPage) {
      onReturn();
    } else {
      setView("list");
    }
  };

  const openView = async (plan) => {
    setLoadingPlanDetail(true);
    try {
      const detail = await apiFetch(`/diet-plans/${plan.id}/`);

      try {
        const stats = await apiFetch(`/diet-plans/${plan.id}/analytics/`);
        setAnalytics(stats);
      } catch(e) { setAnalytics(null); }

      setViewingPlan({
        name: detail.name,
        daily_calories_goal: detail.daily_calories_goal,
        dietitian_name: detail.dietitian_name,
      });
      setBoardMeals(loadPlanMeals(detail));
      setView("view-readonly");
    } catch (e) {
      toast("Błąd ładowania planu: " + e.message, "error");
    } finally {
      setLoadingPlanDetail(false);
    }
  };

  const removePlan = async (planId) => {
    if (!window.confirm("Usunąć ten szablon planu diety? Tej operacji nie można odwrócić.")) return;

    setDeletingId(planId);
    try {
      await apiFetch(`/diet-plans/${planId}/`, { method: "DELETE" });
      toast("Szablon usunięty", "success");
      reloadPlans();
    } catch (e) {
      toast("Błąd usuwania: " + e.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragStartSidebar = (e, item, isRecipe) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'sidebar', isRecipe, itemId: item.id, name: item.name
    }));
  };

  const handleExportShoppingList = async (planId) => {
    try {
        await exportShoppingListCsv(planId);
        toast("Shopping list exported successfully!", "success");
    } catch (e) {
        toast("Failed to export shopping list.", "error");
    }
};

  const handleDragStartBoard = (e, uuid) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'board', uuid }));
  };

  const handleDrop = (e, dayId, mealId) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const parsed = JSON.parse(data);

    if (parsed.source === 'sidebar') {
      let weight = null;
      if (!parsed.isRecipe) {
        weight = prompt(`Podaj wagę dla: ${parsed.name} (w gramach):`, "100");
        if (!weight || isNaN(weight)) return;
      }

      setBoardMeals(prev => [...prev, {
        uuid: crypto.randomUUID(),
        dayId, mealId, isRecipe: parsed.isRecipe, itemId: parsed.itemId,
        name: parsed.name, weight: weight ? parseInt(weight) : null
      }]);
    } else if (parsed.source === 'board') {
      setBoardMeals(prev => prev.map(m => m.uuid === parsed.uuid ? { ...m, dayId, mealId } : m));
    }
  };

  const removeMeal = (uuid) => setBoardMeals(prev => prev.filter(m => m.uuid !== uuid));

  // Funkcja licząca kalorie dla konkretnego dnia
  const getDayCalories = (dayId) => {
    const dayMeals = boardMeals.filter(m => m.dayId === dayId);
    let total = 0;

    dayMeals.forEach(m => {
      if (m.isRecipe) {
        const recipe = recipes.find(r => r.id === m.itemId);
        if (recipe && recipe.total_calories) total += recipe.total_calories;
      } else {
        const product = products.find(p => p.id === m.itemId);
        if (product && product.calories_per_100g) {
          total += (product.calories_per_100g / 100) * m.weight;
        }
      }
    });
    return Math.round(total);
  };

  const savePlan = async () => {
    if (!form.name || !form.daily_calories_goal) {
      toast("Wypełnij nazwę i cel kalorii", "error");
      return;
    }

    const daysPayload = [];
    DAYS.forEach(day => {
      const dayMeals = boardMeals.filter(m => m.dayId === day.id);
      if (dayMeals.length > 0) {
        daysPayload.push({
          day_of_week: day.id,
          meals: dayMeals.map(m => ({
            meal_type: m.mealId,
            recipe: m.isRecipe ? m.itemId : null,
            product: !m.isRecipe ? m.itemId : null,
            weight_in_grams: !m.isRecipe ? m.weight : null
          }))
        });
      }
    });

    const payload = {
      name: form.name,
      daily_calories_goal: Number(form.daily_calories_goal),
      days: daysPayload
    };

    setSaving(true);
    try {
      if (editingPlanId) {
        await apiFetch(`/diet-plans/${editingPlanId}/bulk-update/`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        toast("Szablon planu został zaktualizowany!", "success");
      } else {
        await apiFetch("/diet-plans/bulk-create/", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast("Szablon planu został zapisany!", "success");
      }

      reloadPlans();
      handleExit();
      setEditingPlanId(null);
    } catch (e) {
      toast("Błąd: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // --- FUNKCJA RENDERUJĄCA WYNIKI Z PANDAS ---
  const renderAnalytics = () => {
    if (!analytics || !analytics.averages) return null;
    return (
      <div className="mb-6 p-5 bg-surface border border-border rounded-2xl shadow-sm shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📊</span>
          <h3 className="m-0 text-sm font-bold uppercase tracking-widest text-text-muted">Plan Analysis</h3>
        </div>

        <div className="flex gap-4 w-full mb-4">
          <div className="flex-1 p-3 bg-background border border-border rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Avg Kcal</div>
            <div className="text-xl font-black text-text">{analytics.averages.avg_calories}</div>
          </div>
          <div className="flex-1 p-3 bg-background border border-border rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Avg Protein</div>
            <div className="text-xl font-black text-accent">{analytics.averages.avg_protein}g</div>
          </div>
          <div className="flex-1 p-3 bg-background border border-border rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Avg Fat</div>
            <div className="text-xl font-black text-accent">{analytics.averages.avg_fat}g</div>
          </div>
          <div className="flex-1 p-3 bg-background border border-border rounded-xl text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Avg Carbs</div>
            <div className="text-xl font-black text-accent">{analytics.averages.avg_carbs}g</div>
          </div>
        </div>

        {/* Sekcja wyłapanych odchyleń przez Pandas */}
        {analytics.deviations && analytics.deviations.length > 0 && (
          <div className="p-4 bg-danger-light border border-danger/30 rounded-xl text-sm text-danger shadow-sm">
            <span className="font-bold flex items-center gap-1">⚠️ Calorie deviations detected (&gt;20%):</span>
            <ul className="mt-2 ml-5 list-disc mb-0 font-medium">
              {analytics.deviations.map((d, idx) => (
                <li key={idx} className="mb-1">
                  Day {d.day_number}: <span className="font-bold">{d.calories} kcal</span> (Goal: {d.goal} kcal) —
                  deviation of {Math.abs(d.deviation_pct)}% ({d.status === 'OVER' ? 'Surplus' : 'Deficit'})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // ---------- WIDOK LISTY ----------
  if (view === "list") {
    const displayedPlans = isDietitian ? plans.filter(p => p.patient === null) : plans;    return (
      <div className="pb-16 animate-fadeUp">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Diet plans</h2>
          </div>
          {isDietitian && (
            <Btn onClick={openBuilder}>
              <span className="flex items-center gap-1.5"><FiPlus /> Create new plan</span>
            </Btn>
          )}
        </div>

        {loadingPlans || loadingPlanDetail ? <Spinner /> : plans.length === 0 ? (
          <EmptyState icon="📅" title="No plans yet" sub="Create your first one now." />
        ) : (
          <div className="grid gap-3">
            {displayedPlans.map(p => {
              const isDefaultActive = !activePlanId && p.id === displayedPlans[displayedPlans.length - 1]?.id;
              const isActive = activePlanId === p.id || isDefaultActive;

              return (
              <div
                key={p.id}
                onClick={() => openView(p)}
                className="flex justify-between items-center p-5 rounded-2xl cursor-pointer transition-colors"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div>
                  <div className="font-bold text-base" style={{ color: 'var(--color-text)' }}>{p.name}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Calorie goal: <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{p.daily_calories_goal} kcal</span>
                  </div>
                  {p.dietitian_name && (
                    <div className="text-xs mt-1.5" style={{ color: 'var(--color-text-subtle)' }}>
                      created by: {p.dietitian_name}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  {!isDietitian && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePlanId(p.id);
                        localStorage.setItem('activePlanId', p.id);
                        toast("Diet plan activated!", "success");
                      }}
                      disabled={isActive}
                      className={`h-9 px-3 rounded-xl flex items-center justify-center border transition-colors text-sm font-semibold ${isActive ? 'bg-accent-xlight border-accent/30 text-accent cursor-default' : 'bg-background border-border text-text-muted hover:border-accent cursor-pointer'}`}
                    >
                      {isActive ? "✓ Active" : "Activate"}
                    </button>
                  )}
                  <button
                    onClick={() => handleExportShoppingList(p.id)}
                    title="Download shopping list"
                    className="h-9 px-3 rounded-xl flex items-center justify-center border-0 cursor-pointer transition-colors text-sm font-semibold gap-1.5"
                    style={{ background: 'var(--color-accent)', color: '#ffffff' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <FiDownload size={16} /> Shopping list
                  </button>
                  <button
                    onClick={() => openView(p)}
                    title="Zobacz plan"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border-0 cursor-pointer transition-colors"
                    style={{ background: 'var(--color-background)', color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <FiEye size={16} />
                  </button>

                  {isDietitian && (
                    <>
                      <button
                        onClick={() => openEdit(p)}
                        title="Edytuj szablon"
                        className="w-9 h-9 rounded-xl flex items-center justify-center border-0 cursor-pointer transition-colors"
                        style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => removePlan(p.id)}
                        disabled={deletingId === p.id}
                        title="Usuń szablon"
                        className="w-9 h-9 rounded-xl flex items-center justify-center border-0 cursor-pointer transition-colors disabled:opacity-40"
                        style={{ background: '#FEF2F2', color: '#EF4444' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
             </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------- WIDOK TYLKO-DO-ODCZYTU (dla pacjenta/standard) ----------
  if (view === "view-readonly") {
    return (
      <div className="flex flex-col h-[85vh] animate-fadeUp">
        <div className="flex justify-between items-center mb-6 bg-surface p-5 rounded-2xl border border-border shrink-0">
          <div>
            <button
              onClick={() => { handleExit(); setViewingPlan(null); }}
              className="flex items-center gap-1.5 text-sm font-semibold border-0 bg-transparent cursor-pointer mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <FiArrowLeft /> Back to list
            </button>
            <h2 className="m-0 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {viewingPlan?.name}
            </h2>
            <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Calorie goal: <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{viewingPlan?.daily_calories_goal} kcal</span>
              {viewingPlan?.dietitian_name && <span> · created by {viewingPlan.dietitian_name}</span>}
            </div>
          </div>
        </div>

        {renderAnalytics()}

        <div className="flex-1 overflow-x-auto overflow-y-auto pb-4">
          <div className="flex gap-4 w-max">
            {DAYS.map(day => {
              const dayKcal = getDayCalories(day.id);
              const targetKcal = viewingPlan?.daily_calories_goal || 0;
              const isOver = dayKcal > targetKcal;

              return (
                <div key={day.id} className="w-[280px] shrink-0 flex flex-col gap-3">
                  <div className="text-center py-2 bg-surface border border-border rounded-xl shadow-sm">
                    <div className="font-bold text-accent">{day.name}</div>
                    <div className="text-xs font-bold mt-0.5" style={{ color: isOver ? '#EF4444' : 'var(--color-text-muted)' }}>
                      {dayKcal} / {targetKcal} kcal
                    </div>
                  </div>

                  {MEALS.map(meal => {
                    const slotMeals = boardMeals.filter(m => m.dayId === day.id && m.mealId === meal.id);
                    return (
                      <div key={meal.id} className="bg-surface border border-border rounded-xl p-3 shadow-sm">
                        <div className="text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-1.5">
                          <span>{meal.icon}</span> {meal.name}
                        </div>

                        <div
                          className={`min-h-[60px] rounded-lg p-1.5 ${slotMeals.length === 0 ? 'border-2 border-dashed border-border bg-background flex items-center justify-center text-xs text-text-subtle' : 'bg-accent-xlight/30 border border-transparent'}`}
                        >
                          {slotMeals.length === 0 ? "No meal" : slotMeals.map(m => (
                            <div
                              key={m.uuid}
                              className="bg-surface border border-border p-2.5 mb-1.5 rounded-lg shadow-sm flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-sm font-semibold text-text truncate">{m.name}</div>
                                {!m.isRecipe && <div className="text-[10px] text-accent font-bold mt-0.5">{m.weight}g</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------- WIDOK BUILDERA (tylko dietetyk: tworzenie/edycja) ----------
  const filteredSidebar = (sidebarTab === 'recipes' ? recipes : products)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-[85vh] animate-fadeUp">
      <div className="flex gap-4 items-end mb-6 bg-surface p-5 rounded-2xl border border-border shrink-0">
        <div className="flex-1">
          <Input
            label="Name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
          />
        </div>
        <div className="w-32">
          <Input
            label="Goal (kcal)"
            type="number"
            value={form.daily_calories_goal}
            onChange={v => setForm(f => ({ ...f, daily_calories_goal: v }))}
          />
        </div>
        <div className="flex gap-2 mb-1">
          <Btn variant="secondary" onClick={() => { handleExit(); setEditingPlanId(null); }}>Cancel</Btn>
          <Btn onClick={savePlan} disabled={saving}>
            {saving ? "Saving..." : editingPlanId ? "Save changes ✓" : "Save ✓"}
          </Btn>
        </div>
      </div>

      {renderAnalytics()}

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-72 flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shrink-0">
          <div className="flex p-2 bg-background border-b border-border">
            <button onClick={() => setSidebarTab('recipes')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border-0 cursor-pointer ${sidebarTab === 'recipes' ? 'bg-surface shadow-sm text-accent' : 'bg-transparent text-text-muted'}`}>Recipes</button>
            <button onClick={() => setSidebarTab('products')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border-0 cursor-pointer ${sidebarTab === 'products' ? 'bg-surface shadow-sm text-accent' : 'bg-transparent text-text-muted'}`}>Products</button>
          </div>
          <div className="p-3 border-b border-border">
            <Input placeholder="Szukaj..." value={search} onChange={v => setSearch(v)} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredSidebar.map(item => (
              <div
                key={item.id} draggable
                onDragStart={(e) => handleDragStartSidebar(e, item, sidebarTab === 'recipes')}
                className="p-3 rounded-xl cursor-grab active:cursor-grabbing border border-border hover:border-accent transition-colors"
                style={{ background: 'var(--color-background)' }}
              >
                <div className="font-semibold text-sm text-text">{item.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Grab & drop →</div>
                  <div className="text-[10px] font-bold text-accent">
                    {sidebarTab === 'recipes' ? `${item.total_calories || 0} kcal` : `${item.calories_per_100g} kcal/100g`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto pb-4 pr-4">
          <div className="flex gap-4 w-max">
            {DAYS.map(day => {
              const dayKcal = getDayCalories(day.id);
              const targetKcal = parseInt(form.daily_calories_goal) || 0;
              const isOver = dayKcal > targetKcal;

              return (
                <div key={day.id} className="w-[280px] shrink-0 flex flex-col gap-3">
                  <div className="text-center py-2 bg-surface border border-border rounded-xl shadow-sm">
                    <div className="font-bold text-accent">{day.name}</div>
                    <div className="text-xs font-bold mt-0.5" style={{ color: isOver ? '#EF4444' : 'var(--color-text-muted)' }}>
                      {dayKcal} / {targetKcal} kcal
                    </div>
                  </div>

                  {MEALS.map(meal => {
                    const slotMeals = boardMeals.filter(m => m.dayId === day.id && m.mealId === meal.id);
                    return (
                      <div key={meal.id} className="bg-surface border border-border rounded-xl p-3 shadow-sm">
                        <div className="text-xs font-bold text-text-muted uppercase mb-2 flex items-center gap-1.5">
                          <span>{meal.icon}</span> {meal.name}
                        </div>

                        <div
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => handleDrop(e, day.id, meal.id)}
                          className={`min-h-[60px] rounded-lg p-1.5 transition-colors ${slotMeals.length === 0 ? 'border-2 border-dashed border-border bg-background flex items-center justify-center text-xs text-text-subtle' : 'bg-accent-xlight/30 border border-transparent'}`}
                        >
                          {slotMeals.length === 0 ? "Upuść tutaj" : slotMeals.map(m => (
                            <div
                              key={m.uuid} draggable
                              onDragStart={(e) => handleDragStartBoard(e, m.uuid)}
                              className="bg-surface border border-border p-2.5 mb-1.5 rounded-lg shadow-sm flex items-center justify-between cursor-grab active:cursor-grabbing group"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-sm font-semibold text-text truncate">{m.name}</div>
                                {!m.isRecipe && <div className="text-[10px] text-accent font-bold mt-0.5">{m.weight}g</div>}
                              </div>
                              <button
                                onClick={() => removeMeal(m.uuid)}
                                className="w-6 h-6 shrink-0 rounded bg-danger-light text-danger border-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                              ><FiTrash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}