# Recent Changes

This document summarizes the most recent committed changes in the Xyon repo.

Note: as of April 8, 2026, the git working tree is clean, so this write-up is based on recent commits rather than uncommitted local edits.

## 1. Logout Flow Documentation

Commit: `17b2c82`  
Date: April 1, 2026  
Message: `Document logout flow`

Files changed:
- `client/src/App.jsx`
- `client/src/components/layout/AppShell.jsx`
- `client/src/pages/CalendarPage.jsx`

What changed:
- `App.jsx` now owns the logout behavior by clearing `token` and `user` from `localStorage` and switching the app back to the login screen.
- `CalendarPage.jsx` was updated to accept `onLogout` properly and pass it down to the layout shell.
- `AppShell.jsx` connects the `Sign Out` sidebar item to the logout handler and adds comments explaining how the logout path flows through the frontend.

Why it matters:
- The logout action is now wired end to end through the main app, calendar page, and shared shell layout.
- The flow is easier to follow for future edits and debugging.

## 2. Event Route Documentation

Commit: `8fd12f9`  
Date: April 1, 2026  
Message: `Document event route flow`

Files changed:
- `server/src/routes/events.js`

What changed:
- Inline documentation was added to the backend event route.
- The route already handled event type normalization, date-time normalization, default calendar lookup or creation, event fetch, and event insert behavior.

Why it matters:
- The backend event flow is easier to understand without changing behavior.
- This lowers the effort needed to maintain or extend event APIs.

## 3. Event Creation Saved Through Backend

Commit: `e031fb1`  
Date: March 25, 2026  
Message: `Save added events through backend route`

Files changed:
- `client/src/pages/CalendarPage.jsx`
- `server/src/db/event_db.js`
- `server/src/index.js`
- `server/src/routes/events.js`

What changed:
- `CalendarPage.jsx` now sends new event submissions to `http://localhost:3001/api/events` instead of keeping them only in frontend state.
- The frontend reads the logged-in user from `localStorage`, sends `user_id` with the event payload, and adds the saved event to the calendar using the returned `event_id`.
- `server/src/routes/events.js` adds API support to:
  - fetch events for a user
  - create a default calendar when needed
  - insert new events into the database
  - normalize event type and date-time input
- Supporting backend wiring was added in `server/src/index.js` and `server/src/db/event_db.js`.

Why it matters:
- Added events can now persist through the backend instead of disappearing on refresh.
- The event flow is now aligned with user-specific storage.

## 4. Event Schema Alignment

Commit: `9c47f2b`  
Date: March 25, 2026  
Message: `Align event schema with class and assignment flow`

Files changed:
- `src/backend/db/03_event_db.sql`
- `src/backend/db/04_test_queries.sql`

What changed:
- The event schema was updated to better support class and assignment records.
- `course` support was added or reinforced in the event table definition.
- Comments now describe how UI concepts map to stored event data.
- Test queries were updated to match the revised schema and sample data flow.

Why it matters:
- The database structure now better matches the frontend event model.
- Demo and validation queries reflect the same assumptions as the application code.

## 5. Database Cleanup And Setup Simplification

Commit: `db1078d`  
Date: March 25, 2026  
Message: `Clean redundant files and update DB setup`

Files changed:
- Deleted generated build artifacts under `CalendarFXApp/target/`
- Deleted `.DS_Store` files under `client/` and `server/`
- Removed older duplicate backend files under `source/backend/...`
- Updated:
  - `src/backend/db/01_create_databases.sql`
  - `src/backend/db/03_event_db.sql`
  - `src/backend/db/04_test_queries.sql`

What changed:
- Redundant generated files and duplicate backend sources were removed.
- The database setup scripts were cleaned up and consolidated.

Why it matters:
- The repo is easier to navigate.
- The active database scripts are clearer and less likely to conflict with older copies.

## Summary

Across the recent changes, the main work focused on:
- cleaning up duplicate or generated files
- aligning the event database schema with app behavior
- saving calendar events through backend APIs
- documenting event and logout flows for easier maintenance
