export const QUANTITY_MIN = 0

// This is the max total user-selected battery devices across all battery types.
// Auto-derived transformers do not count toward this limit.
export const TOTAL_BATTERY_QUANTITY_MAX = 1000

export const FIELD_LIMITS = {
  companyNameMin: 2,
  companyNameMax: 120,

  installationAddressMin: 5,
  installationAddressMax: 240,

  firstNameMin: 3,
  firstNameMax: 80,

  lastNameMin: 2,
  lastNameMax: 80,

  emailMax: 160,

  phoneDigits: 10,
} as const
