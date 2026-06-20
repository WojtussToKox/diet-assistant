import { useState } from "react";
import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button as Btn } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";

const MEALS = [
  { id: "BREAKFAST", name: "Breakfast", icon: "🍳" },
  { id: "LUNCH", name: "Lunch", icon: "🥪" },
  { id: "DINNER", name: "Dinner", icon: "🍲" },
  { id: "SNACK", name: "Snack", icon: "🍎" },
  { id: "SUPPER", name: "Supper", icon: "🌙" },
];

export default function Dashboard({ user, toast }) {
  const safeToast = typeof toast === "function" ? toast : (msg, type) => console.warn(`[toast:${type}]`, msg);

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

  const jsDay = currentDate.getDay();
  const currentDayId = jsDay === 0 ? 7 : jsDay;

  const isToday = currentDate.toDateString() === new Date().toDateString();

  const changeDate = (days) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + days);
    setCurrentDate(nextDate);
  };
  const goToToday = () => setCurrentDate(new Date());

  const { data: plans } = useList("/diet-plans/");
  const { data: dailyMenus } = useList("/daily-menus/");
  const { data: scheduledMeals } = useList("/scheduled-meals/");
  const { data: logs, loading, reload: reloadLogs } = useList(`/meal-logs/?date=${dateStr}`);

  const { data: recipes } = useList("/recipes/");
  const { data: products } = useList("/products/");

  const [addModal, setAddModal] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("recipes");

  const patientPlans = plans.filter(p => p.patient === user?.id);
  const myPlan = patientPlans.length > 0 ? patientPlans[patientPlans.length - 1] : null;
  const hasPlan = !!myPlan;

  const targetMenu = hasPlan ? dailyMenus.find(m => m.diet_plan === myPlan.id && m.day_of_week === currentDayId) : null;
  const targetScheduled = targetMenu ? scheduledMeals.filter(m => m.daily_menu === targetMenu.id) : [];

  let consumedKcal = 0;
  let consumedProtein = 0;
  let consumedFat = 0;
  let consumedCarbs = 0;

  logs.forEach(log => {
    if (log.recipe) {
      const r = recipes.find(rec => rec.id === log.recipe);
      if (r) {
        if (r.total_calories) consumedKcal += parseFloat(r.total_calories);
        if (r.total_protein) consumedProtein += parseFloat(r.total_protein);
        if (r.total_fat) consumedFat += parseFloat(r.total_fat);
        if (r.total_carbs) consumedCarbs += parseFloat(r.total_carbs);
      }
    } else if (log.product) {
      const p = products.find(prod => prod.id === log.product);
      if (p) {
        const multiplier = log.weight_in_grams / 100;
        if (p.calories_per_100g) consumedKcal += parseFloat(p.calories_per_100g) * multiplier;
        if (p.protein_per_100g) consumedProtein += parseFloat(p.protein_per_100g) * multiplier;
        if (p.fat_per_100g) consumedFat += parseFloat(p.fat_per_100g) * multiplier;
        if (p.carbs_per_100g) consumedCarbs += parseFloat(p.carbs_per_100g) * multiplier;
      }
    }
  });

  consumedKcal = Math.round(consumedKcal);
  consumedProtein = Math.round(consumedProtein);
  consumedFat = Math.round(consumedFat);
  consumedCarbs = Math.round(consumedCarbs);

  const targetKcal = hasPlan ? myPlan.daily_calories_goal : (user?.daily_caloric_needs || 2000);
  const remainingKcal = targetKcal - consumedKcal;
  const progressPct = Math.min(100, (consumedKcal / targetKcal) * 100);

  // --- ACTIONS ---

  const togglePlannedMeal = async (scheduled) => {
    const existingLog = logs.find(l =>
      l.meal_type === scheduled.meal_type &&
      l.recipe === scheduled.recipe &&
      l.product === scheduled.product &&
        String(l.weight_in_grams) === String(scheduled.weight_in_grams)
    );

    try {
      if (existingLog) {
        await apiFetch(`/meal-logs/${existingLog.id}/`, { method: "DELETE" });
      } else {
        await apiFetch("/meal-logs/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateStr,
            meal_type: scheduled.meal_type,
            recipe: scheduled.recipe,
            product: scheduled.product,
            weight_in_grams: scheduled.weight_in_grams
          })
        });
      }
      if (reloadLogs) await reloadLogs();
    } catch (e) {
      safeToast("Error: " + e.message, "error");
    }
  };

  const addManualFood = async (item, isRecipe) => {
    let weight = null;
    if (!isRecipe) {
      weight = prompt(`Enter weight for: ${item.name} (in grams):`, "100");
      if (!weight || isNaN(weight)) return;
    }

    const targetMealId = addModal.mealId;

    try {
      await apiFetch("/meal-logs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          meal_type: targetMealId,
          recipe: isRecipe ? item.id : null,
          product: !isRecipe ? item.id : null,
          weight_in_grams: weight ? parseInt(weight) : null
        })
      });

      safeToast("Meal added!", "success");
      await reloadLogs();
      setSearch("");
      setAddModal(null);
    } catch (e) {
      safeToast("Error: " + e.message, "error");
    }
  };

  const removeLog = async (id) => {
    try {
      await apiFetch(`/meal-logs/${id}/`, { method: "DELETE" });
      if (reloadLogs) await reloadLogs();
    } catch (e) {
      safeToast("Error: " + e.message, "error");
    }
  };

  // --- HELPERS ---
  const getItemName = (isRecipe, id) => {
    if (isRecipe) return recipes.find(r => r.id === id)?.name || "Loading recipe...";
    return products.find(p => p.id === id)?.name || "Loading product...";
  };

  const filteredSidebar = (tab === 'recipes' ? recipes : products).filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Spinner />;

  return (
    <div className="pb-16 animate-fadeUp">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--color-text)' }}>Welcome, {user.first_name || user.username}! 👋</h1>
        </div>
      </div>

      {/* 4. NAWIGACJA DATY */}
      <div className="flex items-center gap-3 mb-8 bg-surface p-2 rounded-xl border border-border w-max shadow-sm">
        <button onClick={() => changeDate(-1)} className="w-10 h-10 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-colors bg-background hover:bg-accent-xlight text-text-muted hover:text-accent font-bold">
          ←
        </button>
        <div className="w-48 text-center font-bold text-sm" style={{ color: 'var(--color-text)' }}>
          {isToday ? <span className="text-accent">Today</span> : dayName}, {dateStr}
        </div>
        <button onClick={() => changeDate(1)} className="w-10 h-10 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-colors bg-background hover:bg-accent-xlight text-text-muted hover:text-accent font-bold">
          →
        </button>
        {!isToday && (
          <div className="pl-2 border-l border-border">
            <Btn size="sm" variant="secondary" onClick={goToToday}>Back to today</Btn>
          </div>
        )}
      </div>

      {/* Progress Card */}
      <div className="p-6 rounded-2xl mb-8 shadow-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {hasPlan ? `Goal from plan: ${myPlan.name}` : `Estimated Goal (TDEE)`}
              {!hasPlan && (!user.weight_kg || !user.height_cm) && (
                <span className="ml-2 text-accent lowercase opacity-70">(fill weight/height in settings!)</span>
              )}
            </div>
            <div className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
              {consumedKcal} <span className="text-lg text-text-muted font-semibold">/ {targetKcal} kcal</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold" style={{ color: remainingKcal >= 0 ? 'var(--color-accent)' : '#EF4444' }}>
              {remainingKcal >= 0 ? `${remainingKcal} remaining` : `${Math.abs(remainingKcal)} exceeded`}
            </div>
          </div>
        </div>

        <div className="h-3 rounded-full overflow-hidden mb-6" style={{ background: 'var(--color-background)' }}>
          <div className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, background: progressPct > 100 ? '#EF4444' : 'var(--color-accent)' }}></div>
        </div>

        {/* Macros Summary */}
        <div className="flex gap-4 pt-4 border-t border-border">
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Protein</div>
            <div className="text-lg font-black" style={{ color: 'var(--color-text)' }}>{consumedProtein}g</div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Fat</div>
            <div className="text-lg font-black" style={{ color: 'var(--color-text)' }}>{consumedFat}g</div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Carbs</div>
            <div className="text-lg font-black" style={{ color: 'var(--color-text)' }}>{consumedCarbs}g</div>
          </div>
        </div>
      </div>

      {/* SCENARIO A: Has assigned plan */}
      {hasPlan ? (
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            {isToday ? "Today's Menu" : `Menu for ${dayName}`}
          </h2>
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            {MEALS.map((mealDef, index) => {
              const mealsForThisType = targetScheduled.filter(m => m.meal_type === mealDef.id);

              const pairedLogIds = new Set();
              mealsForThisType.forEach(meal => {
                const matchingLog = logs.find(l =>
                  l.meal_type === meal.meal_type &&
                  l.recipe === meal.recipe &&
                  l.product === meal.product &&
                  String(l.weight_in_grams) === String(meal.weight_in_grams) &&
                  !pairedLogIds.has(l.id)
                );
                if (matchingLog) pairedLogIds.add(matchingLog.id);
              });

              const extraLogsForThisType = logs.filter(l =>
                l.meal_type === mealDef.id && !pairedLogIds.has(l.id)
              );

              return (
                <div key={mealDef.id} className={`p-5 ${index !== MEALS.length - 1 ? 'border-b border-dashed border-border' : ''}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold text-sm text-text flex items-center gap-2">
                      <span>{mealDef.icon}</span> {mealDef.name}
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setAddModal({ mealId: mealDef.id })}>
                      ＋ Add extra
                    </Btn>
                  </div>

                  <div className="grid gap-2">
                    {/* 1. ZAPLANOWANE POSIŁKI */}
                    {mealsForThisType.map(meal => {
                      const matchingLog = logs.find(l =>
                        l.meal_type === meal.meal_type &&
                        l.recipe === meal.recipe &&
                        l.product === meal.product &&
                        String(l.weight_in_grams) === String(meal.weight_in_grams)
                      );
                      const isEaten = !!matchingLog;

                      return (
                        <div key={meal.id} onClick={() => togglePlannedMeal(meal)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border flex items-center justify-between 
                                                       ${isEaten ? 'bg-accent-xlight/30 border-accent/40' : 'bg-background border-border hover:border-accent'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${isEaten ? 'bg-accent border-accent text-white' : 'border-border'}`}>
                              {isEaten && "✓"}
                            </div>
                            <div className={`font-semibold text-sm transition-colors ${isEaten ? 'text-text-muted line-through opacity-70' : 'text-text'}`}>
                              {getItemName(!!meal.recipe, meal.recipe || meal.product)}
                              {!meal.recipe && <span className="ml-1 text-xs text-accent">({meal.weight_in_grams}g)</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* 2. NADPROGRAMOWE POSIŁKI (SPOZA DIETY) */}
                    {extraLogsForThisType.map(log => (
                      <div key={log.id} className="flex justify-between items-center p-4 rounded-xl bg-background border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-surface border border-border text-xs text-text-muted opacity-70">
                            +
                          </div>
                          <div className="text-sm font-medium text-text">
                            {getItemName(!!log.recipe, log.recipe || log.product)}
                            {!log.recipe && <span className="ml-2 text-xs font-bold px-2 py-1 rounded bg-accent-xlight text-accent">{log.weight_in_grams}g</span>}
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-md bg-border text-text-muted uppercase tracking-wider">Extra</span>
                          </div>
                        </div>
                        <button onClick={() => removeLog(log.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer text-sm transition-colors bg-danger-light text-danger hover:opacity-80">
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* 3. BRAK POSIŁKÓW */}
                    {mealsForThisType.length === 0 && extraLogsForThisType.length === 0 && (
                      <div className="text-xs text-text-muted mt-1 mb-1">No meals planned or logged.</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // SCENARIO B: Brak przypisanej diety
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            {isToday ? "Logged Today" : `Logged on ${dayName}`}
          </h2>
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            {MEALS.map((meal, index) => {
              const mealLogs = logs.filter(l => l.meal_type === meal.id);

              return (
                <div key={meal.id} className={`p-5 ${index !== MEALS.length - 1 ? 'border-b border-dashed border-border' : ''}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-sm text-text flex items-center gap-2">
                      <span>{meal.icon}</span> {meal.name}
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setAddModal({ mealId: meal.id })}>＋ Add</Btn>
                  </div>

                  {mealLogs.length === 0 ? (
                    <div className="text-xs text-text-muted mt-2">No meals logged yet.</div>
                  ) : (
                    <div className="space-y-2 mt-4">
                      {mealLogs.map(log => (
                        <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                          <div className="text-sm font-medium text-text">
                            {getItemName(!!log.recipe, log.recipe || log.product)}
                            {!log.recipe && <span className="ml-2 text-xs font-bold px-2 py-1 rounded bg-accent-xlight text-accent">{log.weight_in_grams}g</span>}
                          </div>
                          <button onClick={() => removeLog(log.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer text-sm transition-colors bg-danger-light text-danger hover:opacity-80">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {addModal && (
        <Modal title={`Add to: ${MEALS.find(m => m.id === addModal.mealId)?.name}`} onClose={() => setAddModal(null)} width="max-w-[500px]">
          <div className="flex p-1 bg-background border border-border rounded-xl mb-4">
            <button onClick={() => setTab('recipes')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all ${tab === 'recipes' ? 'bg-surface shadow-sm text-accent' : 'bg-transparent text-text-muted'}`}>Recipes</button>
            <button onClick={() => setTab('products')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all ${tab === 'products' ? 'bg-surface shadow-sm text-accent' : 'bg-transparent text-text-muted'}`}>Products</button>
          </div>

          <Input placeholder="Search..." value={search} onChange={v => setSearch(v)} />

          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {filteredSidebar.length === 0 ? (
              <div className="text-center py-4 text-sm text-text-muted">No search results.</div>
            ) : filteredSidebar.map(item => (
              <div key={item.id} onClick={() => addManualFood(item, tab === 'recipes')}
                className="p-3 rounded-xl border border-border bg-surface cursor-pointer hover:border-accent transition-colors flex justify-between items-center">
                <span className="text-sm font-bold text-text">{item.name}</span>
                <span className="text-xs font-bold text-accent">
                  {tab === 'recipes' ? `${item.total_calories || 0} kcal` : `${item.calories_per_100g} kcal/100g`}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}