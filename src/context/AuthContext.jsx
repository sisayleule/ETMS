// =====================================================================================================================
// AUTHENTICATION STATE CONTEXT PROVIDER
// This file manages the overall authentication state for the entire ETMS application using Supabase Auth.
// It exposes helper states and methods to securely retrieve user profiles, roles, and handle sessions.
// =====================================================================================================================
import { createContext, useContext, useState, useEffect } from 'react' // Import essential React hooks for context and state management
import { supabase, isSupabaseConfigured } from '../lib/supabase' // Import client instance and configuration status indicator

const AuthContext = createContext({}) // Create the global Authentication context to share session variables with children

export function AuthProvider({ children }) { // Define the AuthProvider component to wrap the application and inject auth context
  const [user, setUser] = useState(null) // Define user state to hold the current Supabase auth user metadata, defaulting to null
  const [profile, setProfile] = useState(null) // Define profile state to hold user profiles table data, defaulting to null
  const [loading, setLoading] = useState(true) // Define loading state to defer rendering of routes until initial session check finishes

  const fetchProfile = async (userId) => { // Define an asynchronous helper function to query profiles row for a given user ID
    try { // Wrap database query in a try-catch block to handle network and server failures gracefully
      const { data, error } = await supabase // Perform a Select query on the profiles table using the Supabase client
        .from('profiles') // Reference the profiles database table
        .select('*') // Select all columns from the matching user profile row
        .eq('id', userId) // Filter rows where the id column matches the specified userId parameter
        .maybeSingle() // Use maybeSingle() instead of single() to gracefully handle missing profile rows (returns null instead of 406 error)

      if (error) { // Check if the select query returned an error from Supabase backend
        console.error('Error fetching profile:', error.message) // Log the specific error message to the console for developers
        return null // Return null on database errors to prevent system crashes
      } // Close the conditional statement checking database errors
      
      if (!data) { // Check if no profile row was found for this user (orphaned auth account)
        console.warn(`No profile found for user ${userId}. This may be an incomplete registration.`) // Log warning about missing profile
        return null // Return null to allow app to handle missing profile gracefully
      } // Close the conditional statement checking for missing profile
      
      // Check if the account is banned using NEW account_status column for proper enforcement
      if (data.account_status === 'banned') { // Check if NEW account_status column is set to 'banned'
        console.warn(`User ${userId} is banned. Access will be restricted.`) // Log warning about banned account
      } // Close banned account check
      
      return data // Return the successfully retrieved user profile record object
    } catch (err) { // Catch unexpected code exceptions or network connection errors
      console.error('Unexpected profile error:', err) // Log the unexpected error to the console for tracking
      return null // Return null on unexpected exceptions to ensure safety
    } // Close the try-catch block
  } // Close the fetchProfile helper function definition

  useEffect(() => { // Mount useEffect hook to run initial authentication and listen to state changes on component load
    const initializeAuth = async () => { // Define an inner async function to check for existing storage session on startup
      try { // Wrap the initial session retrieval in a try-catch block for resilience
        const { data: { session } } = await supabase.auth.getSession() // Request active user session metadata from Supabase Auth storage
        if (session?.user) { // Check if a valid user session object was successfully returned from storage
          setUser(session.user) // Store the Supabase user session object inside the local user state
          const profileData = await fetchProfile(session.user.id) // Query profiles table for the logged-in user's custom details
          setProfile(profileData) // Store the custom profile data inside the local profile state
        } // Close the conditional statement checking user session presence
      } catch (err) { // Catch any unexpected exceptions thrown during auth initialization
        console.error('Auth initialization error:', err) // Log the session initialization error to the console
      } finally { // Ensure the loading state is disabled regardless of lookup success or failure
        setLoading(false) // Stop showing the loading screen since the initial check has completed
      } // Close the try-catch-finally block
    } // Close the initializeAuth function definition

    initializeAuth() // Execute the auth initialization logic to detect persistent sessions immediately

    const { data: { subscription } } = supabase.auth.onAuthStateChange( // Register a real-time listener for Auth state changes
      async (event, session) => { // Define the callback function triggered on sign-in, sign-out, or token refresh
        if (event === 'SIGNED_IN' && session?.user) { // Check if the triggered auth event indicates a successful login action
          setUser(session.user) // Update the user state with the newly authenticated Supabase user object
          const profileData = await fetchProfile(session.user.id) // Fetch custom profile data matching the newly signed-in user
          setProfile(profileData) // Update the profile state with the fetched custom user profile metadata
        } // Close signed-in check block

        if (event === 'SIGNED_OUT') { // Check if the triggered auth event indicates a sign-out action
          setUser(null) // Reset the user state to null to clear any stale session reference
          setProfile(null) // Reset the profile state to null to clear details of the logged-out user
        } // Close signed-out check block
      } // Close auth state change event handler callback
    ) // Close subscription callback registration

    return () => { // Define the cleanup function returned by the useEffect hook
      subscription.unsubscribe() // Unsubscribe from the onAuthStateChange listener to prevent memory leaks on unmount
    } // Close cleanup function definition block
  }, []) // Close useEffect hook with an empty dependency array to run only on initial component mount

  const signOut = async () => { // Define the signOut function to terminate the current user session
    await supabase.auth.signOut() // Request Supabase Auth to destroy the active user session token
    setUser(null) // Explicitly clear the user state in React to reflect logout status
    setProfile(null) // Explicitly clear the profile state in React to reflect logout status
  } // Close signOut function block

  const refreshProfile = async () => { // Define refreshProfile function to re-fetch custom user profile data on demand
    if (user?.id) { // Ensure there is an active authenticated user ID before querying the database
      const profileData = await fetchProfile(user.id) // Query the profiles table for fresh user metadata
      setProfile({ ...profileData }) // Force new object reference to trigger re-renders
    } // Close user ID validation block
  } // Close refreshProfile function definition

  const value = { // Construct the shared values object containing authentication properties and methods
    user, // Expose the core Supabase Auth user session object
    profile, // Expose custom fields like full_name, role, and student_id_number from database
    loading, // Expose loading state flag to let screens render appropriate placeholders
    signOut, // Expose signOut function to let navigation elements trigger logout
    refreshProfile, // Expose profile refresh helper to update context after profile changes
    isSupabaseConfigured, // Expose configuration state to warn the user if keys are placeholders
    isAuthenticated: !!user, // Expose boolean helper indicating if a user is currently logged in
    isStudent: profile?.role === 'student', // Expose boolean helper indicating if the logged-in user is a student
    isDeptHead: profile?.role === 'departmentHead', // Expose boolean helper indicating if the logged-in user is department head
    isBanned: profile?.account_status === 'banned', // Expose NEW boolean helper indicating if the logged-in user's account is banned using account_status column
  } // Close the value object definition

  return ( // Render the JSX provider layout with the authentication values injected
    <AuthContext.Provider value={value}> {/* Inject the authentication context provider with the defined values */}
      {children} {/* Render all child components nested within this AuthProvider element */}
    </AuthContext.Provider> // Close the context provider element
  ) // Close the return statement
} // Close the AuthProvider function component block

export function useAuth() { // Define and export the custom useAuth hook for easy access across other pages
  return useContext(AuthContext) // Return the context value of AuthContext using React's useContext hook
} // Close the useAuth function block
