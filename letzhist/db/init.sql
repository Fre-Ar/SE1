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

CREATE TABLE users (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  role ENUM('contributor', 'moderator', 'admin') DEFAULT 'contributor',
  created_at TIMESTAMP NOT NULL,
  last_login TIMESTAMP NULL,
  edits_pk_sk INT DEFAULT NULL,
  disputing_pk_sk INT DEFAULT NULL,
  FOREIGN KEY (edits_pk_sk) REFERENCES edits(id_pk) ON DELETE SET NULL,
  FOREIGN KEY (disputing_pk_sk) REFERENCES disputing(id_pk) ON DELETE SET NULL
);

CREATE TABLE content (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  place VARCHAR(255) NOT NULL,
  era VARCHAR(100) NOT NULL,--Enum possible
  theme VARCHAR(100) NOT NULL,--Enum possible
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE comment (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  user_fk INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE
);

CREATE TABLE dispute (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  user_fk INT NOT NULL,
  reason TEXT NOT NULL,
  currentStatus ENUM('open', 'under_review', 'resolved', 'dismissed') DEFAULT 'open',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (disputing_pk_sk) REFERENCES disputing(id_pk) ON DELETE CASCADE
);

CREATE TABLE report (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  user_fk INT NOT NULL,
  reason ENUM('spam', 'inappropriate', 'harassment', 'other') NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE
);

CREATE TABLE edit_history (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  content_fk INT NOT NULL,
  user_fk INT NOT NULL,
  actionPerformed ENUM('create', 'update', 'delete') NOT NULL,
  details JSON NULL,--Store a serialized version of the edits performed by the user 
  edit_timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (content_fk) REFERENCES content(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE
);

CREATE TABLE disputing (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  dispute_fk INT NOT NULL,
  user_fk INT NOT NULL,
  action_timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (dispute_fk) REFERENCES dispute(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE
);

CREATE TABLE edits(
    id_pk INT AUTO_INCREMENT PRIMARY KEY,
    user_fk INT NOT NULL,
    edit_fk INT NOT NULL,
    FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE,
    FOREIGN KEY (edit_fk) REFERENCES edit_history(id_pk) ON DELETE CASCADE
)