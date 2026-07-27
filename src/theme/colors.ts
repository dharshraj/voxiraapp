/**
 * Voxira color tokens
 *
 * Light mode — warm cream / off-white professional palette
 *   Background: soft cream #FAF9F7
 *   Surface:    white #FFFFFF
 *   Text:       deep charcoal #1C1917
 *   Accent:     muted warm brown/amber — used sparingly
 *   No bright purple or vivid blue anywhere in light mode
 *
 * Dark mode — unchanged (existing dark theme)
 */

export const lightColors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:             '#FAF9F7',   // warm cream
  surface:        '#FFFFFF',   // pure white cards
  surfaceAlt:     '#F5F3F0',   // slightly warmer surface for nested cards
  border:         '#E8E4DF',   // warm light divider
  divider:        '#EDE9E4',   // even subtler divider

  // ── Text ─────────────────────────────────────────────────────────────────
  text:           '#1C1917',   // near-black charcoal
  textSec:        '#57534E',   // warm medium grey
  textMuted:      '#A8A29E',   // muted warm grey
  textInverse:    '#FFFFFF',

  // ── Accent (warm amber-brown — replaces vivid purple/blue) ────────────────
  primary:        '#92400E',   // deep amber-brown
  primaryPressed: '#78350F',   // darker on press
  primaryLight:   '#FEF3C7',   // very light amber tint for card backgrounds

  // ── Semantic ─────────────────────────────────────────────────────────────
  success:        '#15803D',   // forest green
  warning:        '#B45309',   // amber
  error:          '#B91C1C',   // dark red
  info:           '#0F5132',   // deep green (used for informational accents)
};

export const darkColors: typeof lightColors = {
  bg:             '#121316',
  surface:        '#1C1E22',
  surfaceAlt:     '#222428',
  border:         '#2C2F35',
  divider:        '#2A2C31',
  text:           '#F5F6F7',
  textSec:        '#A1A5AC',
  textMuted:      '#6B6F76',
  textInverse:    '#121316',
  primary:        '#D97706',   // warm amber in dark mode
  primaryPressed: '#B45309',
  primaryLight:   '#1C1508',
  success:        '#22C55E',
  warning:        '#F59E0B',
  error:          '#EF4444',
  info:           '#3B82F6',
};

export type AppColors = typeof lightColors;

// Legacy alias — some screens reference this directly
export const C = darkColors;
export const Colors = darkColors;
