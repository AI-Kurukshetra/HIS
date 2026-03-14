'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface PatientTabsProps {
  patientId: string
}

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Encounters', href: '/encounters' },
  { label: 'Medications', href: '/medications' },
  { label: 'Labs', href: '/labs' },
  { label: 'Imaging', href: '/imaging' },
  { label: 'Notes', href: '/notes' },
  { label: 'Vitals', href: '/vitals' },
]

export function PatientTabs({ patientId }: PatientTabsProps) {
  const pathname = usePathname()
  const basePath = `/patients/${patientId}`

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
      <nav className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const href = `${basePath}${tab.href}`
          const isActive = tab.href === ''
            ? pathname === basePath || pathname === basePath + '/'
            : pathname.startsWith(href)

          return (
            <Link
              key={tab.label}
              href={href}
              className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
