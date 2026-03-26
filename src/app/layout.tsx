import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'ToDoBox - Gestione Task Aziendale',
  description: 'Piattaforma to-do list aziendale collaborativa',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className="antialiased bg-gray-50 text-gray-900">
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  )
}
