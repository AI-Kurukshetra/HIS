import { createClient } from '@/lib/supabase/server'
import { BarChart3, TrendingUp, Users, Activity, FlaskConical, DollarSign } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = createClient()

  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

  const [
    { count: totalPatients },
    { count: newPatients30d },
    { count: totalEncounters },
    { count: activeEncounters },
    { count: labOrders30d },
    { count: criticalLabs },
    { data: claimStats },
    { data: encountersByType },
    { data: topDepartments },
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoISO),
    supabase.from('encounters').select('id', { count: 'exact', head: true }),
    supabase.from('encounters').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('lab_orders').select('id', { count: 'exact', head: true }).gte('ordered_at', thirtyDaysAgoISO),
    supabase.from('lab_results').select('id', { count: 'exact', head: true }).in('interpretation', ['critical_high', 'critical_low']),
    supabase.from('insurance_claims').select('status, total_charges, approved_amount').not('status', 'in', '("draft")'),
    supabase.from('encounters').select('encounter_type'),
    supabase.from('encounters').select('department_id, department:departments(name)').limit(100),
  ])

  // Calculate claim totals
  const totalBilled = claimStats?.reduce((s: number, c: any) => s + (c.total_charges || 0), 0) || 0
  const totalApproved = claimStats?.reduce((s: number, c: any) => s + (c.approved_amount || 0), 0) || 0
  const approvalRate = claimStats && claimStats.length > 0
    ? Math.round((claimStats.filter((c: any) => c.status === 'approved' || c.status === 'paid').length / claimStats.length) * 100)
    : 0

  // Count encounter types
  const encTypeCounts: Record<string, number> = {}
  encountersByType?.forEach((e: any) => {
    encTypeCounts[e.encounter_type] = (encTypeCounts[e.encounter_type] || 0) + 1
  })

  // Count by department
  const deptCounts: Record<string, number> = {}
  topDepartments?.forEach((e: any) => {
    const name = e.department?.name || 'Unknown'
    deptCounts[name] = (deptCounts[name] || 0) + 1
  })
  const topDeptEntries = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxDeptCount = topDeptEntries[0]?.[1] || 1

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm">Hospital performance metrics and statistics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Patients', value: totalPatients ?? 0, sub: `+${newPatients30d ?? 0} last 30 days`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Active Encounters', value: activeEncounters ?? 0, sub: `${totalEncounters ?? 0} total all-time`, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
          { title: 'Lab Orders (30d)', value: labOrders30d ?? 0, sub: `${criticalLabs ?? 0} critical results`, icon: FlaskConical, color: 'text-orange-600', bg: 'bg-orange-50' },
          { title: 'Claim Approval Rate', value: `${approvalRate}%`, sub: `${formatCurrency(totalApproved)} approved`, icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Encounters by Type */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Encounters by Type
          </h2>
          <div className="space-y-3">
            {Object.entries(encTypeCounts).map(([type, count]) => {
              const total = Object.values(encTypeCounts).reduce((a, b) => a + b, 0)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const colors: Record<string, string> = {
                outpatient: 'bg-blue-500',
                inpatient: 'bg-green-500',
                emergency: 'bg-red-500',
                surgical: 'bg-purple-500',
              }
              return (
                <div key={type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{type}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[type] || 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(encTypeCounts).length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No encounter data</p>
            )}
          </div>
        </div>

        {/* Top Departments by Encounters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Top Departments by Volume
          </h2>
          <div className="space-y-3">
            {topDeptEntries.map(([dept, count]) => {
              const pct = Math.round((count / maxDeptCount) * 100)
              return (
                <div key={dept}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{dept}</span>
                    <span className="text-gray-500">{count} encounters</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {topDeptEntries.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No department data</p>
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Revenue Summary
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Total Billed', value: formatCurrency(totalBilled), color: 'text-gray-900' },
              { label: 'Total Approved', value: formatCurrency(totalApproved), color: 'text-green-600' },
              { label: 'Collection Rate', value: `${totalBilled > 0 ? Math.round((totalApproved / totalBilled) * 100) : 0}%`, color: 'text-blue-600' },
              { label: 'Claim Approval Rate', value: `${approvalRate}%`, color: 'text-teal-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            System Overview
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Total Patients in System', value: totalPatients ?? 0 },
              { label: 'Total Encounters', value: totalEncounters ?? 0 },
              { label: 'Active Encounters', value: activeEncounters ?? 0 },
              { label: 'Lab Orders (30 days)', value: labOrders30d ?? 0 },
              { label: 'Critical Lab Results', value: criticalLabs ?? 0 },
              { label: 'Total Claims', value: claimStats?.length ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-bold text-gray-900">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
