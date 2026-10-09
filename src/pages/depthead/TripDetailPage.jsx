// Import React hooks for state management and side effects
import { useState, useEffect } from 'react' // Import useState and useEffect from React
// Import routing hooks for navigation and URL parameters
import { useParams, useNavigate } from 'react-router-dom' // Import useParams to read tripId from URL and useNavigate for navigation
// Import trip detail service functions for fetching data and sending announcements
import { // Begin import from trip detail service
  fetchTripDetail, // Import function to fetch trip information
  fetchTripRegistrations, // Import function to fetch all registrations for this trip
  fetchStudentFullInfo, // Import function to fetch health and emergency contact data for a student
  sendUrgentAnnouncement, // Import function to broadcast urgent notification to approved students
} from '../../lib/depthead/tripDetailService' // Import from department head trip detail service file

// TripDetailPage component displays full trip info and student roster for department head
function TripDetailPage() { // Define main TripDetailPage component function
  const { tripId: paramTripId } = useParams() // Extract tripId from URL parameters using React Router hook
  const tripId = paramTripId // Store tripId in local variable for consistency
  const navigate = useNavigate() // Get navigate function for programmatic navigation
  
  // State for trip data and registrations
  const [trip, setTrip] = useState(null) // State to store trip information object
  const [registrations, setRegistrations] = useState([]) // State to store array of registrations with student profiles
  const [loading, setLoading] = useState(true) // State to track initial data loading status
  const [error, setError] = useState(null) // State to store error messages
  
  // State for student detail modal
  const [viewingStudentId, setViewingStudentId] = useState(null) // State to track which student's full info is being viewed
  const [studentFullInfo, setStudentFullInfo] = useState(null) // State to store fetched health and emergency contact data
  const [loadingStudentInfo, setLoadingStudentInfo] = useState(false) // State to track student info loading status
  
  // State for urgent announcement section
  const [announcementMessage, setAnnouncementMessage] = useState('') // State to store announcement text input
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false) // State to track announcement sending status
  const [showConfirmDialog, setShowConfirmDialog] = useState(false) // State to control confirmation dialog visibility
  const [announcementSuccess, setAnnouncementSuccess] = useState(null) // State to store success message after sending
  
  // Maximum character limit for announcement
  const MAX_ANNOUNCEMENT_LENGTH = 300 // Constant defining character limit for announcements

  // Load trip and registrations on component mount
  useEffect(() => { // Define effect to run on mount and when tripId changes
    loadTripData() // Call function to load all trip data
  }, [tripId]) // Re-run effect when tripId changes

  // loadTripData fetches trip details and registrations in parallel
  async function loadTripData() { // Define async function to load trip data
    setLoading(true) // Set loading state to true at start
    setError(null) // Clear any previous errors

    // Fetch trip and registrations in parallel using Promise.all for performance
    const [tripResult, registrationsResult] = await Promise.all([ // Execute both queries simultaneously
      fetchTripDetail(tripId), // Fetch trip information
      fetchTripRegistrations(tripId), // Fetch registrations with student profiles
    ]) // Close Promise.all array

    // Check for errors in trip fetch
    if (tripResult.error || !tripResult.trip) { // If error fetching trip or trip not found
      setError('Failed to load trip details.') // Set error message
      setLoading(false) // Stop loading
      return // Exit function
    } // End error check

    // Check for errors in registrations fetch - but allow page to load with empty registrations
    if (registrationsResult.error) { // If error fetching registrations
      console.error('Registrations error:', registrationsResult.error) // Log error to console for debugging
      setError('Note: Could not load student registrations. Trip details shown below.') // Set warning message but continue
      setRegistrations([]) // Set empty registrations array
    } else { // No error in registrations
      setRegistrations(registrationsResult.registrations) // Set registrations state with fetched data
    } // End registrations error check

    setTrip(tripResult.trip) // Set trip state with fetched data
    setLoading(false) // Stop loading
  } // End loadTripData function

  // handleViewStudentInfo opens modal and fetches full student info
  async function handleViewStudentInfo(studentId) { // Define async function accepting studentId parameter
    setViewingStudentId(studentId) // Set viewing student ID to show modal
    setLoadingStudentInfo(true) // Set loading state for student info
    setStudentFullInfo(null) // Clear previous student info

    // Fetch health and emergency contact data for this student
    const { healthInfo, emergencyContact, error: fetchError } = await fetchStudentFullInfo(studentId) // Call service function

    if (fetchError) { // If error fetching student info
      setError('Failed to load student information.') // Set error message
      setLoadingStudentInfo(false) // Stop loading student info
      return // Exit function
    } // End error check

    setStudentFullInfo({ healthInfo, emergencyContact }) // Set student full info state
    setLoadingStudentInfo(false) // Stop loading student info
  } // End handleViewStudentInfo function

  // handleCloseStudentModal closes the student detail modal
  function handleCloseStudentModal() { // Define function to close modal
    setViewingStudentId(null) // Clear viewing student ID
    setStudentFullInfo(null) // Clear student info data
  } // End handleCloseStudentModal function

  // handleSendAnnouncement shows confirmation dialog
  function handleSendAnnouncement() { // Define function to initiate announcement sending
    if (!announcementMessage.trim()) { // If message is empty or whitespace
      setError('Please enter an announcement message.') // Set error message
      return // Exit function
    } // End validation check

    if (announcementMessage.length > MAX_ANNOUNCEMENT_LENGTH) { // If message exceeds limit
      setError(`Announcement must be ${MAX_ANNOUNCEMENT_LENGTH} characters or less.`) // Set error message
      return // Exit function
    } // End length check

    setShowConfirmDialog(true) // Show confirmation dialog
    setError(null) // Clear any errors
  } // End handleSendAnnouncement function

  // handleConfirmSend sends the urgent announcement after confirmation
  async function handleConfirmSend() { // Define async function to send announcement
    setShowConfirmDialog(false) // Hide confirmation dialog
    setSendingAnnouncement(true) // Set sending state to true
    setError(null) // Clear any errors
    setAnnouncementSuccess(null) // Clear previous success messages

    // Call service function to send announcement to all approved students
    const { error: sendError, sentCount } = await sendUrgentAnnouncement( // Call service function
      tripId, // Pass trip ID
      trip.title, // Pass trip title for notification
      announcementMessage.trim(), // Pass trimmed message text
    ) // End function call

    if (sendError) { // If error sending announcement
      setError(sendError.message || 'Failed to send announcement.') // Set error message from service or default
      setSendingAnnouncement(false) // Stop sending state
      return // Exit function
    } // End error check

    // Success - show success message and clear input
    setAnnouncementSuccess(`Announcement sent to ${sentCount} student${sentCount === 1 ? '' : 's'}!`) // Set success message with count
    setAnnouncementMessage('') // Clear announcement input
    setSendingAnnouncement(false) // Stop sending state

    // Clear success message after 5 seconds
    setTimeout(() => setAnnouncementSuccess(null), 5000) // Clear success message after delay
  } // End handleConfirmSend function

  // Helper function to get status badge colors matching established conventions
  function getStatusBadgeColor(status) { // Define function accepting status parameter
    const colors = { // Define colors mapping object
      Pending: 'bg-amber-50 text-amber-700 border-amber-200', // Pending status color
      Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200', // Approved status color
      Rejected: 'bg-red-50 text-red-700 border-red-200', // Rejected status color
      Draft: 'bg-amber-50 text-amber-700 border-amber-200', // Draft status color
      Published: 'bg-emerald-50 text-emerald-700 border-emerald-200', // Published status color
      Ongoing: 'bg-blue-50 text-blue-700 border-blue-200', // Ongoing status color
      Completed: 'bg-purple-50 text-purple-700 border-purple-200', // Completed status color
    } // End colors mapping
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200' // Return color or default gray
  } // End getStatusBadgeColor function

  // Loading state UI
  if (loading) { // If data is loading
    return ( // Return loading UI
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-8"> {/* Main container with gradient background */}
        <div className="max-w-7xl mx-auto"> {/* Centered content container */}
          <div className="text-center py-12"> {/* Centered text container */}
            <div className="w-16 h-16 border-4 border-[#8CA5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div> {/* Loading spinner matching design system */}
            <p className="text-[#6B7F9F] font-sans text-sm font-medium">Loading trip details...</p> {/* Loading text */}
          </div> {/* End centered container */}
        </div> {/* End content container */}
      </div> // End main container
    ) // End return
  } // End loading check

  // Error state UI
  if (!trip) { // If trip not found after loading
    return ( // Return error UI
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-8"> {/* Main container */}
        <div className="max-w-7xl mx-auto"> {/* Centered content */}
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-[#E5EDFF] shadow-sm"> {/* Error card */}
            <div className="w-24 h-24 rounded-full bg-[#F0F4FF] flex items-center justify-center mx-auto mb-6"> {/* Icon container */}
              <span className="text-5xl">❌</span> {/* Error emoji */}
            </div> {/* End icon container */}
            <h3 className="font-serif text-[#1E3A5F] text-2xl font-bold mb-3">Trip Not Found</h3> {/* Error title */}
            <p className="text-[#6B7F9F] font-sans text-sm mb-6">The requested trip could not be found.</p> {/* Error message */}
            <button // Back button
              onClick={() => navigate('/depthead/trips')} // Navigate back to trips list
              className="px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300" // Button styling
            >
              Back to Trips {/* Button text */}
            </button> {/* End back button */}
          </div> {/* End error card */}
        </div> {/* End content */}
      </div> // End main container
    ) // End return
  } // End trip not found check

  // Main UI
  return ( // Return main component UI
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-8"> {/* Main container with gradient background matching design system */}
      <div className="max-w-7xl mx-auto"> {/* Centered content container with max width */}
        
        {/* Header with back button */}
        <div className="mb-8 flex items-center justify-between"> {/* Header section with flex layout for space between */}
          <div className="flex items-center gap-4"> {/* Left side with back button and title */}
            <button // Back button
              onClick={() => navigate('/depthead/trips')} // Navigate to trips list page
              className="p-3 bg-white text-[#1E3A5F] rounded-xl border-2 border-[#E5EDFF] hover:border-[#8CA5FF] hover:bg-[#F8FAFF] transition-all duration-200 shadow-sm" // Button styling
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* Back arrow icon SVG */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /> {/* Arrow path */}
              </svg> {/* End icon */}
            </button> {/* End back button */}
            <div> {/* Title container */}
              <h1 className="font-serif text-[#1E3A5F] text-4xl font-bold mb-2 leading-tight">Trip Details</h1> {/* Page title */}
              <p className="text-[#6B7F9F] font-sans text-base leading-relaxed">Complete trip information and student roster</p> {/* Page description */}
            </div> {/* End title container */}
          </div> {/* End left side */}
          
          {/* Edit Trip Button */}
          <button // Edit trip button
            onClick={() => navigate(`/depthead/trips/${tripId}/edit`)} // Navigate to edit form
            className="px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2" // Button styling matching design system
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* Edit icon SVG */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> {/* Edit pencil path */}
            </svg> {/* End icon */}
            Edit Trip {/* Button text */}
          </button> {/* End edit button */}
        </div> {/* End header section */}

        {/* Error Message */}
        {error && ( // If error exists
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl font-sans text-sm"> {/* Error alert box */}
            {error} {/* Display error message */}
          </div> // End error box
        )} {/* End error conditional */}

        {/* Success Message */}
        {announcementSuccess && ( // If success message exists
          <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-2xl font-sans text-sm"> {/* Success alert box */}
            {announcementSuccess} {/* Display success message */}
          </div> // End success box
        )} {/* End success conditional */}

        {/* Trip Information Card */}
        <div className="bg-white rounded-2xl p-8 border-2 border-[#E5EDFF] shadow-sm mb-6"> {/* Trip info card container */}
          <div className="flex items-start justify-between mb-6"> {/* Header row with flex layout */}
            <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold">{trip.title}</h2> {/* Trip title */}
            <span className={`px-4 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider border-2 ${getStatusBadgeColor(trip.status)}`}> {/* Status badge with dynamic colors */}
              {trip.status} {/* Status text */}
            </span> {/* End status badge */}
          </div> {/* End header row */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Grid layout for trip details */}
            <div className="flex items-center gap-3"> {/* Destination row */}
              <span className="text-2xl">📍</span> {/* Location emoji */}
              <div> {/* Text container */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Destination</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">{trip.destination}</p> {/* Destination value */}
              </div> {/* End text container */}
            </div> {/* End destination row */}

            <div className="flex items-center gap-3"> {/* Schedule row */}
              <span className="text-2xl">📅</span> {/* Calendar emoji */}
              <div> {/* Text container */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Schedule</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">{trip.start_date} → {trip.end_date}</p> {/* Date range */}
              </div> {/* End text container */}
            </div> {/* End schedule row */}

            <div className="flex items-start gap-3"> {/* Cost row — changed items-center to items-start so emoji aligns to top when breakdown list expands the height */}
              <span className="text-2xl mt-0.5">💰</span> {/* Money emoji — small top offset to align with first line of expanded text block */}
              <div className="flex-1"> {/* Text container — flex-1 so breakdown list fills available width */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Cost per Student</p> {/* Label */}
                <p className="text-[#D4AF37] font-sans text-lg font-bold mb-3">{trip.cost_per_student} {trip.currency}</p> {/* Cost value with currency — added mb-3 spacing before breakdown */}
                {/* Cost Breakdown list — six categories matching the updated DB schema (entrance_fee replaces insurance) */}
                {(() => { // IIFE to compute breakdown rows without polluting component scope
                  const bd = trip.cost_breakdown || {} // Read stored breakdown or empty fallback if null
                  const rows = [ // Define the six ordered display rows
                    { label: 'Transport',     value: parseFloat(bd.transport)     || 0 }, // Transport row — default 0 if key missing
                    { label: 'Accommodation', value: parseFloat(bd.accommodation) || 0 }, // Accommodation row — default 0 if key missing
                    { label: 'Food',          value: parseFloat(bd.food)          || 0 }, // Food row — default 0 if key missing
                    { label: 'Activities',    value: parseFloat(bd.activities)    || 0 }, // Activities row — default 0 if key missing
                    { label: 'Entrance Fee',  value: parseFloat(bd.entrance_fee)  || 0 }, // Entrance Fee row — replaces Insurance; defaults 0 for old rows
                    { label: 'Other',         value: parseFloat(bd.other)         || 0 }, // Other row — default 0 if key missing
                  ] // End rows array
                  const breakdownSum = rows.reduce((s, r) => s + r.value, 0) // Sum the six values to check consistency
                  const storedTotal = parseFloat(trip.cost_per_student) || 0 // Authoritative stored total for comparison
                  const mismatch = Math.abs(breakdownSum - storedTotal) > 0.01 // Flag mismatch if difference exceeds rounding tolerance
                  return ( // Return rendered breakdown list
                    <div className="space-y-1.5 text-xs font-sans border-t border-[#E5EDFF] pt-2"> {/* Stack rows with top divider matching card style */}
                      {rows.map((row) => ( // Loop through the six display rows
                        <div // Individual category row wrapper
                          key={row.label} // Unique key per label
                          className="flex justify-between items-center" // Side-by-side layout
                        > {/* Open row div */}
                          <span className={`uppercase tracking-wider ${row.value === 0 ? 'text-[#B0BFD0]' : 'text-[#8B9FB5]'}`}> {/* Muted for zero rows */}
                            {row.label} {/* Category label */}
                          </span> {/* Close label */}
                          <span className={`font-medium ${row.value === 0 ? 'text-[#B0BFD0]' : 'text-[#1E3A5F]'}`}> {/* Muted for zero amounts */}
                            {row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {trip.currency} {/* Formatted value with trip currency */}
                          </span> {/* Close value */}
                        </div> // Close row
                      ))} {/* End loop */}
                      <div className="flex justify-between items-center pt-1.5 border-t border-[#E5EDFF] font-semibold text-[#1E3A5F]"> {/* Total row with divider */}
                        <span className="uppercase tracking-wider text-[#8B9FB5]">Total</span> {/* Total label */}
                        <span className="text-[#D4AF37]"> {/* Gold color matching the cost_per_student display above */}
                          {storedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {trip.currency} {/* Authoritative total — consistent with header value */}
                        </span> {/* Close total value */}
                      </div> {/* Close total row */}
                      {mismatch && ( // Render mismatch note only when itemised sum differs from cost_per_student
                        <p className="text-[#B0BFD0] text-[10px] italic pt-1"> {/* Muted small mismatch notice */}
                          Itemized amounts may not add up to the total. {/* Inform of data inconsistency without hiding either number */}
                        </p> // Close mismatch note
                      )} {/* End mismatch check */}
                    </div> // Close breakdown list
                  ) // End return
                })()} {/* End IIFE */}
              </div> {/* End text container */}
            </div> {/* End cost row */}

            <div className="flex items-center gap-3"> {/* Capacity row */}
              <span className="text-2xl">👥</span> {/* People emoji */}
              <div> {/* Text container */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Capacity</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold"> {/* Capacity text */}
                  <span className="text-[#22C55E]">{trip.spots_remaining}</span> / {trip.capacity} spots remaining {/* Remaining spots with green color */}
                </p> {/* End capacity text */}
              </div> {/* End text container */}
            </div> {/* End capacity row */}
          </div> {/* End grid layout */}
        </div> {/* End trip info card */}

        {/* Student Roster Section */}
        <div className="bg-white rounded-2xl border-2 border-[#E5EDFF] shadow-sm mb-6 overflow-hidden"> {/* Student roster card */}
          <div className="px-8 py-6 border-b-2 border-[#F0F4FF]"> {/* Card header */}
            <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold">Student Roster ({registrations.length})</h2> {/* Section title with count */}
          </div> {/* End card header */}

          {registrations.length === 0 ? ( // If no registrations exist
            <div className="text-center py-16 text-[#6B7F9F]"> {/* Empty state container */}
              <span className="text-6xl mb-4 block">👥</span> {/* Empty state emoji */}
              <p className="font-sans text-base">No students have registered for this trip yet.</p> {/* Empty state message */}
            </div> // End empty state
          ) : ( // Else if registrations exist
            <div className="divide-y-2 divide-[#F0F4FF]"> {/* Container for student rows with dividers */}
              {registrations.map((registration) => { // Map over registrations array
                const student = registration.profiles // Extract student profile from registration
                return ( // Return student row
                  <div key={registration.id} className="p-6 hover:bg-[#F8FAFF] transition-colors"> {/* Student row with hover effect */}
                    <div className="flex items-center justify-between"> {/* Flex container for student info */}
                      <div className="flex items-center gap-4 flex-1"> {/* Student info section */}
                        {student?.profile_photo ? ( // If student has profile photo
                          <img // Profile photo image
                            src={student.profile_photo} // Image source
                            alt={student.full_name} // Alt text
                            className="h-14 w-14 rounded-full object-cover border-2 border-[#E5EDFF]" // Image styling
                          /> // End image
                        ) : ( // Else if no photo
                          <div className="h-14 w-14 rounded-full bg-[#F0F4FF] flex items-center justify-center text-[#8CA5FF] font-sans font-bold text-xl border-2 border-[#E5EDFF]"> {/* Avatar placeholder */}
                            {student?.full_name?.charAt(0) || '?'} {/* First letter or question mark */}
                          </div> // End placeholder
                        )} {/* End photo conditional */}

                        <div className="flex-1"> {/* Text info container */}
                          <h3 className="font-sans text-[#1E3A5F] text-base font-semibold mb-1">{student?.full_name || 'Unknown Student'}</h3> {/* Student name */}
                          <p className="text-[#8B9FB5] font-sans text-sm">ID: {student?.student_id_number || 'N/A'}</p> {/* Student ID number */}
                          <div className="flex items-center gap-4 mt-2"> {/* Additional info row */}
                            <span className="text-[#6B7F9F] font-sans text-xs">📞 {student?.phone_number || 'N/A'}</span> {/* Phone number */}
                            <span className="text-[#6B7F9F] font-sans text-xs">📚 Year {student?.year_of_study || 'N/A'}</span> {/* Year of study */}
                          </div> {/* End additional info */}
                        </div> {/* End text container */}
                      </div> {/* End student info */}

                      <div className="flex items-center gap-4"> {/* Actions section */}
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider border-2 ${getStatusBadgeColor(registration.status)}`}> {/* Registration status badge */}
                          {registration.status} {/* Status text */}
                        </span> {/* End status badge */}
                        <button // View Full Info button
                          onClick={() => handleViewStudentInfo(registration.student_id)} // Handle click to view student info
                          className="px-4 py-2 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-semibold hover:shadow-lg transition-all duration-200" // Button styling
                        >
                          View Full Info {/* Button text */}
                        </button> {/* End button */}
                      </div> {/* End actions section */}
                    </div> {/* End flex container */}
                  </div> // End student row
                ) // End return
              })} {/* End map */}
            </div> // End registrations container
          )} {/* End registrations check */}
        </div> {/* End student roster card */}

        {/* Urgent Announcement Section */}
        <div className="bg-white rounded-2xl p-8 border-2 border-[#E5EDFF] shadow-sm"> {/* Announcement card */}
          <div className="flex items-center gap-3 mb-4"> {/* Header with icon */}
            <span className="text-3xl">🚨</span> {/* Siren emoji */}
            <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold">Urgent Announcement</h2> {/* Section title */}
          </div> {/* End header */}
          
          <p className="text-[#6B7F9F] font-sans text-sm mb-4 leading-relaxed"> {/* Description text */}
            Send an urgent notification to all approved students on this trip. This will appear as a high-priority emergency notification. {/* Description content */}
          </p> {/* End description */}

          <div className="mb-4"> {/* Textarea container */}
            <textarea // Message input textarea
              value={announcementMessage} // Bind to announcement message state
              onChange={(e) => setAnnouncementMessage(e.target.value)} // Update state on change
              maxLength={MAX_ANNOUNCEMENT_LENGTH} // Set max length attribute
              rows={4} // Set textarea height
              placeholder="e.g. Departure time moved to 6:00 AM tomorrow" // Placeholder text
              className="w-full px-4 py-3 border-2 border-[#E5EDFF] rounded-xl focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF] font-sans text-sm transition-all duration-200" // Textarea styling
              disabled={sendingAnnouncement} // Disable while sending
            /> {/* End textarea */}
            <div className="flex items-center justify-between mt-2"> {/* Character counter row */}
              <p className="text-[#8B9FB5] font-sans text-xs">Maximum {MAX_ANNOUNCEMENT_LENGTH} characters</p> {/* Max length label */}
              <p className={`font-sans text-xs font-semibold ${ // Character count with dynamic color
                announcementMessage.length > MAX_ANNOUNCEMENT_LENGTH // If over limit
                  ? 'text-red-600' // Red color for over limit
                  : announcementMessage.length > MAX_ANNOUNCEMENT_LENGTH * 0.9 // If approaching limit (90%+)
                  ? 'text-amber-600' // Amber color for warning
                  : 'text-[#8B9FB5]' // Default gray color
              }`}> {/* Dynamic color class */}
                {announcementMessage.length} / {MAX_ANNOUNCEMENT_LENGTH} {/* Current count / max count */}
              </p> {/* End character count */}
            </div> {/* End counter row */}
          </div> {/* End textarea container */}

          <button // Send button
            onClick={handleSendAnnouncement} // Handle send announcement click
            disabled={!announcementMessage.trim() || sendingAnnouncement || announcementMessage.length > MAX_ANNOUNCEMENT_LENGTH} // Disable if empty, sending, or over limit
            className="px-6 py-3 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white rounded-xl font-sans text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300" // Button styling with red gradient for urgency
          >
            {sendingAnnouncement ? 'Sending...' : 'Send to All Approved Students'} {/* Button text with loading state */}
          </button> {/* End send button */}
        </div> {/* End announcement card */}

        {/* Student Detail Modal */}
        {viewingStudentId && ( // If viewing a student
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"> {/* Translucent dark backdrop with blur — dims and softens page content behind modal while keeping it visibly present, with scroll support */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8"> {/* Modal container */}
              {/* Modal Header */}
              <div className="px-8 py-6 border-b-2 border-[#F0F4FF] flex items-center justify-between"> {/* Modal header */}
                <h3 className="font-serif text-[#1E3A5F] text-2xl font-bold">Student Full Information</h3> {/* Modal title */}
                <button // Close button
                  onClick={handleCloseStudentModal} // Handle close modal
                  className="p-2 text-[#6B7F9F] hover:text-[#1E3A5F] hover:bg-[#F0F4FF] rounded-xl transition-all duration-200" // Button styling
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* Close X icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> {/* X path */}
                  </svg> {/* End icon */}
                </button> {/* End close button */}
              </div> {/* End modal header */}

              {/* Modal Body */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto"> {/* Modal body with scroll */}
                {loadingStudentInfo ? ( // If loading student info
                  <div className="text-center py-12"> {/* Loading container */}
                    <div className="w-12 h-12 border-4 border-[#8CA5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div> {/* Loading spinner */}
                    <p className="text-[#6B7F9F] font-sans text-sm">Loading student information...</p> {/* Loading text */}
                  </div> // End loading container
                ) : ( // Else if loaded
                  <div className="space-y-6"> {/* Content container with spacing */}
                    {/* Profile Information */}
                    {(() => { // Immediately invoked function to find student profile
                      const registration = registrations.find(r => r.student_id === viewingStudentId) // Find registration for this student
                      const student = registration?.profiles // Extract profile from registration
                      return student ? ( // If student profile exists
                        <div className="bg-[#F8FAFF] rounded-xl p-6 border-2 border-[#E5EDFF]"> {/* Profile card */}
                          <h4 className="font-serif text-[#1E3A5F] text-lg font-bold mb-4">Profile</h4> {/* Section title */}
                          <div className="flex items-center gap-4 mb-4"> {/* Profile row */}
                            {student.profile_photo ? ( // If has photo
                              <img src={student.profile_photo} alt={student.full_name} className="h-16 w-16 rounded-full object-cover border-2 border-[#E5EDFF]" /> // Profile photo
                            ) : ( // Else no photo
                              <div className="h-16 w-16 rounded-full bg-[#F0F4FF] flex items-center justify-center text-[#8CA5FF] font-sans font-bold text-2xl border-2 border-[#E5EDFF]"> {/* Avatar placeholder */}
                                {student.full_name?.charAt(0) || '?'} {/* First letter */}
                              </div> // End placeholder
                            )} {/* End photo conditional */}
                            <div> {/* Text info */}
                              <p className="font-sans text-[#1E3A5F] text-base font-semibold">{student.full_name}</p> {/* Name */}
                              <p className="text-[#8B9FB5] font-sans text-sm">ID: {student.student_id_number}</p> {/* Student ID */}
                            </div> {/* End text info */}
                          </div> {/* End profile row */}
                          <div className="grid grid-cols-2 gap-4"> {/* Grid for contact info */}
                            <div> {/* Phone field */}
                              <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Phone</p> {/* Label */}
                              <p className="text-[#1E3A5F] font-sans text-sm font-medium">{student.phone_number || 'N/A'}</p> {/* Value */}
                            </div> {/* End phone */}
                            <div> {/* Year field */}
                              <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Year of Study</p> {/* Label */}
                              <p className="text-[#1E3A5F] font-sans text-sm font-medium">{student.year_of_study || 'N/A'}</p> {/* Value */}
                            </div> {/* End year */}
                          </div> {/* End grid */}
                        </div> // End profile card
                      ) : null // Don't render if no student
                    })()} {/* End IIFE */}

                    {/* Health Information */}
                    <div className="bg-[#F8FAFF] rounded-xl p-6 border-2 border-[#E5EDFF]"> {/* Health info card */}
                      <h4 className="font-serif text-[#1E3A5F] text-lg font-bold mb-4">Health Information</h4> {/* Section title */}
                      {studentFullInfo?.healthInfo ? ( // If health info exists
                        <div className="space-y-3"> {/* Fields container */}
                          <div> {/* Blood type field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Blood Type</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.healthInfo.blood_type || 'N/A'}</p> {/* Value */}
                          </div> {/* End blood type */}
                          <div> {/* Allergies field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Allergies</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.healthInfo.allergies || 'None'}</p> {/* Value */}
                          </div> {/* End allergies */}
                          <div> {/* Medications field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Current Medications</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.healthInfo.medications || 'None'}</p> {/* Value */}
                          </div> {/* End medications */}
                          <div> {/* Medical conditions field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Medical Conditions</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.healthInfo.medical_conditions || 'None'}</p> {/* Value */}
                          </div> {/* End medical conditions */}
                          <div> {/* Emergency notes field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Emergency Medical Notes</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.healthInfo.emergency_notes || 'None'}</p> {/* Value */}
                          </div> {/* End emergency notes */}
                        </div> // End fields container
                      ) : ( // Else if no health info
                        <p className="text-[#8B9FB5] font-sans text-sm italic">Not yet submitted</p> // Not submitted message
                      )} {/* End health info conditional */}
                    </div> {/* End health info card */}

                    {/* Emergency Contact */}
                    <div className="bg-[#F8FAFF] rounded-xl p-6 border-2 border-[#E5EDFF]"> {/* Emergency contact card */}
                      <h4 className="font-serif text-[#1E3A5F] text-lg font-bold mb-4">Emergency Contact</h4> {/* Section title */}
                      {studentFullInfo?.emergencyContact ? ( // If emergency contact exists
                        <div className="space-y-3"> {/* Fields container */}
                          <div> {/* Name field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Name</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.emergencyContact.name || 'N/A'}</p> {/* Value */}
                          </div> {/* End name */}
                          <div> {/* Relationship field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Relationship</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.emergencyContact.relationship || 'N/A'}</p> {/* Value */}
                          </div> {/* End relationship */}
                          <div> {/* Phone field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Phone Number</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.emergencyContact.phone_number || 'N/A'}</p> {/* Value */}
                          </div> {/* End phone */}
                          <div> {/* Alternative phone field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Alternative Phone</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.emergencyContact.alternative_phone || 'N/A'}</p> {/* Value */}
                          </div> {/* End alternative phone */}
                          <div> {/* Address field */}
                            <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider mb-1">Address</p> {/* Label */}
                            <p className="text-[#1E3A5F] font-sans text-sm font-medium">{studentFullInfo.emergencyContact.address || 'N/A'}</p> {/* Value */}
                          </div> {/* End address */}
                        </div> // End fields container
                      ) : ( // Else if no emergency contact
                        <p className="text-[#8B9FB5] font-sans text-sm italic">Not yet submitted</p> // Not submitted message
                      )} {/* End emergency contact conditional */}
                    </div> {/* End emergency contact card */}
                  </div> // End content container
                )} {/* End loading conditional */}
              </div> {/* End modal body */}

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t-2 border-[#F0F4FF] flex justify-end"> {/* Modal footer */}
                <button // Close button
                  onClick={handleCloseStudentModal} // Handle close modal
                  className="px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300" // Button styling
                >
                  Close {/* Button text */}
                </button> {/* End close button */}
              </div> {/* End modal footer */}
            </div> {/* End modal container */}
          </div> // End modal overlay
        )} {/* End student modal conditional */}

        {/* Confirmation Dialog for Sending Announcement */}
        {showConfirmDialog && ( // If showing confirmation dialog
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"> {/* Translucent dark backdrop with blur — dims and softens page content behind modal while keeping it visibly present */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"> {/* Dialog container */}
              <div className="text-center mb-6"> {/* Icon and title section */}
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"> {/* Icon container with red background */}
                  <span className="text-4xl">⚠️</span> {/* Warning emoji */}
                </div> {/* End icon container */}
                <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-2">Send Urgent Announcement?</h3> {/* Dialog title */}
                <p className="text-[#6B7F9F] font-sans text-sm leading-relaxed"> {/* Dialog message */}
                  This will immediately notify all approved students on this trip. This action cannot be undone. {/* Warning message */}
                </p> {/* End message */}
              </div> {/* End icon and title section */}

              <div className="flex gap-3"> {/* Buttons container */}
                <button // Cancel button
                  onClick={() => setShowConfirmDialog(false)} // Close dialog
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-sans text-sm font-semibold hover:bg-gray-300 transition-colors" // Button styling
                >
                  Cancel {/* Button text */}
                </button> {/* End cancel button */}
                <button // Confirm button
                  onClick={handleConfirmSend} // Proceed with sending
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white rounded-xl font-sans text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300" // Button styling with red gradient
                >
                  Send Now {/* Button text */}
                </button> {/* End confirm button */}
              </div> {/* End buttons container */}
            </div> {/* End dialog container */}
          </div> // End dialog overlay
        )} {/* End confirmation dialog conditional */}

      </div> {/* End content container */}
    </div> // End main container
  ) // End return
} // End TripDetailPage component

export default TripDetailPage // Export component as default
