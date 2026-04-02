'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  Send,
  Globe,
  Bell,
  BarChart3,
  Settings,
  Users,
  MessageSquarePlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

const baseNavItems = [
  { href: '/', label: 'Oggi', icon: CalendarDays },
  { href: '/tasks', label: 'I miei Task', icon: CheckCircle2 },
  { href: '/assigned', label: 'Assegnati a me', icon: Inbox },
  { href: '/sent', label: 'Assegnati da me', icon: Send },
  { href: '/public', label: 'Pubblici', icon: Globe },
  { href: '/review', label: 'Revisione', icon: BarChart3 },
]

const bottomNavItems = [
  { href: '/feedback', label: 'Feedback', icon: MessageSquarePlus },
  { href: '/settings', label: 'Impostazioni', icon: Settings },
  { href: '/notifications', label: 'Notifiche', icon: Bell },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isSupervisor, setIsSupervisor] = useState(false)

  useEffect(() => {
    if (!user) return
    const check = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('todo_supervisor_access')
        .select('id')
        .eq('supervisor_id', user.id)
        .limit(1)
      setIsSupervisor((data?.length || 0) > 0)
    }
    check()
  }, [user])

  const navItems = [
    ...baseNavItems,
    ...(isSupervisor ? [{ href: '/supervisor', label: 'Team', icon: Users }] : []),
    ...bottomNavItems,
  ]

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 w-60 bg-white border-r border-gray-200 z-30
          transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/supervisor' && pathname.startsWith('/supervisor'))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Bottom nav for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 lg:hidden">
        <div className="flex items-center justify-around h-14">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 px-2 py-1 text-xs
                  ${isActive ? 'text-blue-600' : 'text-gray-400'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-[60px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
