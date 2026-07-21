// StudentLayout wraps all student routes with the sidebar and top bar
// uses React Router's Outlet so nested routes render inside this shell
// this avoids repeating sidebar/topbar markup in every individual page
import { Outlet } from 'react-router-dom' // Import Outlet component to render children route modules
import { useAuth } from '../context/AuthContext' // Import auth custom context hook to display user greetings
import StudentSidebar from '../components/StudentSidebar' // Import the sidebar navigation component
import NotificationBell from '../components/NotificationBell' // Import the notification bell dropdown component from Phase 10
import Logo from '../components/Logo' // Import logo component

// Define StudentLayout wrapper component
function StudentLayout() { // Begin StudentLayout definition
  // get the logged in student's profile for the top bar greeting
  const { profile, signOut } = useAuth() // Extract active profile data and logout callback method

  return ( // Begin JSX layout return
    // outer wrapper, full height with blue gradient background
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] text-[#1E3A5F]"> {/* Page viewport outer layout constraints with blue gradient */}

      {/* sidebar renders itself, handles its own mobile toggle */}
      <StudentSidebar /> {/* Left sidebar menu panels */}

      {/* main content area, offset by sidebar width on desktop */}
      <div className="md:ml-64 flex flex-col min-h-screen"> {/* Main columns shifted right on screen layout */}

        {/* top bar with blue theme */}
        <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b-2 border-[#C5D5FF] bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-sm"> {/* Header container with white background */}
          {/* brand title section with logo */}
          <div className="flex items-center gap-3"> {/* Sizing flex row container */}
            <Logo size="sm" className="hidden md:flex" /> {/* Show logo on desktop */}
            <span className="font-serif text-[#8CA5FF] text-sm font-semibold uppercase tracking-widest">ETMS</span> {/* Application name in blue */}
          </div> {/* Close title wrapper */}

          {/* right controls box */}
          <div className="flex items-center gap-4"> {/* Row grouping profile info, bell and logout links */}
            {/* student name, right aligned before the bell */}
            <span className="text-[#4A5F7F] font-sans text-xs uppercase tracking-wider font-semibold hidden sm:inline"> {/* Blue text typography */}
              Hello, {profile?.full_name || 'Student'} {/* Dynamic user first name greeting */}
            </span> {/* Close student name label */}

            {/* notification bell, reused as-is from Phase 10 */}
            <NotificationBell /> {/* Dynamic notification bell badge and dropdown component */}

            {/* divider separator bar */}
            <span className="w-px h-5 bg-[#C5D5FF] hidden sm:inline" /> {/* Blue vertical divider border line */}

            {/* sign out button */}
            <button // Session logout interactive button control
              onClick={signOut} // Trigger auth signOut method on click
              className="text-[#6B7F9F] font-sans text-xs uppercase tracking-widest hover:text-red-500 transition-colors font-semibold cursor-pointer" // Styled blue text hoverable button
            > {/* Button label text wrapper */}
              Sign Out {/* Logout link label string */}
            </button> {/* Close sign out button control */}
          </div> {/* Close right controls box */}
        </header> {/* Close header container */}

        {/* routed page content renders here */}
        <main className="flex-1"> {/* Flex viewport filler main slot section */}
          <Outlet /> {/* React Router's slot point rendering active matching nested route */}
        </main> {/* Close main slot section */}
      </div> {/* Close main content area columns shift */}
    </div> // End page viewport outer layout constraints
  ) // End layout return statement
} // End StudentLayout component block
export default StudentLayout // Export layout component as default for router configuration imports
