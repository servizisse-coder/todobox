'use client'

import { Bell, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { useNotifications } from '@/hooks/useNotifications'

const typeIcons: Record<string, string> = {
  task_assigned: 'Assegnato',
  task_accepted: 'Accettato',
  task_declined: 'Rifiutato',
  task_updated: 'Aggiornato',
  task_due_today: 'Scadenza oggi',
  task_claimed: 'Preso in carico',
  task_completed: 'Completato',
}

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold text-gray-900">Notifiche</h1>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Segna tutte come lette
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Caricamento...</div>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nessuna notifica"
            description="Non hai ancora ricevuto notifiche."
          />
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={`rounded-xl p-3 transition-colors cursor-pointer ${
                  notification.is_read
                    ? 'bg-white border border-gray-100'
                    : 'bg-blue-50 border border-blue-100'
                }`}
              >
                {notification.task_id ? (
                  <Link href={`/tasks/${notification.task_id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                          {typeIcons[notification.type] || notification.type}
                        </span>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.created_at), 'd MMM yyyy, HH:mm', { locale: it })}
                    </p>
                  </Link>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                          {typeIcons[notification.type] || notification.type}
                        </span>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.created_at), 'd MMM yyyy, HH:mm', { locale: it })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
