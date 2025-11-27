-- =========================================================
-- 1) Seed CONTENT
-- =========================================================
INSERT INTO content (title, body, place, era, theme, created_at, updated_at)
VALUES
('The Roman Empire', 'A detailed overview of the Roman Empire...', 'Europe', 'Ancient', 'History', NOW(), NOW()),
('Industrial Revolution', 'Transformation through machines...', 'United Kingdom', 'Modern', 'Technology', NOW(), NOW()),
('World War II', 'Global conflict from 1939–1945...', 'Worldwide', '20th Century', 'War', NOW(), NOW());



-- =========================================================
-- 2) Seed USERS
-- =========================================================
INSERT INTO users (username, email, password_hash, password_salt, role, created_at, last_login)
VALUES
('alice', 'alice@example.com', 'hashA', 'saltA', 'contributor', NOW(), NOW()),
('bob', 'bob@example.com', 'hashB', 'saltB', 'moderator', NOW(), NULL),
('carol', 'carol@example.com', 'hashC', 'saltC', 'admin', NOW(), NOW());



-- =========================================================
-- 3) Seed COMMENTS
-- =========================================================
INSERT INTO comment (content_fk, user_fk, body, created_at)
VALUES
(1, 1, 'This is a great summary!', NOW()),
(1, 2, 'Please add more about Roman engineering.', NOW()),
(2, 1, 'Very insightful!', NOW()),
(3, 3, 'Important topic, well explained.', NOW());



-- =========================================================
-- 4) Seed DISPUTES (initial insertion)
-- =========================================================
INSERT INTO dispute (content_fk, disputing_pk_sk, reason, currentStatus, created_at)
VALUES
(1, NULL, 'Contains factual inaccuracies.', 'open', NOW()),
(3, NULL, 'Potential bias in wording.', 'under_review', NOW());



-- =========================================================
-- 5) Seed EDIT HISTORY
-- =========================================================
INSERT INTO edit_history (content_fk, user_fk, actionPerformed, details, edit_timestamp)
VALUES
(1, 3, 'update', JSON_OBJECT('field', 'body', 'old', '...', 'new', 'Updated Roman Empire text'), NOW()),
(2, 1, 'create', JSON_OBJECT('title', 'Industrial Revolution'), NOW()),
(3, 2, 'update', JSON_OBJECT('field', 'title', 'old', 'WW2', 'new', 'World War II'), NOW());



-- =========================================================
-- 6) Seed EDITS (link users to edit_history entries)
-- =========================================================
INSERT INTO edits (user_fk, edit_fk)
VALUES
(3, 1),
(1, 2),
(2, 3);



-- =========================================================
-- 7) Seed DISPUTING ACTIONS
-- =========================================================
INSERT INTO disputing (dispute_fk, user_fk, action_timestamp)
VALUES
(1, 2, NOW()),
(1, 3, NOW()),
(2, 3, NOW());

