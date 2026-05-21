import { describe, it, expect } from 'vitest'
import { calculateSummary } from '@/utils/calculator'
import { computeLayout } from '@/utils/layoutEngine'
import { EMPTY_CONFIG } from '@/constants/devices'
import type { SiteConfig } from '@shared/types'

const config = (q: Partial<SiteConfig['quantities']>): SiteConfig => ({
  quantities: { ...EMPTY_CONFIG.quantities, ...q },
})

// Helper: run both engine and calculator together (the realistic flow)
const summarise = (c: SiteConfig) => calculateSummary(c, computeLayout(c))

describe('calculateSummary', () => {
  describe('empty config', () => {
    it('returns zero for all metrics', () => {
      const s = summarise(EMPTY_CONFIG)
      expect(s).toEqual({
        totalBudget: 0,
        transformerCount: 0,
        siteWidthFt: 0,
        siteDepthFt: 0,
        netEnergyMWh: 0,
        energyDensityKwhPerSqFt: 0,
      })
    })
  })

  describe('budget', () => {
    it('sums cost across all device types', () => {
      const s = summarise(config({ megapackXL: 1, megapack2: 1, megapack: 1, powerPack: 1 }))
      // 120k + 80k + 50k + 10k = 260k, plus 2 transformers (floor(4/2)) = 20k → 280k
      expect(s.totalBudget).toBe(280_000)
    })

    it('includes transformer cost in budget', () => {
      const s = summarise(config({ megapackXL: 2 }))
      // 2 * 120k + 1 transformer (10k) = 250k
      expect(s.totalBudget).toBe(250_000)
    })
  })

  describe('net energy', () => {
    it('subtracts transformer energy losses', () => {
      const s = summarise(config({ megapackXL: 2 }))
      // 2 * 4 MWh = 8, minus 1 transformer * 0.5 = 7.5
      expect(s.netEnergyMWh).toBe(7.5)
    })

    it('handles fractional results without floating-point garbage', () => {
      // Float math hazard: 3 * 0.1 in JS = 0.30000000000000004
      // The calculator rounds to 1 decimal place to keep displays clean.
      const s = summarise(config({ megapackXL: 1, megapack: 1 }))
      // 4 + 2 = 6 MWh, 1 transformer = -0.5 → 5.5
      expect(s.netEnergyMWh).toBe(5.5)
    })
  })

  describe('site dimensions', () => {
    it('reports width as the widest packed row', () => {
      const s = summarise(config({ megapackXL: 2 }))
      // 2 MegapackXL + 1 transformer = 90ft single row
      expect(s.siteWidthFt).toBe(90)
    })

    it('reports depth as rows * 10ft', () => {
      const s = summarise(config({ megapackXL: 3 }))
      // 3 MegapackXL = 120ft must wrap. With 1 transformer, layout spans 2 rows.
      expect(s.siteDepthFt).toBe(20)
    })
  })
})
