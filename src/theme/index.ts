// src/theme/index.ts
export const COLORS = {
  primary:      '#534AB7',
  primaryDark:  '#3C3489',
  primaryLight: '#EEEDFE',
  primaryMid:   '#7F77DD',
  white:        '#FFFFFF',
  gray50:       '#F4F3FB',
  gray100:      '#F1EFF8',
  gray200:      '#E0DFF0',
  gray400:      '#888780',
  gray600:      '#5F5E5A',
  gray800:      '#1A1A1A',
  red:          '#E24B4A',
  redLight:     '#FCEBEB',
  amber:        '#BA7517',
  amberLight:   '#FAEEDA',
  green:        '#3B6D11',
  greenLight:   '#EAF3DE',
  blue:         '#185FA5',
  blueLight:    '#E6F1FB',
  border:       '#E8E8E4',
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
};

export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999,
};

export const FONT = {
  regular:  '400' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  black:    '800' as const,
};

export const SHADOW = {
  card: {
    shadowColor: '#534AB7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  strong: {
    shadowColor: '#534AB7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};
