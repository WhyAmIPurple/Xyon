const express = require('express');
const cors = require('cors');
require("dotenv").config({path: __dirname + "/.env"});

const authorizationRoutes = require("./routes/authorization");
const eventRoutes = require("./routes/events");
const todoRoutes = require("./routes/todos");
const msuRoutes  = require("./routes/msu");
const userDb = require("./db/user_db.js");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Xyon is running"));

app.use("/api/auth", authorizationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/msu",   msuRoutes);

async function migrate() {
  const [cols] = await userDb.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'xyon_user_db' AND TABLE_NAME = 'users'
     AND COLUMN_NAME IN ('reset_otp', 'reset_otp_expires')`
  );
  const existing = cols.map(c => c.COLUMN_NAME);
  if (!existing.includes("reset_otp"))
    await userDb.query("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(64)");
  if (!existing.includes("reset_otp_expires"))
    await userDb.query("ALTER TABLE users ADD COLUMN reset_otp_expires DATETIME");
}

migrate()
  .then(() => app.listen(3001, () => console.log("Server running on port 3001")))
  .catch(err => { console.error("Migration failed:", err); process.exit(1); });
