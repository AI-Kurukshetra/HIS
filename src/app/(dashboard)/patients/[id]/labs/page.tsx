import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { Badge, getStatusVariant, getInterpretationVariant, getPriorityVariant } from '@/components/ui/Badge'
import { FlaskConical } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default async function PatientLabsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [{ data: patient }, { data: allergies }, { data: labOrders }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase.from('allergies').select('*').eq('patient_id', id).eq('status', 'active'),
    supabase.from('lab_orders')
      .select('*, provider:profiles!ordered_by(full_name), lab_results(*)')
      .eq('patient_id', id)
      .order('ordered_at', { ascending: false }),
  ])

  if (!patient) notFound()

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} allergies={allergies || []} />
      <PatientTabs patientId={id} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Lab Results History</h2>
          <Badge variant="info">{labOrders?.length ?? 0}</Badge>
        </div>

        <div className="divide-y divide-gray-50">
          {labOrders && labOrders.length > 0 ? (
            labOrders.map((order: any) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{order.test_name}</p>
                      {order.test_code && (
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{order.test_code}</span>
                      )}
                      <Badge variant={getPriorityVariant(order.priority)}>{order.priority.toUpperCase()}</Badge>
                      <Badge variant={getStatusVariant(order.status)}>{order.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Ordered by Dr. {order.provider?.full_name} &middot; {formatDateTime(order.ordered_at)}
                      {order.collected_at && ` · Collected: ${formatDateTime(order.collected_at)}`}
                      {order.resulted_at && ` · Resulted: ${formatDateTime(order.resulted_at)}`}
                    </p>
                  </div>
                </div>

                {/* Results */}
                {order.lab_results && order.lab_results.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Result</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Value</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Reference Range</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.lab_results.map((result: any) => (
                          <tr key={result.id} className={`${result.interpretation === 'critical_high' || result.interpretation === 'critical_low' ? 'bg-red-50' : ''}`}>
                            <td className="px-3 py-2 text-gray-700">Result</td>
                            <td className="px-3 py-2">
                              <span className={`font-semibold ${
                                result.interpretation === 'critical_high' || result.interpretation === 'critical_low'
                                  ? 'text-red-600'
                                  : result.interpretation === 'abnormal'
                                  ? 'text-orange-600'
                                  : 'text-gray-900'
                              }`}>
                                {result.result_value}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">{result.unit || '—'}</td>
                            <td className="px-3 py-2 text-gray-500">{result.reference_range || '—'}</td>
                            <td className="px-3 py-2">
                              <Badge variant={getInterpretationVariant(result.interpretation)}>
                                {result.interpretation.replace('_', ' ')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {order.notes && (
                  <p className="mt-2 text-xs text-gray-500 italic">{order.notes}</p>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-400">No lab orders on file</div>
          )}
        </div>
      </div>
    </div>
  )
}
