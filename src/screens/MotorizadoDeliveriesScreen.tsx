// src/screens/MotorizadoDeliveriesScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Truck, PackageSearch, PackageCheck } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

const GREEN = COLORS.green;

// ══════════════════════════════════════════════════════════════════
//  PARTE 1 — solo la estructura visual (3 tabs) con estados vacíos
//  honestos. La lista real de pedidos (Disponibles / Activas /
//  Completadas) llega en la Parte 2, cuando exista la relación
//  orders.motorizado_id en la BD. No se muestran datos inventados.
// ══════════════════════════════════════════════════════════════════

const TABS = [
  { key: 'disponibles', label: 'Disponibles' },
  { key: 'activas',     label: 'Activas' },
  { key: 'completadas', label: 'Completadas' },
] as const;

type TabKey = typeof TABS[number]['key'];

const EMPTY_META: Record<TabKey, { icon: any; title: string; sub: string }> = {
  disponibles: {
    icon: PackageSearch,
    title: 'Sin pedidos disponibles',
    sub: 'La asignación de pedidos estará disponible muy pronto. Ponte en línea desde Inicio para no perderte ninguno.',
  },
  activas: {
    icon: Truck,
    title: 'Sin entregas activas',
    sub: 'Cuando aceptes un pedido, aparecerá aquí para que puedas confirmarlo al entregarlo.',
  },
  completadas: {
    icon: PackageCheck,
    title: 'Sin entregas completadas',
    sub: 'Tu historial de entregas aparecerá aquí con la calificación y ganancia de cada una.',
  },
};

export default function MotorizadoDeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('disponibles');

  const empty = EMPTY_META[activeTab];
  const EmptyIcon = empty.icon;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Entregas</Text>
      </View>

      {/* ── TABS ── */}
      <View style={s.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, activeTab === t.key && s.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.85}>
            <Text style={[s.tabTxt, activeTab === t.key && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
        {/* TODO Parte 2: reemplazar por la lista real —
            disponibles: orders status='shipped' AND motorizado_id IS NULL
            activas:     orders motorizado_id = mío AND status='shipped'
            completadas: orders motorizado_id = mío AND status='delivered' */}
        <View style={s.empty}>
          <View style={s.emptyIconWrap}>
            <EmptyIcon size={36} color={COLORS.gray600} strokeWidth={1.5} />
          </View>
          <Text style={s.emptyTitle}>{empty.title}</Text>
          <Text style={s.emptySub}>{empty.sub}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle:  { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },

  tabsRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.lg },
  tabBtn:       { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft },
  tabBtnActive: { backgroundColor: GREEN },
  tabTxt:       { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray400 },
  tabTxtActive: { color: COLORS.white, fontWeight: FONT.black },

  empty:         { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginBottom: 8, textAlign: 'center' },
  emptySub:      { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 19 },
});