import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { Plus, Activity } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface SearchParams {
  status?: string
  department?: string
  type?: string
}

export default async function EncountersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()

  const status = searchParams.status || ''
  const deptId = searchParams.department || ''
  const encType = searchParams.type || ''

  let query = supabase
    .from('encounters')
    .select(`
      *,
      patient:patients(first_name, last_name, mrn),
      provider:profiles!provider_id(full_name),
      department:departments(name),
      bed:beds(room_number, bed_number)
    `, { count: 'exact' })
    .order('admit_date', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)
  if (deptId) query = query.eq('department_id', deptId)
  if (encType) query = query.eq('encounter_type', encType)

  const [{ data: encounters, count }, { data: departments }] = await Promise.all([
    query,
    supabase.from('departments').select('id, name').order('name'),
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encounters</h1>
          <p className="text-gray-500 text-sm">{count ?? 0} total encounters</p>
        </div>
        <Link
          href="/encounters/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Encounter
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex items-center gap-3 flex-wrap">
          <select
            name="status"
            defaultValue={status}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
            <option value="transferred">Transferred</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            name="type"
            defaultValue={encType}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="inpatient">Inpatient</option>
            <option value="outpatient">Outpatient</option>
            <option value="emergency">Emergency</option>
            <option value="surgical">Surgical</option>
          </select>
          <select
            name="department"
            defaultValue={deptId}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments?.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Filter
          </button>
          {(status || deptId || encType) && (
            <Link href="/encounters" className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Clear</Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">MRN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chief Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admit Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {encounters && encounters.length > 0 ? (
                encounters.map((enc: any) => (
                  <tr key={enc.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/patients/${enc.patient_id}`} className="font-medium text-gray-900 hover:text-blue-700">
                        {enc.patient?.last_name}, {enc.patient?.first_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-700 font-semibold">{enc.patient?.mrn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={enc.encounter_type === 'emergency' ? 'danger' : enc.encounter_type === 'surgical' ? 'purple' : 'info'}>
                        {enc.encounter_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{enc.chief_complaint || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(enc.admit_date)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">Dr. {enc.provider?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{enc.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {enc.bed ? `${enc.bed.room_number}-${enc.bed.bed_number}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(enc.status)}>{enc.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">No encounters found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
