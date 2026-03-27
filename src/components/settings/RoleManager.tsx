'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import type { TodoRole } from '@/types'
import ColorPicker, { ROLE_COLORS } from './ColorPicker'

interface RoleManagerProps {
  roles: TodoRole[]
  onCreateRole: (name: string, color: string) => Promise<unknown>
  onUpdateRole: (id: string, updates: { name?: string; color?: string }) => Promise<boolean>
  onDeleteRole: (id: string) => Promise<boolean>
  onReorder: (roles: TodoRole[]) => Promise<void>
  taskCountByRole?: Record<string, number>
}

export default function RoleManager({
  roles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onReorder,
  taskCountByRole = {},
}: RoleManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(ROLE_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newName.trim()) return
    await onCreateRole(newName.trim(), newColor)
    setNewName('')
    setNewColor(ROLE_COLORS[0])
    setIsAdding(false)
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return
    await onUpdateRole(id, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await onDeleteRole(id)
    setDeletingId(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newRoles = [...roles]
    ;[newRoles[index - 1], newRoles[index]] = [newRoles[index], newRoles[index - 1]]
    onReorder(newRoles)
  }

  const handleMoveDown = (index: number) => {
    if (index === roles.length - 1) return
    const newRoles = [...roles]
    ;[newRoles[index], newRoles[index + 1]] = [newRoles[index + 1], newRoles[index]]
    onReorder(newRoles)
  }

  const startEdit = (role: TodoRole) => {
    setEditingId(role.id)
    setEditName(role.name)
    setEditColor(role.color)
  }

  return (
    <div className="space-y-3">
      {/* Role list */}
      {roles.map((role, index) => (
        <div key={role.id} className="bg-white rounded-xl border border-gray-100 p-4">
          {editingId === role.id ? (
            /* Edit mode */
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleEdit(role.id)}
              />
              <ColorPicker value={editColor} onChange={setEditColor} />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(role.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  <Check className="w-4 h-4" /> Salva
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  <X className="w-4 h-4" /> Annulla
                </button>
              </div>
            </div>
          ) : deletingId === role.id ? (
            /* Delete confirmation */
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Eliminare il ruolo <strong>{role.name}</strong>?
                {(taskCountByRole[role.id] || 0) > 0 && (
                  <span className="text-amber-600">
                    {' '}({taskCountByRole[role.id]} task perderanno il ruolo)
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(role.id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                >
                  Elimina
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: role.color }}
              />
              <span className="flex-1 font-medium text-gray-900">{role.name}</span>
              <span className="text-xs text-gray-400">
                {taskCountByRole[role.id] || 0} task
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === roles.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startEdit(role)}
                  className="p-1 text-gray-400 hover:text-blue-500"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(role.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new role */}
      {isAdding ? (
        <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome del ruolo..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Aggiungi
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewName(''); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              <X className="w-4 h-4" /> Annulla
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          <Plus className="w-5 h-5" /> Aggiungi ruolo
        </button>
      )}
    </div>
  )
}
