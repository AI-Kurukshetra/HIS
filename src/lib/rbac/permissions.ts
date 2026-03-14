import { UserRole } from '@/types'

// Actions that can be checked throughout the app
export type Permission =
  | 'view_dashboard'
  | 'view_patients'
  | 'create_patient'
  | 'edit_patient'
  | 'delete_patient'
  | 'view_encounters'
  | 'create_encounter'
  | 'edit_encounter'
  | 'view_orders'
  | 'create_order'
  | 'cancel_order'
  | 'view_medications'
  | 'prescribe_medication'
  | 'administer_medication'
  | 'dispense_medication'
  | 'view_labs'
  | 'create_lab_order'
  | 'enter_lab_results'
  | 'verify_lab_results'
  | 'view_imaging'
  | 'create_imaging_order'
  | 'enter_imaging_results'
  | 'view_scheduling'
  | 'create_appointment'
  | 'edit_appointment'
  | 'view_billing'
  | 'create_claim'
  | 'edit_claim'
  | 'view_reports'
  | 'view_admin'
  | 'manage_users'
  | 'manage_departments'
  | 'view_audit_logs'
  | 'record_vitals'
  | 'create_note'
  | 'sign_note'

// Routes each role can access (prefix match)
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: [
    '/dashboard', '/patients', '/encounters', '/orders', '/medications',
    '/labs', '/imaging', '/scheduling', '/billing', '/reports', '/admin',
  ],
  doctor: [
    '/dashboard', '/patients', '/encounters', '/orders', '/medications',
    '/labs', '/imaging', '/scheduling', '/reports',
  ],
  nurse: [
    '/dashboard', '/patients', '/encounters', '/medications',
    '/labs', '/imaging', '/scheduling',
  ],
  pharmacist: [
    '/dashboard', '/patients', '/medications', '/orders',
  ],
  lab_tech: [
    '/dashboard', '/labs', '/orders', '/patients',
  ],
  receptionist: [
    '/dashboard', '/patients', '/scheduling', '/encounters',
  ],
  billing: [
    '/dashboard', '/billing', '/patients', '/reports',
  ],
}

// Permissions per role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard', 'view_patients', 'create_patient', 'edit_patient', 'delete_patient',
    'view_encounters', 'create_encounter', 'edit_encounter',
    'view_orders', 'create_order', 'cancel_order',
    'view_medications', 'prescribe_medication', 'administer_medication', 'dispense_medication',
    'view_labs', 'create_lab_order', 'enter_lab_results', 'verify_lab_results',
    'view_imaging', 'create_imaging_order', 'enter_imaging_results',
    'view_scheduling', 'create_appointment', 'edit_appointment',
    'view_billing', 'create_claim', 'edit_claim',
    'view_reports', 'view_admin', 'manage_users', 'manage_departments', 'view_audit_logs',
    'record_vitals', 'create_note', 'sign_note',
  ],
  doctor: [
    'view_dashboard', 'view_patients', 'create_patient', 'edit_patient',
    'view_encounters', 'create_encounter', 'edit_encounter',
    'view_orders', 'create_order', 'cancel_order',
    'view_medications', 'prescribe_medication',
    'view_labs', 'create_lab_order',
    'view_imaging', 'create_imaging_order',
    'view_scheduling', 'create_appointment', 'edit_appointment',
    'view_reports', 'record_vitals', 'create_note', 'sign_note',
  ],
  nurse: [
    'view_dashboard', 'view_patients', 'edit_patient',
    'view_encounters', 'edit_encounter',
    'view_orders',
    'view_medications', 'administer_medication',
    'view_labs', 'view_imaging',
    'view_scheduling', 'create_appointment',
    'record_vitals', 'create_note',
  ],
  pharmacist: [
    'view_dashboard', 'view_patients',
    'view_orders',
    'view_medications', 'dispense_medication',
    'view_labs',
  ],
  lab_tech: [
    'view_dashboard', 'view_patients',
    'view_orders',
    'view_labs', 'create_lab_order', 'enter_lab_results', 'verify_lab_results',
  ],
  receptionist: [
    'view_dashboard', 'view_patients', 'create_patient', 'edit_patient',
    'view_encounters',
    'view_scheduling', 'create_appointment', 'edit_appointment',
  ],
  billing: [
    'view_dashboard', 'view_patients',
    'view_billing', 'create_claim', 'edit_claim',
    'view_reports',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_ROUTES[role] ?? []
  return allowed.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export function getDefaultRoute(role: UserRole): string {
  const routes = ROLE_ROUTES[role]
  if (!routes || routes.length === 0) return '/dashboard'
  return routes[0]
}

// Nav items visible per role (used in Sidebar)
export const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: 'LayoutDashboard' },
  { href: '/patients',    label: 'Patients',     icon: 'Users' },
  { href: '/encounters',  label: 'Encounters',   icon: 'Activity' },
  { href: '/orders',      label: 'Orders',       icon: 'ClipboardList' },
  { href: '/medications', label: 'Medications',  icon: 'Pill' },
  { href: '/labs',        label: 'Lab Results',  icon: 'FlaskConical' },
  { href: '/imaging',     label: 'Imaging',      icon: 'ImageIcon' },
  { href: '/scheduling',  label: 'Scheduling',   icon: 'Calendar' },
  { href: '/billing',     label: 'Billing',      icon: 'CreditCard' },
  { href: '/reports',     label: 'Reports',      icon: 'BarChart3' },
  { href: '/admin',       label: 'Admin',        icon: 'Settings' },
] as const
