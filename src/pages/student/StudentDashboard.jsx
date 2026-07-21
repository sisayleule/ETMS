// =====================================================================================================================
// STUDENT DASHBOARD PAGE PLACEHOLDER
// Serves as the primary landing dashboard for logged-in users with the 'student' role.
// =====================================================================================================================
import { useAuth } from '../../context/AuthContext' // Import the useAuth custom context hook to display logged-in profile details
import { Link } from 'react-router-dom' // Import Link component for route navigation without page refresh
import NotificationBell from '../../components/NotificationBell' // Import NotificationBell navigation component for live notifications updates

function StudentDashboard() { // Define the StudentDashboard functional component
  const { profile, signOut } = useAuth() // Extract active student profile data and signOut function from auth context

  return ( // Render the visual dashboard layout for student portal users
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex flex-col items-center justify-center p-6 text-center relative pt-20"> {/* Centered layout with blue gradient and top padding for header */}
      {/* Top navigation header bar */}
      <div className="absolute top-0 left-0 right-0 h-16 border-b-2 border-[#C5D5FF] px-6 flex items-center justify-between bg-white/90 backdrop-blur z-30 shadow-sm"> {/* Flex row container positioned at top with blue theme */}
        <span className="font-serif text-[#8CA5FF] text-sm font-semibold uppercase tracking-wider">Ambo University — ETMS</span> {/* Left institution title display in blue */}
        <div className="flex items-center gap-4"> {/* Right container grouping notifications and quick logout triggers */}
          <NotificationBell /> {/* Render notifications badge bell component */}
        </div> {/* Close right flex container */}
      </div> {/* Close header bar element */}
      <h1 className="font-serif text-[#1E3A5F] text-5xl font-bold mb-4"> {/* Display heading with elegant font styling in dark blue */}
        Student Dashboard {/* Dashboard header title */}
      </h1> {/* Close heading element */}
      <p className="font-sans text-[#8CA5FF] text-lg mb-2"> {/* Highlight text displaying active student's full name in blue */}
        Welcome, {profile?.full_name || 'Student'}! {/* Dynamic greeting using student's name */}
      </p> {/* Close greeting text element */}
      <p className="font-sans text-[#5A6F8F] text-sm max-w-md mb-8"> {/* Secondary label for the student portal identity */}
        Ambo University Woliso Campus — Department of Tourism and Hotel Management {/* Standard institution credentials subtitle */}
      </p> {/* Close subtitle paragraph */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap"> {/* Group action buttons side-by-side on larger displays with wrapping */}
        <Link // Create navigation link to browse trips catalog page
          to="/student/trips" // Target path
          className="px-6 py-3 bg-amber-500 text-black font-sans text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-amber-400 transition-all text-center" // Styled primary gold action button
        > {/* Open link tag */}
          Browse Trips {/* Text label */}
        </Link> {/* Close link tag */}
        <Link // Create navigation link to student's registered trips log
          to="/student/my-trips" // Target path
          className="px-6 py-3 bg-indigo-main text-white font-sans text-xs font-bold tracking-widest uppercase rounded-lg hover:opacity-90 transition-all text-center" // Styled primary branding action button
        > {/* Open link tag */}
          My Trips {/* Text label */}
        </Link> {/* Close link tag */}
        <Link // Create navigation link to student's complaints submissions
          to="/student/complaints" // Target complaints page path
          className="px-6 py-3 bg-purple-500 text-white font-sans text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-purple-400 transition-all text-center" // Styled purple action button
        > {/* Open link tag */}
          Complaints {/* Text label */}
        </Link> {/* Close link tag */}
        <Link // Create navigation link to profile page
          to="/student/profile" // Target path
          className="px-6 py-3 bg-white/10 border border-white/20 text-white font-sans text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-white/20 transition-all text-center" // Styled secondary outlined button
        > {/* Open link tag */}
          My Profile {/* Text label */}
        </Link> {/* Close link tag */}
        <Link // Create navigation link to full notifications center page
          to="/student/notifications" // Target path
          className="px-6 py-3 bg-cyan-main text-charcoal font-sans text-xs font-bold tracking-widest uppercase rounded-lg hover:opacity-90 transition-all text-center" // Styled action button
        > {/* Open link tag */}
          Notifications {/* Text label */}
        </Link> {/* Close link tag */}
        <button // Create a sign out button for students to log out of their session
          onClick={signOut} // Assign the signOut auth context function to trigger on button click
          className="px-6 py-3 bg-red-500/20 border border-red-500/40 text-red-400 font-sans text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-red-500/30 transition-all text-center" // Styled red alert action button
        > {/* Open button tag */}
          Sign Out of Portal {/* Active label for button action */}
        </button> {/* Close button element */}
      </div> {/* Close buttons row element */}
    </div> // Close parent container div
  ) // Close return statement
} // Close StudentDashboard functional component block

export default StudentDashboard // Export StudentDashboard component as default for route registration
