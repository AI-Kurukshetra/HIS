export type UserRole = 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'lab_tech' | 'receptionist' | 'billing'

export type Gender = 'male' | 'female' | 'other' | 'unknown'

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown'

export type EncounterType = 'inpatient' | 'outpatient' | 'emergency' | 'surgical'

export type EncounterStatus = 'active' | 'discharged' | 'transferred' | 'cancelled'

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance'

export type DiagnosisType = 'primary' | 'secondary' | 'working'

export type DiagnosisStatus = 'active' | 'resolved' | 'chronic'

export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening'

export type AllergyStatus = 'active' | 'inactive'

export type MedicationRoute = 'oral' | 'iv' | 'im' | 'topical' | 'inhaled' | 'sublingual'

export type MedicationOrderStatus = 'active' | 'discontinued' | 'completed' | 'hold'

export type LabPriority = 'routine' | 'urgent' | 'stat'

export type LabStatus = 'ordered' | 'collected' | 'processing' | 'resulted' | 'cancelled'

export type LabInterpretation = 'normal' | 'abnormal' | 'critical_high' | 'critical_low' | 'pending'

export type ImagingModality = 'xray' | 'ct' | 'mri' | 'ultrasound' | 'pet' | 'nuclear'

export type ImagingPriority = 'routine' | 'urgent' | 'stat'

export type ImagingStatus = 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export type ImagingReportStatus = 'preliminary' | 'final' | 'amended'

export type NoteType = 'progress' | 'admission' | 'discharge' | 'procedure' | 'nursing' | 'consultation' | 'soap'

export type NoteStatus = 'draft' | 'signed' | 'amended'

export type OrderType = 'medication' | 'lab' | 'imaging' | 'procedure' | 'referral' | 'diet' | 'activity'

export type OrderPriority = 'routine' | 'urgent' | 'stat'

export type OrderStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type AppointmentType = 'new_patient' | 'follow_up' | 'procedure' | 'telehealth' | 'urgent'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'appealed' | 'paid'

export type AlertType = 'drug_interaction' | 'allergy' | 'critical_result' | 'duplicate_order' | 'dosing' | 'clinical_decision'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Department {
  id: string
  name: string
  code: string
  floor: number | null
  bed_count: number
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  department_id: string | null
  license_number: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  department?: Department
}

export interface Patient {
  id: string
  mrn: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: Gender
  blood_type: BloodType | null
  ssn_last4: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  insurance_provider: string | null
  insurance_id: string | null
  insurance_group: string | null
  primary_provider_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  primary_provider?: Profile
}

export interface Bed {
  id: string
  room_number: string
  bed_number: string
  department_id: string
  status: BedStatus
  patient_id: string | null
  created_at: string
  updated_at: string
  department?: Department
  patient?: Patient
}

export interface Encounter {
  id: string
  patient_id: string
  provider_id: string
  department_id: string
  encounter_type: EncounterType
  chief_complaint: string | null
  status: EncounterStatus
  admit_date: string
  discharge_date: string | null
  discharge_disposition: string | null
  bed_id: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  provider?: Profile
  department?: Department
  bed?: Bed
}

export interface Diagnosis {
  id: string
  encounter_id: string
  patient_id: string
  icd10_code: string
  description: string
  diagnosis_type: DiagnosisType
  status: DiagnosisStatus
  diagnosed_by: string
  diagnosed_at: string
  notes: string | null
  provider?: Profile
}

export interface Allergy {
  id: string
  patient_id: string
  allergen: string
  reaction: string | null
  severity: AllergySeverity
  status: AllergyStatus
  recorded_by: string
  created_at: string
  provider?: Profile
}

export interface VitalSign {
  id: string
  encounter_id: string
  patient_id: string
  recorded_by: string
  temperature: number | null
  heart_rate: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  respiratory_rate: number | null
  oxygen_saturation: number | null
  weight_kg: number | null
  height_cm: number | null
  pain_scale: number | null
  recorded_at: string
  provider?: Profile
}

export interface Medication {
  id: string
  name: string
  generic_name: string | null
  drug_class: string | null
  dosage_form: string | null
  strength: string | null
  manufacturer: string | null
  ndc_code: string | null
  requires_prior_auth: boolean
  controlled_substance: boolean
  created_at: string
}

export interface MedicationOrder {
  id: string
  patient_id: string
  encounter_id: string
  medication_id: string
  prescribed_by: string
  dose: string
  route: MedicationRoute
  frequency: string
  start_date: string
  end_date: string | null
  status: MedicationOrderStatus
  indication: string | null
  special_instructions: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  medication?: Medication
  prescriber?: Profile
}

export interface MedicationAdministration {
  id: string
  medication_order_id: string
  patient_id: string
  administered_by: string
  administered_at: string
  dose_given: string
  site: string | null
  notes: string | null
  provider?: Profile
}

export interface LabOrder {
  id: string
  patient_id: string
  encounter_id: string
  ordered_by: string
  test_name: string
  test_code: string | null
  priority: LabPriority
  status: LabStatus
  ordered_at: string
  collected_at: string | null
  resulted_at: string | null
  notes: string | null
  patient?: Patient
  provider?: Profile
  lab_results?: LabResult[]
}

export interface LabResult {
  id: string
  lab_order_id: string
  patient_id: string
  result_value: string
  reference_range: string | null
  unit: string | null
  interpretation: LabInterpretation
  verified_by: string | null
  created_at: string
  verifier?: Profile
}

export interface ImagingOrder {
  id: string
  patient_id: string
  encounter_id: string
  ordered_by: string
  modality: ImagingModality
  body_part: string
  priority: ImagingPriority
  clinical_indication: string | null
  status: ImagingStatus
  ordered_at: string
  scheduled_at: string | null
  completed_at: string | null
  patient?: Patient
  provider?: Profile
  imaging_results?: ImagingResult[]
}

export interface ImagingResult {
  id: string
  imaging_order_id: string
  patient_id: string
  radiologist_id: string | null
  findings: string | null
  impression: string | null
  recommendations: string | null
  report_status: ImagingReportStatus
  created_at: string
  updated_at: string
  radiologist?: Profile
}

export interface ClinicalNote {
  id: string
  patient_id: string
  encounter_id: string
  author_id: string
  note_type: NoteType
  title: string
  content: string
  status: NoteStatus
  created_at: string
  updated_at: string
  signed_at: string | null
  author?: Profile
  patient?: Patient
}

export interface Order {
  id: string
  patient_id: string
  encounter_id: string
  ordered_by: string
  order_type: OrderType
  description: string
  priority: OrderPriority
  status: OrderStatus
  created_at: string
  updated_at: string
  patient?: Patient
  provider?: Profile
}

export interface Appointment {
  id: string
  patient_id: string
  provider_id: string
  department_id: string
  appointment_type: AppointmentType
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  status: AppointmentStatus
  chief_complaint: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  patient?: Patient
  provider?: Profile
  department?: Department
}

export interface InsuranceClaim {
  id: string
  patient_id: string
  encounter_id: string
  claim_number: string
  insurance_provider: string
  insurance_id: string
  group_number: string | null
  total_charges: number
  submitted_amount: number | null
  approved_amount: number | null
  patient_responsibility: number | null
  status: ClaimStatus
  submitted_at: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  encounter?: Encounter
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: Profile
}

export interface Alert {
  id: string
  patient_id: string
  encounter_id: string | null
  alert_type: AlertType
  severity: AlertSeverity
  message: string
  is_acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  created_at: string
  patient?: Patient
  acknowledger?: Profile
}
