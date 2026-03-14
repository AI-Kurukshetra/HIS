'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Activity, ClipboardList, Pill,
  FlaskConical, ImageIcon, Calendar, CreditCard, BarChart3,
  Settings, Cross, LogOut, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ROLE_ROUTES } from '@/lib/rbac/permissions'
import type { UserRole } from '@/types'

interface SidebarProps {
  userRole?: UserRole
  userName?: string
}

const ALL_NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/patients',    label: 'Patients',     Icon: Users },
  { href: '/encounters',  label: 'Encounters',   Icon: Activity },
  { href: '/orders',      label: 'Orders',       Icon: ClipboardList },
  { href: '/medications', label: 'Medications',  Icon: Pill },
  { href: '/labs',        label: 'Lab Results',  Icon: FlaskConical },
  { href: '/imaging',     label: 'Imaging',      Icon: ImageIcon },
  { href: '/scheduling',  label: 'Scheduling',   Icon: Calendar },
  { href: '/billing',     label: 'Billing',      Icon: CreditCard },
  { href: '/reports',     label: 'Reports',      Icon: BarChart3 },
  { href: '/admin',       label: 'Admin',        Icon: Settings },
]

const roleLabels: Record<UserRole, string> = {
  admin:        'Administrator',
  doctor:       'Physician',
  nurse:        'Nurse',
  pharmacist:   'Pharmacist',
  lab_tech:     'Lab Technician',
  receptionist: 'Receptionist',
  billing:      'Billing',
}

const roleBadgeColors: Record<UserRole, string> = {
  admin:        'bg-purple-500/20 text-purple-200',
  doctor:       'bg-blue-500/20 text-blue-200',
  nurse:        'bg-teal-500/20 text-teal-200',
  pharmacist:   'bg-green-500/20 text-green-200',
  lab_tech:     'bg-yellow-500/20 text-yellow-200',
  receptionist: 'bg-pink-500/20 text-pink-200',
  billing:      'bg-orange-500/20 text-orange-200',
}

export function Sidebar({ userRole = 'nurse', userName = 'User' }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  // Filter nav items to only those the current role can access
  const allowedRoutes = ROLE_ROUTES[userRole] ?? []
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    allowedRoutes.some((r) => r === item.href || item.href.startsWith(r))
  )

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear role cookie
    document.cookie = 'user_role=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f2744] flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
            <Cross className="w-5 h-5 text-blue-300" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">MediTech HIS</h1>
            <p className="text-blue-300/70 text-xs">Hospital System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Navigation</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const { Icon } = item
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600/30 text-white border border-blue-500/30'
                      : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-300' : 'text-blue-300/50 group-hover:text-blue-300'}`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          <p className="text-white text-sm font-medium truncate">{userName}</p>
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${roleBadgeColors[userRole] ?? 'bg-gray-500/20 text-gray-200'}`}>
            {roleLabels[userRole] ?? userRole}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
