import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, getStatusVariant, getPriorityVariant } from '@/components/ui/Badge'
import { Plus, ClipboardList, AlertTriangle } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface SearchParams {
  type?: string
  priority?: string
  status?: string
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const typeFilter = searchParams.type || ''
  const priorityFilter = searchParams.priority || ''
  const statusFilter = searchParams.status || ''

  let query = supabase
    .from('orders')
    .select(`
      *,
      patient:patients(first_name, last_name, mrn),
      provider:profiles!ordered_by(full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (typeFilter) query = query.eq('order_type', typeFilter)
  if (priorityFilter) query = query.eq('priority', priorityFilter)
  if (statusFilter) query = query.eq('status', statusFilter)

  const { data: orders, count } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CPOE - Orders</h1>
          <p className="text-gray-500 text-sm">{count ?? 0} total orders</p>
        </div>
        <Link
          href="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Stat/Urgent Alert */}
      {orders && orders.some((o: any) => o.priority === 'stat' && o.status === 'pending') && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            There are STAT orders pending immediate action. Please review and respond.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex items-center gap-3 flex-wrap">
          <select
            name="type"
            defaultValue={typeFilter}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="medication">Medication</option>
            <option value="lab">Lab</option>
            <option value="imaging">Imaging</option>
            <option value="procedure">Procedure</option>
            <option value="referral">Referral</option>
            <option value="diet">Diet</option>
            <option value="activity">Activity</option>
          </select>
          <select
            name="priority"
            defaultValue={priorityFilter}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="stat">STAT</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors">
            Filter
          </button>
          {(typeFilter || priorityFilter || statusFilter) && (
            <Link href="/orders" className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Clear</Link>
          )}
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordered By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-blue-50/30 transition-colors ${
                      order.priority === 'stat' && order.status === 'pending' ? 'bg-red-50/30' :
                      order.priority === 'urgent' && order.status === 'pending' ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Badge variant={getPriorityVariant(order.priority)}>
                        {order.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/patients/${order.patient_id}`} className="font-medium text-gray-900 hover:text-blue-700">
                        {order.patient?.last_name}, {order.patient?.first_name}
                      </Link>
                      <p className="text-xs font-mono text-gray-400">{order.patient?.mrn}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{order.order_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{order.description}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">Dr. {order.provider?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No orders found
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
