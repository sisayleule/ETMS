// =====================================================================================================================
// ACCESS DENIED / UNAUTHORIZED ROLE PAGE
// Displayed when an authenticated user attempts to access a route designed for a different system role.
// =====================================================================================================================
import { Link } from 'react-router-dom' // Import Link component from react-router-dom to navigate users back to safety

function Unauthorized() { // Define the Unauthorized screen component to display access forbidden statuses
  return ( // Render the visual error page layout to notify the user
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center"> {/* Full screen layout with centered content */}
      <h1 className="font-serif text-gold text-5xl font-bold mb-4"> {/* High-contrast gold display heading */}
        Access Denied {/* Clear visual error title */}
      </h1> {/* Close heading element */}
      <p className="font-sans text-white/70 text-base max-w-md mb-8 leading-relaxed"> {/* Body description text in soft white */}
        You do not have the necessary role permissions to access this specific portal page. Please verify your account privileges. {/* Descriptive explanation */}
      </p> {/* Close paragraph element */}
      <Link // Create a return link to send users back to the landing page or dashboard
        to="/" // Define target path to the root welcome page
        className="px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-charcoal font-sans text-sm font-semibold tracking-widest uppercase rounded-lg shadow-lg hover:opacity-90 transition-opacity" // Tailwind styling classes
      > {/* Open link tag */}
        Return to Home {/* Navigational text inside link */}
      </Link> {/* Close link tag */}
    </div> // Close parent container div
  ) // Close return statement
} // Close Unauthorized component definition block

export default Unauthorized // Export the Unauthorized component as default for router mapping
