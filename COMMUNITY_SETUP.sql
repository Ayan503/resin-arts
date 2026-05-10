-- ══════════════════════════════════════════════
-- RESIN AURA — Community Feed Tables
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════

-- 1. Community Posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id            BIGSERIAL PRIMARY KEY,
  author_email  TEXT NOT NULL,
  author_name   TEXT,
  author_avatar TEXT,
  text          TEXT,
  image         TEXT,           -- base64 or URL
  likes         INTEGER DEFAULT 0,
  shares        INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Community Comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id            BIGSERIAL PRIMARY KEY,
  post_id       BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_email  TEXT NOT NULL,
  author_name   TEXT,
  author_avatar TEXT,
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);

-- 4. Row Level Security (RLS) — Enable but allow anon access (same as your existing tables)
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public read posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON community_comments FOR SELECT USING (true);

-- Allow insert (authenticated or anon — same as your existing setup)
CREATE POLICY "Public insert posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert comments" ON community_comments FOR INSERT WITH CHECK (true);

-- Allow delete (anyone can delete — admin controls via UI)
CREATE POLICY "Public delete posts" ON community_posts FOR DELETE USING (true);
CREATE POLICY "Public delete comments" ON community_comments FOR DELETE USING (true);

-- Allow update (for likes, shares, comments_count)
CREATE POLICY "Public update posts" ON community_posts FOR UPDATE USING (true);

-- ══════════════════════════════════════════════
-- Done! ✅ Now deploy the updated website files.
-- ══════════════════════════════════════════════
