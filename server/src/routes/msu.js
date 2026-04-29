const express = require("express");
const https = require("https");
const http = require("http");

const router = express.Router();

const BASE = "https://student-ssb-regis.montclair.edu/StudentRegistrationSsb/ssb";

//HTTP/HTTPS fetch, returns parsed JSON or throws.
function fetchJSON(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === "https:" ? https : http;

        const reqOptions = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: options.method || "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Xyon-App/1.0)",
                "Accept": "application/json, */*",
                "Referer": BASE + "/term/termSelection?mode=search",
                ...(options.headers || {})
            }
        };

        const req = lib.request(reqOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                // Bubble the Set-Cookie header up so callers can thread it through
                const cookies = res.headers["set-cookie"];
                try {
                    resolve({ body: JSON.parse(data), cookies, status: res.statusCode });
                } catch {
                    resolve({ body: data, cookies, status: res.statusCode });
                }
            });
        });

        req.on("error", reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

/**
 * Build a Banner session for a given term.
 * Returns the cookie string to pass to subsequent requests.
 */
async function buildSession(term) {
    // Step 1: GET the term selector to get initial cookies
    const init = await fetchJSON(`${BASE}/term/termSelection?mode=search`);
    const initCookies = (init.cookies || []).join("; ");

    // Step 2: POST the term selection
    const body = `term=${term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`;
    const post = await fetchJSON(`${BASE}/term/search?mode=search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": initCookies
        },
        body
    });

    const postCookies = (post.cookies || []).join("; ");
    // Merge cookies
    return [initCookies, postCookies].filter(Boolean).join("; ");
}

//routes 

/**
 * GET /api/msu/terms
 * Returns a hard-coded list of known MSU term codes + labels.
 * Banner doesn't expose a clean public "list terms" endpoint,
 * so we maintain a curated list of upcoming terms.
 */
router.get("/terms", (_req, res) => {
    res.json({
        ok: true,
        terms: [
            { code: "202609", label: "Fall 2026" },
            { code: "202605", label: "Summer 2026" },
            { code: "202601", label: "Spring 2026" },
            { code: "202512", label: "Winter 2026" },
            { code: "202509", label: "Fall 2025" }
        ]
    });
});

/**
 * GET /api/msu/subjects?term=202609
 * Fetches subjects from Banner's autocomplete endpoint.
 */
router.get("/subjects", async (req, res) => {
    const { term } = req.query;
    if (!term) {
        return res.status(400).json({ ok: false, error: "term is required" });
    }

    try {
        const cookie = await buildSession(term);

        const result = await fetchJSON(
            `${BASE}/classSearch/get_subject?searchTerm=&term=${term}&offset=1&max=300&uniqueSessionId=xyon`,
            { headers: { Cookie: cookie } }
        );

        if (!Array.isArray(result.body)) {
            return res.json({ ok: true, subjects: [] });
        }

        const subjects = result.body.map((s) => ({
            code: s.code,
            description: s.description
        }));

        return res.json({ ok: true, subjects });
    } catch (err) {
        console.error("MSU SUBJECTS ERROR:", err);
        return res.status(502).json({ ok: false, error: "Failed to fetch subjects from MSU." });
    }
});

/**
 * GET /api/msu/courses?term=202609&subject=CSIT
 * Fetches all sections for a subject from Banner's search results API.
 */
router.get("/courses", async (req, res) => {
    const { term, subject } = req.query;

    if (!term || !subject) {
        return res.status(400).json({ ok: false, error: "term and subject are required" });
    }

    try {
        const cookie = await buildSession(term);

        const PAGE_SIZE = 500;
        let offset = 0;
        let allSections = [];
        let total = null;

        do {
            const url =
                `${BASE}/searchResults/searchResults` +
                `?txt_term=${term}&txt_subject=${encodeURIComponent(subject)}` +
                `&pageOffset=${offset}&pageMaxSize=${PAGE_SIZE}` +
                `&sortColumn=subjectDescription&sortDirection=asc`;

            const result = await fetchJSON(url, { headers: { Cookie: cookie } });

            if (!result.body || !Array.isArray(result.body.data)) break;

            if (total === null) total = result.body.totalCount || 0;

            allSections = allSections.concat(result.body.data);
            offset += PAGE_SIZE;
        } while (offset < total);

        const sections = allSections.map((sec) => {
            const meetings = sec.meetingsFaculty || [];
            const meeting = meetings[0]?.meetingTime || {};
            const faculty = sec.faculty || [];

            const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
                .filter((d) => meeting[d])
                .map((d) => d[0].toUpperCase()); // M T W R F S U

            // Map Thursday to "R" for standard academic notation
            const dayStr = days
                .map((d) => d === "T" && meeting.thursday ? "R" : d)
                .join("");

            // Build a day string using the raw booleans
            const dayLetters = [];
            if (meeting.monday) dayLetters.push("M");
            if (meeting.tuesday) dayLetters.push("T");
            if (meeting.wednesday) dayLetters.push("W");
            if (meeting.thursday) dayLetters.push("R");
            if (meeting.friday) dayLetters.push("F");
            if (meeting.saturday) dayLetters.push("S");
            if (meeting.sunday) dayLetters.push("U");

            return {
                crn: sec.courseReferenceNumber,
                subject: sec.subject,
                courseNumber: sec.courseNumber,
                section: sec.sequenceNumber,
                title: sec.courseTitle,
                credits: sec.creditHours,
                instructor: faculty[0]?.displayName || "TBA",
                days: dayLetters.join(""),
                startTime: meeting.beginTime || "", // "0800"
                endTime: meeting.endTime || "", // "0915"
                building: meeting.building || "",
                room:  meeting.room || "",
                scheduleType: sec.scheduleTypeDescription || "",
                seatsTotal: sec.maximumEnrollment,
                seatsOpen: sec.seatsAvailable,
                status: sec.openSection ? "Open" : "Closed"
            };
        });

        return res.json({ ok: true, sections });
    } catch (err) {
        console.error("MSU COURSES ERROR:", err);
        return res.status(502).json({ ok: false, error: "Failed to fetch courses from MSU." });
    }
});

module.exports = router;