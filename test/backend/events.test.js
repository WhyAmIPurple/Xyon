/**
 * Events API Tests  —  /api/events
 * Covers: GET, POST, PUT, DELETE
 */
const request = require("supertest");
const app     = require("./testApp");

const TS    = Date.now();
const EMAIL = `test_events_${TS}@xyon-test.local`;
const PASS  = "EventsPass123!";

let userId;
let eventId;

// One-time setup: create a user to own the test events
beforeAll(async () => {
  const reg = await request(app)
    .post("/api/auth/register")
    .send({ first_name: "Events", last_name: "Tester", email: EMAIL, password: PASS });
  userId = reg.body.user_id;
});

// One-time teardown: remove the test user (cascades to events via server route)
afterAll(async () => {
  if (userId) await request(app).delete(`/api/auth/account/${userId}`);
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/events", () => {
  test("returns an empty events array for a brand-new user", async () => {
    const res = await request(app).get(`/api/events?user_id=${userId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBe(0);
  });

  test("rejects a missing user_id", async () => {
    const res = await request(app).get("/api/events");

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects a non-numeric user_id", async () => {
    const res = await request(app).get("/api/events?user_id=abc");

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects user_id of 0", async () => {
    const res = await request(app).get("/api/events?user_id=0");

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe("POST /api/events", () => {
  test("creates an event with required fields only", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({
        user_id: userId,
        title:   "Midterm Exam",
        kind:    "exam",
        start:   "2026-05-10T09:00:00",
        end:     "2026-05-10T11:00:00",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.event_id).toBe("number");
    eventId = res.body.event_id;
  });

  test("creates an event with all optional fields", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({
        user_id:     userId,
        title:       "COMP 101 Lecture",
        course:      "COMP 101",
        kind:        "class",
        start:       "2026-05-12T10:00:00",
        end:         "2026-05-12T11:15:00",
        allDay:      false,
        description: "Weekly lecture",
        location:    "Richardson Hall 201",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("normalises 'extracurricular' event_type to 'club'", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({
        user_id: userId,
        title:   "Chess Club",
        kind:    "extracurricular",
        start:   "2026-05-13T15:00:00",
        end:     "2026-05-13T16:00:00",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("falls back to 'personal' for an unknown event_type", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({
        user_id: userId,
        title:   "Mystery Event",
        kind:    "unknown_type",
        start:   "2026-05-14T12:00:00",
        end:     "2026-05-14T13:00:00",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("rejects missing title", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({ user_id: userId, start: "2026-05-15T10:00:00", end: "2026-05-15T11:00:00" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/title|start|end/i);
  });

  test("rejects missing start time", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({ user_id: userId, title: "No Start", end: "2026-05-15T11:00:00" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects invalid user_id", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({ user_id: 0, title: "Bad User", start: "2026-05-16T10:00:00", end: "2026-05-16T11:00:00" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── GET (after creates) ──────────────────────────────────────────────────────

describe("GET /api/events (after creates)", () => {
  test("returns all events created for the user", async () => {
    const res = await request(app).get(`/api/events?user_id=${userId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.events.length).toBeGreaterThanOrEqual(4);

    const first = res.body.events.find(e => e.event_id === eventId);
    expect(first).toBeDefined();
    expect(first.title).toBe("Midterm Exam");
    expect(first.event_type).toBe("exam");
  });
});

// ─── PUT ──────────────────────────────────────────────────────────────────────

describe("PUT /api/events/:id", () => {
  test("reschedules an event (drag-drop style — start/end/allDay only)", async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .send({ start: "2026-05-11T09:00:00", end: "2026-05-11T11:00:00", allDay: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("updates title, course, and event_type from the edit modal", async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .send({
        start: "2026-05-11T09:00:00",
        end:   "2026-05-11T11:00:00",
        allDay: false,
        title:  "Final Exam",
        course: "MATH 201",
        kind:   "exam",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("returns 404 for a non-existent event_id", async () => {
    const res = await request(app)
      .put("/api/events/999999999")
      .send({ start: "2026-05-11T09:00:00", end: "2026-05-11T11:00:00", allDay: false });

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test("rejects an invalid event_id", async () => {
    const res = await request(app)
      .put("/api/events/0")
      .send({ start: "2026-05-11T09:00:00", end: "2026-05-11T11:00:00", allDay: false });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects missing start/end times", async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .send({ title: "No Times" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe("DELETE /api/events/:id", () => {
  test("deletes an existing event", async () => {
    const res = await request(app).delete(`/api/events/${eventId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("returns 404 when trying to delete the same event again", async () => {
    const res = await request(app).delete(`/api/events/${eventId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test("returns 404 for a non-existent event_id", async () => {
    const res = await request(app).delete("/api/events/999999999");

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test("rejects an invalid event_id", async () => {
    const res = await request(app).delete("/api/events/0");

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
