import { useState, useEffect } from 'react' // Import React hooks
import { useParams, useNavigate } from 'react-router-dom' // Import routing hooks
import { fetchStudentDetail } from '../../lib/depthead/applicantService' // Import service function

function StudentDetailPage() { // Define StudentDetailPage component
  const { id } = useParams() // Extract student ID from URL parameters
  const navigate = useNavigate() // Initialize navigate hook for routing
  const [data, setData] = useState(null) // State to hold student data
  const [loading, setLoading] = useState(true) // State to track loading status

  useEffect(() => { // Effect hook to load student data on mount
    loadStudent() // Call load function
  }, [id]) // Re-run if ID changes

  async function loadStudent() { // Define async function to fetch student details
    setLoading(true) // Set loading to true
    const result = await fetchStudentDetail(id) // Fetch student data from service
    setData(result) // Store result in state
    setLoading(false) // Set loading to false
  } // End loadStudent function

  if (loading) { // Show loading state
    return ( // Return loading UI
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center"> {/* Loading container with gradient background */}
        <div className="text-center"> {/* Center content */}
          <div className="w-16 h-16 border-4 border-[#8CA5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" /> {/* Spinning loader */}
          <p className="text-[#6B7F9F] font-sans text-sm font-medium">Loading student profile...</p> {/* Loading text */}
        </div> {/* Close center content */}
      </div> // Close loading container
    ) // Close return
  } // End loading check

  if (!data?.profile) { // Check if profile data doesn't exist
    return ( // Return not found UI
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center"> {/* Not found container */}
        <div className="text-center"> {/* Center content */}
          <div className="w-20 h-20 rounded-full bg-[#F0F4FF] flex items-center justify-center mb-4 mx-auto"> {/* Icon wrapper */}
            <span className="text-4xl">👤</span> {/* User icon */}
          </div> {/* Close icon wrapper */}
          <p className="text-[#6B7F9F] font-sans text-base">Student not found</p> {/* Not found message */}
        </div> {/* Close center content */}
      </div> // Close not found container
    ) // Close return
  } // End not found check

  const { profile } = data // Destructure profile from data

  return ( // Return main UI
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF]"> {/* Main container with gradient background */}
      <div className="max-w-5xl mx-auto p-8 md:p-12"> {/* Content wrapper with max width and padding */}
        
        {/* Back Button */}
        <button // Back navigation button
          onClick={() => navigate('/depthead/applicants')} // Navigate to applicants page
          className="group flex items-center gap-2 text-[#1E3A5F] hover:text-[#8CA5FF] font-sans text-sm font-semibold mb-8 transition-colors" // Button styling
        > {/* Button content */}
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* Back arrow icon */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /> {/* Arrow path */}
          </svg> {/* Close icon */}
          Back to Applicants {/* Button text */}
        </button> {/* Close button */}

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-[#E5EDFF] overflow-hidden"> {/* Card container */}
          
          {/* Header Section with Gradient Background */}
          <div className="bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] p-8 relative overflow-hidden"> {/* Header with gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" /> {/* Decorative circle */}
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" /> {/* Decorative circle */}
            
            <div className="relative flex items-center gap-6"> {/* Profile header content */}
              {/* Profile Photo */}
              {profile.profile_photo ? ( // Check if profile photo exists
                <img // Profile image
                  src={profile.profile_photo} // Image source
                  alt={profile.full_name} // Alt text
                  className="h-32 w-32 rounded-2xl object-cover border-4 border-white shadow-lg" // Image styling
                /> // Close image
              ) : ( // No photo fallback
                <div className="h-32 w-32 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white flex items-center justify-center shadow-lg"> {/* Avatar placeholder */}
                  <span className="text-white font-serif text-5xl font-bold"> {/* Initial letter */}
                    {profile.full_name?.charAt(0)?.toUpperCase() || '?'} {/* Display first letter */}
                  </span> {/* Close initial */}
                </div> // Close placeholder
              )} {/* Close photo check */}
              
              {/* Name and ID */}
              <div className="flex-1"> {/* Name section */}
                <h1 className="text-white font-serif text-4xl font-bold mb-2 leading-tight"> {/* Student name */}
                  {profile.full_name} {/* Display full name */}
                </h1> {/* Close name */}
                <p className="text-white/90 font-sans text-lg font-medium"> {/* Student ID */}
                  {profile.student_id_number} {/* Display student ID */}
                </p> {/* Close ID */}
                {profile.is_banned && ( // Check if student is banned
                  <div className="mt-3 inline-block"> {/* Ban badge container */}
                    <span className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-sans font-bold shadow-lg"> {/* Ban badge */}
                      🚫 Account Banned {/* Badge text */}
                    </span> {/* Close badge */}
                  </div> // Close badge container
                )} {/* Close ban check */}
              </div> {/* Close name section */}
            </div> {/* Close header content */}
          </div> {/* Close header section */}

          {/* Profile Information Grid */}
          <div className="p-8"> {/* Content padding */}
            
            {profile.is_banned && profile.ban_reason && ( // Show ban reason if exists
              <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 rounded-2xl"> {/* Ban reason alert */}
                <p className="text-red-800 font-sans text-sm font-semibold mb-1">Ban Reason:</p> {/* Label */}
                <p className="text-red-700 font-sans text-sm">{profile.ban_reason}</p> {/* Reason text */}
              </div> // Close alert
            )} {/* Close ban reason check */}

            <h2 className="text-[#1E3A5F] font-serif text-2xl font-bold mb-6">Student Information</h2> {/* Section title */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Two column grid */}
              
              {/* Email */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Email Address</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold break-all">{profile.email || 'Not provided'}</p> {/* Value */}
              </div> {/* Close card */}
              
              {/* Phone */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Phone Number</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">{profile.phone_number || 'Not provided'}</p> {/* Value */}
              </div> {/* Close card */}
              
              {/* Department */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Department</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">{profile.department || 'Not provided'}</p> {/* Value */}
              </div> {/* Close card */}
              
              {/* Year of Study */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Year of Study</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">{profile.year_of_study || 'Not provided'}</p> {/* Value */}
              </div> {/* Close card */}
              
              {/* Gender */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Gender</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">{profile.gender || 'Not provided'}</p> {/* Value */}
              </div> {/* Close card */}
              
              {/* Date of Birth */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Date of Birth</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">
                  {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'} {/* Formatted date */}
                </p> {/* Close value */}
              </div> {/* Close card */}
              
              {/* Dietary Requirements */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Dietary Requirements</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">{profile.dietary_requirements || 'None'}</p> {/* Value */}
              </div> {/* Close card */}
              
              {/* Registration Date */}
              <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Info card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-2">Registered On</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base font-semibold">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} {/* Formatted date */}
                </p> {/* Close value */}
              </div> {/* Close card */}
              
            </div> {/* Close grid */}

            {/* Bio Section */}
            {profile.bio && ( // Show bio if exists
              <div className="mt-8 p-6 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-2xl border-2 border-[#E5EDFF]"> {/* Bio card */}
                <p className="text-[#8B9FB5] font-sans text-xs uppercase tracking-wider font-semibold mb-3">Bio</p> {/* Label */}
                <p className="text-[#1E3A5F] font-sans text-base leading-relaxed">{profile.bio}</p> {/* Bio text */}
              </div> // Close card
            )} {/* Close bio check */}
            
          </div> {/* Close content padding */}
        </div> {/* Close profile card */}
        
      </div> {/* Close content wrapper */}
    </div> // Close main container
  ) // Close return
} // End StudentDetailPage component

export default StudentDetailPage // Export component
