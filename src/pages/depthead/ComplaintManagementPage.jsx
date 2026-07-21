// ComplaintManagementPage shows every complaint to the department head
// via the complaints_sanitized view — anonymous complaints always show
// "Anonymous Student" with no way to reveal the real identity from this page
// department head can move status to In Progress and respond to resolve
import { useState, useEffect } from 'react' // Import React hooks to manage page states and trigger triggers
// Import complaint service backend methods to fetch, progress, and respond to student files
import { fetchComplaintsForReview, updateComplaintStatus, respondToComplaint } from '../../lib/complaintService' // Import complaint review services
// Define main functional component for Department Head Complaint Management page
function ComplaintManagementPage() { // Begin ComplaintManagementPage definition
  // holds the full list of complaints from the sanitized view, joined with trip title
  const [complaints, setComplaints] = useState([]) // Setup complaints list state variable
  // loading state while fetching
  const [loading, setLoading] = useState(true) // Setup loading status boolean indicator
  // currently selected status filter tab
  const [statusFilter, setStatusFilter] = useState('Pending') // Setup active status filter tab selection state
  // tracks which complaint id is currently showing the response form
  const [respondingId, setRespondingId] = useState(null) // Setup responding targets id state tracker
  // holds the text typed into the response textarea
  const [responseText, setResponseText] = useState('') // Setup typed response commentary state
  // tracks which complaint id is being processed to disable its buttons
  const [processingId, setProcessingId] = useState(null) // Setup operational lock id state tracker
  // status message shown after an action
  const [statusMessage, setStatusMessage] = useState('') // Setup success status feedback banner state
  // error message shown after a failed action
  const [error, setError] = useState('') // Setup error warning banner state variable
  // loadComplaints fetches complaints fresh from the sanitized view
  // this is the only read path for this page, by design, to protect anonymity
  const loadComplaints = async () => { // Begin loadComplaints async helper definition
    setLoading(true) // Activate page loading spinner state
    const { complaints: data } = await fetchComplaintsForReview() // Run database query fetching complaints from sanitized view
    setComplaints(data) // Save retrieved complaints array to state
    setLoading(false) // Deactivate page loading spinner state
  } // End loadComplaints helper function
  // fetch once when the page mounts
  useEffect(() => { // Begin useEffect lifecycle trigger
    loadComplaints() // Invoke data load actions helper
  }, []) // Bind empty array to mounting phase only
  // showStatus displays a temporary success message
  const showStatus = (message) => { // Begin showStatus definition
    setStatusMessage(message) // Store message string inside status state variable
    setTimeout(() => setStatusMessage(''), 3000) // Trigger timer to clear status state after three seconds
  } // End showStatus helper function
  // handleMarkInProgress transitions a complaint from Pending to In Progress
  const handleMarkInProgress = async (complaint) => { // Begin handleMarkInProgress definition
    setProcessingId(complaint.id) // Disable button interactions during update activities
    // update just the status field, works regardless of anonymity
    const { error: updateError } = await updateComplaintStatus(complaint.id, 'In Progress') // Run status update backend service
    setProcessingId(null) // Re-enable user interaction controls
    if (updateError) { // Check if query execution returned database error
      setError('Could not update status. Please try again.') // Highlight warning feedback description
      return // Halt execution
    } // End of error validation check block
    // update local state
    setComplaints(complaints.map((c) => // Update local list state to match new database status
      c.id === complaint.id ? { ...c, status: 'In Progress' } : c // Map updated status attribute
    )) // Close local list mapping update
    showStatus('Complaint marked as In Progress.') // Display temporary success alert
  } // End handleMarkInProgress function
  // handleStartRespond opens the response form for a specific complaint
  const handleStartRespond = (complaintId) => { // Begin handleStartRespond definition
    setRespondingId(complaintId) // Map targeted complaint ID to responding trigger state
    setResponseText('') // Reset typed response comments state
    setError('') // Clear any active page error warning alerts
  } // End handleStartRespond function
  // handleSubmitResponse submits the response and resolves the complaint
  const handleSubmitResponse = async (complaint) => { // Begin handleSubmitResponse definition
    // validate a response was written
    if (!responseText.trim()) { // Verify typed response comment text is present
      setError('Please write a response before resolving.') // Display validation error message
      return // Stop transaction execution
    } // End response validation check block
    setProcessingId(complaint.id) // Disable button interactions during response updates
    // call the respond service, targets by id only — no student identity needed
    const { error: respondError } = await respondToComplaint(complaint.id, responseText.trim()) // Run response update backend service
    setProcessingId(null) // Re-enable user interaction controls
    if (respondError) { // Check if transaction returned database execution errors
      setError('Could not submit response. Please try again.') // Highlight warning feedback description
      return // Halt execution
    } // End of database error validation block
    // update local state to reflect the resolution
    setComplaints(complaints.map((c) => // Update local list state to match Resolved status and values
      c.id === complaint.id // If mapping target match
        ? { ...c, status: 'Resolved', response: responseText.trim() } // Assign updated status and comments
        : c // Else preserve previous object row
    )) // Close local list mapping update
    setRespondingId(null) // Close input text response box panel
    setResponseText('') // Reset typed response text state
    showStatus('Response submitted and complaint resolved.') // Print success alert
  } // End handleSubmitResponse function
  // filter complaints based on the selected status tab
  const filteredComplaints = statusFilter === 'All' // If All tab is active
    ? complaints // Return full complaints list
    : complaints.filter((c) => c.status === statusFilter) // Else filter rows by matching status enum string
  // statusColors for the complaint status badge
  const statusColors = { // Setup statusColors mapping dictionary
    Pending: 'bg-yellow-500/20 text-yellow-400', // Yellow badge styles for active pending complaint status
    'In Progress': 'bg-cyan-main/20 text-cyan-main', // Cyan badge styles for active in progress status
    Resolved: 'bg-green-500/20 text-green-400', // Green badge styles for completed resolved status
  } // End statusColors definition
  // severityColors for the severity badge
  const severityColors = { // Setup severityColors mapping dictionary
    Low: 'bg-white/10 text-[#6B7F9F]', // Soft neutral styles for low level severity
    Medium: 'bg-orange-500/20 text-orange-400', // Orange warning styles for medium level severity
    High: 'bg-red-500/20 text-red-400', // Red critical alert styles for high level severity
  } // End severityColors definition
  return ( // Begin main layout JSX return
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Page viewport container wrapper */}
      <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Complaint Management</h1> {/* Primary screen title heading */}
      <p className="text-[#4A5F7F] font-sans text-sm mb-6"> {/* Subtitle container block */}
        Review and respond to student complaints. Anonymous submissions never reveal identity. {/* Page instructions helper text */}
      </p> {/* End subtitle paragraph */}
      {statusMessage && ( // Conditional rendering for active success alerts
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 max-w-2xl"> {/* Highlighted box wrapper */}
          <p className="text-green-400 font-sans text-sm">{statusMessage}</p> {/* Output success string */}
        </div> // Close alert container
      )} {/* Close success conditional block */}
      {error && ( // Conditional rendering for active error alerts
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl"> {/* Highlighted warning box wrapper */}
          <p className="text-red-400 font-sans text-sm">{error}</p> {/* Output error description string */}
        </div> // Close error container
      )} {/* Close error conditional block */}
      <div className="flex gap-2 mb-6 flex-wrap"> {/* Flex container row for status filter tabs */}
        {['Pending', 'In Progress', 'Resolved', 'All'].map((status) => ( // Loop through status categories list
          <button // Filter trigger button
            key={status} // Bind key
            onClick={() => setStatusFilter(status)} // Update selected filter value on click
            className={`px-4 py-2 rounded-lg font-sans text-xs font-semibold uppercase tracking-wide transition-all ${ // Base styles
              statusFilter === status // If this button status is currently active
                ? 'bg-gold text-charcoal' // Golden active button style
                : 'bg-white/5 text-[#5A6F8F] hover:bg-white/10' // Else fallback muted styling
            }`} // End style injection
          > {/* Button text label */}
            {status} {/* Label text matching status string */}
          </button> // Close filter button tag
        ))} {/* Close button loop mapping */}
      </div> {/* End filter tabs row */}
      {loading ? ( // Conditional render for active loading states
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Glowing gold styles */}
          Loading Complaints... {/* Loading placeholder string */}
        </p> // End placeholder paragraph
      ) : filteredComplaints.length === 0 ? ( // Nested check if filtered complaints array list is empty
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E5EDFF] max-w-md"> {/* Dark empty notice card */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Soft text description styling */}
            No complaints found for this filter. {/* Empty notice description */}
          </p> {/* End alert paragraph */}
        </div> // End notice card wrapper
      ) : ( // Render complaints cards review lists when matching rows exist
        <div className="space-y-3 max-w-3xl"> {/* Vertical slot card list stack */}
          {filteredComplaints.map((complaint) => ( // Loop through each student complaint object record
            <div key={complaint.id} className="bg-white rounded-2xl p-5 border border-[#E5EDFF]"> {/* Card wrapper container */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2"> {/* Row of student details */}
                <h3 className="font-serif text-[#1E3A5F] text-lg font-bold">{complaint.title}</h3> {/* Display complaint title */}
                <span className={`text-xs font-sans font-semibold uppercase tracking-wide px-2 py-1 rounded ${statusColors[complaint.status]}`}> {/* Badge wrapper */}
                  {complaint.status} {/* Badge enum string labels */}
                </span> {/* Close status badge tag */}
              </div> {/* End details row container */}
              {/* submitter display name — this is ALWAYS display_name from the view, never student_id */}
              {/* for anonymous complaints this reads exactly "Anonymous Student" */}
              <p className="text-gold font-sans text-sm mb-2">{complaint.display_name}</p> {/* Output display_name value */}
              <div className="flex items-center gap-2 flex-wrap mb-3"> {/* Row of metadata badges */}
                <span className="text-[#4A5F7F] font-sans text-xs">{complaint.trips?.title}</span> {/* Display associated trip title */}
                <span className="text-white/20">•</span> {/* Visual bullet divider */}
                <span className="text-[#4A5F7F] font-sans text-xs">{complaint.category}</span> {/* Display category class */}
                <span className={`text-xs font-sans px-2 py-0.5 rounded ${severityColors[complaint.severity]}`}> {/* Severity badge wrapper */}
                  {complaint.severity} {/* Display severity text labels */}
                </span> {/* Close severity badge */}
              </div> {/* End metadata row */}
              <p className="text-[#6B7F9F] font-sans text-sm mb-3">{complaint.description}</p> {/* Display description text details */}
              <p className="text-white/30 font-sans text-xs mb-3"> {/* Timestamp container block */}
                Submitted: {new Date(complaint.created_at).toLocaleDateString()} {/* Formatted dates string */}
              </p> {/* End timestamp paragraph */}
              {complaint.status === 'Resolved' && complaint.response && ( // Display existing response if resolved
                <div className="p-3 bg-white/5 rounded-lg mb-1"> {/* Response box wrapper */}
                  <p className="text-cyan-main font-sans text-xs uppercase tracking-wide mb-1"> {/* Cyan header label */}
                    Your Response {/* Text content */}
                  </p> {/* Close label tag */}
                  <p className="text-[#2A3F5F] font-sans text-sm">{complaint.response}</p> {/* Display response text */}
                </div> // Close response box
              )} {/* Close response block conditional check */}
              {respondingId === complaint.id ? ( // Conditional render for response form inputs
                <div className="mt-2"> {/* Response inputs container wrapper */}
                  <textarea // Response detailed textarea box
                    value={responseText} // Bind state value
                    onChange={(e) => setResponseText(e.target.value)} // Update response state on typing updates
                    placeholder="Write your response to this complaint" // Typing helper placeholder
                    rows={3} // Set layout height rows
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none mb-2" // Styled textarea box
                  /> {/* Close response textarea tag */}
                  <div className="flex gap-2"> {/* Confirmation buttons row container */}
                    <button // Submit & Resolve button
                      onClick={() => handleSubmitResponse(complaint)} // Submit response on click
                      disabled={processingId === complaint.id} // Disable controls during active updates
                      className="flex-1 bg-gold text-charcoal font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Golden highlights
                    > {/* Button contents wrapper */}
                      Submit & Resolve {/* Action labels */}
                    </button> {/* Close submit button */}
                    <button // Cancel response panel button
                      onClick={() => setRespondingId(null)} // Reset responding state on click
                      className="flex-1 bg-white/5 text-[#6B7F9F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:bg-white/10 transition-all" // Styled cancel button
                    > {/* Button contents wrapper */}
                      Cancel {/* Cancel labels */}
                    </button> {/* Close cancel button */}
                  </div> {/* End confirmation buttons row */}
                </div> // End form wrapper block
              ) : ( // Else render control buttons while complaint status is not yet Resolved
                complaint.status !== 'Resolved' && ( // Verify status is not Resolved
                  <div className="flex gap-2 mt-1"> {/* Row of decision action buttons */}
                    {complaint.status === 'Pending' && ( // Allow progression to In Progress only if status remains Pending
                      <button // Mark in progress button
                        onClick={() => handleMarkInProgress(complaint)} // Execute status update transaction on click
                        disabled={processingId === complaint.id} // Disable during operations
                        className="flex-1 bg-cyan-main text-charcoal font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Cyan style button
                      > {/* Button contents wrapper */}
                        Mark In Progress {/* Action button label */}
                      </button> // Close mark in progress button
                    )} {/* Close Pending condition check */}
                    <button // Trigger response inputs form button
                      onClick={() => handleStartRespond(complaint.id)} // Open responding text areas on click
                      disabled={processingId === complaint.id} // Disable during operations
                      className="flex-1 bg-gold text-charcoal font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Golden styles button
                    > {/* Button contents wrapper */}
                      Respond & Resolve {/* Action button label */}
                    </button> {/* Close response trigger button */}
                  </div> // End action buttons row container
                ) // End status verification check
              )} {/* End responding form check conditional block */}
            </div> // End document card container wrapper
          ))} {/* Close map loops block */}
        </div> // End vertical list container
      )} {/* Close complaints empty validation check block */}
    </div> // End page viewport wrapper
  ) // End return block
} // End ComplaintManagementPage component definition
export default ComplaintManagementPage // Export default complaint management page component
