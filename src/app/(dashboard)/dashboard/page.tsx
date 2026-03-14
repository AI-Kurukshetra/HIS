import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/ui/StatsCard'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import Link from 'next/link'
import {
  Users,
  Activity,
  ClipboardList,
  Calendar,
  BedDouble,
  FlaskConical,
  Plus,
  UserPlus,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function calculateAge(dob: string): number {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export default async function DashboardPage() {
  const supabase = createClient()

  // Parallel data fetching
  const [
    { count: totalPatients },
    { count: activeEncounters },
    { count: pendingOrders },
    { count: todayAppointments },
    { count: availableBeds },
    { count: pendingLabs },
    { data: recentPatients },
    { data: recentAlerts },
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('encounters').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('appointments').select('id', { count: 'exact', head: true })
      .eq('scheduled_date', new Date().toISOString().split('T')[0])
      .not('status', 'in', '("cancelled","no_show")'),
    supabase.from('beds').select('id', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('lab_orders').select('id', { count: 'exact', head: true }).in('status', ['ordered', 'collected', 'processing']),
    supabase.from('patients')
      .select('id, mrn, first_name, last_name, date_of_birth, gender, is_active, created_at, primary_provider:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('alerts')
      .select('id, alert_type, severity, message, created_at, is_acknowledged, patient:patients(first_name, last_name, mrn)')
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const stats = [
    {
      title: 'Total Patients',
      value: totalPatients ?? 0,
      subtitle: 'Active patients',
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Active Encounters',
      value: activeEncounters ?? 0,
      subtitle: 'Currently admitted',
      icon: Activity,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders ?? 0,
      subtitle: 'Awaiting action',
      icon: ClipboardList,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
    },
    {
      title: "Today's Appointments",
      value: todayAppointments ?? 0,
      subtitle: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      icon: Calendar,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
    {
      title: 'Available Beds',
      value: availableBeds ?? 0,
      subtitle: 'Ready for admission',
      icon: BedDouble,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },
    {
      title: 'Pending Labs',
      value: pendingLabs ?? 0,
      subtitle: 'Awaiting results',
      icon: FlaskConical,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/patients/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Register Patient
          </Link>
          <Link
            href="/encounters/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Encounter
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} className="xl:col-span-1" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recently Registered Patients</h2>
            <Link href="/patients" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">MRN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age/Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPatients && recentPatients.length > 0 ? (
                  recentPatients.map((patient: any) => (
                    <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs font-medium">
                          {patient.mrn}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/patients/${patient.id}`} className="font-medium text-gray-900 hover:text-blue-700">
                          {patient.first_name} {patient.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {patient.date_of_birth ? calculateAge(patient.date_of_birth) : '—'}y / {patient.gender || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={patient.is_active ? 'success' : 'neutral'}>
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(patient.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No patients registered yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Active Alerts
            </h2>
            <Badge variant="danger">{recentAlerts?.length ?? 0}</Badge>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {recentAlerts && recentAlerts.length > 0 ? (
              recentAlerts.map((alert: any) => (
                <div key={alert.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {(alert.patient as any)?.first_name} {(alert.patient as any)?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No active alerts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
