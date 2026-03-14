'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Cross,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Activity,
  CalendarClock,
  FlaskConical,
  ReceiptText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-white px-8 py-10 md:px-10 md:py-12">
              <div className="absolute inset-0 opacity-25 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/40">
                    <Cross className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">MediTech HIS</h1>
                    <p className="text-blue-200 text-xs">Hospital Information System</p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90">
                    Portal Overview
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2 leading-tight">
                    Unified operations portal for clinical and admin teams
                  </h2>
                  <p className="text-blue-100/90 mt-4 text-sm md:text-base">
                    Access patient records, care workflows, diagnostics, and billing in one secure workspace.
                  </p>
                </div>

                <div className="mt-8 grid gap-3">
                  {[
                    {
                      Icon: Activity,
                      title: 'Clinical Workflow',
                      text: 'Patients, encounters, medication and care notes in one flow.',
                    },
                    {
                      Icon: FlaskConical,
                      title: 'Diagnostics Hub',
                      text: 'Lab and imaging updates visible to care teams in real time.',
                    },
                    {
                      Icon: ReceiptText,
                      title: 'Revenue Cycle',
                      text: 'Billing and reporting tools for finance and operations teams.',
                    },
                  ].map(({ Icon, title, text }) => (
                    <div key={title} className="rounded-xl border border-white/15 bg-white/10 p-3.5">
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 mt-0.5 text-blue-200 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-white">{title}</p>
                          <p className="text-xs text-blue-100/90 mt-0.5">{text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {['Dashboard', 'Patients', 'Encounters', 'Labs', 'Imaging', 'Billing'].map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2.5 py-1 rounded-full border border-blue-200/30 bg-blue-300/10 text-blue-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-7 p-3 rounded-xl bg-emerald-400/10 border border-emerald-300/20 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-200 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    Access is role-based and monitored. Use your assigned hospital credentials only.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white px-7 py-8 md:px-10 md:py-11">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h3>
                  <p className="text-sm text-slate-500 mt-1">Continue to the MediTech portal</p>
                </div>
                <CalendarClock className="w-5 h-5 text-slate-400" />
              </div>

              {error && (
                <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@hospital.org"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <p className="text-sm text-slate-500">
                  New staff member?{' '}
                  <Link href="/register" className="text-blue-700 hover:text-blue-800 font-semibold">
                    Create an account
                  </Link>
                </p>
                <p className="text-xs text-slate-400">
                  Authorized personnel only. All access is logged and monitored.
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300/80 px-1">
          <span>© 2026 MediTech HIS</span>
          <span>Support: it-support@meditechhis.local</span>
        </div>
      </div>

    </div>
  )
}
