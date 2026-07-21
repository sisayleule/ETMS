import { supabase } from '../supabase'

export async function fetchEnhancedStatistics() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoISO = sevenDaysAgo.toISOString()

  const [
    studentsResult,
    studentsLastWeekResult,
    tripsResult,
    tripsLastWeekResult,
    registrationsResult,
    reportsResult,
    complaintsResult,
    activityLogsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id, is_banned, created_at').eq('role', 'student'),
    supabase.from('profiles').select('id').eq('role', 'student').gte('created_at', sevenDaysAgoISO),
    supabase.from('trips').select('id, status, created_at'),
    supabase.from('trips').select('id').gte('created_at', sevenDaysAgoISO),
    supabase.from('registrations').select('id, status, applied_at, decided_at'),
    supabase.from('trip_reports').select('id, status, score'),
    supabase.from('complaints').select('id, status'),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
  ])

  const students = studentsResult.data || []
  const studentsLastWeek = studentsLastWeekResult.data || []
  const trips = tripsResult.data || []
  const tripsLastWeek = tripsLastWeekResult.data || []
  const registrations = registrationsResult.data || []
  const reports = reportsResult.data || []
  const complaints = complaintsResult.data || []
  const activityLogs = activityLogsResult.data || []

  const totalStudents = students.length
  const activeStudents = students.filter(s => !s.is_banned).length
  const bannedStudents = students.filter(s => s.is_banned).length
  const totalTrips = trips.length

  const totalStudentsLastWeek = totalStudents - studentsLastWeek.length
  const totalTripsLastWeek = totalTrips - tripsLastWeek.length
  
  const studentPercentChange = totalStudentsLastWeek > 0 
    ? (((totalStudents - totalStudentsLastWeek) / totalStudentsLastWeek) * 100).toFixed(0)
    : totalStudents > 0 ? '+100' : '0'
  
  const tripPercentChange = totalTripsLastWeek > 0
    ? (((totalTrips - totalTripsLastWeek) / totalTripsLastWeek) * 100).toFixed(0)
    : totalTrips > 0 ? '+100' : '0'

  const last7DaysData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const dateISO = date.toISOString()
    const nextDateISO = nextDate.toISOString()
    
    const dayStudents = students.filter(s => {
      const createdAt = new Date(s.created_at)
      return createdAt >= date && createdAt < nextDate
    })
    
    const cumulativeTotal = students.filter(s => new Date(s.created_at) <= nextDate).length
    const cumulativeActive = students.filter(s => new Date(s.created_at) <= nextDate && !s.is_banned).length
    
    last7DaysData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalStudents: cumulativeTotal,
      activeStudents: cumulativeActive,
    })
  }

  const tripsByStatus = {
    upcoming: trips.filter(t => t.status === 'Draft' || t.status === 'Published').length,
    ongoing: trips.filter(t => t.status === 'Active').length,
    completed: trips.filter(t => t.status === 'Completed').length,
    cancelled: trips.filter(t => t.status === 'Cancelled').length,
  }

  const avgStudentsPerTrip = totalTrips > 0 
    ? (registrations.length / totalTrips).toFixed(1)
    : '0'

  const completionRate = totalTrips > 0
    ? ((tripsByStatus.completed / totalTrips) * 100).toFixed(0)
    : '0'

  const approvalRate = registrations.length > 0
    ? ((registrations.filter(r => r.status === 'Approved').length / registrations.length) * 100).toFixed(0)
    : '0'

  const registrationsWithTiming = registrations.filter(r => 
    r.applied_at && r.decided_at && r.status !== 'Pending'
  )
  
  let avgResponseTime = '—'
  if (registrationsWithTiming.length > 0) {
    const totalHours = registrationsWithTiming.reduce((sum, r) => {
      const applied = new Date(r.applied_at)
      const decided = new Date(r.decided_at)
      const hours = (decided - applied) / (1000 * 60 * 60)
      return sum + hours
    }, 0)
    const avgHours = totalHours / registrationsWithTiming.length
    avgResponseTime = avgHours < 1 
      ? `${Math.round(avgHours * 60)}m`
      : `${avgHours.toFixed(1)}h`
  }

  return {
    totalStudents,
    activeStudents,
    bannedStudents,
    totalTrips,
    studentPercentChange,
    tripPercentChange,
    activePercentChange: '—',
    bannedPercentChange: '0',
    last7DaysData,
    studentStatusDistribution: {
      active: activeStudents,
      inactive: 0,
      banned: bannedStudents,
    },
    tripsByStatus,
    recentActivity: activityLogs.map(log => ({
      id: log.id,
      type: log.action,
      title: formatActivityTitle(log.action),
      subtitle: formatActivitySubtitle(log),
      timestamp: log.created_at,
    })),
    avgStudentsPerTrip,
    completionRate,
    approvalRate,
    avgResponseTime,
  }
}

function formatActivityTitle(action) {
  const titles = {
    'student_banned': 'Student Banned',
    'student_unbanned': 'Student Unbanned',
    'student_deleted': 'Student Deleted',
    'registration_approved': 'Registration Approved',
    'trip_created': 'Trip Created',
    'report_reviewed': 'Report Reviewed',
  }
  return titles[action] || action
}

function formatActivitySubtitle(log) {
  if (log.details && log.details.student_name) {
    return log.details.student_name
  }
  if (log.details && log.details.reason) {
    return log.details.reason
  }
  return 'System activity'
}
