'use client'

import { Bell, ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  userName?: string
  userRole?: string
  unreadAlerts?: number
}

const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  encounters: 'Encounters',
  orders: 'Orders',
  medications: 'Medications',
  labs: 'Lab Results',
  imaging: 'Imaging',
  scheduling: 'Scheduling',
  billing: 'Billing',
  reports: 'Reports',
  admin: 'Administration',
  new: 'New',
  vitals: 'Vitals',
  notes: 'Notes',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Header({ userName = 'User', userRole = 'Staff', unreadAlerts = 0 }: HeaderProps) {
  const pathname = usePathname()

  // Build breadcrumb from pathname
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, i) => {
    const label = pathLabels[seg] || seg
    const isLast = i === segments.length - 1
    return { label, isLast }
  })

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-blue-100 text-blue-700',
    nurse: 'bg-teal-100 text-teal-700',
    pharmacist: 'bg-green-100 text-green-700',
    lab_tech: 'bg-yellow-100 text-yellow-700',
    receptionist: 'bg-pink-100 text-pink-700',
    billing: 'bg-orange-100 text-orange-700',
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-6">
      {/* Breadcrumb */}
      <nav className="flex-1 flex items-center gap-1.5 text-sm">
        <Home className="w-4 h-4 text-gray-400" />
        {breadcrumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className={crumb.isLast ? 'text-gray-900 font-medium' : 'text-gray-400'}>
              {crumb.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{userName}</p>
            <p className="text-xs text-gray-400">{roleColors[userRole] ? userRole.replace('_', ' ') : userRole}</p>
          </div>
          <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(userName)}
          </div>
        </div>
      </div>
    </header>
  )
}
