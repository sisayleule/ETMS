// StudentSidebar is the persistent left navigation for all student pages
// highlights the active link based on the current route
// collapses behind a hamburger toggle on mobile screens
import { Link, useLocation } from 'react-router-dom' // Import routing links and active location hooks
import { useState, useEffect } from 'react' // Import hooks for state management and side effects
import { LogoDark } from './Logo' // Import logo component for branding
import { useAuth } from '../context/AuthContext' // Import authentication context

// nav items array makes it easy to add or reorder links in one place
const NAV_ITEMS = [ // Define constant list array containing sidebar navigational node configurations
  { label: 'Dashboard', path: '/student/dashboard', icon: '🏠' }, // Home landing dashboard view node
  { label: 'Browse Trips', path: '/student/trips', icon: '🧭' }, // Trip list browsing catalog node
  { label: 'My Profile', path: '/student/profile', icon: '👤' }, // Student profile details management node
  { label: 'Complaints', path: '/student/complaints', icon: '⚠️' }, // Support portal and complaints node
  { label: 'Notifications', path: '/student/notifications', icon: '🔔' }, // Detailed notifications history list node
  { label: 'Trip Journal', path: '/student/journal', icon: '📔' }, // Private trip journal diary and reflections node
  { label: 'My Reports', path: '/student/my-reports', icon: '📝' }, // Trip reports submission and tracking node
  { label: 'Settings', path: '/student/settings', icon: '⚙️' }, // Student settings and preferences management node
] // End navigation configuration lists array

// Define StudentSidebar functional navigation component
function StudentSidebar() { // Begin StudentSidebar definition
  // get the current route to determine which link is active
  const location = useLocation() // Instantiate location hook to retrieve active path metadata
  const { profile } = useAuth() // Get authenticated user profile data
  
  // controls whether the mobile sidebar drawer is open
  const [mobileOpen, setMobileOpen] = useState(false) // Manage mobile drawers open status boolean state
  
  // Local state to force re-render when profile changes
  const [profilePhoto, setProfilePhoto] = useState(null)
  
  // Update local profile photo state when context profile changes
  useEffect(() => {
    setProfilePhoto(profile?.profile_photo || null)
  }, [profile, profile?.profile_photo]) // Re-run when profile or profile_photo changes

  // isActive checks if a nav item's path matches the current route
  const isActive = (path) => location.pathname === path // Return equality comparison with active route string

  // Get user initials for avatar
  const getInitials = () => {
    if (!profile?.full_name) return '?'
    const names = profile.full_name.split(' ')
    if (names.length >= 2) {
      return names[0].charAt(0) + names[names.length - 1].charAt(0)
    }
    return names[0].charAt(0)
  }

  return ( // Begin JSX layout return
    <> {/* Open empty container fragment */}
      {/* mobile hamburger toggle, only visible below md breakpoint */}
      <button // Sidebar toggle button control
        onClick={() => setMobileOpen(true)} // Set open state to true on click
        className="md:hidden fixed top-4 left-4 z-40 bg-white border-2 border-[#8CA5FF] rounded-lg p-2 text-[#8CA5FF] hover:bg-[#F5F8FF] transition-all cursor-pointer shadow-md" // Styled mobile button wrapper with blue theme
        aria-label="Open menu" // Accessiblity description string
      > {/* Toggle button contents */}
        ☰ {/* Hamburger triple-bar icon symbol */}
      </button> {/* Close hamburger button */}

      {/* mobile overlay backdrop, closes the drawer when clicked */}
      {mobileOpen && ( // Render overlay drawer backdrop layer when open is true
        <div // Backdrop backdrop click target
          onClick={() => setMobileOpen(false)} // Set open state to false when backdrop is selected
          className="md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm" // Styled background overlays
        /> // Close overlay division
      )} {/* Close conditional backdrop check */}

      {/* sidebar itself: fixed on desktop, sliding drawer on mobile with blue gradient */}
      <aside // Left navigation aside container wrapper
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#7090E5] to-[#5875C9] border-r-2 border-[#8CA5FF] z-50 transition-transform duration-200 md:translate-x-0 shadow-2xl flex flex-col ${ // Base structural sidebar styles with blue gradient
          mobileOpen ? 'translate-x-0' : '-translate-x-full' // Slide layout in or out based on toggled states
        }`} // End dynamic class templates
      > {/* Sidebar contents section */}
        {/* sidebar header with logo and app name */}
        <div className="p-6 border-b-2 border-white/20 flex-shrink-0"> {/* Sized brand header container */}
          <LogoDark size="md" /> {/* Ambo University Logo */}
          <p className="text-white/80 font-sans text-xs uppercase tracking-widest mt-2">Student Portal</p> {/* Portal subtitle */}
        </div> {/* Close brand header container */}

        {/* Compact User Profile Section */}
        <div className="px-4 py-3 border-b-2 border-white/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Profile Photo - Compact */}
            {profilePhoto ? (
              <img 
                key={profilePhoto} 
                src={profilePhoto} 
                alt={profile?.full_name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-[#8CA5FF] shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8CA5FF] to-[#5875C9] flex items-center justify-center text-white text-lg font-bold border-2 border-[#8CA5FF] shadow-md flex-shrink-0">
                {getInitials()}
              </div>
            )}
            {/* User Name */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm leading-tight truncate">{profile?.full_name || 'Student'}</h3>
            </div>
          </div>
        </div>

        {/* nav links list - scrollable */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1"> {/* Vertical slot list link navigation menu with scroll */}
          {NAV_ITEMS.map((item) => ( // Loop through constant nav items configuration array list
            <Link // Interactive client-side router navigation link
              key={item.path} // Unique key matching target path URL
              to={item.path} // Set target destination path
              onClick={() => setMobileOpen(false)} // Auto collapse drawer on route click (mobile help)
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm transition-all duration-200 ${ // Base sidebar item style templates
                isActive(item.path) // If active route matches link target
                  ? 'bg-white text-[#5875C9] font-bold shadow-lg scale-105 border-l-4 border-[#8CA5FF]' // High contrast white highlight card styling
                  : 'text-white/80 hover:bg-white/10 hover:text-white hover:scale-102 hover:shadow-md' // Else fallback to light text with hover effect
              }`} // End dynamic class style templates
            > {/* Open navigation menu item */}
              <span className="text-xl leading-none">{item.icon}</span> {/* Unicode visual category icon symbol */}
              <span className="font-sans text-xs font-semibold uppercase tracking-wider">{item.label}</span> {/* Visual description link title */}
            </Link> // Close interactive router link
          ))} {/* Close nav items array loop mapping */}
        </nav> {/* Close navigation menu container list */}
      </aside> {/* Close left navigation aside element */}
    </> // Close empty container fragment
  ) // End layout return statement
} // End StudentSidebar functional component block
export default StudentSidebar // Export sidebar component as default
