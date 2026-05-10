-- ══════════════════════════════════════════════
-- RESIN AURA — Full Community Setup
-- Run this ONCE in Supabase SQL Editor
-- ══════════════════════════════════════════════

-- 1. Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
  id             BIGSERIAL PRIMARY KEY,
  author_email   TEXT NOT NULL,
  author_name    TEXT,
  author_avatar  TEXT,
  text           TEXT,
  image          TEXT,
  video          TEXT,
  is_official    BOOLEAN DEFAULT false,
  likes          INTEGER DEFAULT 0,
  shares         INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read posts"   ON community_posts;
DROP POLICY IF EXISTS "Public insert posts" ON community_posts;
DROP POLICY IF EXISTS "Public delete posts" ON community_posts;
DROP POLICY IF EXISTS "Public update posts" ON community_posts;
CREATE POLICY "Public read posts"   ON community_posts FOR SELECT USING (true);
CREATE POLICY "Public insert posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete posts" ON community_posts FOR DELETE USING (true);
CREATE POLICY "Public update posts" ON community_posts FOR UPDATE USING (true);

-- 2. Community Comments
CREATE TABLE IF NOT EXISTS community_comments (
  id            BIGSERIAL PRIMARY KEY,
  post_id       BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_email  TEXT NOT NULL,
  author_name   TEXT,
  author_avatar TEXT,
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read comments"   ON community_comments;
DROP POLICY IF EXISTS "Public insert comments" ON community_comments;
DROP POLICY IF EXISTS "Public delete comments" ON community_comments;
CREATE POLICY "Public read comments"   ON community_comments FOR SELECT USING (true);
CREATE POLICY "Public insert comments" ON community_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete comments" ON community_comments FOR DELETE USING (true);

-- 3. Community Stories
CREATE TABLE IF NOT EXISTS community_stories (
  id            BIGSERIAL PRIMARY KEY,
  author_email  TEXT NOT NULL,
  author_name   TEXT,
  author_avatar TEXT,
  type          TEXT DEFAULT 'photo',
  image         TEXT,
  text          TEXT,
  bg_idx        INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON community_stories(expires_at);
ALTER TABLE community_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public story read"   ON community_stories;
DROP POLICY IF EXISTS "Public story insert" ON community_stories;
DROP POLICY IF EXISTS "Public story delete" ON community_stories;
CREATE POLICY "Public story read"   ON community_stories FOR SELECT USING (true);
CREATE POLICY "Public story insert" ON community_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public story delete" ON community_stories FOR DELETE USING (true);

-- 4. Media Library
CREATE TABLE IF NOT EXISTS community_media (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('image','video','audio')),
  url         TEXT NOT NULL,
  size        BIGINT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE community_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public media read"   ON community_media;
DROP POLICY IF EXISTS "Public media insert" ON community_media;
DROP POLICY IF EXISTS "Public media delete" ON community_media;
CREATE POLICY "Public media read"   ON community_media FOR SELECT USING (true);
CREATE POLICY "Public media insert" ON community_media FOR INSERT WITH CHECK (true);
CREATE POLICY "Public media delete" ON community_media FOR DELETE USING (true);

-- ✅ Done! All 4 tables created successfully.
