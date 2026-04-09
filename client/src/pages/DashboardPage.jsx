import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";

// ── color + label maps by event_type ────────────────────────────────────────
const TYPE_COLOR = {
  class:      "#b9d3b4",
  assignment: "#a9c0e8",
  exam:       "#bca9d8",
  club:       "#f5e3a3",
  personal:   "#f7b4c6",
  work:       "#c8c8c8",
  other:      "#d4d4d4",
};

const TYPE_LABEL = {
  class:      "Class",
  assignment: "Assignment",
  exam:       "Exam",
  club:       "Extracurricular",
  personal:   "Personal",
  work:       "Work",
  other:      "Other",
};

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── helpers ──────────────────────────────────────────────────────────────────
function parseDate(str) {
  // MySQL returns "YYYY-MM-DD HH:MM:SS"; new Date() needs the "T" separator
  if (!str) return null;
  return new Date(str.replace(" ", "T"));
}

const pad2 = (n) => String(n).padStart(2, "0");

function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatShortDate(d) {
  return `${pad2(d.getDate())} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

function formatTime(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${pad2(m)}${ampm}`;
}

function buildGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  let day = 1;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const idx = w * 7 + d;
      row.push(idx < firstDow || day > daysInMonth ? null : day++);
    }
    grid.push(row);
    if (day > daysInMonth) break;
  }
  return grid;
}

function weekRange(date) {
  const sun = new Date(date);
  sun.setDate(date.getDate() - date.getDay());
  sun.setHours(0, 0, 0, 0);
  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  return { start: sun, end: sat };
}

function fmtRangeLabel(start, end) {
  const fmt = (d) =>
    `${pad2(d.getDate())} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}, ${d.getFullYear()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

// ── main component ────────────────────────────────────────────────────────────
export default function DashboardPage({ onLogout, user, onNavigate }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [events, setEvents] = useState([]);
  const [displayMonth, setDisplayMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // Fetch events from backend on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const u = JSON.parse(storedUser);
    fetch(`http://localhost:3001/api/events?user_id=${u.user_id}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok) setEvents(data.events); })
      .catch(console.error);
  }, []);

  // Map dateKey → [type, ...] for mini-calendar dots (max 3 per day)
  const dotsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const d = parseDate(ev.start_time);
      if (!d) return;
      const key = toDateKey(d);
      if (!map[key]) map[key] = new Set();
      map[key].add(ev.event_type || "other");
    });
    const result = {};
    Object.entries(map).forEach(([k, s]) => { result[k] = [...s].slice(0, 3); });
    return result;
  }, [events]);

  const UPCOMING_TYPES = ["assignment", "exam", "club", "personal"];
  const TODAY_TYPES    = ["class"];

  // Upcoming: future assignments/exams/extracurricular/personal, max 6
  const upcoming = useMemo(() => {
    return events
      .filter((ev) => {
        const d = parseDate(ev.start_time);
        return d && d >= today && UPCOMING_TYPES.includes(ev.event_type);
      })
      .sort((a, b) => parseDate(a.start_time) - parseDate(b.start_time))
      .slice(0, 6);
  }, [events, today]);

  // Today: classes scheduled today
  const todayKey = toDateKey(today);
  const todayEvents = useMemo(() => {
    return events
      .filter((ev) => {
        const d = parseDate(ev.start_time);
        return d && toDateKey(d) === todayKey && TODAY_TYPES.includes(ev.event_type);
      })
      .sort((a, b) => parseDate(a.start_time) - parseDate(b.start_time));
  }, [events, todayKey]);

  // Range label for current week
  const { start: weekStart, end: weekEnd } = weekRange(today);
  const rangeLabel = fmtRangeLabel(weekStart, weekEnd);

  // Mini-calendar grid
  const grid = useMemo(
    () => buildGrid(displayMonth.getFullYear(), displayMonth.getMonth()),
    [displayMonth]
  );

  function prevMonth() {
    setDisplayMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function nextMonth() {
    setDisplayMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  return (
    <AppShell onLogout={onLogout} user={user} activePage="dashboard" onNavigate={onNavigate}>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Dashboard</h2>
          {/*<p className="text-sm text-xyon-muted mt-1">
            Hey there! Here's what you have coming up:
          </p> */}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-xyon-muted">Showing data:</div>
          <div className="px-4 py-2 rounded-xl bg-xyon-pill border border-xyon-line text-sm font-semibold">
            {rangeLabel}
          </div>
        </div>
      </div>

      {/* ── Body: left mini-calendar | right panels ── */}
      <div className="mt-5 grid grid-cols-[1fr_300px] gap-5 h-[calc(100%-80px)] overflow-hidden">

        {/* ── Mini Calendar ── */}
        <div className="rounded-xxl bg-[#fbfaf7] border border-xyon-line shadow-soft p-5 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Calendar</h3>
            <button
              onClick={() => onNavigate("calendar")}
              className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-80"
              style={{ backgroundColor: "var(--xyon-accent)", color: "#fff" }}
            >
              View All
            </button>
          </div>

          {/* Month nav bar */}
          <div className="flex items-center justify-between mb-3 rounded-xl overflow-hidden border border-xyon-line bg-[var(--xyon-accent)]">
            <button
              onClick={prevMonth}
              className="h-9 w-9 grid place-items-center hover:bg-black/10 text-white text-lg"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
            </span>
            <button
              onClick={nextMonth}
              className="h-9 w-9 grid place-items-center hover:bg-black/10 text-white text-lg"
            >
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW_LABELS.map((d) => (
              <div key={d} className="text-center text-[11px] text-xyon-muted font-semibold py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Date grid */}
          {grid.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((day, di) => {
                if (day === null) return <div key={di} className="h-10" />;
                const cellKey = `${displayMonth.getFullYear()}-${pad2(displayMonth.getMonth() + 1)}-${pad2(day)}`;
                const dots = dotsByDate[cellKey] || [];
                const isToday = cellKey === todayKey;
                return (
                  <div key={di} className="flex flex-col items-center py-0.5">
                    <div
                      className={[
                        "h-8 w-8 flex items-center justify-center rounded-full text-sm cursor-default",
                        isToday
                          ? "bg-xyon-ink text-white font-bold"
                          : "text-xyon-ink",
                      ].join(" ")}
                    >
                      {day}
                    </div>
                    <div className="flex gap-0.5 h-2 mt-0.5">
                      {dots.map((type) => (
                        <div
                          key={type}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: TYPE_COLOR[type] || "#d4d4d4" }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4 overflow-auto min-h-0">

          {/* Upcoming Dates */}
          <div className="rounded-xxl bg-[#fbfaf7] border border-xyon-line shadow-soft p-4 flex-1 min-h-0 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">Upcoming Dates</h3>
              <button
                onClick={() => onNavigate("calendar")}
                className="px-3 py-1 rounded-lg text-[11px] font-semibold hover:opacity-80"
                style={{ backgroundColor: "var(--xyon-accent)", color: "#fff" }}
              >
                View All
              </button>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-sm text-xyon-muted text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((ev) => {
                  const d = parseDate(ev.start_time);
                  const type = ev.event_type || "other";
                  return (
                    <div
                      key={ev.event_id}
                      className="flex items-center gap-2 rounded-xl bg-xyon-pill/70 px-3 py-2"
                    >
                      <span className="text-[11px] text-xyon-muted w-11 shrink-0">
                        {formatShortDate(d)}
                      </span>
                      <span className="text-sm font-medium flex-1 truncate">{ev.title}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                        style={{ backgroundColor: TYPE_COLOR[type] || "#d4d4d4" }}
                      >
                        {TYPE_LABEL[type] || type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today */}
          <div className="rounded-xxl bg-[#fbfaf7] border border-xyon-line shadow-soft p-4 flex-1 min-h-0 overflow-auto">
            <h3 className="text-base font-bold mb-3">Today</h3>

            {todayEvents.length === 0 ? (
              <p className="text-sm text-xyon-muted text-center py-4">
                No classes today
              </p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((ev) => {
                  const start = parseDate(ev.start_time);
                  const end   = parseDate(ev.end_time);
                  const displayTitle = ev.course || ev.title;
                  const timeStr = ev.all_day
                    ? "All day"
                    : `${formatTime(start)}–${formatTime(end)}`;
                  return (
                    <div
                      key={ev.event_id}
                      className="rounded-xl px-4 py-3"
                      style={{ backgroundColor: TYPE_COLOR.class }}
                    >
                      <div className="text-sm font-bold">{displayTitle}</div>
                      <div className="text-xs mt-0.5 opacity-70">{timeStr}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
