import React, { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { Specialty } from '../../types/mentor.types'

interface SpecialtyFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Specialty>) => Promise<void>
  initialData?: Specialty | null
  isLoading?: boolean
}

export const SpecialtyFormModal: React.FC<SpecialtyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Specialty>>({
    name: '',
    category: '',
    description: '',
    isActive: true,
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        isActive: true,
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {initialData ? 'Editar Especialidad' : 'Nueva Especialidad'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purpura focus:border-transparent outline-none transition-all"
              placeholder="Ej. Desarrollo Web"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.category || ''}
              onChange={e =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purpura focus:border-transparent outline-none transition-all"
              placeholder="Ej. Tecnología"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purpura focus:border-transparent outline-none transition-all resize-none"
              placeholder="Breve descripción de la especialidad..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purpura"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Especialidad Activa
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-purpura rounded-xl hover:bg-indigo transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {initialData ? 'Guardar Cambios' : 'Crear Especialidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
