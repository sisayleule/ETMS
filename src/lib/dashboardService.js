// import supabase client for aggregate queries
import { supabase } from './supabase' // Retrieve database client

// fetchStudentStats gathers all summary counts for the dashboard home page
// runs count-only queries in parallel for speed, none of these pull full row data - removed pendingDocuments query
export async function fetchStudentStats(studentId) { // Begin fetchStudentStats definition
  // run every count query at once instead of sequentially
  const [ // Begin parallelized aggregation transaction array destructuring
    upcomingTripsResult, // Holds count result representing approved trips registrations
    pendingReportsResult, // Holds count result representing pending rated trip reports
    openComplaintsResult, // Holds count result representing unresolved active student complaints
  ] = await Promise.all([ // Direct Promise execution engine to complete tasks concurrently
    // count registrations that are Approved for trips not yet completed
    supabase // Query supabase client
      .from('registrations') // Target registrations table
      .select('id, trips!inner(status)', { count: 'exact', head: true }) // Request exact count with inner join to filter by trip status
      .eq('student_id', studentId) // Filter matching signed-in student identifier
      .eq('status', 'Approved') // Limit to only Approved registrations
      .neq('trips.status', 'Completed'), // Exclude trips with Completed status from upcoming count

    // count trip reports not yet Rated
    supabase // Query supabase client
      .from('trip_reports') // Target trip reports table
      .select('id', { count: 'exact', head: true }) // Request exact count matching without fetching records data
      .eq('student_id', studentId) // Filter matching signed-in student identifier
      .neq('status', 'Rated'), // Filter files whose status does not match Rated

    // count complaints not yet Resolved
    supabase // Query supabase client
      .from('complaints') // Target complaints table
      .select('id', { count: 'exact', head: true }) // Request exact count matching without fetching records data
      .eq('student_id', studentId) // Filter matching signed-in student identifier
      .neq('status', 'Resolved'), // Filter rows whose status is unresolved
  ]) // Close parallelized Promise.all block

  // return a flat object of numbers, defaulting to 0 if any query failed - removed pendingDocuments
  return { // Return flat analytics object
    upcomingTrips: upcomingTripsResult.count || 0, // Fallback to 0 if count fails
    pendingReports: pendingReportsResult.count || 0, // Fallback to 0 if count fails
    openComplaints: openComplaintsResult.count || 0, // Fallback to 0 if count fails
  } // End return structure
} // End fetchStudentStats function

// fetchRecentActivity gets the last 8 notifications for the activity feed
// reuses the same notifications table already populated by earlier phases
export async function fetchRecentActivity(userId) { // Begin fetchRecentActivity definition
  // query the 8 most recent notifications for this user
  // join only with trips to get trip title - do NOT join profiles as PostgREST cannot auto-resolve it
  const { data, error } = await supabase // Trigger select query transaction on supabase client
    .from('notifications') // Target notifications database table
    .select('*, trips(title)') // Fetch notification attributes and join with trips for trip title
    .eq('user_id', userId) // Filter matching specified user target identifier
    .order('created_at', { ascending: false }) // Sort newest notifications first
    .limit(8) // Limit list payload to top 8 items

  // return the list and any error
  return { activity: data || [], error } // Output data records array
} // End fetchRecentActivity function

// fetchUpcomingTripsPreview gets a short list of the student's next approved trips
// used for a small preview card on the dashboard home page
export async function fetchUpcomingTripsPreview(studentId) { // Begin fetchUpcomingTripsPreview definition
  // query registrations joined with trip info, only Approved status, exclude Completed trips, soonest first
  const { data, error } = await supabase // Trigger select query transaction on supabase client
    .from('registrations') // Target registrations table
    .select('*, trips!inner(id, title, start_date, destination, status)') // Retrieve registrations attributes and join parent trips columns with inner join to filter by trip status
    .eq('student_id', studentId) // Filter matching specific student target identifier
    .eq('status', 'Approved') // Restrict to only Approved status registrations
    .neq('trips.status', 'Completed') // Exclude trips with Completed status from upcoming trips list
    .order('trips(start_date)', { ascending: true }) // Sort ascending by associated trip's start date
    .limit(3) // Restrict response record set length to top 3 items

  // return the list and any error
  return { trips: data || [], error } // Output data records array
} // End fetchUpcomingTripsPreview function
