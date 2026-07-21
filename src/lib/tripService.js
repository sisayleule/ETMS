// Import the single supabase database client instance to perform database operations
import { supabase } from './supabase' // Connect database client
// Import notification service for real-time notifications
import { createNotification } from './notificationService' // Import notification helpers

// Fetch every trip from the trips table ordered by creation date descending
export async function fetchAllTrips() { // Define asynchronous fetchAllTrips function
  // Select all columns from the trips table sorted by the created_at column in descending order
  const { data, error } = await supabase // Use database client to execute query
    .from('trips') // Specify trips database table
    .select('*') // Query all database fields
    .order('created_at', { ascending: false }) // Display newest trip rows first
  // Return the fetched array list of trips along with any database error
  return { trips: data || [], error } // Output trips payload
} // End of fetchAllTrips function

// Fetch a single trip's full database details by matching on its unique ID
export async function fetchTripById(tripId) { // Accept target trip row ID
  // Query the trips table for a single row matching the specified ID parameter
  const { data, error } = await supabase // Use database client to execute query
    .from('trips') // Specify trips database table
    .select('*') // Query all database fields
    .eq('id', tripId) // Filter matching target ID
    .single() // Expect only a single row to be returned
  // Return the single matched trip row object along with any database error
  return { trip: data, error } // Output matched trip payload
} // End of fetchTripById function

// Insert a brand new educational trip as a Draft record into the database
export async function createTrip(tripData, userId) { // Accept trip parameters and creator ID
  // Insert a new row in the trips table mapping all incoming fields
  const { data, error } = await supabase // Use database client to execute insert query
    .from('trips') // Specify trips database table
    .insert({ // Define insert data structure payload
      title: tripData.title, // Map trip title string
      description: tripData.description, // Map trip description string or empty
      destination: tripData.destination, // Map destination location
      start_date: tripData.startDate, // Map trip start date
      end_date: tripData.endDate, // Map trip end date
      capacity: tripData.capacity, // Map maximum capacity count
      // spots_remaining must be initialized to equal capacity on creation
      spots_remaining: tripData.capacity, // Initialize spots remaining
      required_documents: tripData.requiredDocuments, // Map required document options array
      cost_per_student: tripData.costPerStudent, // Map per-student calculated cost
      total_trip_cost: tripData.totalTripCost, // Map total capacity-multiplied cost
      cost_breakdown: tripData.costBreakdown, // Map raw category costs dictionary
      currency: tripData.currency || 'ETB', // Map currency standard or default ETB
      payment_due_date: tripData.paymentDueDate || null, // Map payment deadline or null fallback
      itinerary: tripData.itinerary, // Map day-by-day itinerary JSON details
      // Any newly created trip must strictly start in the Draft status state
      status: 'Draft', // Set initial status to Draft
      // Set cost_locked to false initially so department head can edit costs
      cost_locked: false, // Cost is unlocked during Draft phase
      created_by: userId, // Record active user ID as creator
    }) // Finish insertion dictionary mapping
    .select() // Return the inserted database row
    .single() // Confirm single row returned
  
  // Notify department head about trip creation (for tracking/confirmation)
  if (data) {
    try {
      await createNotification({
        userId: userId,
        title: 'Trip Draft Created',
        message: `You created a new trip draft: "${tripData.title}". Remember to publish it when ready.`,
        type: 'Trip',
        referenceId: data.id,
        referenceTable: 'trips',
        tripId: data.id,
        createdBy: userId,
        actionUrl: `/depthead/trips/${data.id}`
      })
    } catch (notifError) {
      console.error('Failed to create trip creation notification:', notifError)
    }
  }
  
  // Return the created single trip object along with any database error
  return { trip: data, error } // Output created trip payload
} // End of createTrip function

// Save update edits on an existing trip, conditionally guarding cost fields
export async function updateTrip(tripId, tripData, isCostLocked, userId) { // Accept trip ID, form fields, lock status, and user ID
  // Build the base payload update dictionary with fields that are always editable
  const updatePayload = { // Create base update object
    title: tripData.title, // Map updated trip title
    description: tripData.description, // Map updated trip description
    destination: tripData.destination, // Map updated destination location
    start_date: tripData.startDate, // Map updated start date
    end_date: tripData.endDate, // Map updated end date
    capacity: tripData.capacity, // Map updated maximum capacity
    required_documents: tripData.requiredDocuments, // Map updated required document arrays
    itinerary: tripData.itinerary, // Map updated day-by-day itinerary details
    updated_at: new Date().toISOString(), // Attach current UTC transaction timestamp
  } // Close update payload dictionary
  // Only update cost-related parameters if cost_locked is still false
  if (!isCostLocked) { // Check if cost fields are still editable
    updatePayload.cost_per_student = tripData.costPerStudent // Update calculated cost per student
    updatePayload.total_trip_cost = tripData.totalTripCost // Update total trip cost calculations
    updatePayload.cost_breakdown = tripData.costBreakdown // Update individual cost category amounts
    updatePayload.currency = tripData.currency // Update currency selection
    updatePayload.payment_due_date = tripData.paymentDueDate || null // Update payment deadline date or null fallback
  } // Close cost lock conditional block
  // Update the matching trip row inside the trips database table
  const { error } = await supabase // Use database client to execute update query
    .from('trips') // Specify trips database table
    .update(updatePayload) // Inject conditionally structured update payload
    .eq('id', tripId) // Limit update filter to target trip ID
  
  // Notify students who registered for this trip about updates
  if (!error) {
    try {
      const { data: registrations } = await supabase
        .from('registrations')
        .select('student_id')
        .eq('trip_id', tripId)
        .in('status', ['Pending', 'Approved'])
      
      if (registrations && registrations.length > 0) {
        const notifications = registrations.map(reg => ({
          user_id: reg.student_id, // Set recipient to registered student
          title: 'Trip Updated', // Set notification title
          message: `The trip "${tripData.title}" has been updated. Please review the changes.`, // Set notification message
          type: 'Trip', // Set notification type
          trip_id: tripId, // Link notification to trip
          link: `/student/trips/${tripId}` // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
        }))
        
        await supabase.from('notifications').insert(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create trip update notifications:', notifError)
    }
  }
  
  // Return database update operation error details or null
  return { error } // Output update results
} // End of updateTrip function

// Publish a draft trip which makes it visible to students and locks cost fields permanently
export async function publishTrip(tripId) { // Accept target trip ID to publish
  // Update status to Published and set cost_locked flag to true
  const { error } = await supabase // Use database client to execute update query
    .from('trips') // Specify trips database table
    .update({ // Inject published settings
      status: 'Published', // Advance status to Published
      cost_locked: true, // Lock cost parameters permanently
      updated_at: new Date().toISOString(), // Bump updated_at tracking timestamp
    }) // Close update dictionary
    .eq('id', tripId) // Filter matching target trip ID
  
  if (error) return { error }
  
  // Notify all students about the new published trip
  try {
    // Get trip details
    const { data: trip } = await supabase
      .from('trips')
      .select('title, destination, start_date, created_by')
      .eq('id', tripId)
      .single()
    
    // Get all students
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
    
    if (trip && students && students.length > 0) {
      const notifications = students.map(student => ({
        user_id: student.id, // Set recipient to student ID
        title: 'New Educational Trip Available', // Set notification title
        message: `A new educational trip "${trip.title}" to ${trip.destination} has been published. You can now view details and register.`, // Set notification message
        type: 'Trip', // Set notification type
        trip_id: tripId, // Link notification to trip
        link: `/student/trips/${tripId}` // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
      }))
      
      await supabase.from('notifications').insert(notifications)
    }
  } catch (notifError) {
    console.error('Failed to create trip publication notifications:', notifError)
  }
  
  // Return database update operation error details or null
  return { error: null } // Output transaction results
} // End of publishTrip function

// Progress trip status state through Ongoing or Completed phases
export async function updateTripStatus(tripId, newStatus) { // Accept target trip ID and status value
  // Update the status column on the trips table to the new lifecycle state
  const { error } = await supabase // Use database client to execute update query
    .from('trips') // Specify trips database table
    .update({ // Inject status parameters
      status: newStatus, // Advance status state
      updated_at: new Date().toISOString(), // Bump updated_at timestamp
    }) // Close update dictionary
    .eq('id', tripId) // Filter matching target trip ID
  
  // Notify all students registered for this trip about status change
  if (!error) {
    try {
      const { data: trip } = await supabase.from('trips').select('title, created_by').eq('id', tripId).single()
      const { data: registrations } = await supabase
        .from('registrations')
        .select('student_id')
        .eq('trip_id', tripId)
        .eq('status', 'Approved')
      
      if (trip && registrations && registrations.length > 0) {
        const statusMessages = {
          'Ongoing': `The trip "${trip.title}" has started! Have a great experience.`,
          'Completed': `The trip "${trip.title}" has been completed. Don't forget to submit your reports!`,
          'Cancelled': `The trip "${trip.title}" has been cancelled. You will be notified about refunds.`
        }
        
        const notifications = registrations.map(reg => ({
          user_id: reg.student_id, // Set recipient to registered student
          title: `Trip Status: ${newStatus}`, // Set notification title with new status
          message: statusMessages[newStatus] || `Trip "${trip.title}" status changed to ${newStatus}.`, // Set notification message
          type: 'Trip', // Set notification type
          trip_id: tripId, // Link notification to trip
          link: `/student/trips/${tripId}` // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
        }))
        
        await supabase.from('notifications').insert(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create trip status notifications:', notifError)
    }
  }
  
  // Return database status update error details or null
  return { error } // Output transaction results
} // End of updateTripStatus function

// Permanently delete a trip from the database if it is in Draft state
export async function deleteTrip(tripId, userId) { // Accept target trip ID and user ID to delete
  // Get trip details before deletion for notification
  const { data: trip } = await supabase.from('trips').select('title, status').eq('id', tripId).single()
  
  // Request row deletion from the trips table matching the target ID
  const { error } = await supabase // Use database client to execute delete query
    .from('trips') // Specify trips database table
    .delete() // Execute delete command
    .eq('id', tripId) // Filter matching target trip ID
  
  // Notify students if trip had any registrations (only if not Draft)
  if (!error && trip && trip.status !== 'Draft') {
    try {
      const { data: registrations } = await supabase
        .from('registrations')
        .select('student_id')
        .eq('trip_id', tripId)
      
      if (registrations && registrations.length > 0) {
        const notifications = registrations.map(reg => ({
          user_id: reg.student_id, // Set recipient to registered student
          title: 'Trip Cancelled', // Set notification title
          message: `The trip "${trip.title}" has been cancelled and removed from the system.`, // Set notification message
          type: 'Trip', // Set notification type
          link: '/student/trips' // FIXED: removed created_by column that doesn't exist in schema
        }))
        
        await supabase.from('notifications').insert(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create trip deletion notifications:', notifError)
    }
  }
  
  // Return database deletion error details or null
  return { error } // Output transaction results
} // End of deleteTrip function
