// Import React hooks for state management and lifecycle
import { useState, useEffect } from 'react' // Import useState and useEffect hooks from React
import { useParams } from 'react-router-dom' // Import useParams hook to extract tripId from URL route parameters

// Import authentication context to get current user
import { useAuth } from '../../context/AuthContext' // Import useAuth hook to access authenticated user data

// Import supabase client for direct database queries in trip-specific route
import { supabase } from '../../lib/supabase' // Import Supabase client for database operations

// Import report service functions
import { // Begin import of report service functions
  fetchMyAllReports, // Import function to fetch all student's reports
  fetchMyReport, // Import function to fetch single report for specific trip
  fetchCompletedTrips, // Import function to fetch eligible completed trips
  uploadOrReplaceReport, // Import function to upload or replace a report
  validateFile, // Import function to validate file before upload
  getStatusColor, // Import function to get status badge colors
  getDownloadUrl, // Import function to generate download URL
} from '../../lib/reportService' // Import from report service module

// MyReportsPage component displays all trip reports for the logged-in student with improved organization
// Shows eligible trips (Approved registration + Completed trip status) and all submitted reports
// ALSO handles trip-specific route /student/trips/:id/reports by filtering to show only that trip's report
function MyReportsPage() { // Define main component function (renamed from TripReportsPage)
  const { user } = useAuth() // Get authenticated user from context
  const { id: routeTripId } = useParams() // Extract tripId from URL route parameter if accessing via /student/trips/:id/reports
  const [reports, setReports] = useState([]) // State to store all student's reports
  const [completedTrips, setCompletedTrips] = useState([]) // State to store trips eligible for report submission
  const [loading, setLoading] = useState(true) // State to track loading status
  const [uploading, setUploading] = useState(false) // State to track upload in progress
  const [selectedTripId, setSelectedTripId] = useState(null) // State to store trip ID being uploaded to
  const [selectedFile, setSelectedFile] = useState(null) // State to store selected file for upload
  const [error, setError] = useState(null) // State to store error messages
  const [success, setSuccess] = useState(null) // State to store success messages

  // Determine if this is a trip-specific view based on URL route parameter
  const isTripSpecific = !!routeTripId // Boolean flag - true if accessing via /student/trips/:id/reports route

  // Load reports and completed trips on component mount
  useEffect(() => { // Define effect to run on mount
    loadData() // Call function to load all data
  }, [user?.id, routeTripId]) // Re-run effect if user ID changes OR routeTripId changes (switching between trips)

  // loadData fetches both reports and eligible trips
  // If routeTripId exists (trip-specific route), fetch trip data directly and check for report
  async function loadData() { // Define async function to load all data
    if (!user?.id) return // Exit if no user ID available

    setLoading(true) // Set loading state to true
    setError(null) // Clear any previous errors

    if (isTripSpecific && routeTripId) { // If accessing trip-specific route, fetch ONLY this trip's report and trip data
      // Fetch single report for THIS specific trip only using trip-scoped query
      const { report: fetchedReport, error: reportError } = await fetchMyReport(user.id, routeTripId) // Fetch report scoped to student AND this specific trip
      if (reportError) { // If error fetching report
        setError('Failed to load report. Please try again.') // Set error message
        setLoading(false) // Stop loading
        return // Exit function
      } // End error check

      // Set reports array with single trip-specific report or empty array if no report exists yet
      setReports(fetchedReport ? [fetchedReport] : []) // Wrap single report in array or use empty array if null

      // Fetch this specific trip's data directly from registrations table (don't rely on fetchCompletedTrips filtering by end_date)
      const { data: regData, error: tripError } = await supabase // Execute Supabase query to get trip data
        .from('registrations') // Target registrations table
        .select('trip_id, trips(id, title, destination, end_date, status)') // Select trip ID and join with trips for full trip details
        .eq('student_id', user.id) // Filter by student ID
        .eq('trip_id', routeTripId) // Filter by THIS specific trip ID from URL
        .eq('status', 'Approved') // Only include if student is approved for this trip
        .maybeSingle() // Expect single result or null

      if (tripError) { // If error fetching trip data
        setError('Failed to load trip information. Please try again.') // Set error message
        setLoading(false) // Stop loading
        return // Exit function
      } // End error check

      // Set completedTrips to array containing this trip's data (even if end_date hasn't passed yet - we show upload controls on trip-specific route regardless)
      setCompletedTrips(regData ? [regData] : []) // Wrap single trip registration in array or use empty array if not found
    } else { // Else if general My Reports page (no routeTripId), fetch ALL reports for ALL trips
      // Fetch all reports across all trips
      const { reports: fetchedReports, error: reportsError } = await fetchMyAllReports(user.id) // Fetch all student's reports
      if (reportsError) { // If error fetching reports
        setError('Failed to load reports. Please try again.') // Set error message
        setLoading(false) // Stop loading
        return // Exit function
      } // End error check

      // Fetch completed trips (only trips with past end_date for general page)
      const { trips: fetchedTrips, error: tripsError } = await fetchCompletedTrips(user.id) // Fetch all eligible trips that have ended
      if (tripsError) { // If error fetching trips
        setError('Failed to load completed trips. Please try again.') // Set error message
        setLoading(false) // Stop loading
        return // Exit function
      } // End error check

      setReports(fetchedReports || []) // Set reports state with all fetched reports
      setCompletedTrips(fetchedTrips || []) // Set completed trips state with all fetched trips
    } // End trip-specific vs general page check

    setLoading(false) // Stop loading
  } // End loadData function

  // handleFileSelect is called when user selects a file
  function handleFileSelect(e, tripId) { // Define function to handle file selection
    const file = e.target.files[0] // Get selected file from input
    if (!file) return // Exit if no file selected

    const validationError = validateFile(file) // Validate file type and size
    if (validationError) { // If validation failed
      setError(validationError) // Set error message
      e.target.value = '' // Clear file input
      return // Exit function
    } // End validation check

    setSelectedFile(file) // Set selected file state
    setSelectedTripId(tripId) // Set selected trip ID state
    setError(null) // Clear any previous errors
  } // End handleFileSelect function

  // handleUpload uploads or replaces the report
  async function handleUpload() { // Define async function to handle upload
    if (!selectedFile || !selectedTripId) return // Exit if no file or trip selected

    setUploading(true) // Set uploading state to true
    setError(null) // Clear any previous errors
    setSuccess(null) // Clear any previous success messages

    // Find trip title for notification - check if trip exists in completedTrips or use routeTripId context
    const trip = completedTrips.find(t => t.trips && t.trips.id === selectedTripId) // Find trip object by ID
    const tripTitle = trip?.trips?.title || 'the trip' // Get trip title or default text

    // Call upload function - uploadOrReplaceReport will scope to THIS specific tripId passed here
    const { error: uploadError } = await uploadOrReplaceReport({ // Upload or replace report scoped to specific trip
      studentId: user.id, // Pass student ID
      tripId: selectedTripId, // Pass THIS specific trip ID (from selection or routeTripId)
      tripTitle, // Pass trip title for notifications
      file: selectedFile, // Pass selected file
    }) // End uploadOrReplaceReport call

    if (uploadError) { // If upload failed
      setError(uploadError.message || 'Failed to upload report. Please try again.') // Set error message
      setUploading(false) // Stop uploading
      return // Exit function
    } // End error check

    // Success - reload data
    setSuccess('Report uploaded successfully!') // Set success message
    setSelectedFile(null) // Clear selected file
    setSelectedTripId(null) // Clear selected trip ID
    setUploading(false) // Stop uploading
    await loadData() // Reload all data

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000) // Clear success message after delay
  } // End handleUpload function

  // handleDownload generates and opens download URL
  async function handleDownload(filePath) { // Define async function to handle download
    const { url, error: downloadError } = await getDownloadUrl(filePath) // Generate signed URL
    if (downloadError || !url) { // If error generating URL
      setError('Failed to generate download link.') // Set error message
      return // Exit function
    } // End error check
    window.open(url, '_blank') // Open download URL in new tab
  } // End handleDownload function

  // Get trips that don't have a report yet - filter with null safety to prevent crashes if trips data is malformed
  const tripsWithoutReport = completedTrips.filter( // Filter completed trips list to find trips without submitted reports
    trip => trip.trips && !reports.some(r => r.trip_id === trip.trips.id) // Check trip.trips exists AND no report exists with matching trip_id
  ) // End filter operation

  if (loading) { // If data is loading
    return ( // Return loading UI
      <div className="min-h-screen bg-gray-50 p-8"> {/* Main container with padding and background */}
        <div className="max-w-6xl mx-auto"> {/* Centered content container */}
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
      <div className="max-w-6xl mx-auto"> {/* Centered content container */}
        {/* Header - updated for My Reports */}
        <div className="mb-8"> {/* Header section with margin */}
          <h1 className="text-3xl font-bold text-gray-900">
            {isTripSpecific ? 'Trip Report' : 'My Reports'} {/* Show "Trip Report" for single trip view, "My Reports" for all trips */}
          </h1> {/* Page title dynamically changes based on route */}
          <p className="mt-2 text-gray-600">
            {isTripSpecific 
              ? 'Submit and track your report for this specific trip' // Trip-specific description
              : 'Submit and track your trip reports for completed trips' // General page description
            }
          </p> {/* Page description dynamically changes based on route */}
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

        {/* Upload Section for TRIP-SPECIFIC route - only shown when accessing /student/trips/:id/reports AND no report exists yet */}
        {isTripSpecific && reports.length === 0 && completedTrips.length > 0 && ( // If on trip-specific route AND no report submitted yet AND trip data loaded successfully
          <div className="bg-white rounded-lg shadow-md p-6 mb-8"> {/* Card container for trip-specific upload */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2"> {/* Section heading */}
              Submit Report {/* Simple heading for single trip context */}
            </h2> {/* End heading */}
            <p className="text-gray-600 mb-4"> {/* Instructional text */}
              Upload your trip report for this completed trip (PDF, DOC, or DOCX, max 7MB) {/* Instructions for single trip upload */}
            </p> {/* End instructions */}
            
            <div className="space-y-4"> {/* Container for trip card */}
              {completedTrips.map((tripReg) => ( // Map over completedTrips (should be single trip in trip-specific view) instead of tripsWithoutReport
                tripReg.trips ? ( // Null check to ensure trip data exists
                <div key={tripReg.trips.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"> {/* Trip card with standard styling */}
                  <div className="flex items-start justify-between"> {/* Flex container for trip info and upload */}
                    <div className="flex-1"> {/* Trip information section */}
                      <h3 className="font-semibold text-gray-900">{tripReg.trips.title}</h3> {/* Trip title */}
                      <p className="text-sm text-gray-600">{tripReg.trips.destination}</p> {/* Trip destination */}
                      <p className="text-xs text-gray-500 mt-1">Ended: {new Date(tripReg.trips.end_date).toLocaleDateString()}</p> {/* Trip end date */}
                    </div> {/* End trip info */}

                    <div className="ml-4"> {/* Upload controls section */}
                      <input // File input element
                        type="file" // Set input type to file
                        accept=".pdf,.doc,.docx" // Restrict to allowed file types
                        onChange={(e) => handleFileSelect(e, tripReg.trips.id)} // Handle file selection with trip ID
                        className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" // Style file input
                        disabled={uploading} // Disable during upload
                      /> {/* End file input */}
                      {selectedTripId === tripReg.trips.id && selectedFile && ( // If file selected for this trip
                        <button // Upload button
                          onClick={handleUpload} // Handle upload on click
                          disabled={uploading} // Disable during upload
                          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" // Button styling
                        >
                          {uploading ? 'Uploading...' : 'Upload Report'} {/* Button text changes during upload */}
                        </button> // End upload button
                      )} {/* End file selected conditional */}
                    </div> {/* End upload controls */}
                  </div> {/* End flex container */}
                </div> // End trip card
                ) : null // Return null if trip data is missing
              ))} {/* End map */}
            </div> {/* End trip container */}
          </div> // End upload section card
        )} {/* End trip-specific upload section */}

        {/* Upload Section - Trips without reports - Shows trips awaiting report submission */}
        {!isTripSpecific && tripsWithoutReport.length > 0 && ( // If on general My Reports page (not trip-specific) AND there are trips without reports, show this section
          <div className="bg-white rounded-lg shadow-md p-6 mb-8"> {/* Card container with white background and shadow */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2"> {/* Section heading with larger font and bold */}
              Trips Awaiting Report Submission {/* Clear heading indicating these trips need reports submitted */}
            </h2> {/* End section heading */}
            <p className="text-gray-600 mb-4"> {/* Instructional text in gray with bottom margin */}
              Submit your trip reports for these completed trips directly from this page. Accepted formats: PDF, DOC, or DOCX (max 7MB). {/* Updated instructions to emphasize inline submission capability */}
            </p> {/* End instructional text */}
            
            <div className="space-y-4"> {/* Container for trip cards with vertical spacing between each card */}
              {tripsWithoutReport.map((tripReg) => ( // Map over each completed trip that doesn't have a report yet
                tripReg.trips ? ( // Null check to ensure trip data exists before rendering card
                <div key={tripReg.trips.id} className="border-2 border-blue-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md transition-all bg-blue-50"> {/* Trip card with enhanced blue styling to emphasize action needed, hover effects for interactivity */}
                  <div className="flex items-start justify-between gap-4"> {/* Flex container for trip info and upload controls with gap spacing */}
                    <div className="flex-1"> {/* Trip information section taking available space */}
                      <h3 className="font-bold text-gray-900 text-lg">{tripReg.trips.title}</h3> {/* Trip title with larger bold font for prominence */}
                      <p className="text-sm text-gray-700 mt-1">{tripReg.trips.destination}</p> {/* Trip destination with top margin */}
                      <p className="text-xs text-gray-600 mt-2">Trip ended: {new Date(tripReg.trips.end_date).toLocaleDateString()}</p> {/* Trip end date with date formatting */}
                      <p className="text-xs text-red-600 font-semibold mt-1">⚠ Report submission required</p> {/* Added warning indicator to emphasize action needed */}
                    </div> {/* End trip info section */}

                    <div className="ml-4 min-w-[200px]"> {/* Upload controls section with left margin and minimum width for consistent sizing */}
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Report:</label> {/* Added label for file input for better UX */}
                      <input // File input element for selecting report file
                        type="file" // Set input type to file picker
                        accept=".pdf,.doc,.docx" // Restrict to allowed document file types only
                        onChange={(e) => handleFileSelect(e, tripReg.trips.id)} // Handle file selection and validate file, passing trip ID for association
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer" // Enhanced file input styling with blue button matching ETMS design
                        disabled={uploading} // Disable file input during upload to prevent multiple simultaneous uploads
                      /> {/* End file input */}
                      {selectedTripId === tripReg.trips.id && selectedFile && ( // Check if a file has been selected for THIS specific trip (not another trip in the list)
                        <button // Upload button that appears only after file selection
                          onClick={handleUpload} // Execute upload function when clicked, will call uploadOrReplaceReport service
                          disabled={uploading} // Disable button during upload to prevent duplicate submissions
                          className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold" // Green button styling to indicate positive action, disabled state styling
                        >
                          {uploading ? 'Uploading...' : 'Submit Report'} {/* Dynamic button text changes during upload to show progress, changed from "Upload" to "Submit" for clarity */}
                        </button> // End upload button
                      )} {/* End file selected conditional rendering */}
                      {selectedTripId === tripReg.trips.id && selectedFile && ( // Show selected file name for confirmation
                        <p className="text-xs text-gray-600 mt-2 truncate" title={selectedFile.name}>File: {selectedFile.name}</p> // Display selected filename with truncation for long names, full name on hover
                      )} {/* End filename display */}
                    </div> {/* End upload controls section */}
                  </div> {/* End flex container */}
                </div> // End trip card
                ) : null // Return null if trip data is missing to prevent rendering errors
              ))} {/* End map iteration */}
            </div> {/* End trips container */}
          </div> // End upload section card
        )} {/* End trips without report conditional */}

        {/* Submitted Reports Section - shows all reports that have been uploaded */}
        <div className="bg-white rounded-lg shadow-md p-6"> {/* Card container for submitted reports with white background and shadow */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4"> {/* Section heading with larger font */}
            {isTripSpecific ? 'Submitted Report' : 'My Submitted Reports'} {/* Dynamic heading - singular for trip-specific, plural for general page */}
          </h2> {/* End section heading */}
          
          {reports.length === 0 ? ( // Check if no reports have been submitted yet
            <div className="text-center py-8 text-gray-500"> {/* Empty state container with centered text */}
              <p>No reports submitted yet{isTripSpecific ? ' for this trip' : ''}.</p> {/* Empty state message with contextual suffix for trip-specific view */}
              {completedTrips.length === 0 && !isTripSpecific && ( // If also no completed trips exist AND on general page (not trip-specific)
                <p className="text-sm mt-2">You don't have any completed trips yet.</p> // Additional helper message for students with no completed trips
              )} {/* End no completed trips check */}
            </div> // End empty state container
          ) : ( // Else if reports array has items
            <div className="space-y-4"> {/* Container for report cards with vertical spacing */}
              {reports.map((report) => ( // Map over each submitted report to render a card
                <div key={report.id} className="border-2 border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"> {/* Report card with enhanced border, padding, and hover effect */}
                  <div className="flex items-start justify-between gap-4"> {/* Flex container for report info and action buttons with gap spacing */}
                    <div className="flex-1"> {/* Report information section taking available space */}
                      <h3 className="font-bold text-gray-900 text-lg">{report.trips?.title || 'Unknown Trip'}</h3> {/* Trip title with fallback for missing data, larger bold font */}
                      <p className="text-sm text-gray-600 mt-1">{report.trips?.destination || ''}</p> {/* Trip destination with fallback to empty string */}
                      <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(report.submitted_at).toLocaleDateString()}</p> {/* Submission date formatted for local timezone */}
                      <p className="text-sm text-gray-700 mt-2 font-medium">File: {report.file_name}</p> {/* File name with medium font weight for emphasis */}
                      
                      {/* Score and Grade Display - shows grading information if report has been scored */}
                      {report.score !== null && report.score !== undefined && ( // Check if score exists (not null or undefined)
                        <div className="mt-2 flex items-center gap-3"> {/* Score display container with flexbox and gap */}
                          <span className="text-sm font-semibold text-gray-900">Score: {report.score}/100</span> {/* Numeric score out of 100 */}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold"> {/* Grade badge with blue styling */}
                            Grade: {report.score >= 90 ? 'A' : report.score >= 80 ? 'B' : report.score >= 70 ? 'C' : report.score >= 60 ? 'D' : 'F'} {/* Calculate letter grade from numeric score using standard grading scale */}
                          </span> {/* End grade badge */}
                        </div> // End score display container
                      )} {/* End score conditional */}
                      
                      {/* Status Badge - shows current review status with color coding */}
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}> {/* Status badge with dynamic colors from getStatusColor helper function */}
                        {report.status} {/* Display status text (Pending, Under Review, Approved, Rejected) */}
                      </span> {/* End status badge */}

                      {/* Feedback Display - shows department head feedback if provided */}
                      {report.feedback && ( // Check if feedback exists (not null or empty)
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"> {/* Feedback container with blue background and border */}
                          <p className="text-sm font-semibold text-blue-900">Department Head Feedback:</p> {/* Feedback label with dark blue color */}
                          <p className="text-sm text-blue-700 mt-1">{report.feedback}</p> {/* Feedback text content in blue */}
                          {report.reviewed_at && ( // Check if review date exists
                            <p className="text-xs text-blue-600 mt-1">Reviewed: {new Date(report.reviewed_at).toLocaleDateString()}</p> // Display review date formatted for local timezone
                          )} {/* End review date conditional */}
                        </div> // End feedback container
                      )} {/* End feedback conditional */}
                    </div> {/* End report info section */}

                    <div className="ml-4 flex flex-col gap-2 min-w-[160px]"> {/* Action buttons section with left margin, vertical layout, gap spacing, and minimum width */}
                      {/* Download Button - always shown for any submitted report */}
                      <button // Download button element
                        onClick={() => handleDownload(report.file_path)} // Call handleDownload with file path to generate signed URL and open in new tab
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold" // Blue button styling with hover effect
                      >
                        Download {/* Button label */}
                      </button> {/* End download button */}

                      {/* Replace Button - only shown if status is Pending or Rejected (allows re-submission) */}
                      {(report.status === 'Pending' || report.status === 'Rejected') && ( // Check if report can be replaced based on status
                        <div className="space-y-2"> {/* Replace controls container with vertical spacing */}
                          <label className="block text-xs font-semibold text-gray-700">Replace Report:</label> {/* Label for replace file input for better UX */}
                          <input // File input for selecting replacement report file
                            type="file" // Set input type to file picker
                            accept=".pdf,.doc,.docx" // Restrict to allowed document file types
                            onChange={(e) => handleFileSelect(e, report.trip_id)} // Handle file selection and validate, passing trip ID to associate with this specific report
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 file:cursor-pointer cursor-pointer" // Yellow-themed file input styling to indicate replacement action
                            disabled={uploading} // Disable input during upload to prevent multiple simultaneous uploads
                          /> {/* End file input */}
                          {selectedTripId === report.trip_id && selectedFile && ( // Check if a file has been selected for THIS specific report (matched by trip_id)
                            <> {/* Fragment to group button and filename display */}
                              <button // Replace upload button
                                onClick={handleUpload} // Execute upload function when clicked, uploadOrReplaceReport will handle upsert
                                disabled={uploading} // Disable button during upload
                                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-semibold" // Yellow button styling to distinguish from new upload, disabled state styling
                              >
                                {uploading ? 'Replacing...' : 'Replace Report'} {/* Dynamic button text shows progress during upload */}
                              </button> {/* End replace button */}
                              <p className="text-xs text-gray-600 truncate" title={selectedFile.name}>New: {selectedFile.name}</p> {/* Display selected filename with truncation for long names, full name on hover */}
                            </> // End fragment
                          )} {/* End file selected conditional */}
                        </div> // End replace controls container
                      )} {/* End replace conditional */}
                    </div> {/* End action buttons section */}
                  </div> {/* End flex container */}
                </div> // End report card
              ))} {/* End reports map */}
            </div> // End reports container
          )} {/* End reports check */}
        </div> {/* End submitted reports section card */}
      </div> {/* End content container */}
    </div> // End main container
  ) // End return
} // End TripReportsPage component

export default MyReportsPage // Export component as default (renamed from TripReportsPage)
