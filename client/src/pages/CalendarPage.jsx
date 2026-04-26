import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import AppShell from "../components/layout/AppShell";
import AddEventModal from "../components/common/AddEventModal";

const API_BASE = "http://localhost:3001";

const ACCENT = "#E6ABAB";

const pad2 = (n) => String(n).padStart(2, "0");

const toYMD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toHM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const addMinutes = (d, mins) => new Date(d.getTime() + mins * 60000);

const eventColor = (type) => ({
  class: "#b9d3b4",
  assignment: "#a9c0e8",
  exam: "#bca9d8",
  club: "#f5e3a3",
  personal: "#f7b4c6",
  work: "#c8c8c8",
  other: "#d4d4d4"
}[type] || "#d4d4d4");

function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function mapApiEvent(ev) {
  const color = eventColor(ev.event_type);

  return {
    id: String(ev.event_id),
    title: ev.course && ev.course !== ev.title ? `${ev.course} — ${ev.title}` : ev.title,
    start: ev.start_time.replace(" ", "T"),
    end: ev.end_time.replace(" ", "T"),
    allDay: !!ev.all_day,
    backgroundColor: color,
    borderColor: color,
    extendedProps: {
      kind: ev.event_type,
      course: ev.course,
      originalTitle: ev.title,
      source: ev.external_source,
      externalUrl: ev.external_url
    }
  };
}

export default function CalendarPage({ onLogout, user }) {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [canvasStatus, setCanvasStatus] = useState({ connected: false });
  const [canvasDomain, setCanvasDomain] = useState(localStorage.getItem("xyon-canvas-domain") || "");
  const [canvasBusy, setCanvasBusy] = useState(false);
  const [banner, setBanner] = useState("");

  const [defaultDateStr, setDefaultDateStr] = useState(toYMD(new Date()));
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [defaultEndTime, setDefaultEndTime] = useState("10:15");
  const [defaultDueTime, setDefaultDueTime] = useState("23:59");

  // External header state (single source of truth)
  const [viewType, setViewType] = useState("timeGridWeek");
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

  const loadEvents = async () => {
    const storedUser = getStoredUser();
    if (!storedUser?.user_id) return;

    setEventsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/events?user_id=${storedUser.user_id}`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load events.");
      }

      setEvents(data.events.map(mapApiEvent));
    } catch (error) {
      console.error(error);
      setBanner("We could not load calendar events from the server.");
    } finally {
      setEventsLoading(false);
    }
  };

  const loadCanvasStatus = async () => {
    const storedUser = getStoredUser();
    if (!storedUser?.user_id) return;

    try {
      const response = await fetch(`${API_BASE}/api/canvas/status?user_id=${storedUser.user_id}`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load Canvas status.");
      }

      setCanvasStatus(data);

      if (data.connected) {
        setCanvasDomain(data.canvas_base_url || data.canvas_domain || "");
      }
    } catch (error) {
      console.error(error);
      setBanner("We could not load Canvas connection status.");
    }
  };

  useEffect(() => {
    updateHeaderFromCalendar();

    const url = new URL(window.location.href);
    const canvasState = url.searchParams.get("canvas");
    const canvasMessage = url.searchParams.get("canvas_message");

    if (canvasState === "connected") {
      setBanner("Canvas connected successfully. Your assignments were synced into the calendar.");
    } else if (canvasState === "error") {
      setBanner(`Canvas connection failed${canvasMessage ? `: ${canvasMessage}` : "."}`);
    }

    if (canvasState || canvasMessage) {
      url.searchParams.delete("canvas");
      url.searchParams.delete("canvas_message");
      window.history.replaceState({}, "", url.toString());
    }

    loadEvents();
    loadCanvasStatus();
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
    const storedUser = getStoredUser();

    if (!storedUser) {
      alert("Please log in again before adding an event.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: storedUser.user_id,
          ...payload
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        alert(data.error || "Failed to save event.");
        return;
      }

      const kind = payload.kind.toLowerCase();
      const color = eventColor(kind);

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
        extendedProps: {
          kind,
          course: payload.course,
          originalTitle: payload.title,
          source: null,
          externalUrl: null
        }
      };

      setEvents((p) => [...p, newEvent]);
    } catch (error) {
      console.error(error);
      alert("Failed to save event.");
    }
  };

  const onEventClick = async (info) => {
    const source = info.event.extendedProps.source;
    const externalUrl = info.event.extendedProps.externalUrl;

    if (source === "canvas") {
      if (externalUrl) {
        const openCanvas = confirm(`"${info.event.title}" came from Canvas. Open it in Canvas?`);
        if (openCanvas) {
          window.open(externalUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        alert("This event is synced from Canvas. Update it in Canvas and then run Sync Canvas again.");
      }
      return;
    }

    const ok = confirm(`Delete "${info.event.title}"?`);
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/api/events/${info.event.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete event.");
      }

      setEvents((current) => current.filter((event) => event.id !== info.event.id));
      info.event.remove();
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to delete event.");
    }
  };

  const onEventChange = async (changeInfo) => {
    const ev = changeInfo.event;
    const source = ev.extendedProps.source;

    if (source === "canvas") {
      alert("Canvas-synced events must be moved in Canvas, then resynced here.");
      changeInfo.revert();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/events/${ev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ev.extendedProps.originalTitle || ev.title,
          course: ev.extendedProps.course || "",
          kind: ev.extendedProps.kind,
          start: ev.startStr,
          end: ev.endStr || ev.startStr,
          allDay: ev.allDay
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to save event.");
      }

      setEvents((prev) =>
        prev.map((event) =>
          event.id === ev.id
            ? {
                ...event,
                start: ev.startStr,
                end: ev.endStr || ev.startStr,
                allDay: ev.allDay
              }
            : event
        )
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to save event.");
      changeInfo.revert();
    }
  };

  const connectCanvas = () => {
    const storedUser = getStoredUser();

    if (!storedUser?.user_id) {
      alert("Please log in again before connecting Canvas.");
      return;
    }

    if (!canvasDomain.trim()) {
      alert("Enter your school Canvas domain first, for example montclair.instructure.com.");
      return;
    }

    localStorage.setItem("xyon-canvas-domain", canvasDomain.trim());
    const connectUrl = `${API_BASE}/api/canvas/connect?user_id=${storedUser.user_id}&canvas_domain=${encodeURIComponent(canvasDomain.trim())}`;
    window.location.href = connectUrl;
  };

  const syncCanvas = async () => {
    const storedUser = getStoredUser();
    if (!storedUser?.user_id) return;

    setCanvasBusy(true);
    setBanner("");

    try {
      const response = await fetch(`${API_BASE}/api/canvas/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: storedUser.user_id })
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Canvas sync failed.");
      }

      await Promise.all([loadEvents(), loadCanvasStatus()]);
      setBanner(`Canvas sync finished. Imported ${data.summary.importedEvents} event${data.summary.importedEvents === 1 ? "" : "s"}.`);
    } catch (error) {
      console.error(error);
      setBanner(error.message || "Canvas sync failed.");
    } finally {
      setCanvasBusy(false);
    }
  };

  const disconnectCanvas = async () => {
    const storedUser = getStoredUser();
    if (!storedUser?.user_id) return;

    const confirmed = confirm("Disconnect Canvas and remove its synced events from this calendar?");
    if (!confirmed) return;

    setCanvasBusy(true);
    setBanner("");

    try {
      const response = await fetch(`${API_BASE}/api/canvas/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: storedUser.user_id })
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to disconnect Canvas.");
      }

      await Promise.all([loadEvents(), loadCanvasStatus()]);
      setBanner("Canvas was disconnected and its synced events were removed.");
    } catch (error) {
      console.error(error);
      setBanner(error.message || "Failed to disconnect Canvas.");
    } finally {
      setCanvasBusy(false);
    }
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
    <AppShell onLogout={onLogout} user={user}>
      <div className="flex h-full flex-col">
        {/* Top header (single source of truth) */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">Calendar View</h2>
            <p className="text-sm text-xyon-muted mt-1">
              Here’s what is coming up, including anything you sync from Canvas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-xyon-muted">Showing date:</div>
            <div className="px-4 py-2 rounded-xl bg-xyon-pill border border-xyon-line text-sm font-semibold">
              {rangeLabel}
            </div>
            <div className="text-4xl font-extrabold tracking-tight text-xyon-ink/70">
              {titleLabel}
            </div>
          </div>
        </div>

        {banner && (
          <div className="mt-4 rounded-xxl border border-xyon-line bg-[#fbfaf7] px-4 py-3 text-sm text-xyon-ink">
            {banner}
          </div>
        )}

        <div className="mt-4 rounded-xxl border border-xyon-line bg-[#fbfaf7] p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-xyon-muted">
                Canvas Domain
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                value={canvasDomain}
                onChange={(e) => setCanvasDomain(e.target.value)}
                placeholder="montclair.instructure.com"
              />
            </div>

            <button
              className="h-10 rounded-xl bg-xyon-ink px-4 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={connectCanvas}
              disabled={canvasBusy}
            >
              {canvasStatus.connected ? "Reconnect Canvas" : "Connect Canvas"}
            </button>

            <button
              className="h-10 rounded-xl border border-xyon-line bg-white/70 px-4 text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={syncCanvas}
              disabled={!canvasStatus.connected || canvasBusy}
            >
              {canvasBusy ? "Working..." : "Sync Canvas"}
            </button>

            <button
              className="h-10 rounded-xl border border-xyon-line bg-white/70 px-4 text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={disconnectCanvas}
              disabled={!canvasStatus.connected || canvasBusy}
            >
              Disconnect
            </button>
          </div>

          <p className="mt-3 text-sm text-xyon-muted">
            {canvasStatus.connected
              ? `Connected to ${canvasStatus.canvas_domain || "Canvas"}. Sync pulls assignment due dates and Canvas calendar events into your Xyon calendar.`
              : "Connect your school Canvas account here to import assignment due dates and calendar items."}
          </p>
        </div>

        {/* Custom toolbar (pink accent) */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="h-10 w-10 rounded-xl border border-xyon-line bg-white/60 hover:bg-white"
              onClick={goPrev}
              aria-label="Previous"
              title="Previous"
            >
              ‹
            </button>

            <button
              className="h-10 w-10 rounded-xl border border-xyon-line bg-white/60 hover:bg-white"
              onClick={goNext}
              aria-label="Next"
              title="Next"
            >
              ›
            </button>

            <button
              className="h-10 px-4 rounded-xl border border-xyon-line bg-white/60 hover:bg-white text-sm font-semibold"
              onClick={goToday}
            >
              today
            </button>
          </div>

          <div className="flex items-center">
            <div className="flex rounded-xl overflow-hidden border border-xyon-line shadow-sm">
              <button
                className="h-10 px-4 text-sm font-semibold"
                style={{
                  backgroundColor: viewType === "dayGridMonth" ? ACCENT : "rgba(255,255,255,0.6)"
                }}
                onClick={() => setView("dayGridMonth")}
              >
                month
              </button>
              <button
                className="h-10 px-4 text-sm font-semibold border-l border-xyon-line"
                style={{
                  backgroundColor: viewType === "timeGridWeek" ? ACCENT : "rgba(255,255,255,0.6)"
                }}
                onClick={() => setView("timeGridWeek")}
              >
                week
              </button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mt-4 flex-1 min-h-0 rounded-xxl bg-[#fbfaf7] border border-xyon-line shadow-soft p-4 overflow-hidden">
          {eventsLoading ? (
            <div className="grid h-full place-items-center text-sm text-xyon-muted">
              Loading calendar events...
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              initialDate={toYMD(new Date())}
              height="100%"
              editable={true}
              selectable={true}
              nowIndicator={true}
              expandRows={true}
              allDaySlot={true}
              headerToolbar={false}
              fixedWeekCount={false}
              showNonCurrentDates={true}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              scrollTime="00:00:00"
              slotDuration="00:30:00"
              datesSet={updateHeaderFromCalendar}
              events={events}
              dateClick={onDateClick}
              eventClick={onEventClick}
              eventChange={onEventChange}
              eventDisplay="block"
              eventContent={(arg) => {
                const vt = arg.view.type;

                if (vt === "dayGridMonth") {
                  return (
                    <div className="px-1">
                      <div className="text-[10px] font-bold leading-tight">
                        {arg.event.title}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="px-1">
                    <div className="text-[10px] font-bold leading-tight">
                      {arg.event.title}
                    </div>
                    {!arg.event.allDay && (
                      <div className="text-[10px] opacity-80">{arg.timeText}</div>
                    )}
                  </div>
                );
              }}
            />
          )}
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
      </div>
    </AppShell>
  );
}
