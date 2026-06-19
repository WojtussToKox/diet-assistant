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
  const todayObj = new Date();
  const year = todayObj.getFullYear();
  const month = String(todayObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayObj.getDate()).padStart(2, '0');

  const todayStr = `${year}-${month}-${day}`;
  const dayName = todayObj.toLocaleDateString('en-US', { weekday: 'long' });

  const jsDay = todayObj.getDay();
  const todayDayId = jsDay === 0 ? 7 : jsDay;

  const { data: plans } = useList("/diet-plans/");
  const { data: dailyMenus } = useList("/daily-menus/");
  const { data: scheduledMeals } = useList("/scheduled-meals/");
  const { data: logs, loading, reload: reloadLogs } = useList(`/meal-logs/?date=${todayStr}`);

  const { data: recipes } = useList("/recipes/");
  const { data: products } = useList("/products/");

  const [addModal, setAddModal] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("recipes");

  const patientPlans = plans.filter(p => p.patient === user?.id);
  const myPlan = patientPlans.length > 0 ? patientPlans[patientPlans.length - 1] : null;
  const hasPlan = !!myPlan;

  const todayMenu = hasPlan ? dailyMenus.find(m => m.diet_plan === myPlan.id && m.day_of_week === todayDayId) : null;
  const todayScheduled = todayMenu ? scheduledMeals.filter(m => m.daily_menu === todayMenu.id) : [];

  let consumedKcal = 0;
  logs.forEach(log => {
    if (log.recipe) {
      const r = recipes.find(rec => rec.id === log.recipe);
      if (r && r.total_calories) consumedKcal += r.total_calories;
    } else if (log.product) {
      const p = products.find(prod => prod.id === log.product);
      if (p && p.calories_per_100g) consumedKcal += (p.calories_per_100g / 100) * log.weight_in_grams;
    }
  });
  consumedKcal = Math.round(consumedKcal);

  const targetKcal = hasPlan ? myPlan.daily_calories_goal : (user?.daily_caloric_needs || 2000);
  const remainingKcal = targetKcal - consumedKcal;
  const progressPct = Math.min(100, (consumedKcal / targetKcal) * 100);

  // --- ACTIONS ---

  const togglePlannedMeal = async (scheduled) => {
    const existingLog = logs.find(l =>
      l.meal_type === scheduled.meal_type &&
      l.recipe === scheduled.recipe &&
      l.product === scheduled.product
    );

    try {
      if (existingLog) {
        await apiFetch(`/meal-logs/${existingLog.id}/`, { method: "DELETE" });
      } else {
        await apiFetch("/meal-logs/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: todayStr,
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: todayStr,
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
      <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-text)' }}>Welcome, {user.first_name || user.username}! 👋</h1>
      <p className="text-sm font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>
        It is {dayName}, {todayStr}
      </p>

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

        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-background)' }}>
          <div className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, background: progressPct > 100 ? '#EF4444' : 'var(--color-accent)' }}></div>
        </div>
      </div>

      {/* SCENARIO A: Has assigned plan */}
      {hasPlan ? (
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Today's Menu</h2>
          {todayScheduled.length === 0 ? (
            <EmptyState icon="🍽️" title="Free day!" sub="Your dietitian hasn't scheduled anything for today." />
          ) : (
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
              {MEALS.map((mealDef) => {
                const mealsForThisType = todayScheduled.filter(m => m.meal_type === mealDef.id);
                if (mealsForThisType.length === 0) return null; // Hide empty sections
                const renderedGroups = MEALS.filter(md => todayScheduled.some(m => m.meal_type === md.id));
                const isLast = renderedGroups[renderedGroups.length - 1].id === mealDef.id;

                return (
                  <div key={mealDef.id} className={`p-5 ${!isLast ? 'border-b border-dashed border-border' : ''}`}>
                    <div className="font-bold text-sm text-text flex items-center gap-2 mb-3">
                      <span>{mealDef.icon}</span> {mealDef.name}
                    </div>

                    <div className="grid gap-2">
                      {mealsForThisType.map(meal => {
                        const isEaten = logs.some(l => l.meal_type === meal.meal_type && l.recipe === meal.recipe && l.product === meal.product);

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
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Logged Today</h2>
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

          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />

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