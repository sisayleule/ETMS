// Registration Forms Service - handles medical and emergency contact forms during trip registration
// import supabase client for database operations
import { supabase } from './supabase' // Import Supabase client singleton instance

// fetchMedicalForm gets the student's existing health_info row, if any
export async function fetchMedicalForm(studentId) { // Begin fetchMedicalForm function definition
  const { data, error } = await supabase // Execute query on supabase client
    .from('health_info') // Target health_info table from Phase 1
    .select('*') // Select all columns from health_info
    .eq('user_id', studentId) // Filter by user_id matching the student
    .maybeSingle() // Return single row or null (no error if missing)

  return { medicalForm: data, error } // Return medical form data and any error
} // End fetchMedicalForm function

// upsertMedicalForm creates or updates the student's medical form
// only allowed while the related registration is not yet approved
export async function upsertMedicalForm(studentId, formData) { // Begin upsertMedicalForm function definition
  const { data, error } = await supabase // Execute upsert on supabase client
    .from('health_info') // Target health_info table
    .upsert( // Use upsert to insert or update based on conflict
      { // Medical form payload object
        user_id: studentId, // Map student user identifier
        blood_type: formData.bloodType, // Map blood group selection
        allergies: formData.allergies, // Map allergies text content
        medications: formData.medications, // Map current medications text
        medical_conditions: formData.medicalConditions, // Map medical conditions text
        emergency_medical_notes: formData.emergencyMedicalNotes, // Map emergency notes text (new field)
        updated_at: new Date().toISOString(), // Timestamp the update
      }, // End payload object
      { onConflict: 'user_id' } // Handle conflict on user_id unique constraint
    ) // End upsert configuration
    .select() // Request the inserted/updated row back
    .single() // Return as single object not array

  return { medicalForm: data, error } // Return updated medical form and any error
} // End upsertMedicalForm function

// fetchEmergencyContact gets the student's existing emergency contact, if any
// a student may have multiple contacts from Phase 3, so this gets the most recent
export async function fetchEmergencyContact(studentId) { // Begin fetchEmergencyContact function definition
  const { data, error } = await supabase // Execute query on supabase client
    .from('emergency_contacts') // Target emergency_contacts table from Phase 1
    .select('*') // Select all columns from emergency_contacts
    .eq('user_id', studentId) // Filter by user_id matching the student
    .order('created_at', { ascending: false }) // Sort by creation date newest first
    .limit(1) // Limit to one result (most recent)
    .maybeSingle() // Return single row or null

  return { emergencyContact: data, error } // Return emergency contact data and any error
} // End fetchEmergencyContact function

// upsertEmergencyContact creates a new contact or updates the most recent one
export async function upsertEmergencyContact(studentId, existingContactId, formData) { // Begin upsertEmergencyContact function definition
  const payload = { // Build emergency contact payload object
    user_id: studentId, // Map student user identifier
    contact_name: formData.fullName, // Map emergency contact full name
    relationship: formData.relationship, // Map relationship to student
    contact_phone: formData.phoneNumber, // Map primary phone number
    alternative_phone: formData.alternativePhone || null, // Map alternative phone (optional, new field)
    address: formData.address, // Map contact address (new field)
  } // End payload object

  // update the existing contact if one was found, otherwise insert a new one
  const query = existingContactId // Check if existing contact ID was provided
    ? supabase.from('emergency_contacts').update(payload).eq('id', existingContactId) // Build update query with ID filter
    : supabase.from('emergency_contacts').insert(payload) // Build insert query for new contact

  const { data, error } = await query.select().single() // Execute query and return single row

  return { emergencyContact: data, error } // Return emergency contact data and any error
} // End upsertEmergencyContact function

// markFormsCompleted flips the registration's forms_completed flag to true
// called once both forms pass validation during registration submission
export async function markFormsCompleted(registrationId) { // Begin markFormsCompleted function definition
  const { error } = await supabase // Execute update on supabase client
    .from('registrations') // Target registrations table
    .update({ forms_completed: true }) // Set forms_completed flag to true
    .eq('id', registrationId) // Filter by registration ID

  return { error } // Return any error from the update
} // End markFormsCompleted function

// validateMedicalForm checks required fields before allowing submission
export function validateMedicalForm(formData) { // Begin validateMedicalForm function definition
  if (!formData.bloodType) return 'Blood group is required.' // Check blood type is not empty
  return null // Return null if validation passes (no error)
} // End validateMedicalForm function

// validateEmergencyContact checks required fields before allowing submission
export function validateEmergencyContact(formData) { // Begin validateEmergencyContact function definition
  if (!formData.fullName?.trim()) return 'Full name is required.' // Check full name is not empty
  if (!formData.relationship?.trim()) return 'Relationship is required.' // Check relationship is not empty
  if (!formData.phoneNumber?.trim()) return 'Phone number is required.' // Check phone number is not empty
  if (!formData.address?.trim()) return 'Address is required.' // Check address is not empty
  return null // Return null if validation passes (no error)
} // End validateEmergencyContact function
