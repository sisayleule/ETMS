// ComplaintsPage lets a student submit new complaints and view their own history
// the anonymity toggle controls whether the department head will see their name
// the trip picker only offers trips this student has actually registered for
import { useState, useEffect } from 'react' // Import React hooks to manage page states and triggers
import { useAuth } from '../../context/AuthContext' // Import auth context hooks to retrieve current login profiles
import { fetchMyRegistrations } from '../../lib/registrationService' // Import registration service helper to read student trip registrations
import { submitComplaint, fetchMyComplaints } from '../../lib/complaintService' // Import complaint service helpers for submission and query actions
// fixed category options matching the database check constraint
const CATEGORIES = ['Transport', 'Accommodation', 'Food', 'Safety', 'Other'] // Define constant array list of allowed categories
// fixed severity options matching the database check constraint
const SEVERITIES = ['Low', 'Medium', 'High'] // Define constant array list of allowed severity tiers
// Define main student Complaints Page component
function ComplaintsPage() { // Begin ComplaintsPage functional component definition
  // get the logged in student and their profile for the real display name
  const { user, profile } = useAuth() // Retrieve user and profile information from auth provider
  // holds the trips this student has registered for, used to populate the trip picker
  const [myTrips, setMyTrips] = useState([]) // Initialize state variable for registered trips lists
  // holds the student's own complaint history
  const [complaints, setComplaints] = useState([]) // Initialize state variable for student's own complaints array
  // loading state while fetching initial data
  const [loading, setLoading] = useState(true) // Maintain loading status boolean indicator
  // whether the new complaint form is expanded
  const [showForm, setShowForm] = useState(false) // Track form expansion visibility toggle state
  // FORM FIELDS
  const [selectedTripId, setSelectedTripId] = useState('') // Form field state: selected parent trip identifier
  const [isAnonymous, setIsAnonymous] = useState(false) // Form field state: anonymity toggle status boolean
  const [category, setCategory] = useState(CATEGORIES[0]) // Form field state: selected category enum value
  const [severity, setSeverity] = useState(SEVERITIES[0]) // Form field state: selected severity enum value
  const [title, setTitle] = useState('') // Form field state: typed summary title text
  const [description, setDescription] = useState('') // Form field state: typed detailed description text
  // submitting state while the request is in progress
  const [submitting, setSubmitting] = useState(false) // Track active API submission state locking controls
  // error message for the form
  const [error, setError] = useState('') // Maintain form specific validation error message string
  // status message shown after a successful submission
  const [statusMessage, setStatusMessage] = useState('') // Maintain temporary success status notice description
  // loadData fetches the student's registered trips and their complaint history together
  const loadData = async () => { // Begin loadData helper definition
    setLoading(true) // Activate page loading spinner state
    // fetch every trip this student has registered for, used for the trip picker
    const { registrations } = await fetchMyRegistrations(user.id) // Fetch student's trip registrations
    setMyTrips(registrations.map((r) => r.trips).filter(Boolean)) // Extract trip objects and filter out empty nodes
    // fetch the student's own complaints
    const { complaints: data } = await fetchMyComplaints(user.id) // Fetch student's submitted complaints history
    setComplaints(data) // Save retrieved complaints dataset to state
    setLoading(false) // Deactivate page loading spinner state
  } // End loadData helper function
  // fetch once when the page mounts
  useEffect(() => { // Begin useEffect lifecycle trigger
    if (user?.id) loadData() // Trigger load actions if student ID is ready
  }, [user]) // Bind effect dependencies to user updates
  // resetForm clears all form fields back to defaults
  const resetForm = () => { // Begin resetForm definition
    setSelectedTripId('') // Clear selected trip ID input
    setIsAnonymous(false) // Reset anonymity toggle state to false
    setCategory(CATEGORIES[0]) // Reset selected category enum to first index
    setSeverity(SEVERITIES[0]) // Reset selected severity enum to first index
    setTitle('') // Clear title text string state
    setDescription('') // Clear description text string state
    setError('') // Reset any active error notice banners
  } // End resetForm helper function
  // handleSubmit validates and submits the new complaint
  const handleSubmit = async () => { // Begin handleSubmit definition
    setError('') // Clear any active form error banners
    // validate a trip was selected
    if (!selectedTripId) { // Verify trip selector has a chosen value
      setError('Please select which trip this complaint relates to.') // Display missing trip error message
      return // Halt execution
    } // End trip selection validation check block
    // validate title is present and within the 100 character limit
    if (!title.trim()) { // Verify title text is present
      setError('Please enter a title for your complaint.') // Display missing title error message
      return // Halt execution
    } // End missing title check block
    if (title.trim().length > 100) { // Verify title is within character count limit
      setError('Title must be 100 characters or fewer.') // Display title length warning message
      return // Halt execution
    } // End title length check block
    // validate description meets the minimum length
    if (description.trim().length < 20) { // Verify description is at least 20 characters
      setError('Description must be at least 20 characters long.') // Display description length error message
      return // Halt execution
    } // End description length check block
    setSubmitting(true) // Lock form interactions during submission API call
    // compute the display name based on the anonymity toggle
    // this is the ONLY place identity is decided, matching Phase 1's design intent
    const displayName = isAnonymous ? 'Anonymous Student' : profile?.full_name || 'Student' // Set computed display label
    // call the submit service
    const { complaint, error: submitError } = await submitComplaint( // Trigger database insert service
      user.id, // Current authenticated student user ID
      selectedTripId, // Selected parent trip ID
      isAnonymous, // Anonymity boolean toggle state
      displayName, // Calculated display name string
      category, // Selected category enum string
      severity, // Selected severity enum string
      title.trim(), // Formatted title header string
      description.trim() // Formatted description text body
    ) // End submitComplaint transaction call
    setSubmitting(false) // Unlock form interactions
    if (submitError) { // Check if backend returned database transaction errors
      setError('Could not submit complaint. Please try again.') // Highlight error notice banner
      return // Halt execution
    } // End of error validation check block
    // add the new complaint to the top of the local list
    setComplaints([{ ...complaint, trips: myTrips.find((t) => t.id === selectedTripId) }, ...complaints]) // Update list state
    resetForm() // Clean up form input fields
    setShowForm(false) // Collapse input form panel
    setStatusMessage('Complaint submitted successfully.') // Set success message
    setTimeout(() => setStatusMessage(''), 3000) // Automatically fade success message after three seconds
  } // End handleSubmit function
  // statusColors for the complaint status badge
  const statusColors = { // Setup statusColors mapping dictionary
    Pending: 'bg-yellow-500/20 text-yellow-400', // Yellow badge styles for active pending complaint status
    'In Progress': 'bg-cyan-main/20 text-cyan-main', // Cyan badge styles for active in progress status
    Resolved: 'bg-green-500/20 text-green-400', // Green badge styles for completed resolved status
  } // End statusColors definition
  // severityColors for the severity badge
  const severityColors = { // Setup severityColors mapping dictionary
    Low: 'bg-white/10 text-white/60', // Soft neutral styles for low level severity
    Medium: 'bg-orange-500/20 text-orange-400', // Orange warning styles for medium level severity
    High: 'bg-red-500/20 text-red-400', // Red critical alert styles for high level severity
  } // End severityColors definition
  // show loading screen while fetching
  if (loading) { // Check loading status boolean
    return ( // Return full screen loader JSX
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center"> {/* Centered layout container wrapper with blue gradient */}
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Blue uppercase style */}
          Loading Complaints... {/* Loading placeholder label string */}
        </p> {/* Close loader label */}
      </div> // Close loader wrapper
    ) // End loading loader return block
  } // End loading validation check block
  return ( // Begin main layout JSX return
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Page viewport container wrapper with blue gradient */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4"> {/* Top header flex row container */}
        <div> {/* Left section labels block */}
          <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">My Complaints</h1> {/* Primary screen title heading in dark blue */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Medium blue text description styling */}
            Submit a complaint about a trip, with the option to stay anonymous {/* Subtitle helper instructions */}
          </p> {/* End subtitle paragraph */}
        </div> {/* Close labels section wrapper */}
        {!showForm && ( // Render new complaint action button if input form is collapsed
          <button // Create new complaint button trigger
            onClick={() => setShowForm(true)} // Expand the input form panel on click
            className="bg-gradient-to-r from-indigo-main to-purple-600 text-white font-sans text-sm font-semibold uppercase tracking-wide px-5 py-3 rounded-lg hover:opacity-90 transition-all" // Action button styles
          > {/* Button label wrapper */}
            + New Complaint {/* Action button title */}
          </button> // Close button tag
        )} {/* Close conditional check */}
      </div> {/* End header flex row */}
      {statusMessage && ( // Conditional render for active success status notifications
        <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/30 max-w-2xl"> {/* Green highlighted container */}
          <p className="text-green-400 font-sans text-sm">{statusMessage}</p> {/* Output success string */}
        </div> // Close alert container
      )} {/* Close success conditional block */}
      {showForm && ( // Conditional render for active complaint submission inputs form panel
        <div className="bg-bg-secondary rounded-2xl p-6 border border-white/5 max-w-2xl mb-8"> {/* Secondary card layout wrapper */}
          <h3 className="font-serif text-white text-xl font-bold mb-4">Submit a Complaint</h3> {/* Form category header */}
          {error && ( // Render active validation errors if present
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"> {/* Red highlighted alert box */}
              <p className="text-red-400 font-sans text-sm">{error}</p> {/* Output error details */}
            </div> // Close error alert container
          )} {/* Close error conditional check */}
          <div className="mb-4"> {/* Parent trip picker dropdown element wrapper */}
            <label className="block text-white/40 font-sans text-xs uppercase tracking-wide mb-1"> {/* Selector title label */}
              Which Trip? * {/* Requirements label indicators */}
            </label> {/* Close selector title label */}
            <select // Parent trip selection control dropdown
              value={selectedTripId} // Bind state value
              onChange={(e) => setSelectedTripId(e.target.value)} // Update trip ID state upon selection
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-gold" // Styled selection dropdown
            > {/* Open selection option fields */}
              <option value="">Select a trip</option> {/* Placeholder default option choice */}
              {myTrips.map((trip) => ( // Loop through registered trips lists
                <option key={trip.id} value={trip.id}>{trip.title}</option> // Render trip select option choice
              ))} {/* Close registered trips mapping */}
            </select> {/* Close selection dropdown */}
          </div> {/* End trip selector element */}
          <div className="grid grid-cols-2 gap-3 mb-4"> {/* Responsive column layout for category and severity selection */}
            <div> {/* Left category column container wrapper */}
              <label className="block text-white/40 font-sans text-xs uppercase tracking-wide mb-1"> {/* Category label header */}
                Category {/* Title string */}
              </label> {/* Close category label */}
              <select // Category select dropdown element
                value={category} // Bind category state value
                onChange={(e) => setCategory(e.target.value)} // Update category state upon selection
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-gold" // Styled selection dropdown
              > {/* Open selection options */}
                {CATEGORIES.map((cat) => ( // Loop through constant category options list
                  <option key={cat} value={cat}>{cat}</option> // Render category select option choice
                ))} {/* Close categories mapping */}
              </select> {/* Close selection dropdown */}
            </div> {/* Close category column wrapper */}
            <div> {/* Right severity column container wrapper */}
              <label className="block text-white/40 font-sans text-xs uppercase tracking-wide mb-1"> {/* Severity label header */}
                Severity {/* Title string */}
              </label> {/* Close severity label */}
              <select // Severity select dropdown element
                value={severity} // Bind severity state value
                onChange={(e) => setSeverity(e.target.value)} // Update severity state upon selection
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-gold" // Styled selection dropdown
              > {/* Open selection options */}
                {SEVERITIES.map((sev) => ( // Loop through constant severity tiers list
                  <option key={sev} value={sev}>{sev}</option> // Render severity select option choice
                ))} {/* Close severity mapping */}
              </select> {/* Close selection dropdown */}
            </div> {/* Close severity column wrapper */}
          </div> {/* End responsive row element */}
          <div className="mb-4"> {/* Title summary input container wrapper */}
            <label className="block text-white/40 font-sans text-xs uppercase tracking-wide mb-1"> {/* Title label header */}
              Title * ({title.length}/100) {/* Dynamic length indicators */}
            </label> {/* Close title label */}
            <input // Title text summary typing box
              type="text" // Enforce string characters
              value={title} // Bind title state value
              onChange={(e) => setTitle(e.target.value)} // Update title state on typing updates
              maxLength={100} // Enforce maximum visual bounds of 100 characters
              placeholder="Short summary of the issue" // Typing helper placeholder
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-gold" // Styled typing box
            /> {/* Close input element tag */}
          </div> {/* End title element */}
          <div className="mb-4"> {/* Description detailed input container wrapper */}
            <label className="block text-white/40 font-sans text-xs uppercase tracking-wide mb-1"> {/* Description label header */}
              Description * (minimum 20 characters) {/* Requirements note indicators */}
            </label> {/* Close description label */}
            <textarea // Description detailed textarea box
              value={description} // Bind description state value
              onChange={(e) => setDescription(e.target.value)} // Update description state on typing updates
              rows={4} // Set height rows
              placeholder="Describe what happened in detail" // Typing helper placeholder
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-gold resize-none" // Styled typing box
            /> {/* Close textarea element tag */}
          </div> {/* End description element */}
          <div className="mb-5 p-3 bg-white/5 rounded-lg"> {/* Anonymity checkbox row container block */}
            <label className="flex items-start gap-3 cursor-pointer"> {/* Clickable label wrapper - makes entire area clickable */}
              <input // Actual checkbox input element
                type="checkbox" // Checkbox input type
                checked={isAnonymous} // Bind checked state to isAnonymous boolean - stores is_anonymous flag in database
                onChange={(e) => setIsAnonymous(e.target.checked)} // Update isAnonymous state when checkbox is toggled
                className="mt-0.5 w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-gold checked:border-gold cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50" // Styled checkbox with gold highlight when checked
              /> {/* Close checkbox input */}
              <div className="flex-1"> {/* Text content wrapper */}
                <p className="text-white font-sans text-sm font-medium mb-1">Hide My Profile from Department Head</p> {/* Main checkbox label text - changed per requirements */}
                <p className="text-white/40 font-sans text-xs"> {/* Helper description text */}
                  The department head will see "Anonymous Student" instead of your name {/* Explanation of what happens when checked */}
                </p> {/* End helper text paragraph */}
              </div> {/* Close text content wrapper */}
            </label> {/* Close clickable label wrapper */}
          </div> {/* End anonymity checkbox row */}
          <div className="flex gap-2"> {/* Confirmation buttons row container wrapper */}
            <button // Submit complaint button
              onClick={handleSubmit} // Submit and validate on click
              disabled={submitting} // Lock controls during active API calls
              className="flex-1 bg-gold text-charcoal font-sans text-xs font-semibold uppercase tracking-wide py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Golden highlight style
            > {/* Button label wrapper */}
              {submitting ? 'Submitting...' : 'Submit Complaint'} {/* Dynamic button label description */}
            </button> {/* Close submit button */}
            <button // Cancel form panel button
              onClick={() => { // Cancel triggers
                resetForm() // Clean up typing inputs
                setShowForm(false) // Collapse input form panel
              }} // End cancel block triggers
              className="flex-1 bg-white/5 text-white/60 font-sans text-xs font-semibold uppercase tracking-wide py-3 rounded-lg hover:bg-white/10 transition-all" // Styled cancel button
            > {/* Button label wrapper */}
              Cancel {/* Cancel label text */}
            </button> {/* Close cancel button */}
          </div> {/* End confirmation buttons row */}
        </div> // End secondary card layout wrapper
      )} {/* Close conditional check */}
      {complaints.length === 0 ? ( // Conditional check if student complaints list is empty
        <div className="bg-bg-secondary rounded-2xl p-10 text-center border border-white/5 max-w-md"> {/* Dark empty warning card wrapper */}
          <p className="text-white/40 font-sans text-sm"> {/* Soft text description styling */}
            You haven't submitted any complaints yet. {/* Empty state info labels */}
          </p> {/* Close paragraph label */}
        </div> // Close empty warning card
      ) : ( // Render student complaints list when records are present
        <div className="space-y-3 max-w-2xl"> {/* Vertical slot card list stack */}
          {complaints.map((complaint) => ( // Loop through each student complaint object record
            <div key={complaint.id} className="bg-bg-secondary rounded-2xl p-5 border border-white/5"> {/* Slot card container wrapper */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2"> {/* Card row details header */}
                <h3 className="font-serif text-white text-lg font-bold">{complaint.title}</h3> {/* Complaint title text headings */}
                <span className={`text-xs font-sans font-semibold uppercase tracking-wide px-2 py-1 rounded ${statusColors[complaint.status]}`}> {/* Status badge wrapper */}
                  {complaint.status} {/* Complaint status labels */}
                </span> {/* Close status badge */}
              </div> {/* End details header */}
              <div className="flex items-center gap-2 flex-wrap mb-2"> {/* Row of metadata badges */}
                <span className="text-white/40 font-sans text-xs">{complaint.trips?.title}</span> {/* Display associated trip title */}
                <span className="text-white/20">•</span> {/* Visual bullet divider */}
                <span className="text-white/40 font-sans text-xs">{complaint.category}</span> {/* Display category class */}
                <span className={`text-xs font-sans px-2 py-0.5 rounded ${severityColors[complaint.severity]}`}> {/* Severity badge wrapper */}
                  {complaint.severity} {/* Display severity text labels */}
                </span> {/* Close severity badge */}
                {complaint.is_anonymous && ( // Render padlock if complaint is submitted anonymously - profile is hidden from dept head
                  <span className="text-xs font-sans text-gold/70">🔒 Profile hidden from Department Head</span> // Locked anonymous indicator string label - clarifies privacy status
                )} {/* Close anonymous lock indicator check */}
              </div> {/* End metadata row */}
              <p className="text-white/60 font-sans text-sm mb-3">{complaint.description}</p> {/* Display typed description text details */}
              {complaint.response && ( // Render department head response block if present
                <div className="p-3 bg-white/5 rounded-lg"> {/* Highlighted response box container */}
                  <p className="text-cyan-main font-sans text-xs uppercase tracking-wide mb-1"> {/* Cyan category label */}
                    Department Head Response {/* Header title labels */}
                  </p> {/* Close category label */}
                  <p className="text-white/70 font-sans text-sm">{complaint.response}</p> {/* Display department head's written comments */}
                </div> // Close response container
              )} {/* Close response block conditional check */}
            </div> // End slot card wrapper
          ))} {/* Close student complaints mapping */}
        </div> // End vertical list stack
      )} {/* Close empty check conditional */}
    </div> // End page viewport wrapper
  ) // End layout return statement
} // End ComplaintsPage functional component block
export default ComplaintsPage // Export default student complaints page
