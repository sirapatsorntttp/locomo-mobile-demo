import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LOCOMO - ระบบจัดการรถรับ-ส่งพนักงาน',
  description: 'Employee Transportation Management System',
  icons: {
    icon: '/favicon.ico',
  },
}

import { LangProvider } from '@/lib/lang-context'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
