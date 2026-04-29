import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";

const ACCENT_OPTIONS = [
  { label: "Rose",   color: "#E6ABAB" },
  { label: "Blue",   color: "#a9c0e8" },
  { label: "Green",  color: "#b9d3b4" },
  { label: "Purple", color: "#bca9d8" },
  { label: "Yellow", color: "#f5e3a3" },
];

const REMINDER_OPTIONS = [
  { label: "5 minutes before",  value: "5"  },
  { label: "10 minutes before", value: "10" },
  { label: "15 minutes before", value: "15" },
  { label: "30 minutes before", value: "30" },
  { label: "1 hour before",     value: "60" },
];

function Section({ title, children }) {
  return (
    <div className="rounded-xxl border border-xyon-line bg-xyon-panel p-5">
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

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
        enabled ? "bg-xyon-ink" : "bg-xyon-line",
      ].join(" ")}
    >
      <span className={[
        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
        enabled ? "translate-x-6" : "translate-x-1",
      ].join(" ")} />
    </button>
  );
}

function get(key, fallback) { return localStorage.getItem(key) ?? fallback; }
function save(key, val)     { localStorage.setItem(key, val); }

export default function SettingsPage({ onLogout, user, onNavigate }) {
  const [accent,          setAccent]          = useState(() => get("xyon-accent", "#E6ABAB"));
  const [darkMode,        setDarkMode]        = useState(() => get("xyon-dark-mode", "false") === "true");
  const [calView,         setCalView]         = useState(() => get("xyon-default-calendar-view", "timeGridWeek"));
  const [listTab,         setListTab]         = useState(() => get("xyon-default-list-tab", "due"));
  const [reminders,       setReminders]       = useState(() => get("xyon-reminders-enabled", "false") === "true");
  const [reminderMinutes, setReminderMinutes] = useState(() => get("xyon-reminder-minutes", "15"));
  const [permDenied,      setPermDenied]      = useState(false);

  const [changingPw, setChangingPw] = useState(false);
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwMessage,  setPwMessage]  = useState({ text: "", ok: false });
  const [pwLoading,  setPwLoading]  = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMessage({ text: "", ok: false });
    if (newPw !== confirmPw) { setPwMessage({ text: "New passwords do not match.", ok: false }); return; }
    if (newPw.length < 6)    { setPwMessage({ text: "New password must be at least 6 characters.", ok: false }); return; }
    setPwLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const res  = await fetch("http://localhost:3001/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: storedUser.user_id, currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setPwMessage({ text: data.error || "Failed to change password.", ok: false }); return; }
      setPwMessage({ text: "Password changed successfully.", ok: true });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setChangingPw(false); setPwMessage({ text: "", ok: false }); }, 1500);
    } catch {
      setPwMessage({ text: "Could not reach the server.", ok: false });
    } finally {
      setPwLoading(false);
    }
  }

  function cancelChangePw() {
    setChangingPw(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwMessage({ text: "", ok: false });
  }

  function applyAccent(color) {
    document.documentElement.style.setProperty("--xyon-accent", color);
    save("xyon-accent", color);
    setAccent(color);
  }

  useEffect(() => {
    const handler = (e) => setDarkMode(e.detail);
    window.addEventListener("xyon-dark-mode-change", handler);
    return () => window.removeEventListener("xyon-dark-mode-change", handler);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    save("xyon-dark-mode", String(next));
    setDarkMode(next);
    window.dispatchEvent(new CustomEvent("xyon-dark-mode-change", { detail: next }));
  }

  function changeCalView(e) {
    save("xyon-default-calendar-view", e.target.value);
    setCalView(e.target.value);
  }

  function changeListTab(e) {
    save("xyon-default-list-tab", e.target.value);
    setListTab(e.target.value);
  }

  async function toggleReminders() {
    const next = !reminders;
    if (next) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPermDenied(true); return; }
      setPermDenied(false);
    }
    save("xyon-reminders-enabled", String(next));
    setReminders(next);
  }

  function changeReminderMinutes(e) {
    save("xyon-reminder-minutes", e.target.value);
    setReminderMinutes(e.target.value);
  }

  const selectCls = "text-sm rounded-xl border border-xyon-line bg-xyon-pill px-3 py-1.5 outline-none font-medium text-xyon-ink";

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
          <Row label="Accent Color" description="Highlight color used across the app">
            <div className="flex items-center gap-2.5">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.color}
                  title={opt.label}
                  onClick={() => applyAccent(opt.color)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{
                    backgroundColor: opt.color,
                    boxShadow: accent === opt.color ? `0 0 0 2px #fff, 0 0 0 4px ${opt.color}` : "none",
                  }}
                >
                  {accent === opt.color && (
                    <span className="text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Dark Mode" description="Switch to a dark color scheme">
            <Toggle enabled={darkMode} onToggle={toggleDarkMode} />
          </Row>
        </Section>

        {/* Default Views */}
        <Section title="Default Views">
          <Row label="Default Calendar View" description="View shown when you open Calendar">
            <select value={calView} onChange={changeCalView} className={selectCls}>
              <option value="timeGridWeek">Week</option>
              <option value="dayGridMonth">Month</option>
            </select>
          </Row>
          <Row label="Default List Tab" description="Tab shown when you open List">
            <select value={listTab} onChange={changeListTab} className={selectCls}>
              <option value="due">Due Dates</option>
              <option value="schedule">Schedule</option>
            </select>
          </Row>
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row label="Password" description="Change your account password">
            {!changingPw && (
              <button
                onClick={() => setChangingPw(true)}
                className="text-sm rounded-xl border border-xyon-line bg-xyon-pill px-3 py-1.5 outline-none font-medium text-xyon-ink"
              >
                Change Password
              </button>
            )}
          </Row>
          {changingPw && (
            <form onSubmit={handleChangePassword} className="mt-3 space-y-2">
              <input
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full text-sm rounded-xl border border-xyon-line bg-xyon-panel text-xyon-ink px-3 py-2 outline-none"
                required
              />
              <input
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full text-sm rounded-xl border border-xyon-line bg-xyon-panel text-xyon-ink px-3 py-2 outline-none"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full text-sm rounded-xl border border-xyon-line bg-xyon-panel text-xyon-ink px-3 py-2 outline-none"
                required
              />
              {pwMessage.text && (
                <p className={`text-xs font-medium ${pwMessage.ok ? "text-green-600" : "text-red-500"}`}>
                  {pwMessage.text}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-xyon-ink text-xyon-bg hover:opacity-90 disabled:opacity-50"
                >
                  {pwLoading ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelChangePw}
                  className="text-xs font-semibold px-4 py-1.5 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-xyon-card"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Section>

        {/* Event Reminders */}
        <Section title="Event Reminders">
          <Row
            label="Enable Reminders"
            description={
              permDenied
                ? "Notifications blocked — allow them in your browser settings, then try again"
                : "Get a browser notification before events start"
            }
          >
            <Toggle enabled={reminders} onToggle={toggleReminders} />
          </Row>
          {reminders && (
            <Row label="How far in advance" description="When to send the reminder">
              <select value={reminderMinutes} onChange={changeReminderMinutes} className={selectCls}>
                {REMINDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Row>
          )}
        </Section>

      </div>
    </AppShell>
  );
}
