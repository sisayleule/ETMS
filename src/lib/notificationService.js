// =====================================================================================================================
// NOTIFICATION SERVICE - Production Real-Time Notification System
// Handles all notification operations using Supabase Database and Realtime
// NO MOCK MODE - Production ready implementation
// This service provides reusable functions to create notifications for any user anywhere in the system
// plus fetch, read, delete helpers and real-time subscription management
// =====================================================================================================================
// import supabase client for database and real-time operations
import { supabase } from './supabase' // Connect to Supabase client singleton

// =====================================================================================================================
// FETCH OPERATIONS
// =====================================================================================================================

// fetchMyNotifications gets the 20 most recent notifications for the logged in user
// @param {string} userId - User ID
// @param {number} limit - Maximum number of notifications to fetch (default: 20)
// @returns {Promise<{notifications, error}>}
export async function fetchMyNotifications(userId, limit = 20) { // Define fetchMyNotifications function with userId and limit parameters
  // query the notifications table filtered by user_id, ordered by creation date descending
  // join only with trips to get trip title - do NOT join profiles as PostgREST cannot auto-resolve it
  const { data, error} = await supabase // Execute Supabase query
    .from('notifications') // Target the notifications table
    .select('*, trips(title)') // Select all notification fields and join with trips for trip title only
    .eq('user_id', userId) // Filter rows where user_id equals the provided userId
    .order('created_at', { ascending: false }) // Sort by created_at timestamp in descending order
    .limit(limit) // Limit the number of results to the specified limit

  // return the fetched notifications array and any database error
  return { notifications: data || [], error } // Output notifications list and error status
} // End fetchMyNotifications function

// fetchUnreadCount returns only the count of unread notifications for the badge
// @param {string} userId - User ID
// @returns {Promise<{count, error}>}
export async function fetchUnreadCount(userId) { // Define fetchUnreadCount function with userId parameter
  // query the notifications table for count only where user_id matches and is_read is false
  const { count, error } = await supabase // Execute Supabase count query
    .from('notifications') // Target the notifications table
    .select('id', { count: 'exact', head: true }) // Request exact count without fetching full rows
    .eq('user_id', userId) // Filter rows where user_id equals the provided userId
    .eq('is_read', false) // Filter rows where is_read is false (unread notifications)

  // return the count value defaulting to 0 if null, and any database error
  return { count: count || 0, error } // Output count value and error status
} // End fetchUnreadCount function

// =====================================================================================================================
// UPDATE OPERATIONS
// =====================================================================================================================

// markNotificationRead marks a single notification as read
// @param {string} notificationId - Notification ID
// @returns {Promise<{error}>}
export async function markNotificationRead(notificationId) { // Define markNotificationRead function with notificationId parameter
  // update the notifications table setting is_read to true for the specified notification
  const { error } = await supabase // Execute Supabase update query
    .from('notifications') // Target the notifications table
    .update({ is_read: true }) // Set is_read field to true
    .eq('id', notificationId) // Filter row where id equals the provided notificationId

  // return any database error
  return { error } // Output error status
} // End markNotificationRead function

// markAllNotificationsRead marks every unread notification as read for this user only
// @param {string} userId - User ID
// @returns {Promise<{error}>}
export async function markAllNotificationsRead(userId) { // Define markAllNotificationsRead function with userId parameter
  // update the notifications table setting is_read to true for all unread notifications of this user
  const { error } = await supabase // Execute Supabase bulk update query
    .from('notifications') // Target the notifications table
    .update({ is_read: true }) // Set is_read field to true
    .eq('user_id', userId) // Filter rows where user_id equals the provided userId
    .eq('is_read', false) // Only update rows where is_read is currently false

  // return any database error
  return { error } // Output error status
} // End markAllNotificationsRead function

// =====================================================================================================================
// DELETE OPERATIONS
// =====================================================================================================================

// deleteNotification removes one notification permanently, only if owned by this user
// @param {string} notificationId - Notification ID
// @returns {Promise<{error}>}
export async function deleteNotification(notificationId) { // Define deleteNotification function with notificationId parameter
  // delete the notification row from the notifications table
  const { error } = await supabase // Execute Supabase delete query
    .from('notifications') // Target the notifications table
    .delete() // Execute delete operation
    .eq('id', notificationId) // Filter row where id equals the provided notificationId

  // return any database error
  return { error } // Output error status
} // End deleteNotification function

// =====================================================================================================================
// CREATE NOTIFICATION HELPERS
// =====================================================================================================================

// createNotification inserts a new notification row for any user
// call this from anywhere in the app right after an important action succeeds
// params: userId (who receives it), title, message, type (must match the enum), link, tripId (optional)
// @param {Object} notification - Notification data with userId, title, message, type, link, tripId
// @returns {Promise<{error}>}
export async function createNotification({ // Define createNotification function accepting destructured params
  userId, // User ID who will receive the notification
  title, // Notification title text
  message, // Notification message text
  type, // Notification type must match enum: Registration, Payment, Document, TripUpdate, Report, Complaint, Emergency, General
  link = null, // Optional link URL for navigation when notification is clicked
  tripId = null // Optional trip ID if notification is related to a specific trip
}) { // Begin createNotification function body
  // wrap in try catch so a failed notification never breaks the main action
  try { // Begin try block for error handling
    // insert the notification row into the notifications table
    const { error } = await supabase // Execute Supabase insert query
      .from('notifications') // Target the notifications table
      .insert({ // Insert new row with provided fields
        user_id: userId, // Set user_id field to the provided userId
        title, // Set title field to the provided title
        message, // Set message field to the provided message
        type, // Set type field to the provided type (must match enum constraint)
        link, // Set link field to the provided link (nullable)
        trip_id: tripId, // Set trip_id field to the provided tripId (nullable)
      }) // End insert fields mapping

    // if supabase returned an error log the FULL error object so RLS or schema
    // failures are immediately visible during development for every notification
    // trigger in the system, not just generic messages that hide the real cause
    if (error) { // If Supabase query returned an error
      console.error('Notification creation failed:', error) // Log full error object including RLS details, not just error.message
      return { error } // Return error object without throwing
    } // End error check block

    // log success so we can trace which notifications fired during testing
    console.log(`Notification sent to ${userId}: "${title}"`) // Log successful notification creation
    return { error: null } // Return success status with no error
  } catch (err) { // Catch any unexpected error from the try block
    // catch any unexpected error and never let it crash the calling action
    console.error('Notification creation error:', err) // Log exception to console
    return { error: err } // Return error object
  } // End catch block
} // End createNotification function

// =====================================================================================================================
// REALTIME SUBSCRIPTION
// =====================================================================================================================

// subscribeToNotifications sets up a real-time channel for new INSERT events
// scoped to this user only via the filter, mirrors the Phase 10 implementation
// @param {string} userId - User ID to subscribe notifications for
// @param {function} onNew - Callback function when new notification arrives
// @returns {RealtimeChannel} Subscription channel object
export function subscribeToNotifications(userId, onNew) { // Define subscribeToNotifications function with userId and callback parameters
  // create a real-time channel subscription for this user's notifications
  const channel = supabase // Access Supabase client
    .channel(`notifications:${userId}`) // Create unique channel name with user ID
    .on( // Listen for postgres changes
      'postgres_changes', // Subscribe to postgres_changes event type
      { // Configure subscription options
        event: 'INSERT', // Listen only for INSERT events (new notifications)
        schema: 'public', // Target public schema
        table: 'notifications', // Target notifications table
        filter: `user_id=eq.${userId}`, // Filter events where user_id equals userId
      }, // End subscription configuration
      (payload) => { // Callback function when event fires
        onNew(payload.new) // Call the provided onNew callback with the new notification data
      } // End callback
    ) // End event listener registration
    .subscribe() // Subscribe to the channel to activate it

  // return the channel object so caller can unsubscribe later
  return channel // Return the active channel subscription
} // End subscribeToNotifications function

// =====================================================================================================================
// UTILITY FUNCTIONS
// =====================================================================================================================

// getNotificationIcon maps each ETMS notification type to an emoji
// @param {string} type - Notification type
// @returns {string} Emoji icon corresponding to the notification type
export function getNotificationIcon(type) { // Define getNotificationIcon function with type parameter
  // create a mapping object from type strings to emoji icons
  const icons = { // Define icons mapping object
    Registration: '📋', // Registration type gets clipboard emoji
    Payment: '💳', // Payment type gets credit card emoji
    Document: '📄', // Document type gets document emoji
    Trip: '🗺️', // Trip type gets map emoji (database uses 'Trip' not 'TripUpdate')
    Report: '📝', // Report type gets memo emoji
    Complaint: '⚠️', // Complaint type gets warning emoji
    Emergency: '🚨', // Emergency type gets siren emoji
    General: '🔔', // General type gets bell emoji
    Announcement: '📢', // Announcement type gets megaphone emoji
  } // End icons mapping object
  // return the emoji for the provided type, defaulting to bell if type not found
  return icons[type] || '🔔' // Return mapped icon or default bell emoji
} // End getNotificationIcon function

// getTimeAgo converts a timestamp to a human readable relative string
// @param {string} timestamp - ISO timestamp string
// @returns {string} Relative time string like "2m ago" or "Just now"
export function getTimeAgo(timestamp) { // Define getTimeAgo function with timestamp parameter
  // calculate the difference in milliseconds between now and the provided timestamp
  const diff = Date.now() - new Date(timestamp).getTime() // Calculate time difference in milliseconds
  // convert the difference to minutes
  const minutes = Math.floor(diff / 60000) // Convert milliseconds to minutes
  // if less than 1 minute, return "Just now"
  if (minutes < 1) return 'Just now' // Return immediate time label
  // if less than 60 minutes, return minutes ago
  if (minutes < 60) return `${minutes}m ago` // Return minutes format
  // convert minutes to hours
  const hours = Math.floor(minutes / 60) // Convert minutes to hours
  // if less than 24 hours, return hours ago
  if (hours < 24) return `${hours}h ago` // Return hours format
  // convert hours to days
  const days = Math.floor(hours / 24) // Convert hours to days
  // return days ago
  return `${days}d ago` // Return days format
} // End getTimeAgo function
