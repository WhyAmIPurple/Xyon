-- STEP 1: reset data so demo always works

USE xyon_event_db;
DELETE FROM events;
DELETE FROM calendars;

ALTER TABLE events AUTO_INCREMENT = 1;
ALTER TABLE calendars AUTO_INCREMENT = 1;

USE xyon_user_db;
DELETE FROM users;
ALTER TABLE users AUTO_INCREMENT = 1;


-- STEP 2: create demo user
USE xyon_user_db;

INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES ('Demo', 'User', 'demo@student.edu', 'HASHED_PASSWORD', 'student');


-- STEP 3: create calendar for that user

USE xyon_event_db;

INSERT INTO calendars (user_id, name, source, timezone, is_default)
VALUES (1, 'Personal Calendar', 'manual', 'America/New_York', 1);


-- STEP 4: create event
USE xyon_event_db;

INSERT INTO events (calendar_id, title, description, location, start_time, end_time, all_day, event_type)
VALUES (1, 'AI Club Meeting', 'Weekly AI club discussion', 'Student Center',
        '2026-03-10 15:00:00', '2026-03-10 16:00:00', 0, 'club');


-- STEP 5: retrieve user

USE xyon_user_db;

SELECT * FROM users;


-- STEP 6: retrieve events for that user

USE xyon_event_db;

SELECT e.event_id, e.title, e.start_time, e.end_time, e.location,
       c.name AS calendar_name, c.user_id
FROM events e
JOIN calendars c ON e.calendar_id = c.calendar_id;