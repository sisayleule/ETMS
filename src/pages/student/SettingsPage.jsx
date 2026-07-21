// =====================================================================================================================
// STUDENT SETTINGS PAGE - Complete settings management with profile, account, notifications, appearance, and more
// =====================================================================================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {  // Import all settings service functions
  updateProfileSettings, uploadProfilePhoto, removeProfilePhoto, changePassword, updateEmail, getAccountInfo, // Added updateEmail for changing user email address
  getNotificationPreferences, updateNotificationPreferences, getAppearancePreferences, 
  updateAppearancePreferences, getLanguagePreference, updateLanguagePreference,
  getEmergencyContact, updateEmergencyContact, getMedicalInfo, updateMedicalInfo
} from '../../lib/settingsService' // Import from settings service library

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Profile Settings
  const [profileData, setProfileData] = useState({ fullName: '', phoneNumber: '', gender: '', dateOfBirth: '', bio: '' })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  // Account Settings
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }) // State for password change form fields
  const [emailData, setEmailData] = useState({ newEmail: '', currentPasswordForEmail: '' }) // State for email change form fields - separate from password change
  const [currentEmail, setCurrentEmail] = useState('') // State to display current email address from auth
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false }) // State for toggling password visibility
  const [accountInfo, setAccountInfo] = useState(null) // State for account information display

  // Notification Settings
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true, system_notifications: true, trip_approval_notifications: true,
    complaint_notifications: true, report_notifications: true, reminder_notifications: true,
    announcement_notifications: true
  })

  // Appearance Settings
  const [appearancePrefs, setAppearancePrefs] = useState({
    theme: 'light', accent_color: '#8CA5FF', font_size: 'medium', compact_mode: false, reduce_animations: false
  })

  // Language Settings
  const [language, setLanguage] = useState('en')

  // Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState({ contactName: '', contactPhone: '', relationship: '' })

  // Medical Information
  const [medicalInfo, setMedicalInfo] = useState({ bloodType: '', allergies: '', medicalNotes: '' })

  useEffect(() => {
    if (profile && user) {
      loadAllSettings()
    }
  }, [profile?.profile_photo, profile?.full_name, user]) // Watch for profile changes

  const loadAllSettings = async () => { // Define async function to load all user settings from backend
    try { // Begin try block for error handling
      setProfileData({ fullName: profile.full_name || '', phoneNumber: profile.phone_number || '', gender: profile.gender || '', dateOfBirth: profile.date_of_birth || '', bio: profile.bio || '' }) // Load profile data from context
      setPhotoPreview(profile.profile_photo) // Set profile photo preview from context
      setCurrentEmail(user.email) // Set current email from authenticated user object
      const { data: accInfo } = await getAccountInfo(user.id) // Fetch account info from backend
      setAccountInfo(accInfo) // Store account info in state
      const { data: notifPrefs } = await getNotificationPreferences(user.id) // Fetch notification preferences
      if (notifPrefs) setNotificationPrefs(notifPrefs) // Update state if preferences exist
      const { data: appPrefs } = await getAppearancePreferences(user.id) // Fetch appearance preferences
      if (appPrefs) setAppearancePrefs(appPrefs) // Update state if preferences exist
      const { data: langPref } = await getLanguagePreference(user.id) // Fetch language preference
      if (langPref) setLanguage(langPref.language) // Update state if preference exists
      const { data: contact } = await getEmergencyContact(user.id) // Fetch emergency contact
      if (contact) setEmergencyContact({ contactName: contact.contact_name || '', contactPhone: contact.contact_phone || '', relationship: contact.relationship || '' }) // Update state if contact exists
      const { data: medInfo } = await getMedicalInfo(user.id) // Fetch medical information
      if (medInfo) setMedicalInfo({ bloodType: medInfo.blood_type || '', allergies: medInfo.allergies || '', medicalNotes: medInfo.medical_notes || '' }) // Update state if medical info exists
    } catch (error) { // Catch any errors during loading
      console.error('Error loading settings:', error) // Log error to console
    } // End try-catch block
  } // End loadAllSettings function

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Photo size must be less than 5MB')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      if (photoFile) {
        const { data, error: photoError } = await uploadProfilePhoto(user.id, photoFile)
        if (photoError) throw photoError
        // Update local preview with the saved photo URL
        if (data?.profile_photo) {
          setPhotoPreview(data.profile_photo)
        }
      }
      const { error } = await updateProfileSettings(user.id, profileData)
      if (error) throw error
      await refreshProfile()
      showMessage('success', 'Profile updated successfully!')
      setPhotoFile(null)
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Remove profile photo?')) return
    setLoading(true)
    try {
      const { error } = await removeProfilePhoto(user.id)
      if (error) throw error
      setPhotoPreview(null)
      setPhotoFile(null)
      await refreshProfile()
      showMessage('success', 'Profile photo removed!')
    } catch (error) {
      showMessage('error', error.message || 'Failed to remove photo')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => { // Define async function to handle password change
    if (passwordData.newPassword !== passwordData.confirmPassword) { // Check if new passwords match
      showMessage('error', 'New passwords do not match') // Show error if passwords don't match
      return // Exit function without proceeding
    } // End password match validation
    if (passwordData.newPassword.length < 6) { // Check if new password meets minimum length requirement
      showMessage('error', 'Password must be at least 6 characters') // Show error if password too short
      return // Exit function without proceeding
    } // End password length validation
    setLoading(true) // Set loading state to show processing indicator
    try { // Begin try block for error handling
      const { error } = await changePassword(passwordData.currentPassword, passwordData.newPassword) // Call changePassword service function
      if (error) throw error // Throw error if password change failed
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }) // Clear password form fields on success
      showMessage('success', 'Password changed successfully!') // Show success message
    } catch (error) { // Catch any errors during password change
      showMessage('error', error.message || 'Failed to change password') // Show error message
    } finally { // Always execute regardless of success or failure
      setLoading(false) // Reset loading state
    } // End try-catch-finally block
  } // End handleChangePassword function

  const handleChangeEmail = async () => { // Define async function to handle email change
    // Validate new email format using basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Regular expression for basic email validation
    if (!emailRegex.test(emailData.newEmail)) { // Check if new email matches email format
      showMessage('error', 'Please enter a valid email address') // Show error if email format invalid
      return // Exit function without proceeding
    } // End email format validation
    if (emailData.newEmail === currentEmail) { // Check if new email is same as current email
      showMessage('error', 'New email must be different from current email') // Show error if email unchanged
      return // Exit function without proceeding
    } // End email uniqueness validation
    if (!emailData.currentPasswordForEmail) { // Check if current password was provided for verification
      showMessage('error', 'Current password is required to change email') // Show error if password missing
      return // Exit function without proceeding
    } // End password requirement validation
    setLoading(true) // Set loading state to show processing indicator
    try { // Begin try block for error handling
      const { error } = await updateEmail(emailData.currentPasswordForEmail, emailData.newEmail) // Call updateEmail service function with password and new email
      if (error) throw error // Throw error if email change failed
      setCurrentEmail(emailData.newEmail) // Update displayed current email with new email on success
      setEmailData({ newEmail: '', currentPasswordForEmail: '' }) // Clear email form fields on success
      showMessage('success', 'Email updated successfully!') // Show success message
    } catch (error) { // Catch any errors during email change
      showMessage('error', error.message || 'Failed to update email') // Show error message
    } finally { // Always execute regardless of success or failure
      setLoading(false) // Reset loading state
    } // End try-catch-finally block
  } // End handleChangeEmail function

  const handleSaveNotifications = async () => {
    setLoading(true)
    try {
      const { error } = await updateNotificationPreferences(user.id, notificationPrefs)
      if (error) throw error
      showMessage('success', 'Notification preferences saved!')
    } catch (error) {
      showMessage('error', error.message || 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAppearance = async () => {
    setLoading(true)
    try {
      const { error } = await updateAppearancePreferences(user.id, appearancePrefs)
      if (error) throw error
      showMessage('success', 'Appearance preferences saved!')
    } catch (error) {
      showMessage('error', error.message || 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLanguage = async () => {
    setLoading(true)
    try {
      const { error } = await updateLanguagePreference(user.id, language)
      if (error) throw error
      showMessage('success', 'Language preference saved!')
    } catch (error) {
      showMessage('error', error.message || 'Failed to save language')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmergencyContact = async () => {
    if (!emergencyContact.contactName || !emergencyContact.contactPhone) {
      showMessage('error', 'Please fill in all emergency contact fields')
      return
    }
    setLoading(true)
    try {
      const { error } = await updateEmergencyContact(user.id, emergencyContact)
      if (error) throw error
      showMessage('success', 'Emergency contact saved!')
    } catch (error) {
      showMessage('error', error.message || 'Failed to save contact')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMedicalInfo = async () => {
    setLoading(true)
    try {
      const { error } = await updateMedicalInfo(user.id, medicalInfo)
      if (error) throw error
      showMessage('success', 'Medical information saved!')
    } catch (error) {
      showMessage('error', error.message || 'Failed to save medical info')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'account', label: 'Account', icon: '🔐' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'language', label: 'Language', icon: '🌐' },
    { id: 'emergency', label: 'Emergency Contact', icon: '🚨' },
    { id: 'medical', label: 'Medical Info', icon: '⚕️' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">⚙️ Settings</h1>
          <p className="text-[#4A5F7F]">Manage your account preferences and personal information</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#C5D5FF] p-4 sticky top-6">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white font-bold shadow-md'
                        : 'text-[#4A5F7F] hover:bg-[#F5F8FF]'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#C5D5FF] p-6">

              {/* PROFILE SETTINGS TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Profile Settings</h2>

                  {/* Profile Photo */}
                  <div className="flex flex-col items-center gap-4 p-6 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF]">
                    <div className="relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-[#8CA5FF] shadow-lg" />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#8CA5FF] to-[#7090E5] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                          {profile?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <label className="px-4 py-2 bg-[#8CA5FF] text-white rounded-lg font-semibold cursor-pointer hover:bg-[#7090E5] transition-all shadow-md">
                        Upload Photo
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                      {photoPreview && (
                        <button onClick={handleRemovePhoto} className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md">
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#4A5F7F]">Max size: 5MB. Formats: JPG, PNG, GIF</p>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Full Name</label>
                      <input type="text" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Phone Number</label>
                      <input type="tel" value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Gender</label>
                      <select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Date of Birth</label>
                      <input type="date" value={profileData.dateOfBirth} onChange={e => setProfileData({...profileData, dateOfBirth: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Student ID</label>
                      <input type="text" value={profile?.student_id_number || ''} disabled className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Bio</label>
                      <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows="4" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" placeholder="Tell us about yourself..." />
                    </div>
                  </div>

                  <button onClick={handleSaveProfile} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              )}

              {/* ACCOUNT SETTINGS TAB */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Account Settings</h2>

                  {/* Account Info */}
                  {accountInfo && (
                    <div className="p-6 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF] space-y-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-[#1E3A5F]">Email:</span>
                        <span className="text-[#4A5F7F]">{accountInfo.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-[#1E3A5F]">Role:</span>
                        <span className="text-[#4A5F7F] capitalize">{accountInfo.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-[#1E3A5F]">Account Created:</span>
                        <span className="text-[#4A5F7F]">{new Date(accountInfo.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-[#1E3A5F]">Last Login:</span>
                        <span className="text-[#4A5F7F]">{new Date(accountInfo.last_login).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Change Password */}
                  <div className="space-y-4"> {/* Container for password change form with spacing */}
                    <h3 className="text-xl font-bold text-[#1E3A5F]">Change Password</h3> {/* Password section heading */}
                    <div className="relative"> {/* Relative positioning for password toggle button */}
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Current Password</label> {/* Label for current password field */}
                      <input type={showPasswords.current ? 'text' : 'password'} value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full px-4 py-3 pr-12 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /> {/* Input for current password with toggle visibility */}
                      <button onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-4 top-11 text-[#4A5F7F]">{showPasswords.current ? '🙈' : '👁️'}</button> {/* Toggle button to show/hide password */}
                    </div> {/* End relative container */}
                    <div className="relative"> {/* Relative positioning for password toggle button */}
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">New Password</label> {/* Label for new password field */}
                      <input type={showPasswords.new ? 'text' : 'password'} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full px-4 py-3 pr-12 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /> {/* Input for new password with toggle visibility */}
                      <button onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-4 top-11 text-[#4A5F7F]">{showPasswords.new ? '🙈' : '👁️'}</button> {/* Toggle button to show/hide password */}
                    </div> {/* End relative container */}
                    <div className="relative"> {/* Relative positioning for password toggle button */}
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Confirm New Password</label> {/* Label for confirm password field */}
                      <input type={showPasswords.confirm ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full px-4 py-3 pr-12 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /> {/* Input for confirm password with toggle visibility */}
                      <button onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-4 top-11 text-[#4A5F7F]">{showPasswords.confirm ? '🙈' : '👁️'}</button> {/* Toggle button to show/hide password */}
                    </div> {/* End relative container */}
                    {passwordData.newPassword && ( // Conditional render password strength indicator if new password entered
                      <div className="text-sm"> {/* Container for password requirements */}
                        <p className={`${passwordData.newPassword.length >= 6 ? 'text-green-600' : 'text-red-600'}`}> {/* Color based on password length requirement */}
                          {passwordData.newPassword.length >= 6 ? '✓' : '✗'} At least 6 characters {/* Show checkmark or X with requirement text */}
                        </p> {/* End requirement text */}
                      </div> // End requirements container
                    )} {/* End conditional password requirements */}
                    <button onClick={handleChangePassword} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50"> {/* Change password submit button with gradient background */}
                      {loading ? 'Changing...' : 'Change Password'} {/* Show loading text or default text */}
                    </button> {/* End change password button */}
                  </div> {/* End password change form */}

                  {/* Change Email */}
                  <div className="space-y-4"> {/* Container for email change form with spacing, matching password section style */}
                    <h3 className="text-xl font-bold text-[#1E3A5F]">Change Email</h3> {/* Email section heading matching password section heading style */}
                    <div> {/* Container for current email display */}
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Current Email</label> {/* Label for current email matching password label style */}
                      <input type="email" value={currentEmail} disabled className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600" /> {/* Read-only input showing current email address from auth */}
                    </div> {/* End current email container */}
                    <div> {/* Container for new email input */}
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">New Email</label> {/* Label for new email field matching password label style */}
                      <input type="email" value={emailData.newEmail} onChange={e => setEmailData({...emailData, newEmail: e.target.value})} placeholder="Enter new email address" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /> {/* Input for new email with placeholder and matching border style */}
                    </div> {/* End new email container */}
                    <div> {/* Container for current password input for email change */}
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Current Password</label> {/* Label for password verification matching password label style */}
                      <input type="password" value={emailData.currentPasswordForEmail} onChange={e => setEmailData({...emailData, currentPasswordForEmail: e.target.value})} placeholder="Enter current password to confirm" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /> {/* Input for current password verification, separate from password change fields */}
                      <p className="text-xs text-[#4A5F7F] mt-1">Required for security verification</p> {/* Help text explaining password requirement */}
                    </div> {/* End password verification container */}
                    <button onClick={handleChangeEmail} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50"> {/* Change email submit button matching password button style */}
                      {loading ? 'Updating...' : 'Change Email'} {/* Show loading text or default text */}
                    </button> {/* End change email button */}
                  </div> {/* End email change form */}
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Notification Preferences</h2>
                  <div className="space-y-4">
                    {Object.entries({
                      email_notifications: 'Email Notifications',
                      system_notifications: 'System Notifications',
                      trip_approval_notifications: 'Trip Approval Notifications',
                      complaint_notifications: 'Complaint Updates',
                      report_notifications: 'Report Feedback',
                      reminder_notifications: 'Reminder Notifications',
                      announcement_notifications: 'New Announcements'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF]">
                        <span className="font-semibold text-[#1E3A5F]">{label}</span>
                        <button onClick={() => setNotificationPrefs({...notificationPrefs, [key]: !notificationPrefs[key]})} className={`relative w-14 h-8 rounded-full transition-colors ${notificationPrefs[key] ? 'bg-[#8CA5FF]' : 'bg-gray-300'}`}>
                          <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${notificationPrefs[key] ? 'transform translate-x-6' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveNotifications} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Notification Preferences'}
                  </button>
                </div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Appearance Preferences</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-3">Theme</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['light', 'dark'].map(theme => (
                          <button key={theme} onClick={() => setAppearancePrefs({...appearancePrefs, theme})} className={`p-4 rounded-xl border-2 font-semibold capitalize transition-all ${appearancePrefs.theme === theme ? 'border-[#8CA5FF] bg-[#F5F8FF] text-[#1E3A5F]' : 'border-[#C5D5FF] text-[#4A5F7F]'}`}>
                            {theme === 'light' ? '☀️' : '🌙'} {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-3">Font Size</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['small', 'medium', 'large'].map(size => (
                          <button key={size} onClick={() => setAppearancePrefs({...appearancePrefs, font_size: size})} className={`p-4 rounded-xl border-2 font-semibold capitalize transition-all ${appearancePrefs.font_size === size ? 'border-[#8CA5FF] bg-[#F5F8FF] text-[#1E3A5F]' : 'border-[#C5D5FF] text-[#4A5F7F]'}`}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[{key: 'compact_mode', label: 'Compact Mode'}, {key: 'reduce_animations', label: 'Reduce Animations'}].map(({key, label}) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF]">
                          <span className="font-semibold text-[#1E3A5F]">{label}</span>
                          <button onClick={() => setAppearancePrefs({...appearancePrefs, [key]: !appearancePrefs[key]})} className={`relative w-14 h-8 rounded-full transition-colors ${appearancePrefs[key] ? 'bg-[#8CA5FF]' : 'bg-gray-300'}`}>
                            <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${appearancePrefs[key] ? 'transform translate-x-6' : ''}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSaveAppearance} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Appearance Preferences'}
                  </button>
                </div>
              )}

              {/* LANGUAGE TAB */}
              {activeTab === 'language' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Language Preference</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[{code: 'en', name: 'English', flag: '🇬🇧'}, {code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹'}, {code: 'am', name: 'አማርኛ (Amharic)', flag: '🇪🇹'}].map(lang => (
                      <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`p-6 rounded-xl border-2 font-semibold transition-all ${language === lang.code ? 'border-[#8CA5FF] bg-[#F5F8FF] text-[#1E3A5F]' : 'border-[#C5D5FF] text-[#4A5F7F]'}`}>
                        <div className="text-4xl mb-2">{lang.flag}</div>
                        <div>{lang.name}</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={handleSaveLanguage} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Language Preference'}
                  </button>
                </div>
              )}

              {/* EMERGENCY CONTACT TAB */}
              {activeTab === 'emergency' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Emergency Contact</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Contact Name</label>
                      <input type="text" value={emergencyContact.contactName} onChange={e => setEmergencyContact({...emergencyContact, contactName: e.target.value})} placeholder="Full name of emergency contact" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Contact Phone</label>
                      <input type="tel" value={emergencyContact.contactPhone} onChange={e => setEmergencyContact({...emergencyContact, contactPhone: e.target.value})} placeholder="+251 911 234567" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Relationship</label>
                      <select value={emergencyContact.relationship} onChange={e => setEmergencyContact({...emergencyContact, relationship: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]">
                        <option value="">Select Relationship</option>
                        <option value="parent">Parent</option>
                        <option value="guardian">Guardian</option>
                        <option value="sibling">Sibling</option>
                        <option value="spouse">Spouse</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleSaveEmergencyContact} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Emergency Contact'}
                  </button>
                </div>
              )}

              {/* MEDICAL INFO TAB */}
              {activeTab === 'medical' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Medical Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Blood Type</label>
                      <select value={medicalInfo.bloodType} onChange={e => setMedicalInfo({...medicalInfo, bloodType: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]">
                        <option value="">Select Blood Type</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Allergies</label>
                      <textarea value={medicalInfo.allergies} onChange={e => setMedicalInfo({...medicalInfo, allergies: e.target.value})} rows="3" placeholder="List any allergies (food, medication, environmental)" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Medical Notes</label>
                      <textarea value={medicalInfo.medicalNotes} onChange={e => setMedicalInfo({...medicalInfo, medicalNotes: e.target.value})} rows="4" placeholder="Any other medical conditions, medications, or important health information" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                    </div>
                  </div>
                  <button onClick={handleSaveMedicalInfo} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Medical Information'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
