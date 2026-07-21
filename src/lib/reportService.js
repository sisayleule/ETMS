// import supabase client for database and storage operations
import { supabase } from './supabase' // Connect to Supabase client singleton

// import the notification helper — type must be 'Report' per the
// notifications table check constraint, and the field is "link" not "action_url"
import { createNotification } from './notificationService' // Import notification creation function

// MAX_FILE_SIZE_BYTES enforces the 7MB limit client-side before upload
const MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024 // Set maximum file size to 7 megabytes in bytes

// ALLOWED_EXTENSIONS defines which file types are accepted
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'] // Array of permitted file extensions for trip reports

// fetchMyReport gets the student's single report for a specific trip, if it exists
// returns null if no report has been submitted yet for this trip
export async function fetchMyReport(studentId, tripId) { // Define async function to fetch one report for a student-trip pair
  const { data, error } = await supabase // Execute Supabase query
    .from('trip_reports') // Target trip_reports table
    .select('*, trips(title, destination, end_date)') // Select all report fields and join with trips for trip details
    .eq('student_id', studentId) // Filter by student ID
    .eq('trip_id', tripId) // Filter by trip ID
    .maybeSingle() // Return single row or null if not found, without throwing error

  return { report: data, error } // Return report data and any error
} // End fetchMyReport function

// fetchMyAllReports gets every report the student has ever submitted, across all trips
// used for the Trip Reports landing page list
export async function fetchMyAllReports(studentId) { // Define async function to fetch all reports for a student
  const { data, error } = await supabase // Execute Supabase query
    .from('trip_reports') // Target trip_reports table
    .select('*, trips(title, destination, end_date, status)') // Select all report fields and join with trips for trip information
    .eq('student_id', studentId) // Filter by student ID to get only this student's reports
    .order('submitted_at', { ascending: false }) // Sort by submission date, newest first

  return { reports: data || [], error } // Return reports array (empty if none) and any error
} // End fetchMyAllReports function

// fetchCompletedTrips gets EVERY trip the student is approved for
// that has already ended (past end_date), so a report can be submitted for each one
export async function fetchCompletedTrips(studentId) { // Define async function to fetch eligible trips for report submission
  const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format for comparison

  const { data, error } = await supabase // Execute Supabase query
    .from('registrations') // Target registrations table
    .select('trip_id, trips(id, title, destination, end_date, status)') // Select trip ID and join with trips for full trip details
    .eq('student_id', studentId) // Filter by student ID to get only this student's registrations
    .eq('status', 'Approved') // Only include approved registrations - student must be approved for the trip

  // Filter for every completed trip (end_date has passed), not just one
  // This ensures student can submit reports for ALL their past trips, not just a single trip
  const completed = (data || []).filter((r) => r.trips && r.trips.end_date && r.trips.end_date <= today) // Client-side filter to check if trip end date is today or earlier

  return { trips: completed, error } // Return array of all completed trips with their details
} // End fetchCompletedTrips function

// validateFile checks extension and size before any upload attempt
// returns an error message string, or null if the file is valid
export function validateFile(file) { // Define function to validate file before upload
  const ext = file.name.split('.').pop().toLowerCase() // Extract file extension from filename and convert to lowercase

  if (!ALLOWED_EXTENSIONS.includes(ext)) { // Check if file extension is in the allowed list
    return 'Only PDF, DOC, and DOCX files are allowed.' // Return error message for invalid file type
  } // End extension check

  if (file.size > MAX_FILE_SIZE_BYTES) { // Check if file size exceeds maximum allowed size
    return 'File size must be under 7MB.' // Return error message for oversized file
  } // End size check

  return null // Return null if file passes all validation checks
} // End validateFile function

// uploadOrReplaceReport uploads a new report, or replaces an existing one
// only allowed if the current report status is Pending (not yet under review or decided)
// this enforces "replace before approval" from the requirements
export async function uploadOrReplaceReport({ studentId, tripId, tripTitle, file }) { // Define async function to upload or replace a trip report
  // validate the file before doing anything else
  const validationError = validateFile(file) // Call validation function to check file type and size
  if (validationError) { // If validation failed
    return { error: { message: validationError } } // Return error object with validation error message
  } // End validation check

  // check if a report already exists for this student and trip
  const { report: existing } = await fetchMyReport(studentId, tripId) // Fetch existing report for this student-trip pair

  // block replacement if the existing report is no longer Pending
  if (existing && existing.status !== 'Pending') { // If report exists and status is not Pending
    return { error: { message: `Cannot replace a report that is already ${existing.status}.` } } // Return error blocking replacement
  } // End replacement check

  const ext = file.name.split('.').pop().toLowerCase() // Extract file extension again for storage path
  const filePath = `${studentId}/${tripId}/report-${Date.now()}.${ext}` // Generate unique file path with timestamp

  // if replacing, delete the old file from storage first to avoid orphaned files
  if (existing?.file_path) { // If an existing report with a file path exists
    await supabase.storage.from('trip-reports').remove([existing.file_path]) // Delete old file from storage bucket
  } // End old file deletion

  // upload the new file to the private trip-reports bucket
  const { error: uploadError } = await supabase.storage // Execute storage upload
    .from('trip-reports') // Target trip-reports storage bucket
    .upload(filePath, file) // Upload file to generated path

  if (uploadError) { // If upload failed
    return { error: uploadError } // Return upload error
  } // End upload error check

  // build the row to upsert — insert if new, update if replacing
  const reportRow = { // Create report row object for database
    student_id: studentId, // Set student ID
    trip_id: tripId, // Set trip ID
    report_number: 1, // Set report number to 1 (always single report now)
    file_url: filePath, // Set file URL to storage path
    file_path: filePath, // Set file path to storage path
    file_type: ext, // Set file type to extracted extension
    file_name: file.name, // Set original file name
    file_size: file.size, // Set file size in bytes
    status: 'Pending', // Set initial status to Pending
    rating: null, // Set rating to null (not used in new model)
    feedback: null, // Set feedback to null initially
    submitted_at: new Date().toISOString(), // Set submission timestamp to now
    reviewed_at: null, // Set reviewed_at to null (not yet reviewed)
  } // End reportRow object

  // upsert on the (student_id, trip_id) unique constraint added in the migration
  const { data, error } = await supabase // Execute database upsert
    .from('trip_reports') // Target trip_reports table
    .upsert(reportRow, { onConflict: 'student_id,trip_id' }) // Upsert using unique constraint
    .select() // Return inserted/updated row
    .single() // Expect single row result

  if (error) { // If database operation failed
    return { error } // Return database error
  } // End database error check

  // notify every department head that a new report was submitted
  const { data: deptHeads } = await supabase // Query for department heads
    .from('profiles') // Target profiles table
    .select('id') // Select only ID field
    .eq('role', 'departmentHead') // Filter by departmentHead role

  if (deptHeads && deptHeads.length > 0) { // If department heads found
    for (const dh of deptHeads) { // Loop through each department head
      await createNotification({ // Create notification for this department head
        userId: dh.id, // Set recipient to department head ID
        title: 'New Trip Report Submitted', // Set notification title
        message: `A trip report was submitted for ${tripTitle} and is awaiting review.`, // Set notification message with trip title
        type: 'Report', // Set notification type to Report
        link: '/depthead/reports', // Set navigation link to reports review page
        tripId, // Include trip ID reference
      }) // End createNotification call
    } // End department heads loop
  } // End department heads notification block

  return { report: data, error: null } // Return success with report data
} // End uploadOrReplaceReport function

// getStatusColor returns the Tailwind color classes for each status badge
export function getStatusColor(status) { // Define function to get CSS classes for status badge
  const colors = { // Define color mapping object for each status
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-300', // Yellow colors for Pending status
    'Under Review': 'bg-blue-100 text-blue-700 border-blue-300', // Blue colors for Under Review status
    Approved: 'bg-green-100 text-green-700 border-green-300', // Green colors for Approved status
    Rejected: 'bg-red-100 text-red-700 border-red-300', // Red colors for Rejected status
  } // End colors object
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300' // Return matched colors or gray default
} // End getStatusColor function

// getDownloadUrl generates a temporary signed URL for downloading a private report file
// signed URLs expire after 1 hour for security since the bucket is private
export async function getDownloadUrl(filePath) { // Define async function to generate signed download URL
  const { data, error } = await supabase.storage // Execute storage operation
    .from('trip-reports') // Target trip-reports storage bucket
    .createSignedUrl(filePath, 3600) // Create signed URL valid for 3600 seconds (1 hour)

  return { url: data?.signedUrl, error } // Return signed URL and any error
} // End getDownloadUrl function
