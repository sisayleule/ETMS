// NotificationsPage shows the complete notification history for any logged in user
// it works for both students and department head since notifications are user-scoped
// allows filtering by type and bulk marking as read
import { useState, useEffect } from 'react' // Import React hooks to manage visual state updates and load actions
import { useNavigate } from 'react-router-dom' // Import routing navigation helpers
import { useAuth } from '../../context/AuthContext' // Import auth context hooks to access active user profiles
// Import notification utility services
import {
  fetchMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationIcon,
  getTimeAgo,
} from '../../lib/notificationService' // Import notification service

// the type filter options matching the exact values allowed by the schema
const TYPE_FILTERS = ['All', 'Registration', 'Payment', 'Document', 'Trip', 'Report', 'Complaint', 'Emergency', 'General'] // Allowable category codes matching database constraint

// Define main shared Notifications Page component
function NotificationsPage() { // Begin NotificationsPage functional component definition
  // get the logged in user from auth context
  const { user } = useAuth() // Extract active user details from auth context provider
  // navigate for clicking notifications with links
  const navigate = useNavigate() // Initialize navigate helpers to handle clicked route redirections
  // holds the full list of notifications
  const [notifications, setNotifications] = useState([]) // Manage complete notifications state list
  // loading state while fetching
  const [loading, setLoading] = useState(true) // Maintain loading status boolean indicator
  // currently selected type filter
  const [typeFilter, setTypeFilter] = useState('All') // Manage selected notification type category code state

  // loadNotifications fetches the full notification history
  const loadNotifications = async () => { // Begin loadNotifications definition
    // do not fetch if no user is logged in
    if (!user?.id) return // Halt if user identifier is missing
    setLoading(true) // Turn on loading indicator spinner state
    // fetch all notifications for this user
    const { notifications: data } = await fetchMyNotifications(user.id) // Query complete notifications lists via service
    setNotifications(data || []) // Save retrieved database records to local state
    setLoading(false) // Turn off loading indicator spinner state
  } // End loadNotifications helper function

  // fetch once when page mounts
  useEffect(() => { // Begin useEffect lifecycle trigger
    loadNotifications() // Run notifications initial load triggers
  }, [user]) // Bind triggers dependency to user authentication state

  // handleClick marks a notification as read and navigates if it has a link
  const handleClick = async (notification) => { // Begin handleClick definition
    // only update if currently unread
    if (!notification.is_read) { // Verify if selected row is unread
      // mark as read in the database
      await markNotificationRead(notification.id) // Trigger database updates transaction on backend
      // update local state immediately
      setNotifications((prev) => // Map previous list to swap read status
        prev.map((n) => // Loop through each state record row
          n.id === notification.id ? { ...n, is_read: true } : n // Assign read status boolean to true on match
        ) // End loop mapping
      ) // End state updates
    } // End read check block
    // navigate if the notification has a link
    if (notification.link) { // Verify link URL string exists
      navigate(notification.link) // Redirect page to specific link path destination
    } // End redirection check block
  } // End handleClick function

  // handleMarkAllRead marks all unread notifications as read
  const handleMarkAllRead = async () => { // Begin handleMarkAllRead definition
    if (!user?.id) return // Halt if user session details are missing
    // call the service to update the database
    await markAllNotificationsRead(user.id) // Trigger bulk updates transaction on backend
    // update all local notifications to read
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))) // Dim all items visually
  } // End handleMarkAllRead helper function

  // handleDelete removes a single notification
  const handleDelete = async (event, notificationId) => { // Begin handleDelete definition
    // stop click from triggering the parent notification click handler
    event.stopPropagation() // Prevent click event bubbles to block unintended navigations
    // delete from database
    await deleteNotification(notificationId) // Trigger database deletion transaction on backend
    // remove from local state
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId)) // Filter out deleted notification row
  } // End handleDelete function

  // apply the type filter to the notifications list
  const filteredNotifications = typeFilter === 'All' // If All filter category is active
    ? notifications // Return complete list
    : notifications.filter((n) => n.type === typeFilter) // Else filter rows by matching notification type string

  // count unread notifications for display in the header
  const unreadCount = notifications.filter((n) => !n.is_read).length // Map unread subset length

  return ( // Begin main layout JSX template return
    // page wrapper
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-6 md:p-10"> {/* Page viewport container wrapper */}
      {/* page header row with title and mark all read button */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4"> {/* Flex row layout header wrapper */}
        <div> {/* Header labels area */}
          {/* page title */}
          <h1 className="font-serif text-[#1E3A5F] text-3xl font-bold mb-1">Notifications</h1> {/* Primary page heading */}
          {/* unread count summary */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Subtitle label styling */}
            {unreadCount > 0 // If unread notifications exist
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` // Display unread dynamic string
              : 'All caught up'} {/* Else show default caught up text */}
          </p> {/* Close description paragraph */}
        </div> {/* Close labels area */}

        {/* mark all read button only shown when there are unread notifications */}
        {unreadCount > 0 && ( // Render mark all read buttons if unread counts are positive
          <button // Mark all as read button control
            onClick={handleMarkAllRead} // Run bulk read action on click
            className="text-gold font-sans text-sm hover:text-gold-light transition-colors font-semibold" // Styled action button text
          > {/* Button text wrapper */}
            Mark all as read {/* Action labels text */}
          </button> // Close bulk read button control
        )} {/* Close conditional bulk check */}
      </div> {/* End header row container */}

      {/* type filter tabs, scrollable horizontally on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1"> {/* Horizontally scrollable row wrapping filter tabs */}
        {TYPE_FILTERS.map((filter) => ( // Loop through constant category filters array list
          <button // Type category selection button control
            key={filter} // Bind unique key value
            onClick={() => setTypeFilter(filter)} // Assign active filter on click
            className={`flex-shrink-0 px-3 py-2 rounded-lg font-sans text-xs font-semibold uppercase tracking-wide transition-all ${ // Base filter buttons style templates
              typeFilter === filter // If this tab category is active
                ? 'bg-gold text-charcoal' // Styled golden active tab
                : 'bg-white/5 text-[#5A6F8F] hover:bg-white/10' // Else fall back to muted styling
            }`} // End dynamic class definitions
          > {/* Button label string */}
            {filter} {/* Label matching category filter code string */}
          </button> // Close filter button tag
        ))} {/* Close filters mapping loop */}
      </div> {/* End filter tabs row */}

      {/* loading state */}
      {loading ? ( // Check loading status boolean
        <p className="text-[#8CA5FF] font-sans text-sm tracking-widest uppercase animate-pulse"> {/* Pulsing gold styles */}
          Loading Notifications... {/* Loading placeholder label */}
        </p> // Close loading description
      ) : filteredNotifications.length === 0 ? ( // Else nested check if filtered dataset is empty
        // empty state
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E5EDFF] max-w-md"> {/* Dark empty notice card */}
          <p className="text-3xl mb-3">🔔</p> {/* Visual indicator emoji icon */}
          <p className="text-[#4A5F7F] font-sans text-sm"> {/* Muted details label */}
            No notifications for this filter. {/* Empty results notice message */}
          </p> {/* Close description paragraph */}
        </div> // Close empty notice card
      ) : ( // Else render scroll lists when matching records exist
        // notification list
        <div className="space-y-2 max-w-2xl"> {/* Vertical slot card list stack */}
          {filteredNotifications.map((notification) => ( // Loop through each notification object record row
            <div // Notification layout item card container wrapper
              key={notification.id} // Set unique record key
              onClick={() => handleClick(notification)} // Trigger click actions on card select
              className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:border-white/15 ${ // Visual slot card wrapper styling
                notification.is_read // Depending on read status properties
                  ? 'bg-white border-[#E5EDFF]' // Muted card style for read notifications
                  : 'bg-gold/5 border-gold/20' // Brighter style with gold border highlights for unread notifications
              }`} // End dynamic styling templates
            > {/* Open item layout container */}
              {/* notification type icon in a circle */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${ // Type icon circle style
                notification.is_read ? 'bg-white/5' : 'bg-gold/10' // Swap colors depending on read status
              }`}> {/* Icon circle wrapper */}
                {getNotificationIcon(notification.type)} {/* Query matching emoji icon from types */}
              </div> {/* Close icon circle wrapper */}

              {/* notification content */}
              <div className="flex-1 min-w-0"> {/* Content columns */}
                {/* title row with unread dot */}
                <div className="flex items-center gap-2 mb-1"> {/* Flex row title wrapper */}
                  {/* unread indicator dot */}
                  {!notification.is_read && ( // Render glowing dot indicator if unread
                    <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" /> // Golden dot visual cue
                  )} {/* Close unread indicator check */}
                  {/* title text */}
                  <p className={`font-sans text-sm leading-tight ${ // Dynamic font styling template
                    notification.is_read ? 'text-[#6B7F9F]' : 'text-[#1E3A5F] font-semibold' // Dim text if read
                  }`}> {/* Title wrapper */}
                    {notification.title} {/* Output notification title text values */}
                  </p> {/* Close title text element */}
                </div> {/* Close title row */}

                {/* message text */}
                <p className="text-[#5A6F8F] font-sans text-sm mb-2 leading-snug"> {/* Message text style */}
                  {notification.message} {/* Output detailed notice message text values */}
                </p> {/* Close message text element */}

                {/* bottom row with time, trip name, and type badge */}
                <div className="flex items-center gap-2 flex-wrap"> {/* Footer details row container */}
                  {/* time ago */}
                  <span className="text-white/30 font-sans text-xs"> {/* Soft labels */}
                    {getTimeAgo(notification.created_at)} {/* Convert and print relative timestamp */}
                  </span> {/* Close relative time tag */}

                  {/* trip name if linked */}
                  {notification.trips?.title && ( // Render associated trip details badge if linked
                    <> {/* Fragment wrapper */}
                      <span className="text-white/20 text-xs">•</span> {/* Bullet separator */}
                      <span className="text-gold/60 font-sans text-xs"> {/* Golden style title text */}
                        {notification.trips.title} {/* Output parent trip title text value */}
                      </span> {/* Close trip badge tag */}
                    </> // Close fragment
                  )} {/* Close linked parent trip checks */}

                  {/* notification type badge */}
                  <span className="text-[10px] font-sans text-white/30 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wide"> {/* Grey uppercase type badge */}
                    {notification.type} {/* Output category type code */}
                  </span> {/* Close type badge tag */}
                </div> {/* Close footer details row */}
              </div> {/* Close content columns wrapper */}

              {/* delete button */}
              <button // Dismiss single notification button control
                onClick={(e) => handleDelete(e, notification.id)} // Remove record on click
                className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 text-sm" // styled dismiss cross icon
                aria-label="Delete notification" // Accessiblity labels string
              > {/* Button text wrapper */}
                ✕ {/* Cross unicode character symbol */}
              </button> {/* Close dismiss button control */}
            </div> // Close notification layout item card container wrapper
          ))} {/* Close notifications map loops */}
        </div> // Close vertical slot card list stack
      )} {/* Close empty check conditional block */}
    </div> // End page viewport container wrapper
  ) // End return statement
} // End NotificationsPage functional component block
export default NotificationsPage // Export NotificationsPage component as default
