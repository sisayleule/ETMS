// Import Supabase client for database queries
import { supabase } from '../supabase'

// fetchTripDetail retrieves full trip information by trip ID
export async function fetchTripDetail(tripId) { // Export function accepting tripId parameter
  // Query trips table for single trip matching the provided ID
  const { data, error } = await supabase // Execute Supabase query
    .from('trips') // Target trips table
    .select('*') // Select all columns from trips table
    .eq('id', tripId) // Filter by trip ID matching parameter
    .maybeSingle() // Use maybeSingle to return null if not found instead of error

  // Return trip data and any error that occurred
  return { trip: data, error } // Return object with trip data and error
}

// fetchTripRegistrations gets all registrations for a trip with student profile data
export async function fetchTripRegistrations(tripId) {
  // Step 1: Fetch registrations
  const { data: regs, error: regError } = await supabase
    .from('registrations')
    .select('id, status, student_id, applied_at') // Changed from created_at to applied_at - registrations table uses applied_at as its timestamp column
    .eq('trip_id', tripId)

  if (regError || !regs) return { registrations: [], error: regError }
  if (regs.length === 0) return { registrations: [], error: null }

  // Sort in JavaScript instead of SQL using applied_at instead of created_at
  const sortedRegs = [...regs].sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at)) // Changed from created_at to applied_at

  // Step 2: Fetch profiles
  const ids = sortedRegs.map(r => r.student_id)
  const { data: profs, error: profError } = await supabase
    .from('profiles')
    .select('id, full_name, student_id_number, phone_number, year_of_study, profile_photo')
    .in('id', ids)

  if (profError) return { registrations: sortedRegs, error: profError }

  // Step 3: Merge
  const profMap = {}
  if (profs) profs.forEach(p => { profMap[p.id] = p })
  
  const merged = sortedRegs.map(r => ({ ...r, profiles: profMap[r.student_id] || null }))
  
  return { registrations: merged, error: null }
}

// fetchStudentFullInfo retrieves health and emergency contact data for one student
export async function fetchStudentFullInfo(studentId) { // Export function accepting studentId parameter
  // Execute two queries in parallel using Promise.all for performance
  const [healthResult, contactsResult] = await Promise.all([ // Destructure results array
    // Query health_info table for this student
    supabase // Supabase client
      .from('health_info') // Target health_info table
      .select('*') // Select all health info columns
      .eq('user_id', studentId) // Filter by user_id - health_info uses "user_id" as foreign key, not "student_id"
      .maybeSingle(), // Use maybeSingle since student might not have health info yet
    
    // Query emergency_contacts table for this student
    supabase // Supabase client
      .from('emergency_contacts') // Target emergency_contacts table
      .select('*') // Select all emergency contact columns
      .eq('user_id', studentId) // Filter by user_id - emergency_contacts uses "user_id" as foreign key, not "student_id"
      .order('created_at', { ascending: false }) // Sort by newest first
      .limit(1) // Get only most recent emergency contact
  ]) // Close Promise.all array

  // Return object containing health info data and emergency contact data
  return { // Return structured object
    healthInfo: healthResult.data, // Health info or null if not found
    emergencyContact: contactsResult.data?.[0] || null, // First contact or null if none exist
    error: healthResult.error || contactsResult.error // Return first error if any occurred
  } // Close return object
}

// sendUrgentAnnouncement broadcasts emergency notification to all approved students on a trip
export async function sendUrgentAnnouncement(tripId, tripTitle, message) { // Export function with tripId, tripTitle, and message parameters
  // Fetch every student with Approved registration status for this trip
  const { data: approvedStudents, error: fetchError } = await supabase // Execute query
    .from('registrations') // Target registrations table
    .select('student_id') // Select only student_id column needed for notifications
    .eq('trip_id', tripId) // Filter by specific trip ID
    .eq('status', 'Approved') // Filter to only Approved registrations

  // Check if query failed
  if (fetchError) return { error: fetchError, sentCount: 0 } // Return error with zero sent count

  // Check if no approved students exist for this trip
  if (!approvedStudents || approvedStudents.length === 0) { // Validate array exists and has items
    // Return specific error message for no approved students case
    return { error: { message: 'No approved students on this trip to notify.' }, sentCount: 0 } // Return error object with message and zero count
  } // Close validation check

  // Build notification row for each approved student
  const notificationRows = approvedStudents.map((r) => ({ // Map each registration to notification object
    user_id: r.student_id, // Target student user ID
    title: `Urgent: ${tripTitle}`, // Notification title with trip name
    message: message, // Announcement message text
    type: 'Emergency', // Set type to Emergency for high priority and 🚨 icon
    link: '/student/dashboard', // Link to student dashboard
    trip_id: tripId, // Associate notification with trip
  })) // Close map function

  // Bulk insert all notification rows in single database transaction
  const { error: insertError } = await supabase // Execute insert query
    .from('notifications') // Target notifications table
    .insert(notificationRows) // Insert array of notification objects

  // Check if insert failed
  if (insertError) return { error: insertError, sentCount: 0 } // Return error with zero sent count

  // Return success with count of notifications sent
  return { error: null, sentCount: notificationRows.length } // Return null error and actual count of sent notifications
}
