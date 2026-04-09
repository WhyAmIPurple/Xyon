import React, { useEffect, useState } from "react";

const pad2 = (n) => String(n).padStart(2, "0");
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toHM  = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const inputCls =
  "mt-1 w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 outline-none focus:bg-white";

// Map DB event_type → modal type toggle value
function toToggleType(kind) {
  if ((kind || "").toLowerCase() === "assignment") return "Assignment";
  return "Class"; // default everything else to Class for now
}

export default function EditEventModal({ open, event, onClose, onSave, onDelete }) {
  const [type,      setType]      = useState("Class");
  const [title,     setTitle]     = useState("");
  const [course,    setCourse]    = useState("");
  const [date,      setDate]      = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime,   setEndTime]   = useState("10:15");
  const [dueTime,   setDueTime]   = useState("23:59");
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    const t = toToggleType(event.extendedProps?.kind);
    setType(t);
    if (t === "Class") {
      // For class, the course field is the primary identifier; originalTitle holds it
      setCourse(event.extendedProps?.originalTitle || event.extendedProps?.course || event.title || "");
      setTitle("");
    } else {
      setTitle(event.extendedProps?.originalTitle || event.title || "");
      setCourse(event.extendedProps?.course || "");
    }
    if (event.start) {
      setDate(toYMD(event.start));
      setStartTime(toHM(event.start));
      setDueTime(toHM(event.start));
    }
    setEndTime(event.end ? toHM(event.end) : toHM(event.start));
  }, [open, event]);

  if (!open || !event) return null;

  const canSubmit =
    type === "Class"
      ? course.trim().length > 0 && startTime < endTime
      : title.trim().length > 0;

  const handleSave = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    const start = `${date}T${type === "Class" ? startTime : dueTime}:00`;
    const end   = `${date}T${type === "Class" ? endTime   : dueTime}:00`;
    const titleVal = type === "Class" ? course.trim() : title.trim();
    await onSave({ id: event.id, kind: type, title: titleVal, course: course.trim(), start, end, allDay: false });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    await onDelete(event.id);
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-xxl bg-xyon-card border border-xyon-line shadow-soft p-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Edit event</h3>
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

        {/* Type toggle — same style as AddEventModal */}
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
                className={inputCls}
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
              className={inputCls}
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., CSIT 415"
            />
          </div>

          <div>
            <label className="text-xs text-xyon-muted">Date</label>
            <input
              type="date"
              className={inputCls}
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
          ) : (
            <div>
              <label className="text-xs text-xyon-muted">Due time</label>
              <input
                type="time"
                className={inputCls}
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          )}
        </div>

        {!canSubmit && (
          <p className="mt-3 text-sm text-red-600">
            {type === "Class"
              ? "Course is required and start time must be before end time."
              : "Title is required."}
          </p>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <button
            className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <div className="flex gap-2">
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
              onClick={handleSave}
              disabled={!canSubmit || saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
