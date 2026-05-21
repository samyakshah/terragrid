import { useEffect, useMemo, useState } from 'react'
import { ImageUploadField, TextAreaField, TextField } from '@/components/FormFields/FormFields'
import { FIELD_LIMITS } from '@/constants/validation'
import { getEmailError, getPhoneError, getTextLengthError } from '@/lib/validation'
import styles from './SupportCard.module.css'
import { MessageSquare } from 'lucide-react'

interface SupportForm {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  message: string
  mediaFile: File | null
}

type SupportErrors = Partial<Record<keyof SupportForm, string>>

const INITIAL_FORM: SupportForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  message: '',
  mediaFile: null,
}

const MESSAGE_MIN = 10
const MESSAGE_MAX = 1000
const IMAGE_MAX_BYTES = 5 * 1024 * 1024

function validateSupportForm(form: SupportForm): SupportErrors {
  const errors: SupportErrors = {}

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

  const messageError = getTextLengthError('Message', form.message, MESSAGE_MIN, MESSAGE_MAX)

  if (firstNameError) errors.firstName = firstNameError
  if (lastNameError) errors.lastName = lastNameError
  if (emailError) errors.email = emailError
  if (phoneError) errors.phoneNumber = phoneError
  if (messageError) errors.message = messageError

  if (form.mediaFile) {
    if (!form.mediaFile.type.startsWith('image/')) {
      errors.mediaFile = 'Attachment must be an image.'
    } else if (form.mediaFile.size > IMAGE_MAX_BYTES) {
      errors.mediaFile = 'Image must be 5MB or smaller.'
    }
  }

  return errors
}

export function SupportCard() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section id="support" className={styles.card} aria-labelledby="support-title">
        <div className={styles.mediaWrap} aria-hidden="true">
          <img className={styles.media} src="/media/megapack-order-hero.jpg" alt="" />
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>Planning support</p>

          <h2 id="support-title">Need help validating your site layout?</h2>

          <p>
            Share your site constraints, planning questions, or a photo of the installation area.
            Our team can help review spacing, device mix, transformer planning, and overall layout
            feasibility before you move forward.
          </p>

          <button type="button" className={styles.askButton} onClick={() => setOpen(true)}>
            <MessageSquare className={styles.askButtonIcon} strokeWidth={2.2} aria-hidden="true" />
            <span>Contact Support</span>
          </button>
        </div>
      </section>

      <SupportDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function SupportDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<SupportForm>(INITIAL_FORM)
  const [errors, setErrors] = useState<SupportErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof SupportForm, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const previewUrl = useMemo(() => {
    if (!form.mediaFile) return null
    return URL.createObjectURL(form.mediaFile)
  }, [form.mediaFile])

  const currentErrors = useMemo(() => validateSupportForm(form), [form])
  const isValid = Object.keys(currentErrors).length === 0

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM)
      setErrors({})
      setTouched({})
      setSubmitted(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const update = <K extends keyof SupportForm>(key: K, value: SupportForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }

      if (submitted) {
        setErrors(validateSupportForm(next))
      }

      return next
    })
  }

  const markTouched = (key: keyof SupportForm) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    setErrors(validateSupportForm(form))
  }

  const getVisibleError = (key: keyof SupportForm) => {
    if (!submitted && !touched[key]) return undefined
    return errors[key]
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateSupportForm(form)
    setErrors(nextErrors)
    setSubmitted(true)

    if (Object.keys(nextErrors).length > 0) return
  }

  if (!open) return null

  const isSuccess = submitted && isValid

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <div>
            <p className={styles.eyebrow}>Support request</p>
            <h2 id="support-drawer-title">
              {isSuccess ? 'Support request received' : 'Contact planning support'}
            </h2>
          </div>

          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {isSuccess ? (
          <div className={styles.success}>
            <div className={styles.successIcon} aria-hidden="true">
              ✓
            </div>

            <h3>Thanks, {form.firstName.trim()}.</h3>

            <p>
              We received your support request and will reach out to{' '}
              <strong>{form.email.trim()}</strong>. If you attached a site photo, our team will use
              it to better understand your layout constraints.
            </p>

            <button type="button" className={styles.button} onClick={onClose}>
              Back to planner
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <p className={styles.drawerIntro}>
              Tell us what you are trying to validate. A site photo is optional, but helpful if
              there are access roads, walls, clearance concerns, or existing equipment nearby.
            </p>

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
              placeholder="2015550123"
              onBlur={() => markTouched('phoneNumber')}
              onChange={(value) => update('phoneNumber', value)}
            />

            <TextAreaField
              label="Message"
              value={form.message}
              error={getVisibleError('message')}
              maxLength={MESSAGE_MAX}
              placeholder="Example: We have a narrow access road on the east side and need help validating transformer placement."
              onBlur={() => markTouched('message')}
              onChange={(value) => update('message', value)}
            />

            <ImageUploadField
              label="Optional site photo"
              previewUrl={previewUrl}
              error={getVisibleError('mediaFile')}
              onChange={(file) => update('mediaFile', file)}
            />

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={onClose}>
                Cancel
              </button>

              <button type="submit" className={styles.button} disabled={!isValid}>
                Submit support request
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  )
}
