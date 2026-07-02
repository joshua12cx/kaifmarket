// src/theme/index.ts
// ═══════════════════════════════════════════════════
//  KAIF MARKET — Tema "Rojo Marca" + base neutra
// ═══════════════════════════════════════════════════

export const COLORS = {
  // ── PRIMARIO — rojo vibrante de marca ─────────────
  primary:      '#D32B2B',  // rojo vibrante (headers, CTAs)
  primaryDark:  '#9A1C1C',  // granate oscuro (acentos fuertes)
  primaryLight: '#FDECEC',  // fondo rojo muy claro (badges suaves)
  primaryMid:   '#E8543F',  // acento secundario (tags, ofertas)

  // ── NEUTROS — base dominante del contenido ────────
  black:        '#18181B',
  blackSoft:    '#27272A',
  gray800:      '#27272A',
  gray600:      '#52525B',
  gray400:      '#A1A1AA',
  gray200:      '#E4E4E7',
  gray100:      '#F4F4F5',
  gray50:       '#FAFAFA',

  // ── BLANCOS ───────────────────────────────────────
  white:        '#FFFFFF',

  // ── ESTADOS ────────────────────────────────────────
  green:        '#15803D',
  greenLight:   '#F0FDF4',
  blue:         '#1D4ED8',
  blueLight:    '#EFF6FF',
  red:          '#D32B2B',  // mismo que primary — descuentos
  redLight:     '#FEF2F2',
  amber:        '#A16207',
  amberLight:   '#FFFBEB',

  // ── BORDES Y SOMBRAS ──────────────────────────────
  border:       '#E4E4E7',
  shadow:       '#000000',

  // ── ACENTO DORADO — badge PLUS, ratings ────────────
  gold:         '#E5A623',
  goldLight:    '#FEF9EC',
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
};

export const RADIUS = {
  sm: 4, md: 8, lg: 10, xl: 14, xxl: 18, full: 999,
};

export const FONT = {
  regular:  '400' as const,
  semibold: '500' as const,
  bold:     '600' as const,
  black:    '700' as const,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
};