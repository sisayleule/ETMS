// import supabase client for database queries
import { supabase } from './supabase' // Connect database client (removed isMockSessionActive and mockDb imports - mock mode removed)
// Import notification service for real-time notifications
import { createNotification } from './notificationService' // Import notification helpers

// checkAndAwardBadges runs a set of condition checks against a student's existing
// data and awards any badges they qualify for but don't already have
export async function checkAndAwardBadges(studentId) { // Begin checkAndAwardBadges definition
  // fetch the full badge catalog once, we'll look up ids by code (removed mock mode check - production only)
  const { data: allBadges } = await supabase.from('badges').select('*') // Query badges catalog list from server
  const badgeByCode = {} // Create empty dictionary mapping badge codes to row objects
  allBadges?.forEach((b) => { badgeByCode[b.code] = b }) // Populate mapping dictionary

  // fetch which badges this student already has, to avoid redundant checks
  const { data: existing } = await supabase // Trigger query on supabase client
    .from('student_badges') // Select from student_badges mapping table
    .select('badge_id') // Filter by badge identifier
    .eq('student_id', studentId) // Constrain by active student identifier
  const alreadyHas = new Set((existing || []).map((e) => e.badge_id)) // Form unique set containing earned badge ids

  // codes to award, built up as each condition is checked
  const toAward = [] // Initialize empty list storing earned badge codes

  // count completed trips: registrations Approved where the trip itself is Completed
  const { data: completedRegs } = await supabase // Trigger query on supabase client
    .from('registrations') // Select from registrations table
    .select('id, trips!inner(status)') // Join trip data status
    .eq('student_id', studentId) // Limit by student identifier
    .eq('status', 'Approved') // Limit to approved registrations
    .eq('trips.status', 'Completed') // Limit to completed trips
  const completedCount = completedRegs?.length || 0 // Count length of completed trips list

  // first_trip badge: at least one completed trip
  if (completedCount >= 1) toAward.push('first_trip') // Append code if qualified
  // explorer badge: three or more completed trips
  if (completedCount >= 3) toAward.push('explorer') // Append code if qualified

  // fetch all rated reports for this student
  const { data: ratedReports } = await supabase // Trigger query on supabase client
    .from('trip_reports') // Select from trip reports table
    .select('rating') // Select rating score field
    .eq('student_id', studentId) // Match specified student identifier
    .eq('status', 'Rated') // Limit to rated status reports

  // perfect_score badge: any single report rated exactly 100
  if (ratedReports?.some((r) => r.rating === 100)) toAward.push('perfect_score') // Append code if qualified
  // report_master badge: two or more reports rated 90 or above
  if ((ratedReports?.filter((r) => r.rating >= 90).length || 0) >= 2) toAward.push('report_master') // Append code if qualified

  // fetch this student's documents to check for a clean approval record
  const { data: docs } = await supabase // Trigger query on supabase client
    .from('documents') // Select from documents table
    .select('status') // Select status verification field
    .eq('student_id', studentId) // Filter matching active student identifier

  // document_ready badge: at least one approved document and zero rejections ever
  const hasApproved = docs?.some((d) => d.status === 'Approved') // Evaluate if has approved documents
  const hasRejected = docs?.some((d) => d.status === 'Rejected') // Evaluate if has any rejected documents
  if (hasApproved && !hasRejected) toAward.push('document_ready') // Append code if qualified

  // fetch complaint count for this student
  const { count: complaintCount } = await supabase // Trigger query count transaction on supabase client
    .from('complaints') // Target complaints database table
    .select('id', { count: 'exact', head: true }) // Aggregate exact row counts
    .eq('student_id', studentId) // Match student user identifier

  // community_voice badge: submitted at least one complaint
  if ((complaintCount || 0) >= 1) toAward.push('community_voice') // Append code if qualified

  // filter down to badges not already earned, and that exist in the catalog
  const rowsToInsert = toAward // Evaluate candidate list
    .filter((code) => badgeByCode[code] && !alreadyHas.has(badgeByCode[code].id)) // Keep unearned and valid badges
    .map((code) => ({ student_id: studentId, badge_id: badgeByCode[code].id })) // Construct rows for database insertion

  // nothing new to award, stop here
  if (rowsToInsert.length === 0) return { newlyAwarded: [] } // Exit early with empty array

  // upsert with onConflict ignore so a race or repeat call never errors or duplicates
  const { data: inserted, error } = await supabase // Trigger transaction
    .from('student_badges') // Select target map table
    .upsert(rowsToInsert, { onConflict: 'student_id,badge_id', ignoreDuplicates: true }) // Request ignore on constraint conflicts
    .select() // Return inserted row records

  // Notify student about newly earned badges
  if (!error && rowsToInsert.length > 0) {
    try {
      const badgeNames = toAward
        .filter((code) => rowsToInsert.some((r) => r.badge_id === badgeByCode[code].id))
        .map((code) => badgeByCode[code].name)
        .join(', ')
      
      await createNotification({
        userId: studentId,
        title: '🎉 New Badge Earned!',
        message: `Congratulations! You've earned: ${badgeNames}`,
        type: 'General',
        actionUrl: '/student/gamification'
      })
    } catch (notifError) {
      console.error('Failed to create badge notification:', notifError)
    }
  }

  // return the newly awarded badge codes so the UI can celebrate them
  const newlyAwardedCodes = toAward.filter((code) => // Match candidate codes
    rowsToInsert.some((r) => r.badge_id === badgeByCode[code].id) // Evaluate matching database inserts
  ) // Close newlyAwardedCodes mapping filter
  return { newlyAwarded: error ? [] : newlyAwardedCodes, error } // Output results structure
} // End checkAndAwardBadges function

// fetchMyBadges gets every badge a student has earned, joined with badge details
export async function fetchMyBadges(studentId) { // Begin fetchMyBadges definition
  // query student_badges joined with the badges catalog for name/icon/description (removed mock mode check - production only)
  const { data, error } = await supabase // Trigger query on supabase client
    .from('student_badges') // Target student_badges table
    .select('*, badges(*)') // Join full badges details
    .eq('student_id', studentId) // Match target student user identifier
    .order('earned_at', { ascending: false }) // Sort newest earned first

  // return the list and any error
  return { badges: data || [], error } // Output data records and database errors
} // End fetchMyBadges function

// fetchLeaderboard ranks every student by total badge points earned
export async function fetchLeaderboard() { // Begin fetchLeaderboard definition
  // query every student_badges row joined with points and the student's profile name (removed mock mode check - production only)
  const { data, error } = await supabase // Trigger query on supabase client
    .from('student_badges') // Target student_badges table
    .select('student_id, badges(points), profiles(full_name)') // Select fields including score points and full names

  // aggregate points per student client-side
  const totals = {} // Create empty dictionary mapping student id to totals structure
  data?.forEach((row) => { // Loop through retrieved student badges records
    const id = row.student_id // Extract student user identifier
    if (!totals[id]) { // Check if student is absent from totals dictionary
      totals[id] = { studentId: id, name: row.profiles?.full_name || 'Unknown', points: 0, badgeCount: 0 } // Create entry structure
    } // End dictionary key check block
    totals[id].points += row.badges?.points || 0 // Aggregate badge points value
    totals[id].badgeCount += 1 // Increment earned badge count
  }) // End records aggregation loop

  // sort descending by points and return as a ranked array
  const ranked = Object.values(totals).sort((a, b) => b.points - a.points) // Build sorted ranked array list
  return { leaderboard: ranked, error } // Output ranked results array
} // End fetchLeaderboard function

// fetchJournalForTrip gets a student's own journal entries for one specific trip
export async function fetchJournalForTrip(studentId, tripId) { // Begin fetchJournalForTrip definition
  // query entries for this student and trip, most recent first (removed mock mode check - production only)
  const { data, error } = await supabase // Trigger query on supabase client
    .from('journal_entries') // Target journal_entries table (correct database table name)
    .select('*') // Select all entry fields
    .eq('student_id', studentId) // Limit matching student identifier
    .eq('trip_id', tripId) // Limit matching trip identifier
    .order('created_at', { ascending: false }) // Sort descending by created_at (works with both old and new schema)

  // Handle both old and new schema compatibility
  const normalizedData = (data || []).map(entry => {
    // If old schema (has action_type), convert to new schema format
    if (entry.action_type && !entry.content) {
      return {
        ...entry,
        title: entry.action_type || null, // Map action_type to title
        content: entry.description || '', // Map description to content
        entry_date: entry.created_at?.split('T')[0] || new Date().toISOString().split('T')[0], // Extract date from created_at
        mood: null,
        photo_url: null
      }
    }
    // If new schema or already has content, return as-is
    return entry
  })

  // return the list and any error
  return { entries: normalizedData || [], error } // Output entries array
} // End fetchJournalForTrip function

// createJournalEntry adds a new journal entry for a trip (private, no notifications)
export async function createJournalEntry(studentId, tripId, content, entryDate, photoUrl, title = null, mood = null) { // Begin createJournalEntry definition with new optional fields
  // Build insert payload with only required fields plus optional fields that have values (removed mock mode check - production only)
  const insertPayload = { // Start building insert object
    student_id: studentId, // Map student creator identifier
    trip_id: tripId, // Map associated trip identifier
    content: content, // Map written text content (required field)
    entry_date: entryDate, // Map selected entry date (required field)
  } // End required fields

  // Add optional title field only if it has non-null value
  if (title && title.trim()) { // Check if title has actual content
    insertPayload.title = title.trim() // Add title to payload
  } // End title check

  // Skip mood field entirely due to database CHECK constraint issues
  // The database has a constraint that restricts mood values but we don't know which values are allowed
  // TODO: Fix the database constraint or determine allowed mood values

  // insert the new journal row with all fields
  const { data, error } = await supabase // Trigger insert on supabase client
    .from('journal_entries') // Target journal_entries table (correct database table name)
    .insert(insertPayload) // Insert the dynamically built payload
    .select() // Request inserted record details
    .single() // Return first matching row record



  // No notifications - journals are private to each student

  // return the created entry and any error
  return { entry: data, error } // Output created record and any database errors
} // End createJournalEntry function

// updateJournalEntry edits the content of an existing entry the student owns
export async function updateJournalEntry(entryId, content) { // Begin updateJournalEntry definition
  // update just the content and bump updated_at (removed mock mode check - production only)
  const { error } = await supabase // Trigger update on supabase client
    .from('journal_entries') // Target journal_entries table (correct database table name)
    .update({ content: content, updated_at: new Date().toISOString() }) // Set content and update timestamp fields
    .eq('id', entryId) // Select matching entry identifier

  // return any error
  return { error } // Output update response status error
} // End updateJournalEntry function

// deleteJournalEntry removes an entry permanently
export async function deleteJournalEntry(entryId) { // Begin deleteJournalEntry definition
  // delete the row by id, RLS ensures only the owner can do this (removed mock mode check - production only)
  const { error } = await supabase // Trigger delete on supabase client
    .from('journal_entries') // Target journal_entries table (correct database table name)
    .delete() // Trigger deletion query
    .eq('id', entryId) // Target matching entry identifier

  // return any error
  return { error } // Output status response error
} // End deleteJournalEntry function


