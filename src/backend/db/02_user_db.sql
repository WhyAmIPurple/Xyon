USE xyon_user_db; 
-- creating user table to stroe login and profile information.
CREATE TABLE users (
  user_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  first_name     VARCHAR(50) NOT NULL,
  last_name      VARCHAR(50) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE, -- unique email for each user so duplicate accounts are not created with the same email.
  password_hash  VARCHAR(255) NOT NULL, -- hashing since storing plain text passwords is a security risk.
  role           ENUM('student','non_student','admin') NOT NULL DEFAULT 'student', -- We are going to have 3 roles: student, non_student, and admin. By default, all users will be students, right?
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- timestamps to track profile updates
) ENGINE=InnoDB;