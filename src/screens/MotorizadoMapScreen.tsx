// src/screens/MotorizadoMapScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

const GREEN = COLORS.green;

// ══════════════════════════════════════════════════════════════════
//  PARTE 1 — placeholder honesto. El mapa en vivo (Parte 4) está
//  pendiente de decidir el proveedor:
//  - react-native-maps + Google Maps: gratis hasta ~28,000 cargas/mes
//    (crédito de $200 USD de Google Cloud) pero requiere tarjeta y
//    configuración nativa (API key en AndroidManifest / Podfile).
//  - Apple Maps (iOS) es gratis con react-native-maps, pero Android
//    igual necesita Google.
//  Ninguna funcionalidad de las Partes 1-3 depende de esto.
// ══════════════════════════════════════════════════════════════════

export default function MotorizadoMapScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Mapa en vivo 🗺️</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <MapPin size={30} color={GREEN} strokeWidth={2} />
          </View>
          <Text style={s.cardTitle}>Muy pronto</Text>
          <Text style={s.cardSub}>
            Aquí verás los pedidos cercanos y la ruta de tu entrega en un mapa
            en tiempo real. Esta función está en desarrollo.
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