export const MacroBar = ({ protein, fat, carbs, calories }) => {
  const p = Number(protein) || 0, f = Number(fat) || 0, c = Number(carbs) || 0;
  const total = p + f + c || 1;
  const segments = [
    { colorClass: "bg-macro-protein", pct: (p / total) * 100, label: "Protein", val: p },
    { colorClass: "bg-macro-fat", pct: (f / total) * 100, label: "Fat", val: f },
    { colorClass: "bg-macro-carbs", pct: (c / total) * 100, label: "Carbs", val: c },
  ];
  return (
    <div>
      <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mb-2">
        {segments.map(s => (
          <div key={s.label} style={{ width: `${s.pct}%` }} className={`${s.colorClass} transition-all duration-500`} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {segments.map(s => (
          <span key={s.label} className="flex items-center gap-1 text-[11px] text-text-muted">
            <span className={`w-2 h-2 rounded-sm ${s.colorClass} inline-block`} />
            {s.label}: <strong className="text-text font-mono">{Number(s.val).toFixed(1)}g</strong>
          </span>
        ))}
        {calories !== undefined && (
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <span className="w-2 h-2 rounded-sm bg-macro-calories inline-block" />
            Kcal: <strong className="text-text font-mono">{Number(calories).toFixed(1)}</strong>
          </span>
        )}
      </div>
    </div>
  );
};