// TripJournalPage lets a student write private dated journal entries for one trip
// entries can be edited or deleted by their author
// supports title, content, date, mood, and photos
import { useState, useEffect } from 'react' // Import state hooks and effect hooks from standard react package
import { useParams, useNavigate } from 'react-router-dom' // Import routing parameters and navigation helpers
import { useAuth } from '../../context/AuthContext' // Import custom auth context to verify identity and privileges
import { fetchTripDetail } from '../../lib/registrationService' // Import registration service to query specific trip parameters
import { supabase } from '../../lib/supabase' // Import supabase client for direct updates
import { // Import multiple service transactions from gamification service file
  fetchJournalForTrip, // Import journal fetching operation
  createJournalEntry, // Import journal creation transaction
  updateJournalEntry, // Import journal content editing transaction
  deleteJournalEntry, // Import journal row deletion transaction
} from '../../lib/gamificationService' // Connect gamification service library

// Mood options with emoji icons for visual selection
const MOOD_OPTIONS = [ // Define constant array containing mood choices with emoji representations
  { value: 'excited', label: 'Excited', icon: '😄' }, // Happy excited mood option
  { value: 'grateful', label: 'Grateful', icon: '🙏' }, // Grateful thankful mood option
  { value: 'thoughtful', label: 'Thoughtful', icon: '🤔' }, // Contemplative reflective mood option
  { value: 'inspired', label: 'Inspired', icon: '✨' }, // Motivated inspired mood option
  { value: 'tired', label: 'Tired', icon: '😴' }, // Exhausted tired mood option
  { value: 'neutral', label: 'Neutral', icon: '😐' }, // Neutral calm mood option
] // End mood options array definition

function TripJournalPage() { // Begin TripJournalPage component definitions
  // get the trip id from the URL
  const { id } = useParams() // Extract active trip UUID parameter from URL path

  // navigate for going back
  const navigate = useNavigate() // Initialize navigation dispatcher helper

  // get the logged in student
  const { user } = useAuth() // Extract student user session object from auth context

  // holds the trip data, used for the page title
  const [trip, setTrip] = useState(null) // Manage state containing trip detail info for header displays

  // holds the list of journal entries for this trip
  const [entries, setEntries] = useState([]) // Manage state representing current student's journal list array

  // loading state while fetching
  const [loading, setLoading] = useState(true) // Manage loader state to display spinner animations

  // new entry form fields with title and mood added
  const [newTitle, setNewTitle] = useState('') // Manage entry title input string state
  const [newContent, setNewContent] = useState('') // Manage entry content textarea input string state
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]) // Manage selected entry calendar date input state (defaults to today)
  const [newMood, setNewMood] = useState('') // Manage selected mood option string state
  const [submitting, setSubmitting] = useState(false) // Maintain submitting indicator flag state for button locks

  // tracks which entry id is currently being edited
  const [editingId, setEditingId] = useState(null) // Manage state tracking active inline-editing row ID
  const [editTitle, setEditTitle] = useState('') // Manage inline-edit title input state
  const [editContent, setEditContent] = useState('') // Manage inline-edit text input state
  const [editMood, setEditMood] = useState('') // Manage inline-edit mood selection state

  // error message
  const [error, setError] = useState('') // Manage state text string representing input or database error alerts

  // loadData fetches the trip and journal entries together
  const loadData = async () => { // Begin asynchronous loadData declaration
    setLoading(true) // Set loader state to true to present loading progress
    const { trip: tripData } = await fetchTripDetail(id) // Retrieve trip details matching URL target ID
    setTrip(tripData) // Save retrieved trip details inside local state
    const { entries: data } = await fetchJournalForTrip(user.id, id) // Retrieve target student's journal entries list for trip
    setEntries(data || []) // Save retrieved list inside local state array
    setLoading(false) // Set loader state to false to show the main card components
  } // End loadData function block

  // fetch once on mount
  useEffect(() => { // Begin mount lifecycle effect
    if (user?.id) loadData() // Execute load sequence if student user session exists
  }, [id, user?.id]) // Re-run if ID parameter or student session changes

  // handleCreate validates and submits a new journal entry with title and mood
  const handleCreate = async () => { // Begin handleCreate transaction helper
    setError('') // Clear any preceding error alert

    // require at least some content
    if (!newContent.trim()) { // Check for empty or spacing-only text inputs
      setError('Please write something before saving.') // Set friendly warning message
      return // Halt execution flow
    } // End check block

    setSubmitting(true) // Lock submit controls to avoid redundant operations
    const { entry, error: createError } = await createJournalEntry( // Trigger insert transaction in database with extended parameters
      user.id, id, newContent.trim(), newDate, null, newTitle.trim() || null, newMood || null // Pass parameters: student identifier, trip identifier, formatted content, entry date, photo url, title, mood
    ) // End insert call
    setSubmitting(false) // Release submit button lock

    if (createError) { // Check if database returned transaction error
      setError('Could not save entry. Please try again.') // Render friendly alert message
      return // Halt execution
    } // End error check block

    // add to the top of the local list and reset the form
    setEntries([entry, ...entries]) // Prepend newly created entry row to active entries list
    setNewTitle('') // Clear title input field
    setNewContent('') // Clear textarea composer field
    setNewMood('') // Clear mood selection dropdown
  } // End handleCreate function

  // handleStartEdit opens inline editing for an entry with all fields
  const handleStartEdit = (entry) => { // Begin handleStartEdit definitions helper
    setEditingId(entry.id) // Map target entry ID as currently being modified
    setEditTitle(entry.title || '') // Set original title as starting text input state
    setEditContent(entry.content) // Set original content as starting text input state
    setEditMood(entry.mood || '') // Set original mood as starting selection state
  } // End handleStartEdit function

  // handleSaveEdit submits the edited content with title and mood
  const handleSaveEdit = async (entryId) => { // Begin handleSaveEdit definition
    if (!editContent.trim()) return // Cancel action if edit text content is empty
    
    // Update entry with all editable fields
    const { error: updateError } = await supabase // Trigger update on supabase client
      .from('journal_entries') // Target journal_entries table (correct database table name)
      .update({ // Set updated field values
        title: editTitle.trim() || null, // Update title field
        content: editContent.trim(), // Update content field
        mood: editMood || null, // Update mood field
        updated_at: new Date().toISOString() // Bump updated timestamp
      }) // End update payload
      .eq('id', entryId) // Target matching entry identifier
    
    if (!updateError) { // Check if update transaction finished successfully
      setEntries(entries.map((e) => // Update entries array locally
        e.id === entryId // Find matching entry by ID
          ? { ...e, title: editTitle.trim() || null, content: editContent.trim(), mood: editMood || null } // Apply updated values
          : e // Keep other entries unchanged
      )) // End map transformation
      setEditingId(null) // Release edit row tracker state
    } // End successful check block
  } // End handleSaveEdit function

  // handleDelete removes an entry after the user confirms
  const handleDelete = async (entryId) => { // Begin handleDelete definition
    if (window.confirm('Are you sure you want to delete this journal entry?')) { // Request user confirmation
      const { error: deleteError } = await deleteJournalEntry(entryId) // Trigger database delete query transaction
      if (!deleteError) { // Check if row deletion transaction succeeded
        setEntries(entries.filter((e) => e.id !== entryId)) // Filter out deleted row from local list array state
      } // End successful check block
    } // End confirmation wrapper block
  } // End handleDelete function

  // getMoodIcon retrieves emoji icon for a mood value
  const getMoodIcon = (mood) => { // Begin getMoodIcon helper function
    const option = MOOD_OPTIONS.find((opt) => opt.value === mood) // Search mood options array for matching value
    return option ? option.icon : '' // Return emoji icon if found, empty string otherwise
  } // End getMoodIcon function

  // show loading screen while fetching
  if (loading) { // Check if loading state is active
    return ( // Return loader JSX layout
      <div className="min-h-[60vh] flex items-center justify-center"> {/* Centered layout container */}
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Pulse text caption */}
          Loading Journal... {/* Informational placeholder string */}
        </p> {/* Close paragraph layout */}
      </div> // Close centering wrapper
    ) // End loader JSX template
  } // End check block

  return ( // Begin main page layout JSX return statement
    // page wrapper
    <div className="p-6 md:p-10 max-w-4xl mx-auto"> {/* Constrained margin layout wrapper */}

      {/* back link */}
      <button // Go back trigger button element
        onClick={() => navigate(`/student/trips/${id}`)} // Route back to student trip detail dashboard upon click
        className="text-[#4A5F7F] font-sans text-sm mb-4 hover:text-[#2A3F5F] transition-colors duration-300" // Styled visual properties
      > {/* Back link label */}
        ← Back to Trip Details {/* Visual back instruction text */}
      </button> {/* Close back link button */}

      {/* page header */}
      <div className="mb-6"> {/* Spacing header box */}
        <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">My Trip Journal</h1> {/* Page title banner */}
        <p className="text-[#4A5F7F] font-sans text-sm"> {/* Spacing subtitle section */}
          Your private notes, reflections, and memories from {trip?.title || 'this study tour'} {/* Dynamic subtitle description */}
        </p> {/* Close subtitle */}
      </div> {/* Close header box */}

      {/* error message */}
      {error && ( // Conditional render if active validation error is present
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 max-w-2xl"> {/* Alert error layout box */}
          <p className="text-red-400 font-sans text-sm">{error}</p> {/* Error text string element */}
        </div> // Close alert error layout box
      )} {/* Close conditional checks */}

      {/* new entry composer with title and mood */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EDFF] max-w-2xl mb-6"> {/* Styled card containing entry editor controls */}
        <h2 className="text-[#1E3A5F] font-serif text-lg font-bold mb-4">Create New Entry</h2> {/* Composer section header */}
        
        <div className="mb-4"> {/* Spacing layout section for title input */}
          <label className="block text-[#4A5F7F] font-sans text-[10px] uppercase tracking-wide mb-1.5"> {/* Input field label */}
            Entry Title (Optional) {/* Label name caption */}
          </label> {/* Close label */}
          <input // Text input for entry title
            type="text" // Standard text input type
            value={newTitle} // Bind current title input state
            onChange={(e) => setNewTitle(e.target.value)} // Update state on typing events
            placeholder="e.g., First Day at the Resort" // Contextual placeholder example
            className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors duration-300" // Clean input styles
          /> {/* Close title input element */}
        </div> {/* Close title input section */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"> {/* Responsive grid for date and mood */}
          <div> {/* Date picker column */}
            <label className="block text-[#4A5F7F] font-sans text-[10px] uppercase tracking-wide mb-1.5"> {/* Input field label */}
              Entry Date {/* Label name caption */}
            </label> {/* Close label */}
            <input // Calendar date select element
              type="date" // Native date picker type
              value={newDate} // Bind current calendar input state
              onChange={(e) => setNewDate(e.target.value)} // Update state on change events
              className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors duration-300" // Clean input styles
            /> {/* Close date input element */}
          </div> {/* Close date picker column */}

          <div> {/* Mood selector column */}
            <label className="block text-[#4A5F7F] font-sans text-[10px] uppercase tracking-wide mb-1.5"> {/* Input field label */}
              Mood (Optional) {/* Label name caption */}
            </label> {/* Close label */}
            <select // Dropdown select for mood options
              value={newMood} // Bind current mood selection state
              onChange={(e) => setNewMood(e.target.value)} // Update state on selection events
              className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold transition-colors duration-300" // Clean select styles
            > {/* Open select options */}
              <option value="">Select mood...</option> {/* Default empty option */}
              {MOOD_OPTIONS.map((mood) => ( // Loop through mood options array
                <option key={mood.value} value={mood.value}> {/* Mood option element with unique key */}
                  {mood.icon} {mood.label} {/* Display emoji and label */}
                </option> // Close option element
              ))} {/* Close mood options mapping loop */}
            </select> {/* Close select element */}
          </div> {/* Close mood selector column */}
        </div> {/* Close date and mood grid */}

        <div className="mb-4"> {/* Spacing text section */}
          <label className="block text-[#4A5F7F] font-sans text-[10px] uppercase tracking-wide mb-1.5"> {/* Input field label */}
            Your Thoughts & Observations {/* Label description name */}
          </label> {/* Close label */}
          <textarea // Main journal note text composer
            value={newContent} // Bind current text content input state
            onChange={(e) => setNewContent(e.target.value)} // Update state on typing events
            placeholder="What operational practices, resort insights, cultural observations, or personal reflections stood out to you today?" // Context-relevant placeholder caption
            rows={6} // Set baseline visible rows
            className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none transition-colors duration-300" // Styled visual classes
          /> {/* Close textarea composer element */}
        </div> {/* Close textarea section */}
        
        <button // Form submit button element
          onClick={handleCreate} // Fire create journal entry helper upon click
          disabled={submitting} // Disabled state during active submission transactions
          className="bg-gold text-charcoal font-sans text-xs font-semibold uppercase tracking-wide px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-300" // Styled visual custom parameters
        > {/* Button label content */}
          {submitting ? 'Saving Entry...' : 'Save Journal Entry'} {/* Dynamic text depending on submission states */}
        </button> {/* Close submit button */}
      </div> {/* Close composer card layout */}

      {/* entries list */}
      <div className="space-y-4 max-w-2xl"> {/* Vertically stacked timeline section */}
        <h2 className="text-[#6B7F9F] font-serif text-lg font-bold mb-3 border-b border-[#E5EDFF] pb-2">My Journal Entries</h2> {/* Subsection header */}
        {entries.length === 0 ? ( // Conditional render if active student journal list contains zero entries
          <div className="bg-white/40 rounded-2xl p-8 border border-[#E5EDFF] text-center"> {/* Nested information card wrapper */}
            <p className="text-[#4A5F7F] font-sans text-sm">No journal entries recorded for this trip yet. Use the form above to create your first entry!</p> {/* Empty description caption */}
          </div> // Close nested information card
        ) : ( // Else render individual journal elements
          entries.map((entry) => ( // Loop through past journal records array
            <div key={entry.id} className="bg-white rounded-2xl p-5 border border-[#E5EDFF] hover:border-[#C5D5FF] transition-colors duration-300"> {/* Styled journal card slot container */}

              {editingId === entry.id ? ( // Conditional inline-edit form check
                <div> {/* Inline edit card slot */}
                  {/* Edit title field */}
                  <input // Inline title editor input
                    type="text" // Standard text input type
                    value={editTitle} // Bind modification title input state
                    onChange={(e) => setEditTitle(e.target.value)} // Update state on inline typing events
                    placeholder="Entry title (optional)" // Placeholder text
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold mb-3" // Input classes
                  /> {/* Close title input element */}
                  
                  {/* Edit mood selector */}
                  <select // Inline mood selector dropdown
                    value={editMood} // Bind modification mood selection state
                    onChange={(e) => setEditMood(e.target.value)} // Update state on selection events
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold mb-3" // Select classes
                  > {/* Open select options */}
                    <option value="">No mood selected</option> {/* Default empty option */}
                    {MOOD_OPTIONS.map((mood) => ( // Loop through mood options array
                      <option key={mood.value} value={mood.value}> {/* Mood option element */}
                        {mood.icon} {mood.label} {/* Display emoji and label */}
                      </option> // Close option element
                    ))} {/* Close mood options mapping loop */}
                  </select> {/* Close select element */}
                  
                  {/* Edit content textarea */}
                  <textarea // Inline content editor textarea
                    value={editContent} // Bind modification text content input state
                    onChange={(e) => setEditContent(e.target.value)} // Update state on inline typing events
                    rows={5} // Set editor rows height
                    className="w-full bg-white/5 border border-[#C5D5FF] rounded-lg px-3 py-2 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-gold resize-none mb-3" // Input classes
                  /> {/* Close textarea editor element */}
                  
                  <div className="flex gap-3"> {/* Inline control buttons wrapper */}
                    <button // Submit edit button
                      onClick={() => handleSaveEdit(entry.id)} // Fire save operation upon click
                      className="text-gold font-sans text-xs font-semibold hover:text-gold-light transition-colors duration-300" // Styled controls
                    > {/* Label name */}
                      Save Changes {/* Label caption */}
                    </button> {/* Close save button */}
                    <button // Cancel edit button
                      onClick={() => setEditingId(null)} // Reset active editing ID helper upon click
                      className="text-[#4A5F7F] font-sans text-xs hover:text-[#2A3F5F] transition-colors duration-300" // Styled controls
                    > {/* Label name */}
                      Cancel {/* Label caption */}
                    </button> {/* Close cancel button */}
                  </div> {/* Close controls row */}
                </div> // Close edit card slot block
              ) : ( // Else render standard text layout view
                <div> {/* Static layout view block */}
                  {/* Display mood and date header */}
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2"> {/* Header row with spacing */}
                    <p className="text-gold font-sans text-xs font-medium uppercase tracking-wider"> {/* Timestamp label section */}
                      {new Date(entry.entry_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} {/* Beautiful local calendar formatting representation */}
                    </p> {/* Close date text block */}
                    {entry.mood && ( // Conditional render if mood is set
                      <span className="text-lg">{getMoodIcon(entry.mood)}</span> // Display mood emoji icon
                    )} {/* Close mood conditional */}
                  </div> {/* Close header row */}
                  
                  {/* Display title if present */}
                  {entry.title && ( // Conditional render if title exists
                    <h3 className="text-[#1E3A5F] font-serif text-lg font-bold mb-2">{entry.title}</h3> // Display entry title
                  )} {/* Close title conditional */}
                  
                  {/* Display content */}
                  <p className="text-[#2A3F5F] font-sans text-sm mb-4 whitespace-pre-wrap leading-relaxed"> {/* Styled paragraphs wrapper */}
                    {entry.content} {/* Raw entry content text string */}
                  </p> {/* Close paragraph block */}
                  
                  <div className="flex gap-4 border-t border-[#E5EDFF] pt-3 mt-2"> {/* Visual separator with management buttons */}
                    <button // Open editor inline trigger button
                      onClick={() => handleStartEdit(entry)} // Fire inline editor setup upon click
                      className="text-cyan-main font-sans text-xs font-medium hover:text-cyan-300 transition-colors duration-300" // Styled visual text link
                    > {/* Label description */}
                      Edit Entry {/* Text tag */}
                    </button> {/* Close edit trigger button */}
                    <button // Permanent delete trigger button
                      onClick={() => handleDelete(entry.id)} // Trigger delete sequence with confirmation checks upon click
                      className="text-red-400/70 font-sans text-xs font-medium hover:text-red-400 transition-colors duration-300" // Red-tinted text link styles
                    > {/* Label description */}
                      Delete Entry {/* Text tag */}
                    </button> {/* Close delete trigger button */}
                  </div> {/* Close separator section */}
                </div> // Close static layout view block
              )} {/* Close inline-edit conditional check */}
            </div> // Close individual journal card slot
          )) // Close entries mapping loop
        )} {/* Close empty entries conditional rendering checks */}
      </div> {/* Close vertical timeline container */}
    </div> // End constrained layout wrapper
  ) // End return template
} // End TripJournalPage functional page component block

export default TripJournalPage // Export page component as default
