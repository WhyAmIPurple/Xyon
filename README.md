# Xyon
Student-focused app to track assignments, deadlines, exams, tasks, and extracurriculars in one place. We plan compatibility with Montclair State tools (Canvas, Engage, scheduling) to sync schedules and coursework. Built for Montclair students, but useful for professionals or anyone wanting a simple, subscription-free planner.

## Run the app

### Prerequisites
- Node.js 18+ and npm

### 1) Start the backend
```bash
cd server
npm install
npm run dev
```

Backend runs at: `http://localhost:3001`

Quick checks:
- Health: `GET http://localhost:3001/health`
- Events API: `GET http://localhost:3001/api/events`

### 2) Start the frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Current branch functionality

- Calendar-first UI built with React + FullCalendar (week and month views).
- Custom calendar header with:
  - `today`, previous, and next navigation.
  - active date range label and month/year title.
- Click any date/time slot to open an **Add event** modal.
- Modal supports two event types:
  - **Class**: title, optional course, date, start time, end time.
  - **Assignment**: title, optional course, date, due time.
- New events are added directly to the calendar with color coding by type.
- Drag/drop and resize are enabled for calendar events.
- Click an event to delete it (with a confirmation prompt).
- Includes seeded sample events on initial load.
- Sidebar/topbar shell UI is present (Dashboard, Calendar, List, Classes, etc.).

## Notes

- In this branch, calendar events shown in the frontend are currently managed in local React state and are not persisted.
- The Express API stores events in memory only (resets when server restarts).
