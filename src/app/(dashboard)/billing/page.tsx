import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { Plus, DollarSign, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

interface SearchParams {
  status?: string
  from?: string
  to?: string
}

export default async function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const statusFilter = searchParams.status || ''

  let query = supabase
    .from('insurance_claims')
    .select(`
      *,
      patient:patients(first_name, last_name, mrn),
      encounter:encounters(encounter_type, admit_date)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (statusFilter) query = query.eq('status', statusFilter)

  const [
    { data: claims, count },
    { count: draftCount },
    { count: submittedCount },
    { count: approvedCount },
    { count: deniedCount },
    { data: paidClaims },
  ] = await Promise.all([
    query,
    supabase.from('insurance_claims').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('insurance_claims').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    supabase.from('insurance_claims').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('insurance_claims').select('id', { count: 'exact', head: true }).eq('status', 'denied'),
    supabase.from('insurance_claims').select('approved_amount').eq('status', 'paid'),
  ])

  const totalRevenue = paidClaims?.reduce((sum: number, c: any) => sum + (c.approved_amount || 0), 0) || 0

  const stats = [
    { label: 'Draft', value: draftCount ?? 0, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'Submitted', value: submittedCount ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Approved', value: approvedCount ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Denied', value: deniedCount ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Revenue Cycle</h1>
          <p className="text-gray-500 text-sm">{count ?? 0} total claims</p>
        </div>
        <Link
          href="/billing/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Claim
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex items-center gap-3 flex-wrap">
          <select
            name="status"
            defaultValue={statusFilter}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="appealed">Appealed</option>
            <option value="paid">Paid</option>
          </select>
          <input
            type="date"
            name="from"
            defaultValue={searchParams.from || ''}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            name="to"
            defaultValue={searchParams.to || ''}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors">
            Filter
          </button>
          {statusFilter && (
            <Link href="/billing" className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Clear</Link>
          )}
        </form>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Claim #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Insurance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Charges</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Resp.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {claims && claims.length > 0 ? (
                claims.map((claim: any) => (
                  <tr key={claim.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-700 font-semibold">{claim.claim_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/patients/${claim.patient_id}`} className="font-medium text-gray-900 hover:text-blue-700 block">
                        {claim.patient?.last_name}, {claim.patient?.first_name}
                      </Link>
                      <span className="text-xs font-mono text-gray-400">{claim.patient?.mrn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{claim.insurance_provider}</p>
                      <p className="text-xs font-mono text-gray-400">{claim.insurance_id}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(claim.total_charges)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(claim.submitted_amount)}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">{formatCurrency(claim.approved_amount)}</td>
                    <td className="px-4 py-3 text-orange-600">{formatCurrency(claim.patient_responsibility)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(claim.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(claim.status)}>{claim.status.replace('_', ' ')}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No claims found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
