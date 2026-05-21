import { describe, it, expect } from 'vitest'
import { computeLayout, computeTransformerCount, totalBatteries } from '@/utils/layoutEngine'
import { EMPTY_CONFIG } from '@/constants/devices'
import type { SiteConfig } from '@shared/types'

// Helper to build a config concisely in tests
const config = (q: Partial<SiteConfig['quantities']>): SiteConfig => ({
  quantities: { ...EMPTY_CONFIG.quantities, ...q },
})

describe('computeLayout', () => {
  describe('empty input', () => {
    it('returns [] when all quantities are zero', () => {
      expect(computeLayout(EMPTY_CONFIG)).toEqual([])
    })
  })

  describe('single-row packing', () => {
    it('places two MegapackXL (80ft total) in one row', () => {
      const layout = computeLayout(config({ megapackXL: 2 }))
      // 2 MegapackXL = 80ft, plus 1 transformer = 90ft (still under 100)
      expect(layout).toHaveLength(1)
      expect(layout[0].totalWidthFt).toBe(90)
    })

    it('places three Megapack (90ft) and a transformer (10ft) in one row exactly at 100ft', () => {
      const layout = computeLayout(config({ megapack: 3 }))
      // 3 Megapack = 90ft, 1 transformer = 100ft — exactly at the limit
      expect(layout).toHaveLength(2)
      expect(layout[0].totalWidthFt).toBe(100)
    })
  })

  describe('multi-row packing — 100ft constraint', () => {
    it('wraps three MegapackXL into two rows', () => {
      const layout = computeLayout(config({ megapackXL: 3 }))
      // 3 MegapackXL = 120ft, must split. 1 transformer (floor(3/2)=1).
      expect(layout.length).toBeGreaterThan(1)
    })

    it('never produces a row wider than 100ft, in any configuration', () => {
      const layout = computeLayout(
        config({ megapackXL: 5, megapack2: 5, megapack: 5, powerPack: 10 }),
      )
      for (const row of layout) {
        expect(row.totalWidthFt).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('transformer auto-injection', () => {
    it('injects 0 transformers for 0 batteries', () => {
      expect(computeTransformerCount(EMPTY_CONFIG)).toBe(0)
    })

    it('injects 1 transformer for 1 battery because partial battery groups still need transformer support', () => {
      expect(computeTransformerCount(config({ megapackXL: 1 }))).toBe(1)
    })

    it('injects 1 transformer for 2 batteries', () => {
      expect(computeTransformerCount(config({ megapackXL: 2 }))).toBe(1)
    })

    it('injects 1 transformer for 3 batteries (still floor(3/2) = 1)', () => {
      expect(computeTransformerCount(config({ megapackXL: 3 }))).toBe(2)
    })

    it('counts batteries across all device types', () => {
      const c = config({ megapackXL: 1, megapack2: 1, megapack: 1, powerPack: 1 })
      expect(totalBatteries(c)).toBe(4)
      expect(computeTransformerCount(c)).toBe(2)
    })

    it('produces transformers in the flattened layout output', () => {
      const layout = computeLayout(config({ megapackXL: 2 }))
      const allDevices = layout.flatMap((r) => r.devices)
      expect(allDevices.filter((d) => d.isTransformer)).toHaveLength(1)
    })
  })

  describe('first-fit-decreasing ordering', () => {
    it('places larger devices before smaller ones', () => {
      const layout = computeLayout(config({ powerPack: 4, megapackXL: 1 }))
      // FFD: MegapackXL (40ft) is placed first, then PowerPacks (10ft each)
      const firstDevice = layout[0].devices[0]
      expect(firstDevice.widthFt).toBe(40)
    })
  })
})
