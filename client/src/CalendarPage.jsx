import React, { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const seedEvents = [
  {
    id: "a1",
    title: "CSIT 415 Milestone 1",
    start: "2026-03-05",
    allDay: true,
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
    extendedProps: { course: "CSIT 415", type: "Assignment" }
  }
];

export default function CalendarPage() {
  const [events, setEvents] = useState(seedEvents);

  const handleDateClick = (info) => {
    const title = prompt("Event title?");
    if (!title || !title.trim()) return;

    const newEvent = {
      id: String(Date.now()),
      title: title.trim(),
      start: info.dateStr, // YYYY-MM-DD
      allDay: info.allDay ?? true,
      backgroundColor: "#ef4444",
      borderColor: "#ef4444"
    };

    setEvents((prev) => [...prev, newEvent]);
  };

  const handleEventChange = (changeInfo) => {
    // Handles drag/drop + resize updates
    const updated = changeInfo.event;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === updated.id
          ? {
              ...e,
              title: updated.title,
              start: updated.startStr,
              end: updated.endStr || null,
              allDay: updated.allDay
            }
          : e
      )
    );
  };

  const handleEventClick = (clickInfo) => {
    const doDelete = confirm(`Delete "${clickInfo.event.title}"?`);
    if (!doDelete) return;

    const id = clickInfo.event.id;
    clickInfo.event.remove(); // removes from UI immediately
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Xyon Calendar</h1>
        <span style={{ color: "#555" }}>
          Click a day to add • Click an event to delete • Drag to move
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          height="80vh"
          editable={true}          // allows drag/drop and resize
          selectable={true}
          dateClick={handleDateClick}
          eventChange={handleEventChange}
          eventClick={handleEventClick}
          events={events}
        />
      </div>
    </div>
  );
}