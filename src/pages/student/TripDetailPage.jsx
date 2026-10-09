// TripDetailPage displays full educational trip detail metrics and handles registrations
import { useState, useEffect } from 'react' // Import React and standard state/effect hooks
import { useParams, useNavigate } from 'react-router-dom' // Import router hooks to query params and navigate paths
import { useAuth } from '../../context/AuthContext' // Import auth custom hook to retrieve active user credentials
import { // Import services from the registration service module
  fetchTripDetail, // Import trip detail retriever function
  fetchMyRegistrationForTrip, // Import user registration checker function
  registerForTrip, // Import registration submission function
} from '../../lib/registrationService' // Connect registration service
import { // Import registration forms service functions for medical and emergency contact data
  fetchMedicalForm, // Import function to retrieve existing medical form data
  upsertMedicalForm, // Import function to create or update medical form
  fetchEmergencyContact, // Import function to retrieve existing emergency contact
  upsertEmergencyContact, // Import function to create or update emergency contact
  markFormsCompleted, // Import function to flag registration forms as completed
  validateMedicalForm, // Import validation function for medical form
  validateEmergencyContact, // Import validation function for emergency contact form
} from '../../lib/registrationFormsService' // Connect registration forms service
// Define main TripDetailPage component
function TripDetailPage() { // Open component definition
  const { id } = useParams() // Extract the trip ID parameter from URL route path
  const navigate = useNavigate() // Initialize navigate helper to redirect back to browse catalog
  const { user } = useAuth() // Extract active logged-in user details from auth context provider
  const [trip, setTrip] = useState(null) // Manage state containing matched trip details object
  const [myRegistration, setMyRegistration] = useState(null) // Manage state containing optional registration row for this user
  const [loading, setLoading] = useState(true) // Manage state tracking initial database loading transitions
  const [showRegisterForm, setShowRegisterForm] = useState(false) // Manage visibility state of inline confirmation form panel
  
  // Medical form state variables for registration
  const [medicalForm, setMedicalForm] = useState({ // Manage medical form data state object
    bloodType: '', // Store selected blood group value
    allergies: '', // Store allergies text content
    medications: '', // Store current medications text
    medicalConditions: '', // Store medical conditions text
    emergencyMedicalNotes: '', // Store emergency medical notes text
  }) // End medical form state initialization
  
  // Emergency contact form state variables for registration
  const [emergencyContact, setEmergencyContact] = useState({ // Manage emergency contact form data state object
    fullName: '', // Store contact full name
    relationship: '', // Store relationship to student
    phoneNumber: '', // Store primary phone number
    alternativePhone: '', // Store alternative phone number (optional)
    address: '', // Store contact address
  }) // End emergency contact state initialization
  
  const [existingContactId, setExistingContactId] = useState(null) // Track existing emergency contact ID for updates
  
  const [submitting, setSubmitting] = useState(false) // Manage submission transaction indicator state to prevent double clicks
  const [error, setError] = useState('') // Manage local error message feedback alerts
  const [successMessage, setSuccessMessage] = useState('') // Manage local success message feedback alerts
  const loadData = async () => { // Define helper function to load details and previous submissions together
    setLoading(true) // Activate loading spinner state
    const { trip: tripData, error: tripError } = await fetchTripDetail(id) // Retrieve trip row from database
    if (tripError || !tripData) { // If trip wasn't found or error was raised
      setError('Trip not found.') // Set localized not found warning
      setLoading(false) // Turn off loading state
      return // Halt execution early
    } // End of verification block
    setTrip(tripData) // Save fetched trip object to local state
    const { registration } = await fetchMyRegistrationForTrip(user.id, id) // Query existing registrations for current student on this trip
    setMyRegistration(registration) // Save found registration record or null to local state
    
    // Pre-fill medical form if exists from previous registration or profile setup
    const { medicalForm: existingMedical } = await fetchMedicalForm(user.id) // Query existing health_info row for this student
    if (existingMedical) { // Check if medical data was found
      setMedicalForm({ // Pre-populate medical form state with existing data
        bloodType: existingMedical.blood_type || '', // Map blood_type column to bloodType field
        allergies: existingMedical.allergies || '', // Map allergies column
        medications: existingMedical.medications || '', // Map medications column
        medicalConditions: existingMedical.medical_conditions || '', // Map medical_conditions column
        emergencyMedicalNotes: existingMedical.emergency_medical_notes || '', // Map emergency_medical_notes column
      }) // End medical form pre-fill
    } // End medical data check
    
    // Pre-fill emergency contact form if exists from previous registration or profile setup
    const { emergencyContact: existingContact } = await fetchEmergencyContact(user.id) // Query existing emergency_contacts row for this student
    if (existingContact) { // Check if emergency contact was found
      setExistingContactId(existingContact.id) // Store the contact ID for later updates
      setEmergencyContact({ // Pre-populate emergency contact form state with existing data
        fullName: existingContact.contact_name || '', // Map contact_name column to fullName field
        relationship: existingContact.relationship || '', // Map relationship column
        phoneNumber: existingContact.contact_phone || '', // Map contact_phone column to phoneNumber field
        alternativePhone: existingContact.alternative_phone || '', // Map alternative_phone column
        address: existingContact.address || '', // Map address column
      }) // End emergency contact pre-fill
    } // End emergency contact check
    
    setLoading(false) // Turn off visual loading state
  } // End of loadData helper definition
  useEffect(() => { // Mount hook to trigger database fetching if trip ID changes
    loadData() // Fetch details once on mounting
  }, [id]) // Re-run effect if URL id parameter updates
  const requiresConsent = false // Document upload removed from registration flow (now handled post-approval)
  
  const handleRegisterClick = () => { // Define register button click handler
    setError('') // Reset active warning alerts
    setShowRegisterForm(true) // Display medical and emergency contact forms
  } // End of click handler
  const handleSubmitRegistration = async () => { // Define submission handler to execute registrations
    setError('') // Reset any active warning alerts
    
    if (trip.spots_remaining <= 0) { // Check if there are no open registration spots left on the trip
      setError('This trip is fully booked.') // Set capacity warning alert
      return // Halt submission
    } // End of capacity check
    
    // Validate medical form before submission
    const medicalError = validateMedicalForm(medicalForm) // Run validation function on medical form data
    if (medicalError) { // Check if validation returned an error message
      setError(medicalError) // Display validation error to user
      return // Halt submission
    } // End medical validation check
    
    // Validate emergency contact form before submission
    const contactError = validateEmergencyContact(emergencyContact) // Run validation function on emergency contact data
    if (contactError) { // Check if validation returned an error message
      setError(contactError) // Display validation error to user
      return // Halt submission
    } // End emergency contact validation check
    
    setSubmitting(true) // Turn on submit indicator lock state
    
    // Step 1: Upsert medical form data to health_info table
    const { medicalForm: savedMedical, error: medicalSaveError } = await upsertMedicalForm(user.id, medicalForm) // Save or update medical form
    if (medicalSaveError) { // Check if medical form save failed
      setError('Failed to save medical information. Please try again.') // Display error message
      setSubmitting(false) // Release submit lock
      return // Halt submission
    } // End medical save error check
    
    // Step 2: Upsert emergency contact data to emergency_contacts table
    const { emergencyContact: savedContact, error: contactSaveError } = await upsertEmergencyContact(user.id, existingContactId, emergencyContact) // Save or update emergency contact
    if (contactSaveError) { // Check if emergency contact save failed
      setError('Failed to save emergency contact. Please try again.') // Display error message
      setSubmitting(false) // Release submit lock
      return // Halt submission
    } // End contact save error check
    
    // Step 3: Create registration record (no file upload required)
    const { registration, error: registerError } = await registerForTrip( // Submit registration to registrationService helper
      user.id, // Current student's authenticated user ID
      id, // Targeted trip database record ID
      null // No consent file needed - forms replace document upload requirement
    ) // Finish registration helper invocation
    
    if (registerError) { // Check if database rejected the insertion
      if (registerError.code === '23505') { // Code '23505' indicates postgres unique constraint violation
        setError('You have already registered for this trip.') // Inform student about duplicate registration
      } else { // Generic database query insertion error
        setError('Registration failed. Please try again.') // Inform student about general database failure
      } // End of database code checks
      setSubmitting(false) // Release submit lock
      return // Halt execution
    } // End of registration error check
    
    // Step 4: Mark forms as completed on the registration record
    const { error: markError } = await markFormsCompleted(registration.id) // Set forms_completed flag to true
    if (markError) { // Check if marking failed (non-critical)
      console.error('Failed to mark forms as completed:', markError) // Log error for debugging
    } // End mark error check
    
    setSubmitting(false) // Turn off submit indicator lock state
    setMyRegistration(registration) // Store returned pending registration in state
    setShowRegisterForm(false) // Collapse registration submission panel
    setSuccessMessage('Registration submitted! Awaiting department head approval.') // Flash success confirmation banner
  } // End of handleSubmitRegistration definition
  if (loading) { // Render animated loader while initial fetch is active
    return ( // Return loading layout
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center"> {/* Centered layout canvas */}
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse">Loading Trip...</p> {/* Pulsing loader */}
      </div> // Close layout container
    ) // End of loading return statement
  } // End of loading check block
  if (!trip) { // Check if trip load failed completely without populating data
    return ( // Return not found layout
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center"> {/* Centered error container */}
        <p className="text-red-400 font-sans text-sm">{error}</p> {/* Output localized warning message */}
      </div> // Close error container
    ) // End of error return statement
  } // End of trip check block
  const registrationStatusColors = { // Map registration status values to specific Tailwind CSS color classes
    Pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', // Yellow badge style for Pending state
    Approved: 'bg-green-500/20 text-green-400 border border-green-500/30', // Green badge style for Approved state
    Rejected: 'bg-red-500/20 text-red-400 border border-red-500/30', // Red badge style for Rejected state
  } // End of registration status color mapping
  return ( // Render main trip detail layout views
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10 text-[#1E3A5F]"> {/* Styled parent dark page canvas */}
      <div className="max-w-6xl mx-auto"> {/* Enforce container size constraints */}
        <button // Trigger link back to browse catalog
          onClick={() => navigate('/student/trips')} // Redirect back on click
          className="text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-6 hover:text-[#2A3F5F] transition-colors inline-flex items-center" // Style settings
        > {/* Open tag */}
          ← Back to Browse Trips {/* Navigation link label */}
        </button> {/* Close catalog link */}
        {successMessage && ( // Conditional block to render success notification banner
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-sans text-sm">{successMessage}</div> // Banner container
        )} {/* End of success check */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* Main page body split columns */}
          <div className="lg:col-span-2 space-y-6"> {/* Left details columns container */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E5EDFF]"> {/* Core general info header card */}
              <h1 className="font-serif text-[#1E3A5F] text-3xl md:text-4xl font-bold mb-2">{trip.title}</h1> {/* Display title heading */}
              <p className="text-[#5A6F8F] font-sans text-sm mb-6">📍 {trip.destination}</p> {/* Output destination */}
              <p className="text-[#2A3F5F] font-sans text-sm leading-relaxed whitespace-pre-wrap">{trip.description || 'No description provided.'}</p> {/* Output description */}
            </div> {/* Close header card */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E5EDFF]"> {/* Itinerary planner display card */}
              <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-6 border-b border-[#E5EDFF] pb-3">Day-by-Day Itinerary</h3> {/* Heading label */}
              {(!trip.itinerary || trip.itinerary.length === 0) ? ( // Check if itinerary array has zero items
                <p className="text-white/30 font-sans text-sm italic">Detailed day planner will be shared closer to the trip date.</p> // Empty itinerary warning
              ) : ( // Render day-by-day itinerary events
                <div className="space-y-4"> {/* Stack days container */}
                  {trip.itinerary.map((dayItem, index) => ( // Loop through active itinerary items
                    <div key={index} className="p-4 bg-white/5 rounded-xl border border-[#E5EDFF]"> {/* Styled day container */}
                      <p className="text-gold font-sans text-xs font-bold uppercase tracking-wider mb-1.5">Day {dayItem.day}: {dayItem.title || 'Untitled Activity'}</p> {/* Output day subtitle */}
                      <p className="text-[#6B7F9F] font-sans text-sm whitespace-pre-wrap">{dayItem.activities || 'No activities specified.'}</p> {/* Output day activities list */}
                    </div> // Close day block
                  ))} {/* Close loop */}
                </div> // Close day stack
              )} {/* End of itinerary presence check */}
            </div> {/* Close itinerary card */}
            {trip.required_documents && trip.required_documents.length > 0 && ( // Conditional check to render required documents badge card
              <div className="bg-white rounded-2xl p-6 border border-[#E5EDFF]"> {/* Required documents wrapper */}
                <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-4">Required Submission Documents</h3> {/* Section title */}
                <div className="flex flex-wrap gap-2"> {/* Row layout wrapping tags */}
                  {trip.required_documents.map((doc) => ( // Loop through document requirements strings
                    <span key={doc} className="px-3.5 py-2 rounded-lg text-xs font-sans bg-white/5 text-[#6B7F9F] font-semibold uppercase tracking-wider border border-[#C5D5FF]">{doc}</span> // Output individual document requirements
                  ))} {/* Close loop */}
                </div> {/* Close row wrapper */}
              </div> // Close documents card
            )} {/* End of documents presence check */}
          </div> {/* Close left columns */}
          <div className="lg:col-span-1"> {/* Right columns layout container */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5EDFF] sticky top-6 space-y-6"> {/* Interactive sticky sidebar panel */}
              <div> {/* Top panel headers */}
                <p className="text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-1">Cost Per Student</p> {/* Cost label */}
                <p className="text-gold font-serif text-3xl font-bold">{trip.cost_per_student} {trip.currency}</p> {/* Price display output */}
              </div> {/* Close top section */}

              {/* Cost Breakdown section — shows all six categories between the total and the date rows */}
              <div className="pt-4 border-t border-[#E5EDFF]"> {/* Breakdown card separator */}
                <p className="text-[#4A5F7F] font-sans text-xs uppercase tracking-wider font-semibold mb-3">Cost Breakdown</p> {/* Section heading label */}
                {(() => { // IIFE to compute breakdown display values in one pass
                  const bd = trip.cost_breakdown || {} // Read stored breakdown object or empty fallback if null
                  const rows = [ // Define the six ordered display rows — entrance_fee replaces insurance
                    { label: 'Transport',     value: parseFloat(bd.transport)     || 0 }, // Transport row — default 0 if key missing
                    { label: 'Accommodation', value: parseFloat(bd.accommodation) || 0 }, // Accommodation row — default 0 if key missing
                    { label: 'Food',          value: parseFloat(bd.food)          || 0 }, // Food row — default 0 if key missing
                    { label: 'Activities',    value: parseFloat(bd.activities)    || 0 }, // Activities row — default 0 if key missing
                    { label: 'Entrance Fee',  value: parseFloat(bd.entrance_fee)  || 0 }, // Entrance Fee row — replaces Insurance; default 0 for old rows without this key
                    { label: 'Other',         value: parseFloat(bd.other)         || 0 }, // Other row — default 0 if key missing
                  ] // End rows array definition
                  const breakdownSum = rows.reduce((s, r) => s + r.value, 0) // Sum the six category values to check consistency
                  const storedTotal = parseFloat(trip.cost_per_student) || 0 // Read the authoritative stored total for comparison
                  const mismatch = Math.abs(breakdownSum - storedTotal) > 0.01 // Flag as mismatch if difference exceeds rounding tolerance
                  return ( // Return the rendered breakdown list
                    <div className="space-y-2 text-xs font-sans"> {/* Stack individual category rows */}
                      {rows.map((row) => ( // Loop through the six display rows
                        <div // Individual category row wrapper
                          key={row.label} // Unique key per row using label string
                          className="flex justify-between items-center" // Side-by-side label and value layout
                        > {/* Open row div */}
                          <span className={`uppercase tracking-wider ${row.value === 0 ? 'text-[#B0BFD0]' : 'text-[#4A5F7F]'}`}> {/* Muted color for zero-value rows so students see cost was considered */}
                            {row.label} {/* Category display label */}
                          </span> {/* Close label span */}
                          <span className={`font-medium ${row.value === 0 ? 'text-[#B0BFD0]' : 'text-[#1E3A5F]'}`}> {/* Muted color for zero amounts */}
                            {row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {trip.currency} {/* Format number consistently with two decimal places and trip currency */}
                          </span> {/* Close value span */}
                        </div> // Close category row
                      ))} {/* End row loop */}
                      <div className="flex justify-between items-center pt-2 border-t border-[#E5EDFF] font-semibold text-[#1E3A5F]"> {/* Total row with top divider */}
                        <span className="uppercase tracking-wider">Total</span> {/* Total label */}
                        <span> {/* Total value span */}
                          {storedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {trip.currency} {/* Show cost_per_student as the authoritative total — format matches category rows */}
                        </span> {/* Close total value */}
                      </div> {/* Close total row */}
                      {mismatch && ( // Render mismatch note only when itemised sum differs from cost_per_student
                        <p className="text-[#B0BFD0] text-[10px] italic pt-1"> {/* Muted small mismatch notice */}
                          Itemized amounts may not add up to the total. {/* Inform student of data inconsistency without hiding either number */}
                        </p> // Close mismatch note
                      )} {/* End mismatch check */}
                    </div> // Close breakdown list container
                  ) // End return
                })()} {/* End IIFE */}
              </div> {/* Close breakdown section */}

              <div className="space-y-3 pt-4 border-t border-[#E5EDFF] text-xs font-sans text-[#4A5F7F]"> {/* Details parameter checklist */}
                <div className="flex justify-between"> {/* Schedule details row */}
                  <span className="uppercase tracking-wider">Start Date</span> {/* Label */}
                  <span className="text-[#1E3A5F] font-medium">{trip.start_date}</span> {/* Value */}
                </div> {/* Close start date */}
                <div className="flex justify-between"> {/* Schedule details row */}
                  <span className="uppercase tracking-wider">End Date</span> {/* Label */}
                  <span className="text-[#1E3A5F] font-medium">{trip.end_date}</span> {/* Value */}
                </div> {/* Close end date */}
                <div className="flex justify-between"> {/* Availability details row */}
                  <span className="uppercase tracking-wider">Availability</span> {/* Label */}
                  <span className={`font-semibold ${trip.spots_remaining === 0 ? 'text-red-400' : 'text-[#1E3A5F]'}`}> {/* Styled text color if capacity reached */}
                    {trip.spots_remaining === 0 // Check if spaces are zero
                      ? 'Fully booked' // Text indicator if slots are zero
                      : `${trip.spots_remaining} / ${trip.capacity} spots remaining`} {/* Spots remaining text feedback */}
                  </span> {/* Close styled span */}
                </div> {/* Close spots row */}
              </div> {/* Close details checklist */}
              <div className="pt-4 border-t border-[#E5EDFF]"> {/* Active interactive registration controls panel */}
                {myRegistration ? ( // Check if student has already registered for this trip
                  <div className="space-y-4"> {/* Registered indicators container */}
                    <div> {/* State labels wrapper */}
                      <p className="text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Registration Status</p> {/* Indicator description */}
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-sans font-bold uppercase tracking-widest ${registrationStatusColors[myRegistration.status]}`}> {/* Styled status badge */}
                        {myRegistration.status} {/* Output state string */}
                      </span> {/* Close badge */}
                    </div> {/* Close state labels */}
                    {myRegistration.status === 'Approved' && (
                      <div className="pt-2 border-t border-[#E5EDFF] space-y-2"> {/* Styled border divider with vertical spacing stack */}
                        <button
                          onClick={() => navigate(`/student/trips/${id}/journal`)}
                          className="w-full bg-[#8CA5FF] text-[#1E3A5F] font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-lg hover:opacity-90 transition-all text-center block"
                        >
                          My Trip Journal
                        </button>
                        {(trip.status === 'Ongoing' || trip.status === 'Completed') && (
                          <button
                            onClick={() => navigate(`/student/trips/${id}/reports`)}
                            className="w-full bg-purple-500 text-[#1E3A5F] font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-lg hover:opacity-90 transition-all text-center block"
                          >
                            Submit Trip Reports
                          </button>
                        )}
                      </div>
                    )}
                    {myRegistration.decision_note && ( // Render decision notes left by the department head if present
                      <div className="p-3 bg-white/5 rounded-lg border border-[#E5EDFF]"> {/* Note details card container */}
                        <p className="text-[#4A5F7F] font-sans text-[10px] uppercase tracking-wider mb-1">Department Head Note</p> {/* Header */}
                        <p className="text-[#2A3F5F] font-sans text-xs whitespace-pre-wrap">{myRegistration.decision_note}</p> {/* Note content */}
                      </div> // Close note details card
                    )} {/* End of note presence check */}
                  </div> // Close registered indicators
                ) : showRegisterForm ? ( // Check if active interactive confirmation panel is expanded
                  <div className="space-y-6"> {/* Expanded interactive submission elements wrapper with more spacing for two forms */}
                    {error && ( // Conditional block to render warnings inside the registration widget
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-sans text-xs">{error}</div> // Alert message container
                    )} {/* End of error check */}
                    
                    {/* Medical Form Section */}
                    <div className="space-y-4 pb-4 border-b border-[#E5EDFF]"> {/* Medical form container with bottom border */}
                      <h4 className="text-[#1E3A5F] font-serif text-lg font-bold">Medical Information</h4> {/* Form section heading */}
                      
                      <div className="space-y-2"> {/* Blood type selector container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Blood Group *</label> {/* Required field label */}
                        <select // Blood type dropdown selector
                          value={medicalForm.bloodType} // Bind to bloodType state value
                          onChange={(e) => setMedicalForm({...medicalForm, bloodType: e.target.value})} // Update bloodType on change
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors" // Styled select input
                        > {/* Open select options */}
                          <option value="">Select blood group...</option> {/* Placeholder option */}
                          <option value="A+">A+</option> {/* Blood type option */}
                          <option value="A-">A-</option> {/* Blood type option */}
                          <option value="B+">B+</option> {/* Blood type option */}
                          <option value="B-">B-</option> {/* Blood type option */}
                          <option value="AB+">AB+</option> {/* Blood type option */}
                          <option value="AB-">AB-</option> {/* Blood type option */}
                          <option value="O+">O+</option> {/* Blood type option */}
                          <option value="O-">O-</option> {/* Blood type option */}
                          <option value="Unknown">Unknown</option> {/* Unknown option */}
                        </select> {/* Close select element */}
                      </div> {/* Close blood type container */}
                      
                      <div className="space-y-2"> {/* Allergies field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Allergies</label> {/* Field label */}
                        <textarea // Allergies text input
                          value={medicalForm.allergies} // Bind to allergies state value
                          onChange={(e) => setMedicalForm({...medicalForm, allergies: e.target.value})} // Update allergies on change
                          placeholder="List any known allergies (e.g., peanuts, penicillin, bee stings)" // Helpful placeholder text
                          rows={2} // Set textarea height
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none transition-colors" // Styled textarea
                        /> {/* Close textarea */}
                      </div> {/* Close allergies container */}
                      
                      <div className="space-y-2"> {/* Medications field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Current Medications</label> {/* Field label */}
                        <textarea // Medications text input
                          value={medicalForm.medications} // Bind to medications state value
                          onChange={(e) => setMedicalForm({...medicalForm, medications: e.target.value})} // Update medications on change
                          placeholder="List any medications you are currently taking" // Helpful placeholder text
                          rows={2} // Set textarea height
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none transition-colors" // Styled textarea
                        /> {/* Close textarea */}
                      </div> {/* Close medications container */}
                      
                      <div className="space-y-2"> {/* Medical conditions field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Medical Conditions</label> {/* Field label */}
                        <textarea // Medical conditions text input
                          value={medicalForm.medicalConditions} // Bind to medicalConditions state value
                          onChange={(e) => setMedicalForm({...medicalForm, medicalConditions: e.target.value})} // Update medicalConditions on change
                          placeholder="List any medical conditions (e.g., asthma, diabetes, epilepsy)" // Helpful placeholder text
                          rows={2} // Set textarea height
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none transition-colors" // Styled textarea
                        /> {/* Close textarea */}
                      </div> {/* Close medical conditions container */}
                      
                      <div className="space-y-2"> {/* Emergency medical notes field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Emergency Medical Notes</label> {/* Field label */}
                        <textarea // Emergency notes text input
                          value={medicalForm.emergencyMedicalNotes} // Bind to emergencyMedicalNotes state value
                          onChange={(e) => setMedicalForm({...medicalForm, emergencyMedicalNotes: e.target.value})} // Update emergencyMedicalNotes on change
                          placeholder="Any additional medical information emergency responders should know" // Helpful placeholder text
                          rows={2} // Set textarea height
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none transition-colors" // Styled textarea
                        /> {/* Close textarea */}
                      </div> {/* Close emergency notes container */}
                    </div> {/* Close medical form section */}
                    
                    {/* Emergency Contact Form Section */}
                    <div className="space-y-4"> {/* Emergency contact form container */}
                      <h4 className="text-[#1E3A5F] font-serif text-lg font-bold">Emergency Contact</h4> {/* Form section heading */}
                      
                      <div className="space-y-2"> {/* Full name field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Full Name *</label> {/* Required field label */}
                        <input // Full name text input
                          type="text" // Text input type
                          value={emergencyContact.fullName} // Bind to fullName state value
                          onChange={(e) => setEmergencyContact({...emergencyContact, fullName: e.target.value})} // Update fullName on change
                          placeholder="Emergency contact's full name" // Placeholder text
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors" // Styled text input
                        /> {/* Close input */}
                      </div> {/* Close full name container */}
                      
                      <div className="space-y-2"> {/* Relationship field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Relationship *</label> {/* Required field label */}
                        <input // Relationship text input
                          type="text" // Text input type
                          value={emergencyContact.relationship} // Bind to relationship state value
                          onChange={(e) => setEmergencyContact({...emergencyContact, relationship: e.target.value})} // Update relationship on change
                          placeholder="e.g., Parent, Guardian, Spouse" // Placeholder text
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors" // Styled text input
                        /> {/* Close input */}
                      </div> {/* Close relationship container */}
                      
                      <div className="space-y-2"> {/* Phone number field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Phone Number *</label> {/* Required field label */}
                        <input // Phone number text input
                          type="tel" // Tel input type for mobile keyboards
                          value={emergencyContact.phoneNumber} // Bind to phoneNumber state value
                          onChange={(e) => setEmergencyContact({...emergencyContact, phoneNumber: e.target.value})} // Update phoneNumber on change
                          placeholder="+251 XXX XXX XXX" // Placeholder with format example
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors" // Styled text input
                        /> {/* Close input */}
                      </div> {/* Close phone number container */}
                      
                      <div className="space-y-2"> {/* Alternative phone field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Alternative Phone</label> {/* Optional field label */}
                        <input // Alternative phone text input
                          type="tel" // Tel input type for mobile keyboards
                          value={emergencyContact.alternativePhone} // Bind to alternativePhone state value
                          onChange={(e) => setEmergencyContact({...emergencyContact, alternativePhone: e.target.value})} // Update alternativePhone on change
                          placeholder="Optional second contact number" // Placeholder text
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors" // Styled text input
                        /> {/* Close input */}
                      </div> {/* Close alternative phone container */}
                      
                      <div className="space-y-2"> {/* Address field container */}
                        <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Address *</label> {/* Required field label */}
                        <textarea // Address text input
                          value={emergencyContact.address} // Bind to address state value
                          onChange={(e) => setEmergencyContact({...emergencyContact, address: e.target.value})} // Update address on change
                          placeholder="Full address where emergency contact can be reached" // Placeholder text
                          rows={2} // Set textarea height
                          className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none transition-colors" // Styled textarea
                        /> {/* Close textarea */}
                      </div> {/* Close address container */}
                    </div> {/* Close emergency contact form section */}
                    
                    <div className="flex flex-col gap-2 pt-4 border-t border-[#E5EDFF]"> {/* Operations trigger buttons stack with top border */}
                      <button // Primary registration transaction submission button
                        onClick={handleSubmitRegistration} // Attach submit action on click
                        disabled={submitting} // Lock interactive click triggers when database insert transaction is active
                        className="w-full bg-gold text-white font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50" // High visual impact gold styles
                      > {/* Open tag */}
                        {submitting ? 'Submitting...' : 'Submit Registration'} {/* Submission state text feedback */}
                      </button> {/* Close submit action button */}
                      <button // Cancellation action button trigger
                        onClick={() => { // Reset active local form expansion parameters
                          setShowRegisterForm(false) // Collapse confirmation panel
                          setError('') // Clear localized alert messages
                        }} // End of reset operations
                        className="w-full bg-white/5 text-[#5A6F8F] font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-white/10 transition-colors" // Secondary styles
                      > {/* Open tag */}
                        Cancel {/* Action text */}
                      </button> {/* Close cancellation button */}
                    </div> {/* Close action stack */}
                  </div> // Close interactive elements wrapper
                ) : ( // Render primary register button when no previous records exist
                  <button // Initial registration action trigger
                    onClick={handleRegisterClick} // Expand confirmation panel on click
                    disabled={trip.spots_remaining <= 0} // Lock button if all available capacities are depleted
                    className="w-full bg-indigo-main text-[#1E3A5F] font-sans text-xs font-bold uppercase tracking-widest py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-main/20" // Core interactive button styles
                  > {/* Open tag */}
                    {trip.spots_remaining <= 0 ? 'Fully Booked' : 'Register for This Trip'} {/* Conditional capacity text label feedback */}
                  </button> // Close primary action button
                )} {/* End of registration form checking */}
              </div> {/* Close registration controls */}
            </div> {/* Close sticky sidebar panel */}
          </div> {/* Close right columns */}
        </div> {/* Close split grid columns */}
      </div> {/* Close page size wrapper */}
    </div> // Close parent canvas
  ) // End of primary return statement
} // End of TripDetailPage component
export default TripDetailPage // Export TripDetailPage component as default
