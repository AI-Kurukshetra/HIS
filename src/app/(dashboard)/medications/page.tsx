import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { Plus, Pill, AlertTriangle } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

interface SearchParams {
  patient?: string
  status?: string
}

export default async function MedicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const patientFilter = searchParams.patient || ''
  const statusFilter = searchParams.status || 'active'

  let query = supabase
    .from('medication_orders')
    .select(`
      *,
      patient:patients(id, first_name, last_name, mrn),
      medication:medications(name, generic_name, strength, dosage_form, controlled_substance, drug_class),
      prescriber:profiles!prescribed_by(full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (patientFilter) {
    // We need to join via patient name search - use ilike on related fields
  }

  const { data: orders, count } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medication Orders</h1>
          <p className="text-gray-500 text-sm">{count ?? 0} medication orders</p>
        </div>
        <Link
          href="/medications/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Prescription
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex items-center gap-3 flex-wrap">
          <select
            name="status"
            defaultValue={statusFilter}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="hold">On Hold</option>
            <option value="discontinued">Discontinued</option>
            <option value="completed">Completed</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors">
            Filter
          </button>
          {(statusFilter && statusFilter !== 'active') && (
            <Link href="/medications" className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Reset</Link>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medication</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dose</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prescriber</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/patients/${order.patient_id}/medications`} className="font-medium text-gray-900 hover:text-blue-700 block">
                        {order.patient?.last_name}, {order.patient?.first_name}
                      </Link>
                      <span className="text-xs font-mono text-gray-400">{order.patient?.mrn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.medication?.name}</p>
                      {order.medication?.generic_name && order.medication.generic_name !== order.medication.name && (
                        <p className="text-xs text-gray-400 italic">{order.medication.generic_name}</p>
                      )}
                      <p className="text-xs text-gray-400">{order.medication?.drug_class}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.dose}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{order.route.toUpperCase()}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{order.frequency}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">Dr. {order.prescriber?.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(order.start_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {order.medication?.controlled_substance && (
                          <Badge variant="danger">DEA</Badge>
                        )}
                        {order.status === 'hold' && (
                          <Badge variant="warning">On Hold</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    <Pill className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No medication orders found
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
