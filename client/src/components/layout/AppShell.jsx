import React from "react";


function IconButton({ children }) {
  return (
    <button className="h-9 w-9 grid place-items-center rounded-full bg-white/60 border border-xyon-line hover:bg-white">
      {children}
    </button>
  );
}

function NavItem({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm",
        active
          ? "bg-xyon-pill2 text-xyon-ink"
          : "text-xyon-muted hover:bg-white/50 hover:text-xyon-ink"
      ].join(" ")}
    >
      <span className="h-8 w-8 rounded-xl grid place-items-center bg-white/60 border border-xyon-line">
        <span className="h-2 w-2 rounded-full bg-xyon-ink/50" />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

import logo from "../../assets/logo.png";
export default function AppShell({ children, onLogout }) {
  return (
    <div className="h-screen overflow-hidden bg-xyon-bg text-xyon-ink">
      {/* Top bar */}
      <header className="px-8 pt-6 pb-4 sticky top-0 z-50 bg-xyon-bg">
        <div className="h-16 rounded-xxl bg-xyon-card border border-xyon-line shadow-soft flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
                <img
                    src={logo}
                    alt="Xyon Logo"
                    className="h-40 w-auto object-contain"
                />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-xyon-muted">
              <div className="h-8 w-8 rounded-full bg-white/70 border border-xyon-line" />
              <span className="font-semibold text-xyon-ink">John Doe</span>
            </div>
            <IconButton>
              <span className="text-xs">🔔</span>
            </IconButton>
            <IconButton>
              <span className="text-xs">✉️</span>
            </IconButton>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="px-8 pb-6">
        <div className="grid grid-cols-[260px_1fr] gap-6 h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <aside className="rounded-xxl bg-xyon-card border border-xyon-line shadow-soft p-4">
            <div className="space-y-1">
              <NavItem label="Dashboard" />
              <NavItem active label="Calendar" />
              <NavItem label="List" />
              <NavItem label="Classes" />
              <NavItem label="Edit Events" />
              <NavItem label="Menu" />
            </div>

            <div className="mt-6 pt-6 border-t border-xyon-line">
              <div className="text-[11px] uppercase tracking-wider text-xyon-muted mb-2">
                Account Details
              </div>
              <div className="space-y-1">
                <NavItem label="Account" />
                <NavItem label="Settings" />
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
