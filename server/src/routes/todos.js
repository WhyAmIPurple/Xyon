const express = require("express");
const eventDb = require("../db/event_db.js");

const router = express.Router();

const VALID_COLORS = ["default", "pink", "blue", "green", "purple", "yellow"];

// GET /api/todos?user_id=X
router.get("/", async (req, res) => {
    try {
        const userId = Number(req.query.user_id);
        if (!Number.isInteger(userId) || userId <= 0)
            return res.status(400).json({ ok: false, error: "Valid user_id is required." });

        const [rows] = await eventDb.query(
            `SELECT todo_id, title, body, color, pinned, completed, created_at
             FROM todos
             WHERE user_id = ?
             ORDER BY pinned DESC, created_at DESC`,
            [userId]
        );
        return res.json({ ok: true, todos: rows });
    } catch (error) {
        console.error("TODO GET ERROR:", error);
        return res.status(500).json({ ok: false, error: "Failed to fetch todos." });
    }
});

// POST /api/todos
router.post("/", async (req, res) => {
    try {
        const { user_id, title, body, color, pinned } = req.body;
        const userId = Number(user_id);

        if (!Number.isInteger(userId) || userId <= 0)
            return res.status(400).json({ ok: false, error: "Valid user_id is required." });

        if (!title?.trim() && !body?.trim())
            return res.status(400).json({ ok: false, error: "Title or body is required." });

        const safeColor = VALID_COLORS.includes(color) ? color : "default";

        const [result] = await eventDb.query(
            `INSERT INTO todos (user_id, title, body, color, pinned)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, title?.trim() || "", body?.trim() || "", safeColor, pinned ? 1 : 0]
        );
        return res.status(201).json({ ok: true, todo_id: result.insertId });
    } catch (error) {
        console.error("TODO CREATE ERROR:", error);
        return res.status(500).json({ ok: false, error: "Failed to create todo." });
    }
});

// PUT /api/todos/:id
router.put("/:id", async (req, res) => {
    try {
        const todoId = Number(req.params.id);
        if (!Number.isInteger(todoId) || todoId <= 0)
            return res.status(400).json({ ok: false, error: "Valid todo_id is required." });

        const { title, body, color, pinned, completed } = req.body;
        const fields = [];
        const params = [];

        if (title     !== undefined) { fields.push("title = ?");     params.push(title?.trim() ?? ""); }
        if (body      !== undefined) { fields.push("body = ?");      params.push(body?.trim() ?? ""); }
        if (color     !== undefined) { fields.push("color = ?");     params.push(VALID_COLORS.includes(color) ? color : "default"); }
        if (pinned    !== undefined) { fields.push("pinned = ?");    params.push(pinned ? 1 : 0); }
        if (completed !== undefined) { fields.push("completed = ?"); params.push(completed ? 1 : 0); }

        if (!fields.length)
            return res.status(400).json({ ok: false, error: "Nothing to update." });

        params.push(todoId);
        const [result] = await eventDb.query(
            `UPDATE todos SET ${fields.join(", ")} WHERE todo_id = ?`,
            params
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ ok: false, error: "Todo not found." });

        return res.json({ ok: true });
    } catch (error) {
        console.error("TODO UPDATE ERROR:", error);
        return res.status(500).json({ ok: false, error: "Failed to update todo." });
    }
});

// DELETE /api/todos/:id
router.delete("/:id", async (req, res) => {
    try {
        const todoId = Number(req.params.id);
        if (!Number.isInteger(todoId) || todoId <= 0)
            return res.status(400).json({ ok: false, error: "Valid todo_id is required." });

        const [result] = await eventDb.query(
            `DELETE FROM todos WHERE todo_id = ?`,
            [todoId]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ ok: false, error: "Todo not found." });

        return res.json({ ok: true });
    } catch (error) {
        console.error("TODO DELETE ERROR:", error);
        return res.status(500).json({ ok: false, error: "Failed to delete todo." });
    }
});

module.exports = router;
