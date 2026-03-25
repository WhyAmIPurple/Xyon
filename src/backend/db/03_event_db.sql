USE xyon_event_db;

-- CALENDARS table: each user can have calendars (Personal, Canvas, Engage, etc.)
CREATE TABLE IF NOT EXISTS calendars (
  calendar_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL,  
  name          VARCHAR(100) NOT NULL,
  source        ENUM('manual','engage','canvas','degreeworks','external') NOT NULL DEFAULT 'manual',
  timezone      VARCHAR(60) NOT NULL DEFAULT 'America/New_York',
  is_default    TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cal_user (user_id)
) ENGINE=InnoDB;

-- EVENTS table: events belong to a calendar
-- UI mapping:
-- Class -> title, course, start_time, end_time, event_type='class'
-- Assignment -> title, course, start_time, end_time, event_type='assignment'
-- For assignments, end_time can be stored the same as start_time when only a
-- single due time is provided by the UI.
CREATE TABLE IF NOT EXISTS events (
  event_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  calendar_id    BIGINT NOT NULL,

  title          VARCHAR(200) NOT NULL,
  course         VARCHAR(100),
  description    TEXT,
  location       VARCHAR(255),

  start_time     DATETIME NOT NULL,
  end_time       DATETIME NOT NULL,

  all_day        TINYINT(1) NOT NULL DEFAULT 0,
  event_type     ENUM('class','assignment','personal','club','exam','work','other') NOT NULL DEFAULT 'personal',

  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_event_calendar
    FOREIGN KEY (calendar_id) REFERENCES calendars(calendar_id)
    ON DELETE CASCADE,

  INDEX idx_event_time (calendar_id, start_time)
) ENGINE=InnoDB;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS course VARCHAR(100) AFTER title;

ALTER TABLE events
  MODIFY COLUMN event_type ENUM('class','assignment','personal','club','exam','work','other')
  NOT NULL DEFAULT 'personal';
