// Import standard React hook elements for component state and lifecycle tracking
import { useState, useEffect } from 'react' // Import React hooks
// Import routing hooks to read URL parameters and navigate across pages
import { useParams, useNavigate } from 'react-router-dom' // Import router hooks
// Import the authentication context state provider hook
import { useAuth } from '../../context/AuthContext' // Import custom useAuth hook
// Import registration and trip details database helper services
import { fetchTripDetail, fetchMyRegistrationForTrip } from '../../lib/registrationService' // Import registration services
// Import student document upload and status tracking database helper services
import { fetchDocumentsForStudentTrip, uploadDocument } from '../../lib/documentService' // Import document services
// Define the React component function for Student Trip Documents page
function TripDocumentsPage() { // Start TripDocumentsPage component
  // Retrieve the unique trip ID from active route URL parameters
  const { id } = useParams() // Destructure id parameter
  // Instantiate navigation hook to handle back button redirecting actions
  const navigate = useNavigate() // Destructure navigate hook
  // Retrieve currently authenticated user context details from the provider
  const { user } = useAuth() // Destructure active user record
  // React state to store fetched trip details and required documents arrays
  const [trip, setTrip] = useState(null) // Define trip details state
  // React state to store the registration object to verify student approval state
  const [registration, setRegistration] = useState(null) // Define registration details state
  // React state map storing documents uploaded so far, organized keyed by document type
  const [documentsByType, setDocumentsByType] = useState({}) // Define documents mapping state
  // React state boolean indicating if database queries are actively fetching
  const [loading, setLoading] = useState(true) // Define loading indicator state
  // React state tracking the specific document type name undergoing upload processes
  const [uploadingType, setUploadingType] = useState(null) // Define current upload action type state
  // React state holding success feedback banner message strings
  const [statusMessage, setStatusMessage] = useState('') // Define success status message state
  // React state holding error alert banner message strings
  const [error, setError] = useState('') // Define error details message state
  // Asynchronous function retrieving trip data, approval registrations, and current files
  const loadData = async () => { // Start loadData definition
    setLoading(true) // Mark loading as true during active database transactions
    // Fetch parent trip details from database to learn which files are needed
    const { trip: tripData } = await fetchTripDetail(id) // Invoke trip detail retrieval
    setTrip(tripData) // Save retrieved trip dataset to state
    // Fetch registration matching this student and trip to confirm approval status
    const { registration: regData } = await fetchMyRegistrationForTrip(user.id, id) // Retrieve registration row
    setRegistration(regData) // Save retrieved registration dataset to state
    // Fetch list of documents already uploaded by this student for this trip
    const { documents } = await fetchDocumentsForStudentTrip(user.id, id) // Retrieve documents list
    const grouped = {} // Initialize empty key value group map
    documents.forEach((doc) => { // Loop through each uploaded document object
      grouped[doc.doc_type] = doc // Key document object by its doc_type property
    }) // End grouped list loop
    setDocumentsByType(grouped) // Store mapped records inside state
    setLoading(false) // Toggle page loading indicator back to false
  } // End loadData function
  // Fetch dataset exactly once upon initial page mount or active user changed
  useEffect(() => { // Start useEffect hook
    if (user?.id) loadData() // Execute load actions if user ID is authenticated
  }, [id, user]) // Bind hook to id and user dependency arrays
  // Process selected files for upload under specified document category
  const handleFileSelect = async (docType, file) => { // Start handleFileSelect definition
    if (!file) return // Guard clause if selection was closed without file
    // Check and validate uploaded file sizes remain securely under 10MB limit
    if (file.size > 10 * 1024 * 1024) { // If file exceeds 10MB calculation
      setError('File must be smaller than 10MB.') // Output clear error
      return // Halt execution
    } // End file size check
    setError('') // Reset previous error outputs
    setUploadingType(docType) // Set current uploading category to disable slots
    // Check if there is an existing uploaded record of this document type
    const existingDoc = documentsByType[docType] || null // Retrieve object or default to null
    // Call the upload service which handles new creation or re-upload version bumps
    const { document, error: uploadError } = await uploadDocument( // Execute service upload
      user.id, // Student user ID
      id, // Target trip ID
      docType, // Designated document category
      file, // File object
      existingDoc // Reference previous upload details if present
    ) // End upload transaction call
    setUploadingType(null) // Clear uploading category block state
    if (uploadError) { // Check if transaction returned an upload error
      setError(`Failed to upload ${docType}. Please try again.`) // Output upload failure alerts
      return // Halt execution
    } // End upload error block
    // Save updated document record to local mapping state
    setDocumentsByType({ ...documentsByType, [docType]: document }) // Update object key with new document
    setStatusMessage(`${docType} uploaded successfully. Awaiting review.`) // Display success alerts
    setTimeout(() => setStatusMessage(''), 3000) // Auto fade success banners after 3 seconds
  } // End handleFileSelect function
  // Render loading screen if database queries are actively fetching
  if (loading) { // Check if page loading is true
    return ( // Return loading placeholder layout
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center"> {/* Center layout wrapper */}
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Glowing gold style */}
          Loading Documents... {/* Loading placeholder string */}
        </p> {/* End paragraph element */}
      </div> // End wrapper
    ) // End return block
  } // End loading check
  // Restrict access entirely if student is not registered or registration is not Approved
  if (!registration || registration.status !== 'Approved') { // Check approval condition status
    return ( // Return access denied information layout
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Viewport wrapper container */}
        <button // Back navigation button
          onClick={() => navigate(`/student/trips/${id}`)} // Route back to student trip details
          className="text-[#4A5F7F] font-sans text-sm mb-6 hover:text-[#2A3F5F] transition-colors" // Styled link text
        > {/* Button wrapper */}
          ← Back to Trip {/* Navigation text label */}
        </button> {/* Close back button */}
        <div className="bg-white rounded-2xl p-8 border border-[#E5EDFF] max-w-md"> {/* Muted information card */}
          <p className="text-[#6B7F9F] font-sans text-sm"> {/* Soft text description styling */}
            Document upload becomes available once your registration for this trip is approved by the department head. {/* Notice message */}
          </p> {/* End paragraph */}
        </div> {/* End information card */}
      </div> // End layout wrapper
    ) // End return block
  } // End approval check
  // Filter trip's required documents list to exclude ParentalConsent which is processed separately in registration
  const requiredTypes = (trip.required_documents || []).filter((doc) => // Filter array values
    doc !== 'ParentalConsent' // Exclude ParentalConsent strings from active list
  ) // End required document categories calculation
  // Mapping of CSS classes corresponding to each document status badge
  const statusColors = { // Start statusColors mapping
    Pending: 'bg-yellow-500/20 text-yellow-400', // Yellow badge styles for Pending review
    Approved: 'bg-green-500/20 text-green-400', // Green badge styles for Approved document
    Rejected: 'bg-red-500/20 text-red-400', // Red badge styles for Rejected document
  } // End statusColors object definition
  // Render active Student Trip Documents Page layout structure
  return ( // Start JSX structure returning
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Viewport main page container */}
      <button // Back navigation button
        onClick={() => navigate(`/student/trips/${id}`)} // Route back to student trip details on click
        className="text-[#4A5F7F] font-sans text-sm mb-4 hover:text-[#2A3F5F] transition-colors" // Styled back link
      > {/* Button wrapper */}
        ← Back to Trip {/* Navigation label */}
      </button> {/* Close back button */}
      <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Trip Documents</h1> {/* Page title heading */}
      <p className="text-[#4A5F7F] font-sans text-sm mb-6"> {/* Subtitle container block */}
        Upload the required documents for {trip?.title} {/* Page instructional subtitle text */}
      </p> {/* End subtitle paragraph */}
      {statusMessage && ( // Conditional render for active success alerts
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 max-w-2xl"> {/* Green border box layout */}
          <p className="text-green-400 font-sans text-sm">{statusMessage}</p> {/* Output success string */}
        </div> // End success container box
      )} {/* Close success conditional */}
      {error && ( // Conditional render for active error alerts
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl"> {/* Red border box layout */}
          <p className="text-red-400 font-sans text-sm">{error}</p> {/* Output error string */}
        </div> // End error container box
      )} {/* Close error conditional */}
      {requiredTypes.length === 0 ? ( // Conditional render if trip requires no additional documents
        <div className="bg-white rounded-2xl p-8 border border-[#E5EDFF] max-w-md"> {/* Empty card wrapper */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Soft styling text info */}
            This trip has no additional documents to upload. {/* Notice string */}
          </p> {/* End paragraph */}
        </div> // End empty card wrapper
      ) : ( // Render upload slot controls list
        <div className="space-y-4 max-w-2xl"> {/* Vertical slot list stack */}
          {requiredTypes.map((docType) => { // Map each required document category
            const existingDoc = documentsByType[docType] // Retrieve uploaded file record if present
            return ( // Return document slot card layout
              <div key={docType} className="bg-white rounded-2xl p-5 border border-[#E5EDFF]"> {/* Slot card container */}
                <div className="flex items-center justify-between mb-3"> {/* Card row header */}
                  <h3 className="font-serif text-[#1E3A5F] text-lg font-bold">{docType}</h3> {/* Document category type name */}
                  {existingDoc && ( // Render status badge if file was already uploaded
                    <span className={`text-xs font-sans font-semibold uppercase tracking-wide px-2 py-1 rounded ${statusColors[existingDoc.status]}`}> {/* Badge tag */}
                      {existingDoc.status} {/* Active document status name */}
                    </span> // End badge tag
                  )} {/* Close badge conditional render */}
                </div> {/* End header row container */}
                {existingDoc && ( // Output details of currently uploaded document if present
                  <p className="text-[#4A5F7F] font-sans text-xs mb-2"> {/* Muted text layout */}
                    Current file: {existingDoc.file_name} (version {existingDoc.version}) {/* Printed filename and file versions */}
                  </p> // End description paragraph
                )} {/* Close file details conditional */}
                {existingDoc?.status === 'Rejected' && existingDoc.feedback && ( // Display rejection correction notes if present
                  <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30"> {/* Red highlight info container */}
                    <p className="text-red-400 font-sans text-xs"> {/* Rejection warning styling */}
                      Feedback: {existingDoc.feedback} {/* Display rejection feedback text details */}
                    </p> {/* End warning text paragraph */}
                  </div> // End feedback container
                )} {/* Close feedback conditional check */}
                {existingDoc?.status !== 'Approved' && ( // Allow uploads if document status is not currently Approved
                  <label className="inline-block cursor-pointer text-xs font-sans text-cyan-main hover:text-cyan-300 transition-colors"> {/* Styled input label */}
                    {uploadingType === docType // If this category is currently uploading
                      ? 'Uploading...' // Render uploading state
                      : existingDoc // If a document exists (for Rejected re-uploads)
                        ? 'Re-upload File' // Render re-upload call to action
                        : 'Upload File'} {/* Else render original upload call to action */}
                    <input // Hidden browser file input element
                      type="file" // Set type to file
                      accept=".pdf,.docx,.jpg,.jpeg,.png" // Limit formats
                      onChange={(e) => handleFileSelect(docType, e.target.files[0])} // Trigger processing on file selection
                      disabled={uploadingType === docType} // Disable interactions during upload activity
                      className="hidden" // Visually hide default ugly browser file controls
                    /> {/* End input element tag */}
                  </label> // End upload label trigger
                )} {/* Close upload conditional check */}
              </div> // End document card container
            ) // End slot map return
          })} {/* Close requiredTypes map loop */}
        </div> // End list container
      )} {/* Close requiredTypes list empty conditional check */}
    </div> // End page wrapper container
  ) // End return block
} // End TripDocumentsPage component definition
export default TripDocumentsPage // Export default documents page component
