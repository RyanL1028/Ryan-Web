# Ryan's Bio Site

Personal website for Ryan Leung, hosted on Firebase at [ryan-bio.web.app](https://ryan-bio.web.app).

## Structure

```
public/
├── index.html          # Main bio site (Home, Achievements, Performances)
├── styles.css          # Main styles
├── script.js           # Main SPA router
├── sitemap.xml         # SEO sitemap
└── jp26/               # Japan 2026 Travel Blog
    ├── index.html      # Blog shell (Supabase backend)
    ├── styles.css      # Blog styles
    ├── supabase-init.js # Supabase client
    └── blog.js         # Blog app (calendar, posts, uploads, comments)
```

## Japan 2026 Blog

A 15-day trip blog covering Kyushu & Kansai. Features:
- **Public view** (`/jp26/`) — curated highlights without family photos
- **Family view** (`/jp26/leungfamily/`) — password-protected, full content
- **Add/Edit form** (`/jp26/leungfamily/add/`) — rich text editor, image/video uploads

### Backend
Uses **Supabase** (free tier) for database, storage, and authentication.

### Setup
1. Copy `supabase-schema.sql` into Supabase SQL Editor
2. Create `jp26` storage bucket (public)
3. Enable Anonymous Auth in Supabase
4. Update `supabase-init.js` with your Supabase URL + anon key

## Deploy

```bash
firebase deploy
```
