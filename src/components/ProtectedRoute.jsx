// =====================================================================================================================
// PROTECTED ROUTE COMPONENT wrapper
// Guards restricted routes and redirects users to appropriate screens depending on login status and role privileges.
// Props: children (wrapped page elements), allowedRoles (array of allowed roles like ['student'] or ['departmentHead']).
// =====================================================================================================================
import { Navigate } from 'react-router-dom' // Import Navigate component from react-router-dom to execute programmatic redirects
import { useAuth } from '../context/AuthContext' // Import useAuth custom context hook to inspect current session parameters

function ProtectedRoute({ children, allowedRoles }) { // Define the ProtectedRoute component accepting children and allowedRoles as parameters
  const { user, profile, loading, isBanned } = useAuth() // Extract active user session, custom profile, loading state, AND NEW isBanned flag from useAuth

  if (loading) { // Check if the authentication context is still initializing and retrieving user sessions
    return ( // Render an elegant loading overlay if the system is loading user records
      <div className="min-h-screen bg-bg-primary flex items-center justify-center"> {/* Centered container with primary theme background */}
        <p className="text-gold font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Gold animated pulse indicator text */}
          Loading ETMS... {/* Standard system loading message */}
        </p> {/* Close indicator text */}
      </div> // Close container div
    ) // Close return statement
  } // Close loading status condition check

  if (!user) { // Check if the user is unauthenticated or has no active session inside Supabase Auth
    return <Navigate to="/login" replace /> // Redirect the unauthenticated user to the login screen, replacing route history
  } // Close unauthenticated user condition check

  if (!profile) { // Check if the core user session exists but the custom database profile record is still being fetched
    return ( // Render a loading overlay while the custom profile is being retrieved from profiles table
      <div className="min-h-screen bg-bg-primary flex items-center justify-center"> {/* Full screen layout container with dark theme */}
        <p className="text-gold font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Animated pulse text in gold */}
          Loading profile... {/* Standard profile retrieval message */}
        </p> {/* Close loading text */}
      </div> // Close container div
    ) // Close return statement
  } // Close missing profile condition check

  if (allowedRoles && !allowedRoles.includes(profile.role)) { // Validate if current user's role is permitted to view this specific page
    return <Navigate to="/unauthorized" replace /> // Redirect unauthorized users to access-denied route, replacing history stack
  } // Close role authorization validation check

  // ENFORCE BAN - if the logged-in student's account is banned, show suspension screen instead of requested page for every protected route
  if (isBanned && allowedRoles?.includes('student')) { // Check if user is banned AND this route allows students (don't block dept heads)
    return ( // Render full-screen account suspension message instead of the protected page content
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6"> {/* Full screen centered container with light background */}
        <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-lg"> {/* Card container for suspension message */}
          <div className="mb-4"> {/* Icon container */}
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Red warning icon */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> {/* Warning triangle path */}
            </svg> {/* Close warning icon */}
          </div> {/* Close icon container */}
          <h1 className="text-2xl font-bold text-red-600 mb-3">Account Suspended</h1> {/* Main suspension heading */}
          <p className="text-gray-700 text-base mb-2"> {/* Suspension explanation message */}
            Your account has been suspended by the department head. {/* Inform student of suspension */}
          </p> {/* Close explanation */}
          <p className="text-gray-600 text-sm"> {/* Contact instructions */}
            Please contact the department head for assistance. {/* Provide next steps */}
          </p> {/* Close contact instructions */}
          {profile?.ban_reason && ( // Check if a ban reason was provided by the department head
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"> {/* Styled container for ban reason */}
              <p className="text-xs font-semibold text-red-800 mb-1">Reason:</p> {/* Label for reason */}
              <p className="text-sm text-red-700">{profile.ban_reason}</p> {/* Display the actual ban reason from profile */}
            </div> // Close reason container
          )} {/* Close conditional ban reason display */}
        </div> // Close card container
      </div> // Close full screen container
    ) // Close return statement for suspension screen
  } // Close ban enforcement check

  return children // Render the target page component if all authentication, authorization, and ban checks successfully pass
} // Close ProtectedRoute component definition block

export default ProtectedRoute // Export ProtectedRoute component as default to enable modular route registration in App.jsx
