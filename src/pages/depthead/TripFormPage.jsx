// TripFormPage handles both creating a new trip and editing an existing one
import { useState, useEffect } from 'react' // Import React and standard state/effect hooks
import { useParams, useNavigate } from 'react-router-dom' // Import router hooks to fetch parameters and handle navigation
import { useAuth } from '../../context/AuthContext' // Import auth custom hook to retrieve active user credentials
import { fetchTripById, createTrip, updateTrip, publishTrip, updateTripStatus } from '../../lib/tripService' // Import trip database queries and services
// Define fixed cost breakdown categories tracked on all educational trips
const COST_CATEGORIES = ['transport', 'accommodation', 'food', 'activities', 'insurance', 'other'] // List categories
// Export main interactive TripFormPage component
export default function TripFormPage() { // Open functional component
  const { id } = useParams() // Extract potential trip ID parameter from URL pathway
  const isEditMode = !!id // Determine if page is in edit mode based on parameter presence
  const navigate = useNavigate() // Initialize navigate hook to execute path redirects
  const { user } = useAuth() // Extract current authenticated user object
  const [loading, setLoading] = useState(isEditMode) // Set initial loading state to true only when fetching existing trip
  const [saving, setSaving] = useState(false) // Track submit action states to disable double-saving inputs
  const [error, setError] = useState('') // Manage local warning feedback alerts
  const [statusMessage, setStatusMessage] = useState('') // Manage local success message banner displays
  const [existingTrip, setExistingTrip] = useState(null) // Manage stored copy of raw trip data from tables
  const [title, setTitle] = useState('') // Manage local trip title state
  const [description, setDescription] = useState('') // Manage local description textbox state
  const [destination, setDestination] = useState('') // Manage local destination state
  const [startDate, setStartDate] = useState('') // Manage local start date state
  const [endDate, setEndDate] = useState('') // Manage local end date state
  const [capacity, setCapacity] = useState('') // Manage local student capacity number state
  const [costBreakdown, setCostBreakdown] = useState({ // Manage individual cost categories mapping state
    transport: 0, accommodation: 0, food: 0, activities: 0, insurance: 0, other: 0, // Set initial category costs to zero
  }) // Close initial state mapping
  const [currency, setCurrency] = useState('ETB') // Manage local currency selection state
  const [paymentDueDate, setPaymentDueDate] = useState('') // Manage local payment deadline state
  const [itinerary, setItinerary] = useState([]) // Manage local day-by-day itinerary array list state
  const loadExistingTrip = async () => { // Define helper to fetch trip details if in edit mode
    setLoading(true) // Turn on page-level loading indicator
    const { trip } = await fetchTripById(id) // Request database record via tripService helper
    if (!trip) { // If search query returned null data
      setError('Trip not found.') // Show record not found alert
      setLoading(false) // Turn off loading state
      return // Halt execution
    } // End of null verification check
    setExistingTrip(trip) // Store original database copy of trip
    setTitle(trip.title) // Populate title field
    setDescription(trip.description || '') // Populate description field or fallback to empty
    setDestination(trip.destination) // Populate destination field
    setStartDate(trip.start_date) // Populate start date field
    setEndDate(trip.end_date) // Populate end date field
    setCapacity(trip.capacity) // Populate capacity count field
    setCostBreakdown(trip.cost_breakdown || costBreakdown) // Populate cost breakdown numbers or retain local states
    setCurrency(trip.currency || 'ETB') // Populate currency designation or fallback to ETB
    setPaymentDueDate(trip.payment_due_date || '') // Populate payment deadline or empty fallback
    setItinerary(trip.itinerary || []) // Populate itinerary day list or empty fallback
    setLoading(false) // Turn off page-level loading state
  } // End of loadExistingTrip definition
  useEffect(() => { // Mount hook to trigger database fetching if trip ID changes
    if (isEditMode) loadExistingTrip() // Fetch and populate form if we are in edit mode
  }, [id]) // Re-run hook if id changes
  const totalCostPerStudent = Object.values(costBreakdown).reduce( // Calculate per-student sum totals from active fields
    (sum, value) => sum + (parseFloat(value) || 0), 0 // Coerce empty entries or letters into numerical zero values
  ) // End of sum total reduction
  const totalTripCost = totalCostPerStudent * (parseInt(capacity) || 0) // Calculate capacity-multiplied overall trip budget costs
  const handleCostChange = (category, value) => { // Define cost change handler to update category mapping
    setCostBreakdown({ ...costBreakdown, [category]: value }) // Update selected category inside the costBreakdown dictionary
  } // End of handleCostChange definition
  const addItineraryDay = () => { // Define itinerary builder action to add another planning day
    setItinerary([ // Update state
      ...itinerary, // Retain existing planned days
      { day: itinerary.length + 1, title: '', activities: '' }, // Append next sequential day object
    ]) // Finish state setting
  } // End of addItineraryDay definition
  const updateItineraryDay = (index, field, value) => { // Define itinerary inline changes tracker
    const updated = [...itinerary] // Deep copy itinerary state array
    updated[index] = { ...updated[index], [field]: value } // Override modified attribute on selected index
    setItinerary(updated) // Save updated itinerary copy to state
  } // End of updateItineraryDay definition
  const removeItineraryDay = (index) => { // Define itinerary day removal action
    const updated = itinerary.filter((_, i) => i !== index) // Filter out targeted day item index
    const renumbered = updated.map((day, i) => ({ ...day, day: i + 1 })) // Renumber day fields to keep indexes sequential
    setItinerary(renumbered) // Save updated renumbered array to state
  } // End of removeItineraryDay definition
  const validateForm = () => { // Define form input parameter validation rules
    if (!title.trim()) return 'Trip title is required.' // Ensure title string is populated
    if (!destination.trim()) return 'Destination location is required.' // Ensure destination is populated
    if (!startDate || !endDate) return 'Trip start and end dates are required.' // Ensure dates are specified
    if (new Date(endDate) < new Date(startDate)) return 'End date cannot fall before the specified start date.' // Ensure valid schedule boundaries
    if (!capacity || parseInt(capacity) < 1) return 'Trip capacity must be configured to at least 1 student.' // Ensure positive capacity values
    return null // Return null to indicate validation checks successfully cleared
  } // End of validateForm definition
  const handleSave = async () => { // Define form save handler for creating/editing trips
    setError('') // Reset active warning labels
    const validationError = validateForm() // Trigger validation checks
    if (validationError) { // Check if any inputs violated rules
      setError(validationError) // Show returned warning feedback
      return // Halt submission
    } // End of validation checking
    setSaving(true) // Turn on visual submit loading state
    const tripPayload = { // Structuring payload object mapped for both create and update operations
      title: title.trim(), // Supply trimmed title string
      description: description.trim(), // Supply trimmed description
      destination: destination.trim(), // Supply trimmed destination
      startDate, // Supply start date string
      endDate, // Supply end date string
      capacity: parseInt(capacity), // Supply integer capacity value
      costPerStudent: totalCostPerStudent, // Supply calculated total per student
      totalTripCost: totalTripCost, // Supply multiplied total overall budget cost
      costBreakdown, // Supply category cost amounts
      currency, // Supply currency choice
      paymentDueDate: paymentDueDate || null, // Supply payment deadline or null fallback
      itinerary, // Supply itinerary days array
    } // Close payload mapping
    if (isEditMode) { // Check if form is currently in edit mode
      const { error: updateError } = await updateTrip(id, tripPayload, existingTrip?.cost_locked) // Save database changes
      if (updateError) { // Check if update transaction failed
        setError('Could not save trip changes. Please try again.') // Show edit error message
      } else { // Update completed successfully
        setStatusMessage('Trip updated successfully.') // Show success feedback
        await loadExistingTrip() // Reload data fresh from tables to align state values
      } // End of update error check
    } else { // Form is in creation mode
      const { trip, error: createError } = await createTrip(tripPayload, user.id) // Insert new draft trip
      if (createError) { // Check if insert transaction failed
        setError('Could not create trip. Please try again.') // Show creation error warning
      } else { // Trip created successfully
        navigate(`/depthead/trips/${trip.id}`) // Navigate to trip detail page to view roster and send announcements
      } // End of create error check
    } // End of editing mode check
    setSaving(false) // Turn off submit loading state
  } // End of handleSave definition
  const handlePublish = async () => { // Define publish lock action
    const confirmed = window.confirm('Publishing will lock the cost breakdown permanently and make this trip visible to students. Continue?') // Browser confirm
    if (!confirmed) return // Halt execution if user declines dialog confirmation
    const { error: publishError } = await publishTrip(id) // Update status to Published and trigger cost-locking on database
    if (publishError) { // Check if update failed
      setError('Could not publish trip. Please try again.') // Show publish error warning
    } else { // Update completed successfully
      setStatusMessage('Trip published! Students can now see and register for this educational trip.') // Flash success status
      await loadExistingTrip() // Fetch and reload trip data to update disabled input toggles
    } // End of error check
  } // End of handlePublish definition
  const handleStatusChange = async (newStatus) => { // Define ongoing/completed status advanced progression helper
    const { error: statusError } = await updateTripStatus(id, newStatus) // Update status column on database
    if (statusError) { // Check if status update failed
      setError('Could not update trip status.') // Show error warning label
    } else { // Update successful
      setStatusMessage(`Trip marked as ${newStatus}.`) // Flash success banner
      await loadExistingTrip() // Reload data to show updated state
    } // End of error check
  } // End of handleStatusChange definition
  if (loading) { // Render animated placeholder while initial trip fetch is active in edit mode
    return ( // Return loading layout
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center"> {/* Styled centering container */}
        <p className="text-amber-500 font-sans text-sm tracking-widest uppercase animate-pulse">Loading Trip Details...</p> {/* Pulsing loading label */}
      </div> // Close container
    ) // End of loading return statement
  } // End of loading check
  const costsAreLocked = existingTrip?.cost_locked || false // Store flag indicating if cost fields are uneditable
  return ( // Render main interactive form layout screen
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10 text-[#1E3A5F]"> {/* Styled dark page canvas wrapper */}
      <div className="max-w-6xl mx-auto"> {/* Enforce container size constraints */}
        <button // Trigger link to return to the list dashboard
          onClick={() => navigate('/depthead/trips')} // Execute redirection back to list view
          className="text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-6 hover:text-[#2A3F5F] transition-colors inline-flex items-center" // Style settings
        > {/* Open tag */}
          ← Back to Trip List {/* Button text */}
        </button> {/* Close return link */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4 border-b border-[#E5EDFF] pb-4"> {/* Row grouping titles and advance actions */}
          <div> {/* Title heading blocks */}
            <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold">{isEditMode ? 'Edit Educational Trip' : 'Create Educational Trip'}</h1> {/* Main title */}
            <p className="text-[#4A5F7F] font-sans text-sm mt-1">Configure academic field trips, itineraries, and required budgets</p> {/* Context subtitle */}
          </div> {/* Close headings */}
          {isEditMode && existingTrip && ( // Render advanced status operations only for existing trips
            <div className="flex gap-2"> {/* Row wrapper for state modifications */}
              {existingTrip.status === 'Draft' && ( // Publish trigger active strictly on draft states
                <button // Publish button element
                  onClick={handlePublish} // Attach lock and release trigger
                  className="bg-[#8CA5FF] text-white font-sans text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[#7090E5] transition-colors" // Amber styles
                > {/* Open tag */}
                  Publish Trip {/* Action label */}
                </button> // Close publish button
              )} {/* End of draft check */}
              {existingTrip.status === 'Published' && ( // Start ongoing trip trigger active strictly on published states
                <button // Begin ongoing phase button
                  onClick={() => handleStatusChange('Ongoing')} // Transition status to Ongoing
                  className="bg-cyan-500 text-white font-sans text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-cyan-400 transition-colors" // Cyan styles
                > {/* Open tag */}
                  Mark as Ongoing {/* Action label */}
                </button> // Close ongoing button
              )} {/* End of published check */}
              {existingTrip.status === 'Ongoing' && ( // Complete trip phase trigger active strictly on ongoing states
                <button // Mark complete button
                  onClick={() => handleStatusChange('Completed')} // Transition status to Completed
                  className="bg-green-500 text-[#1E3A5F] font-sans text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-green-400 transition-colors" // Green styles
                > {/* Open tag */}
                  Mark as Completed {/* Action label */}
                </button> // Close complete button
              )} {/* End of ongoing check */}
            </div> // Close action wrapper
          )} {/* End of edit status actions check */}
        </div> {/* Close row grouping */}
        {statusMessage && ( // Conditional block to render success notification banner
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-sans text-sm">{statusMessage}</div> // Banner container
        )} {/* End of success check */}
        {error && ( // Conditional block to render warnings and validation alert indicators
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-sans text-sm">{error}</div> // Alert container
        )} {/* End of error check */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> {/* Configure form sections split grid columns */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E5EDFF] space-y-4 shadow-sm"> {/* Card layout for general information inputs with white background */}
            <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-2">General Details</h3> {/* Heading label */}
            <div> {/* Title input section */}
              <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Trip Title *</label> {/* Input label */}
              <input // Input textbox
                type="text" // Input type text
                value={title} // Connect state value
                onChange={(e) => setTitle(e.target.value)} // Update state on key updates
                placeholder="e.g. Lake Langano Geological Expedition" // Format guidance
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF]" // Standard input styles
              /> {/* Close input */}
            </div> {/* Close title input */}
            <div> {/* Description input section */}
              <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Description</label> {/* Input label */}
              <textarea // Input textbox
                value={description} // Connect state value
                onChange={(e) => setDescription(e.target.value)} // Update state
                rows={3} // Set row size
                placeholder="Purpose, objectives, and academic value of this field trip study" // Format guidance
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF] resize-none" // Styles
              /> {/* Close textbox */}
            </div> {/* Close description input */}
            <div> {/* Destination input section */}
              <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Destination Location *</label> {/* Input label */}
              <input // Input textbox
                type="text" // Input type text
                value={destination} // Connect state value
                onChange={(e) => setDestination(e.target.value)} // Update state
                placeholder="e.g. Lake Langano, Oromia Region" // Format guidance
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF]" // Styles
              /> {/* Close input */}
            </div> {/* Close destination input */}
            <div className="grid grid-cols-2 gap-4"> {/* Start and end date layouts */}
              <div> {/* Start date wrapper */}
                <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Start Date *</label> {/* Field label */}
                <input // Date calendar picker
                  type="date" // Type date selector
                  value={startDate} // Connect state
                  onChange={(e) => setStartDate(e.target.value)} // Update state
                  className="w-full bg-white border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF]" // Styles
                /> {/* Close date input */}
              </div> {/* Close start date */}
              <div> {/* End date wrapper */}
                <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">End Date *</label> {/* Field label */}
                <input // Date calendar picker
                  type="date" // Type date selector
                  value={endDate} // Connect state
                  onChange={(e) => setEndDate(e.target.value)} // Update state
                  className="w-full bg-white border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF]" // Styles
                /> {/* Close date input */}
              </div> {/* Close end date */}
            </div> {/* Close dates grid */}
            <div> {/* Capacity input section */}
              <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Max Capacity (students) *</label> {/* Input label */}
              <input // Numeric textbox
                type="number" // Set type to number
                min="1" // Require at least one spot
                value={capacity} // Connect state
                onChange={(e) => setCapacity(e.target.value)} // Update capacity state on entry
                placeholder="e.g. 40" // Format guidance
                className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF]" // Styles
              /> {/* Close capacity input */}
            </div> {/* Close capacity block */}
          </div> {/* Close left details column card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E5EDFF] space-y-4 flex flex-col justify-between shadow-sm"> {/* Card layout for cost calculations with white background */}
            <div> {/* Top half wrapper */}
              <div className="flex items-center justify-between mb-2"> {/* Cost title row */}
                <h3 className="font-serif text-[#1E3A5F] text-xl font-bold">Cost Breakdown</h3> {/* Cost title label */}
                {costsAreLocked && ( // Display locked status indicator if costs are cost_locked
                  <span className="text-xs font-sans text-amber-500 font-semibold uppercase tracking-wider bg-[#8CA5FF]/10 border border-amber-500/20 px-2.5 py-1 rounded-md">🔒 Locked (Published)</span> // Locked label badge
                )} {/* End of cost lock check */}
              </div> {/* Close cost title row */}
              <p className="text-[#4A5F7F] font-sans text-xs mb-6">Enter cost breakdown per single student. Values are read-only once published.</p> {/* Descriptive sub-label */}
              <div className="space-y-3.5"> {/* Stack individual category input items */}
                {COST_CATEGORIES.map((category) => ( // Loop through standard academic cost fields
                  <div key={category} className="flex items-center justify-between gap-4"> {/* Row item wrapper */}
                    <label className="text-[#6B7F9F] font-sans text-xs uppercase tracking-wider font-semibold capitalize w-36">{category}</label> {/* Display label */}
                    <input // Numeric input textbox
                      type="number" // Coerce inputs to numbers
                      min="0" // Disallow negative digits
                      value={costBreakdown[category]} // Connect selected cost state
                      disabled={costsAreLocked} // Disable input if costs are locked on published trip
                      onChange={(e) => handleCostChange(category, e.target.value)} // Track cost changes dynamically
                      className="flex-1 bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF] disabled:opacity-30 disabled:cursor-not-allowed" // Styles
                    /> {/* Close input */}
                  </div> // Close row item
                ))} {/* Close loop */}
              </div> {/* Close categories stack */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#E5EDFF]"> {/* Currency options and payment date deadline */}
                <div> {/* Currency wrapper */}
                  <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Currency</label> {/* Field label */}
                  <select // Dropdown selector
                    value={currency} // Connect currency state
                    disabled={costsAreLocked} // Disable dropdown if costs are locked
                    onChange={(e) => setCurrency(e.target.value)} // Update currency state on select
                    className="w-full bg-white border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF] disabled:opacity-30" // Styles
                  > {/* Open selection list */}
                    <option value="ETB">ETB (Birr)</option> {/* Ethiopian Birr choice */}
                    <option value="USD">USD ($)</option> {/* United States Dollar choice */}
                  </select> {/* Close select drop */}
                </div> {/* Close currency container */}
                <div> {/* Payment due date deadline */}
                  <label className="block text-[#4A5F7F] font-sans text-xs uppercase tracking-wider mb-2">Payment Due Date</label> {/* Field label */}
                  <input // Calendar deadline picker
                    type="date" // Selector date type
                    value={paymentDueDate} // Connect deadline state
                    disabled={costsAreLocked} // Disable if costs are locked
                    onChange={(e) => setPaymentDueDate(e.target.value)} // Update deadline state on date pick
                    className="w-full bg-white border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF] disabled:opacity-30" // Styles
                  /> {/* Close input date */}
                </div> {/* Close payment due container */}
              </div> {/* Close currency grid */}
            </div> {/* Close top half wrapper */}
            <div className="mt-8 p-4 bg-[#F8FAFF] rounded-2xl border border-[#E5EDFF] space-y-2"> {/* Bottom totals summary section */}
              <div className="flex justify-between items-center text-[#6B7F9F] font-sans text-sm font-semibold"> {/* Row wrapper */}
                <span>Estimated Cost Per Student</span> {/* Label */}
                <span className="text-amber-500 text-base font-bold">{totalCostPerStudent.toFixed(2)} {currency}</span> {/* Outputs formatted per-student sum totals */}
              </div> {/* Close row */}
              <div className="flex justify-between items-center text-[#4A5F7F] font-sans text-xs border-t border-[#E5EDFF] pt-2"> {/* Multiplied totals overall row */}
                <span>Overall Estimated Trip Budget ({capacity || 0} slots)</span> {/* Overall budget description */}
                <span className="text-[#2A3F5F] font-semibold">{totalTripCost.toFixed(2)} {currency}</span> {/* Outputs multiplied total budgets */}
              </div> {/* Close row */}
            </div> {/* Close totals summary */}
          </div> {/* Close right cost column card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-[#E5EDFF] space-y-6 shadow-sm"> {/* Full-width card container for day-by-day itinerary plans with white background */}
            <div className="flex items-center justify-between border-b border-[#E5EDFF] pb-4"> {/* Itinerary card header layout */}
              <h3 className="font-serif text-[#1E3A5F] text-xl font-bold">Day-by-Day Itinerary Planner</h3> {/* Title label */}
              <button // Button trigger to append days
                type="button" // Normal button
                onClick={addItineraryDay} // Trigger day addition handler
                className="text-xs font-sans text-cyan-400 hover:text-cyan-300 transition-colors font-semibold" // Cyan styling
              > {/* Open tag */}
                + Add Itinerary Day {/* Action label */}
              </button> {/* Close day adder button */}
            </div> {/* Close card header */}
            {itinerary.length === 0 ? ( // Render empty placeholder if no planning days exist yet
              <p className="text-white/30 font-sans text-sm italic text-center py-6">No day planner added yet. Click "+ Add Itinerary Day" to outline scheduled trip events.</p> // Empty descriptive text label
            ) : ( // Render interactive list of editable days
              <div className="space-y-4"> {/* Stack days with standard spaces */}
                {itinerary.map((dayItem, index) => ( // Loop through active itinerary days array
                  <div key={index} className="p-4 bg-[#F8FAFF] rounded-xl border border-[#E5EDFF] space-y-3"> {/* Individual day entry box */}
                    <div className="flex items-center justify-between"> {/* Day index indicator header */}
                      <span className="text-amber-500 font-sans text-xs font-bold uppercase tracking-wider">Day {dayItem.day}</span> {/* Displays day count sequential numbering */}
                      <button // Day remover button trigger
                        type="button" // Disallow standard form submits
                        onClick={() => removeItineraryDay(index)} // Trigger day removal handler on click
                        className="text-red-400 hover:text-red-300 text-xs font-sans transition-colors" // Styled red warning text
                      > {/* Open tag */}
                        Remove Day {/* Action text */}
                      </button> {/* Close day remover button */}
                    </div> {/* Close day header */}
                    <input // Day title textbox
                      type="text" // Input type text
                      value={dayItem.title} // Connect title state
                      onChange={(e) => updateItineraryDay(index, 'title', e.target.value)} // Save text modifications to state
                      placeholder="Day activity focus (e.g. Arrival, check-in, and department orientation)" // Guidance placeholder
                      className="w-full bg-white border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF]" // Form control style
                    /> {/* Close input */}
                    <textarea // Day activities description textbox
                      value={dayItem.activities} // Connect activities details state
                      onChange={(e) => updateItineraryDay(index, 'activities', e.target.value)} // Save details modifications to state
                      placeholder="Outline specific academic activities, study plans, or transportation details scheduled on this day" // Guidance placeholder
                      rows={2} // Set visible textbox height
                      className="w-full bg-white border-2 border-[#E5EDFF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA5FF] focus:border-[#8CA5FF] resize-none" // Form control style
                    /> {/* Close textarea */}
                  </div> // Close day entry box
                ))} {/* Close loop */}
              </div> // Close days list container
            )} {/* End of itinerary presence check */}
          </div> {/* Close itinerary column card */}
        </div> {/* Close form grid columns split */}
        <div className="mt-8 border-t border-[#E5EDFF] pt-6"> {/* Bottom form action save button wrapper */}
          <button // Primary form submission button
            onClick={handleSave} // Trigger validation checks and database creation/update handlers
            disabled={saving} // Disable button when database saving transaction is currently active
            className="bg-[#8CA5FF] text-white font-sans text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-[#7090E5] disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/10" // Gold themed master action styles
          > {/* Open tag */}
            {saving ? 'Saving...' : isEditMode ? 'Save Trip Changes' : 'Create Trip Record'} {/* State dynamic messages */}
          </button> {/* Close submit button */}
        </div> {/* Close save buttons wrapper */}
      </div> {/* Close page size wrap */}
    </div> // Close parent canvas
  ) // End of primary return statement
} // End of TripFormPage component definition




