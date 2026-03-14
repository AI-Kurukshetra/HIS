'use client'

import { useState, useTransition } from 'react'
import {
  Users, ChevronDown, Shield, Eye, Trash2, CheckCircle2,
  AlertCircle, X, Search, ChevronRight,
} from 'lucide-react'
import { updateUserRole, deleteUser } from './actions'
import { ROLE_PERMISSIONS } from '@/lib/rbac/permissions'
import type { UserRole } from '@/types'
import type { Permission } from '@/lib/rbac/permissions'

// ── Types ──────────────────────────────────────────────────────────────────
interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  license_number: string | null
  created_at: string
  department: { name: string } | null
}

// ── Constants ─────────────────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; color: string; bg: string }[] = [
  { value: 'admin',        label: 'Administrator', color: 'text-purple-700', bg: 'bg-purple-100' },
  { value: 'doctor',       label: 'Physician',     color: 'text-blue-700',   bg: 'bg-blue-100' },
  { value: 'nurse',        label: 'Nurse',         color: 'text-teal-700',   bg: 'bg-teal-100' },
  { value: 'pharmacist',   label: 'Pharmacist',    color: 'text-green-700',  bg: 'bg-green-100' },
  { value: 'lab_tech',     label: 'Lab Tech',      color: 'text-yellow-700', bg: 'bg-yellow-100' },
  { value: 'receptionist', label: 'Receptionist',  color: 'text-pink-700',   bg: 'bg-pink-100' },
  { value: 'billing',      label: 'Billing',       color: 'text-orange-700', bg: 'bg-orange-100' },
]

// Group permissions into categories for the permissions modal
const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  {
    label: 'Patients',
    perms: ['view_patients', 'create_patient', 'edit_patient', 'delete_patient'],
  },
  {
    label: 'Encounters',
    perms: ['view_encounters', 'create_encounter', 'edit_encounter'],
  },
  {
    label: 'Orders',
    perms: ['view_orders', 'create_order', 'cancel_order'],
  },
  {
    label: 'Medications',
    perms: ['view_medications', 'prescribe_medication', 'administer_medication', 'dispense_medication'],
  },
  {
    label: 'Lab',
    perms: ['view_labs', 'create_lab_order', 'enter_lab_results', 'verify_lab_results'],
  },
  {
    label: 'Imaging',
    perms: ['view_imaging', 'create_imaging_order', 'enter_imaging_results'],
  },
  {
    label: 'Scheduling',
    perms: ['view_scheduling', 'create_appointment', 'edit_appointment'],
  },
  {
    label: 'Billing',
    perms: ['view_billing', 'create_claim', 'edit_claim'],
  },
  {
    label: 'Clinical',
    perms: ['record_vitals', 'create_note', 'sign_note'],
  },
  {
    label: 'Admin',
    perms: ['view_reports', 'view_admin', 'manage_users', 'manage_departments', 'view_audit_logs'],
  },
]

const permLabel = (p: Permission) =>
  p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function getRoleStyle(role: UserRole) {
  return ROLES.find((r) => r.value === role) ?? ROLES[2]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Role Badge ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  const s = getRoleStyle(role)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  )
}

// ── Permissions Modal ─────────────────────────────────────────────────────
function PermissionsModal({
  user,
  onClose,
}: {
  user: Profile
  onClose: () => void
}) {
  const perms = ROLE_PERMISSIONS[user.role] ?? []
  const s = getRoleStyle(user.role)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Shield className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{user.full_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <RoleBadge role={user.role} />
                <span className="text-xs text-gray-400">{perms.length} permissions</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <p className="text-xs text-gray-500 mb-4">
            Permissions are determined by role. To change permissions, update the user&apos;s role.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERMISSION_GROUPS.map((group) => {
              const granted = group.perms.filter((p) => perms.includes(p))
              const denied  = group.perms.filter((p) => !perms.includes(p))
              if (granted.length === 0 && denied.length === 0) return null
              return (
                <div key={group.label} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">{group.label}</p>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {group.perms.map((p) => {
                      const has = perms.includes(p)
                      return (
                        <div key={p} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            has ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {has
                              ? <CheckCircle2 className="w-3 h-3 text-green-600" />
                              : <X className="w-2.5 h-2.5 text-gray-400" />
                            }
                          </div>
                          <span className={`text-xs ${has ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                            {permLabel(p)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Role Change Dropdown ───────────────────────────────────────────────────
function RoleDropdown({
  userId,
  currentRole,
  currentUserId,
  onRoleChanged,
}: {
  userId: string
  currentRole: UserRole
  currentUserId: string
  onRoleChanged: (id: string, role: UserRole) => void
}) {
  const [open, setOpen]       = useState(false)
  const [pending, startTrans] = useTransition()
  const [toast, setToast]     = useState<{ ok: boolean; msg: string } | null>(null)
  const isSelf = userId === currentUserId

  const handleSelect = (role: UserRole) => {
    if (role === currentRole) { setOpen(false); return }
    startTrans(async () => {
      const result = await updateUserRole(userId, role)
      if (result.error) {
        setToast({ ok: false, msg: result.error })
      } else {
        setToast({ ok: true, msg: `Role updated to ${role}` })
        onRoleChanged(userId, role)
      }
      setOpen(false)
      setTimeout(() => setToast(null), 3000)
    })
  }

  return (
    <div className="relative">
      {toast && (
        <div className={`absolute bottom-full mb-2 left-0 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${
          toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {toast.msg}
        </div>
      )}

      <button
        disabled={pending || isSelf}
        onClick={() => setOpen(!open)}
        title={isSelf ? 'Cannot change your own role' : 'Change role'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
          isSelf
            ? 'cursor-not-allowed opacity-60 border-gray-200 bg-gray-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
        }`}
      >
        {pending ? (
          <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
        ) : (
          <RoleBadge role={currentRole} />
        )}
        {!isSelf && <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[180px]">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Role</p>
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => handleSelect(r.value)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  r.value === currentRole ? 'bg-blue-50' : ''
                }`}
              >
                <span className={`font-medium ${getRoleStyle(r.value).color}`}>{r.label}</span>
                {r.value === currentRole && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Delete Button ─────────────────────────────────────────────────────────
function DeleteUserButton({
  userId,
  userName,
  currentUserId,
  onDeleted,
}: {
  userId: string
  userName: string
  currentUserId: string
  onDeleted: (id: string) => void
}) {
  const [confirm, setConfirm]  = useState(false)
  const [pending, startTrans]  = useTransition()
  const isSelf = userId === currentUserId

  if (isSelf) return null

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-medium">Confirm?</span>
        <button
          onClick={() => startTrans(async () => {
            const r = await deleteUser(userId)
            if (!r.error) onDeleted(userId)
            setConfirm(false)
          })}
          disabled={pending}
          className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
        >
          {pending ? '...' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title={`Remove ${userName}`}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export function UserManagement({
  initialProfiles,
  currentUserId,
}: {
  initialProfiles: Profile[]
  currentUserId: string
}) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [search, setSearch]     = useState('')
  const [filterRole, setFilter] = useState<UserRole | 'all'>('all')
  const [viewing, setViewing]   = useState<Profile | null>(null)

  const filtered = profiles.filter((p) => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase())
    const matchRole   = filterRole === 'all' || p.role === filterRole
    return matchSearch && matchRole
  })

  const handleRoleChange = (id: string, role: UserRole) => {
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, role } : p))
  }

  const handleDeleted = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <>
      {viewing && (
        <PermissionsModal user={viewing} onClose={() => setViewing(null)} />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">User Management</h2>
              <span className="ml-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {profiles.length}
              </span>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilter(e.target.value as UserRole | 'all')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white"
            >
              <option value="all">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role & Permissions</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((profile) => (
                  <tr
                    key={profile.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      profile.id === currentUserId ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          getRoleStyle(profile.role).bg
                        } ${getRoleStyle(profile.role).color}`}>
                          {profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-1.5">
                            {profile.full_name}
                            {profile.id === currentUserId && (
                              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">You</span>
                            )}
                          </p>
                          {profile.license_number && (
                            <p className="text-xs text-gray-400 font-mono">Lic: {profile.license_number}</p>
                          )}
                          {profile.phone && (
                            <p className="text-xs text-gray-400">{profile.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role dropdown + permission count */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <RoleDropdown
                          userId={profile.id}
                          currentRole={profile.role}
                          currentUserId={currentUserId}
                          onRoleChanged={handleRoleChange}
                        />
                        <button
                          onClick={() => setViewing(profile)}
                          title="View permissions"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{ROLE_PERMISSIONS[profile.role]?.length ?? 0}</span>
                        </button>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {profile.department?.name ?? <span className="text-gray-300">—</span>}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(profile.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewing(profile)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Permissions
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <DeleteUserButton
                          userId={profile.id}
                          userName={profile.full_name}
                          currentUserId={currentUserId}
                          onDeleted={handleDeleted}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Role legend */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-medium">Roles:</span>
            {ROLES.map((r) => (
              <span key={r.value} className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.bg} ${r.color}`}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
