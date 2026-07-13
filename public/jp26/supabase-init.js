// supabase-init.js — Supabase initialization for Japan 2026 Blog
// ================================================================

// TODO: Replace with your Supabase URL and anon key from:
// https://supabase.com/dashboard/project/_/settings/api
var SUPABASE_URL = 'https://ojmelopwdusilfnkufpx.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbWVsb3B3ZHVzaWxmbmt1ZnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5Mzk5NDQsImV4cCI6MjA5OTUxNTk0NH0.Dq3RePVTwH4EpInfFre5_X7vrp0gjWh99xUeboSxeFk';

// Initialize Supabase client
var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export as global for blog.js
window.supabase = supabase;

// Sign in anonymously (gives us a stable anonymous user for RLS policies)
window.supabaseReady = supabase.auth.signInAnonymously()
  .then(function(result) {
    console.log('Supabase ready — signed in anonymously as', result.user.id);
    return true;
  })
  .catch(function(error) {
    console.error('Anonymous auth failed:', error);
    // Still resolve — read-only mode works without auth
    return false;
  });
