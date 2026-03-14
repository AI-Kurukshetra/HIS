import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MediTech HIS - Hospital Information System',
  description: 'Comprehensive Hospital Information System for modern healthcare facilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
