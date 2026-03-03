-- A) adding the user
USE xyon_user_db;

INSERT INTO xyon_user_db.users (first_name, last_name, email, password_hash, role)
VALUES ('Test', 'Student', 'test@student.edu', 'HASHED_PASSWORD', 'student');

-- B) adding a calendar for that user 
USE xyon_event_db;

INSERT INTO xyon_event_db.calendars (user_id, name, source, timezone, is_default)
VALUES (1, 'Personal', 'manual', 'America/New_York', 1);

-- C) adding an event to that calendar
INSERT INTO xyon_event_db.events (calendar_id, title, description, location, start_time, end_time, all_day, event_type)
VALUES (1, 'Club Meeting', 'AI club meeting', 'Student Center',
        '2026-03-03 15:00:00', '2026-03-03 16:00:00', 0, 'club');

-- D) Retrieve user profile
USE xyon_user_db;

SELECT user_id, first_name, last_name, email, role
FROM xyon_user_db.users
WHERE email = 'test@student.edu';

-- E) Retrieve events for user_id = 1 (join calendars + events)
USE xyon_event_db;

SELECT e.event_id, e.title, e.start_time, e.end_time, e.location, c.name AS calendar_name
FROM xyon_event_db.events e
JOIN calendars c ON e.calendar_id = c.calendar_id
WHERE c.user_id = 1
ORDER BY e.start_time;