import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { UserPlus, Search } from 'lucide-react'

function calculateAge(dob: string): number {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface SearchParams {
  q?: string
  status?: string
  page?: string
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()
  const search = searchParams.q || ''
  const status = searchParams.status || 'all'
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20

  let query = supabase
    .from('patients')
    .select(`
      id, mrn, first_name, last_name, date_of_birth, gender, is_active, phone, created_at,
      insurance_provider,
      primary_provider:profiles!primary_provider_id(full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (status === 'active') query = query.eq('is_active', true)
  if (status === 'inactive') query = query.eq('is_active', false)

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,mrn.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: patients, count } = await query
  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 text-sm">{count ?? 0} total patients</p>
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Register Patient
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search by name, MRN, or phone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
          {(search || status !== 'all') && (
            <Link href="/patients" className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">MRN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DOB / Age</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Insurance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients && patients.length > 0 ? (
                patients.map((patient: any) => (
                  <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-700 font-semibold">{patient.mrn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/patients/${patient.id}`} className="font-medium text-gray-900 hover:text-blue-700">
                        {patient.last_name}, {patient.first_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span>{formatDate(patient.date_of_birth)}</span>
                      <span className="text-gray-400 text-xs ml-1">({calculateAge(patient.date_of_birth)}y)</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{patient.gender}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {patient.primary_provider?.full_name || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {patient.insurance_provider || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={patient.is_active ? 'success' : 'neutral'}>
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View Chart
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    {search ? 'No patients found matching your search.' : 'No patients registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} &middot; {count} total
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/patients?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(status !== 'all' ? { status } : {}), page: String(page - 1) })}`}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/patients?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(status !== 'all' ? { status } : {}), page: String(page + 1) })}`}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
