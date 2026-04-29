import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import AppShell from "../components/layout/AppShell";
import AddEventModal from "../components/common/AddEventModal";
import EditEventModal from "../components/common/EditEventModal";

const ACCENT = "var(--xyon-accent)";

const eventColor = (type) => ({
  class: "#b9d3b4", assignment: "#a9c0e8", exam: "#bca9d8",
  club: "#f5e3a3", extracurricular: "#f5e3a3",
  personal: "#f7b4c6", work: "#c8c8c8", other: "#d4d4d4",
}[(type || "").toLowerCase()] || "#d4d4d4");

const pad2 = (n) => String(n).padStart(2, "0");

const toYMD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toHM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const addMinutes = (d, mins) => new Date(d.getTime() + mins * 60000);

export default function CalendarPage({ onLogout, user, onNavigate, targetDate }) {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [pendingChange, setPendingChange] = useState(null); // { changeInfo, label }

  const [defaultDateStr, setDefaultDateStr] = useState(toYMD(new Date()));
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [defaultEndTime, setDefaultEndTime] = useState("10:15");
  const [defaultDueTime, setDefaultDueTime] = useState("23:59");

  const defaultView = localStorage.getItem("xyon-default-calendar-view") || "timeGridWeek";

  // External header state (single source of truth)
  const [viewType, setViewType] = useState(defaultView);
  const [rangeLabel, setRangeLabel] = useState("");
  const [titleLabel, setTitleLabel] = useState("");

  const fmtTitle = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }),
    []
  );

  const fmtRange = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
    []
  );

  const updateHeaderFromCalendar = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    const v = api.view;
    setViewType(v.type);

    // Title (e.g., March 2026)
    setTitleLabel(fmtTitle.format(v.currentStart));

    // Range label based on activeStart/activeEnd (activeEnd is exclusive)
    const start = v.activeStart;
    const endMinusOne = new Date(v.activeEnd.getTime() - 24 * 60 * 60 * 1000);

    setRangeLabel(`${fmtRange.format(start)} - ${fmtRange.format(endMinusOne)}`);
  };

  useEffect(() => {
    updateHeaderFromCalendar();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const u = JSON.parse(storedUser);
    fetch(`http://localhost:3001/api/events?user_id=${u.user_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        const loaded = data.events.map((ev) => {
          const color =
            ev.event_type === "class"      ? "#b9d3b4" :
            ev.event_type === "assignment" ? "#a9c0e8" :
            ev.event_type === "exam"       ? "#bca9d8" :
            ev.event_type === "club"       ? "#f5e3a3" :
            ev.event_type === "personal"   ? "#f7b4c6" :
            ev.event_type === "work"       ? "#c8c8c8" : "#d4d4d4";
          return {
            id: String(ev.event_id),
            title: ev.course && ev.course !== ev.title ? `${ev.course} — ${ev.title}` : ev.title,
            start: ev.start_time.replace(" ", "T"),
            end:   ev.end_time.replace(" ", "T"),
            allDay: !!ev.all_day,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { kind: ev.event_type, course: ev.course, originalTitle: ev.title, description: ev.description || null, location: ev.location || null }
          };
        });
        setEvents(loaded);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDateClick = (info) => {
    const clicked = info.date; // Date object with time slot (timeGrid) or midnight (dayGrid)
    const ymd = toYMD(clicked);
    const hm = toHM(clicked);

    setDefaultDateStr(ymd);
    setDefaultStartTime(hm);

    const end = addMinutes(clicked, 85);
    setDefaultEndTime(toHM(end));

    setDefaultDueTime(hm);
    setShowAdd(true);
  };

  const onCreate = async (payload) => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      alert("Please log in again before adding an event.");
      return;
    }

    const user = JSON.parse(storedUser);

    try {
      const response = await fetch("http://localhost:3001/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, ...payload })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        alert(data.error || "Failed to save event.");
        return;
      }

      const color = eventColor(payload.kind.toLowerCase());

      const newEvent = {
        id: String(data.event_id),
        title: payload.course && payload.course !== payload.title
          ? `${payload.course} — ${payload.title}`
          : payload.title,
        start: payload.start,
        end: payload.end || payload.start,
        allDay: payload.allDay,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { kind: payload.kind, course: payload.course, originalTitle: payload.title, description: payload.description || null, location: payload.location || null }
      };

      setEvents((p) => [...p, newEvent]);
    } catch (error) {
      console.error(error);
      alert("Failed to save event.");
    }
  };

  const onEventClick = (info) => {
    setEditEvent(info.event);
  };

  const onEdit = async ({ id, kind, title, course, description, location, start, end, allDay }) => {
    try {
      const res = await fetch(`http://localhost:3001/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, course, kind, description, location, start, end, allDay }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to save event."); return; }
      const color = eventColor(kind);
      setEvents((prev) => prev.map((e) =>
        e.id === id
          ? { ...e, title: course && course !== title ? `${course} — ${title}` : title,
              start, end, allDay, backgroundColor: color, borderColor: color,
              extendedProps: { kind, course, originalTitle: title, description: description || null, location: location || null } }
          : e
      ));
      setEditEvent(null);
    } catch { alert("Failed to save event."); }
  };

  const onDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to delete event."); return; }
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setEditEvent(null);
    } catch { alert("Failed to delete event."); }
  };

  const fmtEventTime = (ev) => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit"
    });
    if (ev.allDay) {
      const d = new Intl.DateTimeFormat("en-US", {
        weekday: "short", month: "short", day: "numeric"
      });
      return `${d.format(ev.start)} (all day)`;
    }
    return ev.end
      ? `${fmt.format(ev.start)} – ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(ev.end)}`
      : fmt.format(ev.start);
  };

  const onEventChange = (changeInfo) => {
    const ev = changeInfo.event;
    setPendingChange({
      changeInfo,
      label: fmtEventTime(ev)
    });
  };

  const confirmChange = async () => {
    const { changeInfo } = pendingChange;
    const ev = changeInfo.event;
    setPendingChange(null);

    try {
      const res = await fetch(`http://localhost:3001/api/events/${ev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: ev.startStr,
          end: ev.endStr || ev.startStr,
          allDay: ev.allDay
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "Failed to save change.");
        changeInfo.revert();
        return;
      }
      // Sync local state with the new times
      setEvents((prev) =>
        prev.map((e) =>
          e.id === ev.id
            ? { ...e, start: ev.startStr, end: ev.endStr || null, allDay: ev.allDay }
            : e
        )
      );
    } catch {
      alert("Failed to save change.");
      changeInfo.revert();
    }
  };

  const cancelChange = () => {
    pendingChange?.changeInfo.revert();
    setPendingChange(null);
  };

  const goPrev = () => {
    const api = calendarRef.current?.getApi();
    api?.prev();
    updateHeaderFromCalendar();
  };

  const goNext = () => {
    const api = calendarRef.current?.getApi();
    api?.next();
    updateHeaderFromCalendar();
  };

  const goToday = () => {
    const api = calendarRef.current?.getApi();
    api?.today();
    updateHeaderFromCalendar();
  };

  const setView = (type) => {
    const api = calendarRef.current?.getApi();
    api?.changeView(type);
    updateHeaderFromCalendar();
  };

  return (
    // AppShell owns the sidebar, so we pass logout down to the Sign Out item there.
    <AppShell onLogout={onLogout} user={user} activePage="calendar" onNavigate={onNavigate}>
      {/* Top header (single source of truth) */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Calendar View</h2>
          {/* <p className="text-sm text-xyon-muted mt-1">
            Here’s what is coming up:
          </p> */}
        </div>

        <div className="flex items-center gap-3">
          {/*<div className="text-xs text-xyon-muted">Showing date:</div>
          <div className="px-4 py-2 rounded-xl bg-xyon-pill border border-xyon-line text-sm font-semibold">
            {rangeLabel}
          </div> */}
          <div className="text-4xl font-extrabold tracking-tight text-xyon-ink/70">
            {titleLabel}
          </div>
        </div>
      </div>

      {/* Custom toolbar (pink accent) */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="h-10 w-10 rounded-xl border border-xyon-line bg-xyon-pill2 text-xyon-ink hover:bg-xyon-card text-lg font-semibold"
            onClick={goPrev}
            aria-label="Previous"
            title="Previous"
          >
            ‹
          </button>

          <button
            className="h-10 w-10 rounded-xl border border-xyon-line bg-xyon-pill2 text-xyon-ink hover:bg-xyon-card text-lg font-semibold"
            onClick={goNext}
            aria-label="Next"
            title="Next"
          >
            ›
          </button>

          <button
            className="h-10 px-4 rounded-xl border border-xyon-line bg-xyon-pill2 text-xyon-ink hover:bg-xyon-card text-sm font-semibold"
            onClick={goToday}
          >
            today
          </button>
        </div>

        <div className="flex items-center">
          <div className="flex rounded-xl overflow-hidden border border-xyon-line shadow-sm">
            <button
              className="h-10 px-4 text-sm font-semibold text-xyon-ink"
              style={{
                backgroundColor: viewType === "dayGridMonth" ? ACCENT : "var(--xyon-pill2)"
              }}
              onClick={() => setView("dayGridMonth")}
            >
              month
            </button>
            <button
              className="h-10 px-4 text-sm font-semibold border-l border-xyon-line text-xyon-ink"
              style={{
                backgroundColor: viewType === "timeGridWeek" ? ACCENT : "var(--xyon-pill2)"
              }}
              onClick={() => setView("timeGridWeek")}
            >
              week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mt-4 rounded-xxl bg-xyon-panel border border-xyon-line shadow-soft p-4 h-[calc(100%-120px)] overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView={defaultView}
          initialDate={targetDate || undefined}
          height="60vh"
          editable={true}
          selectable={true}
          nowIndicator={true}
          expandRows={true}
          allDaySlot={true}

          headerToolbar={false} // removes internal title + duplicate buttons

          fixedWeekCount={false}
          showNonCurrentDates={true}

          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="00:00:00"
          slotDuration="00:30:00"

          datesSet={updateHeaderFromCalendar} // keep outer header synced

          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
          eventChange={onEventChange}

          eventDisplay="block"
          dayMaxEvents={3}
          eventMinHeight={22}
          moreLinkContent={(arg) => `+${arg.num} more`}
          moreLinkClassNames="text-[10px] font-semibold text-xyon-muted hover:text-xyon-ink px-1 py-0.5 rounded"
          eventContent={(arg) => {
            const vt = arg.view.type;

            // Month view: title only (no time), truncate for crowded cells
            if (vt === "dayGridMonth") {
              return (
                <div className="px-1 overflow-hidden w-full">
                  <div className="text-[10px] font-bold leading-tight truncate">
                    {arg.event.title}
                  </div>
                </div>
              );
            }

            // Week view: title + time, truncate for narrow overlapping columns
            return (
              <div className="px-1 overflow-hidden w-full">
                <div className="text-[10px] font-bold leading-tight truncate">
                  {arg.event.title}
                </div>
                {!arg.event.allDay && (
                  <div className="text-[10px] opacity-80 truncate">{arg.timeText}</div>
                )}
              </div>
            );
          }}
        />
      </div>

      <AddEventModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={onCreate}
        defaultDateStr={defaultDateStr}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        defaultDueTime={defaultDueTime}
      />

      <EditEventModal
        open={!!editEvent}
        event={editEvent}
        onClose={() => setEditEvent(null)}
        onSave={onEdit}
        onDelete={onDelete}
      />

      {pendingChange && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={cancelChange} />
          <div className="absolute left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xxl bg-xyon-card border border-xyon-line shadow-soft p-6">
            <h3 className="text-lg font-extrabold">Save change?</h3>
            <p className="text-sm text-xyon-muted mt-1">
              Move <span className="font-semibold text-xyon-ink">"{pendingChange.changeInfo.event.title}"</span> to:
            </p>
            <p className="mt-2 px-3 py-2 rounded-xl bg-xyon-pill border border-xyon-line text-sm font-semibold">
              {pendingChange.label}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-white text-sm font-semibold"
                onClick={cancelChange}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-xyon-ink text-xyon-bg hover:opacity-90 text-sm font-semibold"
                onClick={confirmChange}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
