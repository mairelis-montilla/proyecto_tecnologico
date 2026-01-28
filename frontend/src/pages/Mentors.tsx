import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Star,
  X,
  Languages,
  DollarSign,
  BookOpen,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { mentorsService } from '../services/mentors.service'
import { specialtiesService } from '../services/specialties.service'
import type {
  Mentor,
  CategoryWithSpecialties,
  Pagination,
} from '../types/mentor.types'
import { getAvatarUrl } from '../utils/avatar'
import PriceRangeSlider from '../components/PriceRangeSlider'

const Mentors = () => {
  const navigate = useNavigate()

  // Estado de datos
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [categories, setCategories] = useState<CategoryWithSpecialties[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null) // Visual state only
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [minRating, setMinRating] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Cargar categorías al inicio
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await specialtiesService.getCategories()
        setCategories(response.data.categories)
      } catch (err) {
        console.error('Error cargando categorías:', err)
      }
    }
    loadCategories()
  }, [])

  // Cargar mentores usando el endpoint /api/mentors/search
  const loadMentors = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await mentorsService.searchMentors({
        // Only send search term if it has 3 or more characters to avoid 400 error
        q: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        // Category filter removed to allow multi-category via specialties
        // category: selectedCategory || undefined, 
        specialties:
          selectedSpecialties.length > 0
            ? selectedSpecialties.join(',')
            : undefined,
        languages:
          selectedLanguages.length > 0
            ? selectedLanguages.join(',')
            : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        minRate: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxRate: priceRange[1] < 200 ? priceRange[1] : undefined,
        page: currentPage,
        limit: 10,
        sortBy: 'rating',
        sortOrder: 'desc',
      })
      setMentors(response.data.mentors)
      setPagination(response.data.pagination)
    } catch (err) {
      setError('Error al cargar los mentores. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }, [
    debouncedSearch,
    // expandedCategory, // Not needed for fetching
    selectedSpecialties,
    selectedLanguages,
    minRating,
    priceRange,
    currentPage,
  ])

  useEffect(() => {
    loadMentors()
  }, [loadMentors])

  // Función para resaltar términos de búsqueda
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text

    const parts = text.split(
      new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    )
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setExpandedCategory(null)
    setSelectedLanguages([])
    setSelectedSpecialties([])
    setPriceRange([0, 200])
    setMinRating(0)
    setCurrentPage(1)
  }

  const hasActiveFilters =
    selectedSpecialties.length > 0 ||
    selectedLanguages.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 200 ||
    minRating > 0 ||
    searchTerm.length > 0

  // ... (getMentorName, getMentorAvatar omitted for brevity if unchanged, but included in block)
  // Obtener nombre completo del mentor
  const getMentorName = (mentor: Mentor) => {
    return `${mentor.userId.firstName} ${mentor.userId.lastName}`
  }

  // Obtener avatar del mentor
  const getMentorAvatar = (mentor: Mentor) => {
    return getAvatarUrl(mentor.userId.avatar)
  }

  // Componente de filtros reutilizable
  const FiltersContent = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filtro de categorías */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Categorías
        </h3>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
          {categories.map((cat) => (
            <div key={cat.category} className="border-b border-gray-50 last:border-0">
              <div
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${expandedCategory === cat.category ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => {
                  // Toggle expansion only
                  setExpandedCategory(expandedCategory === cat.category ? null : cat.category)
                }}
              >
                <span className="text-sm font-medium">{cat.category} <span className="text-xs opacity-70">({cat.count})</span></span>
                {expandedCategory === cat.category ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4 opacity-50" />
                )}
              </div>

              {/* Sub-opciones (Especialidades) - Estilo Dropdown/Collapsible */}
              {expandedCategory === cat.category && (
                <div className="pl-4 pr-2 py-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {cat.specialties.map((spec) => (
                    <label
                      key={spec._id}
                      className="flex items-center cursor-pointer hover:bg-white p-1.5 rounded-md transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(spec._id)}
                        onChange={(e) => {
                          // Add/Remove specialty irrespective of category logic
                          if (e.target.checked) {
                            setSelectedSpecialties([...selectedSpecialties, spec._id])
                          } else {
                            setSelectedSpecialties(
                              selectedSpecialties.filter((s) => s !== spec._id)
                            )
                          }
                          setCurrentPage(1)
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {spec.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filtro de idiomas 
    <div className="mb-6">
    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Languages className="w-4 h-4" />
        Idiomas
    </h3>
    <div className="space-y-2 max-h-48 overflow-y-auto">
        {availableLanguages.map((language) => (
        <label
            key={language}
            className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
        >
            <input
            type="checkbox"
            checked={selectedLanguages.includes(language)}
            onChange={(e) => {
                if (e.target.checked) {
                setSelectedLanguages([...selectedLanguages, language])
                } else {
                setSelectedLanguages(selectedLanguages.filter((l) => l !== language))
                }
                setCurrentPage(1)
            }}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">{language}</span>
        </label>
        ))}
    </div>
    </div>*/}

      {/* Filtro de precio */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Precio por hora
        </h3>
        <div className="space-y-3">
          <PriceRangeSlider
            min={0}
            max={200}
            step={10}
            value={priceRange}
            onChange={(newValue) => {
              setPriceRange(newValue)
              setCurrentPage(1) // Reset page on change
            }}
          />
        </div>
      </div>

      {/* Filtro de calificación */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Calificación mínima
        </h3>
        <div className="space-y-2">
          {[4.5, 4.0, 3.5, 3.0, 0].map(rating => (
            <label
              key={rating}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => {
                  setMinRating(rating)
                  setCurrentPage(1)
                }}
                className="border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                {rating > 0 ? (
                  <>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {rating}+
                  </>
                ) : (
                  'Todas'
                )}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con búsqueda */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Buscar Mentores
          </h1>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, especialidad o palabra clave (mín. 3 caracteres)..."
                value={searchTerm}
                maxLength={50}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {/* Botón de filtros para móvil */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar de filtros - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <FiltersContent />
            </div>
          </aside>

          {/* Filtros móviles - Modal */}
          {showMobileFilters && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowMobileFilters(false)}
            >
              <div
                className="absolute right-0 top-0 bottom-0 w-80 bg-gray-50 overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Filtros</h2>
                    <button onClick={() => setShowMobileFilters(false)}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <FiltersContent />
                </div>
              </div>
            </div>
          )}

          {/* Contenido principal */}
          <main className="flex-1">
            {/* Contador de resultados */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-700">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </span>
                ) : (
                  <>
                    <span className="font-semibold">
                      {pagination?.totalItems || 0}
                    </span>{' '}
                    {pagination?.totalItems === 1
                      ? 'mentor encontrado'
                      : 'mentores encontrados'}
                  </>
                )}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="lg:hidden text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
                <button onClick={loadMentors} className="ml-2 underline">
                  Reintentar
                </button>
              </div>
            )}

            {/* Loading */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : mentors.length > 0 ? (
              <>
                {/* Grid de mentores */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {mentors.map(mentor => (
                    <div
                      key={mentor._id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                    >
                      <div className="flex gap-4">
                        <img
                          src={getMentorAvatar(mentor)}
                          alt={getMentorName(mentor)}
                          className="w-16 h-16 rounded-full flex-shrink-0 bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {highlightText(
                              getMentorName(mentor),
                              debouncedSearch
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {mentor.specialties[0]?.name || 'Mentor'}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {mentor.rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({mentor.totalSessions} sesiones)
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-purple-600">
                            ${mentor.hourlyRate || 0}
                          </p>
                          <p className="text-xs text-gray-500">por hora</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mt-4 line-clamp-2">
                        {highlightText(mentor.bio, debouncedSearch)}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {mentor.specialties.slice(0, 3).map(spec => (
                          <span
                            key={spec._id}
                            className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                          >
                            {spec.name}
                          </span>
                        ))}
                        {mentor.specialties.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{mentor.specialties.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Languages className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {mentor.languages?.join(', ') || 'Español'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/mentors/${mentor._id}`)}
                          className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Ver perfil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum: number
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-medium ${currentPage === pageNum
                                ? 'bg-purple-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          )
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(p =>
                          Math.min(pagination.totalPages, p + 1)
                        )
                      }
                      disabled={!pagination.hasNextPage}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontraron mentores
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No hay mentores que coincidan con tu búsqueda y filtros
                    actuales. Intenta ajustar los criterios de búsqueda.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Limpiar todos los filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Mentors
