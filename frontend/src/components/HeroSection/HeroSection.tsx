import styles from './HeroSection.module.css'

interface HeroSectionProps {
  onConfigureClick: () => void | Promise<void>
  onLoadClick: () => void
}

const HERO_VIDEO_SRC = '/media/megapack-hero.mp4'
const HERO_POSTER_SRC = '/media/megapack-hero-poster.jpg'

/**
 * Full-width product hero.
 *
 * This intentionally avoids showing operational metrics. The hero's job is to
 * create a polished product entry point. Metrics belong in the planner section
 * where the user's configuration drives them.
 */
export function HeroSection({ onConfigureClick, onLoadClick }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <video
        className={styles.video}
        src={HERO_VIDEO_SRC}
        poster={HERO_POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.eyebrow}>Industrial Energy Site Planner</p>

        <h1 id="hero-title" className={styles.title}>
          TerraGrid
        </h1>

        <p className={styles.subtitle}>Large-scale battery site planning</p>

        <div className={styles.actions}>
          <button className={styles.primaryAction} type="button" onClick={onConfigureClick}>
            Configure Site
          </button>

          <button className={styles.secondaryAction} type="button" onClick={onLoadClick}>
            Load Session
          </button>
        </div>
      </div>
    </section>
  )
}
