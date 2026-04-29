import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = "http://localhost:3001/api/msu";

const SEMESTER_DATES = {
    "202609": { start: "2026-09-01", end: "2026-12-19" },
    "202605": { start: "2026-05-18", end: "2026-08-14" },
    "202601": { start: "2026-01-20", end: "2026-05-12" },
    "202512": { start: "2025-12-22", end: "2026-01-14" },
    "202509": { start: "2025-09-02", end: "2025-12-18" },
};

const TERMS = [
    { code: "202609", label: "Fall 2026" },
    { code: "202605", label: "Summer 2026" },
    { code: "202601", label: "Spring 2026" },
    { code: "202512", label: "Winter 2026" },
    { code: "202509", label: "Fall 2025" },
];

const ALL_SUBJECTS = [
    "ACC","ACCT","ADVS","AFAM","AFS","AMAT","AMSD","AMSL","ANIM","ANTH",
    "APLN","AQUA","ARAB","ARAN","ARCE","ARCR","ARDW","ARED","ARFD","ARGD",
    "ARGS","ARHM","ARHT","ARIL","ARIN","ARMJ","ARPA","ARPH","ARPM","ARST",
    "ARTH","ARTX","ATTR","BCOM","BIMS","BIO","BIOL","BSLW","BUGN","BUS",
    "CAT","CGST","CHAD","CHEM","CHEN","CHIN","CHM","CHSC","CMDA","CMP",
    "CMST","CNFS","COED","COM","COUN","CRTH","CRW","CSAM","CSIT","CSJ",
    "CSND","DNCE","EAES","ECEL","ECN","ECON","ECSE","EDC","EDCO","EDFD",
    "ELAD","ENFL","ENG","ENGL","ENLT","ENTR","ENWR","ESOL","EXSC","FCST",
    "FILM","FINC","FMTV","FREN","FRIN","FRN","FSHD","FYS","GERM","GLQS",
    "GNED","GNHU","GRAD","GREK","GRIN","GSWS","HEBR","HEIN","HIED","HIS",
    "HIST","HLTH","HONP","HOSP","HPEM","HSET","HUM","HUMN","ICMH","IDS",
    "INBS","INFO","INTD","INTL","ITAL","JAPN","JAST","JOUR","JURI","JUST",
    "KORE","LAC","LALS","LATN","LAWS","LEAD","LITM","LNGN","MATH","MEDH",
    "MGMT","MKTG","MLLT","MSSN","MTH","MTHM","MTTH","MUAP","MUAS","MUCP",
    "MUED","MUEN","MUGN","MUHS","MULT","MUMG","MUPR","MURP","MUSI","MUTC",
    "MUTH","NAIS","NUFD","NUR","NURS","NXOB","PALG","PCOM","PEGN","PEMJ",
    "PHED","PHIL","PHY","PHYS","POLS","PORT","PRDN","PSY","PSYC","READ",
    "REAL","REL","RELG","RUIN","RUSS","SASE","SCET","SCI","SOC","SOCI",
    "SOSC","SOWK","SPA","SPAD","SPAN","SPED","SPIN","SPTC","STAT","STCM",
    "TELL","TETD","THTR","TLRN","TVDM","UNIV","URHS","VCDS","VIST","WLNC",
    "WMGS","WMS","WRIT","WRT",
];

const DAY_TO_JS   = { U: 0, M: 1, T: 2, W: 3, R: 4, F: 5, S: 6 };
const DAY_LABELS  = { M: "Mon", T: "Tue", W: "Wed", R: "Thu", F: "Fri", S: "Sat", U: "Sun" };


function fmt24to12(t) {
    if (!t || t.length < 4) return "—";
    const h = parseInt(t.slice(0, 2), 10);
    const m = t.slice(2, 4);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m} ${ampm}`;
}

function fmt24toISO(t) {
    if (!t || t.length < 4) return "00:00";
    return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
}

function formatDays(days) {
    if (!days) return "—";
    return days.split("").map((d) => DAY_LABELS[d] || d).join(" / ");
}

function generateOccurrences(section, termCode) {
    const dates = SEMESTER_DATES[termCode];
    if (!dates || !section.days || !section.startTime || !section.endTime) return [];
    const dayNums = section.days.split("").map((d) => DAY_TO_JS[d]).filter((d) => d !== undefined);
    if (!dayNums.length) return [];
    const startHH = fmt24toISO(section.startTime);
    const endHH = fmt24toISO(section.endTime);
    const semStart = new Date(dates.start + "T00:00:00");
    const semEnd = new Date(dates.end   + "T23:59:59");
    const out = [];
    const cur = new Date(semStart);
    while (cur <= semEnd) {
        if (dayNums.includes(cur.getDay())) {
            const ymd = cur.toISOString().slice(0, 10);
            out.push({ start: `${ymd}T${startHH}:00`, end: `${ymd}T${endHH}:00` });
        }
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}


async function apiGetSubjects(term) {
    const r = await fetch(`${API}/subjects?term=${term}`);
    const d = await r.json();
    return d.ok ? d.subjects : [];
}

async function apiGetCourses(term, subject) {
    const r = await fetch(`${API}/courses?term=${term}&subject=${subject}`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "Failed to fetch courses");
    return d.sections;
}

function SectionCard({ section, inSchedule, onAdd, onRemove }) {
    const hasTime = section.startTime && section.endTime;
    const isOpen  = section.status === "Open";
    return (
        <div className={["rounded-xl border p-3 mb-2 transition-all", inSchedule ? "border-blue-300 bg-blue-50/60" : "border-xyon-line bg-xyon-pill"].join(" ")}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{section.subject} {section.courseNumber}</span>
                        <span className="text-xs text-xyon-muted">§{section.section}</span>
                        <span className={["text-[11px] font-semibold px-2 py-0.5 rounded-full", isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"].join(" ")}>{section.status}</span>
                        {section.scheduleType && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{section.scheduleType}</span>}
                    </div>
                    <div className="text-sm font-medium mt-0.5 truncate">{section.title}</div>
                </div>
                <button
                    onClick={() => inSchedule ? onRemove(section.crn) : onAdd(section)}
                    className={["shrink-0 h-8 w-8 rounded-full border text-lg grid place-items-center transition-colors", inSchedule ? "border-red-300 bg-red-50 text-red-500 hover:bg-red-100" : "border-xyon-line bg-white text-xyon-ink hover:bg-blue-50 hover:border-blue-300"].join(" ")}
                >{inSchedule ? "−" : "+"}</button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center gap-1.5">
                    <span>📅</span>
                    <span className={section.days ? "font-semibold" : "text-xyon-muted"}>{section.days ? formatDays(section.days) : "No days"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span>🕐</span>
                    <span className={hasTime ? "font-semibold" : "text-xyon-muted"}>{hasTime ? `${fmt24to12(section.startTime)} – ${fmt24to12(section.endTime)}` : "Async / TBA"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span className="text-xyon-muted truncate">{section.building ? `${section.building} ${section.room}` : "Online / TBA"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span>👤</span>
                    <span className="text-xyon-muted truncate">{section.instructor || "TBA"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span>💺</span>
                    <span className={section.seatsOpen > 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>{section.seatsOpen} open</span>
                    <span className="text-xyon-muted">/ {section.seatsTotal}</span>
                </div>
                {section.credits && <div className="flex items-center gap-1.5"><span>🎓</span><span className="text-xyon-muted">{section.credits} cr</span></div>}
            </div>
        </div>
    );
}

export default function MsuImportModal({ open, onClose, onCreate }) {
    const [term, setTerm] = useState("202609");
    const [subjectInput, setSubjectInput] = useState("");
    const [subject, setSubject] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [schedule, setSchedule] = useState({});
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [importing, setImporting] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [error, setError]  = useState("");
    const [corsBlocked, setCorsBlocked] = useState(false);

    // Load subjects from Banner when modal opens or term changes
    useEffect(() => {
        if (!open) return;
        setLoadingSubjects(true);
        setSubjects([]);
        setCorsBlocked(false);
        apiGetSubjects(term)
            .then((s) => setSubjects(s))
            .catch((err) => {
                console.warn("Banner subjects failed, using fallback:", err.message);
                // If CORS blocks us, fall back to hardcoded list
                setCorsBlocked(true);
                setSubjects(ALL_SUBJECTS.map((code) => ({ code, description: "" })));
            })
            .finally(() => setLoadingSubjects(false));
    }, [open, term]);

    // Subject autocomplete
    const suggestions = useMemo(() => {
        const q = subjectInput.trim().toUpperCase();
        if (!q || subject) return [];
        return subjects.filter((s) => s.code.startsWith(q) || s.description?.toUpperCase().includes(q)).slice(0, 8);
    }, [subjectInput, subjects, subject]);

    // Fetch sections
    const doSearch = useCallback(() => {
        const code = subjectInput.trim().toUpperCase();
        if (!code) return;
        setSubject(code);
        setFilterText("");
        setError("");
        setLoadingSections(true);
        setSections([]);
        apiGetCourses(term, code)
            .then((s) => {
                if (s.length === 0) setError(`No sections found for ${code} in ${TERMS.find(t => t.code === term)?.label}.`);
                setSections(s);
            })
            .catch((err) => {
                console.error(err);
                setError("Could not load sections. Banner may be blocking the request — try opening the MSU course search in another tab first, then come back.");
            })
            .finally(() => setLoadingSections(false));
    }, [subjectInput, term]);

    const handleKeyDown = (e) => { if (e.key === "Enter") doSearch(); };

    const filteredSections = useMemo(() => {
        let list = sections;
        if (filterOpen) list = list.filter((s) => s.status === "Open");
        if (filterText.trim()) {
            const q = filterText.toLowerCase();
            list = list.filter((s) => s.title?.toLowerCase().includes(q) || s.courseNumber?.includes(q) || s.instructor?.toLowerCase().includes(q));
        }
        return list;
    }, [sections, filterText, filterOpen]);

    const addToSchedule = useCallback((sec) => setSchedule((p) => ({ ...p, [sec.crn]: sec })), []);
    const removeFromSchedule = useCallback((crn) => setSchedule((p) => { const n = { ...p }; delete n[crn]; return n; }), []);
    const scheduleList = Object.values(schedule);

    const handleImport = async () => {
        if (!scheduleList.length) return;
        setImporting(true);
        try {
            for (const section of scheduleList) {
                const occ = generateOccurrences(section, term);
                if (!occ.length) {
                    await onCreate({ kind: "Class", title: section.title, course: `${section.subject} ${section.courseNumber}`, start: `${SEMESTER_DATES[term]?.start}T00:00:00`, end: null, allDay: true });
                } else {
                    for (const o of occ) {
                        await onCreate({ kind: "Class", title: section.title, course: `${section.subject} ${section.courseNumber}`, start: o.start, end: o.end, allDay: false });
                    }
                }
            }
            setSchedule({});
            onClose();
        } catch (err) {
            setError("Some events failed to save.");
        } finally {
            setImporting(false);
        }
    };

    useEffect(() => {
        if (!open) { setSubject(""); setSubjectInput(""); setSections([]); setFilterText(""); setFilterOpen(false); setError(""); }
    }, [open]);

    if (!open) return null;

    const termLabel = TERMS.find((t) => t.code === term)?.label || term;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-[960px] max-w-[96vw] max-h-[90vh] flex flex-col rounded-xxl bg-xyon-card border border-xyon-line shadow-soft overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-xyon-line shrink-0">
                    <div>
                        <h3 className="text-lg font-extrabold">MSU Course Import</h3>
                        <p className="text-sm text-xyon-muted mt-0.5">Search Montclair State courses, build a schedule, then import to your calendar.</p>
                    </div>
                    <button className="h-9 w-9 rounded-full border border-xyon-line bg-xyon-pill hover:bg-white grid place-items-center" onClick={onClose}>✕</button>
                </div>

                {corsBlocked && (
                    <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
                         Could not reach MSU Banner directly. Using local subject list.
                        <a href="https://student-ssb-regis.montclair.edu/StudentRegistrationSsb/ssb/classSearch/classSearch" target="_blank" rel="noreferrer" className="ml-2 underline font-semibold">
                            Open MSU course search first then retry searching here.
                        </a>
                    </div>
                )}

                <div className="flex flex-1 min-h-0 overflow-hidden">
                    <div className="flex flex-col w-[60%] border-r border-xyon-line overflow-hidden">
                        <div className="px-4 py-3 border-b border-xyon-line shrink-0 space-y-2">
                            <div className="flex gap-2">
                                <select value={term} onChange={(e) => { setTerm(e.target.value); setSubject(""); setSections([]); }} className="rounded-xl border border-xyon-line bg-xyon-panel px-3 py-2 text-sm outline-none">
                                    {TERMS.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                                </select>
                                <div className="relative flex-1 flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            className="w-full rounded-xl border border-xyon-line bg-xyon-panel px-3 py-2 text-sm outline-none focus:bg-xyon-panel uppercase placeholder:normal-case"
                                            placeholder={loadingSubjects ? "Loading subjects…" : "Subject code (e.g. CSIT, MATH)"}
                                            value={subjectInput}
                                            onChange={(e) => { setSubjectInput(e.target.value.toUpperCase()); setSubject(""); }}
                                            onKeyDown={handleKeyDown}
                                            disabled={loadingSubjects}
                                        />
                                        {suggestions.length > 0 && (
                                            <div className="absolute left-0 top-full mt-1 w-full bg-xyon-card border border-xyon-line rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                                {suggestions.map((s) => (
                                                    <button key={s.code} className="w-full text-left px-3 py-2 text-sm hover:bg-xyon-pill2" onClick={() => { setSubjectInput(s.code); setSubject(s.code); doSearch(); }}>
                                                        <span className="font-semibold">{s.code}</span>{s.description && <span className="text-xyon-muted ml-2">{s.description}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={doSearch} className="px-4 py-2 rounded-xl bg-xyon-ink text-xyon-bg text-sm font-semibold hover:opacity-90">Search</button>
                                </div>
                            </div>
                            {sections.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <input className="flex-1 rounded-xl border border-xyon-line bg-xyon-panel px-3 py-1.5 text-sm outline-none focus:bg-xyon-panel" placeholder="Filter by title, number, instructor…" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                                    <button onClick={() => setFilterOpen((p) => !p)} className={["px-3 py-1.5 rounded-xl border text-sm font-semibold whitespace-nowrap", filterOpen ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-xyon-pill border-xyon-line hover:bg-white"].join(" ")}>{filterOpen ? "✓ Open only" : "Open only"}</button>
                                    <span className="text-xs text-xyon-muted shrink-0">{filteredSections.length} section{filteredSections.length !== 1 ? "s" : ""}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {error && <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">{error}</div>}
                            {loadingSections && <div className="text-sm text-xyon-muted py-8 text-center">Loading {subject} sections…</div>}
                            {!loadingSections && !subject && !error && <div className="text-sm text-xyon-muted py-8 text-center">Type a subject code and press <strong>Search</strong> or <strong>Enter</strong>.</div>}
                            {!loadingSections && subject && sections.length === 0 && !error && <div className="text-sm text-xyon-muted py-8 text-center">No sections found for <strong>{subject}</strong> in {termLabel}.</div>}
                            {filteredSections.map((sec) => (
                                <SectionCard key={sec.crn} section={sec} inSchedule={!!schedule[sec.crn]} onAdd={addToSchedule} onRemove={removeFromSchedule} />
                            ))}
                        </div>
                    </div>

                    {/*Draft Schedule*/}
                    <div className="flex flex-col w-[40%] overflow-hidden">
                        <div className="px-4 py-3 border-b border-xyon-line shrink-0">
                            <div className="font-semibold text-sm">Draft Schedule{scheduleList.length > 0 && <span className="ml-2 text-xyon-muted font-normal">({scheduleList.length} course{scheduleList.length !== 1 ? "s" : ""})</span>}</div>
                            <div className="text-xs text-xyon-muted mt-0.5">{termLabel}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {scheduleList.length === 0
                                ? <div className="text-sm text-xyon-muted py-8 text-center">Add courses using the "+" button.</div>
                                : scheduleList.map((sec) => {
                                    const occ = generateOccurrences(sec, term);
                                    return (
                                        <div key={sec.crn} className="rounded-xl border border-xyon-line bg-xyon-pill p-3 mb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm">{sec.subject} {sec.courseNumber} — {sec.section}</div>
                                                    <div className="text-xs text-xyon-muted mt-0.5 truncate">{sec.title}</div>
                                                    <div className="text-xs mt-1 space-y-0.5 text-xyon-muted">
                                                        <div>📅 {sec.days ? formatDays(sec.days) : "No days"}</div>
                                                        <div>🕐 {sec.startTime ? `${fmt24to12(sec.startTime)} – ${fmt24to12(sec.endTime)}` : "Async"}</div>
                                                        <div>📍 {sec.building ? `${sec.building} ${sec.room}` : "Online / TBA"}</div>
                                                    </div>
                                                    <div className="text-[11px] text-xyon-muted mt-1">{occ.length > 0 ? `${occ.length} events will be added` : "1 all-day marker"}</div>
                                                </div>
                                                <button onClick={() => removeFromSchedule(sec.crn)} className="shrink-0 h-7 w-7 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 grid place-items-center text-sm">✕</button>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                        <div className="px-4 py-4 border-t border-xyon-line shrink-0">
                            {scheduleList.length > 0 && (
                                <div className="text-xs text-xyon-muted mb-2">
                                    This will add <strong>{scheduleList.reduce((sum, sec) => { const o = generateOccurrences(sec, term); return sum + (o.length || 1); }, 0)}</strong> events for {termLabel}.
                                </div>
                            )}
                            <button onClick={handleImport} disabled={!scheduleList.length || importing} className={["w-full py-2.5 rounded-xl text-sm font-semibold", scheduleList.length && !importing ? "bg-xyon-ink text-xyon-bg hover:opacity-90" : "bg-xyon-ink/30 text-xyon-bg cursor-not-allowed"].join(" ")}>
                                {importing ? "Importing…" : scheduleList.length === 0 ? "Add courses to import" : `Import ${scheduleList.length} course${scheduleList.length !== 1 ? "s" : ""} →`}
                            </button>
                            <button onClick={onClose} className="w-full mt-2 py-2 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-white text-sm font-semibold">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}