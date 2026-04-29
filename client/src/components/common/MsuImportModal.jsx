import React, {useCallback, useEffect, useMemo, useState} from "react";

//Constants
const API = "http://localhost:3001/api/msu";

// Semester start/end dates for each term code.
// These drive the recurring event generation.
const SEMESTER_DATES = {
    "202609": {start: "2026-09-01", end: "2026-12-19"},
    "202605": {start: "2026-05-18", end: "2026-08-14"},
    "202601": {start: "2026-01-20", end: "2026-05-12"},
    "202512": {start: "2025-12-22", end: "2026-01-14"},
    "202509": {start: "2025-09-02", end: "2025-12-18"}
};

// Map day letters to JS getDay() values (0=Sun)
const DAY_TO_JS = { U: 0, M: 1, T: 2, W: 3, R: 4, F: 5, S: 6 };

//Helpers

function fmt24to12(t) {
    if (!t || t.length < 4) return t || "—";
    const h = parseInt(t.slice(0, 2), 10);
    const m = t.slice(2, 4);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function fmt24toISO(t) {
    // "0800" → "08:00"
    if (!t || t.length < 4) return "00:00";
    return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
}

/**
 * Generate every occurrence of a recurring class for the semester.
 * Returns an array of { start, end } ISO strings.
 */
function generateOccurrences(section, termCode) {
    const dates = SEMESTER_DATES[termCode];
    if (!dates || !section.days || !section.startTime || !section.endTime) return [];

    const dayNums = section.days.split("").map((d) => DAY_TO_JS[d]).filter((d) => d !== undefined);
    if (dayNums.length === 0) return [];

    const startHH = fmt24toISO(section.startTime);
    const endHH = fmt24toISO(section.endTime);

    const semStart = new Date(dates.start + "T00:00:00");
    const semEnd = new Date(dates.end   + "T23:59:59");

    const occurrences = [];
    const cur = new Date(semStart);

    while (cur <= semEnd) {
        if (dayNums.includes(cur.getDay())) {
            const ymd = cur.toISOString().slice(0, 10);
            occurrences.push({
                start: `${ymd}T${startHH}:00`,
                end: `${ymd}T${endHH}:00`
            });
        }
        cur.setDate(cur.getDate() + 1);
    }

    return occurrences;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pill({ children, color = "bg-xyon-pill2" }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>
            {children}
        </span>
    );
}

function SectionRow({ section, inSchedule, onAdd, onRemove }) {
    const hasTime = section.startTime && section.endTime;

    return (
        <div className="flex items-start gap-3 py-3 border-b border-xyon-line last:border-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                        {section.subject} {section.courseNumber} — {section.section}
                    </span>
                    <Pill color={section.status === "Open" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}>
                        {section.status}
                    </Pill>
                    {section.scheduleType && (
                        <Pill>{section.scheduleType}</Pill>
                    )}
                </div>
                <div className="text-xs text-xyon-muted mt-0.5 truncate">{section.title}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-xyon-muted flex-wrap">
                    {section.instructor !== "TBA" && <span>👤 {section.instructor}</span>}
                    {section.days && (
                        <span>📅 {section.days} {hasTime ? `${fmt24to12(section.startTime)} – ${fmt24to12(section.endTime)}` : ""}</span>
                    )}
                    {section.building && <span>📍 {section.building} {section.room}</span>}
                    {section.credits && <span>🎓 {section.credits} cr</span>}
                    <span className={section.seatsOpen > 0 ? "text-green-600" : "text-red-500"}>
                        {section.seatsOpen} / {section.seatsTotal} seats
                    </span>
                </div>
            </div>
            <button
                onClick={() => inSchedule ? onRemove(section.crn) : onAdd(section)}
                className={[
                    "shrink-0 h-8 w-8 rounded-full border text-lg grid place-items-center transition-colors",
                    inSchedule
                        ? "border-red-300 bg-red-50 text-red-500 hover:bg-red-100"
                        : "border-xyon-line bg-white/60 text-xyon-ink hover:bg-xyon-pill2"
                ].join(" ")}
                title={inSchedule ? "Remove from schedule" : "Add to schedule"}
            >
                {inSchedule ? "−" : "+"}
            </button>
        </div>
    );
}

//Main Modal

export default function MsuImportModal({ open, onClose, onCreate }) {
    // Step state
    const [term, setTerm] = useState("202609");
    const [subject, setSubject] = useState("");
    const [subjectSearch, setSubjectSearch] = useState("");

    // Data
    const [terms, setTerms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);

    // Draft schedule: crn → section object
    const [schedule, setSchedule] = useState({});

    // UI state
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [importing, setImporting] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [error, setError] = useState("");

    //Fetch terms on mount
    useEffect(() => {
        if (!open) return;
        fetch(`${API}/terms`)
            .then((r) => r.json())
            .then((d) => { if (d.ok) setTerms(d.terms); })
            .catch(() => {});
    }, [open]);

    //Fetch subjects when term changes
    useEffect(() => {
        if (!open || !term) return;
        setSubject("");
        setSections([]);
        setLoadingSubjects(true);
        setError("");

        fetch(`${API}/subjects?term=${term}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.ok) setSubjects(d.subjects);
                else setError("Could not load subjects.");
            })
            .catch(() => setError("Network error loading subjects."))
            .finally(() => setLoadingSubjects(false));
    }, [open, term]);

    //Fetch sections when subject changes
    useEffect(() => {
        if (!subject) { setSections([]); return; }
        setLoadingSections(true);
        setSections([]);
        setError("");

        fetch(`${API}/courses?term=${term}&subject=${subject}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.ok) setSections(d.sections);
                else setError("Could not load sections.");
            })
            .catch(() => setError("Network error loading sections."))
            .finally(() => setLoadingSections(false));
    }, [term, subject]);

    //Filter sections
    const filteredSections = useMemo(() => {
        let list = sections;
        if (filterOpen) list = list.filter((s) => s.status === "Open");
        if (filterText.trim()) {
            const q = filterText.toLowerCase();
            list = list.filter(
                (s) =>
                    s.title?.toLowerCase().includes(q) ||
                    s.courseNumber?.toLowerCase().includes(q) ||
                    s.instructor?.toLowerCase().includes(q) ||
                    s.days?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [sections, filterText, filterOpen]);

    //Filtered subjects
    const filteredSubjects = useMemo(() => {
        if (!subjectSearch.trim()) return subjects;
        const q = subjectSearch.toLowerCase();
        return subjects.filter(
            (s) => s.code.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
        );
    }, [subjects, subjectSearch]);

    //Schedule actions
    const addToSchedule = useCallback((section) => {
        setSchedule((prev) => ({ ...prev, [section.crn]: section }));
    }, []);

    const removeFromSchedule = useCallback((crn) => {
        setSchedule((prev) => {
            const next = { ...prev };
            delete next[crn];
            return next;
        });
    }, []);

    const scheduleList = Object.values(schedule);

    //Import
    const handleImport = async () => {
        if (scheduleList.length === 0) return;
        setImporting(true);

        try {
            for (const section of scheduleList) {
                const occurrences = generateOccurrences(section, term);

                if (occurrences.length === 0) {
                    // Online/async course with no meeting times — add as a single all-day marker
                    await onCreate({
                        kind: "Class",
                        title: section.title,
                        course: `${section.subject} ${section.courseNumber}`,
                        start: SEMESTER_DATES[term]?.start
                            ? `${SEMESTER_DATES[term].start}T00:00:00`
                            : new Date().toISOString(),
                        end: null,
                        allDay: true
                    });
                } else {
                    // Add each occurrence as a separate timed event
                    for (const occ of occurrences) {
                        await onCreate({
                            kind: "Class",
                            title: section.title,
                            course: `${section.subject} ${section.courseNumber}`,
                            start: occ.start,
                            end: occ.end,
                            allDay: false
                        });
                    }
                }
            }

            // Clear draft and close
            setSchedule({});
            onClose();
        } catch (err) {
            console.error(err);
            setError("Some events failed to save. Please try again.");
        } finally {
            setImporting(false);
        }
    };

    //Reset on close
    useEffect(() => {
        if (!open) {
            setSubject("");
            setSections([]);
            setFilterText("");
            setFilterOpen(false);
            setError("");
        }
    }, [open]);

    if (!open) return null;

    const selectedTermLabel = terms.find((t) => t.code === term)?.label || term;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-[960px] max-w-[96vw] max-h-[90vh] flex flex-col rounded-xxl bg-xyon-card border border-xyon-line shadow-soft overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-xyon-line shrink-0">
                    <div>
                        <h3 className="text-lg font-extrabold">MSU Course Import</h3>
                        <p className="text-sm text-xyon-muted mt-0.5">
                            Search Montclair State courses, build a schedule, then import to your calendar.
                        </p>
                    </div>
                    <button
                        className="h-9 w-9 rounded-full border border-xyon-line bg-white/60 hover:bg-white grid place-items-center"
                        onClick={onClose}
                    >
                    </button>
                </div>

                {/* Body split: left search | right draft */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Left: Search Panel */}
                    <div className="flex flex-col w-[60%] border-r border-xyon-line overflow-hidden">

                        {/* Controls */}
                        <div className="px-4 py-3 border-b border-xyon-line shrink-0 space-y-2">
                            {/* Term + Subject row */}
                            <div className="flex gap-2">
                                {/* Term selector */}
                                <select
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                    className="rounded-xl border border-xyon-line bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                                >
                                    {terms.map((t) => (
                                        <option key={t.code} value={t.code}>{t.label}</option>
                                    ))}
                                </select>

                                {/* Subject search box + dropdown */}
                                <div className="relative flex-1">
                                    <input
                                        className="w-full rounded-xl border border-xyon-line bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                                        placeholder={loadingSubjects ? "Loading subjects…" : "Search subject (e.g. CSIT, Math)"}
                                        value={subjectSearch}
                                        onChange={(e) => { setSubjectSearch(e.target.value); setSubject(""); setSections([]); }}
                                        disabled={loadingSubjects}
                                    />
                                    {subjectSearch && filteredSubjects.length > 0 && !subject && (
                                        <div className="absolute left-0 top-full mt-1 w-full bg-white border border-xyon-line rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {filteredSubjects.slice(0, 40).map((s) => (
                                                <button
                                                    key={s.code}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-xyon-pill2"
                                                    onClick={() => {
                                                        setSubject(s.code);
                                                        setSubjectSearch(`${s.code} — ${s.description}`);
                                                    }}
                                                >
                                                    <span className="font-semibold">{s.code}</span>{" "}
                                                    <span className="text-xyon-muted">{s.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filter row */}
                            {sections.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <input
                                        className="flex-1 rounded-xl border border-xyon-line bg-white/70 px-3 py-1.5 text-sm outline-none focus:bg-white"
                                        placeholder="Filter by title, number, instructor…"
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setFilterOpen((p) => !p)}
                                        className={[
                                            "px-3 py-1.5 rounded-xl border text-sm font-semibold",
                                            filterOpen
                                                ? "bg-xyon-pill2 border-xyon-line"
                                                : "bg-white/60 border-xyon-line hover:bg-white"
                                        ].join(" ")}
                                    >
                                        {filterOpen ? "✓ Open only" : "Open only"}
                                    </button>
                                    <span className="text-xs text-xyon-muted shrink-0">
                                        {filteredSections.length} section{filteredSections.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Section list */}
                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            {error && (
                                <div className="text-sm text-red-500 py-4 text-center">{error}</div>
                            )}
                            {loadingSections && (
                                <div className="text-sm text-xyon-muted py-8 text-center">
                                    Loading sections…
                                </div>
                            )}
                            {!loadingSections && subject && sections.length === 0 && !error && (
                                <div className="text-sm text-xyon-muted py-8 text-center">
                                    No sections found for {subject} in {selectedTermLabel}.
                                </div>
                            )}
                            {!loadingSections && !subject && !error && (
                                <div className="text-sm text-xyon-muted py-8 text-center">
                                    Select a term and search for a subject to see sections.
                                </div>
                            )}
                            {filteredSections.map((sec) => (
                                <SectionRow
                                    key={sec.crn}
                                    section={sec}
                                    inSchedule={!!schedule[sec.crn]}
                                    onAdd={addToSchedule}
                                    onRemove={removeFromSchedule}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Draft Schedule Panel */}
                    <div className="flex flex-col w-[40%] overflow-hidden">
                        <div className="px-4 py-3 border-b border-xyon-line shrink-0">
                            <div className="font-semibold text-sm">
                                Draft Schedule
                                {scheduleList.length > 0 && (
                                    <span className="ml-2 text-xyon-muted font-normal">
                                        ({scheduleList.length} course{scheduleList.length !== 1 ? "s" : ""})
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-xyon-muted mt-0.5">
                                {selectedTermLabel}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            {scheduleList.length === 0 ? (
                                <div className="text-sm text-xyon-muted py-8 text-center">
                                    Add courses using the "+" button to build your schedule.
                                </div>
                            ) : (
                                scheduleList.map((sec) => {
                                    const occurrences = generateOccurrences(sec, term);
                                    return (
                                        <div key={sec.crn} className="py-3 border-b border-xyon-line last:border-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="font-semibold text-sm">
                                                        {sec.subject} {sec.courseNumber} — {sec.section}
                                                    </div>
                                                    <div className="text-xs text-xyon-muted mt-0.5">{sec.title}</div>
                                                    {sec.days && sec.startTime ? (
                                                        <div className="text-xs text-xyon-muted mt-1">
                                                            {sec.days} · {fmt24to12(sec.startTime)} – {fmt24to12(sec.endTime)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-xyon-muted mt-1">Online / Async</div>
                                                    )}
                                                    <div className="text-[11px] text-xyon-muted mt-0.5">
                                                        {occurrences.length > 0
                                                            ? `${occurrences.length} events will be added`
                                                            : "1 all-day marker will be added"}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromSchedule(sec.crn)}
                                                    className="shrink-0 h-7 w-7 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 grid place-items-center text-sm"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Import button */}
                        <div className="px-4 py-4 border-t border-xyon-line shrink-0">
                            {scheduleList.length > 0 && (
                                <div className="text-xs text-xyon-muted mb-2">
                                    This will add{" "}
                                    <strong>
                                        {scheduleList.reduce((sum, sec) => {
                                            const occ = generateOccurrences(sec, term);
                                            return sum + (occ.length > 0 ? occ.length : 1);
                                        }, 0)}
                                    </strong>{" "}
                                    events to your calendar for {selectedTermLabel}.
                                </div>
                            )}
                            <button
                                onClick={handleImport}
                                disabled={scheduleList.length === 0 || importing}
                                className={[
                                    "w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity",
                                    scheduleList.length > 0 && !importing
                                        ? "bg-xyon-ink text-white hover:opacity-90"
                                        : "bg-xyon-ink/30 text-white cursor-not-allowed"
                                ].join(" ")}
                            >
                                {importing
                                    ? "Importing…"
                                    : scheduleList.length === 0
                                    ? "Add courses to import"
                                    : `Import ${scheduleList.length} course${scheduleList.length !== 1 ? "s" : ""} →`}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full mt-2 py-2 rounded-xl border border-xyon-line bg-white/60 hover:bg-white text-sm font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}