import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllTrips, deleteTrip } from '../../lib/tripService'

function TripListPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')

  const loadTrips = async () => {
    setLoading(true)
    const { trips: data } = await fetchAllTrips()
    setTrips(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTrips()
  }, [])

  const handleDelete = async (tripId, e) => {
    e.stopPropagation()
    const confirmed = window.confirm('Delete this draft trip? This cannot be undone.')
    if (!confirmed) return
    const { error } = await deleteTrip(tripId)
    if (!error) {
      setTrips(trips.filter((t) => t.id !== tripId))
    }
  }

  const filteredTrips = statusFilter === 'All'
    ? trips
    : trips.filter((t) => t.status === statusFilter)

  const statusColors = {
    Draft: 'bg-amber-50 text-amber-700 border-amber-200',
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
    Completed: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  const statusCounts = {
    All: trips.length,
    Draft: trips.filter(t => t.status === 'Draft').length,
    Published: trips.filter(t => t.status === 'Published').length,
    Ongoing: trips.filter(t => t.status === 'Ongoing').length,
    Completed: trips.filter(t => t.status === 'Completed').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FF] via-[#EAF0FF] to-[#DCE6FF]">
      <div className="max-w-[1400px] mx-auto p-8 md:p-12">
        
        <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
          <div>
            <h1 className="font-serif text-[#1E3A5F] text-5xl font-bold mb-3 leading-tight">Trip Management</h1>
            <p className="text-[#6B7F9F] font-sans text-base leading-relaxed">
              Create and manage educational trips
            </p>
          </div>
          <button
            onClick={() => navigate('/depthead/trips/new')}
            className="group relative px-8 py-4 bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white rounded-2xl font-sans text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Trip
            </div>
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-8 p-2 bg-white rounded-2xl border-2 border-[#E5EDFF] shadow-sm">
          {['All', 'Draft', 'Published', 'Ongoing', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-200 ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-[#8CA5FF] to-[#6B8FE5] text-white shadow-md scale-105'
                  : 'bg-transparent text-[#6B7F9F] hover:bg-[#F8FAFF]'
              }`}
            >
              {status}
              <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-bold ${
                statusFilter === status
                  ? 'bg-white/20'
                  : 'bg-[#F0F4FF] text-[#8CA5FF]'
              }`}>
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-[#8CA5FF] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#6B7F9F] font-sans text-sm font-medium">Loading trips...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-[#E5EDFF] shadow-sm">
            <div className="w-24 h-24 rounded-full bg-[#F0F4FF] flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🧭</span>
            </div>
            <h3 className="font-serif text-[#1E3A5F] text-2xl font-bold mb-3">No trips found</h3>
            <p className="text-[#6B7F9F] font-sans text-sm max-w-md mx-auto leading-relaxed">
              No educational trips matching this filter. Create your first trip to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => navigate(`/depthead/trips/${trip.id}`)}
                className="group relative bg-white rounded-2xl p-7 border-2 border-[#E5EDFF] hover:border-[#8CA5FF] cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8CA5FF]/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider border-2 ${statusColors[trip.status]}`}>
                      {trip.status}
                    </span>
                    {trip.status === 'Draft' && (
                      <button
                        onClick={(e) => handleDelete(trip.id, e)}
                        className="text-red-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <h3 className="font-serif text-[#1E3A5F] text-xl font-bold mb-3 line-clamp-2 group-hover:text-[#8CA5FF] transition-colors">
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[#6B7F9F] font-sans text-sm mb-5">
                    <span className="text-lg">📍</span>
                    <span className="truncate">{trip.destination}</span>
                  </div>

                  <div className="space-y-3 pt-4 border-t-2 border-[#F0F4FF]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8B9FB5] font-sans">Schedule</span>
                      <span className="text-[#1E3A5F] font-sans font-semibold">{trip.start_date} → {trip.end_date}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8B9FB5] font-sans">Capacity</span>
                      <span className="text-[#1E3A5F] font-sans font-semibold">
                        <span className="text-[#22C55E]">{trip.spots_remaining}</span> / {trip.capacity} spots free
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-[#8B9FB5] font-sans">Cost</span>
                      <span className="text-[#D4AF37] font-sans text-lg font-bold">
                        {trip.cost_per_student} {trip.currency}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t-2 border-[#F0F4FF]">
                    <div className="flex items-center justify-between text-[#8CA5FF] font-sans text-sm font-semibold group-hover:text-[#6B8FE5] transition-colors">
                      <span>View Details</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TripListPage
