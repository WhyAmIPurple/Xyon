import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import AppShell from "../components/layout/AppShell";
import AddEventModal from "../components/common/AddEventModal";

const seed = [
  {
    id: "1",
    title: "James Barrera’s Birthday",
    start: "2026-03-05",
    allDay: true,
    backgroundColor: "#f7b4c6",
    borderColor: "#f7b4c6"
  },
  {
    id: "2",
    title: "AMAT 320",
    start: "2026-03-02T08:00:00",
    end: "2026-03-02T10:30:00",
    backgroundColor: "#b9d3b4",
    borderColor: "#b9d3b4"
  }
];

const ACCENT = "#E6ABAB";

const pad2 = (n) => String(n).padStart(2, "0");

const toYMD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toHM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const addMinutes = (d, mins) => new Date(d.getTime() + mins * 60000);

export default function CalendarPage(onLogout) {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState(seed);
  const [showAdd, setShowAdd] = useState(false);

  const [defaultDateStr, setDefaultDateStr] = useState("2026-03-01");
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

  useEffect(() => {
    updateHeaderFromCalendar();
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

  const onCreate = (payload) => {
    const color = payload.kind === "Class" ? "#bca9d8" : "#a9c0e8";

    const newEvent = {
      id: String(Date.now()),
      title: payload.course ? `${payload.course} — ${payload.title}` : payload.title,
      start: payload.start,
      end: payload.end,
      allDay: payload.allDay,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { kind: payload.kind, course: payload.course }
    };

    setEvents((p) => [...p, newEvent]);
  };

  const onEventClick = (info) => {
    const ok = confirm(`Delete "${info.event.title}"?`);
    if (!ok) return;
    const id = info.event.id;
    info.event.remove();
    setEvents((p) => p.filter((e) => e.id !== id));
  };

  const onEventChange = (changeInfo) => {
    const ev = changeInfo.event;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === ev.id
          ? {
              ...e,
              title: ev.title,
              start: ev.startStr,
              end: ev.endStr || null,
              allDay: ev.allDay
            }
          : e
      )
    );
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
    <AppShell>
      {/* Top header (single source of truth) */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Calendar View</h2>
          <p className="text-sm text-xyon-muted mt-1">
            Here’s what is coming up:
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
      <div className="mt-4 rounded-xxl bg-[#fbfaf7] border border-xyon-line shadow-soft p-4 h-[calc(100%-120px)] overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate="2026-03-01"
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
          eventContent={(arg) => {
            const vt = arg.view.type;

            // Month view: title only (no time)
            if (vt === "dayGridMonth") {
              return (
                <div className="px-1">
                  <div className="text-[10px] font-bold leading-tight">
                    {arg.event.title}
                  </div>
                </div>
              );
            }

            // Week view: title + time
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
    </AppShell>
  );
}