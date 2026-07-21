// Import standard React state and hook helpers for managing UI elements
import { useState, useEffect } from 'react' // Import hooks
// Import payment tracking service actions from the local service library
import { fetchAllPayments, sendPaymentReminder, markPaymentPending } from '../../lib/paymentService' // Import functions
// Define the primary React function component for the PaymentTrackingPage
function PaymentTrackingPage() { // Start PaymentTrackingPage component
  // Define state to hold the list of user payment rows fetched from database
  const [payments, setPayments] = useState([]) // Set payments state
  // Define state to track if a database fetch is active
  const [loading, setLoading] = useState(true) // Set loading state
  // Define state to filter payment results by their status (All, Announced, Reminded, Pending)
  const [statusFilter, setStatusFilter] = useState('All') // Set statusFilter state
  // Define state to display success feedback messages
  const [statusMessage, setStatusMessage] = useState('') // Set statusMessage state
  // Define state to disable form actions for a row while processing updates
  const [processingId, setProcessingId] = useState(null) // Set processingId state
  // Define async function to load all payment rows from database
  const loadPayments = async () => { // Start loadPayments definition
    setLoading(true) // Set loading to true before database call
    const { payments: data } = await fetchAllPayments() // Fetch joined records
    setPayments(data) // Save fetched array records to state
    setLoading(false) // Toggle loading back to false
  } // End loadPayments function
  // Fetch payment records exactly once upon initial page mount
  useEffect(() => { // Start useEffect block
    loadPayments() // Invoke loading action helper
  }, []) // Empty array to restrict trigger to mounting phase
  // Display a temporary feedback status bar that vanishes after three seconds
  const showStatus = (message) => { // Start showStatus definition
    setStatusMessage(message) // Inject text string to state
    setTimeout(() => setStatusMessage(''), 3000) // Trigger timer to reset status
  } // End showStatus function
  // Handler to submit a payment reminder notification trigger
  const handleSendReminder = async (payment) => { // Start handleSendReminder definition
    setProcessingId(payment.id) // Disable controls by locking row ID
    const { error } = await sendPaymentReminder( // Invoke backend service update
      payment.id, // Row identifier
      payment.student_id, // Student user ID to notify
      payment.trips?.title || 'your trip', // Name of trip to print in alert
      payment.announced_cost, // Owed cost value
      payment.trips?.currency || 'ETB' // Currency symbol fallback
    ) // End backend call
    setProcessingId(null) // Re-enable user interaction controls
    if (!error) { // If update statement returned no errors
      setPayments(payments.map((p) => // Update local payment record array attributes
        p.id === payment.id ? { ...p, status: 'Reminded', reminder_sent_at: new Date().toISOString() } : p // Map updated status
      )) // End local map updates
      showStatus(`Reminder sent to ${payment.profiles?.full_name || 'Student'}.`) // Print success details
    } // End check conditional block
  } // End handleSendReminder definition
  // Handler to manually classify payment record status as Pending (Awaiting)
  const handleMarkPending = async (payment) => { // Start handleMarkPending definition
    setProcessingId(payment.id) // Disable row actions during query run
    const { error } = await markPaymentPending(payment.id) // Invoke backend status transition
    setProcessingId(null) // Re-enable control buttons
    if (!error) { // Check if update succeeded without error
      setPayments(payments.map((p) => // Map updated statuses inside local array
        p.id === payment.id ? { ...p, status: 'Pending' } : p // Set status key
      )) // Close map update
      showStatus(`Payment marked as Pending for ${payment.profiles?.full_name || 'Student'}.`) // Alert success
    } // Close error validation check block
  } // End handleMarkPending definition
  // Filter local payments list according to currently selected filter tab
  const filteredPayments = statusFilter === 'All' // If All tab is active
    ? payments // Return full array list
    : payments.filter((p) => p.status === statusFilter) // Else filter rows by status field match
  // Define mapping of CSS classes for each distinct payment status badge
  const statusColors = { // Start statusColors object mapping
    Announced: 'bg-white/10 text-[#6B7F9F]', // Muted white styles for initial Announced state
    Reminded: 'bg-yellow-500/20 text-yellow-400', // Yellow highlighted alerts for sent reminders
    Pending: 'bg-cyan-main/20 text-cyan-main', // Cyan highlighted processing status styles
  } // End statusColors object definition
  // Render the PaymentTrackingPage component markup layout
  return ( // Start JSX structure returning
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Viewport page wrapper container */}
      <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Payment Tracking</h1> {/* Primary screen heading */}
      <p className="text-[#4A5F7F] font-sans text-sm mb-6"> {/* Subtitle container block */}
        Monitor and follow up on student trip payments {/* Static helper texts instructions */}
      </p> {/* End subtitle paragraph */}
      {statusMessage && ( // Conditional render for feedback alert boxes
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 max-w-2xl"> {/* Alert border styles */}
          <p className="text-green-400 font-sans text-sm">{statusMessage}</p> {/* Output feedback messages */}
        </div> // End alert box
      )} {/* Close conditional check */}
      <div className="flex gap-2 mb-6 flex-wrap"> {/* Flex container for filter buttons */}
        {['All', 'Announced', 'Reminded', 'Pending'].map((status) => ( // Loop through available status categories
          <button // Filter trigger button
            key={status} // Bind key
            onClick={() => setStatusFilter(status)} // Change filter state value on click
            className={`px-4 py-2 rounded-lg font-sans text-xs font-semibold uppercase tracking-wide transition-all ${ // Base styles
              statusFilter === status // If this status button is active
                ? 'bg-gold text-charcoal' // Golden high-contrast style
                : 'bg-white/5 text-[#5A6F8F] hover:bg-white/10' // Else fallback muted styling
            }`} // End style injection
          > {/* Button text label */}
            {status} {/* Label matching string */}
          </button> // Close filter button tag
        ))} {/* Close button loops mapping */}
      </div> {/* End filter buttons container row */}
      {loading ? ( // Conditional render for page loading state placeholders
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Gold pulsing text style */}
          Loading Payments... {/* Text message strings */}
        </p> // End loading placeholder tag
      ) : filteredPayments.length === 0 ? ( // Nested check if filtered payments list is empty
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E5EDFF] max-w-md"> {/* Muted layout card */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Soft styling text */}
            No payments found for this filter. {/* Static message string */}
          </p> {/* End empty message paragraph */}
        </div> // End empty card wrapper
      ) : ( // Render payments list rows when matching records exist
        <div className="bg-white rounded-2xl border border-[#E5EDFF] overflow-hidden max-w-4xl"> {/* Consolidated card grid */}
          {filteredPayments.map((payment, index) => ( // Loop through each payment record row
            <div // Record item row wrapper
              key={payment.id} // Bind payment row ID
              className={`p-4 flex items-center justify-between flex-wrap gap-3 ${ // Flex layout
                index !== filteredPayments.length - 1 ? 'border-b border-[#E5EDFF]' : '' // Conditional divider line
              }`} // End style injection
            > {/* Item columns container */}
              <div> {/* Left column details */}
                <p className="text-[#1E3A5F] font-sans text-sm font-semibold"> {/* Student name paragraph */}
                  {payment.profiles?.full_name} {/* Student's full name */}
                </p> {/* Close name layout */}
                <p className="text-[#4A5F7F] font-sans text-xs"> {/* ID and trip metadata styling */}
                  {payment.profiles?.student_id_number} — {payment.trips?.title} {/* Student ID and parent trip title */}
                </p> {/* Close details paragraph */}
              </div> {/* Close left details container column */}
              <div className="text-right"> {/* Center right numerical amount details */}
                <p className="text-gold font-sans text-sm font-semibold"> {/* Gold colored cash price text */}
                  {payment.announced_cost} {payment.trips?.currency || 'ETB'} {/* Price and currency suffix */}
                </p> {/* Close price paragraph */}
                {payment.payment_due_date && ( // Render payment deadline details if present
                  <p className="text-white/30 font-sans text-xs"> {/* Muted text styling */}
                    Due: {payment.payment_due_date} {/* Date value string */}
                  </p> // Close deadline paragraph tag
                )} {/* Close deadline conditional check */}
              </div> {/* Close numerical details column */}
              <span className={`text-xs font-sans font-semibold uppercase tracking-wide px-2 py-1 rounded ${statusColors[payment.status]}`}> {/* Badge wrapper */}
                {payment.status} {/* Badge enum string labels */}
              </span> {/* Close badge tag */}
              <div className="flex gap-2"> {/* Right actions triggers column */}
                {payment.status !== 'Reminded' && ( // Check if reminder is not already dispatched to avoid duplicate spamming
                  <button // Send Reminder button
                    onClick={() => handleSendReminder(payment)} // Invoke trigger handler on click
                    disabled={processingId === payment.id} // Disable while querying
                    className="text-xs font-sans text-cyan-main hover:text-cyan-300 disabled:opacity-50 transition-colors" // Cyan style
                  > {/* Button text label */}
                    Send Reminder {/* Action label */}
                  </button> // Close reminder button tag
                )} {/* Close reminder check block */}
                {payment.status !== 'Pending' && ( // Check if state is not already set to Pending
                  <button // Mark Pending button
                    onClick={() => handleMarkPending(payment)} // Invoke state transition helper on click
                    disabled={processingId === payment.id} // Disable while querying
                    className="text-xs font-sans text-[#5A6F8F] hover:text-white/80 disabled:opacity-50 transition-colors" // Muted gray style
                  > {/* Button text label */}
                    Mark Pending {/* Action label */}
                  </button> // Close mark pending button tag
                )} {/* Close pending check block */}
              </div> {/* Close actions triggers wrapper column */}
            </div> // Close item row wrapper
          ))} {/* Close map loop block */}
        </div> // End payments row list container
      )} {/* Close payments empty validation checks block */}
    </div> // End page viewport wrapper
  ) // End return block
} // End PaymentTrackingPage component definition
export default PaymentTrackingPage // Export default payment tracking component
