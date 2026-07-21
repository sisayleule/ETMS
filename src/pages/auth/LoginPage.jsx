// =====================================================================================================================
// USER PORTAL LOGIN SCREEN
// Handles user session authentication with email and password using Supabase Auth client.
// Redirects authorized student roles to /student/dashboard and departmentHead to /depthead/dashboard.
// Offers quick-access prefilled profile accounts for university testing and verification.
// =====================================================================================================================
import React, { useState } from 'react' // Import React and useState hook to manage email, password, loading, and error states
import { useNavigate, Link } from 'react-router-dom' // Import useNavigate and Link for client-side redirection and path mappings
import { supabase } from '../../lib/supabase' // Import the initialized Supabase client to trigger authentication queries
import { useAuth } from '../../context/AuthContext' // Import useAuth custom hook to update context profile state after successful login
import { LogoDark } from '../../components/Logo' // Import dark logo component for dark background

export default function LoginPage() { // Define and export the main LoginPage functional component
  const [email, setEmail] = useState('') // Define email state to hold username string typed by the user
  const [password, setPassword] = useState('') // Define password state to hold the secret authentication string
  const [loading, setLoading] = useState(false) // Define loading state to disable submit button during active network requests
  const [error, setError] = useState('') // Define error state to store and display validation or authentication failure messages
  const navigate = useNavigate() // Initialize navigate hook to redirect authenticated users to their corresponding portals
  const { refreshProfile } = useAuth() // Extract state properties and profile refresh methods from AuthContext

  const quickAccess = [ // Define quickAccess array of preset credentials for easy development demonstration
    { // Preset option one for testing the Department Head experience
      label: 'Department Head', // Visible button label name
      email: 'depthead@ambo.edu', // Hashed email address matching seeded user
      password: 'DeptHead123!', // Password for Supabase auth
      role: 'departmentHead', // Targeted role of the department head account
      color: 'border-gold text-gold', // Yellow branding styling colors
    }, // Close option one
    { // Preset option two for testing the Student experience
      label: 'Student', // Visible button label name
      email: 'student1@ambo.edu', // Hashed email address matching seeded user
      password: 'Student123!', // Password for Supabase auth
      role: 'student', // Targeted role of the student account
      color: 'border-indigo-main text-indigo-400', // Indigo branding styling colors
    }, // Close option two
  ] // Close quickAccess array definition

  const handleQuickAccess = (account) => { // Define action callback triggered when a quick access button is clicked
    setEmail(account.email) // Set the email input state with the clicked account email value
    setPassword(account.password) // Set the password input state with the clicked account password value
    setError('') // Reset any active error feedback text to clear the display panel
  } // Close handleQuickAccess function block

  const handleSubmit = async (e) => { // Define async submit handler to initiate user login flow on form submission
    e.preventDefault() // Block browser's default form reload action on submit
    setError('') // Reset the error display text before starting the request
    if (!email || !password) { // Validate that both email and password input fields are filled
      setError('Please enter your email and password.') // Display warning text to the user if fields are missing
      return // Halt execution of authentication request
    } // Close validation check block
    setLoading(true) // Set the loading state to true to disable interactive forms while checking credentials

    try { // Wrap the Supabase authentication call inside a try-catch block for error protection
      const { data, error: authError } = await supabase.auth.signInWithPassword({ // Initiate Supabase email/password login
        email: email.trim().toLowerCase(), // Trim leading and trailing spaces from the email and convert it to lower case
        password: password, // Pass the typed password string directly
      }) // End signInWithPassword request call

      if (authError) { // Check if the authentication service returned an error response
        setError(authError.message || 'Login failed. Please check your credentials.') // Set error message to notify user
        setLoading(false) // Terminate loading state to re-enable form fields
        return // Halt login workflow
      } // Close authentication error check block

      const { data: profileData, error: profileError } = await supabase // Query profiles table to retrieve role matching signed-in user ID
        .from('profiles') // Reference the target profiles collection
        .select('role') // Select only the role column value
        .eq('id', data.user.id) // Filter matching rows where user id is equal to the authenticated user's ID
        .single() // Return a single row object instead of a list

      if (profileError || !profileData) { // Check if database profile lookup failed or returned empty results
        setError('Could not load your profile. Please contact support.') // Notify the user about missing profile registry
        setLoading(false) // Terminate loading state to allow retry actions
        return // Halt login workflow
      } // Close profile retrieval error check block

      await refreshProfile() // Execute custom profile refresh to sync AuthContext state with fresh database values

      if (profileData.role === 'student') { // Check if the successfully authenticated user's role matches student
        navigate('/student/dashboard') // Redirect student user to student dashboard landing route
      } else if (profileData.role === 'departmentHead') { // Check if the successfully authenticated user's role matches departmentHead
        navigate('/depthead/dashboard') // Redirect department head user to administration dashboard route
      } else { // Handle edge case where user has an invalid role configuration
        setError('Unknown account role. Please contact support.') // Inform user about database configuration anomaly
      } // Close role routing split block

    } catch (err) { // Catch any unexpected processing errors or network timeouts
      setError('Something went wrong. Please try again.') // Display user-friendly generic fallback error message
      console.error('Login error:', err) // Print full error details to console log for developer tracking
    } finally { // Run finally block to guarantee cleanup actions occur
      setLoading(false) // Reset loading state to false once full transaction finishes
    } // Close try-catch-finally block
  } // Close handleSubmit login function block

  return ( // Render the login page layout structure split into cinematic left and right sections
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50 auth-page"> {/* Full viewport height flex container with light gradient background - auth-page class for CSS targeting */}

      {/* LEFT PANEL - Institution branding visual section */}
      <div className="hidden lg:flex w-2/5 bg-gradient-to-br from-bg-deep to-indigo-900 flex-col items-center justify-center p-12 border-r border-gold/20 shadow-2xl"> {/* Large screen-only navy sidebar panel with gradient */}
        <LogoDark size="xl" className="mb-8" /> {/* University Logo */}
        <h1 className="font-serif text-3xl font-bold text-center leading-tight mb-4" style={{ color: '#FFFFFF', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}> {/* High-contrast display header with forced white color and shadow */}
          Educational Trip {/* Row one of the application header title */}
          <br /> {/* Responsive line break */}
          Management System {/* Row two of the application header title */}
        </h1> {/* Close main title heading */}
        <div className="w-12 h-px bg-gold mb-4" /> {/* Decorative gold horizontal divider line */}
        <p className="text-[#F4D03F] font-sans text-xs tracking-widest uppercase text-center font-bold"> {/* Tourism department subtitle with brighter gold */}
          Department of Tourism and Hotel Management {/* Department name label */}
        </p> {/* Close subtitle text */}
        <div className="mt-12 max-w-xs"> {/* Content box containing academic motivational quotes */}
          <p className="font-serif text-white text-lg italic text-center leading-relaxed drop-shadow-md"> {/* Quotation paragraph with full white and shadow */}
            Every journey begins with a single step. We make sure every step is documented. {/* Inspiring message text */}
          </p> {/* Close quotation text */}
        </div> {/* Close quote panel container */}
      </div> {/* Close left university branding panel */}

      {/* RIGHT PANEL - Authentication form section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-sm"> {/* Responsive centered input panel with light background */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200"> {/* White card container with shadow and border */}
          <h2 className="font-serif text-bg-deep text-3xl font-bold mb-2"> {/* Portal entry header in navy */}
            Welcome Back {/* Direct entry greeting */}
          </h2> {/* Close title element */}
          <p className="text-slate-600 font-sans text-sm mb-8"> {/* Descriptive subtitle caption */}
            Sign in to your academic portal {/* Explanatory instruction label */}
          </p> {/* Close subtitle text */}

          {/* QUICK ACCESS CARDS GROUP */}
          <div className="mb-6"> {/* Container grouping developmental fast-access buttons */}
            <p className="text-slate-500 font-sans text-xs tracking-widest uppercase mb-3"> {/* Mini section header */}
              Quick Access {/* Label marking sandbox login help options */}
            </p> {/* Close header label */}
            <div className="grid grid-cols-2 gap-3"> {/* Align quick login buttons inside a balanced two-column grid */}
              {quickAccess.map((account) => ( // Loop over the quickAccess configuration array to render buttons dynamically
                <button // Prefilled credentials selection trigger button
                  key={account.email} // Assign unique key matching account email address
                  onClick={() => handleQuickAccess(account)} // Fill email and password inputs with preset values on click
                  className={`p-3 rounded-xl border-2 bg-white hover:bg-slate-50 transition-all text-left shadow-sm ${account.color}`} // Branding outline styling styles
                > {/* Open interactive button element */}
                  <p className="font-sans text-xs font-semibold uppercase tracking-wide"> {/* Main account role label */}
                    {account.label} {/* Render role description name */}
                  </p> {/* Close label paragraph */}
                  <p className="font-sans text-xs text-slate-500 mt-1 truncate"> {/* Trimmed email preview text */}
                    {account.email} {/* Render role email address */}
                  </p> {/* Close email paragraph */}
                </button> // Close button tag
              ))} {/* Finish quickAccess mapping loop */}
            </div> {/* Close grid container */}
          </div> {/* Close quick access group */}

          {/* FORM DIVIDER */}
          <div className="flex items-center gap-3 mb-6"> {/* Horizontal aligned border elements row */}
            <div className="flex-1 h-px bg-slate-300" /> {/* Left gray divider bar segment */}
            <p className="text-slate-400 font-sans text-xs tracking-widest"> {/* Inline indicator text */}
              OR ENTER CREDENTIALS {/* Divider message text */}
            </p> {/* Close indicator label */}
            <div className="flex-1 h-px bg-slate-300" /> {/* Right gray divider bar segment */}
          </div> {/* Close layout divider wrapper */}

          {/* DYNAMIC ERROR ALERTS PANEL */}
          {error && ( // Perform short-circuit checking to render error alert box when string message is present
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300"> {/* Red backdrop warning alert capsule */}
              <p className="text-red-700 font-sans text-sm">{error}</p> {/* Display current string content of the error state */}
            </div> // Close error alert capsule
          )} {/* Finish conditional alert render */}

          {/* INTERACTIVE LOGIN INPUT FORM */}
          <form onSubmit={handleSubmit} className="space-y-4"> {/* Register submit handler on standard HTML form element */}
            <div> {/* Email parameter input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Email Address {/* Visible email tag label */}
              </label> {/* Close email label element */}
              <input // Interactive text input node for email
                type="email" // Force standard email formatting validation
                value={email} // Map input value to current email React state
                onChange={(e) => setEmail(e.target.value)} // Update email state on keypress change events
                placeholder="your@ambo.edu" // Helpful entry example placeholder
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close email input tag */}
            </div> {/* Close email input grouping */}

            <div> {/* Password parameter input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Password {/* Visible password tag label */}
              </label> {/* Close password label element */}
              <input // Interactive password entry input node
                type="password" // Obscure password characters for user security protection
                value={password} // Map input value to current password React state
                onChange={(e) => setPassword(e.target.value)} // Update password state on keypress change events
                placeholder="Enter your password" // Helpful entry placeholder description
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close password input tag */}
            </div> {/* Close password input grouping */}

            <button // Primary sign in action form trigger button
              type="submit" // Set type as submit to handle keypress Enter submissions
              disabled={loading} // Disable user interactions while loading state is true
              className="w-full bg-gradient-to-r from-bg-deep to-indigo-800 text-white font-sans text-sm font-semibold tracking-widest uppercase py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 shadow-md" // Styled premium action button
            > {/* Open button tag */}
              {loading ? 'Signing In...' : 'Sign In to Portal'} {/* Show dynamic button text matching pending network requests */}
            </button> {/* Close form trigger button */}
          </form> {/* Close input form element */}

          {/* NAVIGATIONAL SIGN-UP REDIRECT CARD */}
          <p className="text-slate-600 font-sans text-sm text-center mt-6"> {/* Centered redirection text */}
            Need an account?{' '} {/* Prompt label question */}
            <Link to="/register" className="text-gold hover:text-gold-light transition-colors font-semibold"> {/* Navigation Link to register route */}
              Register here {/* Call to action link text */}
            </Link> {/* Close registration link */}
          </p> {/* Close prompt container */}

          {/* HOME PAGE REDIRECT LINK */}
          <p className="text-slate-500 font-sans text-sm text-center mt-3"> {/* Centered back link wrap */}
            <Link to="/" className="hover:text-slate-700 transition-colors"> {/* Navigational link to base landing index path */}
              ← Back to Home {/* Descriptive back arrow link text */}
            </Link> {/* Close home landing link */}
          </p> {/* Close back link container */}

        </div> {/* Close form inner constraint div */}
      </div> {/* Close right input form panel */}
    </div> // Close parent flex layout div
  ) // Close return statement
} // Close LoginPage functional component block
