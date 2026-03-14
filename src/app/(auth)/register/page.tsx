'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Cross, Eye, EyeOff, AlertCircle, CheckCircle2, User, Mail, Lock, Phone, BadgeCheck, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'doctor',       label: 'Physician / Doctor',   description: 'Full clinical access: orders, EHR, prescriptions' },
  { value: 'nurse',        label: 'Nurse',                description: 'Patient care, vitals, medication administration' },
  { value: 'pharmacist',   label: 'Pharmacist',           description: 'Medication dispensing and order verification' },
  { value: 'lab_tech',     label: 'Lab Technician',       description: 'Lab orders and result entry' },
  { value: 'receptionist', label: 'Receptionist',         description: 'Patient registration and scheduling' },
  { value: 'billing',      label: 'Billing Staff',        description: 'Claims processing and revenue cycle' },
  { value: 'admin',        label: 'Administrator',        description: 'Full system access including user management' },
]

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep]               = useState<1 | 2>(1)
  const [fullName, setFullName]       = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPwd, setConfirmPwd]   = useState('')
  const [role, setRole]               = useState<UserRole>('nurse')
  const [phone, setPhone]             = useState('')
  const [licenseNo, setLicenseNo]     = useState('')
  const [department, setDepartment]   = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)

  // Step 1 validation
  const step1Valid =
    fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    password === confirmPwd

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!step1Valid) return
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // 1. Sign up auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message ?? 'Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // 2. Insert profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName.trim(),
      role,
      phone: phone.trim() || null,
      license_number: licenseNo.trim() || null,
    })

    if (profileError) {
      // Rollback: delete auth user if profile insert fails
      await supabase.auth.admin?.deleteUser?.(authData.user.id).catch(() => {})
      setError('Failed to save profile. ' + profileError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // If email confirmation is disabled, redirect directly
    if (authData.session) {
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
          <p className="text-gray-500 text-sm mb-6">
            {`Welcome, ${fullName}. `}
            Your account has been created with the <strong>{ROLES.find(r => r.value === role)?.label}</strong> role.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            If email confirmation is required, please check your inbox before signing in.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm text-center"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background dots */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-7 text-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <Cross className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold">MediTech HIS</h1>
                <p className="text-blue-200 text-xs">Hospital Information System</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm mt-3 font-medium">Create your staff account</p>
          </div>

          {/* Step indicator */}
          <div className="flex border-b border-gray-100">
            {[
              { n: 1, label: 'Account Details' },
              { n: 2, label: 'Role & Profile' },
            ].map(({ n, label }) => (
              <button
                key={n}
                type="button"
                onClick={() => { if (n === 2 && !step1Valid) return; setStep(n as 1 | 2) }}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  step === n
                    ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === n ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{n}</span>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister}>
            <div className="px-8 py-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* ── Step 1: Account Details ── */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Dr. Jane Smith"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="jane.smith@hospital.org"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Min 8 characters"
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && (
                      <PasswordStrength password={password} />
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        required
                        placeholder="Re-enter password"
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 ${
                          confirmPwd && password !== confirmPwd
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPwd && password !== confirmPwd && (
                      <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!step1Valid}
                    onClick={() => setStep(2)}
                    className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
                  >
                    Continue to Role Selection →
                  </button>
                </div>
              )}

              {/* ── Step 2: Role & Profile ── */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Role selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid gap-2">
                      {ROLES.map((r) => (
                        <label
                          key={r.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            role === r.value
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={r.value}
                            checked={role === r.value}
                            onChange={() => setRole(r.value)}
                            className="mt-0.5 accent-blue-700"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{r.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                          </div>
                          {role === r.value && (
                            <BadgeCheck className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0 mt-0.5" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone (optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 555-0100"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">License # (optional)</label>
                      <div className="relative">
                        <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={licenseNo}
                          onChange={(e) => setLicenseNo(e.target.value)}
                          placeholder="MD-12345"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin note */}
                  {role === 'admin' && (
                    <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Administrator accounts have full system access. This account will require approval from an existing admin before access is granted.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-lg transition-colors text-sm"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>

          <div className="px-8 pb-6 border-t border-gray-100 pt-4">
            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-700 hover:text-blue-800 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-5">
          © 2026 MediTech HIS · All access is logged and monitored
        </p>
      </div>
    </div>
  )
}

// ── Password strength indicator ──────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters',   ok: password.length >= 8 },
    { label: 'Uppercase',        ok: /[A-Z]/.test(password) },
    { label: 'Number',           ok: /\d/.test(password) },
    { label: 'Special char',     ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length

  const barColor =
    score <= 1 ? 'bg-red-400' :
    score === 2 ? 'bg-orange-400' :
    score === 3 ? 'bg-yellow-400' : 'bg-green-500'

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= score ? barColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
            <span>{c.ok ? '✓' : '○'}</span> {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
