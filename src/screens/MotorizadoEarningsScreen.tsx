// src/screens/MotorizadoEarningsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DollarSign } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

const GREEN = COLORS.green;

// ══════════════════════════════════════════════════════════════════
//  PARTE 1 — placeholder honesto. Las ganancias reales (semanal,
//  gráfico diario, solicitar retiro) llegan en la Parte 3, cuando
//  exista orders.motorizado_id y se puedan sumar los delivery_cost
//  de las entregas completadas por este transportista. No se
//  muestran montos inventados mientras tanto.
// ══════════════════════════════════════════════════════════════════

export default function MotorizadoEarningsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Ganancias</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <DollarSign size={30} color={GREEN} strokeWidth={2} />
          </View>
          <Text style={s.cardTitle}>Muy pronto</Text>
          <Text style={s.cardSub}>
            Aquí verás tus ganancias por semana, el detalle diario y podrás
            solicitar tu retiro. Se activará junto con el sistema de entregas.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.black },
  header:      { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },

  card:      { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginTop: SPACING.lg },
  iconWrap:  { width: 64, height: 64, borderRadius: RADIUS.full, backgroundColor: GREEN + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  cardTitle: { fontSize: 17, fontWeight: FONT.black, color: COLORS.white, marginBottom: 8 },
  cardSub:   { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },
});