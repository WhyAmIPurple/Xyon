import React, { useState } from "react";
import AppShell from "../components/layout/AppShell";

const ACCENT_OPTIONS = [
  { label: "Rose",   color: "#E6ABAB" },
  { label: "Blue",   color: "#a9c0e8" },
  { label: "Green",  color: "#b9d3b4" },
  { label: "Purple", color: "#bca9d8" },
  { label: "Yellow", color: "#f5e3a3" },
];

function Section({ title, children }) {
  return (
    <div className="rounded-xxl border border-xyon-line bg-[#fbfaf7] p-5">
      <h3 className="text-sm font-bold text-xyon-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-xyon-line/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-xyon-ink">{label}</p>
        {description && <p className="text-xs text-xyon-muted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function getCurrentAccent() {
  return localStorage.getItem("xyon-accent") || "#E6ABAB";
}

export default function SettingsPage({ onLogout, user, onNavigate }) {
  const [accent, setAccent] = useState(getCurrentAccent);

  function applyAccent(color) {
    document.documentElement.style.setProperty("--xyon-accent", color);
    localStorage.setItem("xyon-accent", color);
    setAccent(color);
  }

  return (
    <AppShell onLogout={onLogout} user={user} activePage="settings" onNavigate={onNavigate}>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Settings</h2>
          <p className="text-sm text-xyon-muted mt-1">Customize your Xyon experience</p>
        </div>
      </div>

      <div className="mt-5 h-[calc(100%-72px)] overflow-auto space-y-4 pr-1">

        {/* Appearance */}
        <Section title="Appearance">
          <Row
            label="Accent Color"
            description="The highlight color used across the app"
          >
            <div className="flex items-center gap-2.5">
              {ACCENT_OPTIONS.map((opt) => {
                const isActive = accent === opt.color;
                return (
                  <button
                    key={opt.color}
                    title={opt.label}
                    onClick={() => applyAccent(opt.color)}
                    className="h-7 w-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                    style={{
                      backgroundColor: opt.color,
                      boxShadow: isActive ? `0 0 0 2px #fff, 0 0 0 4px ${opt.color}` : "none",
                    }}
                  >
                    {isActive && (
                      <span className="text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Row>
          <Row
            label="Dark Mode"
            description="Coming soon"
          >
            <span className="text-xs text-xyon-muted font-semibold px-2 py-1 rounded-lg bg-xyon-pill border border-xyon-line">
              Coming Soon
            </span>
          </Row>
        </Section>

        {/* Calendar & List Views */}
        <Section title="Default Views">
          <Row
            label="Default Calendar View"
            description="What view opens when you navigate to Calendar"
          >
            <select className="text-sm rounded-xl border border-xyon-line bg-xyon-pill px-3 py-1.5 outline-none font-medium">
              <option>Week</option>
              <option>Month</option>
              <option>Day</option>
            </select>
          </Row>
          <Row
            label="Default List Tab"
            description="Which tab opens first on the List page"
          >
            <select className="text-sm rounded-xl border border-xyon-line bg-xyon-pill px-3 py-1.5 outline-none font-medium">
              <option>Due Dates</option>
              <option>Schedule</option>
            </select>
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Row
            label="Event Reminders"
            description="Coming soon"
          >
            <span className="text-xs text-xyon-muted font-semibold px-2 py-1 rounded-lg bg-xyon-pill border border-xyon-line">
              Coming Soon
            </span>
          </Row>
        </Section>

      </div>
    </AppShell>
  );
}
