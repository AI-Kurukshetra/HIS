import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { Activity } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PatientEncountersPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [{ data: patient }, { data: allergies }, { data: encounters }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase.from('allergies').select('*').eq('patient_id', id).eq('status', 'active'),
    supabase.from('encounters')
      .select(`
        *,
        provider:profiles!provider_id(full_name),
        department:departments(name),
        bed:beds(room_number, bed_number)
      `)
      .eq('patient_id', id)
      .order('admit_date', { ascending: false }),
  ])

  if (!patient) notFound()

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} allergies={allergies || []} />
      <PatientTabs patientId={id} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            Encounter History
          </h2>
          <span className="text-sm text-gray-400">{encounters?.length ?? 0} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chief Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admit Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Discharge</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {encounters && encounters.length > 0 ? (
                encounters.map((enc: any) => (
                  <tr key={enc.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="capitalize font-medium text-gray-800">{enc.encounter_type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{enc.chief_complaint || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">Dr. {enc.provider?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{enc.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(enc.admit_date)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {enc.discharge_date ? formatDateTime(enc.discharge_date) : <span className="text-gray-400">Ongoing</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(enc.status)}>{enc.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No encounters recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
