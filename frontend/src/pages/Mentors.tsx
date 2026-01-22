import { useState, useMemo } from 'react'
import { Search, Star, X, MapPin, Languages, DollarSign, BookOpen, Filter } from 'lucide-react'

// Datos de ejemplo de mentores
const MOCK_MENTORS = [
{
    id: 1,
    name: 'Ana García',
    title: 'Senior Software Engineer',
    bio: 'Experta en desarrollo web con React y Node.js. Apasionada por enseñar buenas prácticas de código.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    rating: 4.9,
    reviewCount: 127,
    pricePerHour: 45,
    categories: ['Desarrollo Web', 'JavaScript', 'React'],
    languages: ['Español', 'Inglés'],
    location: 'Madrid, España'
},
{
    id: 2,
    name: 'Carlos Mendoza',
    title: 'Data Scientist',
    bio: 'Especialista en Machine Learning y análisis de datos. Mentor con 5 años de experiencia.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    rating: 4.8,
    reviewCount: 89,
    pricePerHour: 60,
    categories: ['Data Science', 'Python', 'Machine Learning'],
    languages: ['Español', 'Inglés', 'Portugués'],
    location: 'Barcelona, España'
},
{
    id: 3,
    name: 'María López',
    title: 'UX/UI Designer',
    bio: 'Diseñadora con más de 8 años de experiencia en productos digitales y aplicaciones móviles.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    rating: 5.0,
    reviewCount: 156,
    pricePerHour: 50,
    categories: ['Diseño UX', 'Diseño UI', 'Figma'],
    languages: ['Español'],
    location: 'Ciudad de México, México'
},
{
    id: 4,
    name: 'David Chen',
    title: 'DevOps Engineer',
    bio: 'Experto en infraestructura cloud, CI/CD y automatización. AWS Certified Solutions Architect.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    rating: 4,
    reviewCount: 64,
    pricePerHour: 70,
    categories: ['DevOps', 'AWS', 'Kubernetes'],
    languages: ['Inglés', 'Español', 'Chino'],
    location: 'San Francisco, USA'
},
{
    id: 5,
    name: 'Laura Martínez',
    title: 'Mobile Developer',
    bio: 'Desarrolladora iOS y Android con experiencia en Flutter y React Native.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura',
    rating: 4.9,
    reviewCount: 92,
    pricePerHour: 55,
    categories: ['Desarrollo Móvil', 'Flutter', 'React Native'],
    languages: ['Español', 'Inglés'],
    location: 'Buenos Aires, Argentina'
},
{
    id: 6,
    name: 'Roberto Silva',
    title: 'Backend Developer',
    bio: 'Especialista en arquitectura de microservicios, APIs REST y bases de datos.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
    rating: 4.6,
    reviewCount: 73,
    pricePerHour: 40,
    categories: ['Backend', 'Node.js', 'PostgreSQL'],
    languages: ['Español', 'Portugués'],
    location: 'São Paulo, Brasil'
},
{
    id: 7,
    name: 'Elena Rodríguez',
    title: 'Frontend Developer',
    bio: 'Especialista en crear interfaces modernas y accesibles con las últimas tecnologías.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    rating: 4.8,
    reviewCount: 101,
    pricePerHour: 48,
    categories: ['Frontend', 'Vue.js', 'CSS'],
    languages: ['Español', 'Francés'],
    location: 'Valencia, España'
},
{
    id: 8,
    name: 'Miguel Ángel Torres',
    title: 'Cybersecurity Specialist',
    bio: 'Experto en seguridad informática, pentesting y protección de datos.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel',
    rating: 4.9,
    reviewCount: 78,
    pricePerHour: 75,
    categories: ['Ciberseguridad', 'Pentesting', 'Ethical Hacking'],
    languages: ['Español', 'Inglés'],
    location: 'Bogotá, Colombia'
}
]

// Extraer valores únicos para filtros
const ALL_CATEGORIES = Array.from(new Set(MOCK_MENTORS.flatMap(m => m.categories))).sort()
const ALL_LANGUAGES = Array.from(new Set(MOCK_MENTORS.flatMap(m => m.languages))).sort()

const Mentors = () => {
const [searchTerm, setSearchTerm] = useState('')
const [selectedCategories, setSelectedCategories] = useState([])
const [selectedLanguages, setSelectedLanguages] = useState([])
const [priceRange, setPriceRange] = useState([0, 100])
const [minRating, setMinRating] = useState(0)
const [showMobileFilters, setShowMobileFilters] = useState(false)

// Función para resaltar términos de búsqueda
const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, i) => 
    part.toLowerCase() === highlight.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
        : part
    )
}

// Filtrar mentores
const filteredMentors = useMemo(() => {
    return MOCK_MENTORS.filter(mentor => {
    // Filtro de búsqueda
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
        mentor.name.toLowerCase().includes(searchLower) ||
        mentor.title.toLowerCase().includes(searchLower) ||
        mentor.bio.toLowerCase().includes(searchLower) ||
        mentor.categories.some(cat => cat.toLowerCase().includes(searchLower))

    // Filtro de categorías
    const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.some(cat => mentor.categories.includes(cat))

    // Filtro de idiomas
    const matchesLanguage = selectedLanguages.length === 0 ||
        selectedLanguages.some(lang => mentor.languages.includes(lang))

    // Filtro de precio
    const matchesPrice = mentor.pricePerHour >= priceRange[0] && 
        mentor.pricePerHour <= priceRange[1]

    // Filtro de calificación
    const matchesRating = mentor.rating >= minRating

    return matchesSearch && matchesCategory && matchesLanguage && 
        matchesPrice && matchesRating
    })
}, [searchTerm, selectedCategories, selectedLanguages, priceRange, minRating])

// Limpiar todos los filtros
const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategories([])
    setSelectedLanguages([])
    setPriceRange([0, 100])
    setMinRating(0)
}

const hasActiveFilters = selectedCategories.length > 0 || 
    selectedLanguages.length > 0 || 
    priceRange[0] > 0 || 
    priceRange[1] < 100 || 
    minRating > 0 ||
    searchTerm.length > 0

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
        <div className="space-y-2 max-h-48 overflow-y-auto">
        {ALL_CATEGORIES.map(category => (
            <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={(e) => {
                if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, category])
                } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== category))
                }
                }}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">{category}</span>
            </label>
        ))}
        </div>
    </div>

    {/* Filtro de idiomas */}
    <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Languages className="w-4 h-4" />
        Idiomas
        </h3>
        <div className="space-y-2">
        {ALL_LANGUAGES.map(language => (
            <label key={language} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
                type="checkbox"
                checked={selectedLanguages.includes(language)}
                onChange={(e) => {
                if (e.target.checked) {
                    setSelectedLanguages([...selectedLanguages, language])
                } else {
                    setSelectedLanguages(selectedLanguages.filter(l => l !== language))
                }
                }}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">{language}</span>
            </label>
        ))}
        </div>
    </div>

    {/* Filtro de precio money money*/}
    <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Precio por hora
        </h3>
        <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-medium">${priceRange[0]}</span>
            <span className="font-medium">${priceRange[1]}</span>
        </div>
        <div className="space-y-1">
            <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={priceRange[0]}
            onChange={(e) => {
                const newMin = parseInt(e.target.value)
                if (newMin <= priceRange[1]) {
                setPriceRange([newMin, priceRange[1]])
                }
            }}
            className="w-full accent-purple-600"
            />
            <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={priceRange[1]}
            onChange={(e) => {
                const newMax = parseInt(e.target.value)
                if (newMax >= priceRange[0]) {
                setPriceRange([priceRange[0], newMax])
                }
            }}
            className="w-full accent-purple-600"
            />
        </div>
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
            <label key={rating} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Buscar Mentores</h1>
        <div className="flex gap-3">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
                type="text"
                placeholder="Buscar por nombre, título, bio o especialidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileFilters(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-50 overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                <span className="font-semibold">{filteredMentors.length}</span>
                {' '}
                {filteredMentors.length === 1 ? 'mentor encontrado' : 'mentores encontrados'}
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

            {/* Grid de mentores */}
            {filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMentors.map(mentor => (
                <div key={mentor.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                    <div className="flex gap-4">
                    <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-16 h-16 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {highlightText(mentor.name, searchTerm)}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                        {highlightText(mentor.title, searchTerm)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{mentor.rating}</span>
                        <span className="text-sm text-gray-500">({mentor.reviewCount})</span>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-purple-600">${mentor.pricePerHour}</p>
                        <p className="text-xs text-gray-500">por hora</p>
                    </div>
                    </div>

                    <p className="text-sm text-gray-700 mt-4 line-clamp-2">
                    {highlightText(mentor.bio, searchTerm)}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                    {mentor.categories.map(cat => (
                        <span key={cat} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                        {highlightText(cat, searchTerm)}
                        </span>
                    ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{mentor.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <Languages className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{mentor.languages.join(', ')}</span>
                        </div>
                    </div>
                    <button className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap">
                        Ver perfil
                    </button>
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontraron mentores
                </h3>
                <p className="text-gray-600 mb-6">
                    No hay mentores que coincidan con tu búsqueda y filtros actuales.
                    Intenta ajustar los criterios de búsqueda.
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