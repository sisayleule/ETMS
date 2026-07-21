// MyTripsPage displays a history log of all educational field trips the student has registered to attend
import { useState, useEffect } from 'react' // Import React and standard state/effect hooks
import { useNavigate } from 'react-router-dom' // Import routing navigation helper to open details on click
import { useAuth } from '../../context/AuthContext' // Import auth custom hook to retrieve active user credentials
import { fetchMyRegistrations } from '../../lib/registrationService' // Import database service to query user registrations
import { // Import registration forms service functions for medical and emergency contact data
  fetchMedicalForm, // Import function to retrieve existing medical form data
  upsertMedicalForm, // Import function to create or update medical form
  fetchEmergencyContact, // Import function to retrieve existing emergency contact
  upsertEmergencyContact, // Import function to create or update emergency contact
  validateMedicalForm, // Import validation function for medical form
  validateEmergencyContact, // Import validation function for emergency contact form
} from '../../lib/registrationFormsService' // Connect registration forms service
// Define main MyTripsPage component
function MyTripsPage() { // Open component definition
  const { user } = useAuth() // Extract current authenticated user object from auth provider
  const navigate = useNavigate() // Initialize navigate helper to execute pathway redirects
  const [registrations, setRegistrations] = useState([]) // Manage local array list of student registrations
  const [loading, setLoading] = useState(true) // Manage visual page loading indicator states
  const [editingRegId, setEditingRegId] = useState(null) // Track which registration is being edited
  const [viewingRegId, setViewingRegId] = useState(null) // Track which registration is being viewed (read-only)
  const [medicalForm, setMedicalForm] = useState({ // Manage medical form data state object for editing
    bloodType: '', // Store selected blood group value
    allergies: '', // Store allergies text content
    medications: '', // Store current medications text
    medicalConditions: '', // Store medical conditions text
    emergencyMedicalNotes: '', // Store emergency medical notes text
  }) // End medical form state initialization
  const [emergencyContact, setEmergencyContact] = useState({ // Manage emergency contact form data state object for editing
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
  const loadRegistrations = async () => { // Define helper function to fetch registrations from tables
    setLoading(true) // Turn on page-level loading indicator
    const { registrations: data } = await fetchMyRegistrations(user.id) // Query user registration list joined with trip details
    setRegistrations(data) // Save fetched results into local state
    setLoading(false) // Turn off page-level loading indicator
  } // End of loadRegistrations helper definition
  useEffect(() => { // Mount hook to trigger database fetching on component mount or user change
    if (user?.id) loadRegistrations() // Execute loading operation if student user is authenticated
  }, [user]) // Re-run effect if authenticated user object updates
  
  // Helper function to load medical and emergency contact forms for editing or viewing
  const loadFormsData = async (regId) => { // Define async function to load form data
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
  } // End loadFormsData function
  
  // Handler to open edit modal for a pending registration
  const handleEditClick = async (reg) => { // Define handler function for edit button click
    setError('') // Reset any active warning alerts
    setSuccessMessage('') // Reset any active success messages
    setEditingRegId(reg.id) // Set the registration ID being edited
    await loadFormsData(reg.id) // Load medical and emergency contact forms
  } // End handleEditClick function
  
  // Handler to open view modal for approved/rejected registration
  const handleViewClick = async (reg) => { // Define handler function for view button click
    setError('') // Reset any active warning alerts
    setSuccessMessage('') // Reset any active success messages
    setViewingRegId(reg.id) // Set the registration ID being viewed
    await loadFormsData(reg.id) // Load medical and emergency contact forms (read-only)
  } // End handleViewClick function
  
  // Handler to save edited medical and emergency contact forms
  const handleSaveForms = async () => { // Define handler function for save button click
    setError('') // Reset any active warning alerts
    setSuccessMessage('') // Reset any active success messages
    
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
    
    setSubmitting(false) // Turn off submit indicator lock state
    setEditingRegId(null) // Close edit modal
    setSuccessMessage('Medical and emergency contact information updated successfully.') // Show success message
    setTimeout(() => setSuccessMessage(''), 3000) // Clear success message after 3 seconds
  } // End handleSaveForms function
  
  // Handler to close edit or view modal
  const handleCloseModal = () => { // Define handler function to close modal
    setEditingRegId(null) // Clear editing registration ID
    setViewingRegId(null) // Clear viewing registration ID
    setError('') // Clear any errors
    setSuccessMessage('') // Clear any success messages
  } // End handleCloseModal function
  const statusColors = { // Map registration status values to specific Tailwind CSS color classes
    Pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', // Yellow badge style for Pending state
    Approved: 'bg-green-500/20 text-green-400 border border-green-500/30', // Green badge style for Approved state
    Rejected: 'bg-red-500/20 text-red-400 border border-red-500/30', // Red badge style for Rejected state
  } // End of registration status color mapping
  return ( // Render main My Trips page view layout
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10 text-[#1E3A5F]"> {/* Blue gradient background with dark blue text */}
      <div className="max-w-6xl mx-auto"> {/* Enforce container size constraints */}
        <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">My Registered Trips</h1> {/* Primary header title in dark blue */}
        <p className="text-[#4A5F7F] font-sans text-sm mb-8">Review educational trips you have registered for and track their approval progress</p> {/* Context subtitle in medium blue */}
        {successMessage && ( // Conditional block to render success notification banner
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-sans text-sm">{successMessage}</div> // Banner container
        )} {/* End of success check */}
        {loading ? ( // Check if asynchronous fetch is active
          <div className="py-12 text-center"> {/* Centered layout container */}
            <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse">Loading Your Trips...</p> {/* Pulsing blue loader label */}
          </div> // Close visual loader wrapper
        ) : registrations.length === 0 ? ( // Check if student has no registered records in the database
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#C5D5FF] max-w-md shadow-md"> {/* Styled empty registrations card with blue theme */}
            <p className="text-[#6B7F9F] font-sans text-sm mb-6">You haven't registered for any educational trips yet.</p> {/* Empty results description */}
            <button // Redirect button to browse active catalog
              onClick={() => navigate('/student/trips')} // Execute path redirection to browse page
              className="bg-[#8CA5FF] text-white font-sans text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[#7090E5] transition-colors shadow-md" // Blue button style
            > {/* Open tag */}
              Browse Available Trips {/* Button text label */}
            </button> {/* Close catalog button */}
          </div> // Close empty state card
        ) : ( // Render registrations grid list if records exist
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive bento grid wrapper */}
            {registrations.map((reg) => ( // Loop through each registration item in the array
              <div // Interactive registration card container
                key={reg.id} // Set unique registration row database key
                className="bg-white rounded-2xl p-6 border border-[#E5EDFF] hover:border-[#8CA5FF]/30 transition-all" // Visual card styling layout
              > {/* Open card tag */}
                <span className={`inline-block text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-4 ${statusColors[reg.status]}`}> {/* Registration status badge */}
                  {reg.status} {/* Active status string */}
                </span> {/* Close status badge */}
                <h3 // Trip title heading
                  onClick={() => navigate(`/student/trips/${reg.trip_id}`)} // Redirect student to detail page on click
                  className="font-serif text-[#1E3A5F] text-xl font-bold mb-1.5 line-clamp-1 cursor-pointer hover:text-[#8CA5FF] transition-colors" // Title styling with hover effect
                >{reg.trips?.title || 'Educational Trip'}</h3> {/* Output joined parent trip title */}
                <p className="text-[#5A6F8F] font-sans text-sm mb-4">📍 {reg.trips?.destination || 'N/A'}</p> {/* Output destination location */}
                <div className="space-y-2 pt-2 border-t border-[#E5EDFF] text-[#5A6F8F] font-sans text-xs mb-4"> {/* Details overview list section */}
                  <div className="flex justify-between"> {/* Schedule row wrapper */}
                    <span>Schedule</span> {/* Info label */}
                    <span className="text-[#1E3A5F]">{reg.trips?.start_date || 'N/A'} → {reg.trips?.end_date || 'N/A'}</span> {/* Value output */}
                  </div> {/* Close schedule row */}
                  <div className="flex justify-between"> {/* Applied timestamp row wrapper */}
                    <span>Applied Date</span> {/* Info label */}
                    <span className="text-[#1E3A5F]">{reg.applied_at ? new Date(reg.applied_at).toLocaleDateString() : 'N/A'}</span> {/* Date string output */}
                  </div> {/* Close applied date row */}
                </div> {/* Close details overview list */}
                {reg.status === 'Pending' && ( // Show edit button only for pending registrations
                  <button // Edit medical/emergency info button
                    onClick={() => handleEditClick(reg)} // Open edit modal on click
                    className="w-full bg-[#8CA5FF] text-white font-sans text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg hover:bg-[#7090E5] transition-colors" // Blue button style
                  > {/* Button open tag */}
                    Edit Medical/Emergency Info {/* Button text label */}
                  </button> // Close edit button
                )} {/* End pending status check */}
                {(reg.status === 'Approved' || reg.status === 'Rejected') && ( // Show view button for approved/rejected registrations
                  <button // View medical/emergency info button
                    onClick={() => handleViewClick(reg)} // Open view modal on click
                    className="w-full bg-[#C5D5FF] text-[#1E3A5F] font-sans text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg hover:bg-[#B0C5FF] transition-colors" // Light blue button style
                  > {/* Button open tag */}
                    View Medical/Emergency Info {/* Button text label */}
                  </button> // Close view button
                )} {/* End approved/rejected status check */}
              </div> // Close registration card
            ))} {/* Close map loop */}
          </div> // Close bento grid container
        )} {/* End of registrations check */}
        
        {/* Edit Modal for Pending Registrations */}
        {editingRegId && ( // Conditional render for edit modal
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"> {/* Translucent dark backdrop with blur — dims and softens page content behind modal while keeping it visibly present */}
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5EDFF]"> {/* Modal content container */}
              <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold mb-6">Edit Medical & Emergency Contact Information</h2> {/* Modal title */}
              {error && ( // Conditional block to render error alerts
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-sans text-sm">{error}</div> // Error alert container
              )} {/* End of error check */}
              
              {/* Medical Form Section */}
              <div className="space-y-4 pb-6 mb-6 border-b border-[#E5EDFF]"> {/* Medical form container with bottom border */}
                <h3 className="text-[#1E3A5F] font-serif text-lg font-bold">Medical Information</h3> {/* Form section heading */}
                
                <div className="space-y-2"> {/* Blood type selector container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Blood Group *</label> {/* Required field label */}
                  <select // Blood type dropdown selector
                    value={medicalForm.bloodType} // Bind to bloodType state value
                    onChange={(e) => setMedicalForm({...medicalForm, bloodType: e.target.value})} // Update bloodType on change
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors" // Styled select input
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
                    placeholder="List any known allergies" // Helpful placeholder text
                    rows={2} // Set textarea height
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] resize-none transition-colors" // Styled textarea
                  /> {/* Close textarea */}
                </div> {/* Close allergies container */}
                
                <div className="space-y-2"> {/* Medications field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Current Medications</label> {/* Field label */}
                  <textarea // Medications text input
                    value={medicalForm.medications} // Bind to medications state value
                    onChange={(e) => setMedicalForm({...medicalForm, medications: e.target.value})} // Update medications on change
                    placeholder="List any current medications" // Helpful placeholder text
                    rows={2} // Set textarea height
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] resize-none transition-colors" // Styled textarea
                  /> {/* Close textarea */}
                </div> {/* Close medications container */}
                
                <div className="space-y-2"> {/* Medical conditions field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Medical Conditions</label> {/* Field label */}
                  <textarea // Medical conditions text input
                    value={medicalForm.medicalConditions} // Bind to medicalConditions state value
                    onChange={(e) => setMedicalForm({...medicalForm, medicalConditions: e.target.value})} // Update medicalConditions on change
                    placeholder="List any medical conditions" // Helpful placeholder text
                    rows={2} // Set textarea height
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] resize-none transition-colors" // Styled textarea
                  /> {/* Close textarea */}
                </div> {/* Close medical conditions container */}
                
                <div className="space-y-2"> {/* Emergency medical notes field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Emergency Medical Notes</label> {/* Field label */}
                  <textarea // Emergency notes text input
                    value={medicalForm.emergencyMedicalNotes} // Bind to emergencyMedicalNotes state value
                    onChange={(e) => setMedicalForm({...medicalForm, emergencyMedicalNotes: e.target.value})} // Update emergencyMedicalNotes on change
                    placeholder="Additional emergency information" // Helpful placeholder text
                    rows={2} // Set textarea height
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] resize-none transition-colors" // Styled textarea
                  /> {/* Close textarea */}
                </div> {/* Close emergency notes container */}
              </div> {/* Close medical form section */}
              
              {/* Emergency Contact Form Section */}
              <div className="space-y-4 mb-6"> {/* Emergency contact form container */}
                <h3 className="text-[#1E3A5F] font-serif text-lg font-bold">Emergency Contact Information</h3> {/* Form section heading */}
                
                <div className="space-y-2"> {/* Full name field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Full Name *</label> {/* Required field label */}
                  <input // Full name text input
                    type="text" // Input type
                    value={emergencyContact.fullName} // Bind to fullName state value
                    onChange={(e) => setEmergencyContact({...emergencyContact, fullName: e.target.value})} // Update fullName on change
                    placeholder="Contact's full name" // Helpful placeholder text
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors" // Styled input
                  /> {/* Close input */}
                </div> {/* Close full name container */}
                
                <div className="space-y-2"> {/* Relationship field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Relationship *</label> {/* Required field label */}
                  <input // Relationship text input
                    type="text" // Input type
                    value={emergencyContact.relationship} // Bind to relationship state value
                    onChange={(e) => setEmergencyContact({...emergencyContact, relationship: e.target.value})} // Update relationship on change
                    placeholder="e.g., Parent, Guardian, Sibling" // Helpful placeholder text
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors" // Styled input
                  /> {/* Close input */}
                </div> {/* Close relationship container */}
                
                <div className="space-y-2"> {/* Phone number field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Phone Number *</label> {/* Required field label */}
                  <input // Phone number text input
                    type="tel" // Input type
                    value={emergencyContact.phoneNumber} // Bind to phoneNumber state value
                    onChange={(e) => setEmergencyContact({...emergencyContact, phoneNumber: e.target.value})} // Update phoneNumber on change
                    placeholder="Primary contact number" // Helpful placeholder text
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors" // Styled input
                  /> {/* Close input */}
                </div> {/* Close phone number container */}
                
                <div className="space-y-2"> {/* Alternative phone field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Alternative Phone</label> {/* Optional field label */}
                  <input // Alternative phone text input
                    type="tel" // Input type
                    value={emergencyContact.alternativePhone} // Bind to alternativePhone state value
                    onChange={(e) => setEmergencyContact({...emergencyContact, alternativePhone: e.target.value})} // Update alternativePhone on change
                    placeholder="Secondary contact number (optional)" // Helpful placeholder text
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors" // Styled input
                  /> {/* Close input */}
                </div> {/* Close alternative phone container */}
                
                <div className="space-y-2"> {/* Address field container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Address *</label> {/* Required field label */}
                  <textarea // Address text input
                    value={emergencyContact.address} // Bind to address state value
                    onChange={(e) => setEmergencyContact({...emergencyContact, address: e.target.value})} // Update address on change
                    placeholder="Full residential address" // Helpful placeholder text
                    rows={2} // Set textarea height
                    className="w-full bg-white border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] resize-none transition-colors" // Styled textarea
                  /> {/* Close textarea */}
                </div> {/* Close address container */}
              </div> {/* Close emergency contact section */}
              
              {/* Modal action buttons */}
              <div className="flex gap-3"> {/* Button row container */}
                <button // Save button
                  onClick={handleSaveForms} // Execute save handler on click
                  disabled={submitting} // Disable during submission
                  className="flex-1 bg-[#8CA5FF] text-white font-sans text-sm font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[#7090E5] disabled:opacity-50 transition-all" // Blue button style
                > {/* Button open tag */}
                  {submitting ? 'Saving...' : 'Save Changes'} {/* Button text label with loading state */}
                </button> {/* Close save button */}
                <button // Cancel button
                  onClick={handleCloseModal} // Close modal on click
                  disabled={submitting} // Disable during submission
                  className="flex-1 bg-[#E5EDFF] text-[#1E3A5F] font-sans text-sm font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[#D0DDFF] disabled:opacity-50 transition-all" // Light button style
                > {/* Button open tag */}
                  Cancel {/* Button text label */}
                </button> {/* Close cancel button */}
              </div> {/* Close button row */}
            </div> {/* Close modal content */}
          </div> // Close modal overlay
        )} {/* End edit modal */}
        
        {/* View Modal for Approved/Rejected Registrations (Read-Only) */}
        {viewingRegId && ( // Conditional render for view modal
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"> {/* Translucent dark backdrop with blur — dims and softens page content behind modal while keeping it visibly present */}
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5EDFF]"> {/* Modal content container */}
              <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold mb-6">Medical & Emergency Contact Information</h2> {/* Modal title */}
              
              {/* Medical Information Display (Read-Only) */}
              <div className="space-y-4 pb-6 mb-6 border-b border-[#E5EDFF]"> {/* Medical info container with bottom border */}
                <h3 className="text-[#1E3A5F] font-serif text-lg font-bold">Medical Information</h3> {/* Section heading */}
                
                <div className="space-y-2"> {/* Blood type display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Blood Group</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm">{medicalForm.bloodType || 'Not specified'}</p> {/* Display blood type value */}
                </div> {/* Close blood type container */}
                
                <div className="space-y-2"> {/* Allergies display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Allergies</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalForm.allergies || 'None listed'}</p> {/* Display allergies value */}
                </div> {/* Close allergies container */}
                
                <div className="space-y-2"> {/* Medications display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Current Medications</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalForm.medications || 'None listed'}</p> {/* Display medications value */}
                </div> {/* Close medications container */}
                
                <div className="space-y-2"> {/* Medical conditions display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Medical Conditions</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalForm.medicalConditions || 'None listed'}</p> {/* Display medical conditions value */}
                </div> {/* Close medical conditions container */}
                
                <div className="space-y-2"> {/* Emergency notes display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Emergency Medical Notes</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{medicalForm.emergencyMedicalNotes || 'None provided'}</p> {/* Display emergency notes value */}
                </div> {/* Close emergency notes container */}
              </div> {/* Close medical info section */}
              
              {/* Emergency Contact Display (Read-Only) */}
              <div className="space-y-4 mb-6"> {/* Emergency contact container */}
                <h3 className="text-[#1E3A5F] font-serif text-lg font-bold">Emergency Contact Information</h3> {/* Section heading */}
                
                <div className="space-y-2"> {/* Full name display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Full Name</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContact.fullName || 'Not specified'}</p> {/* Display full name value */}
                </div> {/* Close full name container */}
                
                <div className="space-y-2"> {/* Relationship display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Relationship</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContact.relationship || 'Not specified'}</p> {/* Display relationship value */}
                </div> {/* Close relationship container */}
                
                <div className="space-y-2"> {/* Phone number display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Phone Number</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContact.phoneNumber || 'Not specified'}</p> {/* Display phone number value */}
                </div> {/* Close phone number container */}
                
                <div className="space-y-2"> {/* Alternative phone display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Alternative Phone</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm">{emergencyContact.alternativePhone || 'Not provided'}</p> {/* Display alternative phone value */}
                </div> {/* Close alternative phone container */}
                
                <div className="space-y-2"> {/* Address display container */}
                  <label className="block text-[#5A6F8F] font-sans text-xs font-semibold uppercase tracking-wider">Address</label> {/* Field label */}
                  <p className="text-[#1E3A5F] font-sans text-sm whitespace-pre-wrap">{emergencyContact.address || 'Not specified'}</p> {/* Display address value */}
                </div> {/* Close address container */}
              </div> {/* Close emergency contact section */}
              
              {/* Close button */}
              <button // Close button
                onClick={handleCloseModal} // Close modal on click
                className="w-full bg-[#8CA5FF] text-white font-sans text-sm font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[#7090E5] transition-all" // Blue button style
              > {/* Button open tag */}
                Close {/* Button text label */}
              </button> {/* Close button tag */}
            </div> {/* Close modal content */}
          </div> // Close modal overlay
        )} {/* End view modal */}
      </div> {/* Close container size wrapper */}
    </div> // Close parent canvas
  ) // End of primary return statement
} // End of MyTripsPage component
export default MyTripsPage // Export MyTripsPage component as default
