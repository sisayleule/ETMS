// =====================================================================================================================
// ROOT APPLICATION COMPONENT
// Configures client-side React Router mappings, wraps the application structure in AuthProvider,
// and enforces role-based route guard verification checks on secure dashboard subpages.
// =====================================================================================================================
import React from 'react' // Import React for component rendering and JSX context structures
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom' // Import routing primitives to handle navigation routes

import { AuthProvider } from './context/AuthContext' // Import global AuthProvider to inject current user session state
import ProtectedRoute from './components/ProtectedRoute' // Import ProtectedRoute wrapper component to guard authorized endpoints

import WelcomePage from './pages/WelcomePage' // Import the cinematic welcome page component served at the root path
import LoginPage from './pages/auth/LoginPage' // Import the user authentication login screen component
import RegisterPage from './pages/auth/RegisterPage' // Import the student account registration screen component
import Unauthorized from './pages/Unauthorized' // Import the fallback route page displayed for forbidden access errors

import StudentLayout from './layouts/StudentLayout' // Import the persistent student layouts container shell
import DashboardHome from './pages/student/DashboardHome' // Import the unified dashboard home landing page component
import ProfilePage from './pages/student/ProfilePage' // Import the student profile details management page
import BrowseTripsPage from './pages/student/BrowseTripsPage' // Import the student browse trips catalog page
import TripDetailPage from './pages/student/TripDetailPage' // Import the student trip detail and registration page
import MyTripsPage from './pages/student/MyTripsPage' // Import the student registered trips and logs page
import DeptHeadLayout from './layouts/DeptHeadLayout' // Import the persistent department head layouts container shell
import DeptHeadDashboardHome from './pages/depthead/DeptHeadDashboardHome' // Import the department head dashboard home landing page component
import StatisticsPage from './pages/depthead/StatisticsPage' // Import statistics analytics page
import TripListPage from './pages/depthead/TripListPage' // Import the department head trip list dashboard page
import TripFormPage from './pages/depthead/TripFormPage' // Import the department head trip creation and editing form page
import DeptHeadTripDetailPage from './pages/depthead/TripDetailPage' // Import the department head trip detail and student roster page
import ApplicantsPage from './pages/depthead/ApplicantsPage' // Import student account management page
import StudentDetailPage from './pages/depthead/StudentDetailPage' // Import individual student detail page
import RegistrationApprovalsPage from './pages/depthead/RegistrationApprovalsPage' // Import registration approvals page
import PaymentTrackingPage from './pages/depthead/PaymentTrackingPage' // Import payment tracking page
import TripDocumentsPage from './pages/student/TripDocumentsPage' // Import student documents page
import DocumentReviewPage from './pages/depthead/DocumentReviewPage' // Import document review page
import MyReportsPage from './pages/student/MyReportsPage' // Import student trip reports page (renamed from TripReportsPage for better organization)
import TripReportsReviewPage from './pages/depthead/TripReportsReviewPage' // Import department head trip reports review page (migrated single-report model)
import ComplaintsPage from './pages/student/ComplaintsPage' // Import student complaints page
import ComplaintManagementPage from './pages/depthead/ComplaintManagementPage' // Import department head complaints management page
import NotificationsPage from './pages/shared/NotificationsPage' // Import shared notifications history page for students and department heads

import TripJournalPage from './pages/student/TripJournalPage' // Import student private trip journal diary entries page
import TripJournalListPage from './pages/student/TripJournalListPage' // Import student trip journal list overview page
import SettingsPage from './pages/student/SettingsPage' // Import student settings page
import DeptHeadSettingsPage from './pages/depthead/DeptHeadSettingsPage' // Import department head settings page

export default function App() { // Define the default root App component configuration block
  return ( // Render the client-side routing environment wrapper hierarchy
    <BrowserRouter> {/* Set up the BrowserRouter container to handle address bar location updates */}
      <AuthProvider> {/* Wrap the routes inside the AuthProvider to broadcast session updates to all page contexts */}
        <Routes> {/* Container block representing all mapped routing definitions */}
          
          {/* ========================================================== */}
          {/* PUBLIC NAVIGATION ENDPOINTS                                */}
          {/* ========================================================== */}
          
          <Route path="/" element={<WelcomePage />} /> {/* Render the cinematic three-language welcome page on the root path */}
          
          <Route path="/login" element={<LoginPage />} /> {/* Render the split-screen authentication entry point on the login path */}
          
          <Route path="/register" element={<RegisterPage />} /> {/* Render the registration form on the register path for new student accounts */}
          
          <Route path="/unauthorized" element={<Unauthorized />} /> {/* Render the access denied informational panel on the unauthorized path */}

          {/* ========================================================== */}
          {/* PROTECTED STUDENT PORTAL ENDPOINTS                         */}
          {/* ========================================================== */}
          
          <Route // Define route path parameters for nested student-specific pages
            path="/student" // Parent route matching the student sub-path
            element={ // Open elements wrapper mapping
              <ProtectedRoute allowedRoles={['student']}> {/* Force login checking and authorize only user accounts with student role */}
                <StudentLayout /> {/* Render the persistent student layout shell wrapper container */}
              </ProtectedRoute> // Close ProtectedRoute wrapper
            } // Close elements mapping
          > {/* Open children routes array */}
            <Route // Define route parameters for dashboard index fallback redirection
              index // Match default index path `/student`
              element={<Navigate to="dashboard" replace />} // Redirect users dynamically to dashboard
            /> {/* Close redirect route block */}

            <Route // Define route path parameters for the dashboard home page
              path="dashboard" // Route matching /student/dashboard
              element={<DashboardHome />} // Render the student dashboard home component
            /> {/* Close dashboard route block */}

            <Route // Define route path parameters for managing student profile info
              path="profile" // Route matching /student/profile
              element={<ProfilePage />} // Render the main student profile component
            /> {/* Close profile route block */}

            <Route // Define route path parameters for browsing all published trips
              path="trips" // Route matching /student/trips
              element={<BrowseTripsPage />} // Render the browse trips page component
            /> {/* Close browse trips route block */}

            <Route // Define route path parameters for viewing individual trip details
              path="trips/:id" // Route matching student trip detail by ID
              element={<TripDetailPage />} // Render the trip detail page component
            /> {/* Close trip detail route block */}

            <Route // Define route path parameters for viewing student registration log history
              path="my-trips" // Route matching student registered trips page
              element={<MyTripsPage />} // Render the student registered trips page component
            /> {/* Close my trips route block */}

            <Route // Define route path parameters for uploading student trip documents
              path="trips/:id/documents" // Route matching student trip documents page
              element={<TripDocumentsPage />} // Render the student trip documents page component
            /> {/* Close trip documents route block */}

            <Route // Define route path parameters for trip-specific reports (legacy route for backward compatibility - kept for direct access)
              path="trips/:id/reports" // Route matching student trip reports by trip ID (redirects to general reports page)
              element={<MyReportsPage />} // Render the student My Reports page component (renamed from TripReportsPage)
            /> {/* Close trip-specific reports route block */}

            <Route // Define route path parameters for uploading student trip reports - new dedicated My Reports page
              path="my-reports" // Route matching student My Reports page at /student/my-reports (new primary reports location)
              element={<MyReportsPage />} // Render the student My Reports page component with all report functionality
            /> {/* Close My Reports route block */}

            <Route // Define route path parameters for uploading student trip reports (legacy path for backward compatibility)
              path="reports" // Route matching student trip reports page at /student/reports (old path kept for compatibility)
              element={<MyReportsPage />} // Render the student My Reports page component (renamed from TripReportsPage)
            /> {/* Close trip reports route block */}

            <Route // Define route path parameters for student complaints submission
              path="complaints" // Route matching student complaints page
              element={<ComplaintsPage />} // Render the student complaints page component
            /> {/* Close student complaints route block */}

            <Route // Define route path parameters for student notifications history
              path="notifications" // Route matching student notifications page
              element={<NotificationsPage />} // Render the student notifications history page component
            /> {/* Close student notifications route block */}

            <Route // Define route path parameters for trip journal overview list page
              path="journal" // Route matching /student/journal (main journal landing page)
              element={<TripJournalListPage />} // Render the trip journal list page component showing all registered trips
            /> {/* Close trip journal list route block */}

            <Route // Define route path parameters for private trip journal logs page
              path="trips/:id/journal" // Route matching /student/trips/:id/journal (trip-specific journal entries)
              element={<TripJournalPage />} // Render the trip journal page component
            /> {/* Close trip journal route block */}

            <Route // Define route path parameters for student settings and preferences page
              path="settings" // Route matching /student/settings
              element={<SettingsPage />} // Render the settings page component
            /> {/* Close settings route block */}
          </Route> {/* Close parent student portal route block */}

          {/* ========================================================== */}
          {/* PROTECTED DEPARTMENT HEAD ENDPOINTS                        */}
          {/* ========================================================== */}
          
          <Route // Define route path parameters for department head nested administrative pages
            path="/depthead" // Parent route matching the department head sub-path
            element={ // Open elements wrapper mapping
              <ProtectedRoute allowedRoles={['departmentHead']}> {/* Enforce authorization check restricting access to department heads */}
                <DeptHeadLayout /> {/* Render the persistent department head layout shell wrapper container */}
              </ProtectedRoute> // Close ProtectedRoute wrapper
            } // Close elements mapping
          > {/* Open children routes array */}
            <Route // Define route parameters for dashboard index fallback redirection
              index // Match default index path `/depthead`
              element={<Navigate to="dashboard" replace />} // Redirect users dynamically to dashboard
            /> {/* Close redirect route block */}

            <Route
              path="dashboard"
              element={<DeptHeadDashboardHome />}
            />

            <Route
              path="statistics"
              element={<StatisticsPage />}
            />

            <Route
              path="trips"
              element={<TripListPage />}
            />

            <Route
              path="trips/new"
              element={<TripFormPage />}
            />

            <Route // Define route path parameters for trip edit form
              path="trips/:id/edit" // Route matching /depthead/trips/:id/edit (trip editing form)
              element={<TripFormPage />} // Render the department head trip form page component in edit mode
            /> {/* Close trip edit route block */}

            <Route // Define route path parameters for trip detail view with student roster
              path="trips/:tripId" // Route matching /depthead/trips/:tripId (trip detail page for viewing students and sending announcements)
              element={<DeptHeadTripDetailPage />} // Render the department head trip detail page component
            /> {/* Close trip detail route block */}

            <Route
              path="applicants"
              element={<ApplicantsPage />}
            />

            <Route
              path="applicants/:id"
              element={<StudentDetailPage />}
            />

            <Route
              path="approvals"
              element={<RegistrationApprovalsPage />}
            />

            <Route // Define route path parameters for system-wide student payments tracking
              path="payments" // Route matching /depthead/payments
              element={<PaymentTrackingPage />} // Render the payment tracking page component
            /> {/* Close payments route block */}

            <Route // Define route path parameters for reviewing uploaded documents
              path="documents" // Route matching /depthead/documents
              element={<DocumentReviewPage />} // Render the document review page component
            /> {/* Close document review route block */}

            <Route // Define route path parameters for reviewing and managing student trip reports
              path="reports" // Route matching /depthead/reports
              element={<TripReportsReviewPage />} // Render the trip reports review page component with single-report model
            /> {/* Close trip reports review route block */}

            <Route // Define route path parameters for resolving student complaints
              path="complaints" // Route matching /depthead/complaints
              element={<ComplaintManagementPage />} // Render the complaint management page component
            /> {/* Close complaints review route block */}

            <Route // Define route path parameters for department head notifications center history
              path="notifications" // Route matching /depthead/notifications
              element={<NotificationsPage />} // Render the department head notifications history page component
            /> {/* Close department head notifications route block */}

            <Route // Define route path parameters for department head settings and preferences page
              path="settings" // Route matching /depthead/settings
              element={<DeptHeadSettingsPage />} // Render the department head settings page component
            /> {/* Close settings route block */}
            
            <Route // LEGACY REDIRECT: Old notification links pointed to /depthead/registrations which doesn't exist
              path="registrations" // Route matching /depthead/registrations (old notification link)
              element={<Navigate to="/depthead/approvals" replace />} // Redirect to correct approvals page
            /> {/* Close legacy redirect route block */}
          </Route> {/* Close parent department head portal route block */}

          {/* ========================================================== */}
          {/* FALLBACK REDIRECTION                                       */}
          {/* ========================================================== */}
          
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect any unmatched paths back to the home page replacing history */}

        </Routes> {/* Close routing container block */}
      </AuthProvider> {/* Close AuthProvider wrapper container */}
    </BrowserRouter> // Close BrowserRouter route manager
  ) // Close return statement
} // Close the App functional component configuration block
