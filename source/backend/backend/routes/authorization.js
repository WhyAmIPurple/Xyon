const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userDb = require("../db.js/user_db.js");

const router = express.Router();

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

module.exports = router;