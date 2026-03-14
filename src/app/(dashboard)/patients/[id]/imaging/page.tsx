import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { Badge, getStatusVariant, getPriorityVariant } from '@/components/ui/Badge'
import { ImageIcon } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
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

export default async function PatientImagingPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [{ data: patient }, { data: allergies }, { data: imagingOrders }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase.from('allergies').select('*').eq('patient_id', id).eq('status', 'active'),
    supabase.from('imaging_orders')
      .select(`
        *,
        provider:profiles!ordered_by(full_name),
        imaging_results(*, radiologist:profiles!radiologist_id(full_name))
      `)
      .eq('patient_id', id)
      .order('ordered_at', { ascending: false }),
  ])

  if (!patient) notFound()

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} allergies={allergies || []} />
      <PatientTabs patientId={id} />

      <div className="space-y-4">
        {imagingOrders && imagingOrders.length > 0 ? (
          imagingOrders.map((order: any) => {
            const result = order.imaging_results?.[0]
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg uppercase ${modalityColors[order.modality] || 'bg-gray-50 text-gray-700'}`}>
                        {order.modality}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.body_part}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={getPriorityVariant(order.priority)}>{order.priority.toUpperCase()}</Badge>
                          <Badge variant={getStatusVariant(order.status)}>{order.status.replace('_', ' ')}</Badge>
                          {result && (
                            <Badge variant={result.report_status === 'final' ? 'success' : 'warning'}>
                              {result.report_status} report
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Ordered by Dr. {order.provider?.full_name} &middot; {formatDateTime(order.ordered_at)}
                          {order.completed_at && ` · Completed: ${formatDateTime(order.completed_at)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  {order.clinical_indication && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium text-gray-700">Indication: </span>
                      {order.clinical_indication}
                    </p>
                  )}
                </div>

                {result && (
                  <div className="px-6 py-4 space-y-3">
                    {result.radiologist && (
                      <p className="text-xs text-gray-400">
                        Read by Dr. {result.radiologist.full_name}
                      </p>
                    )}
                    {result.findings && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Findings</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.findings}</p>
                      </div>
                    )}
                    {result.impression && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Impression</p>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{result.impression}</p>
                      </div>
                    )}
                    {result.recommendations && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Recommendations</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.recommendations}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-12 text-center">
            <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No imaging orders on file</p>
          </div>
        )}
      </div>
    </div>
  )
}
