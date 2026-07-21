import { supabase } from '../supabase'
import { createNotification } from '../notificationService'

export async function fetchApplicants({ search = '', status = '', page = 1, limit = 20 }) {
  let query = supabase // Initialize Supabase query builder
    .from('profiles') // Target the profiles table
    .select('*', { count: 'exact' }) // Select all columns and request exact row count for pagination
    .eq('role', 'student') // Filter to only include student role accounts
    .order('created_at', { ascending: false }) // Sort by creation date newest first

  if (search) { // Check if search parameter was provided
    query = query.or(`full_name.ilike.%${search}%,student_id_number.ilike.%${search}%,email.ilike.%${search}%`) // Apply case-insensitive search across name, student ID, and email fields
  } // End search filter

  if (status === 'active') { // Check if filtering for active students only
    query = query.eq('account_status', 'active') // Filter by NEW account_status column set to 'active'
  } else if (status === 'banned') { // Check if filtering for banned students only
    query = query.eq('account_status', 'banned') // Filter by NEW account_status column set to 'banned'
  } // End status filter

  const from = (page - 1) * limit // Calculate starting index for pagination
  const to = from + limit - 1 // Calculate ending index for pagination
  query = query.range(from, to) // Apply range limit for pagination

  const { data, error, count } = await query // Execute the query and destructure response

  return { // Return formatted response object
    students: data || [], // Return students array or empty array if null
    totalCount: count || 0, // Return total count for pagination or 0 if null
    totalPages: Math.ceil((count || 0) / limit), // Calculate total pages from count and limit
    error, // Return any error from the query
  } // End return object
} // End fetchApplicants function

export async function fetchStudentDetail(studentId) {
  const [profileResult, registrationsResult, reportsResult, complaintsResult, journalResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', studentId).single(),
    supabase.from('registrations').select('*, trips(title, destination, start_date)').eq('student_id', studentId).order('applied_at', { ascending: false }),
    supabase.from('trip_reports').select('*, trips(title)').eq('student_id', studentId).order('submitted_at', { ascending: false }),
    supabase.from('complaints').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
    supabase.from('journal_entries').select('*, trips(title)').eq('student_id', studentId).order('created_at', { ascending: false }).limit(10),
  ])

  return {
    profile: profileResult.data,
    registrations: registrationsResult.data || [],
    reports: reportsResult.data || [],
    complaints: complaintsResult.data || [],
    journalEntries: journalResult.data || [],
    error: profileResult.error,
  }
}

export async function banStudent({ studentId, adminId, reason }) {
  const { data: student } = await supabase.from('profiles').select('full_name, role').eq('id', studentId).single() // Fetch student profile to validate exists and get name
  
  if (!student) { // Check if student record was found in database
    return { error: { message: 'Student not found' } } // Return error if student does not exist
  } // End student exists validation

  if (student.role === 'departmentHead') { // Check if target is a department head account
    return { error: { message: 'Cannot ban another department head' } } // Return error preventing department head from banning another department head
  } // End role validation check

  const { data: admin } = await supabase.from('profiles').select('full_name').eq('id', adminId).single() // Fetch admin name for activity logging

  const { error } = await supabase // Execute database update to mark student as banned
    .from('profiles') // Target the profiles table
    .update({ // Update the following fields
      is_banned: true, // Set legacy is_banned flag to true for backwards compatibility
      account_status: 'banned', // Set NEW account_status column to 'banned' to enforce ban in auth flow
      ban_reason: reason, // Store the reason provided by department head
      banned_at: new Date().toISOString(), // Record the exact timestamp when ban was applied
      banned_by: adminId, // Record which department head performed the ban action
    }) // End update fields object
    .eq('id', studentId) // Filter to only update the target student's profile row

  if (!error) { // Check if the database update succeeded without errors
    await createNotification({ // Send notification to inform student of account suspension
      userId: studentId, // Target the banned student's user ID
      title: 'Account Suspended', // Set notification title
      message: `Your ETMS account has been temporarily suspended by the Department Head.\n\nReason: ${reason}\n\nIf you believe this is an error, please contact your department.`, // Include full ban reason in message
      type: 'General', // Set notification type to General
      link: '/student/dashboard', // Link to dashboard where suspension message will display
    }) // End notification creation

    await supabase.from('activity_logs').insert({ // Log the ban action for audit trail
      admin_id: adminId, // Record which admin performed the action
      action: 'student_banned', // Set action type for filtering logs
      target_user_id: studentId, // Record which student was banned
      target_user_name: student.full_name, // Store student name for readability
      details: { // Store detailed context in JSON field
        reason, // Include the ban reason
        admin_name: admin?.full_name || 'Unknown', // Include admin name
        admin_role: 'Department Head', // Record admin role
        timestamp: new Date().toISOString() // Record exact timestamp
      }, // End details object
    }) // End activity log insert
  } // End success handling block

  return { error } // Return error status (null if successful)
} // End banStudent function

export async function unbanStudent({ studentId, adminId }) {
  const { data: student } = await supabase.from('profiles').select('full_name').eq('id', studentId).single() // Fetch student name for logging purposes

  const { data: admin } = await supabase.from('profiles').select('full_name').eq('id', adminId).single() // Fetch admin name for activity log

  const { error } = await supabase // Execute database update to restore student account
    .from('profiles') // Target the profiles table
    .update({ // Update the following fields
      is_banned: false, // Set legacy is_banned flag to false for backwards compatibility
      account_status: 'active', // Set NEW account_status column to 'active' to restore full access
      ban_reason: null, // Clear the ban reason since account is no longer banned
      banned_at: null, // Clear the ban timestamp
      banned_by: null, // Clear the admin who performed the original ban
    }) // End update fields object
    .eq('id', studentId) // Filter to only update the target student's profile row

  if (!error) { // Check if the database update succeeded without errors
    await createNotification({ // Send notification to inform student of account restoration
      userId: studentId, // Target the unbanned student's user ID
      title: 'Account Restored', // Set notification title
      message: 'Your ETMS account has been restored and you can now log in.', // Inform student of restoration
      type: 'General', // Set notification type to General
      link: '/student/dashboard', // Link to dashboard for full access
    }) // End notification creation

    await supabase.from('activity_logs').insert({ // Log the unban action for audit trail
      admin_id: adminId, // Record which admin performed the action
      action: 'student_unbanned', // Set action type for filtering logs
      target_user_id: studentId, // Record which student was unbanned
      target_user_name: student?.full_name || 'Unknown', // Store student name for readability
      details: { // Store detailed context in JSON field
        admin_name: admin?.full_name || 'Unknown', // Include admin name
        admin_role: 'Department Head', // Record admin role
        timestamp: new Date().toISOString() // Record exact timestamp
      }, // End details object
    }) // End activity log insert
  } // End success handling block

  return { error } // Return error status (null if successful)
} // End unbanStudent function

export async function deleteStudent({ studentId, adminId, reason }) {
  const { data: student } = await supabase.from('profiles').select('full_name, role, profile_photo').eq('id', studentId).single() // Fetch student details before deactivation

  if (!student) { // Check if student record was found in database
    return { error: { message: 'Student not found' } } // Return error if student does not exist
  } // End student exists validation

  if (student.role === 'departmentHead') { // Check if target is a department head account
    return { error: { message: 'Cannot delete another department head' } } // Return error preventing department head from deleting another department head
  } // End role validation check

  const { data: admin } = await supabase.from('profiles').select('full_name').eq('id', adminId).single() // Fetch admin name for activity logging

  await createNotification({ // Send notification to student BEFORE deactivation so they can see it
    userId: studentId, // Target the student's user ID
    title: 'Account Deactivated', // Set notification title to reflect deactivation not permanent deletion
    message: `Your ETMS account has been deactivated by the Department Head.\n\nReason: ${reason}\n\nIf you believe this action was taken in error, please contact your department.`, // Include deactivation reason in message
    type: 'General', // Set notification type to General
    link: null, // No link since account will be deactivated
  }) // End notification creation

  await supabase.from('activity_logs').insert({ // Log the deactivation action for audit trail BEFORE status change
    admin_id: adminId, // Record which admin performed the action
    action: 'student_deactivated', // Set action type to deactivated instead of deleted to reflect reality
    target_user_id: studentId, // Record which student was deactivated
    target_user_name: student.full_name, // Store student name for readability
    details: { // Store detailed context in JSON field
      reason, // Include the deactivation reason
      admin_name: admin?.full_name || 'Unknown', // Include admin name
      admin_role: 'Department Head', // Record admin role
      timestamp: new Date().toISOString() // Record exact timestamp
    }, // End details object
  }) // End activity log insert

  const { error } = await supabase // Execute database update to deactivate student account
    .from('profiles') // Target the profiles table
    .update({ // Update the following fields
      is_banned: true, // Set legacy is_banned flag to true
      account_status: 'banned', // Set NEW account_status column to 'banned' to prevent login and feature access
      ban_reason: `ACCOUNT DEACTIVATED: ${reason}`, // Store deactivation reason with clear prefix
      banned_at: new Date().toISOString(), // Record the exact timestamp when deactivation was applied
      banned_by: adminId, // Record which department head performed the deactivation action
    }) // End update fields object
    .eq('id', studentId) // Filter to only update the target student's profile row

  return { error } // Return error status (null if successful) - NOTE: This does NOT delete the Supabase Auth user, only deactivates the profile
} // End deleteStudent function - CLIENT-SIDE LIMITATION: True permanent deletion requires service_role key via Edge Function

export async function fetchActivityLogs({ page = 1, limit = 50 }) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('activity_logs')
    .select('*, profiles!activity_logs_admin_id_fkey(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  return {
    logs: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    error,
  }
}
