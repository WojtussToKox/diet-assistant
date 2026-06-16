import { useList } from "../hooks/useList";

export default function Dashboard() {
  const { data: products } = useList("/products/");
  const { data: recipes } = useList("/recipes/");
  const { data: plans } = useList("/diet-plans/");

  const isActive = (plan) => {
    const today = new Date().toISOString().slice(0, 10);
    return plan.start_date <= today && today <= plan.end_date;
  };

  const activePlans = plans.filter(isActive);

  const stats = [
    { label: "Produkty w bazie", value: products.length, icon: "🥕", colorClass: "border-t-macro-carbs" },
    { label: "Przepisy", value: recipes.length, icon: "🍽️", colorClass: "border-t-macro-protein" },
    { label: "Plany diety", value: plans.length, icon: "📋", colorClass: "border-t-accent" },
    { label: "Aktywne plany", value: activePlans.length, icon: "✅", colorClass: "border-t-accent-light" },
  ];

  return (
    <div>
      <div className="mb-7">
        <h2 className="m-0 text-2xl font-bold text-text">Przegląd</h2>
        <p className="m-0 mt-1 text-text-muted text-sm">Witaj w DietAsystent — Twoim systemie zarządzania dietą.</p>
      </div>
      
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`bg-surface border border-border border-t-4 rounded-xl p-5 ${s.colorClass}`}>
            <div className="text-[28px] mb-2">{s.icon}</div>
            <div className="font-mono font-extrabold text-[28px] text-text">{s.value}</div>
            <div className="text-[13px] text-text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-base font-bold text-text mb-3">Aktywne plany</h3>
      
      {activePlans.length === 0 ? (
        <div className="p-5 bg-background rounded-xl text-text-muted text-sm text-center">
          Brak aktywnych planów na dziś.
        </div>
      ) : (
        <div className="grid gap-2.5">
          {activePlans.map(p => (
            <div key={p.id} className="py-3.5 px-4 bg-surface border border-border border-l-4 border-l-accent rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-[15px] text-text">{p.name}</div>
                <div className="text-[13px] text-text-muted">Pacjent #{p.patient} · {p.start_date} – {p.end_date}</div>
              </div>
              <div className="font-mono font-bold text-lg text-accent">{p.daily_calories_goal} kcal/d</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}