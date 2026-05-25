// src/theme/index.ts
// ═══════════════════════════════════════════════════
//  KAIF MARKET — Tema Gallito de las Rocas 🇵🇪
//  Colores: Naranja/Rojo + Negro + Gris
// ═══════════════════════════════════════════════════

export const COLORS = {
  // ── PRIMARIOS — Naranja/Rojo del Gallito ──────────
  primary:      '#E8420A',  // naranja-rojo principal
  primaryDark:  '#B5300A',  // rojo oscuro
  primaryLight: '#FFF0EB',  // naranja muy claro (fondos)
  primaryMid:   '#FF6B35',  // naranja medio

  // ── NEGROS Y GRISES ───────────────────────────────
  black:        '#1A1A1A',  // negro principal (textos)
  blackSoft:    '#2D2D2D',  // negro suave (headers)
  gray800:      '#1A1A1A',  // texto principal
  gray600:      '#4A4A4A',  // texto secundario
  gray400:      '#8A8A8A',  // texto muted
  gray200:      '#D0D0D0',  // bordes
  gray100:      '#F0F0F0',  // fondos de cards
  gray50:       '#F7F7F7',  // fondo de pantallas

  // ── BLANCOS ───────────────────────────────────────
  white:        '#FFFFFF',

  // ── ESTADOS ───────────────────────────────────────
  green:        '#2D7A3A',  // éxito, envío gratis
  greenLight:   '#E8F5EA',  // fondo verde
  blue:         '#1A5FA5',  // info
  blueLight:    '#E6F1FB',  // fondo azul
  red:          '#CC1A1A',  // errores, descuentos
  redLight:     '#FCEAEA',  // fondo rojo
  amber:        '#B5720A',  // advertencias
  amberLight:   '#FDF3E0',  // fondo ámbar

  // ── BORDES Y SOMBRAS ──────────────────────────────
  border:       '#E0E0E0',
  shadow:       '#E8420A',

  // ── ACENTO DORADO (plumas del gallito) ────────────
  gold:         '#FFB830',
  goldLight:    '#FFF8E7',
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
};

export const RADIUS = {
  sm: 6, md: 10, lg: 14, xl: 18, xxl: 24, full: 999,
};

export const FONT = {
  regular:  '400' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  black:    '800' as const,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  strong: {
    shadowColor: '#E8420A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};
