-- Event Management Platform — Schema
-- Run this once against your MySQL database (local or Railway).

-- CREATE DATABASE IF NOT EXISTS event_management;
-- USE event_management;

-- 1. USERS (both admins and participants live here; role separates them)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'participant') NOT NULL,
  prn VARCHAR(50) UNIQUE, -- only used for participants; NULL for admins
  interests VARCHAR(255), -- comma-separated, participant-only, used for simple event suggestions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. EVENTS
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  capacity INT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue VARCHAR(150) NOT NULL,
  event_type ENUM('compulsory', 'optional') NOT NULL DEFAULT 'optional',
  tags VARCHAR(255), -- comma-separated, e.g. "AI,coding,workshop" — used for simple suggestion matching
  registration_open BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. SPEAKERS (reusable across sessions/events)
CREATE TABLE speakers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  bio TEXT,
  contact VARCHAR(100),
  organization VARCHAR(150),
  designation VARCHAR(100)
);

-- 4. SESSIONS (belong to one event, one speaker; overlap checked in backend)
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  speaker_id INT NOT NULL,
  session_name VARCHAR(150) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (speaker_id) REFERENCES speakers(id),
  INDEX idx_event_id (event_id)
);

-- 5. REGISTRATIONS (unique constraint = the duplicate-registration guard)
CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  event_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (participant_id, event_id)
);

-- 6. ATTENDANCE TOKENS (rotating QR tokens per event)
CREATE TABLE attendance_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  token VARCHAR(100) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_token (event_id, token)
);

-- 7. ATTENDANCE (unique constraint = no double marking)
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  event_id INT NOT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (participant_id, event_id)
);

-- 8. FEEDBACK (unique constraint = one feedback per participant per event)
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  event_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_feedback (participant_id, event_id)
);
