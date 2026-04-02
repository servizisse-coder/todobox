'use client'

import { useEffect } from 'react'

interface ShortcutHandlers {
  onQuickAdd?: () => void
}

export function useKeyboardShortcuts({ onQuickAdd }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      // Cmd+K or Ctrl+K — focus quick add
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onQuickAdd?.()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onQuickAdd])
}
