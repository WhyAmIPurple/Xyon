const express = require("express");
const eventDb = require("../db/event_db.js");

const router = express.Router();

function normalizeEventType(kind) {
    if (kind === "Assignment" || kind === "assignment") {
        return "assignment";
    }

    if (kind === "Class" || kind === "class") {
        return "class";
    }

    return "personal";
}

function normalizeDateTime(value) {
    if (!value) return null;

    if (typeof value === "string") {
        return value.slice(0, 19).replace("T", " ");
    }

    return null;
}

async function getOrCreateDefaultCalendar(userId) {
    const [existing] = await eventDb.query(
        `SELECT calendar_id
         FROM calendars
         WHERE user_id = ?
         ORDER BY is_default DESC, calendar_id ASC
         LIMIT 1`,
        [userId]
    );

    if (existing.length > 0) {
        return existing[0].calendar_id;
    }

    const [result] = await eventDb.query(
        `INSERT INTO calendars (user_id, name, source, timezone, is_default)
         VALUES (?, 'Personal Calendar', 'manual', 'America/New_York', 1)`,
        [userId]
    );

    return result.insertId;
}

router.get("/", async (req, res) => {
    try {
        const userId = Number(req.query.user_id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ ok: false, error: "Valid user_id is required." });
        }

        const [rows] = await eventDb.query(
            `SELECT
                e.event_id,
                e.title,
                e.course,
                e.description,
                e.location,
                e.start_time,
                e.end_time,
                e.all_day,
                e.event_type,
                c.calendar_id,
                c.name AS calendar_name
             FROM events e
             JOIN calendars c ON e.calendar_id = c.calendar_id
             WHERE c.user_id = ?
             ORDER BY e.start_time ASC`,
            [userId]
        );

        return res.json({ ok: true, events: rows });
    } catch (error) {
        console.error("EVENT GET ERROR:", error);
        return res.status(500).json({ ok: false, error: "Failed to fetch events." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { user_id, title, course, kind, start, end, allDay } = req.body;
        const userId = Number(user_id);
        const startTime = normalizeDateTime(start);
        const endTime = normalizeDateTime(end || start);
        const eventType = normalizeEventType(kind);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ ok: false, error: "Valid user_id is required." });
        }

        if (!title || !startTime || !endTime) {
            return res.status(400).json({ ok: false, error: "Title, start, and end are required." });
        }

        const calendarId = await getOrCreateDefaultCalendar(userId);

        const [result] = await eventDb.query(
            `INSERT INTO events
                (calendar_id, title, course, description, location, start_time, end_time, all_day, event_type)
             VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?)`,
            [
                calendarId,
                title,
                course || null,
                startTime,
                endTime,
                allDay ? 1 : 0,
                eventType
            ]
        );

        return res.status(201).json({
            ok: true,
            event_id: result.insertId,
            calendar_id: calendarId
        });
    } catch (error) {
        console.error("EVENT CREATE ERROR:", error);
        return res.status(500).json({ ok: false, error: "Failed to save event." });
    }
});

module.exports = router;
