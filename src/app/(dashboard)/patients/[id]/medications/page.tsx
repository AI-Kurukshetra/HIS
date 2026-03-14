import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { Pill } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function PatientMedicationsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [{ data: patient }, { data: allergies }, { data: activeMeds }, { data: pastMeds }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase.from('allergies').select('*').eq('patient_id', id).eq('status', 'active'),
    supabase.from('medication_orders')
      .select('*, medication:medications(name, generic_name, strength, dosage_form, drug_class, controlled_substance), prescriber:profiles!prescribed_by(full_name)')
      .eq('patient_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase.from('medication_orders')
      .select('*, medication:medications(name, strength), prescriber:profiles!prescribed_by(full_name)')
      .eq('patient_id', id)
      .in('status', ['discontinued', 'completed'])
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  if (!patient) notFound()

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} allergies={allergies || []} />
      <PatientTabs patientId={id} />

      {/* Active Medications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Pill className="w-4 h-4 text-green-600" />
          <h2 className="font-semibold text-gray-900">Active Medications</h2>
          <Badge variant="success">{activeMeds?.length ?? 0}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medication</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dose</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prescriber</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeMeds && activeMeds.length > 0 ? (
                activeMeds.map((order: any) => (
                  <tr key={order.id} className="hover:bg-green-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.medication?.name}</p>
                      {order.medication?.generic_name && order.medication.generic_name !== order.medication.name && (
                        <p className="text-xs text-gray-400 italic">{order.medication.generic_name}</p>
                      )}
                      {order.medication?.drug_class && (
                        <p className="text-xs text-gray-400">{order.medication.drug_class}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.dose}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{order.route.toUpperCase()}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.frequency}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">Dr. {order.prescriber?.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(order.start_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.medication?.controlled_substance && (
                          <Badge variant="danger">DEA</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No active medications</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Past Medications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Pill className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Past Medications</h2>
          <Badge variant="neutral">{pastMeds?.length ?? 0}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medication</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dose / Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prescriber</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pastMeds && pastMeds.length > 0 ? (
                pastMeds.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{order.medication?.name}</p>
                      <p className="text-xs text-gray-400">{order.medication?.strength}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{order.dose} · {order.route}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">Dr. {order.prescriber?.full_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.start_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No past medications</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
