// Import the single supabase client instance to interact with Supabase storage buckets
import { supabase } from './supabase' // Connect client instance
// Export an asynchronous function to handle uploading student profile photos to Supabase Storage
export async function uploadProfilePhoto(userId, file) { // Accept the user's ID and file object
  // Create a unique file path string using the user's ID and current timestamp to prevent caching issues
  const filePath = `${userId}/${Date.now()}-${file.name}` // Concatenate userId, timestamp, and filename
  // Request Supabase storage upload to the public 'profile-photos' bucket
  const { data, error } = await supabase.storage // Access storage interface
    .from('profile-photos') // Reference the public profile-photos storage bucket
    .upload(filePath, file, { // Upload file to designated path
      // Set upsert parameter to false to avoid overwriting and use unique timestamped path instead
      upsert: false, // Do not overwrite existing paths
      // Configure cache settings to cache the uploaded photo for one hour in the user's browser
      cacheControl: '3600', // Set one hour max-age header
    }) // End of upload operation
  // Check if the upload process returned any error
  if (error) { // If storage service returned an upload error
    // Return early with null data fields and the returned upload error object
    return { publicUrl: null, filePath: null, error } // Return error to caller
  } // End of upload error check block
  // Request public access URL from Supabase for the newly uploaded file pathway
  const { data: urlData } = supabase.storage // Get public URL from storage
    .from('profile-photos') // Reference the public profile-photos storage bucket
    .getPublicUrl(filePath) // Retrieve public URL address for file
  // Return the fetched public URL, unique file path, and null error to indicate success
  return { publicUrl: urlData.publicUrl, filePath: filePath, error: null } // Return success payload
} // End of uploadProfilePhoto function
// Export an asynchronous function to remove old profile photos from the storage bucket
export async function deleteProfilePhoto(filePath) { // Accept the unique file pathway to delete
  // Check if a valid file path was provided to prevent unnecessary service calls
  if (!filePath) return { error: null } // Return early with null error if path is empty
  // Request Supabase storage to delete the specified file from the 'profile-photos' bucket
  const { error } = await supabase.storage // Access storage interface
    .from('profile-photos') // Reference the public profile-photos storage bucket
    .remove([filePath]) // Execute deletion for the single file path
  // Return the error object or null to indicate deletion status
  return { error } // Return operation results
} // End of deleteProfilePhoto function
// Export an asynchronous function to upload files to private buckets for security
export async function uploadPrivateFile(bucketName, userId, file) { // Accept target bucket, user id, and file
  // Build a unique file pathway scoped securely to the specified user's directory
  const filePath = `${userId}/${Date.now()}-${file.name}` // Concatenate user directory and file name
  // Upload the selected file to the specified secure private bucket
  const { error } = await supabase.storage // Access storage interface
    .from(bucketName) // Reference the target private bucket dynamically
    .upload(filePath, file, { upsert: false }) // Execute upload with upsert disabled
  // Check if the private file upload process returned an error
  if (error) { // If upload returned an error
    // Return early with null path and the returned error object
    return { filePath: null, error } // Return error details
  } // End of private upload error check
  // Return the newly created storage path and null error to indicate success
  return { filePath, error: null } // Return path for signed url requests
} // End of uploadPrivateFile function
// Export an asynchronous function to generate temporary secure URLs to view private files
export async function getSignedUrl(bucketName, filePath, expiresIn = 3600) { // Accept bucket, path, and expiry time
  // Request a temporary signed URL from Supabase storage for the secure file path
  const { data, error } = await supabase.storage // Access storage interface
    .from(bucketName) // Reference the designated private bucket
    .createSignedUrl(filePath, expiresIn) // Request signed URL valid for specified seconds
  // Return the signed URL address or null and the returned error object
  return { signedUrl: data?.signedUrl || null, error } // Return payload with access URL
} // End of getSignedUrl function
