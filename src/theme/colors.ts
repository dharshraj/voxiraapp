export const lightColors = {
  bg:            '#F7F8FA',
  surface:       '#FFFFFF',
  border:        '#E5E7EB',
  divider:       '#EDEEF1',
  text:          '#1A1D23',
  textSec:       '#6B7280',
  textMuted:     '#9CA3AF',
  primary:       '#4F6EF7',
  primaryPressed:'#3D57D6',
  primaryLight:  '#E8ECFF',
  success:       '#22C55E',
  warning:       '#F59E0B',
  error:         '#EF4444',
  info:          '#3B82F6',
};

export const darkColors: typeof lightColors = {
  bg:            '#121316',
  surface:       '#1C1E22',
  border:        '#2C2F35',
  divider:       '#2A2C31',
  text:          '#F5F6F7',
  textSec:       '#A1A5AC',
  textMuted:     '#6B6F76',
  primary:       '#4F6EF7',
  primaryPressed:'#3D57D6',
  primaryLight:  '#1E2554',
  success:       '#22C55E',
  warning:       '#F59E0B',
  error:         '#EF4444',
  info:          '#3B82F6',
};

export type AppColors = typeof lightColors;
// Legacy alias — some screens may import this
export const C = darkColors;
export const Colors = darkColors;
