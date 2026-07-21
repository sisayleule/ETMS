// import supabase client for aggregate queries
import { supabase } from './supabase' // Retrieve database client (removed isMockSessionActive and mockDb imports - mock mode removed)

// fetchDeptHeadStats gathers system-wide summary counts for the dashboard home page
// unlike the student version, none of these filter by student_id — they count across everyone
export async function fetchDeptHeadStats() { // Begin fetchDeptHeadStats definition
  // run every count query at once instead of sequentially (removed mock mode check - production only)
  const [ // Begin parallelized aggregation transaction array destructuring
    pendingRegistrationsResult, // Holds count result representing registrations awaiting approval system-wide
    activeTripsResult, // Holds count result representing trips currently Published or Ongoing system-wide
    pendingReportsResult, // Holds count result representing trip reports not yet rated system-wide
    openComplaintsResult, // Holds count result representing open complaints from sanitized view
  ] = await Promise.all([ // Direct Promise execution engine to complete tasks concurrently
    // count registrations still awaiting approval, system-wide
    supabase // Query supabase client
      .from('registrations') // Target registrations table
      .select('id', { count: 'exact', head: true }) // Request exact count matching without fetching records data
      .eq('status', 'Pending'), // Limit to only Pending registrations

    // count active trips (Published or Ongoing), system-wide
    supabase // Query supabase client
      .from('trips') // Target trips table
      .select('id', { count: 'exact', head: true }) // Request exact count matching without fetching records data
      .in('status', ['Published', 'Ongoing']), // Match trips with Published or Ongoing status

    // count trip reports not yet rated, system-wide
    supabase // Query supabase client
      .from('trip_reports') // Target trip reports table
      .select('id', { count: 'exact', head: true }) // Request exact count matching without fetching records data
      .neq('status', 'Rated'), // Filter files whose status is not Rated

    // count open complaints, read through the sanitized view even for a count-only
    // query, to keep the read-path consistent with Phase 9's anonymity rule
    supabase // Query supabase client
      .from('complaints_sanitized') // Target sanitized complaints view to preserve structural anonymity constraints
      .select('id', { count: 'exact', head: true }) // Request exact count matching without fetching records data
      .neq('status', 'Resolved'), // Filter rows whose status is not Resolved
  ]) // Close parallelized Promise.all block

  // return a flat object of numbers, defaulting to 0 if any query failed
  return { // Return flat analytics object
    pendingRegistrations: pendingRegistrationsResult.count || 0, // Fallback to 0 if count fails
    activeTrips: activeTripsResult.count || 0, // Fallback to 0 if count fails
    pendingReports: pendingReportsResult.count || 0, // Fallback to 0 if count fails
    openComplaints: openComplaintsResult.count || 0, // Fallback to 0 if count fails
  } // End return structure
} // End fetchDeptHeadStats function

// fetchActiveTripsPreview gets a short list of trips currently Ongoing or Published
// used for a small preview card on the dashboard home page
export async function fetchActiveTripsPreview() { // Begin fetchActiveTripsPreview definition
  // query trips where status is Published or Ongoing, soonest start date first (removed mock mode check - production only)
  const { data, error } = await supabase // Trigger select query transaction on supabase client
    .from('trips') // Target trips database table
    .select('id, title, destination, start_date, status') // Fetch trip details
    .in('status', ['Published', 'Ongoing']) // Restrict to status values in Published or Ongoing
    .order('start_date', { ascending: true }) // Sort ascending by start date chronologically
    .limit(3) // Limit list payload to top 3 items

  // return the list and any error
  return { trips: data || [], error } // Output data records array
} // End fetchActiveTripsPreview function

// fetchRecentActivity gets the last 8 notifications belonging to the department head
// this is the dept head's own user_id, same notifications table as every other role
// Data source: notifications table (same as NotificationBell component)
export async function fetchRecentActivity(userId) { // Begin fetchRecentActivity definition
  // query the 8 most recent notifications for this user (removed mock mode check - production only)
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
