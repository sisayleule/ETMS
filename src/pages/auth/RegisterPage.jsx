// =====================================================================================================================
// NEW STUDENT REGISTRATION SCREEN
// Handles new student account creation with email, password, and profiles database mapping.
// Inserts rows into the profiles and health_info tables to initialize the student database record automatically.
// Redirection occurs dynamically back to the login page after registration successfully registers.
// =====================================================================================================================
import React, { useState } from 'react' // Import React and useState hook to manage student parameter inputs, messages, and loads
import { useNavigate, Link } from 'react-router-dom' // Import useNavigate and Link to execute client-side routing changes and redirects
import { supabase } from '../../lib/supabase' // Import the initialized Supabase client to trigger authentication and insert queries
import { useAuth } from '../../context/AuthContext' // Import auth context
import Logo from '../../components/Logo' // Import logo component

export default function RegisterPage() { // Define and export the main RegisterPage functional component
  const [fullName, setFullName] = useState('') // Define fullName state to map the text entered in the Full Name field
  const [email, setEmail] = useState('') // Define email state to map the text entered in the Email Address field
  const [phoneNumber, setPhoneNumber] = useState('') // Define phoneNumber state to hold the student's phone number
  const [password, setPassword] = useState('') // Define password state to hold the registration security string
  const [confirmPassword, setConfirmPassword] = useState('') // Define confirmPassword state to verify password matching parity
  const [studentIdNumber, setStudentIdNumber] = useState('') // Define studentIdNumber state to hold academic identification
  const [yearOfStudy, setYearOfStudy] = useState('') // Define yearOfStudy state to specify the current college year levels
  const [loading, setLoading] = useState(false) // Define loading state to disable submit button during active network requests
  const [error, setError] = useState('') // Define error state to store and display registration failure messages
  const [success, setSuccess] = useState('') // Define success state to store and display registration validation approvals
  const navigate = useNavigate() // Initialize navigate hook to redirect successfully registered students to login portal
  const { refreshProfile } = useAuth() // Get refresh function from auth context

  const handleSubmit = async (e) => { // Define async submit handler to process form validations and create the user
    e.preventDefault() // Block browser's default form reload actions on submit
    setError('') // Reset any active error feedback text to clear the display panel
    setSuccess('') // Reset any active success feedback text to clear the display panel

    if (!fullName || !email || !password || !studentIdNumber || !phoneNumber) { // Validate that all required fields are filled by the student
      setError('Please fill in all required fields.') // Set error message to notify user of missing data parameters
      return // Halt execution of registration request
    } // Close required fields validation check block

    // Validate phone number format (basic validation for international formats)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
    if (!phoneRegex.test(phoneNumber.trim())) {
      setError('Please enter a valid phone number.')
      return
    }

    if (password !== confirmPassword) { // Verify if the entered password matches the confirmation password exactly
      setError('Passwords do not match. Please try again.') // Inform the user that the passwords do not align
      return // Halt execution of registration request
    } // Close password confirmation check block

    if (password.length < 8) { // Enforce a minimum safety length of eight characters on passwords
      setError('Password must be at least 8 characters long.') // Notify user about minimum password length requirement
      return // Halt execution of registration request
    } // Close password length safety check block

    setLoading(true) // Enable loading status flag to disable active form controls

    try { // Wrap the multi-step registration workflow inside a try-catch block for resilience
      // Step 1: Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            role: 'student',
            phone_number: phoneNumber.trim(),
            student_id_number: studentIdNumber.trim().toUpperCase(),
            year_of_study: yearOfStudy || null
          }
        }
      })

      if (authError) {
        setError(authError.message || 'Registration failed. Please try again.')
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Step 2: Ensure profile is created with all details
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: fullName.trim(),
          role: 'student',
          phone_number: phoneNumber.trim(),
          student_id_number: studentIdNumber.trim().toUpperCase(),
          year_of_study: yearOfStudy || null,
          profile_photo: null,
          photo_locked: false
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue anyway - trigger might have created it
      }

      // Step 3: Create notification for ALL dept heads
      const { data: deptHeads, error: deptHeadError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'departmentHead')

      console.log('Department heads found:', deptHeads)
      
      if (deptHeadError) {
        console.error('Error fetching dept heads:', deptHeadError)
      }

      if (deptHeads && deptHeads.length > 0) {
        const notifications = deptHeads.map(deptHead => ({
          user_id: deptHead.id,
          title: 'New Student Registration',
          message: `${fullName.trim()} has registered for the ETMS portal.`,
          type: 'General',
          reference_id: authData.user.id,
          reference_table: 'profiles',
          created_by: authData.user.id,
          is_read: false
        }))

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notifError) {
          console.error('Error creating notifications:', notifError)
        } else {
          console.log('✅ Notifications created successfully for', notifications.length, 'dept head(s)')
        }
      } else {
        console.warn('⚠️ No department heads found - notification not sent')
      }

      setSuccess('Registration successful! Welcome to ETMS!')

      // Auto-login by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      })

      if (signInError) {
        // If auto-login fails, redirect to login page
        setTimeout(() => {
          navigate('/login')
        }, 2000)
        return
      }

      // Refresh profile and redirect
      await refreshProfile()
      
      setTimeout(() => {
        navigate('/student/dashboard')
      }, 1000)

    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  } // Close handleSubmit registration function block

  return ( // Render the registration page layout structure split into cinematic left and right sections
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50 auth-page"> {/* Full viewport height flex container with light gradient background - auth-page class for CSS targeting */}

      {/* LEFT PANEL - Institution branding visual section */}
      <div className="hidden lg:flex w-2/5 bg-gradient-to-br from-bg-deep to-indigo-900 flex-col items-center justify-center p-12 border-r border-gold/20 shadow-2xl"> {/* Large screen-only navy sidebar panel with gradient */}
        <div className="flex items-center gap-6 mb-8"> {/* Flex container for logo and university text */}
          <Logo size="xl" /> {/* University Logo */}
          <div className="flex flex-col"> {/* Text container next to logo */}
            <span className="font-serif text-gold text-4xl font-bold tracking-wide">AMBO</span> {/* University name in gold */}
            <span className="font-sans text-white text-lg font-semibold tracking-wider">UNIVERSITY</span> {/* University text in white */}
          </div> {/* Close text container */}
        </div> {/* Close logo and text container */}
        <h1 className="font-serif text-white text-3xl font-bold text-center leading-tight mb-4"> {/* High-contrast display header */}
          Join the {/* Branding subtitle row */}
          <br /> {/* Line break */}
          ETMS Portal {/* Portal identity header */}
        </h1> {/* Close main title heading */}
        <div className="w-12 h-px bg-gold mb-4" /> {/* Decorative gold horizontal divider line */}
        <p className="text-gold/70 font-sans text-xs tracking-widest uppercase text-center"> {/* Tourism department subtitle */}
          Department of Tourism and Hotel Management {/* Department name label */}
        </p> {/* Close subtitle text */}
        <div className="mt-12 max-w-xs"> {/* Content box containing academic motivational quotes */}
          <p className="font-serif text-white/90 text-lg italic text-center leading-relaxed"> {/* Quotation paragraph */}
            Register to access educational trips, submit reports, and track your academic journey. {/* Inspiring message text */}
          </p> {/* Close quotation text */}
        </div> {/* Close quote panel container */}
      </div> {/* Close left university branding panel */}

      {/* RIGHT PANEL - Registration form section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-sm overflow-y-auto"> {/* Centered form wrapper panel with light background */}
        <div className="w-full max-w-md py-8 bg-white rounded-3xl shadow-2xl p-8 border border-slate-200"> {/* White card container with shadow and border */}
          <h2 className="font-serif text-bg-deep text-3xl font-bold mb-2"> {/* Registration page title in navy */}
            Create Account {/* Title heading */}
          </h2> {/* Close title element */}
          <p className="text-slate-600 font-sans text-sm mb-8"> {/* Descriptive subtitle caption */}
            Register as a student to access the portal {/* Explanatory instruction label */}
          </p> {/* Close subtitle text */}

          {/* DYNAMIC SUCCESS ALERTS PANEL */}
          {success && ( // Perform short-circuit checking to render success alert box when message string is present
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-300"> {/* Green backdrop warning alert capsule */}
              <p className="text-green-700 font-sans text-sm">{success}</p> {/* Display current string content of the success state */}
            </div> // Close success alert capsule
          )} {/* Finish conditional alert render */}

          {/* DYNAMIC ERROR ALERTS PANEL */}
          {error && ( // Perform short-circuit checking to render error alert box when string message is present
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300"> {/* Red backdrop warning alert capsule */}
              <p className="text-red-700 font-sans text-sm">{error}</p> {/* Display current string content of the error state */}
            </div> // Close error alert capsule
          )} {/* Finish conditional alert render */}

          {/* INTERACTIVE REGISTRATION FORM */}
          <form onSubmit={handleSubmit} className="space-y-4"> {/* Register submit handler on standard HTML form element */}
            <div> {/* Full name input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Full Name * {/* Visible full name label tag */}
              </label> {/* Close label element */}
              <input // Interactive text input node for full name
                type="text" // Standard text input format
                value={fullName} // Map input value to current fullName state
                onChange={(e) => setFullName(e.target.value)} // Update fullName state on keypress change events
                placeholder="Enter your full name" // Helpful input entry placeholder
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close input tag */}
            </div> {/* Close full name grouping */}

            <div> {/* Email address input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Email Address * {/* Visible email address label tag */}
              </label> {/* Close label element */}
              <input // Interactive email input node
                type="email" // Force email format validation
                value={email} // Map input value to current email state
                onChange={(e) => setEmail(e.target.value)} // Update email state on keypress change events
                placeholder="your@ambo.edu" // Helpful input entry placeholder
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close input tag */}
            </div> {/* Close email address grouping */}

            <div> {/* Phone number input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2 flex items-center gap-2"> {/* Input label typography */}
                <span>📱</span> Phone Number * {/* Visible phone number label tag with icon */}
              </label> {/* Close label element */}
              <input // Interactive phone number input node
                type="tel" // Telephone input type for mobile optimization
                value={phoneNumber} // Map input value to current phoneNumber state
                onChange={(e) => setPhoneNumber(e.target.value)} // Update phoneNumber state on change events
                placeholder="Enter your phone number" // Helpful input entry placeholder
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close input tag */}
            </div> {/* Close phone number grouping */}

            <div> {/* Student ID Number input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Student ID Number * {/* Visible ID number label tag */}
              </label> {/* Close label element */}
              <input // Interactive student ID number input node
                type="text" // Standard text formatting
                value={studentIdNumber} // Map input value to current studentIdNumber state
                onChange={(e) => setStudentIdNumber(e.target.value)} // Update studentIdNumber state on change events
                placeholder="e.g. AMB2021001" // Helpful input entry placeholder
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close input tag */}
            </div> {/* Close Student ID grouping */}

            <div> {/* Year of study selection dropdown group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Year of Study {/* Visible study year label tag */}
              </label> {/* Close label element */}
              <select // Interactive HTML select options dropdown node
                value={yearOfStudy} // Map active selection to current yearOfStudy state
                onChange={(e) => setYearOfStudy(e.target.value)} // Update yearOfStudy state on change selection events
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled select box classes
              > {/* Open interactive options list */}
                <option value="" className="bg-white text-slate-900">Select year</option> {/* Placeholder default disabled select option */}
                <option value="1" className="bg-white text-slate-900">Year 1</option> {/* Selection option for Year One students */}
                <option value="2" className="bg-white text-slate-900">Year 2</option> {/* Selection option for Year Two students */}
                <option value="3" className="bg-white text-slate-900">Year 3</option> {/* Selection option for Year Three students */}
                <option value="4" className="bg-white text-slate-900">Year 4</option> {/* Selection option for Year Four students */}
                <option value="5" className="bg-white text-slate-900">Year 5</option> {/* Selection option for Year Five students */}
                <option value="6" className="bg-white text-slate-900">Year 6</option> {/* Selection option for Year Six students */}
              </select> {/* Close select element */}
            </div> {/* Close year of study selection group */}

            <div> {/* Password parameter input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Password * {/* Visible password label tag */}
              </label> {/* Close label element */}
              <input // Interactive password entry input node
                type="password" // Obscure password characters for safety
                value={password} // Map input value to current password state
                onChange={(e) => setPassword(e.target.value)} // Update password state on keypress change events
                placeholder="Minimum 8 characters" // Entry instruction placeholder description
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close input tag */}
            </div> {/* Close password input grouping */}

            <div> {/* Password confirmation parameter input group */}
              <label className="block text-slate-700 font-sans text-xs tracking-widest uppercase mb-2"> {/* Input label typography */}
                Confirm Password * {/* Visible confirm password label tag */}
              </label> {/* Close label element */}
              <input // Interactive confirm password entry input node
                type="password" // Obscure password characters for safety
                value={confirmPassword} // Map input value to current confirmPassword state
                onChange={(e) => setConfirmPassword(e.target.value)} // Update confirmPassword state on keypress change events
                placeholder="Repeat your password" // Entry matching verification placeholder description
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-sans text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 focus:bg-white transition-all" // Styled Tailwind input classes
              /> {/* Close input tag */}
            </div> {/* Close confirm password grouping */}

            <button // Primary sign up registration form trigger button
              type="submit" // Set type as submit to handle keypress Enter submissions
              disabled={loading} // Disable user interactions while loading state is true
              className="w-full bg-gradient-to-r from-gold to-gold-light text-charcoal font-sans text-sm font-semibold tracking-widest uppercase py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 shadow-md" // Styled golden brand action button
            > {/* Open button tag */}
              {loading ? 'Creating Account...' : 'Create Account'} {/* Show dynamic button text matching pending network requests */}
            </button> {/* Close form trigger button */}
          </form> {/* Close input form element */}

          {/* NAVIGATIONAL SIGN-IN REDIRECT CARD */}
          <p className="text-slate-600 font-sans text-sm text-center mt-6"> {/* Centered redirection text */}
            Already have an account?{' '} {/* Prompt label statement */}
            <Link to="/login" className="text-gold hover:text-gold-light transition-colors font-semibold"> {/* Navigation Link to login route */}
              Sign in here {/* Call to action link text */}
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
} // Close RegisterPage functional component block
