import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { Badge, getStatusVariant, getInterpretationVariant } from '@/components/ui/Badge'
import Link from 'next/link'
import {
  MapPin,
  Phone,
  Mail,
  Shield,
  User,
  AlertTriangle,
  Pill,
  FlaskConical,
  Stethoscope,
  Calendar,
  Activity,
} from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function calculateAge(dob: string): number {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export default async function PatientChartPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [
    { data: patient },
    { data: allergies },
    { data: activeDiagnoses },
    { data: activeMeds },
    { data: recentVitals },
    { data: upcomingAppts },
    { data: recentLabs },
  ] = await Promise.all([
    supabase.from('patients')
      .select('*, primary_provider:profiles!primary_provider_id(full_name, role)')
      .eq('id', id)
      .single(),
    supabase.from('allergies')
      .select('*')
      .eq('patient_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase.from('diagnoses')
      .select('*, provider:profiles!diagnosed_by(full_name)')
      .eq('patient_id', id)
      .eq('status', 'active')
      .order('diagnosed_at', { ascending: false })
      .limit(5),
    supabase.from('medication_orders')
      .select('*, medication:medications(name, strength, dosage_form), prescriber:profiles!prescribed_by(full_name)')
      .eq('patient_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('vital_signs')
      .select('*')
      .eq('patient_id', id)
      .order('recorded_at', { ascending: false })
      .limit(1),
    supabase.from('appointments')
      .select('*, provider:profiles!provider_id(full_name), department:departments(name)')
      .eq('patient_id', id)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .in('status', ['scheduled', 'confirmed'])
      .order('scheduled_date', { ascending: true })
      .limit(3),
    supabase.from('lab_orders')
      .select('*, lab_results(*)')
      .eq('patient_id', id)
      .order('ordered_at', { ascending: false })
      .limit(5),
  ])

  if (!patient) notFound()

  const latestVital = recentVitals?.[0]

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} allergies={allergies || []} />
      <PatientTabs patientId={id} />

      {/* Overview content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Demographics */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Demographics</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <dt className="text-gray-500 w-24">Name</dt>
                <dd className="font-medium text-gray-800">{patient.first_name} {patient.last_name}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <dt className="text-gray-500 w-24">DOB</dt>
                <dd className="text-gray-800">{formatDate(patient.date_of_birth)} (Age {calculateAge(patient.date_of_birth)})</dd>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <dt className="text-gray-500 w-24">Gender</dt>
                <dd className="text-gray-800 capitalize">{patient.gender}</dd>
              </div>
              {patient.blood_type && patient.blood_type !== 'unknown' && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Blood Type</dt>
                  <dd className="text-gray-800 font-semibold text-red-600">{patient.blood_type}</dd>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Phone</dt>
                  <dd className="text-gray-800">{patient.phone}</dd>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Email</dt>
                  <dd className="text-gray-800 truncate">{patient.email}</dd>
                </div>
              )}
              {(patient.address || patient.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <dt className="text-gray-500 w-24">Address</dt>
                  <dd className="text-gray-800">
                    {patient.address && <span>{patient.address}<br /></span>}
                    {[patient.city, patient.state, patient.zip].filter(Boolean).join(', ')}
                  </dd>
                </div>
              )}
              {patient.primary_provider && (
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                  <dt className="text-gray-500 w-24">Provider</dt>
                  <dd className="text-gray-800">Dr. {(patient.primary_provider as any).full_name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              Insurance
            </h3>
            {patient.insurance_provider ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Provider</dt>
                  <dd className="font-medium text-gray-800">{patient.insurance_provider}</dd>
                </div>
                {patient.insurance_id && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">ID</dt>
                    <dd className="text-gray-800 font-mono text-xs">{patient.insurance_id}</dd>
                  </div>
                )}
                {patient.insurance_group && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Group</dt>
                    <dd className="text-gray-800 font-mono text-xs">{patient.insurance_group}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-gray-400 text-sm">No insurance on file</p>
            )}
          </div>

          {/* Emergency Contact */}
          {patient.emergency_contact_name && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Emergency Contact</h3>
              <p className="font-medium text-gray-800 text-sm">{patient.emergency_contact_name}</p>
              {patient.emergency_contact_phone && (
                <p className="text-gray-500 text-sm mt-1">{patient.emergency_contact_phone}</p>
              )}
            </div>
          )}
        </div>

        {/* Right columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Latest Vitals */}
          {latestVital && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Latest Vitals</h3>
                <span className="text-xs text-gray-400">{formatDateTime(latestVital.recorded_at)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {latestVital.temperature && (
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Temp</p>
                    <p className="text-lg font-bold text-orange-600">{latestVital.temperature}°F</p>
                  </div>
                )}
                {latestVital.heart_rate && (
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Heart Rate</p>
                    <p className="text-lg font-bold text-red-600">{latestVital.heart_rate} bpm</p>
                  </div>
                )}
                {(latestVital.blood_pressure_systolic && latestVital.blood_pressure_diastolic) && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Blood Pressure</p>
                    <p className="text-lg font-bold text-blue-600">{latestVital.blood_pressure_systolic}/{latestVital.blood_pressure_diastolic}</p>
                  </div>
                )}
                {latestVital.oxygen_saturation && (
                  <div className="bg-teal-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">SpO2</p>
                    <p className="text-lg font-bold text-teal-600">{latestVital.oxygen_saturation}%</p>
                  </div>
                )}
                {latestVital.respiratory_rate && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Resp Rate</p>
                    <p className="text-lg font-bold text-green-600">{latestVital.respiratory_rate}/min</p>
                  </div>
                )}
                {latestVital.pain_scale !== null && latestVital.pain_scale !== undefined && (
                  <div className={`rounded-lg p-3 text-center ${latestVital.pain_scale >= 7 ? 'bg-red-50' : latestVital.pain_scale >= 4 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                    <p className="text-xs text-gray-500 mb-1">Pain Scale</p>
                    <p className={`text-lg font-bold ${latestVital.pain_scale >= 7 ? 'text-red-600' : latestVital.pain_scale >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {latestVital.pain_scale}/10
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Diagnoses */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Active Diagnoses</h3>
              <Badge variant="info">{activeDiagnoses?.length ?? 0}</Badge>
            </div>
            {activeDiagnoses && activeDiagnoses.length > 0 ? (
              <div className="space-y-2">
                {activeDiagnoses.map((dx: any) => (
                  <div key={dx.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                          {dx.icd10_code}
                        </span>
                        <Badge variant={dx.diagnosis_type === 'primary' ? 'danger' : dx.diagnosis_type === 'secondary' ? 'warning' : 'neutral'}>
                          {dx.diagnosis_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-800 mt-1 font-medium">{dx.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {dx.provider?.full_name} &middot; {formatDate(dx.diagnosed_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No active diagnoses</p>
            )}
          </div>

          {/* Current Medications */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-gray-400" />
                Current Medications
              </h3>
              <Link href={`/patients/${id}/medications`} className="text-xs text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            {activeMeds && activeMeds.length > 0 ? (
              <div className="space-y-2">
                {activeMeds.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {order.medication?.name}
                        {order.medication?.strength && <span className="text-gray-500 ml-1">{order.medication.strength}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{order.dose} {order.route} &middot; {order.frequency}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No active medications</p>
            )}
          </div>

          {/* Recent Lab Results */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-gray-400" />
                Recent Lab Orders
              </h3>
              <Link href={`/patients/${id}/labs`} className="text-xs text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            {recentLabs && recentLabs.length > 0 ? (
              <div className="space-y-2">
                {recentLabs.map((lab: any) => (
                  <div key={lab.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{lab.test_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(lab.ordered_at)}</p>
                    </div>
                    <Badge variant={getStatusVariant(lab.status)}>{lab.status.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No lab orders</p>
            )}
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppts && upcomingAppts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Upcoming Appointments
                </h3>
              </div>
              <div className="space-y-2">
                {upcomingAppts.map((appt: any) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{appt.appointment_type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(appt.scheduled_date)} at {appt.scheduled_time?.slice(0, 5)} &middot;
                        Dr. {appt.provider?.full_name} &middot; {appt.department?.name}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(appt.status)}>{appt.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
