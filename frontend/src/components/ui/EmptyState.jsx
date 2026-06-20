export const EmptyState = ({ icon, title, sub, action }) => (
  <div className="text-center py-16 px-5">
    <div className="text-[40px] mb-3">{icon}</div>
    <div className="font-semibold text-base text-text mb-1.5">{title}</div>
    <div className="text-text-muted text-sm mb-5">{sub}</div>
    {action}
  </div>
);