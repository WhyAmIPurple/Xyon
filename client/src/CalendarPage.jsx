import React, { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const initialAssignments = [
  {
    id: "a1",
    title: "CSIT 415 Milestone 1",
    dueDate: "2026-03-05",
    course: "CSIT 415",
    type: "Assignment",
    color: "#4f46e5"
  },
  {
    id: "a2",
    title: "Networks Quiz",
    dueDate: "2026-03-06",
    course: "CSIT 340",
    type: "Quiz",
    color: "#059669"
  }
];

export default function CalendarPage() {
  const [assignments, setAssignments] = useState(initialAssignments);

  const events = useMemo(() => {
    return assignments.map(a => ({
      id: a.id,
      title: a.title,
      start: a.dueDate,
      allDay: true,
      backgroundColor: a.color,
      borderColor: a.color,
      extendedProps: {
        course: a.course,
        type: a.type
      }
    }));
  }, [assignments]);

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 12 }}>Xyon Calendar</h1>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
        height="80vh"
        events={events}
        eventClick={(info) => {
          const { course, type } = info.event.extendedProps;
          alert(`${info.event.title}\n${course} • ${type}\nDue: ${info.event.startStr}`);
        }}
      />
    </div>
  );
}