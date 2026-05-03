// Builds the Express app without starting the HTTP server.
// Supertest wraps it in its own server for each test run.
require("dotenv").config({ path: require("path").resolve(__dirname, "../../server/src/.env") });

const express = require("express");
const cors    = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Xyon test server"));

app.use("/api/auth",   require("../../server/src/routes/authorization"));
app.use("/api/events", require("../../server/src/routes/events"));
app.use("/api/todos",  require("../../server/src/routes/todos"));

module.exports = app;
