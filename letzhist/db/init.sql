-- SQL script to initialize the database schema for LetzHist application
-- This script creates tables for users, content, comments, disputes, reports, edit history, and disputing actions.
-- Look into seed.sql for initial data population, to get an idea of what data goes where.



-- Drop tables if they exist (safe reset)
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS content;
DROP TABLE IF EXISTS comment;
DROP TABLE IF EXISTS dispute;
DROP TABLE IF EXISTS report;
DROP TABLE IF EXISTS edit_history;
DROP TABLE IF EXISTS disputing;
DROP TABLE IF EXISTS edits;
DROP TABLE IF EXISTS tags;
-- 1) CONTENT -----------------------------------------------------------
CREATE TABLE content (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  place VARCHAR(255) NOT NULL,
  era VARCHAR(100) NOT NULL,
  theme VARCHAR(100) NOT NULL,
  is_removed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE tags (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE
);


-- 2) USERS --------------------------------------------------------------
CREATE TABLE users (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(25) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('contributor','moderator','admin') DEFAULT 'contributor',
  is_banned BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP NULL
);

-- 3) COMMENT ------------------------------------------------------------
CREATE TABLE comment (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  user_fk INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE
);

-- 4) DISPUTE ------------------------------------------------------------
CREATE TABLE dispute (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  reason TEXT NOT NULL,
  currentStatus ENUM('open','under_review','resolved','dismissed') DEFAULT 'open',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE
);

-- 5) EDIT HISTORY --------------------------------------------------------
CREATE TABLE edit_history (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  user_fk INT NOT NULL,
  actionPerformed ENUM('create','update','delete') NOT NULL,
  details JSON NULL,
  edit_timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE
);

-- 6) EDITS --------------------------------------------------------------
CREATE TABLE edits (
    id_pk INT AUTO_INCREMENT PRIMARY KEY,
    user_fk INT NOT NULL,
    edit_fk INT NOT NULL,
    FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE,
    FOREIGN KEY (edit_fk) REFERENCES edit_history(id_pk) ON DELETE CASCADE
);

-- 7) DISPUTING ----------------------------------------------------------
CREATE TABLE disputing (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  dispute_fk INT NOT NULL,
  user1_fk INT NOT NULL,
  user2_fk INT NOT NULL,
  action_timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (dispute_fk) REFERENCES dispute(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user1_fk) REFERENCES users(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user2_fk) REFERENCES users(id_pk) ON DELETE CASCADE
);

-- 8) AUDIT LOG ----------------------------------------------------------
CREATE TABLE audit_log (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  actor_fk INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type ENUM('user','content','story') NOT NULL,
  target_id INT,
  target_name VARCHAR(255),
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (actor_fk) REFERENCES users(id_pk) ON DELETE SET NULL
);
