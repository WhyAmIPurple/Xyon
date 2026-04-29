const express = require("express");
const puppeteer = require("puppeteer");

const router = express.Router();
const BANNER = "https://student-ssb-regis.montclair.edu/StudentRegistrationSsb/ssb";
const PAGE_SIZE = 500;

let browserInstance = null;

async function getBrowser() {
    if (browserInstance && browserInstance.connected) return browserInstance;
    browserInstance = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    return browserInstance;
}

async function withBannerSession(term, apiFn) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        );

        //Block clatter to speed up
        await page.setRequestInterception(true);
        page.on("request", (req) => {
            if (["image", "font", "stylesheet"].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        console.log("  Navigating to termSelection…");
        const r1 = await page.goto(`${BANNER}/term/termSelection?mode=search`, {
            waitUntil: "networkidle2", timeout: 30000,
        });
        console.log("  Status:", r1.status());

        //POST term selection from inside the page
        console.log("  Posting term", term);
        const postResult = await page.evaluate(async (base, t) => {
            const r = await fetch(`${base}/term/search?mode=search`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `term=${t}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`,
            });
            return { status: r.status, body: await r.text() };
        }, BANNER, term);
        console.log("  Result:", postResult.status, postResult.body.slice(0, 100));

        //Navigate to classSearch
        console.log("Navigating to classSearch…");
        const r3 = await page.goto(`${BANNER}/classSearch/classSearch`, {
            waitUntil: "networkidle2", timeout: 30000,
        });
        console.log("Status:", r3.status());

        //Run the api function
        return await apiFn(page);

    } finally {
        await page.close();
    }
}

// GET /api/msu/terms
router.get("/terms", (_req, res) => {
    res.json({
        ok: true,
        terms: [
            { code: "202609", label: "Fall 2026" },
            { code: "202605", label: "Summer 2026" },
            { code: "202601", label: "Spring 2026" },
            { code: "202512", label: "Winter 2026" },
            { code: "202509", label: "Fall 2025" },
        ],
    });
});

// GET /api/msu/subjects?term=202609
router.get("/subjects", async (req, res) => {
    const { term } = req.query;
    if (!term) return res.status(400).json({ ok: false, error: "term is required" });
    console.log(`\n GET /subjects term=${term}`);

    try {
        const subjects = await withBannerSession(term, async (page) => {
            const url = `${BANNER}/classSearch/get_subject?searchTerm=&term=${term}&offset=1&max=500&uniqueSessionId=xyon`;
            console.log("Fetching subjects URL:", url);

            const result = await page.evaluate(async (u) => {
                const r = await fetch(u, {
                    credentials: "include",
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });
                const text = await r.text();
                return { status: r.status, body: text };
            }, url);

            console.log("Subjects fetch status:", result.status);
            console.log("Subjects body snippet:", result.body.slice(0, 300));

            try {
                const data = JSON.parse(result.body);
                if (!Array.isArray(data)) { console.log("Not an array:", typeof data); return []; }
                return data.map((s) => ({ code: s.code, description: s.description }));
            } catch (e) {
                console.log("JSON parse failed:", e.message);
                return [];
            }
        });

        console.log(`  Returning ${subjects.length} subjects`);
        return res.json({ ok: true, subjects });
    } catch (err) {
        console.error("SUBJECTS ERROR:", err.message);
        return res.status(502).json({ ok: false, error: err.message });
    }
});

// GET /api/msu/courses?term=202609&subject=CSIT
router.get("/courses", async (req, res) => {
    const { term, subject } = req.query;
    if (!term || !subject) return res.status(400).json({ ok: false, error: "term and subject are required" });
    console.log(`\n GET /courses term=${term} subject=${subject}`);

    try {
        const sections = await withBannerSession(term, async (page) => {
            const url = `${BANNER}/searchResults/searchResults?txt_term=${term}&txt_subject=${subject}&pageOffset=0&pageMaxSize=${PAGE_SIZE}&sortColumn=subjectDescription&sortDirection=asc&uniqueSessionId=xyon`;
            console.log("Fetching courses URL:", url);

            const result = await page.evaluate(async (u) => {
                const r = await fetch(u, {
                    credentials: "include",
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });
                const text = await r.text();
                return { status: r.status, body: text };
            }, url);

            console.log("Courses fetch status:", result.status);
            console.log("Courses body snippet:", result.body.slice(0, 500));

            try {
                const data = JSON.parse(result.body);
                console.log("TotalCount:", data.totalCount, "| data length:", Array.isArray(data.data) ? data.data.length : "N/A");

                if (!data || !Array.isArray(data.data)) return [];

                return data.data.map((sec) => {
                    const meeting = sec.meetingsFaculty?.[0]?.meetingTime || {};
                    const faculty = sec.faculty || [];
                    const days = [];
                    if (meeting.monday) days.push("M");
                    if (meeting.tuesday) days.push("T");
                    if (meeting.wednesday) days.push("W");
                    if (meeting.thursday) days.push("R");
                    if (meeting.friday) days.push("F");
                    if (meeting.saturday) days.push("S");
                    if (meeting.sunday) days.push("U");
                    return {
                        crn: sec.courseReferenceNumber,
                        subject: sec.subject,
                        courseNumber: sec.courseNumber,
                        section: sec.sequenceNumber,
                        title: sec.courseTitle,
                        credits: sec.creditHours,
                        instructor: faculty[0]?.displayName || "TBA",
                        days: days.join(""),
                        startTime: meeting.beginTime || "",
                        endTime: meeting.endTime || "",
                        building: meeting.building || "",
                        room: meeting.room || "",
                        scheduleType: sec.scheduleTypeDescription || "",
                        seatsTotal: sec.maximumEnrollment,
                        seatsOpen: sec.seatsAvailable,
                        status: sec.openSection ? "Open" : "Closed",
                    };
                });
            } catch (err) {
                console.log("JSON parse failed:", err.message);
                return [];
            }
        });

        console.log(`Returning ${sections.length} sections`);
        return res.json({ ok: true, sections });
    } catch (err) {
        console.error(" COURSES ERROR:", err.message);
        return res.status(502).json({ ok: false, error: err.message });
    }
});

process.on("SIGINT", async () => { if (browserInstance) await browserInstance.close(); process.exit(); });
process.on("SIGTERM", async () => { if (browserInstance) await browserInstance.close(); process.exit(); });

module.exports = router;