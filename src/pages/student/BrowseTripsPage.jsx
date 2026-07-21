// BrowseTripsPage renders the student-facing catalog of active published educational trips
import { useState, useEffect } from 'react' // Import React and standard state/effect hooks
import { useNavigate } from 'react-router-dom' // Import hook to redirect between paths without refreshes
import { fetchPublishedTrips } from '../../lib/registrationService' // Import database service to query active student trips
// Define main BrowseTripsPage functional component for student portals
function BrowseTripsPage() { // Open component definition
  const navigate = useNavigate() // Initialize navigate hook to redirect to trip detail pages
  const [trips, setTrips] = useState([]) // Manage local state containing list of fetched trips
  const [loading, setLoading] = useState(true) // Manage loading state for asynchronous fetch operations
  const [searchText, setSearchText] = useState('') // Manage local state containing student text filters
  const loadTrips = async () => { // Define helper function to query published trips from database
    setLoading(true) // Activate visual page-level loading indicators
    const { trips: data } = await fetchPublishedTrips() // Retrieve all active student-visible trips via registrationService helper
    setTrips(data) // Save retrieved trips list into local state
    setLoading(false) // Turn off visual page-level loading indicators
  } // End of loadTrips helper definition
  useEffect(() => { // Mount hook to trigger database fetching on component mount
    loadTrips() // Execute loading operation once on mount
  }, []) // Empty dependencies array runs effect only once
  const statusColors = { // Map trip status values to specific Tailwind CSS color classes
    Published: 'bg-green-500/20 text-green-400 border border-green-500/30', // Styling values for Published trip status
    Ongoing: 'bg-cyan-main/20 text-cyan-main border border-cyan-main/30', // Styling values for Ongoing trip status
    Completed: 'bg-gold/20 text-gold border border-gold/30', // Styling values for Completed trip status
  } // End of status color mapping
  const filteredTrips = trips.filter((trip) => { // Filter the master list array dynamically based on search text input
    const search = searchText.toLowerCase() // Lowercase user search query to enable case-insensitive searching
    return ( // Return boolean evaluation checking if search text matches title or destination
      trip.title.toLowerCase().includes(search) || // Match against lowercase trip title string
      trip.destination.toLowerCase().includes(search) // Match against lowercase trip destination string
    ) // End of return statement
  }) // End of filteredTrips list construction
  return ( // Render main browser catalog page view layout
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10 text-[#1E3A5F]"> {/* Blue gradient background with dark blue text */}
      <div className="max-w-6xl mx-auto"> {/* Center catalog panel layout with responsive margins */}
        <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Browse Trips</h1> {/* Primary catalog header title in dark blue */}
        <p className="text-[#4A5F7F] font-sans text-sm mb-6">Discover educational trips available for registration</p> {/* Context catalog subtitle in medium blue */}
        <input // Interactive search query textbox
          type="text" // Set input text type
          value={searchText} // Connect search text state
          onChange={(e) => setSearchText(e.target.value)} // Update search query on key updates
          placeholder="Search by trip title or destination..." // Search field guidance placeholder
          className="w-full max-w-md bg-white border-2 border-[#C5D5FF] rounded-lg px-4 py-3 text-[#1E3A5F] font-sans text-sm placeholder-[#7A8FAF] focus:outline-none focus:border-[#8CA5FF] focus:ring-2 focus:ring-[#8CA5FF]/20 mb-8" // Blue-themed search input styles
        /> {/* Close input element */}
        {loading ? ( // Check if asynchronous loading operation is active
          <div className="py-12 text-center"> {/* Centered layout container */}
            <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse">Loading Trips...</p> {/* Pulsing blue loader */}
          </div> // Close visual loading wrapper
        ) : filteredTrips.length === 0 ? ( // Check if matched filtered list contains zero items
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-[#C5D5FF] max-w-md shadow-md"> {/* Styled empty search card with blue theme */}
            <p className="text-[#6B7F9F] font-sans text-sm italic">No trips found. Check back later for new opportunities.</p> {/* Empty results descriptive text */}
          </div> // Close empty search card
        ) : ( // Render interactive grid listing cards if results exist
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive bento grid wrapper */}
            {filteredTrips.map((trip) => ( // Loop through each item in filteredTrips array
              <div // Interactive trip visual card container
                key={trip.id} // Set unique trip record database key
                onClick={() => navigate(`/student/trips/${trip.id}`)} // Redirect user to specific trip detail page on click
                className="bg-bg-secondary rounded-2xl p-6 border border-white/5 hover:border-gold/30 cursor-pointer transition-all hover:scale-[1.01]" // Visual list item card layout styling
              > {/* Open card tag */}
                <span className={`inline-block text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-4 ${statusColors[trip.status]}`}> {/* Badge wrapper */}
                  {trip.status} {/* Active status string */}
                </span> {/* Close status badge */}
                <h3 className="font-serif text-white text-xl font-bold mb-1.5 line-clamp-1">{trip.title}</h3> {/* Output trip title */}
                <p className="text-white/50 font-sans text-sm mb-4">📍 {trip.destination}</p> {/* Output destination */}
                <div className="space-y-2 pt-2 border-t border-white/5 text-white/40 font-sans text-xs"> {/* Details list section */}
                  <div className="flex justify-between"> {/* Schedule row wrapper */}
                    <span>Schedule</span> {/* Info label */}
                    <span className="text-white/70">{trip.start_date} → {trip.end_date}</span> {/* Value output */}
                  </div> {/* Close schedule row */}
                  <div className="flex justify-between"> {/* Spots tracking row wrapper */}
                    <span>Availability</span> {/* Info label */}
                    <span className={`font-semibold ${trip.spots_remaining === 0 ? 'text-red-400' : 'text-white/70'}`}> {/* Styled text color if capacity is reached */}
                      {trip.spots_remaining === 0 // Check if all seats are taken
                        ? 'Fully booked' // Text indicator if slots are zero
                        : `${trip.spots_remaining} of ${trip.capacity} spots remaining`} {/* Spots remaining text feedback */}
                    </span> {/* Close styled span */}
                  </div> {/* Close spots row */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-white/5 mt-1.5"> {/* Costs display row wrapper */}
                    <span>Cost per Student</span> {/* Info label */}
                    <span className="text-gold font-bold text-sm">{trip.cost_per_student} {trip.currency}</span> {/* Price label output */}
                  </div> {/* Close costs row */}
                </div> {/* Close details wrap */}
              </div> // Close individual trip card
            ))} {/* Close map loop */}
          </div> // Close grid container
        )} {/* End of list presence check */}
      </div> {/* Close center catalog wrap */}
    </div> // Close parent canvas
  ) // End of primary return statement
} // End of BrowseTripsPage component definition
export default BrowseTripsPage // Export BrowseTripsPage component as default
