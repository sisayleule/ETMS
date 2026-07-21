// TripJournalListPage shows all trips the student is registered for and allows navigating to each trip's journal
// Displays trip cards with quick stats and "View Journal" buttons
import { useState, useEffect } from 'react' // Import state hooks and effect hooks from standard react package
import { useNavigate } from 'react-router-dom' // Import navigation helper for routing
import { useAuth } from '../../context/AuthContext' // Import custom auth context to verify identity
import { supabase } from '../../lib/supabase' // Import supabase client for database queries

function TripJournalListPage() { // Begin TripJournalListPage component definition
  // navigate for going to specific trip journals
  const navigate = useNavigate() // Initialize navigation dispatcher helper

  // get the logged in student
  const { user } = useAuth() // Extract student user session object from auth context

  // holds the list of trips the student is registered for
  const [trips, setTrips] = useState([]) // Manage state containing student's registered trips array

  // loading state while fetching
  const [loading, setLoading] = useState(true) // Manage loader state to display spinner animations

  // loadTrips fetches all trips the student is registered for with journal entry counts
  const loadTrips = async () => { // Begin asynchronous loadTrips declaration
    setLoading(true) // Set loader state to true to present loading progress
    
    // Fetch all trips where student has approved registration
    const { data: registrations, error: regError } = await supabase // Query database for student registrations
      .from('registrations') // Target registrations table
      .select('trip_id, trips(id, title, destination, start_date, end_date, status)') // Join with trips table to get trip details
      .eq('student_id', user.id) // Filter by current student ID
      .eq('status', 'Approved') // Only show approved registrations
    
    if (regError) { // Check if database query failed
      console.error('Error fetching registrations:', regError) // Log error to console
      setLoading(false) // Hide loading spinner
      return // Exit early
    } // End error check
    
    // Extract trip data from registrations
    const tripsData = registrations?.map(reg => reg.trips).filter(Boolean) || [] // Map to trips array and filter out null values
    
    // For each trip, count how many journal entries the student has written
    const tripsWithCounts = await Promise.all( // Execute all count queries in parallel
      tripsData.map(async (trip) => { // Loop through each trip
        const { count } = await supabase // Query journal entries count
          .from('journal_entries') // Target journal_entries table
          .select('id', { count: 'exact', head: true }) // Count rows only
          .eq('student_id', user.id) // Filter by current student
          .eq('trip_id', trip.id) // Filter by current trip
        
        return { ...trip, journalCount: count || 0 } // Return trip with journal entry count
      }) // End map function
    ) // End Promise.all
    
    setTrips(tripsWithCounts) // Save trips with counts to state
    setLoading(false) // Set loader state to false to show the main content
  } // End loadTrips function block

  // fetch once on mount
  useEffect(() => { // Begin mount lifecycle effect
    if (user?.id) loadTrips() // Execute load sequence if student user session exists
  }, [user?.id]) // Re-run if student session changes

  // show loading screen while fetching
  if (loading) { // Check if loading state is active
    return ( // Return loader JSX layout
      <div className="min-h-[60vh] flex items-center justify-center"> {/* Centered layout container */}
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Pulse text caption */}
          Loading Your Trips... {/* Informational placeholder string */}
        </p> {/* Close paragraph layout */}
      </div> // Close centering wrapper
    ) // End loader JSX template
  } // End check block

  return ( // Begin main page layout JSX return statement
    // page wrapper
    <div className="p-6 md:p-10 max-w-6xl mx-auto"> {/* Constrained margin layout wrapper */}

      {/* page header */}
      <div className="mb-8"> {/* Spacing header box */}
        <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-2">Trip Journal</h1> {/* Page title banner */}
        <p className="text-[#4A5F7F] font-sans text-sm"> {/* Spacing subtitle section */}
          Your private reflections, memories, and learning experiences from each educational trip {/* Dynamic subtitle description */}
        </p> {/* Close subtitle */}
      </div> {/* Close header box */}

      {/* trips list */}
      {trips.length === 0 ? ( // Conditional render if student has no registered trips
        <div className="bg-white/40 rounded-2xl p-12 border border-[#E5EDFF] text-center max-w-2xl mx-auto"> {/* Nested information card wrapper */}
          <p className="text-[#4A5F7F] font-sans text-base mb-4">You don't have any registered trips yet.</p> {/* Empty description caption */}
          <button // Navigate to browse trips button
            onClick={() => navigate('/student/trips')} // Route to browse trips page on click
            className="bg-gold text-charcoal font-sans text-xs font-semibold uppercase tracking-wide px-5 py-2.5 rounded-lg hover:opacity-90 transition-all duration-300" // Styled button
          > {/* Button label */}
            Browse Available Trips {/* Button text */}
          </button> {/* Close button */}
        </div> // Close nested information card
      ) : ( // Else render trip cards grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive grid layout */}
          {trips.map((trip) => ( // Loop through trips array
            <div // Trip card container
              key={trip.id} // Unique key for React rendering
              className="bg-white rounded-2xl p-5 border border-[#E5EDFF] hover:border-[#C5D5FF] hover:shadow-lg transition-all duration-300" // Styled card with hover effects
            > {/* Card contents */}
              {/* Trip title */}
              <h3 className="text-[#1E3A5F] font-serif text-lg font-bold mb-2 line-clamp-2">{trip.title}</h3> {/* Trip title with line clamping */}
              
              {/* Trip destination */}
              <p className="text-[#4A5F7F] font-sans text-sm mb-3 flex items-center gap-2"> {/* Destination row */}
                <span>📍</span> {/* Location pin icon */}
                {trip.destination} {/* Destination text */}
              </p> {/* Close destination */}
              
              {/* Trip dates */}
              <p className="text-[#6B7F9F] font-sans text-xs mb-3"> {/* Dates row */}
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()} {/* Format dates */}
              </p> {/* Close dates */}
              
              {/* Trip status badge */}
              <div className="mb-4"> {/* Status badge container */}
                <span // Status badge element
                  className={`inline-block px-3 py-1 rounded-full font-sans text-xs font-semibold ${ // Base badge styles
                    trip.status === 'Active' ? 'bg-green-500/20 text-green-700' : // Green for active
                    trip.status === 'Completed' ? 'bg-blue-500/20 text-blue-700' : // Blue for completed
                    'bg-gray-500/20 text-gray-700' // Gray for other statuses
                  }`} // End dynamic classes
                > {/* Badge text */}
                  {trip.status} {/* Display trip status */}
                </span> {/* Close badge */}
              </div> {/* Close badge container */}
              
              {/* Journal entry count */}
              <p className="text-[#8CA5FF] font-sans text-sm mb-4 flex items-center gap-2"> {/* Entry count row */}
                <span>📔</span> {/* Journal icon */}
                {trip.journalCount} {trip.journalCount === 1 ? 'entry' : 'entries'} {/* Display entry count with proper pluralization */}
              </p> {/* Close entry count */}
              
              {/* View journal button */}
              <button // Navigate to trip journal button
                onClick={() => navigate(`/student/trips/${trip.id}/journal`)} // Route to trip-specific journal page on click
                className="w-full bg-[#8CA5FF] text-white font-sans text-xs font-semibold uppercase tracking-wide px-4 py-2.5 rounded-lg hover:bg-[#7090E5] transition-all duration-300" // Styled button with full width
              > {/* Button label */}
                View Journal {/* Button text */}
              </button> {/* Close button */}
            </div> // Close trip card
          ))} {/* Close trips mapping loop */}
        </div> // Close trips grid
      )} {/* Close empty trips conditional rendering checks */}
    </div> // End constrained layout wrapper
  ) // End layout return statement
} // End TripJournalListPage functional component block

export default TripJournalListPage // Export page component as default
