const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const userDb = require("../db/user_db.js");

const router = express.Router();

// Email transporter — falls back to console log if not configured
const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

async function sendResetEmail(to, otp) {
  if (transporter) {
    await transporter.sendMail({
      from: `"Xyon" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Xyon password reset code",
      html: `<p>Your password reset code is: <strong style="font-size:1.4em">${otp}</strong></p><p>This code expires in 15 minutes. If you did not request this, ignore this email.</p>`,
    });
  } else {
    console.log(`\n[XYON DEV] Password reset OTP for ${to}: ${otp}\n`);
  }
}

//Registering for the user
router.post("/register", async(req, res) => {
    try {
        const {first_name, last_name, email, password} = req.body;
        if (!first_name || !last_name || !email || !password){
            return res.status(400).json({ok: false, message: "All information must be filled out."});
        }

        const [ifExisting] = await userDb.query("SELECT * FROM users WHERE email = ?", [email]);
        if (ifExisting.length > 0){
            return res.status(400).json({ok: false, error: "Email already exists."});
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const [result] = await userDb.query("INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)", [first_name, last_name, email, passwordHash]);

        return res.status(201).json({ok: true, user_id: result.insertId}); 
    } catch (error){
        console.error(error);
        return res.status(500).json({ok: false, error: "An error occurred while registering the user."});
    }
})

//Signing in for returning users
/*router.post("/login", async(req, res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password){
            return res.status(400).json({ok: false, error: "Email and password must be provided."});
        }
        const [rows] = await userDb.query(
            'SELECT user_id, first_name, last_name, email, role, password_hash FROM users WHERE email = ?', [email]
        );

        if (rows.length === 0){
            return res.status(400).json({ok: false, error: "Invalid email or password."});
        }

        const user = rows[0];
        const compare = await bcrypt.compare(password, user.password_hash);

        if (!compare){
            return res.status(400).json({ok: false, error: "Invalid email or password."});
        }

        const token = jwt.sign(
            {user_id: user.user_id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: "3h"}
        )

        return res.json({
            ok: true,
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            },
        });
    } catch(error) {
        console.error(error);
        return res.status(500).json({ok: false, error: "An error occurred while logging in."});
    }
});*/

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("LOGIN ATTEMPT:", email);

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password must be provided." });
    }

    const [rows] = await userDb.query(
      "SELECT user_id, first_name, last_name, email, role, password_hash FROM users WHERE email = ?",
      [email]
    );
    console.log("ROWS FOUND:", rows.length);

    if (rows.length === 0) {
      return res.status(400).json({ ok: false, error: "Invalid email or password." });
    }

    const user = rows[0];
    console.log("USER ROLE:", user.role);

    const compare = await bcrypt.compare(password, user.password_hash);
    console.log("PASSWORD MATCH:", compare);

    if (!compare) {
      return res.status(400).json({ ok: false, error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ ok: false, error: "An error occurred while logging in." });
  }
});

// Send a 6-digit OTP to the given email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: "Email required." });

    const [rows] = await userDb.query("SELECT user_id FROM users WHERE email = ?", [email]);
    // Respond OK regardless to avoid user enumeration
    if (rows.length === 0) return res.json({ ok: true });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await userDb.query(
      "UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE email = ?",
      [otp, expires, email]
    );

    await sendResetEmail(email, otp);
    return res.json({ ok: true });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ ok: false, error: "Failed to send reset code." });
  }
});

// Verify OTP and set a new password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ ok: false, error: "All fields are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });

    const [rows] = await userDb.query(
      "SELECT user_id, reset_otp, reset_otp_expires FROM users WHERE email = ?",
      [email]
    );
    if (rows.length === 0 || rows[0].reset_otp !== otp)
      return res.status(400).json({ ok: false, error: "Invalid or expired code." });

    if (new Date() > new Date(rows[0].reset_otp_expires))
      return res.status(400).json({ ok: false, error: "Code has expired. Please request a new one." });

    const hash = await bcrypt.hash(newPassword, 12);
    await userDb.query(
      "UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE user_id = ?",
      [hash, rows[0].user_id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ ok: false, error: "Failed to reset password." });
  }
});

// Change password while logged in (requires current password)
router.post("/change-password", async (req, res) => {
  try {
    const { user_id, currentPassword, newPassword } = req.body;
    if (!user_id || !currentPassword || !newPassword)
      return res.status(400).json({ ok: false, error: "All fields are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ ok: false, error: "New password must be at least 6 characters." });

    const [rows] = await userDb.query(
      "SELECT password_hash FROM users WHERE user_id = ?", [user_id]
    );
    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "User not found." });

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match)
      return res.status(400).json({ ok: false, error: "Current password is incorrect." });

    const hash = await bcrypt.hash(newPassword, 12);
    await userDb.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [hash, user_id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({ ok: false, error: "Failed to change password." });
  }
});

// Delete account and all associated data
router.delete("/account/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) return res.status(400).json({ ok: false, error: "user_id required." });

    const eventDb = require("../db/event_db.js");

    // Delete events linked to the user's calendars
    await eventDb.query(
      `DELETE e FROM events e
       INNER JOIN calendars c ON e.calendar_id = c.calendar_id
       WHERE c.user_id = ?`,
      [user_id]
    );

    // Delete todos
    await eventDb.query("DELETE FROM todos WHERE user_id = ?", [user_id]);

    // Delete calendars
    await eventDb.query("DELETE FROM calendars WHERE user_id = ?", [user_id]);

    // Delete the user record
    await userDb.query("DELETE FROM users WHERE user_id = ?", [user_id]);

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete account." });
  }
});

module.exports = router;