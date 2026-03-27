'use client'

const ROLE_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#6B7280', // gray
  '#F97316', // orange
  '#14B8A6', // teal
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ROLE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-7 h-7 rounded-full border-2 transition-all ${
            value === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Colore ${color}`}
        />
      ))}
    </div>
  )
}

export { ROLE_COLORS }
