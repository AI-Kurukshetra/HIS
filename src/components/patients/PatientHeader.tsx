import { AlertTriangle, User, Calendar, Droplets, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Patient, Allergy } from '@/types'

interface PatientHeaderProps {
  patient: Patient
  allergies?: Allergy[]
}

function calculateAge(dob: string): number {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const genderLabel: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  unknown: 'Unknown',
}

export function PatientHeader({ patient, allergies = [] }: PatientHeaderProps) {
  const hasSevereAllergies = allergies.some(
    (a) => a.status === 'active' && (a.severity === 'severe' || a.severity === 'life_threatening')
  )
  const activeAllergies = allergies.filter((a) => a.status === 'active')

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Allergy banner */}
      {activeAllergies.length > 0 && (
        <div className={`px-6 py-2 flex items-center gap-2 text-sm font-medium ${
          hasSevereAllergies
            ? 'bg-red-600 text-white'
            : 'bg-orange-100 text-orange-800 border-b border-orange-200'
        }`}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            ALLERGIES: {activeAllergies.map((a) => `${a.allergen} (${a.severity.replace('_', ' ')})`).join(' · ')}
          </span>
        </div>
      )}

      <div className="px-6 py-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-blue-600" />
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  <span className="font-mono text-blue-700 font-semibold text-sm bg-blue-50 px-2 py-0.5 rounded">
                    {patient.mrn}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(patient.date_of_birth)} &middot; Age {calculateAge(patient.date_of_birth)}
                  </span>
                  <span>{genderLabel[patient.gender] || patient.gender}</span>
                  {patient.blood_type && patient.blood_type !== 'unknown' && (
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-red-500" />
                      {patient.blood_type}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={patient.is_active ? 'success' : 'neutral'} size="md">
                {patient.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
              {patient.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {patient.phone}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {patient.email}
                </span>
              )}
              {patient.insurance_provider && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {patient.insurance_provider} &middot; {patient.insurance_id}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
