export const C = {
  // Backgrounds
  bg:           '#05050F',
  bgCard:       '#0C0C1E',
  surface:      '#12122A',
  surfaceHigh:  '#1A1A35',

  // Purple
  purple:       '#8B5CF6',
  purpleDark:   '#6D28D9',
  purpleGlow:   'rgba(139,92,246,0.35)',
  purpleSoft:   'rgba(139,92,246,0.12)',

  // Cyan
  cyan:         '#06B6D4',
  cyanDark:     '#0891B2',
  cyanGlow:     'rgba(6,182,212,0.35)',
  cyanSoft:     'rgba(6,182,212,0.12)',

  // Rose
  rose:         '#F43F5E',
  roseDark:     '#BE123C',
  roseGlow:     'rgba(244,63,94,0.35)',
  roseSoft:     'rgba(244,63,94,0.12)',

  // Amber
  amber:        '#F59E0B',
  amberDark:    '#D97706',
  amberGlow:    'rgba(245,158,11,0.35)',
  amberSoft:    'rgba(245,158,11,0.12)',

  // Emerald
  emerald:      '#10B981',
  emeraldDark:  '#059669',
  emeraldGlow:  'rgba(16,185,129,0.35)',
  emeraldSoft:  'rgba(16,185,129,0.12)',

  // Text
  text:         '#F1F5F9',
  textSec:      'rgba(241,245,249,0.65)',
  textMuted:    'rgba(241,245,249,0.38)',
  textHint:     'rgba(241,245,249,0.22)',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  borderMed:    'rgba(255,255,255,0.12)',
  borderHigh:   'rgba(255,255,255,0.20)',
} as const;

// Backwards compatibility alias
export const Colors = C;

export type ColorKey = keyof typeof C;
