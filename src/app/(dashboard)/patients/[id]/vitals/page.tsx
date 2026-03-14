import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { Activity, Thermometer, Heart, Wind, Droplets } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function VitalTile({ label, value, unit, icon: Icon, colorClass, normalRange }: {
  label: string
  value: string | number | null | undefined
  unit?: string
  icon: React.ElementType
  colorClass: string
  normalRange?: string
}) {
  if (value === null || value === undefined) return null
  return (
    <div className={`rounded-xl p-4 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">
        {value}{unit && <span className="text-sm font-normal ml-1 opacity-70">{unit}</span>}
      </p>
      {normalRange && <p className="text-xs opacity-60 mt-1">Normal: {normalRange}</p>}
    </div>
  )
}

export default async function PatientVitalsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [{ data: patient }, { data: allergies }, { data: vitals }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase.from('allergies').select('*').eq('patient_id', id).eq('status', 'active'),
    supabase.from('vital_signs')
      .select('*, recorder:profiles!recorded_by(full_name)')
      .eq('patient_id', id)
      .order('recorded_at', { ascending: false })
      .limit(20),
  ])

  if (!patient) notFound()

  const latest = vitals?.[0]

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} allergies={allergies || []} />
      <PatientTabs patientId={id} />

      {/* Latest Vitals */}
      {latest && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Latest Vitals</h2>
            <span className="text-xs text-gray-400 ml-auto">{formatDateTime(latest.recorded_at)}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <VitalTile
              label="Temperature"
              value={latest.temperature}
              unit="°F"
              icon={Thermometer}
              colorClass="bg-orange-50 text-orange-700"
              normalRange="97-99°F"
            />
            <VitalTile
              label="Heart Rate"
              value={latest.heart_rate}
              unit="bpm"
              icon={Heart}
              colorClass="bg-red-50 text-red-700"
              normalRange="60-100 bpm"
            />
            {latest.blood_pressure_systolic && latest.blood_pressure_diastolic && (
              <div className="bg-blue-50 text-blue-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 opacity-70" />
                  <span className="text-xs font-medium opacity-70">Blood Pressure</span>
                </div>
                <p className="text-2xl font-bold">{latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}</p>
                <p className="text-xs opacity-60 mt-1">Normal: 120/80 mmHg</p>
              </div>
            )}
            <VitalTile
              label="Respiratory Rate"
              value={latest.respiratory_rate}
              unit="/min"
              icon={Wind}
              colorClass="bg-green-50 text-green-700"
              normalRange="12-20/min"
            />
            <VitalTile
              label="SpO2"
              value={latest.oxygen_saturation}
              unit="%"
              icon={Droplets}
              colorClass="bg-teal-50 text-teal-700"
              normalRange="≥95%"
            />
            <VitalTile
              label="Weight"
              value={latest.weight_kg}
              unit="kg"
              icon={Activity}
              colorClass="bg-purple-50 text-purple-700"
            />
            <VitalTile
              label="Height"
              value={latest.height_cm}
              unit="cm"
              icon={Activity}
              colorClass="bg-indigo-50 text-indigo-700"
            />
            {latest.pain_scale !== null && latest.pain_scale !== undefined && (
              <div className={`rounded-xl p-4 ${latest.pain_scale >= 7 ? 'bg-red-50 text-red-700' : latest.pain_scale >= 4 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 opacity-70" />
                  <span className="text-xs font-medium opacity-70">Pain Scale</span>
                </div>
                <p className="text-2xl font-bold">{latest.pain_scale}<span className="text-sm font-normal ml-1 opacity-70">/10</span></p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Recorded by: {(latest as any).recorder?.full_name || 'Unknown'}
          </p>
        </div>
      )}

      {/* Vitals History Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Vitals History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Temp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">HR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SpO2</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pain</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vitals && vitals.length > 0 ? (
                vitals.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDateTime(v.recorded_at)}</td>
                    <td className="px-4 py-3 text-gray-700">{v.temperature ? `${v.temperature}°F` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{v.heart_rate ? `${v.heart_rate} bpm` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {v.blood_pressure_systolic && v.blood_pressure_diastolic
                        ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-700">{v.respiratory_rate ? `${v.respiratory_rate}/min` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{v.oxygen_saturation ? `${v.oxygen_saturation}%` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {v.pain_scale !== null && v.pain_scale !== undefined ? `${v.pain_scale}/10` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{v.recorder?.full_name || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No vitals recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
