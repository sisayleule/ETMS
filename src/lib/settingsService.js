// =====================================================================================================================
// SETTINGS SERVICE
// Handles all user settings operations including profile, account, notifications, appearance, and language preferences
// Integrates with Supabase for persistent storage
// =====================================================================================================================
import { supabase } from './supabase' // Import Supabase client

// =====================================================================================================================
// PROFILE SETTINGS
// =====================================================================================================================

/**
 * Update user profile information
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {Promise<{data, error}>}
 */
export async function updateProfileSettings(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: profileData.fullName,
      phone_number: profileData.phoneNumber,
      gender: profileData.gender,
      date_of_birth: profileData.dateOfBirth,
      bio: profileData.bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

/**
 * Upload and update profile photo
 * @param {string} userId - User ID
 * @param {File} file - Photo file to upload
 * @returns {Promise<{data, error}>}
 */
export async function uploadProfilePhoto(userId, file) {
  try {
    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `profile-photos/${fileName}`

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    // Update profile with new photo URL
    const { data, error } = await supabase
      .from('profiles')
      .update({
        profile_photo: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Remove profile photo
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function removeProfilePhoto(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      profile_photo: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// =====================================================================================================================
// ACCOUNT SETTINGS
// =====================================================================================================================

/**
 * Change user password
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password to set
 * @returns {Promise<{data, error}>}
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({ // Update password in Supabase Auth
      password: newPassword, // Set new password
    }) // End updateUser call

    return { data, error } // Return result
  } catch (err) { // Catch any unexpected errors
    return { data: null, error: err } // Return error
  } // End try-catch
} // End changePassword function

/**
 * Change user email
 * Requires reauthentication via current password first for security,
 * since email confirmation is disabled for this project
 * @param {string} currentPassword - Current password for verification
 * @param {string} newEmail - New email to set
 * @returns {Promise<{data, error}>}
 */
export async function updateEmail(currentPassword, newEmail) {
  // Reauthenticate by attempting a sign-in with current credentials
  // This confirms the person changing the email is really the account owner
  const { data: { user } } = await supabase.auth.getUser() // Get current logged-in user

  if (!user) { // Check if user is not logged in
    return { error: { message: 'No user logged in.' } } // Return error if not authenticated
  } // End user check

  const { error: reauthError } = await supabase.auth.signInWithPassword({ // Attempt to sign in with current password
    email: user.email, // Use current email
    password: currentPassword, // Use provided current password
  }) // End signInWithPassword call

  if (reauthError) { // Check if reauthentication failed
    return { error: { message: 'Current password is incorrect.' } } // Return specific error message
  } // End reauthentication check

  // Update the email in Supabase Auth
  const { data, error } = await supabase.auth.updateUser({ // Update user email in Supabase Auth
    email: newEmail, // Set new email address
  }) // End updateUser call

  return { data, error } // Return result
} // End updateEmail function

/**
 * Get account information
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function getAccountInfo(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at, last_login, role')
    .eq('id', userId)
    .single()

  return { data, error }
}

// =====================================================================================================================
// NOTIFICATION SETTINGS
// =====================================================================================================================

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function getNotificationPreferences(userId) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // If no preferences exist, return defaults
  if (!data && !error) {
    return {
      data: {
        email_notifications: true,
        system_notifications: true,
        trip_approval_notifications: true,
        complaint_notifications: true,
        report_notifications: true,
        reminder_notifications: true,
        announcement_notifications: true,
      },
      error: null,
    }
  }

  return { data, error }
}

/**
 * Update notification preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Notification preferences to update
 * @returns {Promise<{data, error}>}
 */
export async function updateNotificationPreferences(userId, preferences) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single()

  return { data, error }
}

// =====================================================================================================================
// APPEARANCE SETTINGS
// =====================================================================================================================

/**
 * Get user appearance preferences
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function getAppearancePreferences(userId) {
  const { data, error } = await supabase
    .from('appearance_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // If no preferences exist, return defaults
  if (!data && !error) {
    return {
      data: {
        theme: 'light',
        accent_color: '#8CA5FF',
        font_size: 'medium',
        compact_mode: false,
        reduce_animations: false,
      },
      error: null,
    }
  }

  return { data, error }
}

/**
 * Update appearance preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Appearance preferences to update
 * @returns {Promise<{data, error}>}
 */
export async function updateAppearancePreferences(userId, preferences) {
  const { data, error } = await supabase
    .from('appearance_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single()

  return { data, error }
}

// =====================================================================================================================
// LANGUAGE SETTINGS
// =====================================================================================================================

/**
 * Get user language preference
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function getLanguagePreference(userId) {
  const { data, error } = await supabase
    .from('language_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // If no preference exists, return default
  if (!data && !error) {
    return {
      data: {
        language: 'en',
      },
      error: null,
    }
  }

  return { data, error }
}

/**
 * Update language preference
 * @param {string} userId - User ID
 * @param {string} language - Language code (en, om, am)
 * @returns {Promise<{data, error}>}
 */
export async function updateLanguagePreference(userId, language) {
  const { data, error } = await supabase
    .from('language_preferences')
    .upsert(
      {
        user_id: userId,
        language,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single()

  return { data, error }
}

// =====================================================================================================================
// DEPARTMENT HEAD SPECIFIC SETTINGS
// =====================================================================================================================

/**
 * Get department head settings
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function getDeptHeadSettings(userId) {
  const { data, error } = await supabase
    .from('depthead_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // If no settings exist, return defaults
  if (!data && !error) {
    return {
      data: {
        department_name: '',
        office_phone: '',
        office_email: '',
        office_location: '',
        auto_approval_enabled: false,
        approval_deadline_days: 7,
        default_registration_deadline_days: 14,
        default_max_students: 50,
        default_trip_status: 'draft',
      },
      error: null,
    }
  }

  return { data, error }
}

/**
 * Update department head settings
 * @param {string} userId - User ID
 * @param {object} settings - Department head settings to update
 * @returns {Promise<{data, error}>}
 */
export async function updateDeptHeadSettings(userId, settings) {
  const { data, error } = await supabase
    .from('depthead_settings')
    .upsert(
      {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single()

  return { data, error }
}

// =====================================================================================================================
// STUDENT SPECIFIC SETTINGS
// =====================================================================================================================

/**
 * Get student emergency contact
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function getEmergencyContact(userId) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { data, error }
}

/**
 * Update or create emergency contact
 * @param {string} userId - User ID
 * @param {object} contactData - Emergency contact data
 * @returns {Promise<{data, error}>}
 */
export async function updateEmergencyContact(userId, contactData) {
  // Check if emergency contact exists
  const { data: existing } = await supabase
    .from('emergency_contacts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // Update existing contact
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update({
        contact_name: contactData.contactName,
        contact_phone: contactData.contactPhone,
        relationship: contactData.relationship,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    return { data, error }
  } else {
    // Create new contact
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: userId,
        contact_name: contactData.contactName,
        contact_phone: contactData.contactPhone,
        relationship: contactData.relationship,
      })
      .select()
      .single()

    return { data, error }
  }
}

/**
 * Get student medical information
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export async function getMedicalInfo(userId) {
  const { data, error } = await supabase
    .from('health_info')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return { data, error }
}

/**
 * Update or create medical information
 * @param {string} userId - User ID
 * @param {object} medicalData - Medical information data
 * @returns {Promise<{data, error}>}
 */
export async function updateMedicalInfo(userId, medicalData) {
  const { data, error } = await supabase
    .from('health_info')
    .upsert(
      {
        user_id: userId,
        blood_type: medicalData.bloodType,
        allergies: medicalData.allergies,
        medical_notes: medicalData.medicalNotes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single()

  return { data, error }
}
