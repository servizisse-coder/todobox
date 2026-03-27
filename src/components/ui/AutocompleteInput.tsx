'use client'

import { useState, useRef, useEffect } from 'react'

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  label?: string
}

export function AutocompleteInput({ value, onChange, suggestions, placeholder, label }: AutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.trim()) {
      const q = value.toLowerCase()
      setFiltered(suggestions.filter(s => s.toLowerCase().includes(q) && s.toLowerCase() !== q))
    } else {
      setFiltered(suggestions)
    }
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
          {filtered.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                onChange(suggestion)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
