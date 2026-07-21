import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchApplicants, banStudent, unbanStudent, deleteStudent } from '../../lib/depthead/applicantService'

function ApplicantsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [actioningId, setActioningId] = useState(null)
  const [banModal, setBanModal] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => {
    loadStudents()
  }, [search, statusFilter, page])

  async function loadStudents() {
    setLoading(true)
    const { students: data, totalPages: pages, error: err } = await fetchApplicants({
      search,
      status: statusFilter,
      page,
      limit: 20,
    })
    setStudents(data)
    setTotalPages(pages)
    setError(err?.message || null)
    setLoading(false)
  }

  async function handleBan() {
    if (!banReason.trim()) {
      setError('Ban reason is required')
      return
    }

    if (banModal.id === user.id) {
      setError('You cannot ban yourself')
      return
    }

    setActioningId(banModal.id)
    const { error: err } = await banStudent({
      studentId: banModal.id,
      adminId: user.id,
      reason: banReason,
    })

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Student banned successfully')
      setBanModal(null)
      setBanReason('')
      loadStudents()
      setTimeout(() => setSuccess(null), 3000)
    }
    setActioningId(null)
  }

  async function handleUnban(student) {
    if (student.id === user.id) {
      setError('You cannot unban yourself')
      return
    }

    setActioningId(student.id)
    const { error: err } = await unbanStudent({
      studentId: student.id,
      adminId: user.id,
    })

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Student unbanned successfully')
      loadStudents()
      setTimeout(() => setSuccess(null), 3000)
    }
    setActioningId(null)
  }

  async function handleDelete() {
    if (!deleteReason.trim()) { // Check if deletion reason field is empty
      setError('Deletion reason is required') // Show error message requiring reason input
      return // Exit function without proceeding
    } // End reason validation check

    if (deleteModal.id === user.id) {
      setError('You cannot delete yourself')
      return
    }

    setActioningId(deleteModal.id)
    const { error: err } = await deleteStudent({
      studentId: deleteModal.id,
      adminId: user.id,
      reason: deleteReason,
    })

    if (err) { // Check if the deleteStudent function returned an error
      setError(err.message) // Display the error message to department head
    } else { // If deactivation succeeded without errors
      setSuccess('Student account deactivated successfully') // Changed success message from "deleted" to "deactivated" to reflect reality
      setDeleteModal(null) // Close the modal by clearing deleteModal state
      setDeleteReason('') // Clear the reason input field
      loadStudents() // Refresh the students list to show updated status
      setTimeout(() => setSuccess(null), 3000) // Auto-hide success message after 3 seconds
    } // End error check
    setActioningId(null) // Clear the actioning ID to re-enable buttons
  } // End handleDelete function

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Applicants</h1>
          <p className="mt-2 text-gray-600">Manage all student accounts</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Students</option>
                <option value="active">Active Only</option>
                <option value="banned">Banned Only</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No students found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {student.profile_photo ? (
                            <img src={student.profile_photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                              {student.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                            <div className="text-sm text-gray-500">{student.student_id_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{student.email}</div>
                        <div className="text-sm text-gray-500">{student.phone_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        {student.account_status === 'banned' || student.is_banned ? ( // Check NEW account_status column first, fallback to legacy is_banned for backwards compatibility
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Banned
                          </span>
                        ) : ( // If account is not banned, show active status
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/depthead/applicants/${student.id}`)} // Navigate to detailed student profile view page
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {!(student.account_status === 'banned' || student.is_banned) ? ( // Check if student is currently NOT banned using NEW account_status column with legacy fallback
                          <button
                            onClick={() => setBanModal(student)} // Open ban confirmation modal with student data
                            disabled={actioningId === student.id} // Disable button while action is in progress
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            Ban
                          </button>
                        ) : ( // If student is currently banned, show unban button instead
                          <button
                            onClick={() => handleUnban(student)} // Execute unban action immediately
                            disabled={actioningId === student.id} // Disable button while action is in progress
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Unban
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModal(student)} // Open deactivate confirmation modal with student data
                          disabled={actioningId === student.id} // Disable button while action is in progress
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Deactivate {/* Changed label from "Delete" to "Deactivate" to accurately reflect client-side limitation */}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {banModal && ( // Check if ban modal state contains student data to display modal
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"> {/* Translucent dark backdrop with blur — dims and softens page content behind modal while keeping it visibly present */}
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ban Student</h3>
              <p className="text-sm text-gray-600 mb-2">
                Please provide the reason for banning this student. This reason will be sent to the student as a notification.
              </p>
              <p className="text-sm text-gray-700 mb-4">
                You are about to ban <strong>{banModal.full_name}</strong>.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Ban (Required) *
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Examples:&#10;- Violation of ETMS rules&#10;- Submission of false information&#10;- Academic misconduct&#10;- Inappropriate behavior&#10;- Other"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setBanModal(null)
                    setBanReason('')
                    setError(null)
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBan}
                  disabled={actioningId === banModal.id || !banReason.trim()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {actioningId === banModal.id ? 'Banning...' : 'Ban Student'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteModal && ( // Check if delete modal state contains student data to display modal
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"> {/* Translucent dark backdrop with blur — dims and softens page content behind modal while keeping it visibly present */}
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"> {/* Modal container card */}
              <h3 className="text-lg font-semibold text-red-900 mb-4">Deactivate Account</h3> {/* Changed title from "Delete Student" to "Deactivate Account" to accurately reflect action */}
              <p className="text-sm text-gray-600 mb-2">
                Deactivating this account will prevent the student from accessing ETMS. {/* Updated message to reflect deactivation not deletion */}
              </p>
              <p className="text-sm text-gray-700 mb-4">
                You are about to deactivate the account for <strong>{deleteModal.full_name}</strong>. {/* Show student name in confirmation */}
              </p>
              <p className="text-sm text-red-600 mb-4">
                The student will not be able to log in or use any ETMS features while deactivated. You can reverse this action using the Unban button. {/* Clarify that this is reversible unlike permanent deletion */}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Note: This does not permanently delete the student's data or Supabase Auth account. For true permanent deletion, a server-side Edge Function is required. {/* Flag the client-side limitation clearly */}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Deactivation (Required) * {/* Updated label from "Deletion" to "Deactivation" */}
              </label>
              <textarea
                value={deleteReason} // Bind textarea to deleteReason state
                onChange={(e) => setDeleteReason(e.target.value)} // Update state on input change
                rows={4} // Set textarea height to 4 rows
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" // Styling for textarea input
                placeholder="Examples:&#10;- Duplicate account&#10;- Student graduated&#10;- Requested account removal&#10;- Incorrect registration&#10;- Policy violation&#10;- Other" // Provide example reasons as placeholder
              />
              <div className="mt-4 flex justify-end gap-3"> {/* Button container with spacing */}
                <button
                  onClick={() => { // Define cancel button click handler
                    setDeleteModal(null) // Close modal by clearing deleteModal state
                    setDeleteReason('') // Clear the reason input field
                    setError(null) // Clear any existing error messages
                  }} // End onClick handler
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400" // Styling for cancel button
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete} // Execute deactivation action on click
                  disabled={actioningId === deleteModal.id || !deleteReason.trim()} // Disable button if action in progress or reason is empty
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" // Styling for deactivate button
                >
                  {actioningId === deleteModal.id ? 'Deactivating...' : 'Deactivate Account'} {/* Show loading text during action, changed from "Delete Permanently" to "Deactivate Account" */}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicantsPage
