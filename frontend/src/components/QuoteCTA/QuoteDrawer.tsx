import { useEffect, useState } from 'react'
import type { SiteConfig, SiteSummary } from '@shared/types'
import { DEVICE_KEYS, DEVICES, TRANSFORMER } from '@/constants/devices'
import { createPurchaseOrder } from '@/lib/api'
import { formatBudget, formatLand, formatEnergy } from '@/lib/format'
import styles from './QuoteCTA.module.css'

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

const INITIAL_FORM: FormState = {
  companyName: '',
  installationAddress: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  contactPreference: 'email',
}

/**
 * Slide-in drawer that captures a quote request.
 *
 * Layout: order summary at top (so user verifies what they're requesting),
 * sectioned contact form below (Site, Contact, Communication).
 *
 * No payment fields — industrial procurement happens via sales conversation,
 * not online checkout. The backend persists this as a row in purchase_orders
 * with null payment fields.
 */
export function QuoteDrawer({ open, onClose, sessionId, config, summary }: QuoteDrawerProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setError(null)
    }
  }, [open])

  // Esc-to-close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const selectedDevices = DEVICE_KEYS.filter((key) => config.quantities[key] > 0).map((key) => ({
    name: DEVICES[key].name,
    quantity: config.quantities[key],
    subtotal: config.quantities[key] * DEVICES[key].cost,
  }))

  const isValid =
    form.companyName.trim().length > 0 &&
    form.installationAddress.trim().length > 0 &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.email.includes('@') &&
    form.phoneNumber.trim().length >= 7

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) {
      setError('Please complete all required fields before submitting.')
      return
    }

    setIsSubmitting(true)
    setError(null)
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
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          contactPreference: form.contactPreference,
        },
      })
      setReference(response.orderId)
      setForm(INITIAL_FORM)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit your quote request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReference(null)
    onClose()
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
          <SuccessState reference={reference} email={form.email} onClose={handleClose} />
        ) : (
          <>
            {/* Order summary */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Site</legend>
                <Field
                  label="Company name"
                  value={form.companyName}
                  onChange={(v) => update('companyName', v)}
                />
                <Field
                  label="Installation address"
                  value={form.installationAddress}
                  onChange={(v) => update('installationAddress', v)}
                  placeholder="Street, city, state"
                />
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Contact</legend>
                <div className={styles.fieldRow}>
                  <Field
                    label="First name"
                    value={form.firstName}
                    onChange={(v) => update('firstName', v)}
                  />
                  <Field
                    label="Last name"
                    value={form.lastName}
                    onChange={(v) => update('lastName', v)}
                  />
                </div>
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => update('email', v)}
                />
                <Field
                  label="Phone"
                  value={form.phoneNumber}
                  onChange={(v) => update('phoneNumber', v)}
                  placeholder="(201) 555-0123"
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

              {error && <p className={styles.error}>{error}</p>}

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
                  {isSubmitting ? 'Submitting…' : 'Submit request'}
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

// Subcomponents

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

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
