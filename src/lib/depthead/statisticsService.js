import { supabase } from '../supabase'

export async function fetchSystemStatistics() {
  const [
    studentsResult,
    tripsResult,
    registrationsResult,
    reportsResult,
    complaintsResult,
    notificationsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id, is_banned', { count: 'exact' }).eq('role', 'student'),
    supabase.from('trips').select('id, status', { count: 'exact' }),
    supabase.from('registrations').select('id, status', { count: 'exact' }),
    supabase.from('trip_reports').select('id, status, score', { count: 'exact' }),
    supabase.from('complaints').select('id, status', { count: 'exact' }),
    supabase.from('notifications').select('id, is_read', { count: 'exact' }),
  ])

  const students = studentsResult.data || []
  const trips = tripsResult.data || []
  const registrations = registrationsResult.data || []
  const reports = reportsResult.data || []
  const complaints = complaintsResult.data || []
  const notifications = notificationsResult.data || []

  const totalScores = reports.filter(r => r.score !== null).reduce((sum, r) => sum + r.score, 0)
  const scoredReports = reports.filter(r => r.score !== null).length

  return {
    students: {
      total: students.length,
      active: students.filter(s => !s.is_banned).length,
      banned: students.filter(s => s.is_banned).length,
    },
    trips: {
      total: trips.length,
      upcoming: trips.filter(t => t.status === 'Upcoming').length,
      ongoing: trips.filter(t => t.status === 'Active').length,
      completed: trips.filter(t => t.status === 'Completed').length,
      cancelled: trips.filter(t => t.status === 'Cancelled').length,
    },
    registrations: {
      total: registrations.length,
      pending: registrations.filter(r => r.status === 'Pending').length,
      approved: registrations.filter(r => r.status === 'Approved').length,
      rejected: registrations.filter(r => r.status === 'Rejected').length,
    },
    reports: {
      total: reports.length,
      pending: reports.filter(r => r.status === 'Pending').length,
      reviewed: reports.filter(r => r.status === 'Approved' || r.status === 'Rejected').length,
      averageScore: scoredReports > 0 ? (totalScores / scoredReports).toFixed(1) : 0,
    },
    complaints: {
      total: complaints.length,
      open: complaints.filter(c => c.status !== 'Resolved').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length,
    },
    notifications: {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
    },
  }
}
