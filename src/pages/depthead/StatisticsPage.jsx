import { useState, useEffect } from 'react'
import { fetchEnhancedStatistics } from '../../lib/depthead/enhancedStatisticsService'
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Users, BookOpen, Ban, Calendar, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { getTimeAgo } from '../../lib/notificationService'

function MiniSparkline({ data, color }) {
  if (!data || data.length === 0) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  return (
    <svg width="100%" height="24" className="mt-2">
      <polyline
        points={data.map((val, i) => {
          const x = (i / (data.length - 1)) * 100
          const y = 24 - ((val - min) / range) * 20
          return `${x},${y}`
        }).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  )
}

function StatCard({ title, value, percentChange, icon: Icon, iconColor, sparklineData }) {
  const isPositive = percentChange && !percentChange.includes('—') && parseFloat(percentChange) >= 0
  const hasChange = percentChange && percentChange !== '—'
  
  return (
    <div className="bg-white rounded-xl p-5 border-2 border-[#E5EDFF] hover:border-[#8CA5FF] transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-[#6B7F9F] font-sans text-[10px] uppercase tracking-widest font-semibold mb-2">{title}</p>
          <p className="text-[#1E3A5F] font-serif text-3xl font-bold mb-1">{value}</p>
          {hasChange && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp size={14} className="text-green-600" />
              ) : (
                <TrendingDown size={14} className="text-red-600" />
              )}
              <span className={`font-sans text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {percentChange}%
              </span>
              <span className="text-[#8B9FB5] font-sans text-xs ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      {sparklineData && sparklineData.length > 0 && (
        <MiniSparkline data={sparklineData} color={iconColor.includes('blue') ? '#8CA5FF' : iconColor.includes('green') ? '#22C55E' : iconColor.includes('red') ? '#EF4444' : '#F59E0B'} />
      )}
    </div>
  )
}

function StatisticsPageRebuild() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('Jul 6 – Jul 12, 2026')

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    setLoading(true)
    try {
      const data = await fetchEnhancedStatistics()
      setStats(data)
    } catch (err) {
      console.error('Error loading statistics:', err)
      setError('Failed to load statistics')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8CA5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B7F9F] font-sans text-sm font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl font-sans text-sm">
            {error}
          </div>
        </div>
      </div>
    )
  }

  const studentStatusData = [
    { name: 'Active Students', value: stats.studentStatusDistribution.active, color: '#22C55E' },
    { name: 'Inactive Students', value: stats.studentStatusDistribution.inactive, color: '#94A3B8' },
    { name: 'Banned Students', value: stats.studentStatusDistribution.banned, color: '#EF4444' },
  ].filter(item => item.value > 0)

  const tripStatsData = [
    { name: 'Upcoming', value: stats.tripsByStatus.upcoming, color: '#8CA5FF', percentage: ((stats.tripsByStatus.upcoming / stats.totalTrips) * 100).toFixed(0) },
    { name: 'Ongoing', value: stats.tripsByStatus.ongoing, color: '#22C55E', percentage: ((stats.tripsByStatus.ongoing / stats.totalTrips) * 100).toFixed(0) },
    { name: 'Completed', value: stats.tripsByStatus.completed, color: '#F59E0B', percentage: ((stats.tripsByStatus.completed / stats.totalTrips) * 100).toFixed(0) },
    { name: 'Cancelled', value: stats.tripsByStatus.cancelled, color: '#EF4444', percentage: ((stats.tripsByStatus.cancelled / stats.totalTrips) * 100).toFixed(0) },
  ].filter(item => item.value > 0)

  const totalStudentsValue = stats.studentStatusDistribution.active + stats.studentStatusDistribution.inactive + stats.studentStatusDistribution.banned

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF]">
      <div className="max-w-[1400px] mx-auto p-6 md:p-10">
        
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-[#1E3A5F] text-4xl font-bold mb-2">Statistics</h1>
            <p className="text-[#6B7F9F] font-sans text-sm">System-wide analytics and insights overview</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border-2 border-[#C5D5FF] rounded-lg hover:border-[#8CA5FF] transition-all font-sans text-sm font-medium text-[#1E3A5F] flex items-center gap-2">
              <Calendar size={16} />
              {dateRange}
            </button>
            <button className="px-4 py-2.5 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-lg hover:shadow-lg transition-all font-sans text-sm font-semibold flex items-center gap-2">
              <Download size={16} />
              Download Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="TOTAL STUDENTS"
            value={stats.totalStudents}
            percentChange={stats.studentPercentChange}
            icon={Users}
            iconColor="bg-[#8CA5FF]"
            sparklineData={stats.last7DaysData.map(d => d.totalStudents)}
          />
          <StatCard
            title="ACTIVE STUDENTS"
            value={stats.activeStudents}
            percentChange={stats.activePercentChange}
            icon={Users}
            iconColor="bg-green-500"
            sparklineData={stats.last7DaysData.map(d => d.activeStudents)}
          />
          <StatCard
            title="BANNED STUDENTS"
            value={stats.bannedStudents}
            percentChange={stats.bannedPercentChange}
            icon={Ban}
            iconColor="bg-red-500"
            sparklineData={[0, 0, 0, 0, 0, 0, stats.bannedStudents]}
          />
          <StatCard
            title="TOTAL TRIPS"
            value={stats.totalTrips}
            percentChange={stats.tripPercentChange}
            icon={BookOpen}
            iconColor="bg-[#F59E0B]"
            sparklineData={[1, 1, 1, 2, 2, 2, stats.totalTrips]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[#1E3A5F] text-xl font-bold">Student Overview</h3>
              <select className="px-3 py-1.5 bg-[#F5F8FF] border border-[#C5D5FF] rounded-lg text-[#1E3A5F] font-sans text-xs font-medium focus:outline-none focus:border-[#8CA5FF]">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.last7DaysData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#8B9FB5" 
                  style={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#8B9FB5" 
                  style={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #E5EDFF', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'sans-serif'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', fontFamily: 'sans-serif' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalStudents" 
                  stroke="#8CA5FF" 
                  strokeWidth={3}
                  name="Total Students"
                  dot={{ fill: '#8CA5FF', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeStudents" 
                  stroke="#22C55E" 
                  strokeWidth={3}
                  name="Active Students"
                  dot={{ fill: '#22C55E', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm">
            <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-5">Student Status Distribution</h3>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={studentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {studentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-serif text-3xl font-bold"
                    fill="#1E3A5F"
                  >
                    {totalStudentsValue}
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    className="font-sans text-xs"
                    fill="#6B7F9F"
                  >
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {studentStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-[#F0F4FF] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-sans text-xs text-[#4A5F7F]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-bold text-[#1E3A5F]">{item.value}</span>
                    <span className="font-sans text-xs text-[#8B9FB5]">
                      ({((item.value / totalStudentsValue) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm">
            <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-5">Trip Statistics</h3>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={tripStatsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tripStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-serif text-3xl font-bold"
                    fill="#1E3A5F"
                  >
                    {stats.totalTrips}
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    className="font-sans text-xs"
                    fill="#6B7F9F"
                  >
                    Total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {tripStatsData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-[#F0F4FF] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-sans text-xs text-[#4A5F7F]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-bold text-[#1E3A5F]">{item.value}</span>
                    <span className="font-sans text-xs text-[#8B9FB5]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm">
            <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-5">Trip Progress</h3>
            <div className="space-y-5">
              {tripStatsData.map((item, index) => {
                const percentage = ((item.value / stats.totalTrips) * 100).toFixed(0)
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-xs text-[#4A5F7F] font-medium">{item.name}</span>
                      <span className="font-sans text-sm font-bold text-[#1E3A5F]">{percentage}%</span>
                    </div>
                    <div className="w-full bg-[#F0F4FF] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[#1E3A5F] text-xl font-bold">Recent Activity</h3>
              <button className="text-[#8CA5FF] font-sans text-xs font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 6).map((activity) => {
                  const iconMap = {
                    'student_banned': '🚫',
                    'student_unbanned': '✅',
                    'student_deleted': '🗑️',
                    'registration_approved': '✓',
                    'trip_created': '🧭',
                    'report_reviewed': '📝',
                  }
                  const colorMap = {
                    'student_banned': 'bg-red-100',
                    'student_unbanned': 'bg-green-100',
                    'student_deleted': 'bg-gray-100',
                    'registration_approved': 'bg-blue-100',
                    'trip_created': 'bg-purple-100',
                    'report_reviewed': 'bg-yellow-100',
                  }
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[activity.type] || 'bg-gray-100'}`}>
                        <span className="text-base">{iconMap[activity.type] || '📌'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1E3A5F] font-sans text-xs font-semibold">{activity.title}</p>
                        <p className="text-[#6B7F9F] font-sans text-[11px] mt-0.5 truncate">{activity.subtitle}</p>
                      </div>
                      <span className="text-[#8B9FB5] font-sans text-[10px] whitespace-nowrap">{getTimeAgo(activity.timestamp)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">💤</p>
                  <p className="text-[#8B9FB5] font-sans text-xs">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm hover:border-[#8CA5FF] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#8CA5FF]/10 flex items-center justify-center">
                <Users size={24} className="text-[#8CA5FF]" />
              </div>
              <div>
                <p className="text-[#6B7F9F] font-sans text-[10px] uppercase tracking-wide">Average Students per Trip</p>
                <p className="text-[#1E3A5F] font-serif text-3xl font-bold">{stats.avgStudentsPerTrip}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm hover:border-[#8CA5FF] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BookOpen size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-[#6B7F9F] font-sans text-[10px] uppercase tracking-wide">Completion Rate</p>
                <p className="text-[#1E3A5F] font-serif text-3xl font-bold">{stats.completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm hover:border-[#8CA5FF] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[#6B7F9F] font-sans text-[10px] uppercase tracking-wide">Approval Rate</p>
                <p className="text-[#1E3A5F] font-serif text-3xl font-bold">{stats.approvalRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-[#E5EDFF] shadow-sm hover:border-[#8CA5FF] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[#6B7F9F] font-sans text-[10px] uppercase tracking-wide">Response Time</p>
                <p className="text-[#1E3A5F] font-serif text-3xl font-bold">{stats.avgResponseTime}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default StatisticsPageRebuild
