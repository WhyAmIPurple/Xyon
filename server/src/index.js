const express = require('express');
const cors = require('cors');
require("dotenv").config({path: __dirname + "/.env"});

const authorizationRoutes = require("../../source/backend/backend/routes/authorization");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Xyon is running"));

app.use("/api/auth", authorizationRoutes);

let events = [];

//app.get('/health', (req, res) => {
//  res.json({ status: 'OK' });
//});

//app.get('/api/events', (req, res) => {
//  res.json(events);
//});

app.post('/api/events', (req, res) => {
  const event = { id: Date.now(), ...req.body };
  events.push(event);
  res.json(event);
});

app.listen(3001, () => console.log('Server running on port 3001'));