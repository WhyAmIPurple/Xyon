import React, { useEffect, useState } from "react";



function NavItem({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm",
        active
          ? "bg-xyon-pill2 text-xyon-ink"
          : "text-xyon-muted hover:bg-xyon-pill hover:text-xyon-ink"
      ].join(" ")}
    >
      <span className="h-8 w-8 rounded-xl grid place-items-center bg-xyon-pill border border-xyon-line">
        <span className="h-2 w-2 rounded-full bg-xyon-ink/50" />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

import logo from "../../assets/logo.png";
export default function AppShell({ children, onLogout, user, activePage = "calendar", onNavigate }) {
  const displayName = user ? `${user.first_name} ${user.last_name}` : "John Doe";

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("xyon-dark-mode") === "true"
  );

  useEffect(() => {
    const handler = (e) => setDarkMode(e.detail);
    window.addEventListener("xyon-dark-mode-change", handler);
    return () => window.removeEventListener("xyon-dark-mode-change", handler);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("xyon-dark-mode", String(next));
    setDarkMode(next);
    window.dispatchEvent(new CustomEvent("xyon-dark-mode-change", { detail: next }));
  }

  return (
    <div className="h-screen overflow-hidden bg-xyon-bg text-xyon-ink">
      {/* Top bar */}
      <header className="px-8 pt-6 pb-4 sticky top-0 z-50 bg-xyon-bg">
        <div className="h-16 rounded-xxl bg-xyon-card border border-xyon-line shadow-soft flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
                onClick={() => onNavigate?.("dashboard")}
                className="focus:outline-none"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
                <img
                    src={logo}
                    alt="Xyon Logo"
                    className="h-40 w-auto object-contain xyon-logo"
                />
            </button>
          </div>

          <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="h-8 w-8 rounded-full border border-xyon-line bg-xyon-panel hover:bg-xyon-pill2 grid place-items-center transition-colors"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-xyon-ink">
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-xyon-ink">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            onClick={() => onNavigate?.("account")}
            className="flex items-center gap-2 text-sm text-xyon-muted hover:opacity-75 transition-opacity focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-xyon-panel border border-xyon-line grid place-items-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-xyon-muted">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-xyon-ink">{displayName}</span>
          </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-8 pb-6">
        <div className="grid grid-cols-[260px_1fr] gap-6 h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <aside className="rounded-xxl bg-xyon-card border border-xyon-line shadow-soft p-4">
            <div className="space-y-1">
              <NavItem active={activePage === "dashboard"} label="Dashboard" onClick={() => onNavigate?.("dashboard")} />
              <NavItem active={activePage === "calendar"} label="Calendar" onClick={() => onNavigate?.("calendar")} />
              <NavItem active={activePage === "list"} label="List" onClick={() => onNavigate?.("list")} />
              <NavItem active={activePage === "classes"} label="Classes" onClick={() => onNavigate?.("classes")} />
              <NavItem active={activePage === "todo"} label="To Do" onClick={() => onNavigate?.("todo")} />
              <NavItem active={activePage === "settings"} label="Settings" onClick={() => onNavigate?.("settings")} />
            </div>

            <div className="mt-6 pt-6 border-t border-xyon-line">
              <div className="text-[11px] uppercase tracking-wider text-xyon-muted mb-2">
                Account Details
              </div>
              <div className="space-y-1">
                <NavItem active={activePage === "account"} label="Account" onClick={() => onNavigate?.("account")} />
                {/* This calls the logout function from App.jsx through CalendarPage.jsx. */}
                <NavItem label="Sign Out" onClick={onLogout} />
              </div>
            </div>
          </aside>

          {/* Content */}
          <section className="rounded-xxl bg-xyon-card border border-xyon-line shadow-soft p-6 overflow-hidden">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
