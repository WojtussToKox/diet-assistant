import { useState, useCallback, useEffect, createContext, useContext } from "react";
import Dashboard from "./pages/Dashboard";
import ProductsPanel from "./pages/ProductsPanel";
import RecipesPanel from "./pages/RecipesPanel";
import DietPlansPanel from "./pages/DietPlansPanel";
import SettingsPanel from "./pages/SettingsPanel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DietitianDashboard from "./pages/DietitianDashboard";
import FindDietitian from "./pages/FindDietitian";
import { apiFetch } from "./services/api";
import { MdFastfood } from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { FaListUl } from "react-icons/fa";
import { FaUserGroup, FaRegCalendar } from "react-icons/fa6";
import { TbToolsKitchen3, TbSettings } from "react-icons/tb";

export const ThemeContext = createContext({ dark: false, toggle: () => { } });
export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("access_token"));
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = () => setDark(d => !d);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingUser(true);
      apiFetch("/users/me/")
        .then((data) => setUser(data))
        .catch(() => handleLogout())
        .finally(() => setLoadingUser(false));
    } else {
      setUser(null);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setAuthView("login");
  };

  if (!isAuthenticated) {
    if (authView === "register") {
      return (
        <ThemeContext.Provider value={{ dark, toggle: toggleTheme }}>
          <Register
            onRegisterSuccess={() => { showToast("Successfully registered"); setAuthView("login"); }}
            onSwitchToLogin={() => setAuthView("login")}
          />
        </ThemeContext.Provider>
      );
    }
    return (
      <ThemeContext.Provider value={{ dark, toggle: toggleTheme }}>
        <Login
          onLoginSuccess={() => setIsAuthenticated(true)}
          onSwitchToRegister={() => setAuthView("register")}
        />
      </ThemeContext.Provider>
    );
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: () => <RxDashboard /> },
    { id: "products", label: "Products", icon: () => <FaListUl /> },
    { id: "recipes", label: "Recipes", icon: () => <TbToolsKitchen3 /> },
    { id: "diet-plans", label: "Diet plans", icon: () => <FaRegCalendar /> },
    ...(user?.role === 'DIETITIAN' ? [
      { id: "patients", label: "Patients", icon: () => <FaUserGroup /> },
    ] : []),
    ...(user?.role !== 'DIETITIAN' ? [
      { id: "find-dietitian", label: "Find dietitian", icon: () => <FaUserGroup /> },
    ] : []),
    { id: "settings", label: "Settings", icon: () => <TbSettings />, bottom: true },
  ];

  const mainNav = NAV.filter(n => !n.bottom);
  const bottomNav = NAV.filter(n => n.bottom);
  const role = user?.role
  const name = user?.first_name || user?.username || "User";
  const initials = name.slice(0, 1).toUpperCase();

  return (
    <ThemeContext.Provider value={{ dark, toggle: toggleTheme }}>
      <div className="flex min-h-screen font-sans" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>

        {/* Sidebar */}
        <aside className="w-[220px] flex flex-col py-6 shrink-0 sticky top-0 h-screen z-50" style={{ background: 'var(--color-sidebar)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Logo */}
          <div className="px-5 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                style={{ background: 'var(--color-accent)', color: 'var(--color-sidebar)' }}>
                <MdFastfood />
              </div>
              <div>
                <div className="font-bold text-sm leading-none" style={{ color: 'var(--color-sidebar-text)' }}>Diet Assistant</div>
              </div>
            </div>
          </div>

          {/* Main nav */}
          <nav className="flex-1 px-3 space-y-0.5">
            {mainNav.map(n => {
              const active = page === n.id;
              if (n.id === "diet-plans" && role != "DIETITIAN" && !user?.dietitian) {
                return null;
              }
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-0 cursor-pointer text-left transition-all duration-200 relative group"
                  style={{
                    background: active ? 'var(--color-accent-xlight)' : 'transparent',
                    color: active ? 'var(--color-accent)' : 'var(--color-sidebar-muted)',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--color-sidebar-text)'; }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-muted)'; } }}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: 'var(--color-accent)' }}></div>}
                  <span style={{ color: active ? 'var(--color-accent)' : 'inherit' }}>{n.icon()}</span>
                  <span className="text-sm font-medium" style={{ color: active ? 'var(--color-accent)' : 'inherit', fontWeight: active ? '600' : '500' }}>{n.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom nav (settings) */}
          <div className="px-3 space-y-0.5 mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {/* User avatar */}
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--color-accent)', color: 'var(--color-sidebar)' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--color-sidebar-text)' }}>{name}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--color-sidebar-muted)' }}>{user?.email || ''}</div>
              </div>
            </div>
            {bottomNav.map(n => {
              const active = page === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-0 cursor-pointer text-left transition-all duration-200"
                  style={{
                    background: active ? 'var(--color-accent-xlight)' : 'transparent',
                    color: active ? 'var(--color-accent)' : 'var(--color-sidebar-muted)',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--color-sidebar-text)'; }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-muted)'; } }}
                >
                  <span style={{ color: active ? 'var(--color-accent)' : 'inherit' }}>{n.icon()}</span>
                  <span className="text-sm font-medium">{n.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[900px] mx-auto px-10 py-10">
            {loadingUser ? (
              <div className="flex justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
                  Loading...
                </div>
              </div>
            ) : (
              <>
                {page === "dashboard" && <Dashboard user={user} />}
                {page === "products" && <ProductsPanel toast={showToast} user={user} />}
                {page === "recipes" && <RecipesPanel toast={showToast} />}
                {page === "diet-plans" && <DietPlansPanel toast={showToast} user={user} />}
                {page === "settings" && <SettingsPanel user={user} setUser={setUser} toast={showToast} onLogout={handleLogout} />}
                {page === "patients" && <DietitianDashboard user={user} toast={showToast} />}
                {page === "find-dietitian" && <FindDietitian toast={showToast} />}
              </>
            )}
          </div>
        </main>

        {/* Toast */}
        {toast && (
          <div
            key={toast.id}
            className="fixed bottom-6 right-6 z-[2000] px-5 py-3.5 rounded-2xl font-medium text-sm flex items-center gap-3 animate-slideIn"
            style={{
              background: toast.type === "error" ? "#EF4444" : 'var(--color-surface)',
              color: toast.type === "error" ? "#fff" : 'var(--color-text)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              border: `1px solid ${toast.type === "error" ? "#EF4444" : 'var(--color-border)'}`,
            }}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: toast.type === "error" ? 'rgba(255,255,255,0.25)' : 'var(--color-accent-xlight)',
                color: toast.type === "error" ? "#fff" : 'var(--color-accent)',
              }}>
              {toast.type === "error" ? "✕" : "✓"}
            </span>
            {toast.message}
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}