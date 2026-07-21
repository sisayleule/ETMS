// Import the single Supabase client instance to perform database operations
import { supabase } from './supabase' // Connect database client
// Import notification service for real-time notifications
import { createNotification } from './notificationService' // Import notification helpers

// Fetch complete student profile data including main details, health info, and emergency contacts
export async function fetchFullProfile(userId) { // Receive active student's user ID
  // Query main student details from the profiles table
  const { data: profile, error: profileError } = await supabase // Use client to access tables
    .from('profiles') // Target profiles collection
    .select('*') // Query all columns in the row
    .eq('id', userId) // Filter matching specific user ID
    .single() // Expect a single row returned
  // Check if profile fetch operation encountered a fatal database error
  if (profileError) return { profile: null, healthInfo: null, contacts: [], error: profileError } // Return early with error details
  // Query associated health and medical data from the health_info table
  const { data: healthInfo, error: healthError } = await supabase // Use client to query database
    .from('health_info') // Target health_info table
    .select('*') // Query all fields in health record
    .eq('user_id', userId) // Filter matching the target user ID
    .maybeSingle() // Allow single record or null if not yet created
  // Query all active emergency contacts from the emergency_contacts table
  const { data: contacts, error: contactsError } = await supabase // Use client to select contacts
    .from('emergency_contacts') // Target emergency_contacts table
    .select('*') // Query all columns in the contacts table
    .eq('user_id', userId) // Filter matching the current user's record ID
    .order('created_at', { ascending: false }) // Sort contacts with latest created shown first
  
  // Return consolidated results where health info or contact errors are non-fatal for initial profile loads
  return { // Return multi-record profile payload
    profile, // Main student profile data
    healthInfo: healthInfo || null, // Medical parameters or null fallback
    contacts: contacts || [], // List of emergency contacts or empty array fallback
    error: contactsError || null, // Database query errors if any occurred
  } // End of return payload
} // End of fetchFullProfile function

// Update student's name, phone number, and current academic year of study
export async function updateBasicProfile(userId, updates) { // Accept target user ID and changed fields object
  // Request database update to save changed attributes inside the profiles table
  const { error } = await supabase // Execute update query
    .from('profiles') // Reference the target profiles table
    .update({ // Inject update object containing only modified keys
      ...updates, // Spread the specific fields modified by user
      updated_at: new Date().toISOString(), // Automatically append current timezone timestamp
    }) // Set update parameters
    .eq('id', userId) // Lock update to current user's database row ID
  
  // Notify department heads about profile update
  if (!error) {
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', userId).single()
      
      // Only notify if it's a student profile update
      if (profile && profile.role === 'student') {
        const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
        
        if (deptHeads) {
          const notifications = deptHeads.map(deptHead => ({
            user_id: deptHead.id, // Set recipient to department head ID
            title: 'Student Profile Updated', // Set notification title
            message: `${profile.full_name} has updated their profile information.`, // Set notification message
            type: 'General', // Set notification type
            link: '/depthead/dashboard' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
          }))
          
          await supabase.from('notifications').insert(notifications)
        }
      }
    } catch (notifError) {
      console.error('Failed to create profile update notification:', notifError)
    }
  }
  
  // Return the error object or null to indicate update status
  return { error } // Return operation results
} // End of updateBasicProfile function

// Save the newly uploaded public storage photo URL to student's profile and lock it
export async function updateProfilePhoto(userId, photoUrl) { // Accept student's user ID and new URL string
  // Update photo field and lock the photo from further edits by the student
  const { error } = await supabase // Initiate update on profiles
    .from('profiles') // Target the profiles table
    .update({ // Set photo attributes and state
      profile_photo: photoUrl, // Set profile_photo to new URL
      photo_locked: true, // Mark photo_locked as true to prevent modification
      updated_at: new Date().toISOString(), // Bump updated_at timestamp to track changes
    }) // Finish update object
    .eq('id', userId) // Restrict to active student's row
  
  // Notify department heads about profile photo upload
  if (!error) {
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
      
      if (deptHeads && profile) {
        const notifications = deptHeads.map(deptHead => ({
          user_id: deptHead.id, // Set recipient to department head ID
          title: 'Profile Photo Uploaded', // Set notification title
          message: `${profile.full_name} has uploaded a new profile photo.`, // Set notification message
          type: 'General', // Set notification type
          link: '/depthead/dashboard' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
        }))
        
        await supabase.from('notifications').insert(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create photo upload notification:', notifError)
    }
  }
  
  // Return database operation error if any occurred
  return { error } // Return operation results
} // End of updateProfilePhoto function

// Create a new general notification to department head requesting profile photo unlock
export async function requestPhotoUnlock(studentId, studentName) { // Accept requesting student ID and name
  // Query the department head's profile to obtain their unique user ID
  const { data: deptHead, error: findError } = await supabase // Search profiles table
    .from('profiles') // Target profiles database table
    .select('id') // Select only the ID field to reduce bandwidth
    .eq('role', 'departmentHead') // Filter for the department head user role
    .limit(1) // Limit search results to first matching row
    .maybeSingle() // Retrieve a single record or null fallback
  // Check if search query failed or if no department head is registered in the database
  if (findError || !deptHead) { // If search failed or result is null
    return { error: findError || new Error('No department head found') } // Return early with error description
  } // End of department head verification block
  // Insert a notification row targeted directly at the department head
  const { error } = await supabase // Access database client
    .from('notifications') // Target notifications database table
    .insert({ // Insert structured notification payload
      user_id: deptHead.id, // Address notification to department head ID
      title: 'Photo Unlock Request', // Set high-level action title
      message: `${studentName} has requested to unlock their profile photo.`, // Set specific student info message
      type: 'General', // Classify notification category as General
    }) // Finish insert operation
  // Return database insert error or null to indicate completion
  return { error } // Return notification trigger results
} // End of requestPhotoUnlock function

// Create or update the student's medical conditions and health parameters
export async function upsertHealthInfo(userId, healthData) { // Accept active user ID and health attributes
  // Perform an upsert query to update or create health_info record
  const { error } = await supabase // Execute upsert on table
    .from('health_info') // Target health_info database table
    .upsert({ // Supply health parameters object
      user_id: userId, // Associate record with active user ID
      ...healthData, // Spread incoming medical attributes
      updated_at: new Date().toISOString(), // Attach current UTC timestamp
    }, { // Supply upsert constraint parameters
      onConflict: 'user_id', // Handle conflicts on the unique user_id column
    }) // Close upsert configuration
  
  // Notify department heads about health info update
  if (!error) {
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
      
      if (deptHeads && profile) {
        const notifications = deptHeads.map(deptHead => ({
          user_id: deptHead.id, // Set recipient to department head ID
          title: 'Health Info Updated', // Set notification title
          message: `${profile.full_name} has updated their health information.`, // Set notification message
          type: 'General', // Set notification type
          link: '/depthead/dashboard' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
        }))
        
        await supabase.from('notifications').insert(notifications)
      }
    } catch (notifError) {
      console.error('Failed to create health info notification:', notifError)
    }
  }
  
  // Return upsert operation error details or null
  return { error } // Return transaction result
} // End of upsertHealthInfo function

// Add a new emergency contact record linked to the student's profile
export async function addEmergencyContact(userId, contact) { // Accept current user ID and contact parameters
  // Insert new emergency contact details into the database
  const { data, error } = await supabase // Access database client
    .from('emergency_contacts') // Target emergency_contacts table
    .insert({ // Supply contact detail fields
      user_id: userId, // Associate record with active student's ID
      contact_name: contact.name, // Map name field from form (was contact.contactName, causing null value)
      contact_phone: contact.phone, // Map phone field from form (was contact.contactPhone)
      relationship: contact.relationship, // Map family relationship string
    }) // Close insert options
    .select() // Select inserted fields to update local UI state immediately
    .single() // Expect a single row to be returned on success
  
  // Notify department head about new emergency contact
  if (data) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
    const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
    
    if (deptHeads && profile) {
      const notifications = deptHeads.map(deptHead => ({
        user_id: deptHead.id, // Set recipient to department head ID
        title: 'Emergency Contact Added', // Set notification title
        message: `${profile.full_name} has added a new emergency contact: ${contact.name} (${contact.relationship}).`, // Set notification message using contact.name instead of contact.contactName
        type: 'General', // Set notification type
        link: '/depthead/dashboard' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
      }))
      await supabase.from('notifications').insert(notifications)
    }
  }
  
  // Return the newly inserted row data along with any database errors
  return { data, error } // Return results payload
} // End of addEmergencyContact function

// Update attributes of an existing emergency contact record
export async function updateEmergencyContact(contactId, contact, userId) { // Accept the specific contact row ID and fields
  // Execute update on the target emergency contact row
  const { error } = await supabase // Access database client
    .from('emergency_contacts') // Target emergency_contacts database table
    .update({ // Supply updated contact fields
      contact_name: contact.name, // Update contact name parameter (was contact.contactName)
      contact_phone: contact.phone, // Update contact phone digits (was contact.contactPhone)
      relationship: contact.relationship, // Update relationship connection string
    }) // Close update parameters
    .eq('id', contactId) // Limit update to the target contact row ID
  
  // Notify department head about emergency contact update
  if (!error && userId) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
    const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
    
    if (deptHeads && profile) {
      const notifications = deptHeads.map(deptHead => ({
        user_id: deptHead.id, // Set recipient to department head ID
        title: 'Emergency Contact Updated', // Set notification title
        message: `${profile.full_name} has updated emergency contact: ${contact.name} (${contact.relationship}).`, // Set notification message using contact.name instead of contact.contactName
        type: 'General', // Set notification type
        link: '/depthead/dashboard' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
      }))
      await supabase.from('notifications').insert(notifications)
    }
  }
  
  // Return database update operation error details or null
  return { error } // Return update transaction results
} // End of updateEmergencyContact function

// Permanently remove an emergency contact record from the database
export async function deleteEmergencyContact(contactId) { // Accept the specific contact row ID to delete
  // Request deletion of the row matching the specified ID
  const { error } = await supabase // Access database client
    .from('emergency_contacts') // Target emergency_contacts database table
    .delete() // Execute delete command on matched rows
    .eq('id', contactId) // Limit deletion to the target contact row ID
  // Return database deletion error details or null to indicate status
  return { error } // Return deletion transaction results
} // End of deleteEmergencyContact function


