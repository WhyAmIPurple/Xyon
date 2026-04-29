import React, { useEffect, useState } from "react";

const pad2 = (n) => String(n).padStart(2, "0");
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toHM  = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const inputCls =
  "mt-1 w-full rounded-xl border border-xyon-line bg-xyon-panel px-3 py-2 outline-none focus:bg-xyon-panel text-sm";

const TYPES = ["Class", "Assignment", "Exam", "Extracurricular", "Personal", "Other"];

function toToggleType(kind) {
  return ({
    class: "Class", assignment: "Assignment", exam: "Exam",
    club: "Extracurricular", personal: "Personal",
    work: "Other", other: "Other",
  })[(kind || "").toLowerCase()] || "Other";
}

export default function EditEventModal({ open, event, onClose, onSave, onDelete }) {
  const [type,        setType]        = useState("Class");
  const [title,       setTitle]       = useState("");
  const [course,      setCourse]      = useState("");
  const [location,    setLocation]    = useState("");
  const [description, setDescription] = useState("");
  const [date,        setDate]        = useState("");
  const [startTime,   setStartTime]   = useState("09:00");
  const [endTime,     setEndTime]     = useState("10:15");
  const [dueTime,     setDueTime]     = useState("23:59");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    const t = toToggleType(event.extendedProps?.kind);
    setType(t);

    if (t === "Class") {
      setCourse(event.extendedProps?.originalTitle || event.extendedProps?.course || event.title || "");
      setTitle("");
    } else {
      setTitle(event.extendedProps?.originalTitle || event.title || "");
      setCourse(event.extendedProps?.course || "");
    }

    setLocation(event.extendedProps?.location || "");
    setDescription(event.extendedProps?.description || "");

    if (event.start) {
      setDate(toYMD(event.start));
      setStartTime(toHM(event.start));
      setDueTime(toHM(event.start));
    }
    setEndTime(event.end ? toHM(event.end) : (event.start ? toHM(event.start) : "10:15"));
  }, [open, event]);

  if (!open || !event) return null;

  const canSubmit =
    type === "Class"      ? course.trim().length > 0 && startTime < endTime :
    type === "Assignment" ? title.trim().length > 0 :
    title.trim().length > 0 && startTime < endTime;

  const handleSave = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);

    let payload;
    if (type === "Class") {
      payload = { id: event.id, kind: "Class", title: course.trim(), course: course.trim(),
        description: null, location: null,
        start: `${date}T${startTime}:00`, end: `${date}T${endTime}:00`, allDay: false };
    } else if (type === "Assignment") {
      payload = { id: event.id, kind: "Assignment", title: title.trim(),
        course: course.trim() || null, description: description.trim() || null, location: null,
        start: `${date}T${dueTime}:00`, end: `${date}T${dueTime}:00`, allDay: false };
    } else if (type === "Extracurricular") {
      payload = { id: event.id, kind: "Extracurricular", title: title.trim(),
        course: null, description: description.trim() || null, location: location.trim() || null,
        start: `${date}T${startTime}:00`, end: `${date}T${endTime}:00`, allDay: false };
    } else {
      // Exam, Personal, Other
      payload = { id: event.id, kind: type, title: title.trim(),
        course: type === "Exam" ? (course.trim() || null) : null,
        description: description.trim() || null, location: null,
        start: `${date}T${startTime}:00`, end: `${date}T${endTime}:00`, allDay: false };
    }

    await onSave(payload);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    await onDelete(event.id);
    setDeleting(false);
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
            <h3 className="text-lg font-extrabold">Edit event</h3>
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
                placeholder="e.g., Additional notes"
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
              className="px-4 py-2 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-xyon-card text-sm font-semibold"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={[
                "px-4 py-2 rounded-xl text-sm font-semibold",
                canSubmit
                  ? "bg-xyon-ink text-xyon-bg hover:opacity-90"
                  : "bg-xyon-ink/30 text-xyon-bg cursor-not-allowed",
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
