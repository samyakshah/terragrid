import { useEffect, useMemo, useState } from 'react'
import type { SiteConfig, SiteSummary } from '@shared/types'
import { DEVICE_KEYS, DEVICES, TRANSFORMER } from '@/constants/devices'
import { FIELD_LIMITS } from '@/constants/validation'
import { createPurchaseOrder } from '@/lib/api'
import { formatBudget, formatEnergy, formatLand } from '@/lib/format'
import { getEmailError, getPhoneError, getTextLengthError } from '@/lib/validation'
import styles from './QuoteCTA.module.css'
import { TextField } from '@/components/FormFields/FormFields'

interface QuoteDrawerProps {
  open: boolean
  onClose: () => void
  sessionId: string | null
  config: SiteConfig
  summary: SiteSummary
}

type ContactPreference = 'sms' | 'email' | 'phone'

interface FormState {
  companyName: string
  installationAddress: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  contactPreference: ContactPreference
}

type FormErrors = Partial<Record<keyof FormState, string>>

const INITIAL_FORM: FormState = {
  companyName: '',
  installationAddress: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  contactPreference: 'email',
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}

  const companyNameError = getTextLengthError(
    'Company name',
    form.companyName,
    FIELD_LIMITS.companyNameMin,
    FIELD_LIMITS.companyNameMax,
  )

  const addressError = getTextLengthError(
    'Installation address',
    form.installationAddress,
    FIELD_LIMITS.installationAddressMin,
    FIELD_LIMITS.installationAddressMax,
  )

  const firstNameError = getTextLengthError(
    'First name',
    form.firstName,
    FIELD_LIMITS.firstNameMin,
    FIELD_LIMITS.firstNameMax,
  )

  const lastNameError = getTextLengthError(
    'Last name',
    form.lastName,
    FIELD_LIMITS.lastNameMin,
    FIELD_LIMITS.lastNameMax,
  )

  const emailError = getEmailError(form.email)
  const phoneError = getPhoneError(form.phoneNumber)

  if (companyNameError) errors.companyName = companyNameError
  if (addressError) errors.installationAddress = addressError
  if (firstNameError) errors.firstName = firstNameError
  if (lastNameError) errors.lastName = lastNameError
  if (emailError) errors.email = emailError
  if (phoneError) errors.phoneNumber = phoneError

  return errors
}

export function QuoteDrawer({ open, onClose, sessionId, config, summary }: QuoteDrawerProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof FormState, boolean>>>({})

  const selectedDevices = useMemo(
    () =>
      DEVICE_KEYS.filter((key) => config.quantities[key] > 0).map((key) => ({
        name: DEVICES[key].name,
        quantity: config.quantities[key],
        subtotal: config.quantities[key] * DEVICES[key].cost,
      })),
    [config.quantities],
  )

  const currentErrors = useMemo(() => validateForm(form), [form])
  const isValid = Object.keys(currentErrors).length === 0

  const resetDrawerState = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setTouchedFields({})
    setHasSubmittedOnce(false)
    setIsSubmitting(false)
    setReference(null)
    setConfirmationEmail(null)
    setServerError(null)
  }

  useEffect(() => {
    if (!open) {
      resetDrawerState()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }

      if (hasSubmittedOnce) {
        setErrors(validateForm(next))
      }

      return next
    })

    setServerError(null)
  }

  const markTouched = (key: keyof FormState) => {
    setTouchedFields((prev) => ({ ...prev, [key]: true }))
    setErrors(validateForm(form))
  }

  const getVisibleError = (key: keyof FormState) => {
    if (!hasSubmittedOnce && !touchedFields[key]) {
      return undefined
    }

    return errors[key]
  }

  const handleClose = () => {
    resetDrawerState()
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    setHasSubmittedOnce(true)

    if (Object.keys(nextErrors).length > 0) {
      setServerError('Please fix the highlighted fields before submitting.')
      return
    }

    const submittedEmail = form.email.trim()

    setIsSubmitting(true)
    setServerError(null)

    try {
      const response = await createPurchaseOrder({
        sessionId,
        config,
        summary,
        contact: {
          companyName: form.companyName.trim(),
          installationAddress: form.installationAddress.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: submittedEmail,
          phoneNumber: form.phoneNumber.trim(),
          contactPreference: form.contactPreference,
        },
      })

      setConfirmationEmail(submittedEmail)
      setReference(response.orderId)
      setForm(INITIAL_FORM)
      setErrors({})
      setHasSubmittedOnce(false)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Unable to submit your quote request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <div>
            <p className={styles.eyebrow}>{reference ? 'Confirmation' : 'Quote request'}</p>
            <h2 id="quote-drawer-title" className={styles.drawerTitle}>
              {reference ? 'Request received' : 'Request a quote'}
            </h2>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {reference ? (
          <SuccessState
            reference={reference}
            email={confirmationEmail ?? ''}
            onClose={handleClose}
          />
        ) : (
          <>
            <section className={styles.summary}>
              <h3 className={styles.summaryTitle}>What you're requesting</h3>

              <div className={styles.summaryList}>
                {selectedDevices.map((row) => (
                  <div key={row.name} className={styles.summaryRow}>
                    <span>
                      {row.quantity} × {row.name}
                    </span>
                    <strong>{formatBudget(row.subtotal)}</strong>
                  </div>
                ))}

                {summary.transformerCount > 0 && (
                  <div className={styles.summaryRow} data-secondary="true">
                    <span>
                      {summary.transformerCount} × {TRANSFORMER.name}{' '}
                      <em className={styles.autoTag}>auto</em>
                    </span>
                    <strong>{formatBudget(summary.transformerCount * TRANSFORMER.cost)}</strong>
                  </div>
                )}
              </div>

              <div className={styles.summaryMeta}>
                <span>
                  {formatLand(summary.siteWidthFt, summary.siteDepthFt)} ·{' '}
                  {formatEnergy(summary.netEnergyMWh)} net
                </span>

                <div className={styles.summaryTotal}>
                  <span>Estimated total</span>
                  <strong>{formatBudget(summary.totalBudget)}</strong>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Site</legend>

                <TextField
                  label="Company name"
                  value={form.companyName}
                  error={getVisibleError('companyName')}
                  maxLength={FIELD_LIMITS.companyNameMax}
                  onBlur={() => markTouched('companyName')}
                  onChange={(value) => update('companyName', value)}
                />

                <TextField
                  label="Installation address"
                  value={form.installationAddress}
                  error={getVisibleError('installationAddress')}
                  maxLength={FIELD_LIMITS.installationAddressMax}
                  onBlur={() => markTouched('installationAddress')}
                  onChange={(value) => update('installationAddress', value)}
                  placeholder="Street, city, state"
                />
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Contact</legend>

                <div className={styles.fieldRow}>
                  <TextField
                    label="First name"
                    value={form.firstName}
                    error={getVisibleError('firstName')}
                    maxLength={FIELD_LIMITS.firstNameMax}
                    onBlur={() => markTouched('firstName')}
                    onChange={(value) => update('firstName', value)}
                  />

                  <TextField
                    label="Last name"
                    value={form.lastName}
                    error={getVisibleError('lastName')}
                    maxLength={FIELD_LIMITS.lastNameMax}
                    onBlur={() => markTouched('lastName')}
                    onChange={(value) => update('lastName', value)}
                  />
                </div>

                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  error={getVisibleError('email')}
                  maxLength={FIELD_LIMITS.emailMax}
                  onBlur={() => markTouched('email')}
                  onChange={(value) => update('email', value)}
                />

                <TextField
                  label="Phone"
                  type="tel"
                  value={form.phoneNumber}
                  error={getVisibleError('phoneNumber')}
                  maxLength={14}
                  onBlur={() => markTouched('phoneNumber')}
                  onChange={(value) => update('phoneNumber', value)}
                  placeholder="2015550123"
                />
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Preferred contact method</legend>

                <div className={styles.choices}>
                  {(['email', 'phone', 'sms'] as ContactPreference[]).map((pref) => (
                    <label key={pref} className={styles.choice}>
                      <input
                        type="radio"
                        name="contactPreference"
                        value={pref}
                        checked={form.contactPreference === pref}
                        onChange={() => update('contactPreference', pref)}
                      />
                      <span>{pref === 'sms' ? 'SMS' : pref[0].toUpperCase() + pref.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {serverError && <p className={styles.error}>{serverError}</p>}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit request'}
                </button>
              </div>

              <p className={styles.note}>
                A TerraGrid specialist will contact you within 1 business day. No payment is
                required to request a quote.
              </p>
            </form>
          </>
        )}
      </aside>
    </div>
  )
}

function SuccessState({
  reference,
  email,
  onClose,
}: {
  reference: string
  email: string
  onClose: () => void
}) {
  const shortRef = reference.slice(0, 8).toUpperCase()

  return (
    <div className={styles.success}>
      <div className={styles.successIcon} aria-hidden="true">
        ✓
      </div>

      <h3 className={styles.successTitle}>Quote request submitted</h3>

      <p className={styles.successBody}>
        Reference <strong>TG-{shortRef}</strong>
      </p>

      <p className={styles.successBody}>
        A TerraGrid specialist will reach out to <strong>{email || 'you'}</strong> within 1 business
        day to discuss next steps, finalize pricing, and schedule a site review.
      </p>

      <button type="button" className={styles.primaryButton} onClick={onClose}>
        Back to planner
      </button>
    </div>
  )
}
