const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let events = [];

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/api/events', (req, res) => {
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const event = { id: Date.now(), ...req.body };
  events.push(event);
  res.json(event);
});

app.listen(3001, () => console.log('Server running on port 3001'));