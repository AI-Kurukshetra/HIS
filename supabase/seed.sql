-- =============================================================================
-- MediTech HIS — Seed Data  (safe to re-run — uses ON CONFLICT DO NOTHING)
-- Run in Supabase SQL Editor AFTER schema.sql
-- Default password for all staff: MediTech@2026
-- =============================================================================

-- ── STEP 1: Fix nullable encounter_id on all clinical tables ─────────────────
DO $$
BEGIN
  EXECUTE 'ALTER TABLE IF EXISTS diagnoses         ALTER COLUMN encounter_id DROP NOT NULL';
  EXECUTE 'ALTER TABLE IF EXISTS vital_signs       ALTER COLUMN encounter_id DROP NOT NULL';
  EXECUTE 'ALTER TABLE IF EXISTS medication_orders ALTER COLUMN encounter_id DROP NOT NULL';
  EXECUTE 'ALTER TABLE IF EXISTS lab_orders        ALTER COLUMN encounter_id DROP NOT NULL';
  EXECUTE 'ALTER TABLE IF EXISTS imaging_orders    ALTER COLUMN encounter_id DROP NOT NULL';
  EXECUTE 'ALTER TABLE IF EXISTS clinical_notes    ALTER COLUMN encounter_id DROP NOT NULL';
  EXECUTE 'ALTER TABLE IF EXISTS orders            ALTER COLUMN encounter_id DROP NOT NULL';
  EXECUTE 'ALTER TABLE IF EXISTS alerts            ALTER COLUMN encounter_id DROP NOT NULL';
EXCEPTION WHEN OTHERS THEN NULL; -- ignore if already nullable
END $$;

-- ── STEP 2: Create staff auth users ──────────────────────────────────────────
-- These create real login accounts. Password for all: MediTech@2026
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
)
VALUES
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0001-0001-0001-000000000001', 'authenticated', 'authenticated',
   'dr.sarah.johnson@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Sarah Johnson"}',
   NOW(), NOW(), '', ''),

  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0002-0002-0002-000000000002', 'authenticated', 'authenticated',
   'dr.michael.roberts@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Michael Roberts"}',
   NOW(), NOW(), '', ''),

  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0003-0003-0003-000000000003', 'authenticated', 'authenticated',
   'nurse.emily.carter@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emily Carter"}',
   NOW(), NOW(), '', ''),

  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0004-0004-0004-000000000004', 'authenticated', 'authenticated',
   'nurse.james.wilson@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"James Wilson"}',
   NOW(), NOW(), '', ''),

  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0005-0005-0005-000000000005', 'authenticated', 'authenticated',
   'pharmacist.rachel.green@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rachel Green"}',
   NOW(), NOW(), '', ''),

  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0006-0006-0006-000000000006', 'authenticated', 'authenticated',
   'labtech.kevin.brown@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kevin Brown"}',
   NOW(), NOW(), '', ''),

  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0007-0007-0007-000000000007', 'authenticated', 'authenticated',
   'reception.maria.santos@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Santos"}',
   NOW(), NOW(), '', ''),

  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0008-0008-0008-000000000008', 'authenticated', 'authenticated',
   'billing.tom.davis@meditech.com',
   crypt('MediTech@2026', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tom Davis"}',
   NOW(), NOW(), '', '')

ON CONFLICT (email) DO NOTHING;

-- ── STEP 3: Main seed data ───────────────────────────────────────────────────
DO $$
DECLARE
  -- Staff user IDs
  admin_id  UUID;
  doc1_id   UUID := 'aaaaaaaa-0001-0001-0001-000000000001';
  doc2_id   UUID := 'aaaaaaaa-0002-0002-0002-000000000002';
  nurse1_id UUID := 'aaaaaaaa-0003-0003-0003-000000000003';
  nurse2_id UUID := 'aaaaaaaa-0004-0004-0004-000000000004';
  pharm_id  UUID := 'aaaaaaaa-0005-0005-0005-000000000005';
  lab_id    UUID := 'aaaaaaaa-0006-0006-0006-000000000006';
  recep_id  UUID := 'aaaaaaaa-0007-0007-0007-000000000007';
  bill_id   UUID := 'aaaaaaaa-0008-0008-0008-000000000008';

  -- Departments
  dept_ed        UUID;
  dept_icu       UUID;
  dept_med       UUID;
  dept_surg      UUID;
  dept_peds      UUID;
  dept_ob        UUID;
  dept_pharmacy  UUID;
  dept_lab       UUID;
  dept_radiology UUID;

  -- Beds
  bed1  UUID; bed2  UUID; bed3  UUID; bed4  UUID; bed5  UUID;
  bed6  UUID; bed7  UUID; bed8  UUID; bed9  UUID; bed10 UUID;
  bed11 UUID; bed12 UUID;

  -- Patients
  p1  UUID; p2  UUID; p3  UUID; p4  UUID; p5  UUID; p6  UUID;
  p7  UUID; p8  UUID; p9  UUID; p10 UUID; p11 UUID; p12 UUID;

  -- Encounters (inpatient)
  e1 UUID; e2 UUID; e3 UUID; e4 UUID; e5 UUID; e6 UUID;
  -- Encounters (outpatient — for p4,p6,p8,p10,p11,p12)
  e7 UUID; e8 UUID; e9 UUID; e10 UUID; e11 UUID; e12 UUID;

  -- Medication catalog
  med_amox    UUID; med_met     UUID; med_lipo   UUID; med_aspirin UUID;
  med_levo    UUID; med_morph   UUID; med_insulin UUID; med_vanco   UUID;
  med_pred    UUID; med_ator    UUID; med_lisin   UUID; med_omep    UUID;

  -- Lab & Imaging
  lab1 UUID; lab2 UUID; lab3 UUID; lab4 UUID; lab5 UUID; lab6 UUID;
  img1 UUID; img2 UUID; img3 UUID;

BEGIN
  -- Get admin user (first user in system)
  SELECT id INTO admin_id FROM auth.users
  WHERE id NOT IN (doc1_id, doc2_id, nurse1_id, nurse2_id, pharm_id, lab_id, recep_id, bill_id)
  LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin auth user found. Please register/login first.';
  END IF;

  -- ── DEPARTMENTS ────────────────────────────────────────────────────────────
  INSERT INTO departments (id, name, code, floor, bed_count) VALUES
    (uuid_generate_v4(), 'Emergency Department',    'ED',       1, 20),
    (uuid_generate_v4(), 'Intensive Care Unit',     'ICU',      2, 12),
    (uuid_generate_v4(), 'Medical/Surgical',        'MED-SURG', 3, 30),
    (uuid_generate_v4(), 'Surgical Services',       'SURG',     4, 15),
    (uuid_generate_v4(), 'Pediatrics',              'PEDS',     3, 18),
    (uuid_generate_v4(), 'Obstetrics & Gynecology', 'OB-GYN',   2, 12),
    (uuid_generate_v4(), 'Pharmacy',                'PHARM',    1,  0),
    (uuid_generate_v4(), 'Laboratory',              'LAB',      1,  0),
    (uuid_generate_v4(), 'Radiology',               'RAD',      1,  0)
  ON CONFLICT (code) DO NOTHING;

  SELECT id INTO dept_ed        FROM departments WHERE code = 'ED';
  SELECT id INTO dept_icu       FROM departments WHERE code = 'ICU';
  SELECT id INTO dept_med       FROM departments WHERE code = 'MED-SURG';
  SELECT id INTO dept_surg      FROM departments WHERE code = 'SURG';
  SELECT id INTO dept_peds      FROM departments WHERE code = 'PEDS';
  SELECT id INTO dept_ob        FROM departments WHERE code = 'OB-GYN';
  SELECT id INTO dept_pharmacy  FROM departments WHERE code = 'PHARM';
  SELECT id INTO dept_lab       FROM departments WHERE code = 'LAB';
  SELECT id INTO dept_radiology FROM departments WHERE code = 'RAD';

  -- ── STAFF PROFILES ─────────────────────────────────────────────────────────
  -- Admin profile
  INSERT INTO profiles (id, full_name, role, department_id, license_number, phone)
  VALUES (admin_id, 'Dr. Admin User', 'admin', dept_ed, 'ADMIN-0000', '555-000-0000')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', department_id = dept_ed;

  -- Staff profiles
  INSERT INTO profiles (id, full_name, role, department_id, license_number, phone) VALUES
    (doc1_id,   'Dr. Sarah Johnson',  'doctor',       dept_ed,       'MD-IL-10021', '555-101-0001'),
    (doc2_id,   'Dr. Michael Roberts','doctor',       dept_icu,      'MD-IL-10022', '555-101-0002'),
    (nurse1_id, 'Emily Carter',       'nurse',        dept_med,      'RN-IL-20031', '555-101-0003'),
    (nurse2_id, 'James Wilson',       'nurse',        dept_ed,       'RN-IL-20032', '555-101-0004'),
    (pharm_id,  'Rachel Green',       'pharmacist',   dept_pharmacy, 'RPH-IL-30041','555-101-0005'),
    (lab_id,    'Kevin Brown',        'lab_tech',     dept_lab,      'CLT-IL-40051','555-101-0006'),
    (recep_id,  'Maria Santos',       'receptionist', dept_ed,       NULL,          '555-101-0007'),
    (bill_id,   'Tom Davis',          'billing',      dept_med,      NULL,          '555-101-0008')
  ON CONFLICT (id) DO UPDATE
    SET full_name     = EXCLUDED.full_name,
        role          = EXCLUDED.role,
        department_id = EXCLUDED.department_id,
        license_number= EXCLUDED.license_number,
        phone         = EXCLUDED.phone;

  -- ── BEDS ───────────────────────────────────────────────────────────────────
  bed1  := uuid_generate_v4(); bed2  := uuid_generate_v4();
  bed3  := uuid_generate_v4(); bed4  := uuid_generate_v4();
  bed5  := uuid_generate_v4(); bed6  := uuid_generate_v4();
  bed7  := uuid_generate_v4(); bed8  := uuid_generate_v4();
  bed9  := uuid_generate_v4(); bed10 := uuid_generate_v4();
  bed11 := uuid_generate_v4(); bed12 := uuid_generate_v4();

  INSERT INTO beds (id, room_number, bed_number, department_id, status) VALUES
    (bed1,  '101', 'A', dept_ed,   'available'),
    (bed2,  '101', 'B', dept_ed,   'occupied'),
    (bed3,  '102', 'A', dept_ed,   'occupied'),
    (bed4,  '102', 'B', dept_ed,   'cleaning'),
    (bed5,  '201', 'A', dept_icu,  'occupied'),
    (bed6,  '201', 'B', dept_icu,  'available'),
    (bed7,  '202', 'A', dept_icu,  'occupied'),
    (bed8,  '301', 'A', dept_med,  'occupied'),
    (bed9,  '301', 'B', dept_med,  'available'),
    (bed10, '302', 'A', dept_med,  'available'),
    (bed11, '401', 'A', dept_surg, 'available'),
    (bed12, '402', 'A', dept_surg, 'maintenance');

  -- ── MEDICATION CATALOG ─────────────────────────────────────────────────────
  med_amox    := uuid_generate_v4(); med_met     := uuid_generate_v4();
  med_lipo    := uuid_generate_v4(); med_aspirin := uuid_generate_v4();
  med_levo    := uuid_generate_v4(); med_morph   := uuid_generate_v4();
  med_insulin := uuid_generate_v4(); med_vanco   := uuid_generate_v4();
  med_pred    := uuid_generate_v4(); med_ator    := uuid_generate_v4();
  med_lisin   := uuid_generate_v4(); med_omep    := uuid_generate_v4();

  INSERT INTO medications (id, name, generic_name, drug_class, dosage_form, strength, manufacturer, ndc_code, requires_prior_auth, controlled_substance) VALUES
    (med_amox,   'Amoxicillin',      'Amoxicillin',          'Antibiotic',            'Capsule',  '500mg',         'Teva Pharma',  '00093-3109', false, false),
    (med_met,    'Metformin',        'Metformin HCl',        'Antidiabetic',          'Tablet',   '1000mg',        'Mylan',        '00378-5004', false, false),
    (med_lipo,   'Lipitor',          'Atorvastatin',         'Statin',                'Tablet',   '40mg',          'Pfizer',       '00071-0156', false, false),
    (med_aspirin,'Aspirin',          'Acetylsalicylic Acid', 'Antiplatelet/NSAID',    'Tablet',   '81mg',          'Bayer',        '00280-0212', false, false),
    (med_levo,   'Levaquin',         'Levofloxacin',         'Fluoroquinolone',       'Tablet',   '500mg',         'Janssen',      '50458-0086', false, false),
    (med_morph,  'Morphine Sulfate', 'Morphine',             'Opioid Analgesic',      'Solution', '4mg/mL',        'Hikma',        '00641-6014', true,  true),
    (med_insulin,'Novolin R',        'Regular Insulin',      'Insulin',               'Solution', '100 units/mL',  'Novo Nordisk', '00169-1833', false, false),
    (med_vanco,  'Vancomycin',       'Vancomycin HCl',       'Glycopeptide Antibiotic','Powder',  '500mg',         'Mylan',        '67457-0460', false, false),
    (med_pred,   'Prednisone',       'Prednisone',           'Corticosteroid',        'Tablet',   '20mg',          'Roxane Labs',  '00054-4742', false, false),
    (med_ator,   'Atorvastatin',     'Atorvastatin Calcium', 'Statin',                'Tablet',   '20mg',          'Greenstone',   '59762-3040', false, false),
    (med_lisin,  'Lisinopril',       'Lisinopril',           'ACE Inhibitor',         'Tablet',   '10mg',          'Lupin Pharma', '68180-0514', false, false),
    (med_omep,   'Omeprazole',       'Omeprazole',           'Proton Pump Inhibitor', 'Capsule',  '20mg',          'AstraZeneca',  '00186-0107', false, false);

  -- ── PATIENTS ───────────────────────────────────────────────────────────────
  p1  := uuid_generate_v4(); p2  := uuid_generate_v4();
  p3  := uuid_generate_v4(); p4  := uuid_generate_v4();
  p5  := uuid_generate_v4(); p6  := uuid_generate_v4();
  p7  := uuid_generate_v4(); p8  := uuid_generate_v4();
  p9  := uuid_generate_v4(); p10 := uuid_generate_v4();
  p11 := uuid_generate_v4(); p12 := uuid_generate_v4();

  INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, ssn_last4, phone, email, address, city, state, zip, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_id, insurance_group, primary_provider_id, created_by, is_active) VALUES
    (p1,  'James',    'Harrison',  '1958-04-12', 'male',   'O+',  '4521', '555-234-1001', 'james.harrison@email.com',   '142 Oak Street',      'Springfield', 'IL', '62701', 'Mary Harrison',    '555-234-1002', 'BlueCross BlueShield', 'BCB-0012345', 'GRP-4521', doc1_id,  recep_id, true),
    (p2,  'Sarah',    'Mitchell',  '1985-09-27', 'female', 'A+',  '8834', '555-234-1003', 'sarah.mitchell@email.com',   '89 Maple Avenue',     'Springfield', 'IL', '62702', 'Tom Mitchell',     '555-234-1004', 'Aetna',                'AET-9987234', 'GRP-8801', doc1_id,  recep_id, true),
    (p3,  'Robert',   'Chen',      '1971-12-03', 'male',   'B+',  '2291', '555-234-1005', 'robert.chen@email.com',      '35 Pine Road',        'Shelbyville', 'IL', '62565', 'Linda Chen',       '555-234-1006', 'United Healthcare',    'UHC-4456789', 'GRP-2211', doc2_id,  recep_id, true),
    (p4,  'Emily',    'Rodriguez', '1993-06-18', 'female', 'AB-', '7742', '555-234-1007', 'emily.rodriguez@email.com',  '220 Elm Drive',       'Springfield', 'IL', '62703', 'Carlos Rodriguez', '555-234-1008', 'Cigna',                'CIG-3312456', 'GRP-7700', doc1_id,  recep_id, true),
    (p5,  'William',  'Thompson',  '1946-02-28', 'male',   'A-',  '3381', '555-234-1009', 'william.thompson@email.com', '67 Birch Lane',       'Capital City','IL', '62704', 'Dorothy Thompson', '555-234-1010', 'Medicare',             'MED-7789012', 'GRP-3300', doc2_id,  recep_id, true),
    (p6,  'Jennifer', 'Patel',     '2001-11-14', 'female', 'O-',  '9923', '555-234-1011', 'jennifer.patel@email.com',   '15 Walnut Court',     'Springfield', 'IL', '62701', 'Raj Patel',        '555-234-1012', 'BlueCross BlueShield', 'BCB-0056789', 'GRP-9911', doc1_id,  recep_id, true),
    (p7,  'Michael',  'Davis',     '1962-07-22', 'male',   'B-',  '1154', '555-234-1013', 'michael.davis@email.com',    '488 Cedar Boulevard', 'Shelbyville', 'IL', '62565', 'Patricia Davis',   '555-234-1014', 'Humana',               'HUM-2234567', 'GRP-1100', doc2_id,  recep_id, true),
    (p8,  'Linda',    'Washington','1979-03-09', 'female', 'O+',  '5567', '555-234-1015', 'linda.washington@email.com', '321 Hickory Way',     'Springfield', 'IL', '62705', 'James Washington', '555-234-1016', 'Aetna',                'AET-5578901', 'GRP-5500', doc1_id,  recep_id, true),
    (p9,  'David',    'Martinez',  '1955-08-31', 'male',   'A+',  '6612', '555-234-1017', 'david.martinez@email.com',   '94 Sycamore Street',  'Capital City','IL', '62704', 'Rosa Martinez',    '555-234-1018', 'Cigna',                'CIG-6678901', 'GRP-6600', doc2_id,  recep_id, true),
    (p10, 'Patricia', 'Wilson',    '1988-01-25', 'female', 'AB+', '8891', '555-234-1019', 'patricia.wilson@email.com',  '756 Poplar Circle',   'Springfield', 'IL', '62702', 'Kevin Wilson',     '555-234-1020', 'United Healthcare',    'UHC-8890123', 'GRP-8800', doc1_id,  recep_id, true),
    (p11, 'Thomas',   'Anderson',  '2019-05-07', 'male',   'O+',  '3344', '555-234-1021', NULL,                         '33 Chestnut Lane',    'Shelbyville', 'IL', '62565', 'George Anderson',  '555-234-1022', 'CHIP/Medicaid',        'CHI-1123456', 'GRP-3344', doc1_id,  recep_id, true),
    (p12, 'Nancy',    'Brown',     '1967-10-16', 'female', 'A+',  '2278', '555-234-1023', 'nancy.brown@email.com',      '109 Magnolia Drive',  'Springfield', 'IL', '62703', 'Steve Brown',      '555-234-1024', 'BlueCross BlueShield', 'BCB-2234567', 'GRP-2200', doc2_id,  recep_id, true);

  -- ── ENCOUNTERS — Inpatient / Emergency / Surgical ──────────────────────────
  e1 := uuid_generate_v4(); e2 := uuid_generate_v4();
  e3 := uuid_generate_v4(); e4 := uuid_generate_v4();
  e5 := uuid_generate_v4(); e6 := uuid_generate_v4();

  INSERT INTO encounters (id, patient_id, provider_id, department_id, encounter_type, chief_complaint, status, admit_date, bed_id) VALUES
    (e1, p1, doc1_id,  dept_ed,   'emergency',  'Chest pain, shortness of breath, diaphoresis',           'active', NOW()-INTERVAL '2 days',  bed3),
    (e2, p2, doc1_id,  dept_med,  'inpatient',  'Post-operative recovery — laparoscopic appendectomy',    'active', NOW()-INTERVAL '1 day',   bed8),
    (e3, p5, doc2_id,  dept_icu,  'inpatient',  'Acute COPD exacerbation with respiratory failure',       'active', NOW()-INTERVAL '3 days',  bed5),
    (e4, p7, doc2_id,  dept_ed,   'emergency',  'Sudden onset severe headache, altered mental status',    'active', NOW()-INTERVAL '6 hours', bed2),
    (e5, p9, doc2_id,  dept_med,  'inpatient',  'Uncontrolled Type 2 DM — blood glucose 480 mg/dL',       'active', NOW()-INTERVAL '1 day',   bed7),
    (e6, p3, doc1_id,  dept_surg, 'surgical',   'Elective total knee replacement — right knee',           'active', NOW()-INTERVAL '5 hours', bed11);

  UPDATE beds SET status='occupied', patient_id=p1  WHERE id=bed3;
  UPDATE beds SET status='occupied', patient_id=p2  WHERE id=bed8;
  UPDATE beds SET status='occupied', patient_id=p5  WHERE id=bed5;
  UPDATE beds SET status='occupied', patient_id=p7  WHERE id=bed2;
  UPDATE beds SET status='occupied', patient_id=p9  WHERE id=bed7;
  UPDATE beds SET status='occupied', patient_id=p3  WHERE id=bed11;

  -- ── ENCOUNTERS — Outpatient (so nothing needs NULL encounter_id) ────────────
  e7  := uuid_generate_v4(); e8  := uuid_generate_v4();
  e9  := uuid_generate_v4(); e10 := uuid_generate_v4();
  e11 := uuid_generate_v4(); e12 := uuid_generate_v4();

  INSERT INTO encounters (id, patient_id, provider_id, department_id, encounter_type, chief_complaint, status, admit_date) VALUES
    (e7,  p4,  doc1_id, dept_ed,   'outpatient', 'Asthma follow-up — spirometry and inhaler technique',   'discharged', NOW()-INTERVAL '30 days'),
    (e8,  p6,  doc1_id, dept_med,  'outpatient', 'GI follow-up — melena evaluation',                      'discharged', NOW()-INTERVAL '14 days'),
    (e9,  p8,  doc1_id, dept_med,  'outpatient', 'Chronic low back pain management',                      'discharged', NOW()-INTERVAL '7 days'),
    (e10, p10, doc1_id, dept_med,  'outpatient', 'Migraine — headache frequency and medication review',   'discharged', NOW()-INTERVAL '60 days'),
    (e11, p11, doc1_id, dept_peds, 'outpatient', '6-year well child visit',                               'discharged', NOW()-INTERVAL '14 days'),
    (e12, p12, doc2_id, dept_med,  'outpatient', 'CKD stage 3 monitoring — nephrology co-management',     'discharged', NOW()-INTERVAL '90 days');

  -- ── DIAGNOSES ──────────────────────────────────────────────────────────────
  INSERT INTO diagnoses (encounter_id, patient_id, icd10_code, description, diagnosis_type, status, diagnosed_by, diagnosed_at) VALUES
    (e1,  p1,  'I21.9',   'Acute myocardial infarction, unspecified',                  'primary',   'active',   doc1_id, NOW()-INTERVAL '2 days'),
    (e1,  p1,  'I10',     'Essential (primary) hypertension',                          'secondary', 'chronic',  doc1_id, NOW()-INTERVAL '2 days'),
    (e1,  p1,  'E11.9',   'Type 2 diabetes mellitus without complications',            'secondary', 'chronic',  doc1_id, NOW()-INTERVAL '2 days'),
    (e2,  p2,  'K37',     'Unspecified appendicitis',                                  'primary',   'resolved', doc1_id, NOW()-INTERVAL '1 day'),
    (e2,  p2,  'Z87.39',  'Personal history of other musculoskeletal disorders',       'secondary', 'active',   doc1_id, NOW()-INTERVAL '1 day'),
    (e3,  p5,  'J44.1',   'Chronic obstructive pulmonary disease with exacerbation',   'primary',   'active',   doc2_id, NOW()-INTERVAL '3 days'),
    (e3,  p5,  'J96.01',  'Acute respiratory failure with hypoxia',                    'secondary', 'active',   doc2_id, NOW()-INTERVAL '3 days'),
    (e3,  p5,  'F17.210', 'Nicotine dependence, cigarettes, uncomplicated',            'secondary', 'chronic',  doc2_id, NOW()-INTERVAL '3 days'),
    (e4,  p7,  'I61.9',   'Nontraumatic intracerebral hemorrhage, unspecified',        'primary',   'active',   doc2_id, NOW()-INTERVAL '5 hours'),
    (e4,  p7,  'I10',     'Essential (primary) hypertension',                          'secondary', 'chronic',  doc2_id, NOW()-INTERVAL '5 hours'),
    (e5,  p9,  'E11.641', 'Type 2 diabetes mellitus with hypoglycemia with coma',      'primary',   'active',   doc2_id, NOW()-INTERVAL '1 day'),
    (e5,  p9,  'E11.40',  'Type 2 diabetes mellitus with diabetic neuropathy',         'secondary', 'chronic',  doc2_id, NOW()-INTERVAL '1 day'),
    (e6,  p3,  'M17.11',  'Primary osteoarthritis, right knee',                        'primary',   'active',   doc1_id, NOW()-INTERVAL '5 hours'),
    (e7,  p4,  'J45.40',  'Moderate persistent asthma, uncomplicated',                 'primary',   'chronic',  doc1_id, NOW()-INTERVAL '30 days'),
    (e8,  p6,  'K92.1',   'Melena',                                                    'primary',   'resolved', doc1_id, NOW()-INTERVAL '14 days'),
    (e9,  p8,  'M54.5',   'Low back pain',                                             'primary',   'active',   doc1_id, NOW()-INTERVAL '7 days'),
    (e10, p10, 'G43.909', 'Migraine, unspecified, not intractable',                    'primary',   'chronic',  doc1_id, NOW()-INTERVAL '60 days'),
    (e11, p11, 'Z00.129', 'Encounter for routine child health examination',            'primary',   'resolved', doc1_id, NOW()-INTERVAL '14 days'),
    (e12, p12, 'N18.3',   'Chronic kidney disease, stage 3 (moderate)',                'primary',   'chronic',  doc2_id, NOW()-INTERVAL '90 days');

  -- ── ALLERGIES ──────────────────────────────────────────────────────────────
  INSERT INTO allergies (patient_id, allergen, reaction, severity, status, recorded_by) VALUES
    (p1,  'Penicillin',   'Anaphylaxis, urticaria',              'life_threatening', 'active',   nurse2_id),
    (p1,  'Sulfa drugs',  'Rash, fever',                         'moderate',         'active',   nurse2_id),
    (p2,  'Latex',        'Contact dermatitis',                  'mild',             'active',   nurse1_id),
    (p3,  'Codeine',      'Nausea, vomiting, excessive sedation','moderate',         'active',   nurse1_id),
    (p4,  'Aspirin',      'Bronchospasm, urticaria',             'severe',           'active',   nurse1_id),
    (p4,  'NSAIDs',       'Angioedema',                          'severe',           'active',   nurse1_id),
    (p5,  'Contrast dye', 'Anaphylactoid reaction',              'life_threatening', 'active',   nurse2_id),
    (p7,  'Lisinopril',   'Angioedema of the throat',            'life_threatening', 'active',   nurse2_id),
    (p8,  'Morphine',     'Severe nausea, respiratory depression','severe',          'active',   nurse1_id),
    (p9,  'Metformin',    'GI intolerance, lactic acidosis risk','moderate',         'inactive', nurse1_id),
    (p10, 'Shellfish',    'Urticaria, GI distress',              'moderate',         'active',   nurse1_id),
    (p12, 'Vancomycin',   'Red man syndrome',                    'moderate',         'active',   nurse1_id);

  -- ── VITAL SIGNS ────────────────────────────────────────────────────────────
  INSERT INTO vital_signs (encounter_id, patient_id, recorded_by, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, respiratory_rate, oxygen_saturation, weight_kg, height_cm, pain_scale, recorded_at) VALUES
    (e1, p1, nurse2_id, 37.2, 108, 168, 98,  22, 94, 89.5, 178.0, 8, NOW()-INTERVAL '2 days'),
    (e1, p1, nurse2_id, 37.0, 92,  145, 88,  18, 97, 89.5, 178.0, 5, NOW()-INTERVAL '1 day'),
    (e2, p2, nurse1_id, 37.8, 88,  118, 76,  16, 98, 62.3, 165.0, 3, NOW()-INTERVAL '1 day'),
    (e2, p2, nurse1_id, 37.4, 82,  112, 72,  14, 99, 62.3, 165.0, 2, NOW()-INTERVAL '6 hours'),
    (e3, p5, nurse1_id, 38.1, 112, 142, 86,  28, 86, 71.0, 170.0, 4, NOW()-INTERVAL '3 days'),
    (e3, p5, nurse1_id, 37.9, 96,  138, 82,  24, 90, 71.0, 170.0, 3, NOW()-INTERVAL '1 day'),
    (e4, p7, nurse2_id, 37.6, 58,  210, 118, 20, 96, 82.0, 180.0, 9, NOW()-INTERVAL '6 hours'),
    (e5, p9, nurse1_id, 37.3, 98,  148, 92,  18, 98, 94.0, 172.0, 2, NOW()-INTERVAL '1 day'),
    (e5, p9, nurse1_id, 37.1, 88,  136, 84,  16, 99, 94.0, 172.0, 1, NOW()-INTERVAL '3 hours'),
    (e6, p3, nurse1_id, 36.8, 72,  122, 78,  14, 99, 78.0, 175.0, 6, NOW()-INTERVAL '5 hours');

  -- ── MEDICATION ORDERS ──────────────────────────────────────────────────────
  INSERT INTO medication_orders (patient_id, encounter_id, medication_id, prescribed_by, dose, route, frequency, start_date, status, indication) VALUES
    (p1, e1,  med_aspirin, doc1_id, '325mg',    'oral', 'Once daily',                          CURRENT_DATE,      'active', 'Antiplatelet therapy for ACS'),
    (p1, e1,  med_morph,   doc1_id, '2-4mg',    'iv',   'Q4H PRN pain',                        CURRENT_DATE,      'active', 'Acute chest pain management'),
    (p2, e2,  med_amox,    doc1_id, '500mg',    'oral', 'TID x 7 days',                        CURRENT_DATE,      'active', 'Post-operative infection prophylaxis'),
    (p2, e2,  med_omep,    doc1_id, '20mg',     'oral', 'Once daily before breakfast',          CURRENT_DATE,      'active', 'GI protection with antibiotics'),
    (p5, e3,  med_pred,    doc2_id, '40mg',     'oral', 'Once daily x 5 days',                 CURRENT_DATE,      'active', 'COPD exacerbation management'),
    (p5, e3,  med_levo,    doc2_id, '500mg',    'iv',   'Once daily',                          CURRENT_DATE,      'active', 'Community-acquired pneumonia coverage'),
    (p9, e5,  med_insulin, doc2_id, '10 units', 'iv',   'Per insulin drip protocol',           CURRENT_DATE,      'active', 'DKA management — blood glucose control'),
    (p3, e6,  med_morph,   doc1_id, '2mg',      'iv',   'Q4H PRN moderate-severe pain (>=5/10)',CURRENT_DATE,     'active', 'Post-operative pain management'),
    (p4, e7,  med_aspirin, doc1_id, '81mg',     'oral', 'Once daily',                          CURRENT_DATE - 30, 'active', 'Asthma — low-dose aspirin caution'),
    (p10,e10, med_lisin,   doc1_id, '10mg',     'oral', 'Once daily',                          CURRENT_DATE - 60, 'active', 'Hypertension management'),
    (p12,e12, med_ator,    doc2_id, '20mg',     'oral', 'Once daily at bedtime',               CURRENT_DATE - 90, 'active', 'Hyperlipidemia — CKD stage 3'),
    (p12,e12, med_lisin,   doc2_id, '5mg',      'oral', 'Once daily',                          CURRENT_DATE - 90, 'active', 'CKD-related hypertension, renoprotection');

  -- ── LAB ORDERS & RESULTS ───────────────────────────────────────────────────
  lab1 := uuid_generate_v4(); lab2 := uuid_generate_v4();
  lab3 := uuid_generate_v4(); lab4 := uuid_generate_v4();
  lab5 := uuid_generate_v4(); lab6 := uuid_generate_v4();

  INSERT INTO lab_orders (id, patient_id, encounter_id, ordered_by, test_name, test_code, priority, status, ordered_at, collected_at, resulted_at) VALUES
    (lab1, p1, e1, doc1_id, 'Troponin I (High Sensitivity)',   'TROPONIN-HS', 'stat',    'resulted', NOW()-INTERVAL '2 days',  NOW()-INTERVAL '47 hours', NOW()-INTERVAL '46 hours'),
    (lab2, p1, e1, doc1_id, 'Complete Metabolic Panel',         'CMP',         'urgent',  'resulted', NOW()-INTERVAL '2 days',  NOW()-INTERVAL '46 hours', NOW()-INTERVAL '45 hours'),
    (lab3, p5, e3, doc2_id, 'Arterial Blood Gas (ABG)',         'ABG',         'stat',    'resulted', NOW()-INTERVAL '3 days',  NOW()-INTERVAL '71 hours', NOW()-INTERVAL '70 hours'),
    (lab4, p9, e5, doc2_id, 'Basic Metabolic Panel + Glucose',  'BMP-GLUCOSE', 'stat',    'resulted', NOW()-INTERVAL '1 day',   NOW()-INTERVAL '23 hours', NOW()-INTERVAL '22 hours'),
    (lab5, p7, e4, doc2_id, 'Coagulation Panel (PT/INR/aPTT)',  'COAG-PANEL',  'stat',    'resulted', NOW()-INTERVAL '6 hours', NOW()-INTERVAL '5 hours',  NOW()-INTERVAL '4 hours'),
    (lab6, p2, e2, doc1_id, 'Complete Blood Count (CBC)',       'CBC',         'routine', 'resulted', NOW()-INTERVAL '1 day',   NOW()-INTERVAL '22 hours', NOW()-INTERVAL '20 hours');

  INSERT INTO lab_results (lab_order_id, patient_id, result_value, reference_range, unit, interpretation, verified_by) VALUES
    (lab1, p1, '4.82',  '< 0.04', 'ng/mL', 'critical_high', lab_id),
    (lab2, p1, 'Na:138 K:4.1 Cl:102 CO2:22 BUN:18 Cr:1.1 Glu:186', 'Na:136-145 K:3.5-5.1 Cr:0.7-1.3 Glu:70-100', 'panel', 'abnormal',      lab_id),
    (lab3, p5, 'pH:7.31 PaCO2:58 PaO2:52 HCO3:28 SaO2:88%',        'pH:7.35-7.45 PaCO2:35-45 PaO2:75-100',       'panel', 'critical_low',  lab_id),
    (lab4, p9, '480',   '70-100', 'mg/dL', 'critical_high', lab_id),
    (lab5, p7, 'PT:13.2 INR:1.1 aPTT:29', 'PT:11-13.5 INR:0.8-1.1 aPTT:25-35', 'panel', 'normal', lab_id),
    (lab6, p2, 'WBC:11.2 Hgb:11.8 Hct:36 Plt:285', 'WBC:4.5-11.0 Hgb:12-16 Plt:150-400', 'panel', 'abnormal', lab_id);

  -- ── IMAGING ORDERS & RESULTS ───────────────────────────────────────────────
  img1 := uuid_generate_v4(); img2 := uuid_generate_v4(); img3 := uuid_generate_v4();

  INSERT INTO imaging_orders (id, patient_id, encounter_id, ordered_by, modality, body_part, priority, clinical_indication, status, ordered_at, scheduled_at, completed_at) VALUES
    (img1, p1, e1, doc1_id, 'xray', 'Chest PA and Lateral',  'urgent', 'Chest pain — rule out pneumothorax/aortic dissection',       'completed', NOW()-INTERVAL '2 days',  NOW()-INTERVAL '46 hours', NOW()-INTERVAL '45 hours'),
    (img2, p7, e4, doc2_id, 'ct',   'Head without contrast', 'stat',   'Severe headache — rule out hemorrhage',                       'completed', NOW()-INTERVAL '5 hours', NOW()-INTERVAL '4 hours',  NOW()-INTERVAL '3 hours'),
    (img3, p5, e3, doc2_id, 'ct',   'Chest with contrast',   'urgent', 'COPD exacerbation — rule out pulmonary embolism vs pneumonia','completed', NOW()-INTERVAL '3 days',  NOW()-INTERVAL '70 hours', NOW()-INTERVAL '68 hours');

  INSERT INTO imaging_results (imaging_order_id, patient_id, radiologist_id, findings, impression, recommendations, report_status) VALUES
    (img1, p1, doc2_id,
     'Cardiomegaly present. Mild pulmonary vascular congestion bilaterally. No pneumothorax. No pleural effusion.',
     'Cardiomegaly with early pulmonary edema. Correlate with troponin and ECG.',
     'Cardiology consult. Repeat CXR in 24h after diuresis.', 'final'),
    (img2, p7, doc2_id,
     'Hyperdense region left basal ganglia ~2.3x1.8cm. Mild surrounding edema. Midline shift 3mm right. No hydrocephalus.',
     'Left basal ganglia intracerebral hemorrhage with perilesional edema and mild midline shift.',
     'Urgent neurosurgery consult. BP management. Repeat CT in 6 hours.', 'final'),
    (img3, p5, doc2_id,
     'Bilateral lower lobe infiltrates consistent with consolidation, right > left. No saddle embolus. Hyperinflation consistent with COPD.',
     'Bilateral pneumonia, right lower lobe predominant. COPD changes.',
     'Continue antibiotics. Consider V/Q scan if PE suspicion remains.', 'final');

  -- ── CLINICAL NOTES ─────────────────────────────────────────────────────────
  INSERT INTO clinical_notes (patient_id, encounter_id, author_id, note_type, title, content, status, signed_at) VALUES
    (p1, e1, doc1_id, 'admission', 'ED Admission Note — Chest Pain',
     'CHIEF COMPLAINT: Chest pain, shortness of breath, diaphoresis.

HPI: Mr. Harrison is a 67-year-old male with known HTN and T2DM presenting with 2-hour substernal chest pressure 8/10 radiating to left arm with diaphoresis and dyspnea.

PMH: Hypertension x10yr, T2DM x8yr, Hyperlipidemia.
ALLERGIES: Penicillin (anaphylaxis), Sulfa drugs (rash).
MEDS: Metformin 1000mg BID, Lisinopril 10mg daily, Atorvastatin 40mg daily.

VITALS: BP 168/98, HR 108, RR 22, SpO2 94%, Temp 37.2C.

EXAM: Diaphoretic, moderate distress. Tachycardic. JVD present. Bilateral basilar crackles.

A/P:
1. STEMI — Troponin 4.82 ng/mL. ST elevation V2-V5. Cardiology notified. ASA 325mg given. Heparin drip. Emergent cath lab activation.
2. HTN — managed per ACS protocol.
3. T2DM — Glucose 186, sliding scale initiated.', 'signed', NOW()-INTERVAL '2 days'),

    (p5, e3, doc2_id, 'progress', 'ICU Daily Progress Note — COPD Day 3',
     'SUBJECTIVE: Less dyspneic than yesterday. Productive cough with yellow sputum.

OBJECTIVE: BP 138/82, HR 96, RR 24, SpO2 90% on 2L NC, Temp 37.9C.
ABG improving. WBC 13.2. CXR: bilateral pneumonia right > left.

ASSESSMENT:
1. COPD exacerbation — Improving. SpO2 86% → 90%.
2. CAP — Levofloxacin IV day 3. Responding.
3. Nicotine dependence — Cessation counseling initiated.

PLAN: Continue Levofloxacin + Prednisone. Wean O2. Target SpO2 88-92%.', 'signed', NOW()-INTERVAL '1 day'),

    (p7, e4, doc2_id, 'admission', 'ED Admission Note — ICH',
     'CHIEF COMPLAINT: Sudden severe headache, altered mental status.

HPI: Mr. Davis, 62M, found confused by wife with "worst headache of his life." Sudden onset 2h ago. Non-compliant with HTN meds.
ALLERGIES: Lisinopril (angioedema).

VITALS: BP 210/118 (critical), HR 58, SpO2 96%, GCS 12.
NEURO: Confused, left arm drift, pupils sluggish on left.
CT HEAD: Left basal ganglia ICH 2.3x1.8cm, 3mm midline shift.

A/P:
1. Spontaneous ICH — Neurosurgery emergently consulted. BP target <160 systolic.
2. Hypertensive emergency — Labetalol drip.
3. Dysphagia risk — NPO, Speech therapy consult.', 'signed', NOW()-INTERVAL '5 hours');

  -- ── CPOE ORDERS ────────────────────────────────────────────────────────────
  INSERT INTO orders (patient_id, encounter_id, ordered_by, order_type, description, priority, status) VALUES
    (p1, e1, doc1_id,  'lab',       'Repeat Troponin in 3 hours',                        'urgent',  'active'),
    (p1, e1, doc1_id,  'procedure', 'ECG 12-lead stat',                                  'stat',    'completed'),
    (p1, e1, doc1_id,  'procedure', 'Emergent cardiac catheterization',                  'stat',    'active'),
    (p1, e1, doc1_id,  'referral',  'Cardiology consult — STEMI protocol',               'stat',    'active'),
    (p5, e3, doc2_id,  'lab',       'Repeat ABG in 4 hours',                             'urgent',  'active'),
    (p5, e3, doc2_id,  'referral',  'Pulmonology consult',                               'routine', 'pending'),
    (p5, e3, nurse1_id,'activity',  'HOB >30 degrees, respiratory precautions',          'routine', 'active'),
    (p7, e4, doc2_id,  'lab',       'CBC, CMP, Coagulation panel',                       'stat',    'completed'),
    (p7, e4, doc2_id,  'referral',  'Neurosurgery emergent consult — ICH',               'stat',    'active'),
    (p7, e4, doc2_id,  'referral',  'Speech therapy — NPO/dysphagia evaluation',         'urgent',  'pending'),
    (p9, e5, doc2_id,  'lab',       'Point-of-care glucose Q1H x4 then Q2H',             'urgent',  'active'),
    (p9, e5, nurse1_id,'diet',      'Diabetic diet 1800 kcal carbohydrate controlled',   'routine', 'active'),
    (p3, e6, doc1_id,  'imaging',   'Post-op AP/lateral right knee X-ray',               'routine', 'pending'),
    (p3, e6, doc1_id,  'referral',  'Physical therapy — knee arthroplasty rehab',        'routine', 'pending'),
    (p2, e2, nurse1_id,'activity',  'Ambulate with assistance TID',                      'routine', 'active');

  -- ── APPOINTMENTS ───────────────────────────────────────────────────────────
  INSERT INTO appointments (patient_id, provider_id, department_id, appointment_type, scheduled_date, scheduled_time, duration_minutes, status, chief_complaint, created_by) VALUES
    (p4,  doc1_id, dept_ed,   'follow_up',   CURRENT_DATE,                    '09:00', 30,  'scheduled',  'Asthma follow-up — spirometry review',         recep_id),
    (p6,  doc1_id, dept_med,  'follow_up',   CURRENT_DATE,                    '10:30', 30,  'confirmed',  'GI follow-up — iron deficiency anemia check',  recep_id),
    (p8,  doc1_id, dept_med,  'follow_up',   CURRENT_DATE,                    '11:00', 45,  'checked_in', 'Chronic low back pain — pain management review',recep_id),
    (p10, doc1_id, dept_med,  'follow_up',   CURRENT_DATE,                    '14:00', 30,  'scheduled',  'Migraine — medication efficacy review',         recep_id),
    (p11, doc1_id, dept_peds, 'follow_up',   CURRENT_DATE,                    '15:30', 30,  'scheduled',  '6-year well child visit',                       recep_id),
    (p12, doc2_id, dept_med,  'follow_up',   CURRENT_DATE,                    '16:00', 45,  'scheduled',  'CKD stage 3 — nephrology co-management',        recep_id),
    (p4,  doc1_id, dept_ed,   'procedure',   CURRENT_DATE+INTERVAL '3 days',  '08:30', 60,  'scheduled',  'Pulmonary function testing (PFT)',               recep_id),
    (p8,  doc1_id, dept_surg, 'procedure',   CURRENT_DATE+INTERVAL '7 days',  '07:00', 120, 'scheduled',  'L4-L5 epidural steroid injection',              recep_id),
    (p10, doc1_id, dept_med,  'new_patient', CURRENT_DATE+INTERVAL '1 day',   '10:00', 60,  'scheduled',  'Neurology new consult — migraine with aura',    recep_id),
    (p6,  doc1_id, dept_med,  'urgent',      CURRENT_DATE+INTERVAL '1 day',   '13:00', 30,  'scheduled',  'Abnormal iron studies follow-up',               recep_id);

  -- ── INSURANCE CLAIMS ───────────────────────────────────────────────────────
  INSERT INTO insurance_claims (patient_id, encounter_id, claim_number, insurance_provider, insurance_id, group_number, total_charges, submitted_amount, approved_amount, patient_responsibility, status, submitted_at) VALUES
    (p1, e1, 'CLM-2026-0001', 'BlueCross BlueShield', 'BCB-0012345', 'GRP-4521', 48250.00, 48250.00, 41012.50, 7237.50, 'under_review', NOW()-INTERVAL '1 day'),
    (p2, e2, 'CLM-2026-0002', 'Aetna',                'AET-9987234', 'GRP-8801', 12800.00, 12800.00, 10880.00, 1920.00, 'submitted',    NOW()-INTERVAL '12 hours'),
    (p5, e3, 'CLM-2026-0003', 'Medicare',             'MED-7789012', 'GRP-3300', 31500.00, 31500.00, NULL,     NULL,    'draft',        NULL),
    (p3, e6, 'CLM-2026-0004', 'United Healthcare',    'UHC-4456789', 'GRP-2211', 24000.00, 24000.00, NULL,     NULL,    'draft',        NULL);

  -- ── ALERTS ─────────────────────────────────────────────────────────────────
  INSERT INTO alerts (patient_id, encounter_id, alert_type, severity, message, is_acknowledged) VALUES
    (p1, e1,   'critical_result',   'critical', 'CRITICAL: Troponin I 4.82 ng/mL (ref <0.04). Immediate cardiology notification required.',              false),
    (p1, e1,   'allergy',           'critical', 'ALLERGY: Penicillin allergy (anaphylaxis). Verify all antibiotics before ordering.',                    false),
    (p5, e3,   'critical_result',   'critical', 'CRITICAL: ABG PaO2 52 mmHg — severe hypoxemia. Immediate respiratory intervention required.',           false),
    (p7, e4,   'clinical_decision', 'critical', 'ICH PROTOCOL: BP 210/118 with hemorrhagic stroke. Target BP <160 systolic. Neurosurgery notified.',     false),
    (p9, e5,   'critical_result',   'critical', 'CRITICAL: Blood glucose 480 mg/dL. DKA protocol initiated. Insulin drip in progress.',                  false),
    (p4, e7,   'allergy',           'warning',  'ALLERGY: Aspirin and NSAIDs — documented aspirin-exacerbated respiratory disease (AERD).',              false),
    (p8, e9,   'allergy',           'warning',  'ALLERGY: Morphine allergy (respiratory depression). Use alternative opioids with caution.',              false),
    (p7, e4,   'allergy',           'critical', 'ALLERGY: Lisinopril contraindicated — documented angioedema. Avoid all ACE inhibitors.',                false);

  RAISE NOTICE '=== Seed completed successfully ===';
  RAISE NOTICE 'Admin user ID: %', admin_id;
  RAISE NOTICE '8 staff accounts | 12 patients | 12 encounters | 12 medication orders | 6 lab orders | 3 imaging | 8 alerts';

END $$;
