// Import the Supabase client from the configurations module
import { supabase } from './supabase' // Import client for database operations (removed isMockSessionActive - mock mode removed)
// Import notification service for real-time notifications
import { createNotification } from './notificationService' // Import notification helpers (removed mockDb import - mock mode removed)
// submitComplaint inserts a new complaint row
// displayName is computed by the caller before this function runs:
// either the student's real full name, or the literal text "Anonymous Student"
export async function submitComplaint(studentId, tripId, isAnonymous, displayName, category, severity, title, description) { // Begin submitComplaint definition
  // insert the new complaint row into the raw complaints table (removed mock mode check - production only)
  // student_id is always stored, even when anonymous, per the Phase 1 schema design
  // the complaints_sanitized view is what hides it later, not this insert
  const { data, error } = await supabase // Trigger database insertion transaction
    .from('complaints') // Reference the raw complaints table
    .insert({ // Pass key value pairs for insertion
      student_id: studentId, // Map student creator identifier
      trip_id: tripId, // Map parent trip identifier
      is_anonymous: isAnonymous, // Map anonymity toggle status boolean
      display_name: displayName, // Map calculated name label display
      category: category, // Map category selection code
      severity: severity, // Map priority level severity code
      title: title, // Map typed issue summary header
      description: description, // Map detailed description contents
      status: 'Pending', // Initialize progress state status code
    }) // End dataset inserts
    .select() // Return created record attributes
    .single() // Expect a single object row response
  
  // Notify department head about new complaint submission
  if (data) { // Only proceed if complaint insert succeeded
    try { // Begin try block for notification creation
      const { data: trip } = await supabase.from('trips').select('title').eq('id', tripId).single() // Query trips table to get trip title for notification message
      const { data: deptHeads, error: deptError } = await supabase.from('profiles').select('id').eq('role', 'departmentHead') // Query profiles table to find all department head accounts
      
      if (deptHeads && deptHeads.length > 0) { // Verify department heads array exists and has at least one entry
        const notifications = deptHeads.map(deptHead => ({ // Create notification object for each department head
          user_id: deptHead.id, // Set recipient to department head's user ID
          title: `New ${severity} Complaint`, // Set notification title with severity level
          message: `${displayName} submitted a ${severity.toLowerCase()} complaint: "${title}"${trip ? ` for "${trip.title}"` : ''}.`, // Set notification message with complaint details
          type: 'Complaint', // Set notification type to Complaint
          trip_id: tripId, // Link notification to trip
          link: '/depthead/complaints' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
        })) // End notification object mapping
        
        await supabase.from('notifications').insert(notifications) // Insert notifications
      }
    } catch (notifError) {
      console.error('Exception creating complaint notification:', notifError)
    }
  }
  
  // return the created complaint and any error
  return { complaint: data, error } // Output submission results
} // End submitComplaint function

// acknowledgeComplaint - Department Head acknowledges receipt of complaint
export async function acknowledgeComplaint(complaintId, deptHeadId) { // Begin acknowledgeComplaint definition
  // Get complaint details (removed mock mode check - production only)
  const { data: complaint } = await supabase
    .from('complaints')
    .select('student_id, title, trip_id')
    .eq('id', complaintId)
    .single()
  
  if (!complaint) return { error: { message: 'Complaint not found' } }
  
  // Update status to In Progress if still Pending
  const { error: updateError } = await supabase
    .from('complaints')
    .update({
      status: 'In Progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
    .eq('status', 'Pending')
  
  // Notify student about acknowledgment
  try {
    await createNotification({
      userId: complaint.student_id,
      title: 'Complaint Acknowledged',
      message: `Your complaint "${complaint.title}" has been acknowledged and is being reviewed.`,
      type: 'Complaint',
      referenceId: complaintId,
      referenceTable: 'complaints',
      tripId: complaint.trip_id,
      createdBy: deptHeadId,
      actionUrl: '/student/complaints'
    })
  } catch (notifError) {
    console.error('Failed to create acknowledgment notification:', notifError)
  }
  
  return { error: updateError }
} // End acknowledgeComplaint function

// escalateComplaint - Escalate high-priority complaint
export async function escalateComplaint(complaintId, deptHeadId, escalationNote = '') { // Begin escalateComplaint definition
  // Get complaint details (removed mock mode check - production only)
  const { data: complaint } = await supabase
    .from('complaints')
    .select('student_id, title, trip_id')
    .eq('id', complaintId)
    .single()
  
  if (!complaint) return { error: { message: 'Complaint not found' } }
  
  // Update status to Escalated
  const { error: updateError } = await supabase
    .from('complaints')
    .update({
      status: 'Escalated',
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
  
  // Notify student about escalation
  try {
    await createNotification({
      userId: complaint.student_id,
      title: '🚨 Complaint Escalated',
      message: `Your complaint "${complaint.title}" has been escalated for priority attention.${escalationNote ? ` Note: ${escalationNote}` : ''}`,
      type: 'Complaint',
      referenceId: complaintId,
      referenceTable: 'complaints',
      tripId: complaint.trip_id,
      createdBy: deptHeadId,
      actionUrl: '/student/complaints'
    })
  } catch (notifError) {
    console.error('Failed to create escalation notification:', notifError)
  }
  
  return { error: updateError }
} // End escalateComplaint function

// reopenComplaint - Reopen a resolved complaint
export async function reopenComplaint(complaintId, studentId, reason) { // Begin reopenComplaint definition
  // Get complaint details (removed mock mode check - production only)
  const { data: complaint } = await supabase
    .from('complaints')
    .select('title, trip_id')
    .eq('id', complaintId)
    .single()
  
  if (!complaint) return { error: { message: 'Complaint not found' } }
  
  // Update status back to Pending
  const { error: updateError } = await supabase
    .from('complaints')
    .update({
      status: 'Pending',
      response: null,
      responded_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
  
  // Notify department heads about reopened complaint
  if (!updateError) {
    try {
      const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', studentId).single()
      
      if (deptHeads && profile) {
        const notifications = deptHeads.map(deptHead => ({
          user_id: deptHead.id, // Set recipient to department head's user ID
          title: 'Complaint Reopened', // Set notification title
          message: `${profile.full_name} has reopened their complaint: "${complaint.title}". Reason: ${reason}`, // Set notification message with reopen reason
          type: 'Complaint', // Set notification type to Complaint
          trip_id: complaint.trip_id, // Link notification to trip
          link: '/depthead/complaints' // FIXED: removed reference_id, reference_table, and created_by columns
        }))
        
        await supabase.from('notifications').insert(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create reopen notification:', notifError)
    }
  }
  
  return { error: updateError }
} // End reopenComplaint function

// deleteComplaint - Student deletes their own complaint (only if Pending)
export async function deleteComplaint(complaintId, studentId) { // Begin deleteComplaint definition
  // Get complaint details before deletion (removed mock mode check - production only)
  const { data: complaint } = await supabase
    .from('complaints')
    .select('title, status, trip_id')
    .eq('id', complaintId)
    .eq('student_id', studentId)
    .single()
  
  if (!complaint) return { error: { message: 'Complaint not found or access denied' } }
  if (complaint.status !== 'Pending') return { error: { message: 'Only pending complaints can be deleted' } }
  
  // Delete the complaint
  const { error: deleteError } = await supabase
    .from('complaints')
    .delete()
    .eq('id', complaintId)
    .eq('student_id', studentId)
  
  // Notify department heads about deletion
  if (!deleteError) {
    try {
      const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', studentId).single()
      
      if (deptHeads && profile) {
        const notifications = deptHeads.map(deptHead => ({
          user_id: deptHead.id, // Set recipient to department head's user ID
          title: 'Complaint Withdrawn', // Set notification title
          message: `${profile.full_name} has withdrawn their complaint: "${complaint.title}".`, // Set notification message
          type: 'Complaint', // Set notification type to Complaint
          trip_id: complaint.trip_id, // Link notification to trip
          link: '/depthead/complaints' // FIXED: removed created_by column
        }))
        
        await supabase.from('notifications').insert(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create deletion notification:', notifError)
    }
  }
  
  return { error: deleteError }
} // End deleteComplaint function

// fetchMyComplaints gets every complaint the logged in student has submitted
// reads from the raw complaints table, RLS already restricts this to the student's own rows
// this is safe and correct: a student always knows their own submissions, anonymous or not
export async function fetchMyComplaints(studentId) { // Begin fetchMyComplaints definition
  // query complaints for this student, joined with trip title, newest first (removed mock mode check - production only)
  const { data, error } = await supabase // Connect to database client
    .from('complaints') // Query the raw complaints table
    .select('*, trips(title)') // Join title field from trips table
    .eq('student_id', studentId) // Filter matching specific student user ID
    .order('created_at', { ascending: false }) // Sort records chronologically descending
  // return the list and any error
  return { complaints: data || [], error } // Output query results
} // End fetchMyComplaints function
// fetchComplaintsForReview gets every complaint for the department head
// CRITICAL: this queries the complaints_sanitized VIEW, never the raw complaints table
// the view returns student_id as null whenever is_anonymous is true
export async function fetchComplaintsForReview() { // Begin fetchComplaintsForReview definition
  // query the sanitized view, joined with trip title (removed mock mode check - production only)
  // note: views can still be joined with other tables in the same query
  const { data, error } = await supabase // Connect to database client
    .from('complaints_sanitized') // CRITICAL: Target the complaints_sanitized view to guarantee safety
    .select('*, trips(title)') // Join parent trip details securely from trips table
    .order('created_at', { ascending: false }) // Sort records chronologically descending
  // return the list and any error
  return { complaints: data || [], error } // Output query results
} // End fetchComplaintsForReview function
// updateComplaintStatus changes just the status field, used for Pending -> In Progress
export async function updateComplaintStatus(complaintId, newStatus, deptHeadId = null) { // Begin updateComplaintStatus definition
  // Get complaint details first (removed mock mode check - production only)
  const { data: complaint } = await supabase
    .from('complaints')
    .select('student_id, title, status, trip_id')
    .eq('id', complaintId)
    .single()
  
  // update only the status on the raw complaints table by id
  // this works regardless of anonymity since it targets by id, not by student_id
  const { error } = await supabase // Connect to database client
    .from('complaints') // Target the complaints table
    .update({ // Execute field updates
      status: newStatus, // Assign the new status value
      updated_at: new Date().toISOString(), // Log updated timestamp
    }) // End update set
    .eq('id', complaintId) // Match exact unique record identifier
  
  // Notify student about complaint status change
  if (!error && complaint && complaint.status !== newStatus) {
    try {
      const statusMessages = {
        'In Progress': `Your complaint "${complaint.title}" is now being reviewed.`,
        'Under Review': `Your complaint "${complaint.title}" is under review by the department head.`,
        'Pending': `Your complaint "${complaint.title}" status has been updated to pending.`,
        'Escalated': `Your complaint "${complaint.title}" has been escalated for priority attention.`
      }
      
      await createNotification({
        userId: complaint.student_id,
        title: `Complaint Status: ${newStatus}`,
        message: statusMessages[newStatus] || `Your complaint "${complaint.title}" status changed to ${newStatus}.`,
        type: 'Complaint',
        referenceId: complaintId,
        referenceTable: 'complaints',
        tripId: complaint.trip_id,
        createdBy: deptHeadId,
        actionUrl: '/student/complaints'
      })
    } catch (notifError) {
      console.error('Failed to create complaint status notification:', notifError)
    }
  }
  
  // return any error
  return { error } // Output update results
} // End updateComplaintStatus function
// respondToComplaint sets the department head's written response and marks it Resolved
// now creates notification for the student about the response
export async function respondToComplaint(complaintId, responseText) { // Begin respondToComplaint definition
  // First get the complaint details to extract student_id and title (removed mock mode check - production only)
  const { data: complaint } = await supabase
    .from('complaints')
    .select('student_id, title, trip_id')
    .eq('id', complaintId)
    .single()
  
  // update the response text, status, and responded_at timestamp
  const { error } = await supabase // Connect to database client
    .from('complaints') // Target complaints table
    .update({ // Pass update set
      response: responseText, // Store corrective feedback commentary text
      status: 'Resolved', // Resolve the status to resolved
      responded_at: new Date().toISOString(), // Record response timestamp
      updated_at: new Date().toISOString(), // Record last update timestamp
    }) // End update fields mapping
    .eq('id', complaintId) // Match exact unique record identifier
  
  // Notify student about the complaint response
  if (!error && complaint) {
    try {
      await createNotification({
        userId: complaint.student_id,
        title: 'Complaint Response Received',
        message: `Your complaint "${complaint.title}" has been resolved. Response: ${responseText}`,
        type: 'Complaint',
        referenceId: complaintId,
        referenceTable: 'complaints',
        tripId: complaint.trip_id,
        actionUrl: '/student/complaints'
      })
    } catch (notifError) {
      // Silently continue if notification fails
    }
  }
  
  // return any error
  return { error } // Output update results
} // End respondToComplaint function
