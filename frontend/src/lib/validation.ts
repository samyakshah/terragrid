import { FIELD_LIMITS, QUANTITY_MIN, TOTAL_BATTERY_QUANTITY_MAX } from '@/constants/validation'

export function getPhoneDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function normalizeQuantityInput(value: string): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return QUANTITY_MIN
  }

  const integer = Math.floor(parsed)

  // Individual input cannot go below 0.
  // The total max across all devices is enforced by the caller because it depends on other quantities.
  return Math.max(integer, QUANTITY_MIN)
}

/**
 * Device quantity validation should be gentle.
 * We do not want normal typing or selecting a value to immediately make the card look broken.
 */
export function getQuantityError(
  value: string,
  maxAllowedForThisDevice: number = TOTAL_BATTERY_QUANTITY_MAX,
): string | null {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return 'Quantity is required.'
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed)) {
    return 'Enter a valid number.'
  }

  if (parsed < QUANTITY_MIN) {
    return `Minimum is ${QUANTITY_MIN}.`
  }

  if (!Number.isInteger(parsed)) {
    return 'Use a whole number.'
  }

  if (parsed > maxAllowedForThisDevice) {
    return `Only ${maxAllowedForThisDevice} remaining.`
  }

  return null
}

export function getTextLengthError(
  label: string,
  value: string,
  minLength: number,
  maxLength: number,
): string | null {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return `${label} is required.`
  }

  if (trimmed.length < minLength) {
    return `${label} must be at least ${minLength} characters.`
  }

  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or less.`
  }

  return null
}

export function getEmailError(email: string): string | null {
  const trimmed = email.trim()

  if (trimmed.length === 0) {
    return 'Email is required.'
  }

  if (trimmed.length > FIELD_LIMITS.emailMax) {
    return `Email must be ${FIELD_LIMITS.emailMax} characters or less.`
  }

  if (!isValidEmail(trimmed)) {
    return 'Enter a valid email address.'
  }

  return null
}

export function getPhoneError(phoneNumber: string): string | null {
  const digits = getPhoneDigits(phoneNumber)

  if (digits.length === 0) {
    return 'Phone number is required.'
  }

  if (digits.length !== FIELD_LIMITS.phoneDigits) {
    return `Phone number must be exactly ${FIELD_LIMITS.phoneDigits} digits.`
  }

  return null
}
