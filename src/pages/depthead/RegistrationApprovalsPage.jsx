// Import standard React hooks for state and lifecycle management
import { useState, useEffect } from 'react' // Import hooks
// Import registration database helper services
import { fetchAllPendingRegistrations, approveRegistration, rejectRegistration } from '../../lib/registrationService' // Import service functions
import { // Import registration forms service functions for medical and emergency contact data
  fetchMedicalForm, // Import function to retrieve existing medical form data
  fetchEmergencyContact, // Import function to retrieve existing emergency contact
} from '../../lib/registrationFormsService' // Connect registration forms service
// Define the principal registration approvals React page component
function RegistrationApprovalsPage() { // Start RegistrationApprovalsPage function
  // React state hook to hold the array list of pending student registrations
  const [registrations, setRegistrations] = useState([]) // Set registrations state
  // React state hook to track whether the database is actively loading
  const [loading, setLoading] = useState(true) // Set loading state
  // React state hook to track which registration ID is opening the rejection editor
  const [rejectingId, setRejectingId] = useState(null) // Set rejectingId state
  // React state hook to hold the value of the rejection decision notes input
  const [rejectNote, setRejectNote] = useState('') // Set rejectNote state
  // React state hook to track which registration ID is currently processing database updates
  const [processingId, setProcessingId] = useState(null) // Set processingId state
  // React state hook to hold temporary feedback or success alerts message
  const [statusMessage, setStatusMessage] = useState('') // Set statusMessage state
  // React state hook to store database or functional error alerts message
  const [error, setError] = useState('') // Set error state
  // React state hook to track which registration is being viewed for medical/emergency details
  const [viewingDetailsId, setViewingDetailsId] = useState(null) // Set viewingDetailsId state for viewing forms
  // React state hook to store medical form data for viewing
  const [medicalFormView, setMedicalFormView] = useState(null) // Store medical form data for read-only view
  // React state hook to store emergency contact data for viewing
  const [emergencyContactView, setEmergencyContactView] = useState(null) // Store emergency contact data for read-only view
  // React state hook to track loading state for forms data
  const [loadingForms, setLoadingForms] = useState(false) // Track forms loading state
  // Helper asynchronous function to retrieve pending registration lists from database
  const loadRegistrations = async () => { // Start loadRegistrations definition
    setLoading(true) // Set loading state to true before starting fetch
    const { registrations: data } = await fetchAllPendingRegistrations() // Await retrieval of pending applications
    setRegistrations(data) // Save retrieved registration array data to state
    setLoading(false) // Toggle loading state back to false on completion
  } // End loadRegistrations function
  // Mount the React lifecycle useEffect hook to fetch registrations on page mount
  useEffect(() => { // Start useEffect block
    loadRegistrations() // Trigger database retrieval on component initialization
  }, []) // Empty dependency array to run only once on mounting
  // Helper to show temporary alerts that automatically fade after three seconds
  const showStatus = (message) => { // Start showStatus definition
    setStatusMessage(message) // Store visible alert text inside status state
    setTimeout(() => setStatusMessage(''), 3000) // Trigger timer to clear status after three seconds
  } // End showStatus function
  
  // Handler to view medical and emergency contact information for a student
  const handleViewDetails = async (studentId) => { // Start handleViewDetails definition
    setViewingDetailsId(studentId) // Set the student ID being viewed
    setLoadingForms(true) // Turn on loading indicator for forms
    const { medicalForm } = await fetchMedicalForm(studentId) // Fetch medical form data for this student
    const { emergencyContact } = await fetchEmergencyContact(studentId) // Fetch emergency contact data for this student
    setMedicalFormView(medicalForm) // Store medical form in state for display
    setEmergencyContactView(emergencyContact) // Store emergency contact in state for display
    setLoadingForms(false) // Turn off loading indicator
  } // End handleViewDetails function
  
  // Handler to close the details view modal
  const handleCloseDetailsView = () => { // Start handleCloseDetailsView definition
    setViewingDetailsId(null) // Clear the viewing student ID
    setMedicalFormView(null) // Clear medical form data
    setEmergencyContactView(null) // Clear emergency contact data
  } // End handleCloseDetailsView function
  // Asynchronous handler to submit approval requests for a specific student registration
  const handleApprove = async (reg) => { // Start handleApprove definition
    if (reg.trips?.spots_remaining <= 0) { // If trip spots remaining is empty
      setError(`Cannot approve — "${reg.trips?.title}" has no spots remaining.`) // Flag error
      return // Stop execution
    } // Close capacity guard check
    setProcessingId(reg.id) // Disable buttons by setting active processing registration ID
    setError('') // Clear previous errors
    const { error: approveError } = await approveRegistration( // Trigger database transaction
      reg.id, // Registration unique identifier
      reg.trip_id, // Target trip identifier
      reg.student_id, // Student user identifier
      reg.trips?.cost_per_student || 0, // Fee per student to create payment row
      reg.trips?.payment_due_date || null // Payment deadline
    ) // End transaction call
    setProcessingId(null) // Reset processing ID to enable user controls
    if (approveError) { // Check if approval process failed
      setError(approveError.message || 'Approval failed. Please try again.') // Highlight error details
      return // Halt process execution
    } // Close error processing block
    setRegistrations(registrations.filter((r) => r.id !== reg.id)) // Remove approved application from active pending list
    showStatus(`Registration approved for ${reg.profiles?.full_name || 'Student'}.`) // Print success alert
  } // End handleApprove function
  // Handler to prepare a specific registration row for rejection entry
  const handleStartReject = (regId) => { // Start handleStartReject definition
    setRejectingId(regId) // Map target ID to rejection state to display form input
    setRejectNote('') // Clear previously typed rejection note texts
    setError('') // Clear current active page error logs
  } // End handleStartReject function
  // Asynchronous handler to submit rejection request with the required reason text
  const handleConfirmReject = async (reg) => { // Start handleConfirmReject definition
    if (!rejectNote.trim()) { // If typed rejection reason is empty or whitespace
      setError('Please provide a reason for rejection.') // Require a reason text
      return // Stop transaction execution
    } // Close note validation check
    setProcessingId(reg.id) // Disable button interactions by setting active processing ID
    const { error: rejectError } = await rejectRegistration( // Call registration service reject method
      reg.id, // Target registration identifier
      reg.student_id, // Student user identifier
      reg.trip_id, // Target trip identifier
      rejectNote.trim() // Reason details to write into decision_note and send as notification
    ) // End rejection transaction call
    setProcessingId(null) // Re-enable user interaction controls
    if (rejectError) { // Check if rejection transaction returned failure
      setError('Rejection failed. Please try again.') // Report failure
      return // Halt process execution
    } // Close error validation check
    setRegistrations(registrations.filter((r) => r.id !== reg.id)) // Filter rejected application from local pending queue
    setRejectingId(null) // Close input text container
    setRejectNote('') // Reset input state variables
    showStatus(`Registration rejected for ${reg.profiles?.full_name || 'Student'}.`) // Display success alerts
  } // End handleConfirmReject function
  // Render the RegistrationApprovalsPage component markup layout
  return ( // Start JSX structure returning
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Main viewport container wrapper */}
      <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Registration Approvals</h1> {/* Primary screen title */}
      <p className="text-[#4A5F7F] font-sans text-sm mb-6"> {/* Secondary subtitle message */}
        Review and decide on pending student registrations {/* Instructions helper texts */}
      </p> {/* End subtitle container */}
      {statusMessage && ( // Conditional rendering for active success alerts
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 max-w-2xl"> {/* Green layout wrapper */}
          <p className="text-green-400 font-sans text-sm">{statusMessage}</p> {/* Print status texts */}
        </div> // End alert container
      )} {/* Close statusMessage condition */}
      {error && ( // Conditional rendering for active error alerts
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl"> {/* Red layout wrapper */}
          <p className="text-red-400 font-sans text-sm">{error}</p> {/* Print error message text */}
        </div> // End error layout container
      )} {/* Close error condition */}
      {loading ? ( // Conditional render for active page loading states
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Pulse gold texts */}
          Loading Registrations... {/* Loading feedback string */}
        </p> // End loading placeholder
      ) : registrations.length === 0 ? ( // Nested condition check if pending registrations list is empty
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E5EDFF] max-w-md"> {/* Clean empty card */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Soft styling texts */}
            No pending registrations. All caught up. {/* Congratulatory messaging */}
          </p> {/* End paragraph container */}
        </div> // End empty layout card
      ) : ( // Render registration lists when records exist
        <div className="space-y-3 max-w-3xl"> {/* Structured vertical gap list */}
          {registrations.map((reg) => ( // Loop through each pending registration
            <div key={reg.id} className="bg-white rounded-2xl p-5 border border-[#E5EDFF]"> {/* Card wrapper */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2"> {/* Header columns */}
                <div> {/* Student identifier details */}
                  <p className="text-[#1E3A5F] font-sans text-sm font-semibold"> {/* Name details styling */}
                    {reg.profiles?.full_name} {/* Student full name */}
                  </p> {/* End student name paragraph */}
                  <p className="text-[#4A5F7F] font-sans text-xs"> {/* ID number styling */}
                    {reg.profiles?.student_id_number} {/* Student ID number */}
                  </p> {/* End student ID paragraph */}
                </div> {/* End student wrapper columns */}
                <span className="text-xs font-sans text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded uppercase tracking-wide"> {/* Badge styling */}
                  Pending {/* Status badge labels */}
                </span> {/* End badge tag */}
              </div> {/* End header columns */}
              <p className="text-[#6B7F9F] font-sans text-sm mb-1"> {/* Trip info block */}
                Trip: <span className="text-gold">{reg.trips?.title}</span> — {reg.trips?.destination} {/* Destination strings */}
              </p> {/* End trip description paragraph */}
              <p className={`font-sans text-xs mb-3 ${reg.trips?.spots_remaining <= 0 ? 'text-red-400' : 'text-[#4A5F7F]'}`}> {/* Capacity colorizer */}
                {reg.trips?.spots_remaining <= 0 // If spots are completely filled
                  ? '⚠ Trip is now fully booked' // Render warnings
                  : `${reg.trips?.spots_remaining} spots remaining`} {/* Else print remaining spots */}
              </p> {/* End capacity text paragraph */}
              <p className="text-white/30 font-sans text-xs mb-3"> {/* Timestamp wrapper */}
                Applied: {new Date(reg.applied_at).toLocaleDateString()} {/* Formatted dates string */}
              </p> {/* End applied date paragraph */}
              {reg.parental_consent_url && ( // Render parental consent helper notification if link exists
                <p className="text-cyan-main font-sans text-xs mb-3"> {/* Document info styling */}
                  📎 Parental consent form uploaded {/* Static document upload confirmation label */}
                </p> // End document label
              )} {/* End parental consent checks */}
              <button // View medical/emergency info button for department head
                onClick={() => handleViewDetails(reg.student_id)} // Open view modal with student's medical and emergency data
                className="w-full bg-[#8CA5FF] text-white font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 transition-all mb-3" // Blue button style
              > {/* Button open tag */}
                View Medical/Emergency Info {/* Button text label */}
              </button> {/* Close view button */}
              {rejectingId === reg.id ? ( // Conditional render for input rejection form
                <div className="mb-3"> {/* Form layout container */}
                  <textarea // Multiline text field for reason typing
                    value={rejectNote} // Bind text value
                    onChange={(e) => setRejectNote(e.target.value)} // Update state on change
                    placeholder="Reason for rejection (shown to the student)" // Text guide helper
                    rows={2} // Set height layout
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none mb-2" // Beautiful textarea styles
                  /> {/* Close textarea tag */}
                  <div className="flex gap-2"> {/* Row of confirmation controls */}
                    <button // Submit confirm button
                      onClick={() => handleConfirmReject(reg)} // Execute confirm handler on click
                      disabled={processingId === reg.id} // Disable during queries
                      className="flex-1 bg-red-500 text-[#1E3A5F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Highlight red styles
                    > {/* Button contents wrapper */}
                      Confirm Rejection {/* Text labels */}
                    </button> {/* Close submit button */}
                    <button // Cancel button
                      onClick={() => setRejectingId(null)} // Reset rejection states on click
                      className="flex-1 bg-white/5 text-[#6B7F9F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:bg-white/10 transition-all" // Cancel style buttons
                    > {/* Button contents wrapper */}
                      Cancel {/* Text label markup */}
                    </button> {/* Close cancel button */}
                  </div> {/* End row wrapper */}
                </div> // End form block
              ) : ( // Show decision actions when not actively typing rejection details
                <div className="flex gap-2"> {/* Row of primary action buttons */}
                  <button // Approval trigger button
                    onClick={() => handleApprove(reg)} // Execute approval transaction on click
                    disabled={processingId === reg.id || reg.trips?.spots_remaining <= 0} // Disable during operations or if filled
                    className="flex-1 bg-green-500 text-[#1E3A5F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all" // Green style buttons
                  > {/* Button contents wrapper */}
                    {processingId === reg.id ? 'Processing...' : 'Approve'} {/* Display action or loading states */}
                  </button> {/* Close approval button */}
                  <button // Reject trigger button
                    onClick={() => handleStartReject(reg.id)} // Open rejection textarea input panel on click
                    disabled={processingId === reg.id} // Disable when processing other tasks
                    className="flex-1 bg-white/5 text-[#6B7F9F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-all" // Muted gray outlines
                  > {/* Button contents wrapper */}
                    Reject {/* Button label text */}
                  </button> {/* Close reject button */}
                </div> // End actions block
              )} {/* End rejection form check block */}
            </div> // End registration card wrapper
          ))} {/* Close map loop */}
        </div> // End registrations list block
      )} {/* Close registrations empty check block */}
      
      {/* View Modal for Medical and Emergency Contact Information (Read-Only for Department Head) */}
      {viewingDetailsId && ( // Conditional render for view modal
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"> {/* Translucent dark backdrop with blur — dims and softens page content behind modal while keeping it visibly present */}
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5EDFF]"> {/* Modal content container */}
            <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold mb-6">Student Medical & Emergency Contact Information</h2> {/* Modal title */}
            
            {loadingForms ? ( // Check if forms are being loaded
              <div className="py-12 text-center"> {/* Loading container */}
                <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse">Loading information...</p> {/* Loading text */}
              </div> // Close loading container
            ) : ( // Display forms data when loaded
              <>
                {/* Medical Information Display (Read-Only) */}
                <div className="space-y-4 pb-6 mb-6 border-b border-[#E5EDFF]"> {/* Medical info container with bottom border */}
                  <h3 className="text-[#1E3A5F] font-serif text-lg font-bold">Medical Information</h3> {/* Section heading */}
                  
                  {medicalFormView ? ( // Check if medical form data exists
                    <>
                      <div className="space-y-2"> {/* Blood type display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Blood Group</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm">{medicalFormView.blood_type || 'Not specified'}</p> {/* Display blood type value */}
                      </div> {/* Close blood type container */}
                      
                      <div className="space-y-2"> {/* Allergies display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Allergies</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalFormView.allergies || 'None listed'}</p> {/* Display allergies value */}
                      </div> {/* Close allergies container */}
                      
                      <div className="space-y-2"> {/* Medications display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Current Medications</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalFormView.medications || 'None listed'}</p> {/* Display medications value */}
                      </div> {/* Close medications container */}
                      
                      <div className="space-y-2"> {/* Medical conditions display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Medical Conditions</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalFormView.medical_conditions || 'None listed'}</p> {/* Display medical conditions value */}
                      </div> {/* Close medical conditions container */}
                      
                      <div className="space-y-2"> {/* Emergency notes display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Emergency Medical Notes</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalFormView.emergency_medical_notes || 'None provided'}</p> {/* Display emergency notes value */}
                      </div> {/* Close emergency notes container */}
                    </>
                  ) : ( // Display message if no medical form data found
                    <p className="text-[#6B7F9F] font-sans text-sm italic">No medical information on file.</p> // No data message
                  )} {/* End medical form check */}
                </div> {/* Close medical info section */}
                
                {/* Emergency Contact Display (Read-Only) */}
                <div className="space-y-4 mb-6"> {/* Emergency contact container */}
                  <h3 className="text-[#1E3A5F] font-serif text-lg font-bold">Emergency Contact Information</h3> {/* Section heading */}
                  
                  {emergencyContactView ? ( // Check if emergency contact data exists
                    <>
                      <div className="space-y-2"> {/* Full name display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Full Name</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContactView.contact_name || 'Not specified'}</p> {/* Display full name value */}
                      </div> {/* Close full name container */}
                      
                      <div className="space-y-2"> {/* Relationship display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Relationship</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContactView.relationship || 'Not specified'}</p> {/* Display relationship value */}
                      </div> {/* Close relationship container */}
                      
                      <div className="space-y-2"> {/* Phone number display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Phone Number</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContactView.contact_phone || 'Not specified'}</p> {/* Display phone number value */}
                      </div> {/* Close phone number container */}
                      
                      <div className="space-y-2"> {/* Alternative phone display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Alternative Phone</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContactView.alternative_phone || 'Not provided'}</p> {/* Display alternative phone value */}
                      </div> {/* Close alternative phone container */}
                      
                      <div className="space-y-2"> {/* Address display container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Address</label> {/* Field label */}
                        <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{emergencyContactView.address || 'Not specified'}</p> {/* Display address value */}
                      </div> {/* Close address container */}
                    </>
                  ) : ( // Display message if no emergency contact data found
                    <p className="text-[#6B7F9F] font-sans text-sm italic">No emergency contact on file.</p> // No data message
                  )} {/* End emergency contact check */}
                </div> {/* Close emergency contact section */}
                
                {/* Close button */}
                <button // Close button
                  onClick={handleCloseDetailsView} // Close modal on click
                  className="w-full bg-[#8CA5FF] text-white font-sans text-sm font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[#7090E5] transition-all" // Blue button style
                > {/* Button open tag */}
                  Close {/* Button text label */}
                </button> {/* Close button tag */}
              </>
            )} {/* End loading check */}
          </div> {/* Close modal content */}
        </div> // Close modal overlay
      )} {/* End view modal */}
    </div> // End page wrapper container
  ) // End return block
} // End RegistrationApprovalsPage component definition
export default RegistrationApprovalsPage // Export default approvals component
