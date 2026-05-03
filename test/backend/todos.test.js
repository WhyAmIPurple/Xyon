/**
 * Todos API Tests  —  /api/todos
 * Covers: GET, POST, PUT, DELETE
 */
const request = require("supertest");
const app     = require("./testApp");

const TS    = Date.now();
const EMAIL = `test_todos_${TS}@xyon-test.local`;
const PASS  = "TodosPass123!";

let userId;
let todoId;

beforeAll(async () => {
  const reg = await request(app)
    .post("/api/auth/register")
    .send({ first_name: "Todos", last_name: "Tester", email: EMAIL, password: PASS });
  userId = reg.body.user_id;
});

afterAll(async () => {
  if (userId) await request(app).delete(`/api/auth/account/${userId}`);
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/todos", () => {
  test("returns an empty todos array for a new user", async () => {
    const res = await request(app).get(`/api/todos?user_id=${userId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.todos)).toBe(true);
    expect(res.body.todos.length).toBe(0);
  });

  test("rejects a missing user_id", async () => {
    const res = await request(app).get("/api/todos");

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects a non-numeric user_id", async () => {
    const res = await request(app).get("/api/todos?user_id=abc");

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe("POST /api/todos", () => {
  test("creates a todo with title only", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ user_id: userId, title: "Read Chapter 5" });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.todo_id).toBe("number");
    todoId = res.body.todo_id;
  });

  test("creates a todo with all fields", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({
        user_id: userId,
        title:   "Lab Report",
        body:    "Due Friday",
        color:   "pink",
        pinned:  true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("creates a body-only todo (no title)", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ user_id: userId, body: "A quick reminder note" });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("normalises an invalid color to 'default'", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ user_id: userId, title: "Invalid Color", color: "rainbow" });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("accepts all valid color values", async () => {
    const colors = ["default", "pink", "blue", "green", "purple", "yellow"];
    for (const color of colors) {
      const res = await request(app)
        .post("/api/todos")
        .send({ user_id: userId, title: `Color: ${color}`, color });
      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
    }
  });

  test("rejects a todo with neither title nor body", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ user_id: userId, color: "blue" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects an invalid user_id", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ user_id: 0, title: "Bad User" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── GET (after creates) ──────────────────────────────────────────────────────

describe("GET /api/todos (after creates)", () => {
  test("returns all todos created for the user", async () => {
    const res = await request(app).get(`/api/todos?user_id=${userId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.todos.length).toBeGreaterThanOrEqual(3);
  });

  test("pinned todos appear before unpinned ones", async () => {
    const res = await request(app).get(`/api/todos?user_id=${userId}`);
    const todos = res.body.todos;

    let foundUnpinned = false;
    for (const t of todos) {
      if (t.pinned === 0) foundUnpinned = true;
      if (t.pinned === 1) {
        expect(foundUnpinned).toBe(false); // no pinned card should come after an unpinned one
      }
    }
  });

  test("each todo has the expected shape", async () => {
    const res = await request(app).get(`/api/todos?user_id=${userId}`);
    for (const t of res.body.todos) {
      expect(t).toHaveProperty("todo_id");
      expect(t).toHaveProperty("title");
      expect(t).toHaveProperty("body");
      expect(t).toHaveProperty("color");
      expect(t).toHaveProperty("pinned");
      expect(t).toHaveProperty("completed");
      expect(t).toHaveProperty("created_at");
    }
  });
});

// ─── PUT ──────────────────────────────────────────────────────────────────────

describe("PUT /api/todos/:id", () => {
  test("marks a todo as completed", async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("pins a todo", async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ pinned: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("changes the color of a todo", async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ color: "purple" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("updates title and body together", async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ title: "Updated Title", body: "Updated body text" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("rejects an update with no fields", async () => {
    const res = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/nothing to update/i);
  });

  test("returns 404 for a non-existent todo_id", async () => {
    const res = await request(app)
      .put("/api/todos/999999999")
      .send({ title: "Ghost" });

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test("rejects an invalid todo_id (0)", async () => {
    const res = await request(app)
      .put("/api/todos/0")
      .send({ title: "Bad ID" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe("DELETE /api/todos/:id", () => {
  test("deletes an existing todo", async () => {
    const res = await request(app).delete(`/api/todos/${todoId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("returns 404 when deleting the same todo again", async () => {
    const res = await request(app).delete(`/api/todos/${todoId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test("returns 404 for a non-existent todo_id", async () => {
    const res = await request(app).delete("/api/todos/999999999");

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test("rejects an invalid todo_id (0)", async () => {
    const res = await request(app).delete("/api/todos/0");

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
