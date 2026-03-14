import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Fetch unread alerts count
  const { count: alertCount } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('is_acknowledged', false)

  const userName = profile?.full_name || user.email || 'User'
  const userRole = (profile?.role ?? 'receptionist') as import('@/types').UserRole

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar userRole={userRole} userName={userName} />
      <Header
        userName={userName}
        userRole={userRole}
        unreadAlerts={alertCount || 0}
      />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
