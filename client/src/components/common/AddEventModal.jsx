import React, { useEffect, useMemo, useState } from "react";

const pad2 = (n) => String(n).padStart(2, "0");

function toLocalDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function combineDateTime(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`;
}

const inputCls =
  "mt-1 w-full rounded-xl border border-xyon-line bg-xyon-panel px-3 py-2 outline-none focus:bg-xyon-panel text-sm";

const TYPES = ["Class", "Assignment", "Exam", "Extracurricular", "Personal", "Other"];

export default function AddEventModal({
  open,
  onClose,
  onCreate,
  defaultDateStr,
  defaultStartTime,
  defaultEndTime,
  defaultDueTime,
}) {
  const [type,        setType]        = useState("Class");
  const [title,       setTitle]       = useState("");
  const [course,      setCourse]      = useState("");
  const [location,    setLocation]    = useState("");
  const [description, setDescription] = useState("");
  const [date,        setDate]        = useState(defaultDateStr || toLocalDate(new Date()));
  const [startTime,   setStartTime]   = useState("09:00");
  const [endTime,     setEndTime]     = useState("10:15");
  const [dueTime,     setDueTime]     = useState("23:59");
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (!open) return;
    const d = (defaultDateStr || toLocalDate(new Date())).slice(0, 10);
    setType("Class");
    setTitle("");
    setCourse("");
    setLocation("");
    setDescription("");
    setDate(d);
    setStartTime(defaultStartTime || "09:00");
    setEndTime(defaultEndTime   || "10:15");
    setDueTime(defaultDueTime   || "23:59");
    setSubmitting(false);
  }, [open, defaultDateStr, defaultStartTime, defaultEndTime, defaultDueTime]);

  const canSubmit = useMemo(() => {
    if (type === "Class")      return course.trim().length > 0 && startTime < endTime;
    if (type === "Assignment") return title.trim().length > 0;
    return title.trim().length > 0 && startTime < endTime;
  }, [title, course, type, startTime, endTime]);

  if (!open) return null;

  const submit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    if (type === "Class") {
      onCreate({ kind: "Class", title: course.trim(), course: course.trim(),
        start: combineDateTime(date, startTime), end: combineDateTime(date, endTime), allDay: false });
    } else if (type === "Assignment") {
      onCreate({ kind: "Assignment", title: title.trim(), course: course.trim() || null,
        description: description.trim() || null,
        start: combineDateTime(date, dueTime), end: null, allDay: false });
    } else if (type === "Extracurricular") {
      onCreate({ kind: "Extracurricular", title: title.trim(),
        location: location.trim() || null, description: description.trim() || null,
        start: combineDateTime(date, startTime), end: combineDateTime(date, endTime), allDay: false });
    } else {
      // Exam, Personal, Other
      onCreate({ kind: type, title: title.trim(),
        course: type === "Exam" ? (course.trim() || null) : null,
        description: description.trim() || null,
        start: combineDateTime(date, startTime), end: combineDateTime(date, endTime), allDay: false });
    }

    onClose();
  };

  const showTitle       = type !== "Class";
  const showCourse      = type === "Class" || type === "Assignment" || type === "Exam";
  const showLocation    = type === "Extracurricular";
  const showDescription = type !== "Class";

  const titlePlaceholder =
    type === "Assignment" ? "e.g., HW 3 Due" :
    type === "Exam"       ? "e.g., Midterm"   : "e.g., Team meeting";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2
                      rounded-xxl bg-xyon-card border border-xyon-line shadow-soft p-6
                      overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Add event</h3>
            <p className="text-sm text-xyon-muted mt-1">Choose a type, then fill in the details.</p>
          </div>
          <button
            className="h-9 w-9 rounded-full border border-xyon-line bg-xyon-pill hover:bg-xyon-card flex-shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Type toggle grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={[
                "px-2 py-2 rounded-xl border text-sm font-semibold",
                type === t
                  ? "bg-xyon-pill2 border-xyon-line"
                  : "bg-xyon-pill border-xyon-line hover:bg-xyon-card",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {showTitle && (
            <div className="col-span-2">
              <label className="text-xs text-xyon-muted">Title</label>
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titlePlaceholder}
              />
            </div>
          )}

          {showCourse && (
            <div className="col-span-2">
              <label className="text-xs text-xyon-muted">
                {type === "Class" ? "Course" : "Course (optional)"}
              </label>
              <input
                className={inputCls}
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g., CSIT 415"
              />
            </div>
          )}

          {showLocation && (
            <div className="col-span-2">
              <label className="text-xs text-xyon-muted">
                Location <span className="text-xyon-muted/60">(optional)</span>
              </label>
              <input
                className={inputCls}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Gymnasium"
              />
            </div>
          )}

          {showDescription && (
            <div className="col-span-2">
              <label className="text-xs text-xyon-muted">
                Description <span className="text-xyon-muted/60">(optional)</span>
              </label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "Assignment" ? "e.g., Chapter 5 problems 1–10" : "e.g., Additional notes"
                }
              />
            </div>
          )}

          <div>
            <label className="text-xs text-xyon-muted">Date</label>
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {type === "Assignment" ? (
            <div>
              <label className="text-xs text-xyon-muted">Due time</label>
              <input
                type="time"
                className={inputCls}
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-xyon-muted">Start time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-xyon-muted">End time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {!canSubmit && (
          <p className="mt-3 text-sm text-red-600">
            {type === "Class"
              ? "Course is required and start time must be before end time."
              : type === "Assignment"
              ? "Title is required."
              : "Title is required and start time must be before end time."}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-xyon-card text-sm font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={[
              "px-4 py-2 rounded-xl text-sm font-semibold",
              canSubmit && !submitting
                ? "bg-xyon-ink text-xyon-bg hover:opacity-90"
                : "bg-xyon-ink/30 text-xyon-bg cursor-not-allowed",
            ].join(" ")}
            onClick={submit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
