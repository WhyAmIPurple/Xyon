/**
 * Auth API Tests  —  /api/auth
 * Covers: register, login, forgot-password, reset-password, change-password, delete-account
 */
const request = require("supertest");
const app     = require("./testApp");

const TS    = Date.now();
const EMAIL = `test_auth_${TS}@xyon-test.local`;
const PASS  = "TestPass123!";

let userId;
let token;

// ─── REGISTER ───────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  test("registers a new user with valid data", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ first_name: "Test", last_name: "User", email: EMAIL, password: PASS });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.user_id).toBe("number");
    userId = res.body.user_id;
  });

  test("rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ first_name: "Test", last_name: "User", email: EMAIL, password: PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test("rejects missing first_name", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ last_name: "User", email: `no_fname_${TS}@test.local`, password: PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects missing last_name", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ first_name: "Test", email: `no_lname_${TS}@test.local`, password: PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects missing email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ first_name: "Test", last_name: "User", password: PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects missing password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ first_name: "Test", last_name: "User", email: `no_pw_${TS}@test.local` });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  test("logs in with correct credentials and returns a JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: PASS });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe(EMAIL);
    expect(res.body.user.first_name).toBe("Test");
    token = res.body.token;
  });

  test("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: "WrongPassword!" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test("rejects unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@xyon-test.local", password: PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects missing email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("rejects missing password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  test("returns ok:true for a registered email (sends OTP)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: EMAIL });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("returns ok:true even for an unregistered email (anti-enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ghost@xyon-test.local" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("rejects missing email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  test("rejects an invalid OTP", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: EMAIL, otp: "000000", newPassword: "NewPass123!" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });

  test("rejects a password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: EMAIL, otp: "123456", newPassword: "abc" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/6 characters/i);
  });

  test("rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: EMAIL });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────

describe("POST /api/auth/change-password", () => {
  test("changes password successfully with correct current password", async () => {
    const newPw = "ChangedPass456!";
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ user_id: userId, currentPassword: PASS, newPassword: newPw });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    // Restore original password so later cleanup can still delete the account
    await request(app)
      .post("/api/auth/change-password")
      .send({ user_id: userId, currentPassword: newPw, newPassword: PASS });
  });

  test("rejects wrong current password", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ user_id: userId, currentPassword: "WrongPassword!", newPassword: "AnotherPass789!" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/incorrect/i);
  });

  test("rejects new password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ user_id: userId, currentPassword: PASS, newPassword: "abc" });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/6 characters/i);
  });

  test("rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ user_id: userId });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────

describe("DELETE /api/auth/account/:user_id", () => {
  test("deletes the test account and all associated data", async () => {
    const res = await request(app).delete(`/api/auth/account/${userId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("login fails after account deletion", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
