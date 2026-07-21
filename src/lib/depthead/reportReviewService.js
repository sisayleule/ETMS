// import supabase client
import { supabase } from '../supabase' // Connect to Supabase client singleton

// import the notification helper
import { createNotification } from '../notificationService' // Import notification creation function

// fetchAllReports gets every submitted trip report system-wide
// joined with student name and trip title for the review table
// supports optional filters for trip, student, and status
export async function fetchAllReports({ tripId, studentId, status } = {}) { // Define async function with optional filter parameters
  let query = supabase // Initialize query builder
    .from('trip_reports') // Target trip_reports table
    .select('*, trips(title, destination), profiles(full_name, student_id_number)') // Select all report fields and join with trips and profiles for display information
    .order('submitted_at', { ascending: false }) // Sort by submission date, newest first

  // apply trip filter if provided
  if (tripId) query = query.eq('trip_id', tripId) // Add trip ID filter if tripId parameter exists

  // apply student filter if provided
  if (studentId) query = query.eq('student_id', studentId) // Add student ID filter if studentId parameter exists

  // apply status filter if provided
  if (status) query = query.eq('status', status) // Add status filter if status parameter exists

  const { data, error } = await query // Execute the built query

  return { reports: data || [], error } // Return reports array (empty if none) and any error
} // End fetchAllReports function

// updateReportStatus changes a report's status and notifies the student
// used for Review (sets Under Review), Approve, and Reject actions
export async function updateReportStatus({ reportId, studentId, tripTitle, newStatus, feedback = null }) { // Define async function to update report status
  // update the report row with the new status and optional feedback
  const { data, error } = await supabase // Execute Supabase update
    .from('trip_reports') // Target trip_reports table
    .update({ // Update these fields
      status: newStatus, // Set new status value
      feedback, // Set feedback text (null if not provided)
      reviewed_at: new Date().toISOString(), // Set reviewed timestamp to current time
    }) // End update object
    .eq('id', reportId) // Filter by report ID
    .select() // Return updated row
    .single() // Expect single row result

  if (error) { // If database update failed
    return { error } // Return error object
  } // End error check

  // build a status-specific notification message for the student
  const messages = { // Define message templates for each status
    'Under Review': `Your trip report for ${tripTitle} is now under review.`, // Message for Under Review status
    Approved: `Your trip report for ${tripTitle} has been approved.`, // Message for Approved status
    Rejected: `Your trip report for ${tripTitle} was rejected.${feedback ? ' Feedback: ' + feedback : ''}`, // Message for Rejected status with optional feedback
  } // End messages object

  // notify the student immediately of the status change
  await createNotification({ // Create notification for student
    userId: studentId, // Set recipient to student ID
    title: 'Trip Report Status Updated', // Set notification title
    message: messages[newStatus] || `Your trip report status changed to ${newStatus}.`, // Use status-specific message or generic fallback
    type: 'Report', // Set notification type to Report
    link: '/student/reports', // Set navigation link to student reports page
  }) // End createNotification call

  return { report: data, error: null } // Return success with updated report data
} // End updateReportStatus function

// getReportDownloadUrl generates a signed URL so the department head can download the file
export async function getReportDownloadUrl(filePath) { // Define async function to generate download URL
  const { data, error } = await supabase.storage // Execute storage operation
    .from('trip-reports') // Target trip-reports storage bucket
    .createSignedUrl(filePath, 3600) // Create signed URL valid for 3600 seconds (1 hour)

  return { url: data?.signedUrl, error } // Return signed URL and any error
} // End getReportDownloadUrl function

// reviewReport handles complete report review with score, feedback, and status update
// Sends notification to student with score, grade, feedback, and result
export async function reviewReport({ reportId, studentId, tripTitle, studentName, status, score, feedback }) { // Define async function to review report with all parameters
  // Helper function to calculate letter grade from numeric score
  function getLetterGrade(scoreValue) { // Define grade calculation helper
    if (scoreValue >= 90) return 'A' // Score 90-100 gets A grade
    if (scoreValue >= 80) return 'B' // Score 80-89 gets B grade
    if (scoreValue >= 70) return 'C' // Score 70-79 gets C grade
    if (scoreValue >= 60) return 'D' // Score 60-69 gets D grade
    return 'F' // Score below 60 gets F grade
  } // End getLetterGrade helper

  // Update the report with status, score, and feedback
  const { data, error } = await supabase // Execute Supabase update
    .from('trip_reports') // Target trip_reports table
    .update({ // Update these fields
      status: status, // Set new status (Approved/Rejected/Needs Revision)
      score: score, // Set numeric score (0-100 or null)
      feedback: feedback, // Set feedback text (or null)
      reviewed_at: new Date().toISOString(), // Set reviewed timestamp to current time
    }) // End update object
    .eq('id', reportId) // Filter by report ID
    .select() // Return updated row
    .single() // Expect single row result

  if (error) { // If database update failed
    return { error } // Return error object
  } // End error check

  // Build notification message based on review data
  let notificationMessage = `Your Trip Report for ${tripTitle} has been reviewed.\n\n` // Start with trip title

  if (score !== null && score !== undefined) { // If score was provided
    const grade = getLetterGrade(score) // Calculate letter grade
    notificationMessage += `Score: ${score}/100\n` // Add score to message
    notificationMessage += `Grade: ${grade}\n\n` // Add grade to message
  } // End score check

  notificationMessage += `Result: ${status}\n\n` // Add status result

  if (feedback) { // If feedback was provided
    notificationMessage += `Feedback: ${feedback}` // Add feedback to message
  } // End feedback check

  // Determine notification title based on status
  let notificationTitle = 'Trip Report Reviewed' // Default title
  if (status === 'Approved') { // If report was approved
    notificationTitle = '✅ Trip Report Approved' // Use approval title
  } else if (status === 'Rejected') { // If report was rejected
    notificationTitle = '❌ Trip Report Rejected' // Use rejection title
  } // End title determination

  // Send notification to student with complete review information
  await createNotification({ // Create notification for student
    userId: studentId, // Set recipient to student ID
    title: notificationTitle, // Set dynamic notification title
    message: notificationMessage, // Set detailed review message with score, grade, feedback
    type: 'Report', // Set notification type to Report
    link: '/student/my-reports', // Set navigation link to student My Reports page
  }) // End createNotification call

  // Send notification to department head confirming review completion
  const { data: deptHeads } = await supabase // Query for department heads
    .from('profiles') // Target profiles table
    .select('id') // Select only ID field
    .eq('role', 'departmentHead') // Filter by departmentHead role

  if (deptHeads && deptHeads.length > 0) { // If department heads found
    for (const dh of deptHeads) { // Loop through each department head
      await createNotification({ // Create notification for department head
        userId: dh.id, // Set recipient to department head ID
        title: 'Report Review Completed', // Set notification title
        message: `You have reviewed ${studentName}'s trip report for ${tripTitle}. Status: ${status}`, // Set confirmation message
        type: 'Report', // Set notification type to Report
        link: '/depthead/reports', // Set navigation link to reports page
      }) // End createNotification call
    } // End department head loop
  } // End department heads check

  return { report: data, error: null } // Return success with updated report data
} // End reviewReport function
