import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { Plus, Calendar, BedDouble, ChevronLeft, ChevronRight } from 'lucide-react'

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function getWeekDates(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

const bedStatusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700 border border-green-200',
  occupied: 'bg-red-100 text-red-700 border border-red-200',
  cleaning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  maintenance: 'bg-gray-100 text-gray-700 border border-gray-200',
}

export default async function SchedulingPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const weekDates = getWeekDates(new Date())

  const [
    { data: todayAppointments },
    { data: weekAppointments },
    { data: beds },
    { data: departments },
  ] = await Promise.all([
    supabase.from('appointments')
      .select('*, patient:patients(first_name, last_name, mrn), provider:profiles!provider_id(full_name), department:departments(name)')
      .eq('scheduled_date', today)
      .not('status', 'in', '("cancelled")')
      .order('scheduled_time', { ascending: true }),
    supabase.from('appointments')
      .select('*, patient:patients(first_name, last_name), provider:profiles!provider_id(full_name)')
      .in('scheduled_date', weekDates)
      .not('status', 'in', '("cancelled")')
      .order('scheduled_time', { ascending: true }),
    supabase.from('beds')
      .select('*, department:departments(name), patient:patients(first_name, last_name, mrn)')
      .order('room_number', { ascending: true })
      .limit(50),
    supabase.from('departments')
      .select('id, name, code, floor, bed_count')
      .order('name'),
  ])

  // Group appointments by date for weekly view
  const apptsByDate: Record<string, any[]> = {}
  weekDates.forEach((d) => { apptsByDate[d] = [] })
  weekAppointments?.forEach((appt: any) => {
    if (apptsByDate[appt.scheduled_date]) {
      apptsByDate[appt.scheduled_date].push(appt)
    }
  })

  // Group beds by department
  const bedsByDept: Record<string, any[]> = {}
  beds?.forEach((bed: any) => {
    const deptName = bed.department?.name || 'Unknown'
    if (!bedsByDept[deptName]) bedsByDept[deptName] = []
    bedsByDept[deptName].push(bed)
  })

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduling</h1>
          <p className="text-gray-500 text-sm">Appointments and bed management</p>
        </div>
        <Link
          href="/scheduling/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </Link>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Weekly Calendar
          </h2>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Week of {formatDate(weekDates[0])}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {weekDates.map((date, i) => {
                const isToday = date === today
                return (
                  <div key={date} className={`px-3 py-3 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                    <p className={`text-xs font-semibold uppercase ${isToday ? 'text-blue-700' : 'text-gray-400'}`}>
                      {dayNames[i]}
                    </p>
                    <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {new Date(date + 'T00:00:00').getDate()}
                    </p>
                    <p className={`text-xs ${isToday ? 'text-blue-500' : 'text-gray-400'}`}>
                      {apptsByDate[date]?.length || 0} appts
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Appointments */}
            <div className="grid grid-cols-7 min-h-32">
              {weekDates.map((date) => {
                const dayAppts = apptsByDate[date] || []
                const isToday = date === today
                return (
                  <div key={date} className={`border-r border-gray-50 last:border-0 p-2 ${isToday ? 'bg-blue-50/30' : ''}`}>
                    {dayAppts.slice(0, 4).map((appt: any) => (
                      <div key={appt.id} className="mb-1 p-1.5 bg-blue-100 border border-blue-200 rounded text-xs">
                        <p className="font-semibold text-blue-800 truncate">{appt.patient?.first_name} {appt.patient?.last_name}</p>
                        <p className="text-blue-600">{formatTime(appt.scheduled_time)}</p>
                      </div>
                    ))}
                    {dayAppts.length > 4 && (
                      <p className="text-xs text-gray-400 text-center">+{dayAppts.length - 4} more</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Today&apos;s Appointments
          </h2>
          <Badge variant="info">{todayAppointments?.length ?? 0}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {todayAppointments && todayAppointments.length > 0 ? (
                todayAppointments.map((appt: any) => (
                  <tr key={appt.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{formatTime(appt.scheduled_time)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/patients/${appt.patient_id}`} className="font-medium text-gray-900 hover:text-blue-700 block">
                        {appt.patient?.last_name}, {appt.patient?.first_name}
                      </Link>
                      <span className="text-xs font-mono text-gray-400">{appt.patient?.mrn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{appt.appointment_type.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">Dr. {appt.provider?.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{appt.department?.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{appt.duration_minutes} min</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(appt.status)}>{appt.status.replace('_', ' ')}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No appointments scheduled for today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bed Management */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Bed Management</h2>
          <div className="ml-auto flex items-center gap-3 text-xs">
            {['available', 'occupied', 'cleaning', 'maintenance'].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${
                  s === 'available' ? 'bg-green-400' :
                  s === 'occupied' ? 'bg-red-400' :
                  s === 'cleaning' ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
                <span className="text-gray-500 capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(bedsByDept).map(([deptName, deptBeds]) => (
            <div key={deptName}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{deptName}</h3>
              <div className="flex flex-wrap gap-2">
                {deptBeds.map((bed: any) => (
                  <div
                    key={bed.id}
                    title={bed.patient ? `${bed.patient.first_name} ${bed.patient.last_name} (${bed.patient.mrn})` : `${bed.status}`}
                    className={`px-3 py-2 rounded-lg text-xs font-medium cursor-default ${bedStatusColors[bed.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    <p>{bed.room_number}-{bed.bed_number}</p>
                    {bed.patient && (
                      <p className="text-xs opacity-70 truncate max-w-20">{bed.patient.last_name}</p>
                    )}
                  </div>
                ))}
                {deptBeds.length === 0 && (
                  <p className="text-gray-400 text-sm">No beds registered</p>
                )}
              </div>
            </div>
          ))}
          {Object.keys(bedsByDept).length === 0 && (
            <p className="text-gray-400 text-center py-4">No beds registered in the system</p>
          )}
        </div>
      </div>
    </div>
  )
}
