import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Building2, Shield, Activity, Users } from 'lucide-react'
import { UserManagement } from './UserManagement'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ensure only admins can see this page (server-side guard)
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (me?.role !== 'admin') redirect('/unauthorized')

  const [
    { data: profiles, count: userCount },
    { data: departments, count: deptCount },
    { data: auditLogs },
    { count: patientCount },
    { count: encounterCount },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, phone, license_number, created_at, department:departments(name)', { count: 'exact' })
      .order('created_at', { ascending: false }),
    supabase.from('departments').select('*', { count: 'exact' }).order('name'),
    supabase
      .from('audit_logs')
      .select('*, user:profiles!user_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('encounters').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-500 text-sm">System management and configuration</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',      value: userCount      ?? 0, icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Departments',      value: deptCount      ?? 0, icon: Building2, color: 'text-teal-600',   bg: 'bg-teal-50' },
          { label: 'Total Patients',   value: patientCount   ?? 0, icon: Activity,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Total Encounters', value: encounterCount ?? 0, icon: Shield,    color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* User Management — full width with role editing */}
      <UserManagement
        initialProfiles={(profiles ?? []) as any}
        currentUserId={user.id}
      />

      {/* Departments */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-600" />
          <h2 className="font-semibold text-gray-900">Departments</h2>
          <Badge variant="teal">{deptCount ?? 0}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Name', 'Code', 'Floor', 'Beds'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {departments && departments.length > 0 ? departments.map((dept: any) => (
                <tr key={dept.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{dept.name}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{dept.code}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{dept.floor ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{dept.bed_count}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">No departments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Audit Log</h2>
          </div>
          <span className="text-xs text-gray-400">Last 50 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Timestamp', 'User', 'Action', 'Table', 'Record ID', 'IP'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{log.user?.full_name ?? <span className="text-gray-400 text-xs">System</span>}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.action === 'DELETE' ? 'danger' : log.action === 'INSERT' ? 'success' : 'info'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.table_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[100px] truncate">{log.record_id ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.ip_address ?? '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit log entries</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
