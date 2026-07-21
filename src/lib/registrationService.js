// Import the single supabase database client instance to perform database operations
import { supabase } from './supabase' // Connect database client
// Import the private file upload helper for security-controlled documents
import { uploadPrivateFile } from './storage' // Connect file storage upload helper

// Fetch all trips currently visible to student users (Published, Ongoing, Completed)
export async function fetchPublishedTrips() { // Define asynchronous fetchPublishedTrips function
  // Query the trips table for records whose status matches one of the active student-facing phases
  const { data, error } = await supabase // Use database client to execute search query
    .from('trips') // Specify trips database table
    .select('*') // Query all database fields
    .in('status', ['Published', 'Ongoing', 'Completed']) // Limit status filters strictly to student-visible states
    .order('start_date', { ascending: true }) // Order the matched rows chronologically by starting date
  // Return the fetched array list of published trips along with any database error
  return { trips: data || [], error } // Output trips payload
} // End of fetchPublishedTrips function

// Fetch full detail parameters of a specific educational trip by its ID
export async function fetchTripDetail(tripId) { // Accept target trip row ID
  // Query the trips table for a single row matching the specified ID parameter
  const { data, error } = await supabase // Use database client to execute query
    .from('trips') // Specify trips database table
    .select('*') // Query all database fields
    .eq('id', tripId) // Filter matching target ID
    .single() // Expect only a single row to be returned
  // Return the matched trip row object along with any database error
  return { trip: data, error } // Output matched trip payload
} // End of fetchTripDetail function

// Check if the current student already registered for a specific trip to prevent duplicates
export async function fetchMyRegistrationForTrip(studentId, tripId) { // Accept student ID and trip ID
  // Query the registrations table matching both parameters and fetching a single optional row
  const { data, error } = await supabase // Use database client to execute check query
    .from('registrations') // Specify registrations database table
    .select('*') // Query all database fields
    .eq('student_id', studentId) // Filter matching current student's ID
    .eq('trip_id', tripId) // Filter matching targeted trip's ID
    .maybeSingle() // Expect zero or one row returned safely without throwing errors
  // Return the fetched registration record or null along with any database error
  return { registration: data, error } // Output registration payload
} // End of fetchMyRegistrationForTrip function

// Fetch every registration ever submitted by the current student along with trip details
export async function fetchMyRegistrations(studentId) { // Accept student ID parameter
  // Query the registrations table for this student, joining related trip record details in one query
  const { data, error } = await supabase // Use database client to execute join query
    .from('registrations') // Specify registrations database table
    .select('*, trips(*)') // Query all registration fields and perform nested join for parent trip rows
    .eq('student_id', studentId) // Filter matching current student's ID
    .order('applied_at', { ascending: false }) // Order registrations newest first
  // Return the fetched array list of registrations along with any database error
  return { registrations: data || [], error } // Output student registration payload
} // End of fetchMyRegistrations function

// Register a student for an educational trip, uploading private consent forms first if provided
export async function registerForTrip(studentId, tripId, consentFile) { // Accept student ID, trip ID, and file object
  // Initialize file path variable to store private storage upload path
  let consentPath = null // Fallback to null path if no file is provided
  // Check if a parental consent form file was passed for upload
  if (consentFile) { // If file exists
    // Execute private file upload to the securely protected 'consent-forms' storage bucket
    const { filePath, error: uploadError } = await uploadPrivateFile( // Request secure storage upload
      'consent-forms', // Specify secure consent-forms storage bucket
      studentId, // Scopes path to student's unique user ID directory
      consentFile // Provide the binary file upload object
    ) // Finish file upload request
    // Check if the file storage upload process returned an error
    if (uploadError) { // If storage upload failed
      // Return early with null registration and the returned upload error payload
      return { registration: null, error: uploadError } // Halt and report error
    } // End of upload error check
    // Save the returned unique storage filepath if upload succeeded
    consentPath = filePath // Assign storage path to variable
  } // End of file existence check block
  // Insert a new registration row record inside the registrations database table
  const { data, error } = await supabase // Use database client to execute insert query
    .from('registrations') // Specify registrations database table
    .insert({ // Define insert data structure payload
      student_id: studentId, // Map registering student's user ID
      trip_id: tripId, // Map targeted trip's unique ID
      // Any newly created registration must strictly start in the Pending status state
      status: 'Pending', // Set initial status to Pending
      // Store secure private parental consent storage filepath or null fallback
      parental_consent_url: consentPath, // Save document storage path
    }) // Finish insertion mapping
    .select() // Return the inserted database row
    .single() // Confirm single row returned
    
  if (error) return { registration: null, error }
  
  // Create notification for department heads about new registration
  try {
    // Get student and trip details
    const { data: studentProfile } = await supabase // Query profiles table to get student's full name for notification message
      .from('profiles') // Target profiles table
      .select('full_name') // Select only full_name field
      .eq('id', studentId) // Filter by student ID
      .single() // Expect single row
    
    const { data: trip } = await supabase // Query trips table to get trip title for notification message
      .from('trips') // Target trips table
      .select('title') // Select only title field
      .eq('id', tripId) // Filter by trip ID
      .single() // Expect single row
    
    // Get all department heads
    const { data: deptHeads, error: deptHeadError } = await supabase // Query profiles table to find all department head accounts
      .from('profiles') // Target profiles table
      .select('id') // Select only id field for notification recipient
      .eq('role', 'departmentHead') // Filter by role equals departmentHead
    
    if (deptHeads && deptHeads.length > 0 && studentProfile && trip) { // Verify all required data exists before creating notifications
      const notifications = deptHeads.map(deptHead => ({ // Create notification object for each department head
        user_id: deptHead.id, // Set recipient to department head's user ID
        title: 'New Trip Registration', // Set notification title
        message: `${studentProfile.full_name} has registered for "${trip.title}".`, // Set notification message with student and trip details
        type: 'Registration', // Set notification type to Registration
        trip_id: tripId, // Link notification to trip
        link: '/depthead/approvals' // FIXED: corrected route to match actual department head approvals page route
      })) // End notification object mapping
      
      await supabase.from('notifications').insert(notifications) // Insert notifications
    } // End data existence check
  } catch (notifError) { // Catch any unexpected errors in notification creation
    console.error('Failed to create registration notification:', notifError) // Log any errors in notification creation
  } // End try-catch block
  
  // Return the created single registration object along with any database error
  return { registration: data, error: null } // Output registration results
} // End of registerForTrip function

// fetchRegistrationsForTrip gets every registration for one trip
// joined with the student's profile so the dept head can see names
// used on the trip's registration management page
export async function fetchRegistrationsForTrip(tripId) {
  // query registrations for this trip, joining the student's profile data
  const { data, error } = await supabase
    .from('registrations')
    .select('*, profiles(full_name, student_id_number, phone_number)')
    .eq('trip_id', tripId)
    .order('applied_at', { ascending: true })

  // return the list and any error
  return { registrations: data || [], error }
}

// fetchAllPendingRegistrations gets every Pending registration across all trips
// joined with both the student profile and the trip info
// used for a global "needs attention" queue on the dept head dashboard
export async function fetchAllPendingRegistrations() {
  // query all registrations with status Pending, joined with student and trip data
  const { data, error } = await supabase
    .from('registrations')
    .select('*, profiles(full_name, student_id_number), trips(title, destination, spots_remaining, cost_per_student, currency, payment_due_date)')
    .eq('status', 'Pending')
    .order('applied_at', { ascending: true })

  // return the list and any error
  return { registrations: data || [], error }
}

// approveRegistration handles the full approval workflow in sequence:
// 1. re-check the trip still has spots remaining
// 2. decrement spots_remaining by 1
// 3. update the registration status to Approved
// 4. create a payment row for this student and trip
// 5. create a notification telling the student they were approved
export async function approveRegistration(registrationId, tripId, studentId, costPerStudent, paymentDueDate) {
  // step 1: fetch the current trip to check spots_remaining right before approving
  // this guards against approving into a trip that filled up between page load and click
  const { data: currentTrip, error: tripFetchError } = await supabase
    .from('trips')
    .select('spots_remaining')
    .eq('id', tripId)
    .single()

  // if we could not fetch the trip, stop and return the error
  if (tripFetchError || !currentTrip) {
    return { error: tripFetchError || new Error('Trip not found') }
  }

  // if there are no spots left, block the approval with a clear error
  if (currentTrip.spots_remaining <= 0) {
    return { error: { message: 'No spots remaining on this trip. Cannot approve.' } }
  }

  // step 2: decrement spots_remaining by exactly 1
  const { error: decrementError } = await supabase
    .from('trips')
    .update({ spots_remaining: currentTrip.spots_remaining - 1 })
    .eq('id', tripId)

  // if the decrement failed, stop here before touching the registration
  if (decrementError) {
    return { error: decrementError }
  }

  // step 3: update the registration status to Approved
  const { error: regUpdateError } = await supabase
    .from('registrations')
    .update({
      status: 'Approved',
      decided_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  // if this failed, the spot decrement above already happened
  // this is a known tradeoff without a database transaction wrapper
  // return the error so the dept head can investigate the mismatch
  if (regUpdateError) {
    return { error: regUpdateError }
  }

  // step 4: create the payment row for this student and trip
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      student_id: studentId,
      trip_id: tripId,
      announced_cost: costPerStudent,
      status: 'Announced',
      payment_due_date: paymentDueDate || null,
    })

  // payment creation failure is logged but does not block the approval itself
  if (paymentError) {
    console.error('Payment row creation failed after approval:', paymentError.message)
  }

  // step 5: create a notification for the student
  try { // Begin try block for notification creation
    const { data: trip } = await supabase // Query trip title for notification message
      .from('trips') // Target trips table
      .select('title') // Select title field
      .eq('id', tripId) // Filter by trip ID
      .single() // Expect single row
    
    await supabase // Insert notification into database
      .from('notifications') // Target notifications table
      .insert({ // Notification payload object
        user_id: studentId, // Set recipient to student ID
        title: 'Registration Approved', // Set notification title
        message: `Your registration for "${trip?.title || 'the trip'}" has been approved. Check your payment details.`, // Set notification message
        type: 'Registration', // Set notification type
        trip_id: tripId, // Link to trip
        link: '/student/my-trips' // FIXED: removed reference_id and reference_table columns that don't exist in schema
      }) // End notification payload
  } catch (notifError) { // Catch unexpected errors
    // Silently continue if notification fails
  } // End try-catch block

  // return success with no error
  return { error: null }
}

// rejectRegistration updates status to Rejected with a required decision note
// and notifies the student, without touching spots_remaining
export async function rejectRegistration(registrationId, studentId, tripId, decisionNote) {
  // update the registration row
  const { error: regUpdateError } = await supabase
    .from('registrations')
    .update({
      status: 'Rejected',
      decided_at: new Date().toISOString(),
      decision_note: decisionNote,
    })
    .eq('id', registrationId)

  // if the update failed, return the error
  if (regUpdateError) {
    return { error: regUpdateError }
  }

  // create a notification for the student explaining the rejection
  try {
    const { data: trip } = await supabase
      .from('trips')
      .select('title')
      .eq('id', tripId)
      .single()
    
    await supabase
      .from('notifications')
      .insert({
        user_id: studentId, // Set recipient to student who was rejected
        title: 'Registration Update', // Set notification title
        message: `Your registration for "${trip?.title || 'the trip'}" was not approved. Reason: ${decisionNote}`, // Set notification message with reason
        type: 'Registration', // Set notification type
        trip_id: tripId, // Link to trip
        link: '/student/my-trips' // FIXED: removed reference_id and reference_table columns that don't exist in schema
      })
  } catch (notifError) {
    console.error('Failed to create rejection notification:', notifError)
  }

  // return success
  return { error: null }
}
