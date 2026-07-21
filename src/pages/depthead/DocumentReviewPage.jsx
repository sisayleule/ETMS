// Import standard React hook elements for component state and lifecycle tracking
import { useState, useEffect } from 'react' // Import React hooks
// Import document service backend helper functions to approve, reject, and preview private documents
import { fetchAllDocumentsForReview, getDocumentSignedUrl, approveDocument, rejectDocument } from '../../lib/documentService' // Import service actions
// Define the React component function for the Department Head Document Review page
function DocumentReviewPage() { // Start DocumentReviewPage component
  // React state to store the full array list of uploaded document objects
  const [documents, setDocuments] = useState([]) // Set documents state
  // React state boolean indicating if database queries are actively fetching
  const [loading, setLoading] = useState(true) // Set loading state
  // React state filtering document review list by status, default to Pending to focus on active work
  const [statusFilter, setStatusFilter] = useState('Pending') // Set statusFilter state
  // React state tracking which document ID is currently opening the reject feedback form
  const [rejectingId, setRejectingId] = useState(null) // Set rejectingId state
  // React state holding the feedback text typed into the rejection message box
  const [rejectFeedback, setRejectFeedback] = useState('') // Set rejectFeedback state
  // React state tracking which document ID is currently executing database actions
  const [processingId, setProcessingId] = useState(null) // Set processingId state
  // React state holding temporary success feedback banner message strings
  const [statusMessage, setStatusMessage] = useState('') // Set statusMessage state
  // React state holding error alert banner message strings
  const [error, setError] = useState('') // Set error state
  // Asynchronous helper function to load document lists fresh from the database
  const loadDocuments = async () => { // Start loadDocuments definition
    setLoading(true) // Set loading state to true before starting fetch
    const { documents: data } = await fetchAllDocumentsForReview() // Await retrieval of all documents
    setDocuments(data) // Save retrieved document list to state
    setLoading(false) // Toggle page loading indicator back to false
  } // End loadDocuments function
  // Fetch document lists exactly once upon initial page mount
  useEffect(() => { // Start useEffect block
    loadDocuments() // Invoke document loading action helper
  }, []) // Empty array to restrict trigger to mounting phase
  // Helper to show temporary alerts that automatically fade after three seconds
  const showStatus = (message) => { // Start showStatus definition
    setStatusMessage(message) // Store visible alert text inside status state
    setTimeout(() => setStatusMessage(''), 3000) // Trigger timer to clear status after three seconds
  } // End showStatus function
  // Asynchronous handler to generate a signed url and open a private document file in a new browser tab
  const handleViewFile = async (filePath) => { // Start handleViewFile definition
    const { signedUrl, error: urlError } = await getDocumentSignedUrl(filePath) // Request secure access link from storage
    if (signedUrl) { // If link creation succeeded
      window.open(signedUrl, '_blank') // Open file address in a new tab securely
    } else { // Check if generation returned failure
      setError('Could not open file. Please try again.') // Highlight error details
    } // End of conditional check
  } // End handleViewFile function
  // Asynchronous handler to submit approval requests for a specific student document
  const handleApprove = async (doc) => { // Start handleApprove definition
    setProcessingId(doc.id) // Disable buttons by setting active processing document ID
    setError('') // Clear previous active error logs
    const { error: approveError } = await approveDocument(doc.id, doc.student_id, doc.doc_type) // Trigger approval transaction
    setProcessingId(null) // Reset processing ID to re-enable user controls
    if (approveError) { // Check if database transaction returned failure
      setError('Approval failed. Please try again.') // Highlight error details
      return // Halt execution
    } // End check conditional block
    setDocuments(documents.map((d) => // Update state of approved document locally to reflect changes
      d.id === doc.id ? { ...d, status: 'Approved' } : d // Map updated status key
    )) // Close local map update
    showStatus(`${doc.doc_type} approved for ${doc.profiles?.full_name || 'Student'}.`) // Print success alert
  } // End handleApprove function
  // Handler to prepare a specific document row for rejection feedback typing
  const handleStartReject = (docId) => { // Start handleStartReject definition
    setRejectingId(docId) // Map target ID to rejecting state to display form input
    setRejectFeedback('') // Clear previously typed rejection feedback text
    setError('') // Clear current active page error logs
  } // End handleStartReject function
  // Asynchronous handler to submit rejection requests with required corrective feedback text
  const handleConfirmReject = async (doc) => { // Start handleConfirmReject definition
    if (!rejectFeedback.trim()) { // If typed rejection reason is empty or whitespace
      setError('Please provide feedback explaining the rejection.') // Require corrective feedback details
      return // Stop transaction execution
    } // Close feedback text validation check
    setProcessingId(doc.id) // Disable button interactions by setting active processing ID
    const { error: rejectError } = await rejectDocument( // Call document service reject method
      doc.id, // Target document identifier
      doc.student_id, // Student user identifier
      doc.doc_type, // Document category type
      rejectFeedback.trim() // Corrective action feedback details
    ) // End rejection transaction call
    setProcessingId(null) // Re-enable user interaction controls
    if (rejectError) { // Check if rejection transaction returned database failure
      setError('Rejection failed. Please try again.') // Report failure
      return // Halt execution
    } // Close error validation check block
    setDocuments(documents.map((d) => // Map updated statuses inside local array
      d.id === doc.id ? { ...d, status: 'Rejected', feedback: rejectFeedback.trim() } : d // Set status and feedback keys
    )) // Close local list updates
    setRejectingId(null) // Close input text feedback container
    setRejectFeedback('') // Reset input state variables
    showStatus(`${doc.doc_type} rejected for ${doc.profiles?.full_name || 'Student'}.`) // Display success alerts
  } // End handleConfirmReject function
  // Filter local documents list according to currently selected filter tab
  const filteredDocuments = statusFilter === 'All' // If All tab is active
    ? documents // Return full array list
    : documents.filter((d) => d.status === statusFilter) // Else filter rows by status field match
  // Define mapping of CSS classes corresponding to each document status badge
  const statusColors = { // Start statusColors mapping
    Pending: 'bg-yellow-500/20 text-yellow-400', // Yellow badge styles for Pending review
    Approved: 'bg-green-500/20 text-green-400', // Green badge styles for Approved document
    Rejected: 'bg-red-500/20 text-red-400', // Red badge styles for Rejected document
  } // End statusColors object definition
  // Render active Department Head Document Review Page layout structure
  return ( // Start JSX structure returning
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Viewport page wrapper container */}
      <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Document Review</h1> {/* Primary screen title heading */}
      <p className="text-[#4A5F7F] font-sans text-sm mb-6"> {/* Subtitle container block */}
        Review and approve student trip documents {/* Page instructions helper text */}
      </p> {/* End subtitle paragraph */}
      {statusMessage && ( // Conditional rendering for active success alerts
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 max-w-2xl"> {/* Green border box layout */}
          <p className="text-green-400 font-sans text-sm">{statusMessage}</p> {/* Output success string */}
        </div> // End success container box
      )} {/* Close success conditional check */}
      {error && ( // Conditional rendering for active error alerts
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl"> {/* Red border box layout */}
          <p className="text-red-400 font-sans text-sm">{error}</p> {/* Output error string */}
        </div> // End error container box
      )} {/* Close error conditional check */}
      <div className="flex gap-2 mb-6 flex-wrap"> {/* Flex container row for status filters */}
        {['Pending', 'Approved', 'Rejected', 'All'].map((status) => ( // Loop through status categories list
          <button // Filter trigger button
            key={status} // Bind key
            onClick={() => setStatusFilter(status)} // Set selected status filter value on click
            className={`px-4 py-2 rounded-lg font-sans text-xs font-semibold uppercase tracking-wide transition-all ${ // Base styles
              statusFilter === status // If this status button is active
                ? 'bg-gold text-charcoal' // Golden high-contrast active style
                : 'bg-white/5 text-[#5A6F8F] hover:bg-white/10' // Else fallback muted styling
            }`} // End style injection
          > {/* Button text label */}
            {status} {/* Label matching status string */}
          </button> // Close filter button tag
        ))} {/* Close button loops mapping */}
      </div> {/* End filter buttons container row */}
      {loading ? ( // Conditional render for active loading states
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Glowing gold style */}
          Loading Documents... {/* Loading placeholder string */}
        </p> // End loading placeholder tag
      ) : filteredDocuments.length === 0 ? ( // Nested check if filtered documents list is empty
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E5EDFF] max-w-md"> {/* Muted layout card */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Soft styling text info */}
            No documents found for this filter. {/* Static message string */}
          </p> {/* End empty message paragraph */}
        </div> // End empty card wrapper
      ) : ( // Render document lists review cards when matching records exist
        <div className="space-y-3 max-w-3xl"> {/* Vertical slot list stack */}
          {filteredDocuments.map((doc) => ( // Loop through each uploaded document object
            <div key={doc.id} className="bg-white rounded-2xl p-5 border border-[#E5EDFF]"> {/* Card wrapper container */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2"> {/* Row of student details */}
                <div> {/* Left columns metadata */}
                  <p className="text-[#1E3A5F] font-sans text-sm font-semibold"> {/* Student name paragraph */}
                    {doc.profiles?.full_name} — {doc.doc_type} {/* Student name and document category */}
                  </p> {/* Close name layout */}
                  <p className="text-[#4A5F7F] font-sans text-xs"> {/* Trip and versions metadata */}
                    Trip: {doc.trips?.title} • Version {doc.version} {/* Trip title and file version */}
                  </p> {/* Close metadata paragraph */}
                </div> {/* Close left metadata columns */}
                <span className={`text-xs font-sans font-semibold uppercase tracking-wide px-2 py-1 rounded ${statusColors[doc.status]}`}> {/* Badge wrapper */}
                  {doc.status} {/* Badge enum string labels */}
                </span> {/* Close badge tag */}
              </div> {/* End row container */}
              <div className="mb-3"> {/* File preview links container */}
                <button // Secure file view trigger button
                  onClick={() => handleViewFile(doc.file_path)} // Generate and open signed URL in new tab on click
                  className="text-cyan-main font-sans text-xs hover:text-cyan-300 transition-colors" // Cyan link styles
                > {/* Button text layout wrapper */}
                  📎 View {doc.file_name} {/* Document attachment labels with filename */}
                </button> {/* Close file view button */}
              </div> {/* Close preview link container */}
              <p className="text-white/30 font-sans text-xs mb-3"> {/* Timestamp container block */}
                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()} {/* Formatted dates string */}
              </p> {/* End timestamp paragraph */}
              {doc.status === 'Rejected' && doc.feedback && ( // Display previous corrective notes if rejected
                <p className="text-red-400 font-sans text-xs mb-3"> {/* Red feedback text styling */}
                  Previous feedback: {doc.feedback} {/* Feedback description string */}
                </p> // Close feedback paragraph
              )} {/* Close feedback conditional check */}
              {rejectingId === doc.id ? ( // Conditional render for corrective feedback input form
                <div className="mb-1"> {/* Form layout container */}
                  <textarea // Multiline feedback reason typing box
                    value={rejectFeedback} // Bind state value
                    onChange={(e) => setRejectFeedback(e.target.value)} // Update state on change
                    placeholder="Explain what needs to be corrected" // Guidance helper placeholder
                    rows={2} // Set layout height rows
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none mb-2" // Styled textarea box
                  /> {/* Close textarea tag */}
                  <div className="flex gap-2"> {/* Confirmation buttons row */}
                    <button // Confirm rejection button
                      onClick={() => handleConfirmReject(doc)} // Submit confirm reject on click
                      disabled={processingId === doc.id} // Disable during operations
                      className="flex-1 bg-red-500 text-[#1E3A5F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Solid red style
                    > {/* Button contents wrapper */}
                      Confirm Rejection {/* Button text labels */}
                    </button> {/* Close confirm button */}
                    <button // Cancel action button
                      onClick={() => setRejectingId(null)} // Reset rejecting states on click
                      className="flex-1 bg-white/5 text-[#6B7F9F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:bg-white/10 transition-all" // Cancel style buttons
                    > {/* Button contents wrapper */}
                      Cancel {/* Button label markup */}
                    </button> {/* Close cancel button */}
                  </div> {/* End buttons row wrapper */}
                </div> // End form block
              ) : ( // Render review buttons while document status remains Pending
                doc.status === 'Pending' && ( // Verify status is Pending
                  <div className="flex gap-2"> {/* Row of decision action buttons */}
                    <button // Approve button
                      onClick={() => handleApprove(doc)} // Execute approval on click
                      disabled={processingId === doc.id} // Disable during active actions
                      className="flex-1 bg-green-500 text-[#1E3A5F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Green style buttons
                    > {/* Button contents wrapper */}
                      {processingId === doc.id ? 'Processing...' : 'Approve'} {/* Display action or loading states */}
                    </button> {/* Close approval button */}
                    <button // Reject button opening correction text area
                      onClick={() => handleStartReject(doc.id)} // Open rejection textarea input panel on click
                      disabled={processingId === doc.id} // Disable during active operations
                      className="flex-1 bg-white/5 text-[#6B7F9F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-all" // Muted gray outlines
                    > {/* Button contents wrapper */}
                      Reject {/* Action button label */}
                    </button> {/* Close reject button */}
                  </div> // End action buttons row container
                ) // End of inner conditional checks
              )} {/* End rejection form check block */}
            </div> // End document card container wrapper
          ))} {/* Close map loop block */}
        </div> // End vertical list container
      )} {/* Close documents empty validation checks block */}
    </div> // End page viewport wrapper
  ) // End return block
} // End DocumentReviewPage component definition
export default DocumentReviewPage // Export default document review page component
