import { describe, expect, it } from 'vitest'
import {
  getEmailError,
  getPhoneDigits,
  getPhoneError,
  getQuantityError,
  getTextLengthError,
  normalizeQuantityInput,
} from '@/lib/validation'

describe('validation helpers', () => {
  describe('normalizeQuantityInput', () => {
    it('converts valid numeric input to a non-negative integer', () => {
      expect(normalizeQuantityInput('4')).toBe(4)
      expect(normalizeQuantityInput('4.9')).toBe(4)
      expect(normalizeQuantityInput('-3')).toBe(0)
    })

    it('falls back to 0 for invalid numbers', () => {
      expect(normalizeQuantityInput('abc')).toBe(0)
      expect(normalizeQuantityInput('')).toBe(0)
    })
  })

  describe('getQuantityError', () => {
    it('accepts a valid whole number within the allowed range', () => {
      expect(getQuantityError('5', 10)).toBeNull()
    })

    it('rejects missing, negative, decimal, non-number, and over-limit values', () => {
      expect(getQuantityError('', 10)).toBe('Quantity is required.')
      expect(getQuantityError('-1', 10)).toBe('Minimum is 0.')
      expect(getQuantityError('1.5', 10)).toBe('Use a whole number.')
      expect(getQuantityError('abc', 10)).toBe('Enter a valid number.')
      expect(getQuantityError('11', 10)).toBe('Only 10 remaining.')
    })
  })

  describe('contact validation', () => {
    it('validates email format', () => {
      expect(getEmailError('customer@tesla.com')).toBeNull()
      expect(getEmailError('bad-email')).toBe('Enter a valid email address.')
      expect(getEmailError('')).toBe('Email is required.')
    })

    it('normalizes and validates phone numbers', () => {
      expect(getPhoneDigits('(555) 123-4567')).toBe('5551234567')
      expect(getPhoneError('(555) 123-4567')).toBeNull()
      expect(getPhoneError('555')).toBe('Phone number must be exactly 10 digits.')
      expect(getPhoneError('')).toBe('Phone number is required.')
    })

    it('validates required text length boundaries', () => {
      expect(getTextLengthError('Company name', 'Tesla Energy', 2, 120)).toBeNull()
      expect(getTextLengthError('Company name', '', 2, 120)).toBe('Company name is required.')
      expect(getTextLengthError('Company name', 'A', 2, 120)).toBe(
        'Company name must be at least 2 characters.',
      )
      expect(getTextLengthError('Company name', 'A'.repeat(121), 2, 120)).toBe(
        'Company name must be 120 characters or less.',
      )
    })
  })
})
