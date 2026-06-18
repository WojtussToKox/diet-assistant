import { useList } from "../hooks/useList";

function StatCard({ label, value, unit, accent = false }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1 relative overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="absolute top-0 left-0 w-0.5 h-full rounded-r-full" style={{ background: 'var(--color-accent)' }} />
      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="font-black text-3xl leading-none font-['Inter']" style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text)' }}>
          {value ?? '—'}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{unit}</span>
      </div>
    </div>
  );
}

function MacroRow({ label, value, unit, pct, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium w-14 shrink-0" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-background)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold font-mono w-10 text-right" style={{ color: 'var(--color-text)' }}>{value}{unit}</span>
    </div>
  );
}

export default function Dashboard({ user }) {
  const { data: plans } = useList("/diet-plans/");

  const name = user?.first_name || user?.username || "User";
  const height = user?.height_cm;
  const weight = user?.weight_kg;

  const today = new Date();
  const hour = today.getHours();
  const dateStr = today.toLocaleDateString('en-EN', { weekday: 'long', month: 'long', day: 'numeric' });

  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Hello" : "Good evening";

  // Demo calorie data
  const goal = 1840;
  const consumed = 1160;
  const remaining = goal - consumed;
  const pct = Math.min(100, (consumed / goal) * 100);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  // Active plans count
  const todayStr = today.toISOString().slice(0, 10);
  const activePlans = plans.filter(p => p.start_date <= todayStr && todayStr <= p.end_date).length;

  return (
    <div className="pb-16 animate-fadeUp">

      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest m-0 mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {dateStr}
          </p>
          <h1 className="text-[38px] font-black leading-tight m-0" style={{ color: 'var(--color-text)' }}>
            {greeting},<br />
            <span style={{ color: 'var(--color-accent)' }}>{name}</span> 👋
          </h1>
          <p className="mt-2 m-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-accent)' }}>{remaining} kcal</strong> left to reach your goal
          </p>
        </div>
        {activePlans > 0 && (
          <div className="rounded-2xl px-4 py-3 text-center shrink-0" style={{ background: 'var(--color-accent-xlight)', border: '1px solid var(--color-border)' }}>
            <div className="font-black text-2xl leading-none font-mono" style={{ color: 'var(--color-accent)' }}>{activePlans}</div>
            <div className="text-[10px] mt-1 font-semibold uppercase tracking-wide" style={{ color: 'var(--color-accent)' }}>
              aktywny<br />plan
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Weight" value={weight} unit="kg" />
        <StatCard label="Height" value={height} unit="cm" />
      </div>

      {/* Calorie progress card */}
      <div className="rounded-2xl p-6 flex items-center gap-8 mb-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

        {/* Ring */}
        <div className="relative w-[100px] h-[100px] shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7" style={{ stroke: 'var(--color-background)' }} />
            <circle
              cx="50" cy="50" r={r} fill="none" strokeWidth="7"
              strokeLinecap="round"
              style={{
                stroke: 'var(--color-accent)',
                strokeDasharray: circ,
                strokeDashoffset: dash,
                transition: 'stroke-dashoffset 1s ease',
                filter: 'drop-shadow(0 0 6px var(--color-accent-glow))',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono font-black text-xl leading-none" style={{ color: 'var(--color-text)' }}>{consumed}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>kcal</span>
          </div>
        </div>

        {/* Macros */}
        <div className="flex-1 space-y-3.5">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Todays macro</span>
            <span style={{ color: 'var(--color-text-muted)' }}>Goal: {goal} kcal</span>
          </div>
          <MacroRow label="Proteins" value="86" unit="g" pct={72} color="#3B82F6" />
          <MacroRow label="Carbs" value="142" unit="g" pct={55} color="#10B981" />
          <MacroRow label="Fat" value="44" unit="g" pct={38} color="#F59E0B" />
        </div>
      </div>

      {/* Plans summary */}
      {plans.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3 m-0" style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aktywne plany diety
          </h3>
          <div className="grid gap-2.5">
            {plans.filter(p => p.start_date <= todayStr && todayStr <= p.end_date).slice(0, 3).map(plan => (
              <div key={plan.id} className="flex items-center justify-between px-5 py-3.5 rounded-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{plan.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {plan.start_date} → {plan.end_date}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg leading-none" style={{ color: 'var(--color-accent)' }}>{plan.daily_calories_goal}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>kcal/dzień</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}