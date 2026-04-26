USE xyon_user_db;

CREATE TABLE IF NOT EXISTS canvas_connections (
  connection_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT NOT NULL,
  canvas_base_url    VARCHAR(255) NOT NULL,
  canvas_domain      VARCHAR(255) NOT NULL,
  canvas_user_id     BIGINT NULL,
  canvas_user_name   VARCHAR(255) NULL,
  access_token       TEXT NOT NULL,
  refresh_token      TEXT NULL,
  token_expires_at   DATETIME NOT NULL,
  last_synced_at     DATETIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_canvas_connection_user (user_id),
  CONSTRAINT fk_canvas_connection_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

USE xyon_event_db;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS external_source ENUM('canvas','engage','degreeworks','other') NULL AFTER event_type;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(191) NULL AFTER external_source;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS external_url VARCHAR(512) NULL AFTER external_id;

ALTER TABLE events
  ADD UNIQUE KEY uq_events_external_ref (calendar_id, external_source, external_id);
