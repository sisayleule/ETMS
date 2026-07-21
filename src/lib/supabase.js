// import the supabase client creator function from the installed library
import { createClient } from '@supabase/supabase-js' // Import createClient function to establish connection

// Read raw environment variables provided by the project configuration
const rawUrl = import.meta.env.VITE_SUPABASE_URL // Read Supabase URL from environment variables
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY // Read Supabase anon public key from environment variables

// Validate if the loaded URL is a valid HTTP or HTTPS address and is not a default placeholder
const isValidUrl = rawUrl && 
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) && 
  !rawUrl.includes('your_supabase_project_url_here') // Check for valid scheme and non-placeholder content

// Validate if the loaded anon public key is of sufficient length and is not a default placeholder
const isValidKey = rawKey && 
  rawKey.length > 20 && 
  !rawKey.includes('your_supabase_anon_key_here') // Verify anon key presence and valid formatting

// Export a boolean configuration flag to let visual components render appropriate instructions or alerts
export const isSupabaseConfigured = !!(isValidUrl && isValidKey) // Force boolean representation for external exports (removed isMockSessionActive function - mock mode completely removed from production)

// Define safe fallback configuration parameters to avoid module-load crashes during early setup phases
const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder-project-url.supabase.co' // Use real URL if valid, else fallback
const supabaseAnonKey = isValidKey ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDkyMDc0OTUsImV4cCI6MTkxNDc4MzQ5NX0.placeholder' // Use real key if valid, else fallback JWT

// create and export the supabase client
// this single client instance is imported and used everywhere in the app
// it handles authentication, database queries, storage, and real-time
export const supabase = createClient(supabaseUrl, supabaseAnonKey, { // Initialize and export the Supabase client
  // configure auth settings
  auth: { // Open auth configuration options object
    // store the session in localStorage so user stays logged in after refresh
    persistSession: true, // Maintain persistent user login sessions across page reloads
    // automatically refresh the JWT token before it expires
    autoRefreshToken: true, // Auto-request fresh tokens to keep user session active
    // detect auth state changes like login and logout
    detectSessionInUrl: true, // Check for redirect tokens in the window location URL
  }, // Close auth configuration options object
}) // Close the createClient call and export statement
