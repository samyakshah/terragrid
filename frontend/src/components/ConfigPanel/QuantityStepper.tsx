// import styles from './ConfigPanel.module.css'

// interface QuantityStepperProps {
//   value: number
//   onChange: (next: number) => void
//   min?: number
//   max?: number
// }

// /**
//  * −/n/+ control. Pure presentational — clamping happens here, persistence
//  * happens upstream in useTerraGrid.
//  *
//  * Click and hold doesn't auto-repeat (yet). Users can also tab to it and
//  * press arrow keys via the buttons.
//  */
// export function QuantityStepper({ value, onChange, min = 0, max = 999 }: QuantityStepperProps) {
//   const decrement = () => onChange(Math.max(min, value - 1))
//   const increment = () => onChange(Math.min(max, value + 1))

//   const atMin = value <= min
//   const atMax = value >= max
//   const hasValue = value > 0

//   return (
//     <div className={styles.stepper}>
//       <button
//         className={styles.stepBtn}
//         onClick={decrement}
//         disabled={atMin}
//         aria-label="Decrease quantity"
//       >
//         −
//       </button>
//       <span className={styles.stepValue} data-has-value={hasValue || undefined}>
//         {value}
//       </span>
//       <button
//         className={styles.stepBtn}
//         data-primary={hasValue || undefined}
//         onClick={increment}
//         disabled={atMax}
//         aria-label="Increase quantity"
//       >
//         +
//       </button>
//     </div>
//   )
// }

import { useEffect, useId, useState } from 'react'
import styles from './ConfigPanel.module.css'

interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  label?: string
}

/**
 * Numeric quantity input.
 *
 * Why this instead of separate minus/plus buttons:
 * - Users can directly type larger quantities.
 * - Native browser steppers provide increment/decrement behavior.
 * - The control is compact and matches the expected assignment UI.
 *
 * Editing model:
 * - While the user is typing, we keep a local string draft.
 * - On valid numeric input, we immediately notify the parent.
 * - Empty input is allowed temporarily so users can replace the value.
 * - On blur or Enter, we normalize empty/invalid values back to a safe integer.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label = 'Quantity',
}: QuantityStepperProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(String(value))

  /**
   * Keep the displayed input synchronized when the source-of-truth value changes
   * outside this component, for example when loading a saved session.
   */
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const normalize = (raw: string): number => {
    const parsed = Number(raw)

    if (!Number.isFinite(parsed)) {
      return min
    }

    const integer = Math.round(parsed)

    return Math.min(max, Math.max(min, integer))
  }

  const commit = (raw: string) => {
    const next = normalize(raw)
    setDraft(String(next))

    if (next !== value) {
      onChange(next)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDraft = event.target.value

    /**
     * Allow a temporary empty field while editing.
     * Example: user selects "5", deletes it, then types "25".
     */
    if (nextDraft === '') {
      setDraft('')
      return
    }

    const next = normalize(nextDraft)

    setDraft(String(next))

    if (next !== value) {
      onChange(next)
    }
  }

  const handleBlur = () => {
    commit(draft)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit(draft)
      event.currentTarget.blur()
    }
  }

  return (
    <div className={styles.quantityField}>
      <label className={styles.quantityLabel} htmlFor={inputId}>
        {label}
      </label>

      <input
        id={inputId}
        className={styles.quantityInput}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label={label}
      />
    </div>
  )
}
