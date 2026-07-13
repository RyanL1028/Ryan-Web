-- =============================================================================
-- Japan 2026 Blog — Supabase Database Schema
-- =============================================================================
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/_/sql/new

-- =============================================================================
-- TABLES
-- =============================================================================

-- Blog posts
CREATE TABLE IF NOT EXISTS jp26_posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day         INTEGER NOT NULL CHECK (day BETWEEN 1 AND 15),
  date        DATE NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  location    TEXT NOT NULL DEFAULT '',
  content     JSONB DEFAULT '{}',          -- Quill Delta JSON (for re-editing)
  content_html TEXT DEFAULT '',            -- Rendered HTML (for display)
  cover_image TEXT DEFAULT '',             -- Cover image URL
  images      TEXT[] DEFAULT '{}',         -- Array of photo URLs
  videos      TEXT[] DEFAULT '{}',         -- Array of video URLs
  author      TEXT NOT NULL DEFAULT '',    -- Ryan | Mom | Dad
  author_uid  UUID DEFAULT NULL,           -- Supabase auth.uid()
  is_public   BOOLEAN DEFAULT true,        -- Public vs family-only
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Comments
CREATE TABLE IF NOT EXISTS jp26_comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     UUID NOT NULL REFERENCES jp26_posts(id) ON DELETE CASCADE,
  author      TEXT NOT NULL DEFAULT '',
  author_uid  UUID DEFAULT NULL,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_day ON jp26_posts(day);
CREATE INDEX IF NOT EXISTS idx_posts_public ON jp26_posts(is_public);
CREATE INDEX IF NOT EXISTS idx_comments_post ON jp26_comments(post_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE jp26_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jp26_comments ENABLE ROW LEVEL SECURITY;

-- Posts: anyone can read
CREATE POLICY "Anyone can read posts" ON jp26_posts
  FOR SELECT USING (true);

-- Posts: only authenticated users can insert
CREATE POLICY "Authenticated users can insert posts" ON jp26_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Posts: only authenticated users can update
CREATE POLICY "Authenticated users can update posts" ON jp26_posts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Posts: only authenticated users can delete
CREATE POLICY "Authenticated users can delete posts" ON jp26_posts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Comments: anyone can read
CREATE POLICY "Anyone can read comments" ON jp26_comments
  FOR SELECT USING (true);

-- Comments: only authenticated users can insert
CREATE POLICY "Authenticated users can insert comments" ON jp26_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comments: only original author can delete (by uid)
CREATE POLICY "Author can delete own comments" ON jp26_comments
  FOR DELETE USING (auth.uid() = author_uid);

-- =============================================================================
-- STORAGE BUCKET (run after creating bucket "jp26" in Supabase dashboard)
-- =============================================================================
-- 1. Create a public bucket named "jp26" in the Storage dashboard
-- 2. Then run these policies:

-- Allow public read access to all files in jp26 bucket
-- CREATE POLICY "Public read access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'jp26');

-- Allow authenticated users to upload to jp26 bucket
-- CREATE POLICY "Authenticated users can upload" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'jp26'
--     AND auth.role() = 'authenticated'
--     AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'avif', 'mp4', 'mov', 'webm'))
--   );

-- Allow authenticated users to delete their uploads
-- CREATE POLICY "Authenticated users can delete" ON storage.objects
--   FOR DELETE USING (bucket_id = 'jp26' AND auth.role() = 'authenticated');
