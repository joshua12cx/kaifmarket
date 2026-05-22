// src/components/UI.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT, SHADOW } from '../theme';
import { Notification } from '../data';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  hot:     { bg: COLORS.red,         text: '#fff' },
  new:     { bg: COLORS.primary,     text: '#fff' },
  sale:    { bg: COLORS.amber,       text: COLORS.amberLight },
  premium: { bg: COLORS.primaryDark, text: '#fff' },
  plus:    { bg: COLORS.primary,     text: '#fff' },
  success: { bg: COLORS.green,       text: '#fff' },
  info:    { bg: COLORS.blue,        text: '#fff' },
  primary: { bg: COLORS.primary,     text: '#fff' },
};

export function Badge({ label, type = 'primary', style }: { label: string; type?: string; style?: ViewStyle }) {
  const c = TAG_COLORS[type] || TAG_COLORS.primary;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function StarRow({ rating, reviews, style }: { rating: number; reviews: number; style?: ViewStyle }) {
  const full  = Math.floor(rating);
  const empty = 5 - full;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 3 }, style]}>
      <Text style={styles.stars}>{'★'.repeat(full)}{'☆'.repeat(empty)}</Text>
      <Text style={styles.ratingNum}>{rating} ({reviews})</Text>
    </View>
  );
}

export function AddButton({ added, onPress, size = 32 }: { added: boolean; onPress: () => void; size?: number }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.addBtn,
        { width: size, height: size, borderRadius: size / 4 },
        added && { backgroundColor: COLORS.green },
      ]}>
      <Text style={styles.addBtnText}>{added ? '✓' : '+'}</Text>
    </TouchableOpacity>
  );
}

export function SectionHeader({ title, linkLabel, onLink }: { title: string; linkLabel?: string; onLink?: () => void }) {
  return (
    <View style={styles.secHdr}>
      <Text style={styles.secTitle}>{title}</Text>
      {linkLabel
        ? <TouchableOpacity onPress={onLink}><Text style={styles.secLink}>{linkLabel}</Text></TouchableOpacity>
        : null}
    </View>
  );
}

export function EmptyState({ emoji, title, subtitle, action, actionLabel }: {
  emoji: string; title: string; subtitle?: string; action?: () => void; actionLabel?: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {action
        ? <TouchableOpacity style={styles.emptyBtn} onPress={action}>
            <Text style={styles.emptyBtnText}>{actionLabel}</Text>
          </TouchableOpacity>
        : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, style, loading = false, disabled = false }: {
  label: string; onPress: () => void; style?: ViewStyle; loading?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, style, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}>
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.primaryBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function KaifPlusCard({ onSubscribe, isPlus }: { onSubscribe: () => void; isPlus: boolean }) {
  const PERKS = [
    { ic: '💰', txt: '2% cashback en cada compra' },
    { ic: '📦', txt: 'Envío prioritario garantizado' },
    { ic: '💳', txt: 'Cuotas sin interés' },
    { ic: '🎯', txt: 'Ofertas exclusivas Plus' },
  ];
  return (
    <View style={styles.plusCard}>
      <View style={styles.plusHeader}>
        <Text style={styles.plusTitle}>✦ Kaif Plus</Text>
        <Text style={styles.plusPrice}>S/ 19.90 / mes</Text>
      </View>
      <Text style={styles.plusSub}>
        {isPlus ? '¡Ya eres Plus! Disfrutas todos los beneficios.' : 'Activa tu membresía y empieza a ahorrar hoy.'}
      </Text>
      <View style={styles.perksGrid}>
        {PERKS.map(p => (
          <View key={p.ic} style={styles.perk}>
            <Text style={{ fontSize: 18 }}>{p.ic}</Text>
            <Text style={styles.perkTxt}>{p.txt}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.subBtn, isPlus && { backgroundColor: COLORS.greenLight }]}
        onPress={onSubscribe}
        activeOpacity={0.85}>
        <Text style={[styles.subBtnText, isPlus && { color: COLORS.green }]}>
          {isPlus ? '✓ Suscripción activa' : 'Suscribirme ahora  →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Notificación con imagen a la DERECHA
const TYPE_ICONS: Record<string, string> = {
  order_update: '🛍️', delivery: '📦', promo: '🏷️',
  review: '⭐', cashback: '💰', plus: '✦',
};

export function NotificationItem({ notif, onPress }: { notif: Notification; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.notifRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.notifIcon}>
        <Text style={{ fontSize: 20 }}>{TYPE_ICONS[notif.type] || '🔔'}</Text>
      </View>
      <View style={styles.notifText}>
        <Text style={styles.notifTitle} numberOfLines={2}>{notif.title}</Text>
        <Text style={styles.notifBody}  numberOfLines={1}>{notif.body}</Text>
        <View style={styles.notifMeta}>
          <Text style={styles.notifTime}>{notif.time}</Text>
          {!notif.read && <View style={styles.unreadDot} />}
        </View>
      </View>
      {/* IMAGEN A LA DERECHA */}
      <View style={[styles.notifThumb, { backgroundColor: notif.imageBg || COLORS.primaryLight }]}>
        <Text style={{ fontSize: 26 }}>{notif.imageEmoji}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge:          { paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.full },
  badgeText:      { fontSize: 9, fontWeight: FONT.black, letterSpacing: 0.3 },
  stars:          { color: '#EF9F27', fontSize: 11 },
  ratingNum:      { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.semibold },
  addBtn:         { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText:     { color: '#fff', fontSize: 20, fontWeight: FONT.bold, lineHeight: 22 },
  secHdr:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  secTitle:       { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  secLink:        { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  empty:          { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyEmoji:     { fontSize: 52, marginBottom: 12 },
  emptyTitle:     { fontSize: 16, fontWeight: FONT.bold, color: COLORS.gray600, textAlign: 'center' },
  emptySub:       { fontSize: 13, color: COLORS.gray400, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyBtn:       { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:   { color: '#fff', fontWeight: FONT.bold, fontSize: 14 },
  primaryBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', ...SHADOW.strong },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: FONT.black, letterSpacing: 0.3 },
  divider:        { height: 0.5, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  plusCard:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg },
  plusHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  plusTitle:      { fontSize: 16, fontWeight: FONT.black, color: '#fff' },
  plusPrice:      { fontSize: 13, fontWeight: FONT.bold, color: 'rgba(255,255,255,0.75)' },
  plusSub:        { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: FONT.semibold, marginBottom: SPACING.md, lineHeight: 17 },
  perksGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  perk:           { width: '47%', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, padding: SPACING.sm, gap: 4 },
  perkTxt:        { fontSize: 11, color: '#fff', fontWeight: FONT.bold, lineHeight: 15 },
  subBtn:         { backgroundColor: '#fff', borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  subBtnText:     { fontSize: 14, fontWeight: FONT.black, color: COLORS.primary },
  notifRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  notifIcon:      { width: 42, height: 42, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  notifText:      { flex: 1 },
  notifTitle:     { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 2 },
  notifBody:      { fontSize: 12, color: COLORS.gray400, marginBottom: 4 },
  notifMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifTime:      { fontSize: 11, color: COLORS.gray400 },
  unreadDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  notifThumb:     { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
});
