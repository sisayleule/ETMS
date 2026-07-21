// Import the Supabase client instance
import { supabase } from './supabase' // Import Supabase client configurations (removed isMockSessionActive and mockDb imports - mock mode removed)
// Import storage helper functions for uploading to secure private buckets
import { uploadPrivateFile, getSignedUrl } from './storage' // Import storage interactions helper
// Import notification service for real-time notifications
import { createNotification } from './notificationService' // Import notification helpers
// fetchDocumentsForStudentTrip gets all documents a student has uploaded for one trip
// used to show existing upload status per document type
export async function fetchDocumentsForStudentTrip(studentId, tripId) { // Start fetchDocumentsForStudentTrip function
  // query documents matching both student and trip (removed mock mode check - production only)
  const { data, error } = await supabase // Access the single database client instance
    .from('documents') // Query the documents table
    .select('*') // Retrieve all matching columns
    .eq('student_id', studentId) // Filter matching targeted student identifier
    .eq('trip_id', tripId) // Filter matching targeted trip identifier
    .order('uploaded_at', { ascending: false }) // Sort records chronologically
  // return the list and any error
  return { documents: data || [], error } // Output retrieval results
} // End fetchDocumentsForStudentTrip function
// uploadDocument handles both the first upload and re-uploads after rejection
// existingDoc is passed in when re-uploading so we can delete the old file and bump version
export async function uploadDocument(studentId, tripId, docType, file, existingDoc) { // Start uploadDocument function
  // upload the new file to the private trip-documents bucket (removed mock mode check - production only)
  const { filePath, error: uploadError } = await uploadPrivateFile( // Execute storage upload
    'trip-documents', // Reference target private trip-documents bucket
    studentId, // Pass studentId to secure user folder
    file // Pass raw file payload
  ) // End upload request
  // if the upload failed, stop here and return the error
  if (uploadError) { // Check if upload returned error
    return { document: null, error: uploadError } // Return early with error payload
  } // End upload error block
  // if there was an existing document (a re-upload), delete its old file from storage
  // this prevents orphaned files from piling up in the bucket
  if (existingDoc?.file_path) { // Check if existing path is present
    await supabase.storage.from('trip-documents').remove([existingDoc.file_path]) // Trigger deletion from private bucket
  } // End deletion block
  if (existingDoc) { // Check if this is an update / re-upload operation
    // this is a re-upload: update the existing row, bump version, reset status
    const { data, error } = await supabase // Trigger database update
      .from('documents') // Reference documents table
      .update({ // Pass update fields
        file_url: filePath, // Set path URL
        file_path: filePath, // Set physical file path
        file_name: file.name, // Set visible file name
        status: 'Pending', // Reset status back to Pending review
        feedback: null, // Clear past feedback logs
        version: existingDoc.version + 1, // Increment document version counter
        uploaded_at: new Date().toISOString(), // Update upload timestamp
        reviewed_at: null, // Reset review date
      }) // End update dataset
      .eq('id', existingDoc.id) // Target specific document ID
      .select() // Select updated row
      .single() // Return single row object
    
    // Notify department head about document re-upload
    if (data) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', studentId).single()
      const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
      
      if (deptHeads && profile) {
        const notifications = deptHeads.map(deptHead => ({
          user_id: deptHead.id, // Set recipient to department head ID
          title: 'Document Re-uploaded', // Set notification title
          message: `${profile.full_name} has re-uploaded their ${docType} document (v${data.version}).`, // Set notification message with version number
          type: 'Document', // Set notification type to Document
          trip_id: tripId, // Link notification to trip
          link: '/depthead/documents' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
        }))
        await supabase.from('notifications').insert(notifications) // Insert notifications
      }
    }
    
    return { document: data, error } // Return updated payload
  } else { // Handle brand new document upload
    // this is a brand new upload: insert a fresh row at version 1
    const { data, error } = await supabase // Trigger database insertion
      .from('documents') // Target documents table
      .insert({ // Pass insertion object fields
        student_id: studentId, // Map student user identifier
        trip_id: tripId, // Map parent trip identifier
        doc_type: docType, // Map specific document type
        file_url: filePath, // Set path URL
        file_path: filePath, // Set physical file path
        file_name: file.name, // Set physical file name
        status: 'Pending', // Initialize status to Pending review
        version: 1, // Initialize version to 1
      }) // End insert values
      .select() // Request newly created row
      .single() // Expect single object row
    
    // Notify department head about new document upload
    if (data) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', studentId).single()
      const { data: deptHeads } = await supabase.from('profiles').select('id').eq('role', 'departmentHead')
      
      if (deptHeads && profile) {
        const notifications = deptHeads.map(deptHead => ({
          user_id: deptHead.id, // Set recipient to department head ID
          title: 'New Document Uploaded', // Set notification title
          message: `${profile.full_name} has uploaded a new ${docType} document.`, // Set notification message with student name and document type
          type: 'Document', // Set notification type to Document
          trip_id: tripId, // Link notification to trip
          link: '/depthead/documents' // FIXED: removed reference_id, reference_table, and created_by columns that don't exist in schema
        }))
        await supabase.from('notifications').insert(notifications) // Insert notifications
      }
    }
    
    return { document: data, error } // Return creation payload
  } // End conditional block
} // End uploadDocument function
// fetchDocumentsGroupedByTrip gets every document across all trips for the dept head
// joined with student profile and trip title, grouped client-side by trip
export async function fetchAllDocumentsForReview() { // Start fetchAllDocumentsForReview function
  // query all documents joined with student profile and trip info (removed mock mode check - production only)
  const { data, error } = await supabase // Request database query
    .from('documents') // Target documents table
    .select('*, profiles(full_name, student_id_number), trips(title)') // Join fields and nested profiles and trips structures
    .order('uploaded_at', { ascending: false }) // Sort records newest first
  // return the list and any error
  return { documents: data || [], error } // Return results payload
} // End fetchAllDocumentsForReview function
// getDocumentSignedUrl generates a temporary viewable link for a private document
export async function getDocumentSignedUrl(filePath) { // Start getDocumentSignedUrl function
  // request a 1 hour signed url for this file (removed mock mode check - production only)
  const { signedUrl, error } = await getSignedUrl('trip-documents', filePath, 3600) // Generate 3600 seconds private access URL
  // return the signed url and any error
  return { signedUrl, error } // Return retrieval result payload
} // End getDocumentSignedUrl function
// approveDocument marks a document as Approved and notifies the student
export async function approveDocument(documentId, studentId, docType, tripId = null) { // Start approveDocument function
  // update the document status to Approved (removed mock mode check - production only)
  const { data: document, error: updateError } = await supabase // Trigger update query
    .from('documents') // Target documents table
    .update({ // Select update values
      status: 'Approved', // Set status field to Approved
      reviewed_at: new Date().toISOString(), // Record review timestamp
    }) // End updates list
    .eq('id', documentId) // Target designated document ID
    .select()
    .single()
  // if the update failed, return the error
  if (updateError) { // Check if update returned error
    return { error: updateError } // Return error early
  } // End error validation check
  // create a notification for the student with full details
  await createNotification({
    userId: studentId,
    title: 'Document Approved',
    message: `Your ${docType} document has been approved.`,
    type: 'Document',
    referenceId: documentId,
    referenceTable: 'documents',
    tripId: document?.trip_id || tripId,
    actionUrl: '/student/documents'
  })
  // return success
  return { error: null } // Return successful payload
} // End approveDocument function
// rejectDocument marks a document as Rejected with required feedback
export async function rejectDocument(documentId, studentId, docType, feedback, tripId = null) { // Start rejectDocument function
  // update the document row with rejection status and feedback text (removed mock mode check - production only)
  const { data: document, error: updateError } = await supabase // Trigger update query
    .from('documents') // Reference documents table
    .update({ // Select update values
      status: 'Rejected', // Set status field to Rejected
      feedback: feedback, // Assign provided correction feedback text
      reviewed_at: new Date().toISOString(), // Record review timestamp
    }) // End updates list
    .eq('id', documentId) // Target designated document ID
    .select()
    .single()
  // if the update failed, return the error
  if (updateError) { // Check if update returned error
    return { error: updateError } // Return error payload
  } // End error checking block
  // create a notification for the student explaining the rejection with full details
  await createNotification({
    userId: studentId,
    title: 'Document Rejected',
    message: `Your ${docType} document was rejected. Reason: ${feedback}`,
    type: 'Document',
    referenceId: documentId,
    referenceTable: 'documents',
    tripId: document?.trip_id || tripId,
    actionUrl: '/student/documents'
  })
  // return success
  return { error: null } // Return successful payload
} // End rejectDocument function
