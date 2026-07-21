// import supabase client for database queries
import { supabase } from './supabase' // import supabase configurations (removed isMockSessionActive and mockDb imports - mock mode removed)
// Import notification service for real-time notifications
import { createNotification } from './notificationService' // Import notification helpers
// fetchAllPayments gets every payment record joined with student and trip info
// used for the dept head's global payment tracking page
export async function fetchAllPayments() { // define fetchAllPayments function
  // query payments joined with the related student profile and trip (removed mock mode check - production only)
  const { data, error } = await supabase // execute query on supabase client
    .from('payments') // target the payments table
    .select('*, profiles(full_name, student_id_number), trips(title, currency)') // specify fields and nested relations to join
    .order('created_at', { ascending: false }) // sort results by creation date in descending order
  // return the list and any error
  return { payments: data || [], error } // return consolidated response payload
} // close fetchAllPayments function definition
// fetchPaymentsForTrip gets payments for one specific trip
export async function fetchPaymentsForTrip(tripId) { // define fetchPaymentsForTrip function
  // query payments for this trip only, joined with student profile (removed mock mode check - production only)
  const { data, error } = await supabase // execute query on supabase client
    .from('payments') // target payments database table
    .select('*, profiles(full_name, student_id_number)') // specify attributes and nested profiles join
    .eq('trip_id', tripId) // filter matching targeted trip identifier
    .order('created_at', { ascending: false }) // sort rows chronologically with newest first
  // return the list and any error
  return { payments: data || [], error } // return list and database error
} // close fetchPaymentsForTrip function definition
// sendPaymentReminder marks a payment as Reminded and records the timestamp
// also creates a notification for the student
export async function sendPaymentReminder(paymentId, studentId, tripTitle, announcedCost, currency, tripId = null) { // define sendPaymentReminder function
  // update the payment row to Reminded status with a timestamp (removed mock mode check - production only)
  const { data: payment, error: updateError } = await supabase // run update query on database
    .from('payments') // target payments table
    .update({ // update fields
      status: 'Reminded', // set status enum field value to Reminded
      reminder_sent_at: new Date().toISOString(), // set reminder sent timestamp
    }) // end updates list
    .eq('id', paymentId) // limit update to matching row identifier
    .select()
    .single()
  // if the update failed, return the error
  if (updateError) { // check if error occurred during update
    return { error: updateError } // return early with error payload
  } // close update error checking block
  // create a notification for the student about the payment reminder with full details
  await createNotification({
    userId: studentId,
    title: 'Payment Reminder',
    message: `Reminder: you still owe ${announcedCost} ${currency || 'ETB'} for "${tripTitle}". Please settle this payment.`,
    type: 'Payment',
    referenceId: paymentId,
    referenceTable: 'payments',
    tripId: payment?.trip_id || tripId,
    actionUrl: '/student/payments'
  })
  // return success
  return { error: null } // return successful state with no errors
} // close sendPaymentReminder function definition
// markPaymentPending sets a payment's status to Pending
// used by the dept head as a manual marker meaning "payment is being processed / awaited"
export async function markPaymentPending(paymentId) { // define markPaymentPending function
  // update the payment status (removed mock mode check - production only)
  const { error } = await supabase // execute update statement
    .from('payments') // target the payments table
    .update({ status: 'Pending' }) // update status field value to Pending
    .eq('id', paymentId) // filter matching payment row identifier
  // return any error
  return { error } // return execution error status
} // close markPaymentPending function definition
// updatePaymentNotes lets the dept head attach a free-text note to a payment
// for example recording a partial payment or receipt reference
export async function updatePaymentNotes(paymentId, notes) { // define updatePaymentNotes function
  // update the notes field on the payment row (removed mock mode check - production only)
  const { error } = await supabase // execute update statement
    .from('payments') // target the payments table
    .update({ notes }) // inject updated custom notes string
    .eq('id', paymentId) // filter matching payment row identifier
  // return any error
  return { error } // return transaction error status
} // close updatePaymentNotes function definition
