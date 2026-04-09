import React, { useEffect, useMemo, useState } from "react";

const pad2 = (n) => String(n).padStart(2, "0");

function toLocalDate(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function combineDateTime(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  return `${dateStr}T${timeStr}:00`;
}

export default function AddEventModal({
  open,
  onClose,
  onCreate,
  defaultDateStr,
  defaultStartTime,
  defaultEndTime,
  defaultDueTime
}) {
    
  const [type, setType] = useState("Class"); // "Class" | "Assignment"
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState(defaultDateStr || toLocalDate(new Date()));

  // Class fields
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15");

  // Assignment fields
  const [dueTime, setDueTime] = useState("23:59");
  useEffect(() => {
    if (!open) return;

    const d = (defaultDateStr || toLocalDate(new Date())).slice(0, 10);

    setType("Class");
    setTitle("");
    setCourse("");
    setDate(d);

    setStartTime(defaultStartTime || "09:00");
    setEndTime(defaultEndTime || "10:15");
    setDueTime(defaultDueTime || "23:59");
    }, [open, defaultDateStr, defaultStartTime, defaultEndTime, defaultDueTime]);

  const canSubmit = useMemo(() => {
    if (type === "Class") {
      return course.trim().length > 0 && startTime < endTime;
    }
    return title.trim().length > 0;
  }, [title, course, type, startTime, endTime]);

  if (!open) return null;

  const submit = () => {
    if (!canSubmit) return;

    if (type === "Class") {
      onCreate({
        kind: "Class",
        title: course.trim(),  // course name is the title for a class
        course: course.trim(),
        start: combineDateTime(date, startTime),
        end: combineDateTime(date, endTime),
        allDay: false
      });
    } else {
      // Assignment: show it as a timed event OR all-day marker.
      // We'll use timed (due time) so it can appear in day/week views.
      onCreate({
        kind: "Assignment",
        title: title.trim(),
        course: course.trim(),
        start: combineDateTime(date, dueTime),
        end: null,
        allDay: false
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-xxl bg-xyon-card border border-xyon-line shadow-soft p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Add event</h3>
            <p className="text-sm text-xyon-muted mt-1">
              Choose a type, then fill in the details.
            </p>
          </div>
          <button
            className="h-9 w-9 rounded-full border border-xyon-line bg-white/60 hover:bg-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Type toggle */}
        <div className="mt-4 flex gap-2">
          {["Class", "Assignment"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={[
                "px-4 py-2 rounded-xl border text-sm font-semibold",
                type === t
                  ? "bg-xyon-pill2 border-xyon-line"
                  : "bg-white/50 border-xyon-line hover:bg-white"
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {type === "Assignment" && (
            <div className="col-span-2">
              <label className="text-xs text-xyon-muted">Title</label>
              <input
                className="mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 outline-none focus:bg-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., HW 3 Due"
              />
            </div>
          )}

          <div className="col-span-2">
            <label className="text-xs text-xyon-muted">
              {type === "Class" ? "Course" : "Course (optional)"}
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 outline-none focus:bg-white"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., CSIT 415"
            />
          </div>

          <div>
            <label className="text-xs text-xyon-muted">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 outline-none focus:bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {type === "Class" ? (
            <>
              <div>
                <label className="text-xs text-xyon-muted">Start time</label>
                <input
                  type="time"
                  className="mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 outline-none focus:bg-white"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-xyon-muted">End time</label>
                <input
                  type="time"
                  className="mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 outline-none focus:bg-white"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs text-xyon-muted">Due time</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 outline-none focus:bg-white"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          )}
        </div>

        {!canSubmit && (
          <div className="mt-3 text-sm text-red-600">
            {type === "Class"
              ? "Course is required and start time must be before end time."
              : "Title is required."}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-xyon-line bg-white/60 hover:bg-white text-sm font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={[
              "px-4 py-2 rounded-xl text-sm font-semibold",
              canSubmit
                ? "bg-xyon-ink text-white hover:opacity-90"
                : "bg-xyon-ink/30 text-white cursor-not-allowed"
            ].join(" ")}
            onClick={submit}
            disabled={!canSubmit}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}