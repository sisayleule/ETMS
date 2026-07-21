// NotificationBell is a self-contained component that shows in the nav bar
// it displays the unread count badge and opens a dropdown with recent notifications
// it subscribes to real-time events so new notifications appear without page refresh
import { useState, useEffect, useRef } from 'react' // Import React hooks to manage states, reference targets, and run lifecycles
import { useNavigate } from 'react-router-dom' // Import hook to navigate routes programmatically
import { useAuth } from '../context/AuthContext' // Import useAuth custom context hook to retrieve active user details
// Import notification helpers and service methods
import {
  fetchMyNotifications, // Import function to fetch all notifications for a user
  fetchUnreadCount, // Import function to get count of unread notifications
  markNotificationRead, // Import function to mark a single notification as read
  markAllNotificationsRead, // Import function to mark all notifications as read
  deleteNotification, // Import function to delete a notification
  subscribeToNotifications, // Import function to subscribe to real-time notification events
  getNotificationIcon, // Import function to get emoji icon for notification type
  getTimeAgo, // Import function to convert timestamp to relative time string
} from '../lib/notificationService' // Import notification service
import { supabase } from '../lib/supabase' // Import Supabase client instance specifically for subscription cleanup processes

// Define NotificationBell functional component
function NotificationBell() { // Begin NotificationBell definition
  // get the logged in user from auth context
  const { user } = useAuth() // Extract active user object from auth context provider
  // navigate for clicking notifications that have a link
  const navigate = useNavigate() // Initialize navigate helper to handle clicks redirecting routes
  // holds the list of notifications shown in the dropdown
  const [notifications, setNotifications] = useState([]) // Manage local notifications array list state
  // holds the count of unread notifications shown in the badge
  const [unreadCount, setUnreadCount] = useState(0) // Manage integer state tracking unread badge count
  // controls whether the dropdown panel is open or closed
  const [isOpen, setIsOpen] = useState(false) // Manage dropdown expansion visibility toggle state
  // loading state while fetching notifications for the first time
  const [loading, setLoading] = useState(true) // Manage loading boolean state for fetching actions
  // ref to the dropdown container for detecting outside clicks to close it
  const dropdownRef = useRef(null) // Setup reference pointer to track dropdown card HTML nodes

  // loadNotifications fetches the full list and unread count together
  const loadNotifications = async () => { // Begin loadNotifications definition
    // do not fetch if no user is logged in
    if (!user?.id) return // Halt if user identifier is missing
    
    // fetch the full notifications list
    const { notifications: data, error: fetchError } = await fetchMyNotifications(user.id) // Query notifications list via service
    
    if (fetchError) {
      console.error('❌ Error fetching notifications:', fetchError)
    }
    
    setNotifications(data || []) // Save retrieved dataset rows to state
    // fetch the unread count for the badge
    const { count, error: countError } = await fetchUnreadCount(user.id) // Query unread count value
    
    if (countError) {
      console.error('❌ Error fetching unread count:', countError)
    }
    
    setUnreadCount(count || 0) // Save unread count to state
    // stop showing the loading state
    setLoading(false) // Deactivate loading indicators
  } // End loadNotifications helper function

  // set up real-time subscription and initial load when component mounts
  useEffect(() => { // Begin useEffect lifecycle trigger for real-time channels
    // do not set up if no user is logged in
    if (!user?.id) return // Halt if user details are missing
    
    // load notifications for the first time
    loadNotifications() // Trigger load helper function on mounting
    
    // subscribe to real-time new notification events for this user
    console.log('🔔 NotificationBell: Subscribing to realtime notifications...')
    const channel = subscribeToNotifications(user.id, (newNotification) => { // Create subscriber channel mapping
      console.log('🎉 NEW NOTIFICATION RECEIVED via Realtime:', newNotification)
      // when a new notification arrives add it to the top of the local list
      setNotifications((prev) => [newNotification, ...prev]) // Unshift new entity row into state list
      // increment the unread badge count by 1
      setUnreadCount((prev) => prev + 1) // Increment unread count by 1
    }) // End real-time subscriber registration
    
    // cleanup function runs when the component unmounts
    // removes the subscription to prevent memory leaks
    return () => { // Begin cleanup function definition
      console.log('🔔 NotificationBell: Cleaning up subscription')
      if (channel) { // If channel mapping object is initialized
        if (typeof channel.unsubscribe === 'function') { // Check if channel is mock poll instance containing unsubscribe
          channel.unsubscribe() // Trigger mock polling cleanup method
        } else { // Else it is real Supabase channel handler
          supabase.removeChannel(channel) // Unsubscribe real-time Supabase subscription channel safely
        } // End of conditional type checks block
      } // End of channel presence validation checks block
    } // End cleanup returning block
  }, [user?.id]) // Re-run effect triggers if user identity ID changes

  // close the dropdown when clicking outside of it
  useEffect(() => { // Begin useEffect lifecycle trigger for outside page clicks
    // handler function checks if click was outside the dropdown ref
    const handleClickOutside = (event) => { // Begin handleClickOutside definition
      // if the dropdown ref exists and the click was not inside it
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { // If target resides outside dropdown node
        // close the dropdown
        setIsOpen(false) // Collapse dropdown visual overlay card
      } // End outside validation checks block
    } // End handleClickOutside definition
    // add the event listener to the document
    document.addEventListener('mousedown', handleClickOutside) // Bind mousedown triggers globally
    // cleanup removes the listener when the component unmounts
    return () => { // Begin unmount cleanup definitions
      document.removeEventListener('mousedown', handleClickOutside) // Unbind mousedown triggers globally
    } // End cleanup returning block
  }, []) // Empty dependencies array runs effect only once on mount

  // handleBellClick toggles the dropdown open and closed
  const handleBellClick = () => { // Begin handleBellClick definition
    setIsOpen((prev) => !prev) // Toggle dropdown display status boolean state
  } // End handleBellClick function

  // handleNotificationClick marks a notification as read and navigates if it has a link
  const handleNotificationClick = async (notification) => { // Begin handleNotificationClick definition
    // only mark as read if it is currently unread
    if (!notification.is_read) { // Verify if notification is currently unread
      // call the service to mark it read in the database
      await markNotificationRead(notification.id) // Trigger backend read status updates transaction
      // update local state to reflect the change immediately
      setNotifications((prev) => // Map state array to update targeted item
        prev.map((n) => // Loop through previous records list
          n.id === notification.id ? { ...n, is_read: true } : n // Mark read status as true on matching node
        ) // End array mapping
      ) // End notifications state updates
      // decrement the unread badge count
      setUnreadCount((prev) => Math.max(0, prev - 1)) // Decrement unread count, bounding at zero
    } // End read check block
    
    // Close dropdown immediately
    setIsOpen(false) // Collapse dropdown visual overlay card
    
    // Navigate to the link if provided in the notification
    if (notification.link) { // Check if notification has a link field
      navigate(notification.link) // Navigate to the provided link URL
    } // End link check block
  } // End handleNotificationClick function

  // handleMarkAllRead marks every unread notification as read
  const handleMarkAllRead = async () => { // Begin handleMarkAllRead definition
    if (!user?.id) return // Verify user is ready
    // call the service to update all unread notifications in the database
    await markAllNotificationsRead(user.id) // Trigger bulk read status transaction on backend
    // update all notifications in local state to is_read true
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))) // Dim all items visually
    // reset the badge count to zero
    setUnreadCount(0) // Assign unread count to zero
  } // End handleMarkAllRead function

  // handleDelete removes one notification from the list
  const handleDelete = async (event, notificationId) => { // Begin handleDelete definition
    // stop the click from bubbling up to the notification click handler
    event.stopPropagation() // Prevent link navigations or dropdown closings from trigger actions
    // call the service to delete from database
    await deleteNotification(notificationId) // Trigger backend deletion transaction
    // check if this notification was unread before removing it
    const wasUnread = notifications.find((n) => n.id === notificationId && !n.is_read) // Search state target
    // remove from local state
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId)) // Filter out deleted record
    // if it was unread decrement the count
    if (wasUnread) { // If deleted notification is unread
      setUnreadCount((prev) => Math.max(0, prev - 1)) // Decrement unread count, bounding at zero
    } // End wasUnread check block
  } // End handleDelete function

  return ( // Begin JSX template return
    // outer wrapper with relative positioning to anchor the dropdown
    <div className="relative inline-block text-left" ref={dropdownRef}> {/* Dropdown anchoring wrapper container */}
      {/* BELL BUTTON */}
      <button // Toggle button control
        onClick={handleBellClick} // Toggle dropdown on click
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors focus:outline-none flex items-center justify-center" // Styled hoverable button
        aria-label="Notifications" // Accessiblity label string
      > {/* Button contents wrapper */}
        {/* bell icon using unicode character */}
        <span className="text-white/70 text-xl leading-none">🔔</span> {/* Text label icon */}
        {/* unread count badge, only shows when count is greater than zero */}
        {unreadCount > 0 && ( // Render unread badge if count is greater than zero
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-sans font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none"> {/* Red badge design wrapper styling */}
            {/* show 9+ when count exceeds 9 to prevent badge overflow */}
            {unreadCount > 9 ? '9+' : unreadCount} {/* Output display badge values */}
          </span> // Close badge tag
        )} {/* Close unreadCount badge check */}
      </button> {/* Close bell button control */}

      {/* DROPDOWN PANEL, only rendered when isOpen is true */}
      {isOpen && ( // Render dropdown contents visual card if open is true
        <div className="absolute right-0 top-12 w-80 bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"> {/* Absolute dropdown wrapper */}
          {/* dropdown header with title and mark all read button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"> {/* Header row wrapper container */}
            {/* dropdown title */}
            <p className="text-white font-sans text-sm font-semibold">Notifications</p> {/* Left header labels */}
            {/* mark all read button, only shows when there are unread notifications */}
            {unreadCount > 0 && ( // Render bulk read action triggers if unread counts exist
              <button // Bulk read action button
                onClick={handleMarkAllRead} // Mark all as read on click
                className="text-gold font-sans text-xs hover:text-gold-light transition-colors" // Golden highlights trigger
              > {/* Button label wrapper */}
                Mark all read {/* Action label string */}
              </button> // Close bulk button
            )} {/* Close bulk check conditional block */}
          </div> {/* Close header row container */}

          {/* notification list scrollable area with max height */}
          <div className="max-h-96 overflow-y-auto"> {/* Scroll container */}
            {/* loading state shown on first open before data arrives */}
            {loading ? ( // Render loading feedback if loading is true
              <p className="text-white/40 font-sans text-xs text-center py-6 px-4"> {/* Muted text styling */}
                Loading... {/* Loading text strings */}
              </p> // Close loading description
            ) : notifications.length === 0 ? ( // Nested empty checks if list has zero items
              // empty state when no notifications exist
              <div className="px-4 py-8 text-center"> {/* Empty text wrapper */}
                <p className="text-3xl mb-2">🔔</p> {/* Icon indicator */}
                <p className="text-white/40 font-sans text-sm">No notifications yet</p> {/* Helper description */}
              </div> // Close empty display
            ) : ( // Render listing items if rows exist
              // map through notifications and render each one
              notifications.map((notification) => ( // Loop through notification rows
                <div // Individual notification list item card container
                  key={notification.id} // Unique notification row key
                  onClick={() => handleNotificationClick(notification)} // Trigger notification click actions
                  className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${ // Item card layout styles
                    // unread notifications have a subtle gold left border and slightly brighter background
                    !notification.is_read ? 'border-l-2 border-l-gold bg-gold/5' : '' // Golden highlight for unread items
                  }`} // End dynamic class templates
                > {/* Card items grid wrapper */}
                  {/* notification type icon */}
                  <span className="text-lg flex-shrink-0 mt-0.5"> {/* Icon sizing wrapper */}
                    {getNotificationIcon(notification.type)} {/* Retrieve type specific emoji */}
                  </span> {/* Close icon wrapper */}
                  {/* notification content area */}
                  <div className="flex-1 min-w-0"> {/* Content columns */}
                    {/* notification title */}
                    <p className={`font-sans text-xs leading-tight mb-0.5 ${ // Dynamic font weight template
                      notification.is_read ? 'text-white/60' : 'text-white font-semibold' // Style differences depending on read status
                    }`}> {/* Text tag wrapper */}
                      {notification.title} {/* Title text values */}
                    </p> {/* Close title text element */}
                    {/* notification message, truncated if too long */}
                    <p className="text-white/40 font-sans text-[11px] leading-snug line-clamp-2"> {/* Truncate after 2 lines */}
                      {notification.message} {/* Detailed notice text values */}
                    </p> {/* Close message text element */}
                    {/* time ago and trip name if linked to a trip */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap"> {/* Timestamp row footer container */}
                      <span className="text-white/30 font-sans text-[10px]"> {/* Soft text labels */}
                        {getTimeAgo(notification.created_at)} {/* Display formatted relative time */}
                      </span> {/* Close relative time tag */}
                      {notification.trips?.title && ( // Render parent trip title badge if linked
                        <> {/* Fragment container */}
                          <span className="text-white/20 text-[10px]">•</span> {/* Bullet separator */}
                          <span className="text-gold/60 font-sans text-[10px] truncate max-w-[120px]"> {/* Truncate long titles */}
                            {notification.trips.title} {/* Output trip title text values */}
                          </span> {/* Close trip label tag */}
                        </> // Close fragment
                      )} {/* Close parent trip title check */}
                    </div> {/* Close timestamp footer row */}
                  </div> {/* Close content container columns */}
                  {/* delete button appears on hover */}
                  <button // Dismiss button action
                    onClick={(e) => handleDelete(e, notification.id)} // Remove item on click
                    className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 text-xs mt-0.5" // styled cross icon
                    aria-label="Delete notification" // Accessiblity labels
                  > {/* Button icon content */}
                    ✕ {/* Cross unicode character */}
                  </button> {/* Close dismiss button control */}
                </div> // Close individual notification card container
              )) // End notification cards rendering loops
            )} {/* End loading checks block */}
          </div> {/* Close scroll container wrapper */}

          {/* dropdown footer with link to full notifications page */}
          <div className="px-4 py-3 border-t border-white/5 bg-white/[0.01]"> {/* Card footer layout container wrapper */}
            <button // Redirection trigger button control
              onClick={() => { // Click callback
                // navigate to the full notifications page based on role
                // we check the URL to determine role since we do not import useAuth here
                navigate( // Redirect path
                  window.location.pathname.startsWith('/student') // If active path targets student portals
                    ? '/student/notifications' // Route to student notifications page
                    : '/depthead/notifications' // Else route to department head notifications page
                ) // End navigation redirect URL string
                setIsOpen(false) // Collapse dropdown visual overlay card
              }} // End navigation triggers block
              className="text-gold font-sans text-xs hover:text-gold-light transition-colors w-full text-center block font-semibold" // Styled action button text
            > {/* Button label text wrapper */}
              View all notifications → {/* Footer label text link */}
            </button> {/* Close redirect button control */}
          </div> {/* Close footer container wrapper */}
        </div> // Close absolute dropdown card panel
      )} {/* Close dropdown conditional rendering checks block */}
    </div> // End dropdown anchoring container wrapper
  ) // End layout return statement
} // End NotificationBell functional component block
export default NotificationBell // Export default bell component as default for global reuse
