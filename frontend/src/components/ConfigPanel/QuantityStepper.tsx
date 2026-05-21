import { useEffect, useState } from 'react'
import { getQuantityError, normalizeQuantityInput } from '@/lib/validation'
import styles from './ConfigPanel.module.css'

interface QuantityStepperProps {
  value: number
  maxAllowed: number
  onChange: (value: number) => void
}

export function QuantityStepper({ value, maxAllowed, onChange }: QuantityStepperProps) {
  const [draftValue, setDraftValue] = useState(String(value))
  const [error, setError] = useState<string | null>(null)
  const [hasBlurred, setHasBlurred] = useState(false)

  useEffect(() => {
    setDraftValue(String(value))
    setError(null)
    setHasBlurred(false)
  }, [value])

  const shouldShowError = hasBlurred && Boolean(error)

  const handleChange = (nextValue: string) => {
    setDraftValue(nextValue)

    const nextError = getQuantityError(nextValue, maxAllowed)
    setError(nextError)

    // Only commit valid quantities into the real app state.
    // This keeps layout and summary calculations clean.
    if (!nextError) {
      onChange(normalizeQuantityInput(nextValue))
    }
  }

  const handleBlur = () => {
    setHasBlurred(true)

    const nextError = getQuantityError(draftValue, maxAllowed)

    if (nextError) {
      setError(nextError)
      return
    }

    const normalized = normalizeQuantityInput(draftValue)

    setDraftValue(String(normalized))
    setError(null)
    onChange(normalized)
  }

  return (
    <div className={styles.quantityField}>
      <input
        className={styles.quantityInput}
        type="number"
        min={0}
        max={maxAllowed}
        step={1}
        value={draftValue}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        aria-label="Device quantity"
        aria-invalid={shouldShowError}
      />

      <div className={styles.quantityErrorSlot} aria-live="polite">
        {shouldShowError && <span>{error}</span>}
      </div>
    </div>
  )
}
