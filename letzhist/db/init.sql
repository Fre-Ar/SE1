-- SQL script to initialize the database schema for LetzHist application
-- This script creates tables for users, content, comments, disputes, reports, edit history, and disputing actions.
-- Look into seed.sql for initial data population, to get an idea of what data goes where.



-- Drop tables if they exist (safe reset)
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS dispute;
DROP TABLE IF EXISTS comment;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS storyRevision;
DROP TABLE IF EXISTS story;
DROP TABLE IF EXISTS users;

-- 1) USERS --------------------------------------------------------------
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

-- 2) THE STORY CONTAINER (The "Repository" - fulfills export type Story)
CREATE TABLE story (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  liveTitle VARCHAR(255) NOT NULL
);

-- 3) STORYREVISION (The "Commit" - fulfills export type StoryRevision)
CREATE TABLE storyRevision (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  story_fk INT NOT NULL,
  parentId_fk INT NULL,
  author_fk INT NULL,
  
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NULL,
  slug VARCHAR(255) NOT NULL, 
  body TEXT NOT NULL,
  leadImage JSON NULL,
  
  created_at TIMESTAMP NOT NULL,
  changeMessage VARCHAR(255) NULL,
  revStatus ENUM ('draft','published','archived','rejected') DEFAULT 'draft', 
  
  FOREIGN KEY (story_fk) REFERENCES story(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (parentId_fk) REFERENCES storyRevision(id_pk) ON DELETE SET NULL,
  FOREIGN KEY (author_fk) REFERENCES users(id_pk) ON DELETE SET NULL
);

CREATE TABLE tags (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  storyRevision_fk INT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (storyRevision_fk) REFERENCES storyRevision(id_pk) ON DELETE CASCADE
);


-- 4) COMMENT ------------------------------------------------------------
CREATE TABLE comment (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  story_fk INT NOT NULL,
  revision_fk INT NOT NULL,
  user_fk INT NOT NULL,

  parentId_fk INT NULL,
  
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,

  -- Soft Delete & Moderation
  status ENUM('visible', 'hidden_by_mod', 'deleted_by_user') DEFAULT 'visible',
  
  FOREIGN KEY (story_fk) REFERENCES story(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (revision_fk) REFERENCES storyRevision(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (user_fk) REFERENCES users(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (parentId_fk) REFERENCES comment(id_pk) ON DELETE SET NULL
);

-- 5) DISPUTE ------------------------------------------------------------
CREATE TABLE dispute (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('comment', 'user', 'story', 'revision') NOT NULL,
  target_id INT NOT NULL,
  contextRevision_fk INT NULL,
  
  category ENUM('accuracy', 'bias', 'citation_missing', 'spam', 'harassment', 'hate_speech', 'violence', 'other') NOT NULL, 
  reason TEXT NOT NULL,
  currentStatus ENUM('open','under_review','resolved','dismissed') DEFAULT 'open', 
  
  reporter_fk INT NOT NULL, 
  created_at TIMESTAMP DEFAULT NOW(),
  
  resolvedBy_fk INT NULL DEFAULT NULL, 
  resolutionNotes TEXT NULL DEFAULT NULL, 
  resolvedAt TIMESTAMP NULL DEFAULT NULL, 
  
  FOREIGN KEY (contextRevision_fk) REFERENCES storyRevision(id_pk) ON DELETE SET NULL,
  FOREIGN KEY (reporter_fk) REFERENCES users(id_pk) ON DELETE CASCADE,
  FOREIGN KEY (resolvedBy_fk) REFERENCES users(id_pk) ON DELETE SET NULL
  -- We CANNOT add a FK for target_id.
);

-- 6) AUDIT LOG ----------------------------------------------------------
CREATE TABLE audit_log (
  id_pk INT AUTO_INCREMENT PRIMARY KEY,
  actor_fk INT NULL,
  action VARCHAR(50) NOT NULL,
  target_type ENUM('user','content','story') NOT NULL,
  target_id INT,
  target_name VARCHAR(255),
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (actor_fk) REFERENCES users(id_pk) ON DELETE SET NULL
);
