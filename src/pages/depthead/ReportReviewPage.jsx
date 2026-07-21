// Import React hook elements to maintain state and coordinate lifecycles
import { useState, useEffect } from 'react' // Import React hook variables
// Import report service backend methods to fetch, view, progress, and rate student files
import { fetchAllReportsForReview, getReportSignedUrl, markReportUnderReview, rateReport } from '../../lib/reportService' // Import report review services
// Define main functional component for Department Head Report Review page
function ReportReviewPage() { // Begin ReportReviewPage definition
  // React state storing the full list of student reports fetched from the database
  const [reports, setReports] = useState([]) // Setup reports list state
  // Maintain loading boolean status to control active layout loaders
  const [loading, setLoading] = useState(true) // Setup loading boolean state
  // Track selected tab status filter to focus review screens
  const [statusFilter, setStatusFilter] = useState('Submitted') // Setup active tab filter state
  // Track which report ID is actively opening the numeric scoring form
  const [ratingId, setRatingId] = useState(null) // Setup scoring target id state
  // Store typed numeric score value out of 100 before database execution
  const [ratingValue, setRatingValue] = useState('') // Setup rating numeric text input state
  // Store written commentary feedback typed inside rating popup panels
  const [feedbackValue, setFeedbackValue] = useState('') // Setup written feedback textarea input state
  // Track which report ID is actively performing database transactions to lock buttons
  const [processingId, setProcessingId] = useState(null) // Setup operational lock id state
  // Maintain temporary success notification alert banner description text
  const [statusMessage, setStatusMessage] = useState('') // Setup success status feedback banner state
  // Maintain temporary error warning description labels
  const [error, setError] = useState('') // Setup error warning banner state
  // Fetch fresh reports records list joined with student and trip information
  const loadReports = async () => { // Begin loadReports async definition
    setLoading(true) // Activate page loading indicator
    const { reports: data } = await fetchAllReportsForReview() // Run database query fetching reports list
    setReports(data) // Save retrieved reports datasets to state
    setLoading(false) // Deactivate page loading indicator
  } // End loadReports function
  // Fetch required database records exactly once upon initial page mount
  useEffect(() => { // Begin useEffect hook
    loadReports() // Invoke data load actions helper
  }, []) // Bind empty array to mounting phase only
  // Display temporary success alerts that automatically fade after three seconds
  const showStatus = (message) => { // Begin showStatus definition
    setStatusMessage(message) // Store message string inside status state variable
    setTimeout(() => setStatusMessage(''), 3000) // Trigger timer to clear status state after three seconds
  } // End showStatus helper function
  // Asynchronous handler to open secure private file preview in a new browser tab
  const handleViewFile = async (filePath) => { // Begin handleViewFile definition
    const { signedUrl, error: urlError } = await getReportSignedUrl(filePath) // Request a temporary private signed url
    if (signedUrl) { // If secure URL generation succeeded
      window.open(signedUrl, '_blank') // Open secure document address in a new tab securely
    } else { // Check if generation returned storage errors
      setError('Could not open file. Please try again.') // Highlight warning feedback description
    } // End of conditional check block
  } // End handleViewFile function
  // Transition newly submitted reports into Under Review status
  const handleMarkUnderReview = async (report) => { // Begin handleMarkUnderReview definition
    setProcessingId(report.id) // Disable button interactions during update activities
    const { error: updateError } = await markReportUnderReview(report.id) // Run status update backend service
    setProcessingId(null) // Re-enable user interaction controls
    if (updateError) { // Check if query execution returned database error
      setError('Could not update status. Please try again.') // Highlight warning feedback description
      return // Halt execution
    } // End of error validation check block
    setReports(reports.map((r) => // Update local list state to match new database status
      r.id === report.id ? { ...r, status: 'Under Review' } : r // Map updated status attribute
    )) // Close local list mapping update
    showStatus(`Report marked as Under Review.`) // Display temporary success alert
  } // End handleMarkUnderReview function
  // Prepare a specific report row for rating form input entry
  const handleStartRating = (reportId) => { // Begin handleStartRating definition
    setRatingId(reportId) // Map targeted report ID to rating trigger state
    setRatingValue('') // Reset typed numeric score state
    setFeedbackValue('') // Reset written feedback text state
    setError('') // Clear any active page error warning alerts
  } // End handleStartRating function
  // Submit final numeric rating and written corrective feedback text
  const handleSubmitRating = async (report) => { // Begin handleSubmitRating definition
    setError('') // Reset any active error warning alerts
    const numericRating = parseInt(ratingValue) // Parse typed score input string into an integer
    // Enforce range of scores strictly between 0 and 100 matching db check constraints
    if (isNaN(numericRating) || numericRating < 0 || numericRating > 100) { // Validate numeric boundary ranges
      setError('Rating must be a number between 0 and 100.') // Display validation error message
      return // Stop transaction execution
    } // End score range validation check block
    // Ensure corrective written feedback comment is not empty or white space
    if (!feedbackValue.trim()) { // Verify text presence
      setError('Please provide written feedback.') // Require typed feedback notes
      return // Stop transaction execution
    } // End written feedback validation check block
    setProcessingId(report.id) // Disable button interactions during rating updates
    const { error: rateError } = await rateReport( // Call report service rate method
      report.id, // Target report identifier
      report.student_id, // Student user identifier
      report.trips?.title || 'the trip', // Parent trip title description
      numericRating, // Validated numeric rating value (0-100)
      feedbackValue.trim() // Corrective action written feedback notes
    ) // End rating transaction call
    setProcessingId(null) // Re-enable user interaction controls
    if (rateError) { // Check if transaction returned database execution errors
      setError('Rating submission failed. Please try again.') // Highlight warning feedback description
      return // Halt execution
    } // End of database error validation block
    setReports(reports.map((r) => // Update local list state to match Rated status and values
      r.id === report.id // If mapping target match
        ? { ...r, status: 'Rated', rating: numericRating, feedback: feedbackValue.trim() } // Assign updated keys
        : r // Else preserve previous object row
    )) // Close local list mapping update
    setRatingId(null) // Close input text scoring box panel
    showStatus(`Report rated ${numericRating}/100 for ${report.profiles?.full_name || 'Student'}.`) // Print success alert
  } // End handleSubmitRating function
  // Filter the full reports array matching currently selected filter tab
  const filteredReports = statusFilter === 'All' // If All tab is active
    ? reports // Return full list
    : reports.filter((r) => r.status === statusFilter) // Else filter rows by matching status enum string
  // Mapping of CSS styles corresponding to each report status badge
  const statusColors = { // Setup statusColors mapping object
    Submitted: 'bg-yellow-500/20 text-yellow-400', // Yellow badge style for newly submitted file
    'Under Review': 'bg-cyan-main/20 text-cyan-main', // Cyan badge style for file under active review
    Rated: 'bg-green-500/20 text-green-400', // Green badge style for completed and graded files
  } // End statusColors definition
  // Render main Department Head Report Review layout structure
  return ( // Begin main layout JSX return
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Viewport page container wrapper */}
      <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Trip Report Review</h1> {/* Primary screen title heading */}
      <p className="text-[#4A5F7F] font-sans text-sm mb-6"> {/* Subtitle container block */}
        Review and rate student trip reports {/* Page instructions helper text */}
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
        {['Submitted', 'Under Review', 'Rated', 'All'].map((status) => ( // Loop through status categories list
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
          Loading Reports... {/* Loading placeholder string */}
        </p> // End placeholder paragraph
      ) : filteredReports.length === 0 ? ( // Nested check if filtered reports array list is empty
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E5EDFF] max-w-md"> {/* Dark empty notice card */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Soft text description styling */}
            No reports found for this filter. {/* Empty notice description */}
          </p> {/* End alert paragraph */}
        </div> // End notice card wrapper
      ) : ( // Render reports cards review lists when matching rows exist
        <div className="space-y-3 max-w-3xl"> {/* Vertical slot list stack */}
          {filteredReports.map((report) => ( // Loop through each submitted report object
            <div key={report.id} className="bg-white rounded-2xl p-5 border border-[#E5EDFF]"> {/* Card wrapper container */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2"> {/* Row of student details */}
                <div> {/* Left metadata columns */}
                  <p className="text-[#1E3A5F] font-sans text-sm font-semibold"> {/* Student name paragraph */}
                    {report.profiles?.full_name} — Report {report.report_number} {/* Student full name and report index */}
                  </p> {/* Close student name label */}
                  <p className="text-[#4A5F7F] font-sans text-xs"> {/* Trip title and file extension indicators */}
                    Trip: {report.trips?.title} • {report.file_type.toUpperCase()} {/* Parent trip title and document type */}
                  </p> {/* Close metadata paragraph */}
                </div> {/* Close left metadata columns wrapper */}
                <span className={`text-xs font-sans font-semibold uppercase tracking-wide px-2 py-1 rounded ${statusColors[report.status]}`}> {/* Badge wrapper */}
                  {report.status} {/* Badge enum string labels */}
                </span> {/* Close status badge tag */}
              </div> {/* End details row container */}
              <div className="mb-3"> {/* Preview link layout container */}
                <button // Secure file preview trigger button
                  onClick={() => handleViewFile(report.file_path)} // Generate and open temporary signed url on click
                  className="text-cyan-main font-sans text-xs hover:text-cyan-300 transition-colors" // Cyan link styles
                > {/* Button text label */}
                  📎 View {report.file_name} {/* Document attachment labels with filename */}
                </button> {/* Close file view button */}
              </div> {/* Close preview link container */}
              <p className="text-white/30 font-sans text-xs mb-3"> {/* Timestamp container block */}
                Submitted: {new Date(report.submitted_at).toLocaleDateString()} {/* Formatted dates string */}
              </p> {/* End timestamp paragraph */}
              {report.status === 'Rated' && ( // Display final scoring grading information if Rated
                <div className="p-3 bg-white/5 rounded-lg mb-1"> {/* Graded display block container */}
                  <p className="text-gold font-serif text-xl font-bold mb-1"> {/* Numeric score display style */}
                    {report.rating}/100 {/* Display grading score value */}
                  </p> {/* Close score wrapper */}
                  <p className="text-[#6B7F9F] font-sans text-xs">{report.feedback}</p> {/* Display grader written feedback commentary */}
                </div> // Close graded display wrapper
              )} {/* Close rated display conditional check */}
              {ratingId === report.id ? ( // Conditional render for scoring and written feedback form inputs
                <div className="mt-2"> {/* Form inputs container wrapper */}
                  <input // Score numeric range typing input box
                    type="number" // Enforce numeric type characters
                    min="0" // Secure lower boundary matching database constraint checks
                    max="100" // Secure upper boundary matching database constraint checks
                    value={ratingValue} // Bind state value
                    onChange={(e) => setRatingValue(e.target.value)} // Update score state on change
                    placeholder="Score out of 100" // Form helper placeholder
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold mb-2" // Styled input box
                  /> {/* Close score input tag */}
                  <textarea // Written commentary review feedback input box
                    value={feedbackValue} // Bind state value
                    onChange={(e) => setFeedbackValue(e.target.value)} // Update feedback state on change
                    placeholder="Written feedback on this report" // Feedback helper placeholder
                    rows={3} // Set layout height rows
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none mb-2" // Styled textarea box
                  /> {/* Close feedback textarea tag */}
                  <div className="flex gap-2"> {/* Confirmation buttons row container */}
                    <button // Submit final rating button
                      onClick={() => handleSubmitRating(report)} // Execute rating transaction submission on click
                      disabled={processingId === report.id} // Disable interactions during operation activities
                      className="flex-1 bg-gold text-charcoal font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Golden highlight styles
                    > {/* Button contents wrapper */}
                      Submit Final Rating {/* Button action labels */}
                    </button> {/* Close submit button */}
                    <button // Cancel scoring panel button
                      onClick={() => setRatingId(null)} // Reset rating trigger state on click
                      className="flex-1 bg-white/5 text-[#6B7F9F] font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:bg-white/10 transition-all" // Cancel style buttons
                    > {/* Button contents wrapper */}
                      Cancel {/* Cancel action label */}
                    </button> {/* Close cancel button */}
                  </div> {/* End confirmation buttons row */}
                </div> // End form wrapper block
              ) : ( // Else render review control action buttons while report status is not yet Rated
                report.status !== 'Rated' && ( // Verify status is not Rated
                  <div className="flex gap-2 mt-2"> {/* Row of decision action buttons */}
                    {report.status === 'Submitted' && ( // Allow progression to Under Review only if status remains Submitted
                      <button // Mark under review button
                        onClick={() => handleMarkUnderReview(report)} // Execute status update transaction on click
                        disabled={processingId === report.id} // Disable during operations
                        className="flex-1 bg-cyan-main text-charcoal font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Cyan style button
                      > {/* Button contents wrapper */}
                        Mark Under Review {/* Action button label */}
                      </button> // Close mark under review button
                    )} {/* Close Submitted condition block check */}
                    <button // Trigger rating inputs form button
                      onClick={() => handleStartRating(report.id)} // Open scoring and feedback text areas on click
                      disabled={processingId === report.id} // Disable during operations
                      className="flex-1 bg-gold text-charcoal font-sans text-xs font-semibold uppercase tracking-wide py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all" // Golden styles button
                    > {/* Button contents wrapper */}
                      Rate Report {/* Action button label */}
                    </button> {/* Close rating trigger button */}
                  </div> // End action buttons row container
                ) // End status verification check
              )} {/* End rating form check conditional block */}
            </div> // End document card container wrapper
          ))} {/* Close map loops block */}
        </div> // End vertical list container
      )} {/* Close reports empty validation check block */}
    </div> // End page viewport wrapper
  ) // End return block
} // End ReportReviewPage component definition
export default ReportReviewPage // Export default report review page component
