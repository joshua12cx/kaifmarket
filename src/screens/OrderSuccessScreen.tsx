// src/screens/OrderSuccessScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';

export default function OrderSuccessScreen({ route, navigation }: any) {
  const insets  = useSafeAreaInsets();
  const { orderId, total, email, delivery, payment } = route.params;

  // Animación de entrada
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const deliveryLabels: Record<string, string> = {
    standard: 'Estándar — mañana 9:00–18:00',
    express:  'Exprés — hoy 14:00–18:00',
    pickup:   'Recojo en tienda — hoy desde 10:00',
  };

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo al entregar',
    yape: 'Yape',
    plin: 'Plin',
    card: 'Tarjeta',
  };

  return (
    <View style={[ss.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ss.content}>

        {/* ── ÍCONO ÉXITO ── */}
        <Animated.View style={[ss.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={ss.icon}>✅</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={ss.title}>¡Pedido confirmado!</Text>
          <Text style={ss.subtitle}>
            Gracias por tu compra en KaifMarket 🐦🇵🇪
          </Text>

          {/* ── DETALLES DEL PEDIDO ── */}
          <View style={ss.card}>
            <Text style={ss.cardTitle}>Detalles del pedido</Text>

            <View style={ss.row}>
              <Text style={ss.rowLabel}>N° de pedido</Text>
              <Text style={ss.rowVal}>{String(orderId).substring(0, 8).toUpperCase()}</Text>
            </View>
            <View style={ss.divider} />

            <View style={ss.row}>
              <Text style={ss.rowLabel}>Total pagado</Text>
              <Text style={[ss.rowVal, { color: COLORS.primary, fontSize: 18 }]}>S/ {total}</Text>
            </View>
            <View style={ss.divider} />

            <View style={ss.row}>
              <Text style={ss.rowLabel}>Entrega</Text>
              <Text style={ss.rowVal}>{deliveryLabels[delivery] || delivery}</Text>
            </View>
            <View style={ss.divider} />

            <View style={ss.row}>
              <Text style={ss.rowLabel}>Pago</Text>
              <Text style={ss.rowVal}>{paymentLabels[payment] || payment}</Text>
            </View>
            <View style={ss.divider} />

            <View style={ss.row}>
              <Text style={ss.rowLabel}>Recibo enviado a</Text>
              <Text style={ss.rowVal}>{email}</Text>
            </View>
          </View>

          {/* ── PASOS SIGUIENTES ── */}
          <View style={ss.stepsCard}>
            <Text style={ss.stepsTitle}>¿Qué sigue?</Text>
            {[
              { icon: '📧', text: `Te enviamos un recibo a ${email}` },
              { icon: '📦', text: 'Prepararemos tu pedido de inmediato' },
              { icon: '🚚', text: deliveryLabels[delivery] || 'Tu pedido llegará pronto' },
              { icon: '⭐', text: 'Cuéntanos tu experiencia con una reseña' },
            ].map((step, i) => (
              <View key={i} style={ss.step}>
                <Text style={{ fontSize: 20 }}>{step.icon}</Text>
                <Text style={ss.stepTxt}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* ── BOTONES ── */}
          <TouchableOpacity
            style={ss.primaryBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] })}
            activeOpacity={0.85}>
            <Text style={ss.primaryBtnTxt}>Seguir comprando →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={ss.secondaryBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ProfileTab' }] })}
            activeOpacity={0.85}>
            <Text style={ss.secondaryBtnTxt}>Ver mis pedidos</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.white },
  content:        { alignItems: 'center', padding: SPACING.lg, paddingBottom: 40 },
  iconWrap:       { width: 100, height: 100, backgroundColor: COLORS.greenLight, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginVertical: 32 },
  icon:           { fontSize: 52 },
  title:          { fontSize: 26, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 8, textAlign: 'center' },
  subtitle:       { fontSize: 15, color: COLORS.gray400, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  card:           { width: '100%', backgroundColor: COLORS.gray50, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border },
  cardTitle:      { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  row:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 },
  rowLabel:       { fontSize: 13, color: COLORS.gray400, flex: 1 },
  rowVal:         { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800, flex: 1, textAlign: 'right' },
  divider:        { height: 0.5, backgroundColor: COLORS.border },
  stepsCard:      { width: '100%', backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  stepsTitle:     { fontSize: 15, fontWeight: FONT.black, color: COLORS.primaryDark, marginBottom: SPACING.md },
  step:           { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepTxt:        { flex: 1, fontSize: 13, color: COLORS.primaryDark, fontWeight: FONT.semibold, lineHeight: 19 },
  primaryBtn:     { width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', marginBottom: SPACING.sm, ...SHADOW.strong },
  primaryBtnTxt:  { color: COLORS.white, fontSize: 15, fontWeight: FONT.black },
  secondaryBtn:   { width: '100%', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingVertical: 13, alignItems: 'center' },
  secondaryBtnTxt:{ color: COLORS.gray600, fontSize: 14, fontWeight: FONT.bold },
});
