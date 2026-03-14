'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Save, AlertCircle, Search } from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  mrn: string
  first_name: string
  last_name: string
  date_of_birth: string
}

interface Provider {
  id: string
  full_name: string
}

interface Department {
  id: string
  name: string
}

interface Bed {
  id: string
  room_number: string
  bed_number: string
  department_id: string
}

export default function NewEncounterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [form, setForm] = useState({
    patient_id: '',
    provider_id: '',
    department_id: '',
    encounter_type: 'outpatient',
    chief_complaint: '',
    bed_id: '',
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('patients').select('id, mrn, first_name, last_name, date_of_birth').eq('is_active', true).order('last_name').limit(100),
      supabase.from('profiles').select('id, full_name').in('role', ['doctor']).order('full_name'),
      supabase.from('departments').select('id, name').order('name'),
      supabase.from('beds').select('id, room_number, bed_number, department_id').eq('status', 'available'),
    ]).then(([p, pr, d, b]) => {
      if (p.data) setPatients(p.data)
      if (pr.data) setProviders(pr.data)
      if (d.data) setDepartments(d.data)
      if (b.data) setAvailableBeds(b.data)
    })
  }, [])

  useEffect(() => {
    if (patientSearch.length > 1) {
      const q = patientSearch.toLowerCase()
      setFilteredPatients(
        patients.filter(
          (p) =>
            p.first_name.toLowerCase().includes(q) ||
            p.last_name.toLowerCase().includes(q) ||
            p.mrn.toLowerCase().includes(q)
        ).slice(0, 8)
      )
      setShowPatientDropdown(true)
    } else {
      setShowPatientDropdown(false)
    }
  }, [patientSearch, patients])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setForm((prev) => ({ ...prev, patient_id: patient.id }))
    setPatientSearch(`${patient.last_name}, ${patient.first_name} (${patient.mrn})`)
    setShowPatientDropdown(false)
  }

  const bedsForDept = form.department_id
    ? availableBeds.filter((b) => b.department_id === form.department_id)
    : availableBeds

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.patient_id || !form.provider_id || !form.department_id) {
      setError('Patient, provider, and department are required.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: insertError } = await supabase
      .from('encounters')
      .insert({
        patient_id: form.patient_id,
        provider_id: form.provider_id,
        department_id: form.department_id,
        encounter_type: form.encounter_type,
        chief_complaint: form.chief_complaint || null,
        bed_id: form.bed_id || null,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Update bed status if bed selected
    if (form.bed_id) {
      await supabase
        .from('beds')
        .update({ status: 'occupied', patient_id: form.patient_id })
        .eq('id', form.bed_id)
    }

    router.push('/encounters')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/encounters" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Encounter</h1>
          <p className="text-gray-500 text-sm">Register a new patient encounter</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Patient <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onFocus={() => patientSearch.length > 1 && setShowPatientDropdown(true)}
                placeholder="Search patient by name or MRN..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {showPatientDropdown && filteredPatients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <p className="font-medium text-gray-900">{p.last_name}, {p.first_name}</p>
                    <p className="text-gray-400 text-xs font-mono">{p.mrn} &middot; DOB: {p.date_of_birth}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Encounter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Encounter Type <span className="text-red-500">*</span>
            </label>
            <select
              name="encounter_type"
              value={form.encounter_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="outpatient">Outpatient</option>
              <option value="inpatient">Inpatient</option>
              <option value="emergency">Emergency</option>
              <option value="surgical">Surgical</option>
            </select>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chief Complaint</label>
            <textarea
              name="chief_complaint"
              value={form.chief_complaint}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the primary reason for this encounter..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Attending Provider <span className="text-red-500">*</span>
            </label>
            <select
              name="provider_id"
              value={form.provider_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select provider...</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>Dr. {p.full_name}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Bed Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign Bed
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <select
              name="bed_id"
              value={form.bed_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No bed assignment</option>
              {bedsForDept.map((b) => (
                <option key={b.id} value={b.id}>Room {b.room_number} - Bed {b.bed_number}</option>
              ))}
            </select>
            {bedsForDept.length === 0 && form.department_id && (
              <p className="text-xs text-orange-600 mt-1">No available beds in selected department</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/encounters" className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
            ) : (
              <><Save className="w-4 h-4" />Create Encounter</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
