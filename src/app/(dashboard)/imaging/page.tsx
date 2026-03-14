import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, getStatusVariant, getPriorityVariant } from '@/components/ui/Badge'
import { Plus, ImageIcon } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const modalityColors: Record<string, string> = {
  xray: 'bg-blue-50 text-blue-700',
  ct: 'bg-purple-50 text-purple-700',
  mri: 'bg-indigo-50 text-indigo-700',
  ultrasound: 'bg-teal-50 text-teal-700',
  pet: 'bg-orange-50 text-orange-700',
  nuclear: 'bg-red-50 text-red-700',
}

interface SearchParams {
  modality?: string
  status?: string
  priority?: string
}

export default async function ImagingPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const modalityFilter = searchParams.modality || ''
  const statusFilter = searchParams.status || ''
  const priorityFilter = searchParams.priority || ''

  let query = supabase
    .from('imaging_orders')
    .select(`
      *,
      patient:patients(id, first_name, last_name, mrn),
      provider:profiles!ordered_by(full_name),
      imaging_results(report_status, impression)
    `, { count: 'exact' })
    .order('ordered_at', { ascending: false })
    .limit(50)

  if (modalityFilter) query = query.eq('modality', modalityFilter)
  if (statusFilter) query = query.eq('status', statusFilter)
  if (priorityFilter) query = query.eq('priority', priorityFilter)

  const { data: orders, count } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Imaging</h1>
          <p className="text-gray-500 text-sm">{count ?? 0} imaging orders</p>
        </div>
        <Link
          href="/imaging/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Imaging Order
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex items-center gap-3 flex-wrap">
          <select name="modality" defaultValue={modalityFilter} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Modalities</option>
            <option value="xray">X-Ray</option>
            <option value="ct">CT Scan</option>
            <option value="mri">MRI</option>
            <option value="ultrasound">Ultrasound</option>
            <option value="pet">PET Scan</option>
            <option value="nuclear">Nuclear</option>
          </select>
          <select name="priority" defaultValue={priorityFilter} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Priorities</option>
            <option value="stat">STAT</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
          </select>
          <select name="status" defaultValue={statusFilter} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Statuses</option>
            <option value="ordered">Ordered</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors">Filter</button>
          {(modalityFilter || statusFilter || priorityFilter) && (
            <Link href="/imaging" className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Clear</Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modality</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Body Part</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Indication</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordered By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordered</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders && orders.length > 0 ? (
                orders.map((order: any) => {
                  const result = order.imaging_results?.[0]
                  return (
                    <tr key={order.id} className={`hover:bg-blue-50/30 transition-colors ${order.priority === 'stat' ? 'bg-red-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <Badge variant={getPriorityVariant(order.priority)}>{order.priority.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/patients/${order.patient_id}/imaging`} className="font-medium text-gray-900 hover:text-blue-700 block">
                          {order.patient?.last_name}, {order.patient?.first_name}
                        </Link>
                        <span className="text-xs font-mono text-gray-400">{order.patient?.mrn}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg uppercase ${modalityColors[order.modality] || 'bg-gray-50 text-gray-700'}`}>
                          {order.modality}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{order.body_part}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-32 truncate">{order.clinical_indication || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">Dr. {order.provider?.full_name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(order.ordered_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(order.status)}>{order.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {result ? (
                          <Badge variant={result.report_status === 'final' ? 'success' : 'warning'}>
                            {result.report_status}
                          </Badge>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No imaging orders found
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
