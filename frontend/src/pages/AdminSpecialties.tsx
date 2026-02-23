import { useState, useEffect, useCallback } from 'react'
import * as LucideIcons from 'lucide-react'
import { specialtiesService } from '../services/specialties.service'
import { Specialty } from '../types/mentor.types'
import { SpecialtyFormModal } from '../components/admin/SpecialtyFormModal'
import { useToast } from '../components/ui/Toast'

// Helper para renderizar iconos dinámicos eliminada

export default function AdminSpecialties() {
  const [specialties, setSpecialties] = useState<
    (Specialty & { mentorCount: number })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { success, error } = useToast()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchSpecialties = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const response = await specialtiesService.getAllAdmin({
          page,
          limit: 20,
          search: debouncedSearch,
        })
        setSpecialties(response.data.specialties)
        setPagination(response.data.pagination)
      } catch (err) {
        console.error(err)
        error('Error al cargar las especialidades')
      } finally {
        setLoading(false)
      }
    },
    [debouncedSearch, error]
  )

  useEffect(() => {
    fetchSpecialties(1)
  }, [fetchSpecialties])

  const handleCreate = () => {
    setEditingSpecialty(null)
    setIsModalOpen(true)
  }

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await specialtiesService.delete(deleteTarget.id)
      success('Especialidad eliminada correctamente')
      setDeleteTarget(null)
      fetchSpecialties(pagination.currentPage)
    } catch (err: any) {
      console.error(err)
      const msg =
        err.response?.data?.message || 'Error al eliminar la especialidad'
      error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (data: Partial<Specialty>) => {
    setIsSubmitting(true)
    try {
      if (editingSpecialty) {
        await specialtiesService.update(editingSpecialty._id, data)
        success('Especialidad actualizada correctamente')
      } else {
        await specialtiesService.create(data)
        success('Especialidad creada correctamente')
      }
      setIsModalOpen(false)
      fetchSpecialties(pagination.currentPage)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al guardar'
      error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (
    specialty: Specialty,
    currentStatus: boolean
  ) => {
    try {
      await specialtiesService.update(specialty._id, {
        isActive: !currentStatus,
      })
      // Actualizar localmente para feedback inmediato
      setSpecialties(prev =>
        prev.map(s =>
          s._id === specialty._id ? { ...s, isActive: !currentStatus } : s
        )
      )
      success(
        `Especialidad ${!currentStatus ? 'activada' : 'desactivada'} correctamente`
      )
    } catch (err) {
      console.error(err)
      error('Error al cambiar el estado')
      fetchSpecialties(pagination.currentPage) // Revertir si falla
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Especialidades
          </h1>
          <p className="text-gray-500 mt-1">
            Administra el catálogo de especialidades para mentores.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-purpura text-white rounded-xl font-medium hover:bg-indigo transition-all shadow-lg shadow-purple-200"
        >
          <LucideIcons.Plus size={20} />
          Nueva Especialidad
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="relative max-w-md">
          <LucideIcons.Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purpura focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LucideIcons.Loader2
              size={32}
              className="animate-spin text-purpura"
            />
          </div>
        ) : specialties.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <LucideIcons.Hash size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No se encontraron especialidades
            </h3>
            <p className="text-gray-500">
              {search
                ? 'Intenta con otros términos de búsqueda.'
                : 'Comienza creando la primera especialidad.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Mentores</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {specialties.map(specialty => (
                  <tr
                    key={specialty._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {specialty.name}
                        </div>
                        {specialty.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {specialty.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {specialty.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded text-xs font-bold ${
                          specialty.mentorCount > 0
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {specialty.mentorCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          handleToggleStatus(specialty, specialty.isActive)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          specialty.isActive
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {specialty.isActive ? (
                          <>
                            <LucideIcons.CheckCircle size={12} /> Activa
                          </>
                        ) : (
                          <>
                            <LucideIcons.XCircle size={12} /> Inactiva
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(specialty)}
                          className="p-2 text-gray-500 hover:text-purpura hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <LucideIcons.Edit2 size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(specialty._id, specialty.name)
                          }
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <LucideIcons.Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            <button
              onClick={() => fetchSpecialties(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchSpecialties(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      <SpecialtyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingSpecialty}
        isLoading={isSubmitting}
      />

      {/* Modal de confirmación de eliminación */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <LucideIcons.Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              ¿Eliminar especialidad?
            </h3>
            <p className="text-gray-600 text-center text-sm mb-1">
              Estás a punto de eliminar{' '}
              <span className="font-semibold text-gray-900">
                "{deleteTarget.name}"
              </span>
              .
            </p>
            <p className="text-red-600 text-center text-sm font-medium mb-6">
              Esta acción es permanente y no hay forma de recuperarla.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <LucideIcons.Trash2 className="w-4 h-4" />
                    Sí, eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
