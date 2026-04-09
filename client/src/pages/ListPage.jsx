import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/layout/AppShell";
import AddEventModal from "../components/common/AddEventModal";
import EditEventModal from "../components/common/EditEventModal";

// ── helpers ──────────────────────────────────────────────────────────────────
const pad2 = (n) => String(n).padStart(2, "0");

function parseDate(str) {
  if (!str) return null;
  return new Date(str.replace(" ", "T"));
}

function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS    = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAYS_SH = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmtDateHeader(d) {
  return `${DAYS_SH[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtRangeDate(d) {
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

function fmtTime(d) {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m ? `:${pad2(m)}` : ""}${d.getHours() >= 12 ? "pm" : "am"}`;
}

function timeLabel(ev) {
  const start = parseDate(ev.start_time);
  const end   = parseDate(ev.end_time);
  if (ev.all_day) return "All day";
  if (ev.event_type === "assignment" || ev.event_type === "exam")
    return `Due ${fmtTime(start)}`;
  if (start && end && start.getTime() !== end.getTime())
    return `${fmtTime(start)} – ${fmtTime(end)}`;
  return fmtTime(start);
}

// ── color maps ────────────────────────────────────────────────────────────────
const TYPE_BG = {
  class:      "#b9d3b4",
  assignment: "#a9c0e8",
  exam:       "#bca9d8",
  club:       "#f5e3a3",
  personal:   "#f7b4c6",
  work:       "#c8c8c8",
  other:      "#d4d4d4",
};

const TYPE_TEXT = {
  class:      "#2e6040",
  assignment: "#1e4d8c",
  exam:       "#4a2d82",
  club:       "#6b5a00",
  personal:   "#8c2040",
  work:       "#3a3a3a",
  other:      "#555555",
};

// ── tiny colored icon ─────────────────────────────────────────────────────────
const TYPE_ICON = {
  class:      "C",
  assignment: "A",
  exam:       "E",
  club:       "X",
  personal:   "P",
  work:       "W",
  other:      "O",
};

function EventIcon({ type }) {
  const bg   = TYPE_BG[type]   || "#d4d4d4";
  const text = TYPE_TEXT[type] || "#555";
  return (
    <span
      className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
      style={{ backgroundColor: bg, color: text }}
    >
      {TYPE_ICON[type] || "O"}
    </span>
  );
}

// ── convert raw DB event → EditEventModal-compatible object ───────────────────
function toFCEvent(ev) {
  return {
    id:    String(ev.event_id),
    title: ev.course && ev.course !== ev.title
             ? `${ev.course} — ${ev.title}`
             : ev.title,
    start:  parseDate(ev.start_time),
    end:    parseDate(ev.end_time),
    allDay: !!ev.all_day,
    extendedProps: {
      kind:          ev.event_type,
      course:        ev.course,
      originalTitle: ev.title,
    },
  };
}

// ── main component ────────────────────────────────────────────────────────────
export default function ListPage({ onLogout, user, onNavigate }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = toDateKey(today);

  const [events,    setEvents]    = useState([]);
  const [editEvent, setEditEvent] = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [tab,       setTab]       = useState("due"); // "due" | "schedule"

  const DUE_TYPES      = ["assignment", "exam"];
  const SCHEDULE_TYPES = ["class", "personal", "work", "club", "other"];

  const todaySectionRef = useRef(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  async function loadEvents() {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    try {
      const res  = await fetch(`http://localhost:3001/api/events?user_id=${u.user_id}`);
      const data = await res.json();
      if (data.ok) setEvents(data.events);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadEvents(); }, []);

  // Scroll to today once events are loaded
  useEffect(() => {
    if (todaySectionRef.current) {
      todaySectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [events]);

  // ── group by date ──────────────────────────────────────────────────────────
  const activeTypes = tab === "due" ? DUE_TYPES : SCHEDULE_TYPES;

  const grouped = useMemo(() => {
    const map = {};
    events
      .filter((ev) => activeTypes.includes(ev.event_type))
      .forEach((ev) => {
        const d = parseDate(ev.start_time);
        if (!d) return;
        const key = toDateKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, evs]) => ({
        key,
        date:    new Date(key + "T12:00:00"),
        isToday: key === todayKey,
        isPast:  key < todayKey,
        events:  [...evs].sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        ),
      }));
  }, [events, todayKey, tab]);

  // ── range label ────────────────────────────────────────────────────────────
  const rangeLabel = useMemo(() => {
    if (!grouped.length) return "";
    return `${fmtRangeDate(grouped[0].date)} – ${fmtRangeDate(grouped[grouped.length - 1].date)}`;
  }, [grouped]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const onCreate = async (payload) => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    try {
      const res  = await fetch("http://localhost:3001/api/events", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: u.user_id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to save."); return; }
      loadEvents();
    } catch { alert("Failed to save."); }
  };

  const onEdit = async ({ id, kind, title, course, start, end, allDay }) => {
    try {
      const res  = await fetch(`http://localhost:3001/api/events/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, course, kind, start, end, allDay }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to save."); return; }
      setEditEvent(null);
      loadEvents();
    } catch { alert("Failed to save."); }
  };

  const onDelete = async (id) => {
    try {
      const res  = await fetch(`http://localhost:3001/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to delete."); return; }
      setEditEvent(null);
      loadEvents();
    } catch { alert("Failed to delete."); }
  };

  const scrollToToday = () => {
    todaySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <AppShell onLogout={onLogout} user={user} activePage="list" onNavigate={onNavigate}>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">List View</h2>
          {/*<p className="text-sm text-xyon-muted mt-1">Here's what you have coming up:</p> */}
        </div>
        <div className="flex items-center gap-3">
          {/* Tab toggle */}
          <div className="flex rounded-xl border border-xyon-line overflow-hidden bg-xyon-pill text-sm font-semibold">
            <button
              onClick={() => setTab("due")}
              className={[
                "px-4 py-2 transition-colors",
                tab === "due" ? "bg-xyon-ink text-white" : "text-xyon-muted hover:text-xyon-ink",
              ].join(" ")}
            >
              Due Dates
            </button>
            <button
              onClick={() => setTab("schedule")}
              className={[
                "px-4 py-2 transition-colors",
                tab === "schedule" ? "bg-xyon-ink text-white" : "text-xyon-muted hover:text-xyon-ink",
              ].join(" ")}
            >
              Schedule
            </button>
          </div>
          {/*<div className="text-xs text-xyon-muted">Showing data:</div>
          <div className="px-4 py-2 rounded-xl bg-xyon-pill border border-xyon-line text-sm font-semibold">
            {rangeLabel || "—"}
          </div>
          <button
            onClick={scrollToToday}
            className="h-10 px-4 rounded-xl border border-xyon-line bg-white/60 hover:bg-white text-sm font-semibold"
          >
            Today
          </button> */}
          <button
            onClick={() => setShowAdd(true)}
            className="h-10 px-4 rounded-xl bg-xyon-ink text-white text-sm font-semibold hover:opacity-90 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> Create New Event
          </button>
        </div>
      </div>

      {/* List container */}
      <div className="mt-5 rounded-xxl bg-[#fbfaf7] border border-xyon-line shadow-soft overflow-auto h-[calc(100%-90px)]">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-xyon-muted">
            <p className="text-sm">
              {tab === "due" ? "No assignments or exams." : "No scheduled events."}
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-xl bg-xyon-ink text-white text-sm font-semibold hover:opacity-90"
            >
              + Create New Event
            </button>
          </div>
        ) : (
          grouped.map(({ key, date, isToday, isPast, events: dayEvents }) => (
            <div key={key} ref={isToday ? todaySectionRef : null}>

              {/* Date header */}
              <div
                className={[
                  "sticky top-0 z-10 px-6 py-2.5 border-b border-xyon-line flex items-center gap-2.5",
                  isToday ? "bg-xyon-pill2" : isPast ? "bg-[#eeecea]" : "bg-[#f3f1ed]",
                ].join(" ")}
              >
                {isToday && (
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--xyon-accent)" }} />
                )}
                <span
                  className={[
                    "text-sm font-bold tracking-wide",
                    isPast && !isToday ? "text-xyon-muted" : "text-xyon-ink",
                  ].join(" ")}
                >
                  {fmtDateHeader(date)}
                </span>
                {isToday && (
                  <span className="text-[11px] font-semibold" style={{ color: "var(--xyon-accent)" }}>
                    Today
                  </span>
                )}
              </div>

              {/* Event rows */}
              {dayEvents.map((ev, i) => {
                const textColor = TYPE_TEXT[ev.event_type] || "#555";
                const bgColor   = TYPE_BG[ev.event_type]   || "#d4d4d4";
                const displayTitle = ev.course && ev.course !== ev.title
                  ? `${ev.course} — ${ev.title}`
                  : ev.title;

                return (
                  <button
                    key={ev.event_id}
                    onClick={() => setEditEvent(toFCEvent(ev))}
                    className={[
                      "w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-white/70 transition-colors",
                      i < dayEvents.length - 1 ? "border-b border-xyon-line/40" : "",
                      isPast ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    {/* Colored type indicator */}
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: bgColor }}
                    />

                    <EventIcon type={ev.event_type} />

                    {/* Time */}
                    <span className="w-32 flex-shrink-0 text-sm text-xyon-muted">
                      {timeLabel(ev)}
                    </span>

                    {/* Title */}
                    <span
                      className="text-sm font-semibold flex-1 truncate"
                      style={{ color: textColor }}
                    >
                      {displayTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      <AddEventModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={(payload) => { onCreate(payload); setShowAdd(false); }}
        defaultDateStr={todayKey}
        defaultStartTime="09:00"
        defaultEndTime="10:15"
        defaultDueTime="23:59"
      />

      <EditEventModal
        open={!!editEvent}
        event={editEvent}
        onClose={() => setEditEvent(null)}
        onSave={onEdit}
        onDelete={onDelete}
      />
    </AppShell>
  );
}
