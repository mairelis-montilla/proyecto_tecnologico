import { useState, useEffect } from 'react'
import { RatingStars } from './RatingStarts'
import { useReviewStore } from '@/stores/review.store'
import type { CreateReviewPayload } from '@/types/reviews.types'

interface ReviewFormProps {
    mentorId: string
    sessionId: string
    mentorName: string
    onSuccess?: () => void
    onCancel?: () => void
}

const ratingLabels: Record<number, string> = {
    1: 'Muy mala experiencia',
    2: 'Podría mejorar',
    3: 'Estuvo bien',
    4: 'Muy buena sesión',
    5: '¡Excelente mentor!',
}

const MAX_COMMENT_LENGTH = 500

export function ReviewForm({ mentorId, sessionId, mentorName, onSuccess, onCancel }: ReviewFormProps) {
    const { submitReview, isSubmitting, submitError, submitSuccess, resetSubmitState } =
        useReviewStore()

    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [touched, setTouched] = useState(false)

    useEffect(() => {
        if (submitSuccess) onSuccess?.()
    }, [submitSuccess, onSuccess])

    useEffect(() => {
        return () => { resetSubmitState() }
    }, [resetSubmitState])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setTouched(true)
        if (rating === 0) return

        const payload: CreateReviewPayload = {
            mentorId,
            sessionId,
            rating,
            comment: comment.trim(),
        }

        await submitReview(payload)
    }

    if (submitSuccess) {
        return (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="text-base font-bold text-emerald-800 mb-1">¡Gracias por tu reseña!</h3>
                <p className="text-sm text-emerald-600">
                    Tu experiencia ayuda a otros estudiantes a elegir al mentor ideal.
                </p>
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
            noValidate
        >
            <div>
                <h2 className="text-lg font-bold text-slate-800">Califica tu sesión</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                    con <span className="text-slate-600 font-medium">{mentorName}</span>
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                    ¿Cómo calificarías la sesión?
                    <span className="text-red-400 ml-1">*</span>
                </label>
                <RatingStars value={rating} size="lg" interactive onChange={setRating} />
                <span
                    className={[
                        'block text-xs font-medium transition-all duration-200',
                        rating > 0 ? 'text-amber-600 opacity-100' : 'opacity-0',
                    ].join(' ')}
                >
                    {rating > 0 ? ratingLabels[rating] : '—'}
                </span>
                {touched && rating === 0 && (
                    <p className="text-xs text-red-500">Por favor selecciona una calificación</p>
                )}
            </div>

            <div className="space-y-1.5">
                <label htmlFor="comment" className="text-sm font-semibold text-slate-700">
                    Comentario{' '}
                    <span className="text-slate-400 font-normal">(opcional, máx. 500 caracteres)</span>
                </label>
                <textarea
                    id="comment"
                    rows={4}
                    maxLength={MAX_COMMENT_LENGTH}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Comparte tu experiencia: ¿qué aprendiste? ¿cómo fue la comunicación?"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
                />
                <div className="flex justify-end">
                    <span
                        className={[
                            'text-xs tabular-nums transition-colors',
                            comment.length >= MAX_COMMENT_LENGTH * 0.9 ? 'text-amber-500' : 'text-slate-300',
                        ].join(' ')}
                    >
                        {comment.length}/{MAX_COMMENT_LENGTH}
                    </span>
                </div>
            </div>

            {submitError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    {submitError}
                </div>
            )}

            <div className="flex gap-3 pt-1">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Enviando…
                        </>
                    ) : (
                        'Enviar reseña'
                    )}
                </button>
            </div>
        </form>
    )
}