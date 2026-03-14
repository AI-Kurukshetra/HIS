-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create MRN sequence
CREATE SEQUENCE IF NOT EXISTS mrn_sequence START 1;

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'receptionist', 'billing');
CREATE TYPE encounter_type AS ENUM ('inpatient', 'outpatient', 'emergency', 'surgical');
CREATE TYPE encounter_status AS ENUM ('active', 'discharged', 'transferred', 'cancelled');
CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'cleaning', 'maintenance');
CREATE TYPE diagnosis_type AS ENUM ('primary', 'secondary', 'working');
CREATE TYPE diagnosis_status AS ENUM ('active', 'resolved', 'chronic');
CREATE TYPE allergy_severity AS ENUM ('mild', 'moderate', 'severe', 'life_threatening');
CREATE TYPE allergy_status AS ENUM ('active', 'inactive');
CREATE TYPE medication_route AS ENUM ('oral', 'iv', 'im', 'topical', 'inhaled', 'sublingual');
CREATE TYPE medication_order_status AS ENUM ('active', 'discontinued', 'completed', 'hold');
CREATE TYPE lab_priority AS ENUM ('routine', 'urgent', 'stat');
CREATE TYPE lab_status AS ENUM ('ordered', 'collected', 'processing', 'resulted', 'cancelled');
CREATE TYPE lab_interpretation AS ENUM ('normal', 'abnormal', 'critical_high', 'critical_low', 'pending');
CREATE TYPE imaging_modality AS ENUM ('xray', 'ct', 'mri', 'ultrasound', 'pet', 'nuclear');
CREATE TYPE imaging_priority AS ENUM ('routine', 'urgent', 'stat');
CREATE TYPE imaging_status AS ENUM ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE imaging_report_status AS ENUM ('preliminary', 'final', 'amended');
CREATE TYPE note_type AS ENUM ('progress', 'admission', 'discharge', 'procedure', 'nursing', 'consultation', 'soap');
CREATE TYPE note_status AS ENUM ('draft', 'signed', 'amended');
CREATE TYPE order_type AS ENUM ('medication', 'lab', 'imaging', 'procedure', 'referral', 'diet', 'activity');
CREATE TYPE order_priority AS ENUM ('routine', 'urgent', 'stat');
CREATE TYPE order_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE appointment_type AS ENUM ('new_patient', 'follow_up', 'procedure', 'telehealth', 'urgent');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE claim_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'denied', 'appealed', 'paid');
CREATE TYPE alert_type AS ENUM ('drug_interaction', 'allergy', 'critical_result', 'duplicate_order', 'dosing', 'clinical_decision');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'unknown');
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown');

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  floor INTEGER,
  bed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'nurse',
  department_id UUID REFERENCES departments(id),
  license_number TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beds table
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  status bed_status NOT NULL DEFAULT 'available',
  patient_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mrn TEXT NOT NULL UNIQUE DEFAULT ('MRN' || LPAD(nextval('mrn_sequence')::TEXT, 8, '0')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL DEFAULT 'unknown',
  blood_type blood_type DEFAULT 'unknown',
  ssn_last4 TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  insurance_provider TEXT,
  insurance_id TEXT,
  insurance_group TEXT,
  primary_provider_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Encounters table
CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES profiles(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  encounter_type encounter_type NOT NULL,
  chief_complaint TEXT,
  status encounter_status NOT NULL DEFAULT 'active',
  admit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  discharge_disposition TEXT,
  bed_id UUID REFERENCES beds(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add bed patient FK after encounters
ALTER TABLE beds ADD CONSTRAINT beds_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id);

-- Diagnoses table
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  encounter_id UUID REFERENCES encounters(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  icd10_code TEXT NOT NULL,
  description TEXT NOT NULL,
  diagnosis_type diagnosis_type NOT NULL DEFAULT 'working',
  status diagnosis_status NOT NULL DEFAULT 'active',
  diagnosed_by UUID NOT NULL REFERENCES profiles(id),
  diagnosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Allergies table
CREATE TABLE IF NOT EXISTS allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  allergen TEXT NOT NULL,
  reaction TEXT,
  severity allergy_severity NOT NULL DEFAULT 'mild',
  status allergy_status NOT NULL DEFAULT 'active',
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vital signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  encounter_id UUID REFERENCES encounters(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  temperature NUMERIC(5,2),
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  respiratory_rate INTEGER,
  oxygen_saturation NUMERIC(5,2),
  weight_kg NUMERIC(6,2),
  height_cm NUMERIC(5,2),
  pain_scale INTEGER CHECK (pain_scale BETWEEN 0 AND 10),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  generic_name TEXT,
  drug_class TEXT,
  dosage_form TEXT,
  strength TEXT,
  manufacturer TEXT,
  ndc_code TEXT,
  requires_prior_auth BOOLEAN NOT NULL DEFAULT FALSE,
  controlled_substance BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medication orders table
CREATE TABLE IF NOT EXISTS medication_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  medication_id UUID NOT NULL REFERENCES medications(id),
  prescribed_by UUID NOT NULL REFERENCES profiles(id),
  dose TEXT NOT NULL,
  route medication_route NOT NULL DEFAULT 'oral',
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status medication_order_status NOT NULL DEFAULT 'active',
  indication TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medication administrations table
CREATE TABLE IF NOT EXISTS medication_administrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_order_id UUID NOT NULL REFERENCES medication_orders(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  administered_by UUID NOT NULL REFERENCES profiles(id),
  administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dose_given TEXT NOT NULL,
  site TEXT,
  notes TEXT
);

-- Lab orders table
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  ordered_by UUID NOT NULL REFERENCES profiles(id),
  test_name TEXT NOT NULL,
  test_code TEXT,
  priority lab_priority NOT NULL DEFAULT 'routine',
  status lab_status NOT NULL DEFAULT 'ordered',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  collected_at TIMESTAMPTZ,
  resulted_at TIMESTAMPTZ,
  notes TEXT
);

-- Lab results table
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id UUID NOT NULL REFERENCES lab_orders(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  result_value TEXT NOT NULL,
  reference_range TEXT,
  unit TEXT,
  interpretation lab_interpretation NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Imaging orders table
CREATE TABLE IF NOT EXISTS imaging_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  ordered_by UUID NOT NULL REFERENCES profiles(id),
  modality imaging_modality NOT NULL,
  body_part TEXT NOT NULL,
  priority imaging_priority NOT NULL DEFAULT 'routine',
  clinical_indication TEXT,
  status imaging_status NOT NULL DEFAULT 'ordered',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Imaging results table
CREATE TABLE IF NOT EXISTS imaging_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imaging_order_id UUID NOT NULL REFERENCES imaging_orders(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  radiologist_id UUID REFERENCES profiles(id),
  findings TEXT,
  impression TEXT,
  recommendations TEXT,
  report_status imaging_report_status NOT NULL DEFAULT 'preliminary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clinical notes table
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  author_id UUID NOT NULL REFERENCES profiles(id),
  note_type note_type NOT NULL DEFAULT 'progress',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status note_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at TIMESTAMPTZ
);

-- Orders table (general CPOE)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  ordered_by UUID NOT NULL REFERENCES profiles(id),
  order_type order_type NOT NULL,
  description TEXT NOT NULL,
  priority order_priority NOT NULL DEFAULT 'routine',
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES profiles(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  appointment_type appointment_type NOT NULL DEFAULT 'follow_up',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  chief_complaint TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insurance claims table
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  claim_number TEXT NOT NULL UNIQUE DEFAULT ('CLM' || LPAD(nextval('mrn_sequence')::TEXT, 8, '0')),
  insurance_provider TEXT NOT NULL,
  insurance_id TEXT NOT NULL,
  group_number TEXT,
  total_charges NUMERIC(12,2) NOT NULL DEFAULT 0,
  submitted_amount NUMERIC(12,2),
  approved_amount NUMERIC(12,2),
  patient_responsibility NUMERIC(12,2),
  status claim_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  alert_type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'warning',
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department_id ON profiles(department_id);
CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_primary_provider_id ON patients(primary_provider_id);
CREATE INDEX idx_patients_is_active ON patients(is_active);
CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_provider_id ON encounters(provider_id);
CREATE INDEX idx_encounters_department_id ON encounters(department_id);
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_encounters_admit_date ON encounters(admit_date);
CREATE INDEX idx_beds_department_id ON beds(department_id);
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_diagnoses_encounter_id ON diagnoses(encounter_id);
CREATE INDEX idx_diagnoses_patient_id ON diagnoses(patient_id);
CREATE INDEX idx_allergies_patient_id ON allergies(patient_id);
CREATE INDEX idx_vital_signs_patient_id ON vital_signs(patient_id);
CREATE INDEX idx_vital_signs_encounter_id ON vital_signs(encounter_id);
CREATE INDEX idx_vital_signs_recorded_at ON vital_signs(recorded_at);
CREATE INDEX idx_medication_orders_patient_id ON medication_orders(patient_id);
CREATE INDEX idx_medication_orders_encounter_id ON medication_orders(encounter_id);
CREATE INDEX idx_medication_orders_status ON medication_orders(status);
CREATE INDEX idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_encounter_id ON lab_orders(encounter_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);
CREATE INDEX idx_lab_results_lab_order_id ON lab_results(lab_order_id);
CREATE INDEX idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX idx_imaging_orders_patient_id ON imaging_orders(patient_id);
CREATE INDEX idx_imaging_orders_status ON imaging_orders(status);
CREATE INDEX idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_encounter_id ON clinical_notes(encounter_id);
CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_priority ON orders(priority);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_insurance_claims_patient_id ON insurance_claims(patient_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_alerts_patient_id ON alerts(patient_id);
CREATE INDEX idx_alerts_is_acknowledged ON alerts(is_acknowledged);

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_orders_updated_at BEFORE UPDATE ON medication_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imaging_results_updated_at BEFORE UPDATE ON imaging_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (is_admin());

-- Departments policies
CREATE POLICY "departments_read" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_insert" ON departments FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "departments_update" ON departments FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "departments_delete" ON departments FOR DELETE TO authenticated USING (is_admin());

-- Generic read/insert/update/delete for clinical tables
-- Patients
CREATE POLICY "patients_read" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "patients_insert" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "patients_update" ON patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "patients_delete" ON patients FOR DELETE TO authenticated USING (is_admin());

-- Encounters
CREATE POLICY "encounters_read" ON encounters FOR SELECT TO authenticated USING (true);
CREATE POLICY "encounters_insert" ON encounters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "encounters_update" ON encounters FOR UPDATE TO authenticated USING (true);
CREATE POLICY "encounters_delete" ON encounters FOR DELETE TO authenticated USING (is_admin());

-- Beds
CREATE POLICY "beds_read" ON beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "beds_insert" ON beds FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "beds_update" ON beds FOR UPDATE TO authenticated USING (true);
CREATE POLICY "beds_delete" ON beds FOR DELETE TO authenticated USING (is_admin());

-- Diagnoses
CREATE POLICY "diagnoses_read" ON diagnoses FOR SELECT TO authenticated USING (true);
CREATE POLICY "diagnoses_insert" ON diagnoses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "diagnoses_update" ON diagnoses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "diagnoses_delete" ON diagnoses FOR DELETE TO authenticated USING (is_admin());

-- Allergies
CREATE POLICY "allergies_read" ON allergies FOR SELECT TO authenticated USING (true);
CREATE POLICY "allergies_insert" ON allergies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allergies_update" ON allergies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allergies_delete" ON allergies FOR DELETE TO authenticated USING (is_admin());

-- Vital signs
CREATE POLICY "vital_signs_read" ON vital_signs FOR SELECT TO authenticated USING (true);
CREATE POLICY "vital_signs_insert" ON vital_signs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vital_signs_update" ON vital_signs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vital_signs_delete" ON vital_signs FOR DELETE TO authenticated USING (is_admin());

-- Medications
CREATE POLICY "medications_read" ON medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "medications_insert" ON medications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "medications_update" ON medications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "medications_delete" ON medications FOR DELETE TO authenticated USING (is_admin());

-- Medication orders
CREATE POLICY "medication_orders_read" ON medication_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "medication_orders_insert" ON medication_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "medication_orders_update" ON medication_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "medication_orders_delete" ON medication_orders FOR DELETE TO authenticated USING (is_admin());

-- Medication administrations
CREATE POLICY "medication_administrations_read" ON medication_administrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "medication_administrations_insert" ON medication_administrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "medication_administrations_update" ON medication_administrations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "medication_administrations_delete" ON medication_administrations FOR DELETE TO authenticated USING (is_admin());

-- Lab orders
CREATE POLICY "lab_orders_read" ON lab_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "lab_orders_insert" ON lab_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lab_orders_update" ON lab_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lab_orders_delete" ON lab_orders FOR DELETE TO authenticated USING (is_admin());

-- Lab results
CREATE POLICY "lab_results_read" ON lab_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "lab_results_insert" ON lab_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lab_results_update" ON lab_results FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lab_results_delete" ON lab_results FOR DELETE TO authenticated USING (is_admin());

-- Imaging orders
CREATE POLICY "imaging_orders_read" ON imaging_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "imaging_orders_insert" ON imaging_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "imaging_orders_update" ON imaging_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "imaging_orders_delete" ON imaging_orders FOR DELETE TO authenticated USING (is_admin());

-- Imaging results
CREATE POLICY "imaging_results_read" ON imaging_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "imaging_results_insert" ON imaging_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "imaging_results_update" ON imaging_results FOR UPDATE TO authenticated USING (true);
CREATE POLICY "imaging_results_delete" ON imaging_results FOR DELETE TO authenticated USING (is_admin());

-- Clinical notes
CREATE POLICY "clinical_notes_read" ON clinical_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clinical_notes_insert" ON clinical_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clinical_notes_update" ON clinical_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clinical_notes_delete" ON clinical_notes FOR DELETE TO authenticated USING (is_admin());

-- Orders
CREATE POLICY "orders_read" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "orders_delete" ON orders FOR DELETE TO authenticated USING (is_admin());

-- Appointments
CREATE POLICY "appointments_read" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "appointments_update" ON appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE TO authenticated USING (is_admin());

-- Insurance claims
CREATE POLICY "insurance_claims_read" ON insurance_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "insurance_claims_insert" ON insurance_claims FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insurance_claims_update" ON insurance_claims FOR UPDATE TO authenticated USING (true);
CREATE POLICY "insurance_claims_delete" ON insurance_claims FOR DELETE TO authenticated USING (is_admin());

-- Audit logs
CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_logs_delete" ON audit_logs FOR DELETE TO authenticated USING (is_admin());

-- Alerts
CREATE POLICY "alerts_read" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts_insert" ON alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "alerts_update" ON alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "alerts_delete" ON alerts FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Insert sample departments
INSERT INTO departments (name, code, floor, bed_count) VALUES
  ('Emergency Department', 'ED', 1, 30),
  ('Internal Medicine', 'IM', 2, 40),
  ('Surgery', 'SURG', 3, 25),
  ('Pediatrics', 'PEDS', 4, 20),
  ('Cardiology', 'CARD', 2, 15),
  ('Oncology', 'ONC', 5, 20),
  ('Orthopedics', 'ORTH', 3, 15),
  ('ICU', 'ICU', 2, 12),
  ('Radiology', 'RAD', 1, 0),
  ('Laboratory', 'LAB', 1, 0);

-- Insert sample medications
INSERT INTO medications (name, generic_name, drug_class, dosage_form, strength, controlled_substance) VALUES
  ('Tylenol', 'Acetaminophen', 'Analgesic', 'Tablet', '500mg', false),
  ('Amoxil', 'Amoxicillin', 'Antibiotic', 'Capsule', '500mg', false),
  ('Lisinopril', 'Lisinopril', 'ACE Inhibitor', 'Tablet', '10mg', false),
  ('Metformin', 'Metformin HCl', 'Antidiabetic', 'Tablet', '500mg', false),
  ('Atorvastatin', 'Atorvastatin', 'Statin', 'Tablet', '40mg', false),
  ('Morphine Sulfate', 'Morphine', 'Opioid Analgesic', 'Injectable', '10mg/mL', true),
  ('Midazolam', 'Midazolam', 'Benzodiazepine', 'Injectable', '5mg/mL', true),
  ('Heparin', 'Heparin Sodium', 'Anticoagulant', 'Injectable', '5000 units/mL', false),
  ('Metoprolol', 'Metoprolol Tartrate', 'Beta Blocker', 'Tablet', '25mg', false),
  ('Omeprazole', 'Omeprazole', 'PPI', 'Capsule', '20mg', false);
