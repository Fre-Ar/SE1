-- ==========================================================
-- 1. USERS
-- ==========================================================

INSERT INTO users (username, email, password_hash, role, is_banned, is_muted, created_at) VALUES 
('AdminAlice',    'alice@letzhist.lu', 'hash_secret1', 'admin',       FALSE, FALSE, NOW()),
('ModBob',        'bob@letzhist.lu',   'hash_secret2', 'moderator',   FALSE, FALSE, NOW()),
('HistoryBuff',   'buff@uni.lu',       'hash_secret3', 'contributor', FALSE, FALSE, NOW()),
('NewbieNed',     'ned@uni.lu',        'hash_secret4', 'contributor', FALSE, FALSE, NOW()),
('Mod',           'mod@email.com',     '$2b$10$1W4QV3VUVJ0I013om2Wa6ecnJL/7Zr.wA2VdufQWui/riPmPLzu4u', 'moderator', FALSE, FALSE, NOW()),
('Admin',         'admin@email.com',   '$2b$10$4mkzT1ODLSWDtrzPD0LoT.dHozMGG4NTgdeNAMN8GPOe08rpNBiJS', 'admin', FALSE, FALSE, NOW());  
-- mod@email.com with pwd: 'mod'

-- ==========================================================
-- 2. STORIES (The Containers)
-- ==========================================================

INSERT INTO story (slug, created_at, liveTitle) VALUES 
('grand-ducal-palace', NOW(), 'The Grand Ducal Palace'), -- ID 1
('casemates-bock',     NOW(), 'The Bock Casemates'); -- ID 2

-- ==========================================================
-- 3. REVISIONS (The Snapshots)
-- ==========================================================

-- STORY 1: The Grand Ducal Palace
-- Revision 1: Initial creation by HistoryBuff (Published)
INSERT INTO storyRevision (
    title, subtitle, body, story_fk, slug, leadImage, 
    parentId_fk, author_fk, created_at, changeMessage, revStatus
) VALUES (
    'The Grand Ducal Palace', 
    'A residence of the Grand Duke', 
    'The palace is located in the middle of Luxembourg City. It was built in 1572.', 
    1, -- story_fk
    'grand-ducal-palace', 
    '{"url": "/images/lux_old_town.jpg", "alt": "Palace facade"}', 
    NULL, -- No parent, first version
    3,    -- HistoryBuff
    DATE_SUB(NOW(), INTERVAL 5 DAY), 
    'Initial article', 
    'published'
);

-- Revision 2: NewbieNed adds incorrect info (Published)
INSERT INTO storyRevision (
    title, subtitle, body, story_fk, slug, leadImage, 
    parentId_fk, author_fk, created_at, changeMessage, revStatus
) VALUES (
    'The Grand Ducal Palace', 
    'The main residence', 
    'The palace is located in the middle of Luxembourg City. It was built in 1995.', -- ERROR HERE
    1, 
    'grand-ducal-palace', 
    '{"url": "/images/lux_old_town.jpg", "alt": "Palace facade"}', 
    1, -- Parent is Rev 1
    4, -- NewbieNed
    DATE_SUB(NOW(), INTERVAL 3 DAY), 
    'Updated the date', 
    'published'
);

-- Revision 3: HistoryBuff fixes the date (Published - Current Live Version)
INSERT INTO storyRevision (
    title, subtitle, body, story_fk, slug, leadImage, 
    parentId_fk, author_fk, created_at, changeMessage, revStatus
) VALUES (
    'The Grand Ducal Palace', 
    'The main residence of the Grand Duke', 
    'The palace is located in the middle of Luxembourg City. It was built in 1572.', -- FIXED
    1, 
    'grand-ducal-palace', 
    '{"url": "/images/lux_old_town.jpg", "alt": "Palace facade"}', 
    2, -- Parent is Rev 2
    3, -- HistoryBuff
    DATE_SUB(NOW(), INTERVAL 1 DAY), 
    'Reverted incorrect date', 
    'published'
);

-- STORY 2: The Casemates
-- Revision 4: A Draft by HistoryBuff
INSERT INTO storyRevision (
    title, subtitle, body, story_fk, slug, leadImage, 
    parentId_fk, author_fk, created_at, changeMessage, revStatus
) VALUES (
    'The Bock Casemates', 
    'Underground tunnels', 
    'Draft content about the tunnels...', 
    2, -- story_fk
    'casemates-bock', 
    NULL, 
    NULL, 
    3, 
    NOW(), 
    'Starting work on Casemates', 
    'draft'
);

-- ==========================================================
-- 4. TAGS
-- ==========================================================

INSERT INTO tags (storyRevision_fk, tag) VALUES 
(1, 'architecture'), (1, '16th_century'), -- Tags for Rev 1
(3, 'architecture'), (3, '16th_century'), (3, 'royalty'); -- Tags for Rev 3

-- ==========================================================
-- 5. COMMENTS
-- ==========================================================

-- Comment on Revision 2 (The one with the error)
INSERT INTO comment (story_fk, revision_fk, user_fk, body, created_at) VALUES 
(1, 2, 3, 'Ned, this date is wrong! It wasn not built in 1995.', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Comment on Revision 3 (The current one)
INSERT INTO comment (story_fk, revision_fk, user_fk, body, created_at) VALUES 
(1, 3, 4, 'Sorry! My mistake. Thanks for fixing.', NOW());

-- ==========================================================
-- 6. DISPUTES
-- ==========================================================

-- Someone reported NewbieNed's incorrect revision (Rev 2) for Accuracy
INSERT INTO dispute (
    target_type, target_id, contextRevision_fk, category, reason, 
    currentStatus, reporter_fk, created_at
) VALUES (
    'revision', 
    2, -- Reporting Revision ID 2 
    2, -- Context was also Revision 2
    'accuracy', 
    'The date 1995 is obviously false vandalism.', 
    'resolved', 
    3, -- HistoryBuff reported it
    DATE_SUB(NOW(), INTERVAL 2 DAY)
);

-- ==========================================================
-- 7. AUDIT LOG
-- ==========================================================

INSERT INTO audit_log (actor_fk, action, target_type, target_id, target_name, reason, timestamp) VALUES 
(2, 'story.revert', 'story', 1, 'grand-ducal-palace', 'Reverting vandalism by user NewbieNed', NOW());