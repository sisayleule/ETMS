// =====================================================================================================================
// DEPARTMENT HEAD SETTINGS PAGE - Complete settings with dept-specific options
// =====================================================================================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {  // Import all settings service functions
  updateProfileSettings, uploadProfilePhoto, removeProfilePhoto, changePassword, updateEmail, getAccountInfo, // Added updateEmail for changing user email address
  getNotificationPreferences, updateNotificationPreferences, getAppearancePreferences, 
  updateAppearancePreferences, getLanguagePreference, updateLanguagePreference,
  getDeptHeadSettings, updateDeptHeadSettings // Department head specific settings
} from '../../lib/settingsService' // Import from settings service library

export default function DeptHeadSettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [profileData, setProfileData] = useState({ fullName: '', phoneNumber: '', gender: '', dateOfBirth: '', bio: '' }) // State for profile form fields
  const [photoPreview, setPhotoPreview] = useState(null) // State for profile photo preview
  const [photoFile, setPhotoFile] = useState(null) // State for selected photo file
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }) // State for password change form fields
  const [emailData, setEmailData] = useState({ newEmail: '', currentPasswordForEmail: '' }) // State for email change form fields - separate from password change
  const [currentEmail, setCurrentEmail] = useState('') // State to display current email address from auth
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false }) // State for toggling password visibility
  const [accountInfo, setAccountInfo] = useState(null) // State for account information display
  const [notificationPrefs, setNotificationPrefs] = useState({ email_notifications: true, system_notifications: true, trip_approval_notifications: true, complaint_notifications: true, report_notifications: true, reminder_notifications: true, announcement_notifications: true })
  const [appearancePrefs, setAppearancePrefs] = useState({ theme: 'light', accent_color: '#8CA5FF', font_size: 'medium', compact_mode: false, reduce_animations: false })
  const [language, setLanguage] = useState('en')
  const [deptSettings, setDeptSettings] = useState({
    department_name: '', office_phone: '', office_email: '', office_location: '',
    auto_approval_enabled: false, approval_deadline_days: 7, default_registration_deadline_days: 14,
    default_max_students: 50, default_trip_status: 'draft'
  })

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
      if (langPref) setLanguage(langPref.language)
      const { data: deptData } = await getDeptHeadSettings(user.id)
      if (deptData) setDeptSettings(deptData)
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const showMessage = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage({ type: '', text: '' }), 5000) }
  
  const handlePhotoChange = (e) => { 
    const file = e.target.files[0]; 
    if (file) { 
      if (file.size > 5 * 1024 * 1024) { 
        showMessage('error', 'Photo size must be less than 5MB'); 
        return 
      } 
      setPhotoFile(file); 
      setPhotoPreview(URL.createObjectURL(file)) 
    } 
  }
  
  const handleSaveProfile = async () => { 
    setLoading(true); 
    try { 
      if (photoFile) { 
        const { data, error: photoError } = await uploadProfilePhoto(user.id, photoFile); 
        if (photoError) throw photoError;
        // Update local preview with the saved photo URL
        if (data?.profile_photo) {
          setPhotoPreview(data.profile_photo)
        }
      } 
      const { error } = await updateProfileSettings(user.id, profileData); 
      if (error) throw error; 
      await refreshProfile(); 
      showMessage('success', 'Profile updated successfully!'); 
      setPhotoFile(null) 
    } catch (error) { 
      showMessage('error', error.message || 'Failed to update profile') 
    } finally { 
      setLoading(false) 
    } 
  }
  
  const handleRemovePhoto = async () => { 
    if (!confirm('Remove profile photo?')) return; 
    setLoading(true); 
    try { 
      const { error } = await removeProfilePhoto(user.id); 
      if (error) throw error; 
      setPhotoPreview(null); 
      setPhotoFile(null); 
      await refreshProfile(); 
      showMessage('success', 'Profile photo removed!') 
    } catch (error) { 
      showMessage('error', error.message || 'Failed to remove photo') 
    } finally { 
      setLoading(false) 
    } 
  }
  const handleChangePassword = async () => { if (passwordData.newPassword !== passwordData.confirmPassword) { showMessage('error', 'New passwords do not match'); return } if (passwordData.newPassword.length < 6) { showMessage('error', 'Password must be at least 6 characters'); return } setLoading(true); try { const { error } = await changePassword(passwordData.currentPassword, passwordData.newPassword); if (error) throw error; setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); showMessage('success', 'Password changed successfully!') } catch (error) { showMessage('error', error.message || 'Failed to change password') } finally { setLoading(false) } }
  const handleChangeEmail = async () => { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(emailData.newEmail)) { showMessage('error', 'Please enter a valid email address'); return } if (emailData.newEmail === currentEmail) { showMessage('error', 'New email must be different from current email'); return } if (!emailData.currentPasswordForEmail) { showMessage('error', 'Current password is required to change email'); return } setLoading(true); try { const { error } = await updateEmail(emailData.currentPasswordForEmail, emailData.newEmail); if (error) throw error; setCurrentEmail(emailData.newEmail); setEmailData({ newEmail: '', currentPasswordForEmail: '' }); showMessage('success', 'Email updated successfully!') } catch (error) { showMessage('error', error.message || 'Failed to update email') } finally { setLoading(false) } } // Added handleChangeEmail function for department head email changes matching student implementation
  const handleSaveNotifications = async () => { setLoading(true); try { const { error } = await updateNotificationPreferences(user.id, notificationPrefs); if (error) throw error; showMessage('success', 'Notification preferences saved!') } catch (error) { showMessage('error', error.message || 'Failed to save preferences') } finally { setLoading(false) } }
  const handleSaveAppearance = async () => { setLoading(true); try { const { error } = await updateAppearancePreferences(user.id, appearancePrefs); if (error) throw error; showMessage('success', 'Appearance preferences saved!') } catch (error) { showMessage('error', error.message || 'Failed to save preferences') } finally { setLoading(false) } }
  const handleSaveLanguage = async () => { setLoading(true); try { const { error } = await updateLanguagePreference(user.id, language); if (error) throw error; showMessage('success', 'Language preference saved!') } catch (error) { showMessage('error', error.message || 'Failed to save language') } finally { setLoading(false) } }
  const handleSaveDeptSettings = async () => { setLoading(true); try { const { error } = await updateDeptHeadSettings(user.id, deptSettings); if (error) throw error; showMessage('success', 'Department settings saved!') } catch (error) { showMessage('error', error.message || 'Failed to save settings') } finally { setLoading(false) } }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'account', label: 'Account', icon: '🔐' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'language', label: 'Language', icon: '🌐' },
    { id: 'department', label: 'Department', icon: '🏛️' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">⚙️ Settings</h1>
          <p className="text-[#4A5F7F]">Manage your account and department preferences</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#C5D5FF] p-4 sticky top-6">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white font-bold shadow-md' : 'text-[#4A5F7F] hover:bg-[#F5F8FF]'}`}>
                    <span className="text-xl">{tab.icon}</span>
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border-2 border-[#C5D5FF] p-6">

              {/* Profile, Account, Notifications, Appearance, and Language tabs - Same as Student */}
              {activeTab === 'profile' && (<div className="space-y-6"><h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Profile Settings</h2><div className="flex flex-col items-center gap-4 p-6 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF]"><div className="relative">{photoPreview ? (<img src={photoPreview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-[#8CA5FF] shadow-lg" />) : (<div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#8CA5FF] to-[#7090E5] flex items-center justify-center text-white text-4xl font-bold shadow-lg">{profile?.full_name?.charAt(0) || '?'}</div>)}</div><div className="flex gap-3"><label className="px-4 py-2 bg-[#8CA5FF] text-white rounded-lg font-semibold cursor-pointer hover:bg-[#7090E5] transition-all shadow-md">Upload Photo<input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" /></label>{photoPreview && (<button onClick={handleRemovePhoto} className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md">Remove</button>)}</div><p className="text-xs text-[#4A5F7F]">Max size: 5MB. Formats: JPG, PNG, GIF</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Full Name</label><input type="text" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /></div><div><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Phone Number</label><input type="tel" value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /></div><div><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Gender</label><select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]"><option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div><div><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Date of Birth</label><input type="date" value={profileData.dateOfBirth} onChange={e => setProfileData({...profileData, dateOfBirth: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /></div><div className="md:col-span-2"><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Bio</label><textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows="4" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" placeholder="Tell us about yourself..." /></div></div><button onClick={handleSaveProfile} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save Profile Changes'}</button></div>)}

              {activeTab === 'account' && (<div className="space-y-6"><h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Account Settings</h2>{accountInfo && (<div className="p-6 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF] space-y-3"><div className="flex justify-between"><span className="font-bold text-[#1E3A5F]">Email:</span><span className="text-[#4A5F7F]">{accountInfo.email}</span></div><div className="flex justify-between"><span className="font-bold text-[#1E3A5F]">Role:</span><span className="text-[#4A5F7F] capitalize">{accountInfo.role}</span></div><div className="flex justify-between"><span className="font-bold text-[#1E3A5F]">Account Created:</span><span className="text-[#4A5F7F]">{new Date(accountInfo.created_at).toLocaleDateString()}</span></div><div className="flex justify-between"><span className="font-bold text-[#1E3A5F]">Last Login:</span><span className="text-[#4A5F7F]">{new Date(accountInfo.last_login).toLocaleDateString()}</span></div></div>)}<div className="space-y-4"><h3 className="text-xl font-bold text-[#1E3A5F]">Change Password</h3><div className="relative"><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Current Password</label><input type={showPasswords.current ? 'text' : 'password'} value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full px-4 py-3 pr-12 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /><button onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-4 top-11 text-[#4A5F7F]">{showPasswords.current ? '🙈' : '👁️'}</button></div><div className="relative"><label className="block text-sm font-bold text-[#1E3A5F] mb-2">New Password</label><input type={showPasswords.new ? 'text' : 'password'} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full px-4 py-3 pr-12 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /><button onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-4 top-11 text-[#4A5F7F]">{showPasswords.new ? '🙈' : '👁️'}</button></div><div className="relative"><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Confirm New Password</label><input type={showPasswords.confirm ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full px-4 py-3 pr-12 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /><button onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-4 top-11 text-[#4A5F7F]">{showPasswords.confirm ? '🙈' : '👁️'}</button></div><button onClick={handleChangePassword} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">{loading ? 'Changing...' : 'Change Password'}</button></div><div className="space-y-4"><h3 className="text-xl font-bold text-[#1E3A5F]">Change Email</h3><div><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Current Email</label><input type="email" value={currentEmail} disabled className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600" /></div><div><label className="block text-sm font-bold text-[#1E3A5F] mb-2">New Email</label><input type="email" value={emailData.newEmail} onChange={e => setEmailData({...emailData, newEmail: e.target.value})} placeholder="Enter new email address" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /></div><div><label className="block text-sm font-bold text-[#1E3A5F] mb-2">Current Password</label><input type="password" value={emailData.currentPasswordForEmail} onChange={e => setEmailData({...emailData, currentPasswordForEmail: e.target.value})} placeholder="Enter current password to confirm" className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" /><p className="text-xs text-[#4A5F7F] mt-1">Required for security verification</p></div><button onClick={handleChangeEmail} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">{loading ? 'Updating...' : 'Change Email'}</button></div></div>)}

              {activeTab === 'notifications' && (<div className="space-y-6"><h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Notification Preferences</h2><div className="space-y-4">{Object.entries({email_notifications: 'Email Notifications', system_notifications: 'System Notifications', trip_approval_notifications: 'Trip Approval Notifications', complaint_notifications: 'Complaint Updates', report_notifications: 'Report Feedback', reminder_notifications: 'Reminder Notifications', announcement_notifications: 'New Announcements'}).map(([key, label]) => (<div key={key} className="flex items-center justify-between p-4 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF]"><span className="font-semibold text-[#1E3A5F]">{label}</span><button onClick={() => setNotificationPrefs({...notificationPrefs, [key]: !notificationPrefs[key]})} className={`relative w-14 h-8 rounded-full transition-colors ${notificationPrefs[key] ? 'bg-[#8CA5FF]' : 'bg-gray-300'}`}><span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${notificationPrefs[key] ? 'transform translate-x-6' : ''}`} /></button></div>))}</div><button onClick={handleSaveNotifications} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save Notification Preferences'}</button></div>)}

              {activeTab === 'appearance' && (<div className="space-y-6"><h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Appearance Preferences</h2><div className="space-y-6"><div><label className="block text-sm font-bold text-[#1E3A5F] mb-3">Theme</label><div className="grid grid-cols-2 gap-4">{['light', 'dark'].map(theme => (<button key={theme} onClick={() => setAppearancePrefs({...appearancePrefs, theme})} className={`p-4 rounded-xl border-2 font-semibold capitalize transition-all ${appearancePrefs.theme === theme ? 'border-[#8CA5FF] bg-[#F5F8FF] text-[#1E3A5F]' : 'border-[#C5D5FF] text-[#4A5F7F]'}`}>{theme === 'light' ? '☀️' : '🌙'} {theme}</button>))}</div></div><div><label className="block text-sm font-bold text-[#1E3A5F] mb-3">Font Size</label><div className="grid grid-cols-3 gap-4">{['small', 'medium', 'large'].map(size => (<button key={size} onClick={() => setAppearancePrefs({...appearancePrefs, font_size: size})} className={`p-4 rounded-xl border-2 font-semibold capitalize transition-all ${appearancePrefs.font_size === size ? 'border-[#8CA5FF] bg-[#F5F8FF] text-[#1E3A5F]' : 'border-[#C5D5FF] text-[#4A5F7F]'}`}>{size}</button>))}</div></div></div><button onClick={handleSaveAppearance} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save Appearance Preferences'}</button></div>)}

              {activeTab === 'language' && (<div className="space-y-6"><h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">Language Preference</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[{code: 'en', name: 'English', flag: '🇬🇧'}, {code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹'}, {code: 'am', name: 'አማርኛ (Amharic)', flag: '🇪🇹'}].map(lang => (<button key={lang.code} onClick={() => setLanguage(lang.code)} className={`p-6 rounded-xl border-2 font-semibold transition-all ${language === lang.code ? 'border-[#8CA5FF] bg-[#F5F8FF] text-[#1E3A5F]' : 'border-[#C5D5FF] text-[#4A5F7F]'}`}><div className="text-4xl mb-2">{lang.flag}</div><div>{lang.name}</div></button>))}</div><button onClick={handleSaveLanguage} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save Language Preference'}</button></div>)}

              {/* DEPARTMENT SETTINGS TAB - Department Head Specific */}
              {activeTab === 'department' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">🏛️ Department Settings</h2>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-[#1E3A5F]">Department Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Department Name</label>
                        <input type="text" value={deptSettings.department_name} onChange={e => setDeptSettings({...deptSettings, department_name: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Office Phone</label>
                        <input type="tel" value={deptSettings.office_phone} onChange={e => setDeptSettings({...deptSettings, office_phone: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Office Email</label>
                        <input type="email" value={deptSettings.office_email} onChange={e => setDeptSettings({...deptSettings, office_email: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Office Location</label>
                        <input type="text" value={deptSettings.office_location} onChange={e => setDeptSettings({...deptSettings, office_location: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#1E3A5F] mt-8">Approval Preferences</h3>
                    <div className="flex items-center justify-between p-4 bg-[#F5F8FF] rounded-xl border-2 border-[#C5D5FF]">
                      <div>
                        <span className="font-semibold text-[#1E3A5F] block">Enable Auto-Approval</span>
                        <span className="text-xs text-[#4A5F7F]">Automatically approve registrations that meet criteria</span>
                      </div>
                      <button onClick={() => setDeptSettings({...deptSettings, auto_approval_enabled: !deptSettings.auto_approval_enabled})} className={`relative w-14 h-8 rounded-full transition-colors ${deptSettings.auto_approval_enabled ? 'bg-[#8CA5FF]' : 'bg-gray-300'}`}>
                        <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${deptSettings.auto_approval_enabled ? 'transform translate-x-6' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Approval Deadline (Days)</label>
                        <input type="number" min="1" max="30" value={deptSettings.approval_deadline_days} onChange={e => setDeptSettings({...deptSettings, approval_deadline_days: parseInt(e.target.value)})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                        <p className="text-xs text-[#4A5F7F] mt-1">Days before registration deadline to approve/reject</p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#1E3A5F] mt-8">Trip Management Defaults</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Default Registration Deadline (Days)</label>
                        <input type="number" min="1" max="90" value={deptSettings.default_registration_deadline_days} onChange={e => setDeptSettings({...deptSettings, default_registration_deadline_days: parseInt(e.target.value)})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                        <p className="text-xs text-[#4A5F7F] mt-1">Days before trip start date for registration deadline</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Default Maximum Students</label>
                        <input type="number" min="1" max="200" value={deptSettings.default_max_students} onChange={e => setDeptSettings({...deptSettings, default_max_students: parseInt(e.target.value)})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]" />
                        <p className="text-xs text-[#4A5F7F] mt-1">Default capacity for new trips</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A5F] mb-2">Default Trip Status</label>
                        <select value={deptSettings.default_trip_status} onChange={e => setDeptSettings({...deptSettings, default_trip_status: e.target.value})} className="w-full px-4 py-3 border-2 border-[#C5D5FF] rounded-lg focus:outline-none focus:border-[#8CA5FF]">
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                        <p className="text-xs text-[#4A5F7F] mt-1">Initial status when creating new trips</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSaveDeptSettings} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#7090E5] text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Department Settings'}
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
