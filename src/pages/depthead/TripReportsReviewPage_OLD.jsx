// Import React hooks for state management and lifecycle
import { useState, useEffect } from 'react' // Import useState and useEffect hooks from React

// Import report review service functions
import { // Begin import of report review service functions
  fetchAllReports, // Import function to fetch all reports with filters
  updateReportStatus, // Import function to update report status
  getReportDownloadUrl, // Import function to generate download URL
} from '../../lib/depthead/reportReviewService' // Import from department head report review service

// Import status color helper from shared service
import { getStatusColor } from '../../lib/reportService' // Import function to get status badge colors

// Import supabase for fetching filter options
import { supabase } from '../../lib/supabase' // Import Supabase client

// TripReportsReviewPage component for department head to review all trip reports
function TripReportsReviewPage() { // Define main component function
  const [reports, setReports] = useState([]) // State to store filtered reports
  const [loading, setLoading] = useState(true) // State to track loading status
  const [processing, setProcessing] = useState(null) // State to track which report is being processed
  const [error, setError] = useState(null) // State to store error messages
  const [success, setSuccess] = useState(null) // State to store success messages

  // Filter states
  const [filterTripId, setFilterTripId] = useState('') // State for trip filter
  const [filterStudentId, setFilterStudentId] = useState('') // State for student filter
  const [filterStatus, setFilterStatus] = useState('') // State for status filter

  // Filter options
  const [trips, setTrips] = useState([]) // State to store trips for filter dropdown
  const [students, setStudents] = useState([]) // State to store students for filter dropdown

  // Rejection feedback state
  const [rejectingReportId, setRejectingReportId] = useState(null) // State to track which report is being rejected
  const [rejectionFeedback, setRejectionFeedback] = useState('') // State to store rejection feedback text

  // Load filter options on mount
  useEffect(() => { // Define effect to run on mount
    loadFilterOptions() // Call function to load filter options
  }, []) // Run only once on mount

  // Load reports whenever filters change
  useEffect(() => { // Define effect to run when filters change
    loadReports() // Call function to load reports
  }, [filterTripId, filterStudentId, filterStatus]) // Re-run when any filter changes

  // loadFilterOptions fetches trips and students for filter dropdowns
  async function loadFilterOptions() { // Define async function to load filter options
    // Fetch all trips
    const { data: tripsData } = await supabase // Query trips table
      .from('trips') // Target trips table
      .select('id, title') // Select ID and title
      .order('title') // Sort by title alphabetically

    // Fetch all students who have submitted reports
    const { data: studentsData } = await supabase // Query profiles table
      .from('profiles') // Target profiles table
      .select('id, full_name, student_id_number') // Select ID, name, and student number
      .eq('role', 'student') // Filter by student role
      .order('full_name') // Sort by name alphabetically

    setTrips(tripsData || []) // Set trips state
    setStudents(studentsData || []) // Set students state
  } // End loadFilterOptions function

  // loadReports fetches reports based on current filters
  async function loadReports() { // Define async function to load reports
    setLoading(true) // Set loading state to true
    setError(null) // Clear any previous errors

    // Build filter object
    const filters = {} // Initialize empty filters object
    if (filterTripId) filters.tripId = filterTripId // Add trip filter if set
    if (filterStudentId) filters.studentId = filterStudentId // Add student filter if set
    if (filterStatus) filters.status = filterStatus // Add status filter if set

    // Fetch reports with filters
    const { reports: fetchedReports, error: fetchError } = await fetchAllReports(filters) // Fetch filtered reports
    
    if (fetchError) { // If error fetching reports
      setError('Failed to load reports. Please try again.') // Set error message
      setLoading(false) // Stop loading
      return // Exit function
    } // End error check

    setReports(fetchedReports || []) // Set reports state
    setLoading(false) // Stop loading
  } // End loadReports function

  // handleDownload generates and opens download URL
  async function handleDownload(filePath) { // Define async function to handle download
    const { url, error: downloadError } = await getReportDownloadUrl(filePath) // Generate signed URL
    if (downloadError || !url) { // If error generating URL
      setError('Failed to generate download link.') // Set error message
      return // Exit function
    } // End error check
    window.open(url, '_blank') // Open download URL in new tab
  } // End handleDownload function

  // handleStatusChange updates report status
  async function handleStatusChange(report, newStatus, feedback = null) { // Define async function to update status
    setProcessing(report.id) // Set processing state to this report ID
    setError(null) // Clear any previous errors
    setSuccess(null) // Clear any previous success messages

    // Call update function
    const { error: updateError } = await updateReportStatus({ // Update report status
      reportId: report.id, // Pass report ID
      studentId: report.student_id, // Pass student ID for notification
      tripTitle: report.trips?.title || 'the trip', // Pass trip title for notification
      newStatus, // Pass new status
      feedback, // Pass feedback if provided
    }) // End updateReportStatus call

    if (updateError) { // If update failed
      setError('Failed to update report status. Please try again.') // Set error message
      setProcessing(null) // Clear processing state
      return // Exit function
    } // End error check

    // Success - reload reports
    setSuccess(`Report status updated to ${newStatus} successfully!`) // Set success message
    setProcessing(null) // Clear processing state
    setRejectingReportId(null) // Clear rejecting state
    setRejectionFeedback('') // Clear rejection feedback
    await loadReports() // Reload reports

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000) // Clear success message after delay
  } // End handleStatusChange function

  // handleReject opens rejection feedback input
  function handleRejectClick(reportId) { // Define function to handle reject button click
    setRejectingReportId(reportId) // Set rejecting state to this report ID
    setRejectionFeedback('') // Clear feedback text
  } // End handleRejectClick function

  // handleRejectSubmit submits rejection with feedback
  async function handleRejectSubmit(report) { // Define async function to submit rejection
    if (!rejectionFeedback.trim()) { // If no feedback provided
      setError('Please provide feedback for rejection.') // Set error message
      return // Exit function
    } // End feedback check

    await handleStatusChange(report, 'Rejected', rejectionFeedback) // Update status to Rejected with feedback
  } // End handleRejectSubmit function

  if (loading) { // If data is loading
    return ( // Return loading UI
      <div className="min-h-screen bg-gray-50 p-8"> {/* Main container with padding and background */}
        <div className="max-w-7xl mx-auto"> {/* Centered content container */}
          <div className="text-center py-12"> {/* Centered text container */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div> {/* Loading spinner */}
            <p className="mt-4 text-gray-600">Loading reports...</p> {/* Loading text */}
          </div> {/* End centered container */}
        </div> {/* End content container */}
      </div> // End main container
    ) // End return
  } // End loading check

  return ( // Return main component UI
    <div className="min-h-screen bg-gray-50 p-8"> {/* Main container with padding and background */}
      <div className="max-w-7xl mx-auto"> {/* Centered content container */}
        {/* Header */}
        <div className="mb-8"> {/* Header section with margin */}
          <h1 className="text-3xl font-bold text-gray-900">Trip Reports Review</h1> {/* Page title */}
          <p className="mt-2 text-gray-600">Review and manage all student trip reports</p> {/* Page description */}
        </div> {/* End header section */}

        {/* Error Message */}
        {error && ( // If error exists
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"> {/* Error alert box */}
            {error} {/* Display error message */}
          </div> // End error box
        )} {/* End error conditional */}

        {/* Success Message */}
        {success && ( // If success message exists
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"> {/* Success alert box */}
            {success} {/* Display success message */}
          </div> // End success box
        )} {/* End success conditional */}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6"> {/* Filters card container */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2> {/* Filters section title */}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Grid layout for filters */}
            {/* Trip Filter */}
            <div> {/* Trip filter container */}
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Trip</label> {/* Filter label */}
              <select // Trip filter dropdown
                value={filterTripId} // Bind to filter state
                onChange={(e) => setFilterTripId(e.target.value)} // Update filter on change
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Dropdown styling
              >
                <option value="">All Trips</option> {/* Default option */}
                {trips.map((trip) => ( // Map over trips
                  <option key={trip.id} value={trip.id}>{trip.title}</option> // Trip option
                ))} {/* End map */}
              </select> {/* End dropdown */}
            </div> {/* End trip filter */}

            {/* Student Filter */}
            <div> {/* Student filter container */}
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Student</label> {/* Filter label */}
              <select // Student filter dropdown
                value={filterStudentId} // Bind to filter state
                onChange={(e) => setFilterStudentId(e.target.value)} // Update filter on change
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Dropdown styling
              >
                <option value="">All Students</option> {/* Default option */}
                {students.map((student) => ( // Map over students
                  <option key={student.id} value={student.id}> {/* Student option */}
                    {student.full_name} ({student.student_id_number}) {/* Display name and student number */}
                  </option> // End option
                ))} {/* End map */}
              </select> {/* End dropdown */}
            </div> {/* End student filter */}

            {/* Status Filter */}
            <div> {/* Status filter container */}
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label> {/* Filter label */}
              <select // Status filter dropdown
                value={filterStatus} // Bind to filter state
                onChange={(e) => setFilterStatus(e.target.value)} // Update filter on change
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Dropdown styling
              >
                <option value="">All Statuses</option> {/* Default option */}
                <option value="Pending">Pending</option> {/* Pending option */}
                <option value="Under Review">Under Review</option> {/* Under Review option */}
                <option value="Approved">Approved</option> {/* Approved option */}
                <option value="Rejected">Rejected</option> {/* Rejected option */}
              </select> {/* End dropdown */}
            </div> {/* End status filter */}
          </div> {/* End filters grid */}
        </div> {/* End filters card */}

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden"> {/* Reports card container */}
          <div className="px-6 py-4 border-b border-gray-200"> {/* Card header */}
            <h2 className="text-lg font-semibold text-gray-900">Reports ({reports.length})</h2> {/* Title with count */}
          </div> {/* End card header */}

          {reports.length === 0 ? ( // If no reports found
            <div className="text-center py-12 text-gray-500"> {/* Empty state container */}
              <p>No reports found matching the selected filters.</p> {/* Empty state message */}
            </div> // End empty state
          ) : ( // Else if reports exist
            <div className="divide-y divide-gray-200"> {/* Container for report rows with dividers */}
              {reports.map((report) => ( // Map over reports
                <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors"> {/* Report row */}
                  <div className="flex items-start justify-between"> {/* Flex container for report info */}
                    <div className="flex-1"> {/* Report information section */}
                      {/* Student Info */}
                      <div className="flex items-center gap-3 mb-2"> {/* Student info row */}
                        <h3 className="font-semibold text-gray-900">{report.profiles?.full_name || 'Unknown Student'}</h3> {/* Student name */}
                        <span className="text-sm text-gray-500">({report.profiles?.student_id_number || 'N/A'})</span> {/* Student number */}
                      </div> {/* End student info */}

                      {/* Trip Info */}
                      <p className="text-sm text-gray-700 mb-1">Trip: {report.trips?.title || 'Unknown Trip'}</p> {/* Trip title */}
                      <p className="text-sm text-gray-600 mb-1">Destination: {report.trips?.destination || 'N/A'}</p> {/* Trip destination */}
                      
                      {/* File Info */}
                      <p className="text-sm text-gray-600 mb-1">File: {report.file_name}</p> {/* File name */}
                      <p className="text-xs text-gray-500">Submitted: {new Date(report.submitted_at).toLocaleDateString()}</p> {/* Submission date */}
                      {report.reviewed_at && ( // If report has been reviewed
                        <p className="text-xs text-gray-500">Reviewed: {new Date(report.reviewed_at).toLocaleDateString()}</p> // Review date
                      )} {/* End reviewed date conditional */}

                      {/* Status Badge */}
                      <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}> {/* Status badge with dynamic colors */}
                        {report.status} {/* Status text */}
                      </span> {/* End status badge */}

                      {/* Feedback if rejected */}
                      {report.status === 'Rejected' && report.feedback && ( // If report is rejected and has feedback
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"> {/* Feedback container */}
                          <p className="text-sm font-semibold text-red-900">Rejection Feedback:</p> {/* Feedback label */}
                          <p className="text-sm text-red-700 mt-1">{report.feedback}</p> {/* Feedback text */}
                        </div> // End feedback container
                      )} {/* End feedback conditional */}

                      {/* Rejection Feedback Input */}
                      {rejectingReportId === report.id && ( // If this report is being rejected
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"> {/* Feedback input container */}
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Rejection Feedback (required):</label> {/* Input label */}
                          <textarea // Feedback textarea
                            value={rejectionFeedback} // Bind to feedback state
                            onChange={(e) => setRejectionFeedback(e.target.value)} // Update feedback on change
                            rows={3} // Set textarea height
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Textarea styling
                            placeholder="Explain why this report is being rejected..." // Placeholder text
                          /> {/* End textarea */}
                          <div className="flex gap-2 mt-2"> {/* Button container */}
                            <button // Submit rejection button
                              onClick={() => handleRejectSubmit(report)} // Handle rejection submit
                              disabled={processing === report.id} // Disable during processing
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm" // Button styling
                            >
                              {processing === report.id ? 'Rejecting...' : 'Submit Rejection'} {/* Button text */}
                            </button> {/* End submit button */}
                            <button // Cancel button
                              onClick={() => setRejectingReportId(null)} // Clear rejecting state
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm" // Button styling
                            >
                              Cancel {/* Button text */}
                            </button> {/* End cancel button */}
                          </div> {/* End button container */}
                        </div> // End feedback input container
                      )} {/* End rejection input conditional */}
                    </div> {/* End report info */}

                    <div className="ml-6 flex flex-col gap-2"> {/* Action buttons section */}
                      {/* Download Button */}
                      <button // Download button
                        onClick={() => handleDownload(report.file_path)} // Handle download on click
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap" // Button styling
                      >
                        Download {/* Button text */}
                      </button> {/* End download button */}

                      {/* Action Buttons - only show if not already approved/rejected and not currently rejecting */}
                      {report.status !== 'Approved' && report.status !== 'Rejected' && rejectingReportId !== report.id && ( // If report can be acted upon
                        <> {/* Fragment to group multiple elements */}
                          {/* Mark Under Review Button */}
                          {report.status === 'Pending' && ( // If status is Pending
                            <button // Under Review button
                              onClick={() => handleStatusChange(report, 'Under Review')} // Handle status change
                              disabled={processing === report.id} // Disable during processing
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors text-sm whitespace-nowrap" // Button styling
                            >
                              {processing === report.id ? 'Processing...' : 'Mark Under Review'} {/* Button text */}
                            </button> // End under review button
                          )} {/* End pending check */}

                          {/* Approve Button */}
                          <button // Approve button
                            onClick={() => handleStatusChange(report, 'Approved')} // Handle approval
                            disabled={processing === report.id} // Disable during processing
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm whitespace-nowrap" // Button styling
                          >
                            {processing === report.id ? 'Processing...' : 'Approve'} {/* Button text */}
                          </button> {/* End approve button */}

                          {/* Reject Button */}
                          <button // Reject button
                            onClick={() => handleRejectClick(report.id)} // Handle reject click to show feedback input
                            disabled={processing === report.id} // Disable during processing
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm whitespace-nowrap" // Button styling
                          >
                            Reject {/* Button text */}
                          </button> {/* End reject button */}
                        </> // End fragment
                      )} {/* End action buttons conditional */}
                    </div> {/* End action buttons */}
                  </div> {/* End flex container */}
                </div> // End report row
              ))} {/* End map */}
            </div> // End reports container
          )} {/* End reports check */}
        </div> {/* End reports card */}
      </div> {/* End content container */}
    </div> // End main container
  ) // End return
} // End TripReportsReviewPage component

export default TripReportsReviewPage // Export component as default
