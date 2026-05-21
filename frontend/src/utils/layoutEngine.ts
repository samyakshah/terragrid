// import type { SiteConfig, LayoutRow, DevicePlacement, DeviceType } from '@shared/types'
// import { DEVICES, TRANSFORMER, TRANSFORMER_RATIO, MAX_SITE_WIDTH_FT, DEVICE_KEYS } from '@/constants/devices'

// /**
//  * Computes a site floor plan from a SiteConfig.
//  *
//  * Algorithm: First-Fit Decreasing (FFD) bin-packing.
//  *   1. Expand quantities into a flat list of placements.
//  *   2. Auto-inject transformers: ceil(totalBatteries / TRANSFORMER_RATIO).
//  *   3. Sort by width descending — largest devices placed first so they
//  *      don't get pushed to new rows by small devices filling early gaps.
//  *   4. Pack left-to-right into rows of width <= MAX_SITE_WIDTH_FT.
//  *
//  * FFD isn't optimal (bin-packing is NP-hard) but it's deterministic, runs
//  * in O(n log n), and produces visually clean layouts for our small input
//  * sizes (typically <50 devices).
//  *
//  * Pure function: same input always yields the same output. No side effects.
//  */
// export function computeLayout(config: SiteConfig): LayoutRow[] {
//   const devices = expandDevices(config)
//   if (devices.length === 0) return []

//   devices.sort((a, b) => b.widthFt - a.widthFt)

//   return packRows(devices)
// }

// /** Flatten { megapackXL: 2, ... } into a list of placements + injected transformers. */
// function expandDevices(config: SiteConfig): DevicePlacement[] {
//   const placements: DevicePlacement[] = []

//   for (const type of DEVICE_KEYS) {
//     const spec = DEVICES[type]
//     for (let i = 0; i < config.quantities[type]; i++) {
//       placements.push({
//         type,
//         widthFt: spec.widthFt,
//         depthFt: spec.depthFt,
//         isTransformer: false,
//       })
//     }
//   }

//   const transformerCount = computeTransformerCount(config)
//   for (let i = 0; i < transformerCount; i++) {
//     placements.push({
//       type: 'transformer',
//       widthFt: TRANSFORMER.widthFt,
//       depthFt: TRANSFORMER.depthFt,
//       isTransformer: true,
//     })
//   }

//   return placements
// }

// /** Greedy row packer. Closes the current row when the next device would overflow. */
// function packRows(devices: DevicePlacement[]): LayoutRow[] {
//   const rows: LayoutRow[] = []
//   let current: DevicePlacement[] = []
//   let currentWidth = 0

//   for (const device of devices) {
//     const wouldOverflow = currentWidth + device.widthFt > MAX_SITE_WIDTH_FT
//     if (wouldOverflow && current.length > 0) {
//       rows.push({ devices: current, totalWidthFt: currentWidth })
//       current = [device]
//       currentWidth = device.widthFt
//     } else {
//       current.push(device)
//       currentWidth += device.widthFt
//     }
//   }

//   if (current.length > 0) {
//     rows.push({ devices: current, totalWidthFt: currentWidth })
//   }

//   return rows
// }

// /**
//  * Number of transformers required for a config.
//  * Exposed separately so the calculator and UI can read it without recomputing the layout.
//  */
// export function computeTransformerCount(config: SiteConfig): number {
//   const total = totalBatteries(config)
//   return Math.ceil(total / TRANSFORMER_RATIO)
// }

// /** Sum of all battery quantities (excludes transformers, which are derived). */
// export function totalBatteries(config: SiteConfig): number {
//   return DEVICE_KEYS.reduce((sum, key) => sum + config.quantities[key], 0)
// }

import type { SiteConfig, LayoutRow, DevicePlacement } from '@shared/types'
import {
  DEVICES,
  TRANSFORMER,
  TRANSFORMER_RATIO,
  MAX_SITE_WIDTH_FT,
  DEVICE_KEYS,
} from '@/constants/devices'

/**
 * Smallest physical unit used by all supported devices.
 *
 * All current devices are multiples of 10ft:
 * - MegapackXL: 40ft
 * - Megapack2: 30ft
 * - Megapack: 30ft
 * - PowerPack: 10ft
 * - Transformer: 10ft
 *
 * This lets us bucket rows by remaining capacity instead of scanning every row.
 */
const WIDTH_UNIT_FT = 10

/**
 * Row capacity expressed in 10ft units.
 *
 * 100ft / 10ft = 10 units.
 */
const MAX_ROW_CAPACITY_UNITS = MAX_SITE_WIDTH_FT / WIDTH_UNIT_FT

/**
 * Computes a site floor plan from a SiteConfig.
 *
 * Algorithm: Bucketed Best-Fit Decreasing.
 *
 * Steps:
 *   1. Expand configured quantities into a flat list of physical device placements.
 *   2. Auto-inject transformers using ceil(totalBatteries / TRANSFORMER_RATIO).
 *   3. Sort placements by width descending so larger devices are placed first.
 *   4. Keep rows bucketed by remaining capacity.
 *   5. For each device, place it into the row with the smallest remaining capacity
 *      that can still fit the device.
 *   6. If no row can fit the device, create a new row.
 *
 * Why bucketed best-fit:
 *   A normal best-fit implementation scans all existing rows for every device,
 *   which makes packing O(n²) in the worst case.
 *
 *   Here, row capacity is fixed at 100ft and all device widths are multiples of 10ft.
 *   So there are only 11 possible remaining capacity buckets:
 *   0, 10, 20, 30, ..., 100.
 *
 *   That allows row lookup in constant time, making the packing step O(n).
 *
 * Complexity:
 *   Expanding devices: O(n)
 *   Sorting devices:   O(n log n)
 *   Packing devices:   O(n), because bucket lookup is bounded by 11 capacity buckets
 *
 *   Total: O(n log n)
 *   Space: O(n)
 *
 * Note:
 *   This is still a heuristic, not a globally optimal bin-packing solver.
 *   Bin packing is generally NP-hard. This is the right practical balance for this UI:
 *   compact, deterministic, fast, and easy to explain.
 */
export function computeLayout(config: SiteConfig): LayoutRow[] {
  const devices = expandDevices(config)
  if (devices.length === 0) return []

  const sortedDevices = [...devices].sort(comparePlacementsForPacking)

  return packRowsBucketedBestFit(sortedDevices)
}

/**
 * Sort larger devices first.
 *
 * Tie-breakers are intentionally deterministic so the visual layout does not
 * randomly change between renders.
 */
function comparePlacementsForPacking(a: DevicePlacement, b: DevicePlacement): number {
  if (b.widthFt !== a.widthFt) return b.widthFt - a.widthFt

  // Prefer real batteries before transformers when widths are equal.
  // This keeps the visual layout more intuitive.
  if (a.isTransformer !== b.isTransformer) {
    return a.isTransformer ? 1 : -1
  }

  // Stable deterministic ordering by type name.
  return a.type.localeCompare(b.type)
}

/**
 * Flatten the selected battery quantities into physical placements and add
 * automatically required transformers.
 */
function expandDevices(config: SiteConfig): DevicePlacement[] {
  const placements: DevicePlacement[] = []

  for (const type of DEVICE_KEYS) {
    const spec = DEVICES[type]

    for (let i = 0; i < config.quantities[type]; i++) {
      placements.push({
        type,
        widthFt: spec.widthFt,
        depthFt: spec.depthFt,
        isTransformer: false,
      })
    }
  }

  const transformerCount = computeTransformerCount(config)

  for (let i = 0; i < transformerCount; i++) {
    placements.push({
      type: 'transformer',
      widthFt: TRANSFORMER.widthFt,
      depthFt: TRANSFORMER.depthFt,
      isTransformer: true,
    })
  }

  return placements
}

// ------------------------ Codex Algo -------------------------------------------------

/**
 * Bucketed Best-Fit row packer.
 *
 * Instead of scanning every row to find the best fit, we store row indexes by
 * their remaining capacity.
 *
 * Example:
 *   Row A has 80ft used, so it has 20ft remaining.
 *   Row A index is stored in bucket 2 because 20ft / 10ft = 2.
 *
 * For a 10ft transformer:
 *   device units = 1.
 *   We check bucket 1, then 2, then 3, ... up to 10.
 *   The first non-empty bucket is the best fit because it leaves the least
 *   remaining capacity after placement.
 */
// function packRowsBucketedBestFit(devices: DevicePlacement[]): LayoutRow[] {
//   const rows: LayoutRow[] = []

//   /**
//    * buckets[remainingUnits] stores indexes of rows that currently have that
//    * much remaining capacity.
//    *
//    * Example:
//    *   buckets[2] contains rows with 20ft remaining.
//    */
//   const buckets: number[][] = Array.from({ length: MAX_ROW_CAPACITY_UNITS + 1 }, () => [])

//   for (const device of devices) {
//     const deviceUnits = toWidthUnits(device.widthFt)
//     const bestRemainingUnits = findSmallestFittingBucket(buckets, deviceUnits)

//     if (bestRemainingUnits === -1) {
//       const newRowIndex = rows.length
//       const newTotalWidthFt = device.widthFt
//       const remainingUnits = MAX_ROW_CAPACITY_UNITS - deviceUnits

//       rows.push({
//         devices: [device],
//         totalWidthFt: newTotalWidthFt,
//       })

//       buckets[remainingUnits].push(newRowIndex)
//       continue
//     }

//     /**
//      * Pull any row from the best fitting bucket.
//      *
//      * pop() is O(1).
//      * We do not need FIFO ordering here because all rows in the same bucket
//      * have equivalent remaining capacity.
//      */
//     const rowIndex = buckets[bestRemainingUnits].pop()

//     if (rowIndex === undefined) {
//       throw new Error('Layout bucket invariant violated: expected a row index.')
//     }

//     const row = rows[rowIndex]
//     const updatedTotalWidthFt = row.totalWidthFt + device.widthFt
//     const updatedRemainingUnits = MAX_ROW_CAPACITY_UNITS - toWidthUnits(updatedTotalWidthFt)

//     rows[rowIndex] = {
//       devices: [...row.devices, device],
//       totalWidthFt: updatedTotalWidthFt,
//     }

//     buckets[updatedRemainingUnits].push(rowIndex)
//   }

//   return rows
// }

// /**
//  * Finds the smallest remaining-capacity bucket that can fit the device.
//  *
//  * Since there are only 11 buckets, this is effectively O(1).
//  */
// function findSmallestFittingBucket(buckets: number[][], deviceUnits: number): number {
//   for (let remainingUnits = deviceUnits; remainingUnits <= MAX_ROW_CAPACITY_UNITS; remainingUnits++) {
//     if (buckets[remainingUnits].length > 0) {
//       return remainingUnits
//     }
//   }

//   return -1
// }

// /**
//  * Converts feet to 10ft units.
//  *
//  * We intentionally validate divisibility because the bucketed algorithm depends
//  * on every supported device width being a multiple of WIDTH_UNIT_FT.
//  */
// function toWidthUnits(widthFt: number): number {
//   if (widthFt % WIDTH_UNIT_FT !== 0) {
//     throw new Error(`Unsupported device width: ${widthFt}ft. Width must be divisible by ${WIDTH_UNIT_FT}ft.`)
//   }

//   return widthFt / WIDTH_UNIT_FT
// }

// /**
//  * Number of transformers required for a config.
//  *
//  * We use ceil because a partial group still requires transformer support.
//  * Example:
//  *   1 battery   -> 1 transformer
//  *   2 batteries -> 1 transformer
//  *   3 batteries -> 2 transformers
//  */
// export function computeTransformerCount(config: SiteConfig): number {
//   const total = totalBatteries(config)
//   return Math.ceil(total / TRANSFORMER_RATIO)
// }

// /**
//  * Sum of all battery quantities.
//  *
//  * Transformers are derived separately and should not be user-editable.
//  */
// export function totalBatteries(config: SiteConfig): number {
//   return DEVICE_KEYS.reduce((sum, key) => sum + config.quantities[key], 0)
// }

// ------------------------ Updated Claude Alog --------------------------------
function packRowsBucketedBestFit(devices: DevicePlacement[]): LayoutRow[] {
  const rows: LayoutRow[] = []

  for (const device of devices) {
    // Find the row with least remaining space that still fits this device
    let bestRow = -1
    let bestRemaining = Infinity
    for (let i = 0; i < rows.length; i++) {
      const remaining = MAX_SITE_WIDTH_FT - rows[i].totalWidthFt
      if (remaining >= device.widthFt && remaining < bestRemaining) {
        bestRow = i
        bestRemaining = remaining
      }
    }

    if (bestRow === -1) {
      rows.push({ devices: [device], totalWidthFt: device.widthFt })
    } else {
      rows[bestRow] = {
        devices: [...rows[bestRow].devices, device],
        totalWidthFt: rows[bestRow].totalWidthFt + device.widthFt,
      }
    }
  }

  return rows
}

/**
 * Number of transformers required for a config.
 *
 * We use ceil because a partial group still requires transformer support.
 * Example:
 *   1 battery   -> 1 transformer
 *   2 batteries -> 1 transformer
 *   3 batteries -> 2 transformers
 */
export function computeTransformerCount(config: SiteConfig): number {
  const total = totalBatteries(config)
  return Math.ceil(total / TRANSFORMER_RATIO)
}

/**
 * Sum of all battery quantities.
 *
 * Transformers are derived separately and should not be user-editable.
 */
export function totalBatteries(config: SiteConfig): number {
  return DEVICE_KEYS.reduce((sum, key) => sum + config.quantities[key], 0)
}
