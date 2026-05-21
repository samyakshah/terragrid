import styles from './FormFields.module.css'

interface TextFieldProps {
  label: string
  value: string
  error?: string
  type?: 'text' | 'email' | 'tel'
  placeholder?: string
  maxLength?: number
  onChange: (value: string) => void
  onBlur?: () => void
}

export function TextField({
  label,
  value,
  error,
  type = 'text',
  placeholder,
  maxLength,
  onChange,
  onBlur,
}: TextFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className={styles.errorSlot} aria-live="polite">
        {error && <small className={styles.error}>{error}</small>}
      </div>
    </label>
  )
}

interface TextAreaFieldProps {
  label: string
  value: string
  error?: string
  placeholder?: string
  maxLength?: number
  rows?: number
  onChange: (value: string) => void
  onBlur?: () => void
}

export function TextAreaField({
  label,
  value,
  error,
  placeholder,
  maxLength,
  rows = 5,
  onChange,
  onBlur,
}: TextAreaFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <textarea
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={Boolean(error)}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className={styles.errorSlot} aria-live="polite">
        {error && <small className={styles.error}>{error}</small>}
      </div>
    </label>
  )
}

interface ImageUploadFieldProps {
  label: string
  error?: string
  previewUrl: string | null
  onChange: (file: File | null) => void
}

export function ImageUploadField({ label, error, previewUrl, onChange }: ImageUploadFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />

      {previewUrl && (
        <img className={styles.preview} src={previewUrl} alt="Selected support attachment" />
      )}

      <div className={styles.errorSlot} aria-live="polite">
        {error && <small className={styles.error}>{error}</small>}
      </div>
    </label>
  )
}
