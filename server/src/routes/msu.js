const express = require("express");
const axios   = require("axios");
const https   = require("https");

const router  = express.Router();
const BASE    = "https://student-ssb-regis.montclair.edu/StudentRegistrationSsb/ssb";
const PAGE_SIZE = 500;

const TERMS = [
    { code: "202609", label: "Fall 2026" },
    { code: "202605", label: "Summer 2026" },
    { code: "202601", label: "Spring 2026" },
    { code: "202512", label: "Winter 2026" },
    { code: "202509", label: "Fall 2025" },
];

// Shared axios instance — ignore self-signed certs, follow redirects
const http = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    maxRedirects: 10,
    timeout: 30000,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    },
});

// Collect Set-Cookie headers into a single cookie string
function parseCookies(headers) {
    const raw = headers["set-cookie"];
    if (!raw) return "";
    return (Array.isArray(raw) ? raw : [raw])
        .map((c) => c.split(";")[0])
        .join("; ");
}

function mergeCookies(...parts) {
    const map = {};
    parts.join("; ").split("; ").forEach((pair) => {
        const [k, ...v] = pair.split("=");
        if (k) map[k.trim()] = v.join("=");
    });
    return Object.entries(map).map(([k, v]) => `${k}=${v}`).join("; ");
}

// Establish a Banner session for the given term, returns cookie string
async function openBannerSession(term) {
    // Step 1 — visit term selection page to get JSESSIONID
    const r1 = await http.get(`${BASE}/term/termSelection?mode=search`);
    let cookies = parseCookies(r1.headers);

    // Step 2 — POST term to bind it to the session
    const r2 = await http.post(
        `${BASE}/term/search?mode=search`,
        `term=${term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`,
        {
            headers: {
                Cookie: cookies,
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
            },
        }
    );
    cookies = mergeCookies(cookies, parseCookies(r2.headers));

    // Step 3 — load classSearch to initialise the search context
    const r3 = await http.get(`${BASE}/classSearch/classSearch`, {
        headers: { Cookie: cookies },
    });
    cookies = mergeCookies(cookies, parseCookies(r3.headers));

    return cookies;
}

// GET /api/msu/terms
router.get("/terms", (_req, res) => {
    res.json({ ok: true, terms: TERMS });
});

// GET /api/msu/subjects?term=202609
router.get("/subjects", async (req, res) => {
    const { term } = req.query;
    if (!term) return res.status(400).json({ ok: false, error: "term is required" });

    try {
        const cookies = await openBannerSession(term);

        const r = await http.get(
            `${BASE}/classSearch/get_subject?searchTerm=&term=${term}&offset=1&max=500&uniqueSessionId=xyon`,
            {
                headers: {
                    Cookie: cookies,
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
            }
        );

        const data = r.data;
        if (!Array.isArray(data)) return res.json({ ok: true, subjects: [] });

        return res.json({
            ok: true,
            subjects: data.map((s) => ({ code: s.code, description: s.description })),
        });
    } catch (err) {
        console.error("SUBJECTS ERROR:", err.message);
        return res.status(502).json({ ok: false, error: err.message });
    }
});

// GET /api/msu/courses?term=202609&subject=CSIT
router.get("/courses", async (req, res) => {
    const { term, subject } = req.query;
    if (!term || !subject)
        return res.status(400).json({ ok: false, error: "term and subject are required" });

    try {
        const cookies = await openBannerSession(term);

        const r = await http.get(
            `${BASE}/searchResults/searchResults?txt_term=${term}&txt_subject=${encodeURIComponent(subject)}&pageOffset=0&pageMaxSize=${PAGE_SIZE}&sortColumn=subjectDescription&sortDirection=asc&uniqueSessionId=xyon`,
            {
                headers: {
                    Cookie: cookies,
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
            }
        );

        const data = r.data;
        if (!data || !Array.isArray(data.data))
            return res.json({ ok: true, sections: [] });

        const sections = data.data.map((sec) => {
            const meeting  = sec.meetingsFaculty?.[0]?.meetingTime || {};
            const faculty  = sec.faculty || [];
            const days     = [];
            if (meeting.monday)    days.push("M");
            if (meeting.tuesday)   days.push("T");
            if (meeting.wednesday) days.push("W");
            if (meeting.thursday)  days.push("R");
            if (meeting.friday)    days.push("F");
            if (meeting.saturday)  days.push("S");
            if (meeting.sunday)    days.push("U");
            return {
                crn:          sec.courseReferenceNumber,
                subject:      sec.subject,
                courseNumber: sec.courseNumber,
                section:      sec.sequenceNumber,
                title:        sec.courseTitle,
                credits:      sec.creditHours,
                instructor:   faculty[0]?.displayName || "TBA",
                days:         days.join(""),
                startTime:    meeting.beginTime || "",
                endTime:      meeting.endTime   || "",
                building:     meeting.building  || "",
                room:         meeting.room      || "",
                scheduleType: sec.scheduleTypeDescription || "",
                seatsTotal:   sec.maximumEnrollment,
                seatsOpen:    sec.seatsAvailable,
                status:       sec.openSection ? "Open" : "Closed",
            };
        });

        return res.json({ ok: true, sections });
    } catch (err) {
        console.error("COURSES ERROR:", err.message);
        return res.status(502).json({ ok: false, error: err.message });
    }
});

module.exports = router;
