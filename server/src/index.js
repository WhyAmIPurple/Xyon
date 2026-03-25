const express = require('express');
const cors = require('cors');
require("dotenv").config({path: __dirname + "/.env"});

const authorizationRoutes = require("./routes/authorization");
const eventRoutes = require("./routes/events");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Xyon is running"));

app.use("/api/auth", authorizationRoutes);
app.use("/api/events", eventRoutes);

app.listen(3001, () => console.log('Server running on port 3001'));
