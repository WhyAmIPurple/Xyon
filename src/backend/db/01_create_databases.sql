CREATE DATABASE IF NOT EXISTS xyon_user_db;
CREATE DATABASE IF NOT EXISTS xyon_event_db;

CREATE USER IF NOT EXISTS 'xyon_app'@'localhost' IDENTIFIED BY 'XyonAppPass123!';
ALTER USER 'xyon_app'@'localhost' IDENTIFIED BY 'XyonAppPass123!';

GRANT ALL PRIVILEGES ON xyon_user_db.* TO 'xyon_app'@'localhost';
GRANT ALL PRIVILEGES ON xyon_event_db.* TO 'xyon_app'@'localhost';

FLUSH PRIVILEGES;
