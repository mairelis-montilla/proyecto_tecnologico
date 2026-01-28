import { useState, useEffect, useRef, useCallback } from 'react'

interface PriceRangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

const PriceRangeSlider = ({
  min,
  max,
  step = 1,
  value,
  onChange,
}: PriceRangeSliderProps) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Calcular porcentaje para posición
  const getPercent = useCallback(
    (val: number) => {
      return Math.round(((val - min) / (max - min)) * 100)
    },
    [min, max]
  )

  // Manejar movimiento del mouse/touch
  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percent = Math.min(
        100,
        Math.max(0, ((clientX - rect.left) / rect.width) * 100)
      )

      const rawValue = min + (percent * (max - min)) / 100
      // Ajustar al step
      const steppedValue = Math.round(rawValue / step) * step

      if (isDragging === 'min') {
        const newValue = Math.min(steppedValue, value[1] - step)
        if (newValue !== value[0] && newValue >= min) {
          onChange([newValue, value[1]])
        }
      } else {
        const newValue = Math.max(steppedValue, value[0] + step)
        if (newValue !== value[1] && newValue <= max) {
          onChange([value[0], newValue])
        }
      }
    },
    [isDragging, min, max, step, value, onChange]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)
    const handleUp = () => setIsDragging(null)

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('mouseup', handleUp)
      window.addEventListener('touchend', handleUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDragging, handleMove])

  const minPercent = getPercent(value[0])
  const maxPercent = getPercent(value[1])

  return (
    <div className="w-full px-2 py-4 select-none touch-none">
      <div
        ref={sliderRef}
        className="relative w-full h-1 bg-gray-200 rounded-full cursor-pointer"
        onClick={(e) => {
          // Click en el track mueve la manija más cercana
          const rect = e.currentTarget.getBoundingClientRect()
          const percent = ((e.clientX - rect.left) / rect.width) * 100
          if (Math.abs(percent - minPercent) < Math.abs(percent - maxPercent)) {
            // Mover min
            const rawValue = min + (percent * (max - min)) / 100
            const steppedValue = Math.round(rawValue / step) * step
            const newValue = Math.min(steppedValue, value[1] - step)
            onChange([newValue >= min ? newValue : min, value[1]])
          } else {
            // Mover max
            const rawValue = min + (percent * (max - min)) / 100
            const steppedValue = Math.round(rawValue / step) * step
            const newValue = Math.max(steppedValue, value[0] + step)
            onChange([value[0], newValue <= max ? newValue : max])
          }
        }}
      >
        {/* Barra coloreada */}
        <div
          className="absolute h-full bg-purple-600 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Manija Min */}
        <div
          className={`absolute rounded-full shadow cursor-grab flex items-center justify-center -top-2 hover:scale-110 transition-transform ${isDragging === 'min' ? 'scale-110 z-30 cursor-grabbing ring-2 ring-purple-300' : 'z-20'
            }`}
          style={{
            left: `calc(${minPercent}% - 10px)`,
            width: '20px',
            height: '20px',
            backgroundColor: 'white',
            border: '2px solid #9333ea' // purple-600
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsDragging('min')
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            setIsDragging('min')
          }}
        />

        {/* Manija Max */}
        <div
          className={`absolute rounded-full shadow cursor-grab flex items-center justify-center -top-2 hover:scale-110 transition-transform ${isDragging === 'max' ? 'scale-110 z-30 cursor-grabbing ring-2 ring-purple-300' : 'z-20'
            }`}
          style={{
            left: `calc(${maxPercent}% - 10px)`,
            width: '20px',
            height: '20px',
            backgroundColor: 'white',
            border: '2px solid #9333ea' // purple-600
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsDragging('max')
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            setIsDragging('max')
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-4 text-sm font-medium text-gray-700 gap-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min={min}
            max={value[1]}
            value={value[0]}
            onChange={(e) => {
              const val = Math.max(min, Math.min(Number(e.target.value), value[1] - step))
              onChange([val, value[1]])
            }}
            className="w-24 pl-6 pr-2 py-1 bg-white border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min={value[0]}
            max={max}
            value={value[1]}
            onChange={(e) => {
              const val = Math.min(max, Math.max(Number(e.target.value), value[0] + step))
              onChange([value[0], val])
            }}
            className="w-24 pl-6 pr-2 py-1 bg-white border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>
    </div>
  )
}

export default PriceRangeSlider
