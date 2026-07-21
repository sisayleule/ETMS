import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchStudentStats,
  fetchRecentActivity,
  fetchUpcomingTripsPreview,
} from '../../lib/dashboardService'
import { getNotificationIcon, getTimeAgo } from '../../lib/notificationService'

function StatCard({ label, value, icon, link, iconColor, iconBg }) {
  return (
    <Link
      to={link}
      className="group relative bg-white rounded-2xl p-7 border-2 border-[#E5EDFF] hover:border-[#8CA5FF] hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8CA5FF]/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <p className="text-[#1E3A5F] font-serif text-5xl font-bold mb-3 leading-none">
            {value}
          </p>
          <p className="text-[#6B7F9F] font-sans text-[11px] uppercase tracking-[0.15em] font-semibold">
            {label}
          </p>
        </div>
      </div>
    </Link>
  )
}

function DashboardHome() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    upcomingTrips: 0,
    pendingReports: 0,
    openComplaints: 0,
  })
  const [upcomingTrips, setUpcomingTrips] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    setLoading(true)
    const [statsData, tripsResult, activityResult] = await Promise.all([
      fetchStudentStats(user.id),
      fetchUpcomingTripsPreview(user.id),
      fetchRecentActivity(user.id),
    ])
    setStats(statsData)
    setUpcomingTrips(tripsResult.trips || [])
    setActivity(activityResult.activity || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user?.id) loadDashboard()
  }, [user?.id])

  const tiles = [
    { label: 'Upcoming Trips', value: stats.upcomingTrips, icon: '🧭', link: '/student/trips', iconBg: 'bg-gradient-to-br from-[#8CA5FF] to-[#6B8FE5]' },
    { label: 'Reports Pending', value: stats.pendingReports, icon: '📝', link: '/student/my-reports', iconBg: 'bg-gradient-to-br from-[#D4AF37] to-[#B8941F]' },
    { label: 'Open Complaints', value: stats.openComplaints, icon: '⚠️', link: '/student/complaints', iconBg: 'bg-gradient-to-br from-[#EF4444] to-[#DC2626]' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8CA5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7F9F] font-sans text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF]">
      <div className="max-w-[1400px] mx-auto p-8 md:p-12">
        
        <div className="mb-12">
          <h1 className="font-serif text-[#1E3A5F] text-5xl font-bold mb-3 leading-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-[#6B7F9F] font-sans text-base leading-relaxed">
            Here's an overview of your trips and administrative requirements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiles.map((tile) => (
            <StatCard key={tile.label} {...tile} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3 bg-white rounded-2xl p-8 border-2 border-[#E5EDFF] shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b-2 border-[#F0F4FF]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8CA5FF] to-[#6B8FE5] flex items-center justify-center">
                <span className="text-xl">🧭</span>
              </div>
              <div>
                <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold">Upcoming Trips</h2>
                <p className="text-[#8B9FB5] font-sans text-xs mt-0.5">Your approved educational trips</p>
              </div>
            </div>

            {upcomingTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F0F4FF] flex items-center justify-center mb-4">
                  <span className="text-4xl">🏖️</span>
                </div>
                <p className="text-[#6B7F9F] font-sans text-sm max-w-xs leading-relaxed">
                  No approved trips yet. Browse available trips to get registered!
                </p>
                <Link
                  to="/student/trips"
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-lg font-sans text-sm font-semibold hover:shadow-lg transition-all"
                >
                  Browse Trips
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTrips.map((reg) => (
                  <Link
                    key={reg.id}
                    to={`/student/trips/${reg.trips?.id}`}
                    className="group block p-5 bg-gradient-to-br from-[#F8FAFF] to-[#F0F4FF] hover:from-[#EEF2FF] hover:to-[#E5EDFF] rounded-xl transition-all border-2 border-[#E5EDFF] hover:border-[#8CA5FF] hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#1E3A5F] font-sans text-base font-bold mb-2 group-hover:text-[#8CA5FF] transition-colors">
                          {reg.trips?.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#6B7F9F] font-sans text-sm">
                          <span className="flex items-center gap-1.5">
                            <span className="text-base">📍</span>
                            {reg.trips?.destination}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-base">📅</span>
                            {reg.trips?.start_date ? new Date(reg.trips.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center group-hover:bg-[#8CA5FF] transition-colors">
                          <svg className="w-4 h-4 text-[#8CA5FF] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-8 border-2 border-[#E5EDFF] shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b-2 border-[#F0F4FF]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center">
                <span className="text-xl">🔔</span>
              </div>
              <div>
                <h2 className="font-serif text-[#1E3A5F] text-2xl font-bold">Activity</h2>
                <p className="text-[#8B9FB5] font-sans text-xs mt-0.5">Recent notifications</p>
              </div>
            </div>

            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F0F4FF] flex items-center justify-center mb-4">
                  <span className="text-4xl">💤</span>
                </div>
                <p className="text-[#6B7F9F] font-sans text-sm max-w-xs leading-relaxed">
                  No recent activity to show
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-[#F8FAFF] transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#F0F4FF] to-[#E5EDFF] flex items-center justify-center">
                      <span className="text-lg">{getNotificationIcon(item.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[#1E3A5F] font-sans text-sm font-semibold leading-snug mb-1">
                        {item.title}
                      </p>
                      <p className="text-[#6B7F9F] font-sans text-xs leading-relaxed line-clamp-2 mb-1.5">
                        {item.message}
                      </p>
                      <p className="text-[#8B9FB5] font-sans text-[10px] uppercase tracking-wider">
                        {getTimeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
