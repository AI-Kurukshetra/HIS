import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'teal'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  danger: 'bg-red-100 text-red-800 border border-red-200',
  info: 'bg-blue-100 text-blue-800 border border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  teal: 'bg-teal-100 text-teal-800 border border-teal-200',
}

export function Badge({ variant = 'neutral', children, className = '', size = 'sm' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Helper functions to get badge variant from status strings
export function getStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case 'active':
    case 'available':
    case 'resulted':
    case 'completed':
    case 'approved':
    case 'paid':
    case 'final':
    case 'signed':
      return 'success'
    case 'pending':
    case 'scheduled':
    case 'confirmed':
    case 'ordered':
    case 'draft':
    case 'preliminary':
    case 'under_review':
    case 'submitted':
    case 'hold':
      return 'warning'
    case 'critical':
    case 'denied':
    case 'cancelled':
    case 'critical_high':
    case 'critical_low':
    case 'life_threatening':
    case 'severe':
    case 'stat':
      return 'danger'
    case 'discharged':
    case 'transferred':
    case 'discontinued':
    case 'no_show':
    case 'inactive':
    case 'resolved':
      return 'neutral'
    case 'in_progress':
    case 'processing':
    case 'collected':
    case 'urgent':
    case 'abnormal':
    case 'moderate':
    case 'appealed':
      return 'info'
    default:
      return 'neutral'
  }
}

export function getPriorityVariant(priority: string): BadgeVariant {
  switch (priority.toLowerCase()) {
    case 'stat': return 'danger'
    case 'urgent': return 'warning'
    case 'routine': return 'info'
    default: return 'neutral'
  }
}

export function getInterpretationVariant(interpretation: string): BadgeVariant {
  switch (interpretation.toLowerCase()) {
    case 'normal': return 'success'
    case 'abnormal': return 'warning'
    case 'critical_high':
    case 'critical_low': return 'danger'
    case 'pending': return 'neutral'
    default: return 'neutral'
  }
}
