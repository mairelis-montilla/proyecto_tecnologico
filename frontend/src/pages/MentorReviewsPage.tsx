import { MentorReview } from './MentorReview'

export default function MentorReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Reseñas</h1>
          <p className="text-gray-500 mt-1">
            Calificaciones y comentarios de tus estudiantes
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MentorReview />
      </div>
    </div>
  )
}
