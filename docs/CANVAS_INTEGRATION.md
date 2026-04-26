# Canvas LMS Integration

This document explains how the Canvas LMS integration was added to Xyon, what tables and routes were introduced, and how to demo or continue the work with another teammate.

## Goal

The goal was to let a logged-in Xyon user connect their Canvas account and pull Canvas assignment due dates plus Canvas calendar events into the same calendar view that already displays manual Xyon events.

## What was added

### Backend

- `server/src/routes/canvas.js`
  - `GET /api/canvas/status`
  - `GET /api/canvas/connect`
  - `GET /api/canvas/callback`
  - `POST /api/canvas/sync`
  - `POST /api/canvas/disconnect`
- `server/src/services/canvas.js`
  - Canvas URL normalization
  - OAuth token exchange
  - Access-token refresh
  - Canvas pagination support
  - Canvas assignment and calendar-event sync
- `server/src/routes/events.js`
  - Now returns external event metadata
  - Added `PUT /api/events/:id`
  - Added `DELETE /api/events/:id`
  - Blocks local edits/deletes for Canvas-synced events

### Frontend

- `client/src/pages/CalendarPage.jsx`
  - Replaced the seed-only calendar with API-backed event loading
  - Added Canvas connect, sync, and disconnect controls
  - Shows success/error banners after OAuth returns
  - Opens Canvas links for Canvas-synced items
  - Prevents drag/drop edits of Canvas-synced items

### Database

- `src/backend/db/05_canvas_integration.sql`
  - Creates `xyon_user_db.canvas_connections`
  - Adds external sync columns to `xyon_event_db.events`
  - Adds a unique key so the same Canvas item is updated instead of duplicated

## Data model changes

### `xyon_user_db.canvas_connections`

One row per Xyon user. This stores:

- the Canvas base URL for that school
- the current `access_token`
- the `refresh_token`
- the token expiry timestamp
- the last sync timestamp

### `xyon_event_db.events`

These columns were added:

- `external_source`
- `external_id`
- `external_url`

Why:

- `external_source='canvas'` marks items that came from Canvas
- `external_id` is used to upsert the same Canvas item on later syncs
- `external_url` lets the UI open the original Canvas item

## OAuth flow

The integration uses Canvas OAuth2 for multi-user access.

1. The user enters their Canvas domain in the calendar page.
2. The frontend sends the browser to `GET /api/canvas/connect`.
3. The backend normalizes the domain and redirects to Canvas:
   - `/login/oauth2/auth`
4. Canvas asks the user to approve the app.
5. Canvas redirects back to:
   - `/api/canvas/callback`
6. The backend exchanges the authorization code at:
   - `/login/oauth2/token`
7. The backend stores the returned `access_token`, `refresh_token`, and expiry.
8. The backend immediately runs a sync so the user sees Canvas events right away.
9. The backend redirects back to the frontend with a short status query string.

## Sync flow

The sync is server-to-server and writes directly into the existing `events` table.

### Assignments

For each Canvas course, Xyon requests:

- `GET /api/v1/courses/:course_id/assignments`

Then it maps each assignment with a `due_at` timestamp into:

- `event_type='assignment'`
- `title = assignment name`
- `course = Canvas course name`
- `start_time = due_at`
- `end_time = due_at`

### Calendar events

Xyon also requests:

- `GET /api/v1/calendar_events`

for a configured time window. These become regular calendar items, usually mapped as:

- `event_type='class'` when tied to a course
- `event_type='personal'` otherwise

### Upsert behavior

Each synced item is inserted with:

- `external_source='canvas'`
- `external_id='assignment:<id>'` or `external_id='calendar_event:<id>'`

Because of the unique key on `(calendar_id, external_source, external_id)`, rerunning sync updates the same row instead of creating duplicates.

### Cleanup behavior

After a sync finishes, any old Canvas-synced events for that Canvas calendar that are no longer returned by Canvas are deleted. This keeps Xyon aligned with the current Canvas state.

## Why Canvas events are read-only in Xyon

Canvas is the source of truth for synced Canvas items. Because of that:

- dragging a Canvas event in FullCalendar is blocked
- deleting a Canvas event in Xyon is blocked
- clicking a Canvas event opens the original Canvas item when a Canvas URL is available

Manual Xyon events still remain editable and deletable through the Xyon API.

## Environment variables

Add these to the server env file that `server/src/index.js` loads:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CLIENT_APP_URL`
- `CANVAS_CLIENT_ID`
- `CANVAS_CLIENT_SECRET`
- `CANVAS_REDIRECT_URI`
- `CANVAS_SYNC_PAST_DAYS`
- `CANVAS_SYNC_FUTURE_DAYS`

An example file was added at:

- `server/src/.env.example`

## Setup steps

1. Create or update your server env file using `server/src/.env.example`.
2. In Canvas, create a developer key and get the client ID and client secret.
3. Set the redirect URI in Canvas to:
   - `http://localhost:3001/api/canvas/callback`
4. Run the SQL in:
   - `src/backend/db/05_canvas_integration.sql`
5. Start the backend on port `3001`.
6. Start the Vite frontend on port `5173`.
7. Log into Xyon.
8. Enter your Canvas domain and click `Connect Canvas`.

## Important assumptions

- The app is running locally with frontend `http://localhost:5173` and backend `http://localhost:3001`.
- Node.js is new enough to provide global `fetch` support.
- The user can authenticate through a Canvas instance that allows this developer key.
- The database schema from the earlier Xyon calendar work has already been applied.

## Known limitations

- Tokens are stored in plaintext in MySQL right now. For a production deployment, they should be encrypted at rest.
- The current frontend only has the calendar view on this branch, so the Canvas controls live there instead of a dedicated settings page.
- The sync currently focuses on assignments with due dates and Canvas calendar events. It does not yet import quizzes, modules, or submission-state badges into the UI.
- The course fetch is student-oriented. If later you want teacher/admin scenarios, the query should be expanded.
- Error handling is user-friendly enough for local development, but not yet polished for production UX.

## Demo script for a teammate

1. Show the `Connect Canvas` section on the calendar page.
2. Explain that the frontend does not call Canvas directly.
3. Show `server/src/routes/canvas.js` and point out the OAuth and sync endpoints.
4. Show `server/src/services/canvas.js` and explain:
   - token exchange
   - token refresh
   - pagination
   - assignment/calendar-event mapping
5. Show `src/backend/db/05_canvas_integration.sql` and explain how duplicate syncs are prevented.
6. Show `server/src/routes/events.js` and explain why Canvas events are read-only.
7. Connect to Canvas and run a sync.
8. Point out that Canvas due dates now appear in the same FullCalendar view as local events.

## Reference documents

These are the official Canvas docs used for the implementation:

- OAuth2 overview:
  - https://developerdocs.instructure.com/services/canvas/oauth2/file.oauth
- OAuth2 endpoints:
  - https://developerdocs.instructure.com/services/canvas/oauth2/file.oauth_endpoints
- Courses API:
  - https://developerdocs.instructure.com/services/canvas/resources/courses
- Assignments API:
  - https://developerdocs.instructure.com/services/canvas/resources/assignments
- Calendar Events API:
  - https://developerdocs.instructure.com/services/canvas/resources/calendar_events
