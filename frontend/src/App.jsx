import { useState, useCallback } from "react";

// Importy naszych zrefaktoryzowanych stron
import Dashboard from "./pages/Dashboard";
import ProductsPanel from "./pages/ProductsPanel";
import RecipesPanel from "./pages/RecipesPanel";
import DietPlansPanel from "./pages/DietPlansPanel";

const NAV = [
  { id: "dashboard", label: "Przegląd", icon: "🏠" },
  { id: "products", label: "Produkty", icon: "🥕" },
  { id: "recipes", label: "Przepisy", icon: "🍽️" },
  { id: "diet-plans", label: "Plany Diety", icon: "📋" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);

  // Globalna funkcja do wywoływania powiadomień
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <div className="flex min-h-screen">
      
      {/* ─── Pasek Boczny (Sidebar) ─── */}
      <aside className="w-[220px] bg-surface border-r border-border flex flex-col py-6 shrink-0 sticky top-0 h-screen">
        <div className="px-5 pb-7">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-lg">🥗</div>
            <div>
              <div className="font-extrabold text-[15px] text-text leading-tight">DietAsystent</div>
              <div className="text-[11px] text-text-muted">system zarządzania</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1">
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <button 
                key={n.id} 
                onClick={() => setPage(n.id)}
                className={`w-full flex items-center gap-2.5 px-5 py-3 border-none bg-transparent cursor-pointer text-left transition-all duration-150 border-l-[3px] font-inherit
                  ${active ? "text-accent font-bold border-l-accent bg-accent-xlight" : "text-text-muted font-medium border-l-transparent hover:bg-background"}
                `}
              >
                <span className="text-base">{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="px-5 pt-4 border-t border-border">
          <div className="text-[11px] text-text-muted">
            Backend: <span className="text-accent font-mono font-bold">localhost:8000</span>
          </div>
        </div>
      </aside>

      {/* ─── Główna zawartość strony ─── */}
      <main className="flex-1 py-8 px-10 max-w-full overflow-auto">
        <div className="max-w-[860px]">
          {page === "dashboard" && <Dashboard />}
          {page === "products" && <ProductsPanel toast={showToast} />}
          {page === "recipes" && <RecipesPanel toast={showToast} />}
          {page === "diet-plans" && <DietPlansPanel toast={showToast} />}
        </div>
      </main>

      {/* ─── Wyskakujące powiadomienie (Toast) ─── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[2000] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-xl flex items-center gap-2 animate-[slideIn_0.25s_ease]
          ${toast.type === "error" ? "bg-danger" : "bg-accent"}
        `}>
          {toast.type === "error" ? "✕" : "✓"} {toast.message}
        </div>
      )}
      
    </div>
  );
}