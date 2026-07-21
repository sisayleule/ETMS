import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchFullProfile,
  updateBasicProfile,
  updateProfilePhoto,
  requestPhotoUnlock,
  upsertHealthInfo,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../../lib/profileService'
import { uploadProfilePhoto } from '../../lib/storage'

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [healthInfo, setHealthInfo] = useState(null)
  const [contacts, setContacts] = useState([])
  const [statusMessage, setStatusMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    const result = await fetchFullProfile(user.id)
    setProfile(result.profile)
    setHealthInfo(result.healthInfo)
    setContacts(result.contacts)
    setLoading(false)
  }

  useEffect(() => {
    if (user?.id) loadData()
  }, [user?.id]) // Changed dependency from user to user?.id to prevent unnecessary re-renders when user object changes but ID stays the same


  const showStatus = (message) => {
    setStatusMessage(message)
    setTimeout(() => setStatusMessage(''), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8CA5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7F9F] font-sans text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF]">
      <div className="max-w-[1400px] mx-auto p-8 md:p-12">
        
        <div className="mb-10">
          <h1 className="font-serif text-[#1E3A5F] text-5xl font-bold mb-3 leading-tight">My Profile</h1>
          <p className="text-[#6B7F9F] font-sans text-base leading-relaxed">
            Manage your personal, health, and emergency contact information
          </p>
        </div>

        {statusMessage && (
          <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-700 font-sans text-sm font-medium">{statusMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <PhotoAndBasicInfo
              userId={user.id}
              profile={profile}
              onProfileUpdate={async (updatedProfile) => {
                setProfile(updatedProfile)
                await refreshProfile()
              }}
              showStatus={showStatus}
            />
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <HealthInfoSection
              userId={user.id}
              healthInfo={healthInfo}
              onSaved={(updated) => {
                setHealthInfo(updated)
                showStatus('Health information updated successfully.')
              }}
            />
            <EmergencyContactsSection
              userId={user.id}
              contacts={contacts}
              onContactsChange={setContacts}
              showStatus={showStatus}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoAndBasicInfo({ userId, profile, onProfileUpdate, showStatus }) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '')
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study || '')
  const [editingBasic, setEditingBasic] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState('')

  const handleSaveBasic = async () => {
    setError('')
    if (!fullName.trim()) {
      setError('Full name cannot be empty.')
      return
    }
    const { error: updateError } = await updateBasicProfile(userId, {
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim() || null,
      year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
    })
    if (updateError) {
      setError('Could not save changes. Please try again.')
      return
    }
    onProfileUpdate({
      ...profile,
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim() || null,
      year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
    })
    setEditingBasic(false)
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (profile?.photo_locked) {
      setError('Your photo is locked. Request an unlock below to change it.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be smaller than 2MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    setError('')
    setUploadingPhoto(true)
    const { publicUrl, error: uploadError } = await uploadProfilePhoto(userId, file)
    if (uploadError) {
      setError('Photo upload failed. Please try again.')
      setUploadingPhoto(false)
      return
    }
    const { error: dbError } = await updateProfilePhoto(userId, publicUrl)
    if (dbError) {
      setError('Photo uploaded but profile update failed. Please refresh.')
      setUploadingPhoto(false)
      return
    }
    onProfileUpdate({
      ...profile,
      profile_photo: publicUrl,
      photo_locked: true,
    })
    setUploadingPhoto(false)
    showStatus('Profile photo updated and locked.')
  }

  const handleRequestUnlock = async () => {
    const { error: requestError } = await requestPhotoUnlock(userId, profile?.full_name)
    if (requestError) {
      setError('Could not send unlock request. Please try again later.')
    } else {
      showStatus('Unlock request sent to the department head.')
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-[#E5EDFF] shadow-sm">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#8CA5FF] to-[#6B8FE5] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-serif text-5xl font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-[#E5EDFF]">
            {profile?.photo_locked ? (
              <span className="text-xl">🔒</span>
            ) : (
              <span className="text-xl">🔓</span>
            )}
          </div>
        </div>

        <h3 className="font-serif text-[#1E3A5F] text-2xl font-bold mb-1">{profile?.full_name}</h3>
        <p className="text-[#8B9FB5] font-sans text-sm mb-4">{profile?.student_id_number}</p>

        {profile?.photo_locked ? (
          <div className="text-center space-y-2">
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 font-sans text-xs font-semibold uppercase tracking-wider">
                Photo Locked
              </p>
            </div>
            <button
              onClick={handleRequestUnlock}
              className="text-[#8CA5FF] hover:text-[#6B8FE5] font-sans text-sm font-medium transition-colors underline decoration-dotted"
            >
              Request Unlock
            </button>
          </div>
        ) : (
          <label className="cursor-pointer px-5 py-2.5 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-semibold hover:shadow-lg transition-all">
            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploadingPhoto}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 font-sans text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
            Full Name
          </label>
          {editingBasic ? (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors"
            />
          ) : (
            <p className="text-[#1E3A5F] font-sans text-base font-medium">{profile?.full_name}</p>
          )}
        </div>

        <div>
          <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
            Phone Number
          </label>
          {editingBasic ? (
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+251..."
              className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors"
            />
          ) : (
            <p className="text-[#1E3A5F] font-sans text-base font-medium">{profile?.phone_number || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
            Year of Study
          </label>
          {editingBasic ? (
            <select
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors"
            >
              <option value="">Select Year</option>
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          ) : (
            <p className="text-[#1E3A5F] font-sans text-base font-medium">
              {profile?.year_of_study ? `Year ${profile.year_of_study}` : 'Not set'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
            Department
          </label>
          <p className="text-[#1E3A5F] font-sans text-base font-medium">{profile?.department}</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t-2 border-[#F0F4FF]">
        {editingBasic ? (
          <div className="flex gap-3">
            <button
              onClick={handleSaveBasic}
              className="flex-1 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-semibold hover:shadow-lg transition-all"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setFullName(profile?.full_name || '')
                setPhoneNumber(profile?.phone_number || '')
                setYearOfStudy(profile?.year_of_study || '')
                setEditingBasic(false)
                setError('')
              }}
              className="flex-1 py-3 bg-[#F8FAFF] border-2 border-[#E5EDFF] text-[#6B7F9F] rounded-xl font-sans text-sm font-semibold hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingBasic(true)}
            className="w-full py-3 bg-[#F8FAFF] border-2 border-[#E5EDFF] text-[#1E3A5F] rounded-xl font-sans text-sm font-semibold hover:bg-white hover:border-[#8CA5FF] transition-all"
          >
            Edit Information
          </button>
        )}
      </div>
    </div>
  )
}


function HealthInfoSection({ userId, healthInfo, onSaved }) {
  const [medicalConditions, setMedicalConditions] = useState(healthInfo?.medical_conditions || '')
  const [allergies, setAllergies] = useState(healthInfo?.allergies || '')
  const [bloodType, setBloodType] = useState(healthInfo?.blood_type || 'Unknown')
  const [medications, setMedications] = useState(healthInfo?.medications || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { error } = await upsertHealthInfo(userId, {
      medical_conditions: medicalConditions.trim() || null,
      allergies: allergies.trim() || null,
      blood_type: bloodType,
      medications: medications.trim() || null,
    })
    setSaving(false)
    if (!error) {
      onSaved({
        medical_conditions: medicalConditions.trim() || null,
        allergies: allergies.trim() || null,
        blood_type: bloodType,
        medications: medications.trim() || null,
      })
      setEditing(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-[#E5EDFF] shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center">
            <span className="text-xl">⚕️</span>
          </div>
          <div>
            <h3 className="font-serif text-[#1E3A5F] text-2xl font-bold">Health Information</h3>
            <p className="text-[#8B9FB5] font-sans text-xs mt-0.5">Medical details for emergencies</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-[#8CA5FF] hover:text-[#6B8FE5] font-sans text-sm font-semibold transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-5">
          <div>
            <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Blood Type
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors"
            >
              {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Allergies
            </label>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Peanuts, Penicillin (leave empty if none)"
              rows={3}
              className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Medical Conditions
            </label>
            <textarea
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              placeholder="e.g. Asthma, Diabetes (leave empty if none)"
              rows={3}
              className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Current Medications
            </label>
            <textarea
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="e.g. Inhaler as needed, daily supplements (leave empty if none)"
              rows={3}
              className="w-full bg-[#F8FAFF] border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Health Info'}
            </button>
            <button
              onClick={() => {
                setMedicalConditions(healthInfo?.medical_conditions || '')
                setAllergies(healthInfo?.allergies || '')
                setBloodType(healthInfo?.blood_type || 'Unknown')
                setMedications(healthInfo?.medications || '')
                setEditing(false)
              }}
              className="flex-1 py-3 bg-[#F8FAFF] border-2 border-[#E5EDFF] text-[#6B7F9F] rounded-xl font-sans text-sm font-semibold hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-xl border-2 border-[#E5EDFF]">
            <p className="text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Blood Type
            </p>
            <p className="text-[#1E3A5F] font-sans text-lg font-bold">{healthInfo?.blood_type || 'Unknown'}</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-xl border-2 border-[#E5EDFF]">
            <p className="text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Allergies
            </p>
            <p className="text-[#1E3A5F] font-sans text-sm leading-relaxed">
              {healthInfo?.allergies || 'None reported'}
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-xl border-2 border-[#E5EDFF] md:col-span-2">
            <p className="text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Medical Conditions
            </p>
            <p className="text-[#1E3A5F] font-sans text-sm leading-relaxed">
              {healthInfo?.medical_conditions || 'None reported'}
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-xl border-2 border-[#E5EDFF] md:col-span-2">
            <p className="text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
              Current Medications
            </p>
            <p className="text-[#1E3A5F] font-sans text-sm leading-relaxed">
              {healthInfo?.medications || 'None reported'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function EmergencyContactsSection({ userId, contacts, onContactsChange, showStatus }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const resetForm = () => {
    setName('')
    setRelationship('')
    setPhone('')
    setError('')
  }

  const handleAdd = async () => {
    setError('')
    if (!name.trim() || !relationship.trim() || !phone.trim()) {
      setError('All fields are required.')
      return
    }
    const { data, error: addError } = await addEmergencyContact(userId, {
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
    })
    if (addError) {
      setError('Could not add contact. Please try again.')
      return
    }
    onContactsChange([...contacts, data])
    resetForm()
    setAdding(false)
    showStatus('Emergency contact added successfully.')
  }

  const handleUpdate = async (contactId) => {
    setError('')
    if (!name.trim() || !relationship.trim() || !phone.trim()) {
      setError('All fields are required.')
      return
    }
    const { error: updateError } = await updateEmergencyContact(contactId, {
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
    })
    if (updateError) {
      setError('Could not update contact. Please try again.')
      return
    }
    onContactsChange(contacts.map(c => 
      c.id === contactId 
        ? { ...c, name: name.trim(), relationship: relationship.trim(), phone: phone.trim() }
        : c
    ))
    resetForm()
    setEditingId(null)
    showStatus('Emergency contact updated successfully.')
  }

  const handleDelete = async (contactId) => {
    if (!window.confirm('Delete this emergency contact?')) return
    const { error: deleteError } = await deleteEmergencyContact(contactId)
    if (!deleteError) {
      onContactsChange(contacts.filter(c => c.id !== contactId))
      showStatus('Emergency contact deleted.')
    }
  }

  const startEdit = (contact) => {
    setEditingId(contact.id)
    setName(contact.name)
    setRelationship(contact.relationship)
    setPhone(contact.phone)
    setError('')
  }

  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-[#E5EDFF] shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center">
            <span className="text-xl">📞</span>
          </div>
          <div>
            <h3 className="font-serif text-[#1E3A5F] text-2xl font-bold">Emergency Contacts</h3>
            <p className="text-[#8B9FB5] font-sans text-xs mt-0.5">People to contact in case of emergency</p>
          </div>
        </div>
        {!adding && !editingId && (
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-lg font-sans text-sm font-semibold hover:shadow-lg transition-all"
          >
            + Add Contact
          </button>
        )}
      </div>

      {(adding || editingId) && (
        <div className="mb-8 p-6 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-xl border-2 border-[#8CA5FF]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-sans text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full bg-white border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
                Relationship
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Father, Mother, Guardian"
                className="w-full bg-white border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#8B9FB5] font-sans text-[11px] uppercase tracking-wider font-semibold mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251..."
                className="w-full bg-white border-2 border-[#E5EDFF] rounded-xl px-4 py-3 text-[#1E3A5F] font-sans text-sm focus:outline-none focus:border-[#8CA5FF] transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
              className="flex-1 py-3 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-xl font-sans text-sm font-semibold hover:shadow-lg transition-all"
            >
              {editingId ? 'Update Contact' : 'Add Contact'}
            </button>
            <button
              onClick={() => {
                resetForm()
                setAdding(false)
                setEditingId(null)
              }}
              className="flex-1 py-3 bg-white border-2 border-[#E5EDFF] text-[#6B7F9F] rounded-xl font-sans text-sm font-semibold hover:bg-[#F8FAFF] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[#F0F4FF] flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📇</span>
          </div>
          <p className="text-[#6B7F9F] font-sans text-sm">
            No emergency contacts added yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="group p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] rounded-xl border-2 border-[#E5EDFF] hover:border-[#8CA5FF] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-[#1E3A5F] font-sans text-base font-bold mb-1">{contact.name}</h4>
                  <p className="text-[#8B9FB5] font-sans text-sm mb-2">{contact.relationship}</p>
                  <div className="flex items-center gap-2 text-[#6B7F9F] font-sans text-sm">
                    <span>📱</span>
                    <span>{contact.phone}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(contact)}
                    className="p-2 text-[#8CA5FF] hover:bg-[#8CA5FF] hover:text-white rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
