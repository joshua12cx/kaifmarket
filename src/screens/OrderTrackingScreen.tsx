// src/screens/OrderTrackingScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Truck, Check, Package } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase } from '../lib/supabase';

// ── Pasos del timeline ───────────────────────────────────────────
// OJO — honestidad de datos: tu tabla `orders` solo guarda UN
// `status` y UN `updated_at` (no una hora por cada paso). Por eso:
//  - "Pedido confirmado" muestra `created_at` (ese sí es real)
//  - el paso que coincide con el status ACTUAL muestra `updated_at`
//    (real, es la última vez que cambió)
//  - los pasos intermedios ya completados dicen "Completado" sin
//    hora, porque esa hora exacta no se guardó en ningún lado
//  - si más adelante quieres horas reales por paso, hace falta
//    agregar columnas tipo `confirmed_at`, `shipped_at`, etc.
const STEPS = [
  { key: 'confirmed', title: 'Pedido confirmado', sub: 'Pago procesado exitosamente' },
  { key: 'preparing', title: 'Preparando pedido',  sub: 'La tienda está empacando tu producto' },
  { key: 'shipped',   title: 'En camino',          sub: 'Tu repartidor tiene el paquete' },
  { key: 'delivered', title: 'Entregado',          sub: 'Firma la recepción del paquete' },
];

function stepIndexForStatus(status: string) {
  if (status === 'processing') { return 1; }
  if (status === 'shipped')    { return 2; }
  if (status === 'delivered')  { return 3; }
  return -1;
}

function formatTime(dateStr?: string) {
  if (!dateStr) { return ''; }
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderTrackingScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [order, setOrder]     = useState<any>(null);
  const [firstItem, setFirstItem] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const { data: orderData } = await supabase
        .from('orders').select('*').eq('id', orderId).single();
      setOrder(orderData);

      const { data: items } = await supabase
        .from('order_items')
        .select('qty, price, products(name, image_url, bg_color)')
        .eq('order_id', orderId)
        .limit(1);

      if (items && items[0]) { setFirstItem(items[0]); }
    } catch (e) {
      if (__DEV__) { console.log('[TRACKING] load error:', e); }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !order) {
    return (
      <View style={[t.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const doneIndex = stepIndexForStatus(order.status);
  const isCancelled = order.status === 'cancelled';
  const isShipped = order.status === 'shipped';
  const statusCfg: Record<string, { label: string; color: string }> = {
    processing: { label: 'PROCESANDO', color: COLORS.gold },
    shipped:    { label: 'EN CAMINO',  color: COLORS.blue },
    delivered:  { label: 'ENTREGADO',  color: COLORS.green },
    cancelled:  { label: 'CANCELADO',  color: COLORS.red },
  };
  const cfg = statusCfg[order.status] || statusCfg.processing;

  return (
    <View style={[t.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* ── HEADER ── */}
      <View style={t.header}>
        <TouchableOpacity style={t.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={t.headerTitle}>Seguimiento</Text>
        <View style={[t.statusBadge, { backgroundColor: cfg.color + '22' }]}>
          <Text style={[t.statusBadgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── RUTA VISUAL (decorativa) ── */}
        <View style={t.routeCard}>
          <View style={t.routeRow}>
            <View style={[t.routeDot, { backgroundColor: COLORS.green }]} />
            <View style={[t.routeLine, { backgroundColor: isShipped || order.status === 'delivered' ? COLORS.gold : COLORS.gray800 }]} />
            <View style={[t.routeTruckWrap, { backgroundColor: isShipped ? COLORS.gold : COLORS.gray800 }, isShipped && t.routeTruckWrapActive]}>
              <Truck size={18} color={isShipped ? COLORS.black : COLORS.gray400} strokeWidth={2} />
            </View>
            <View style={[t.routeLine, { backgroundColor: order.status === 'delivered' ? COLORS.red : COLORS.gray800 }]} />
            <View style={[t.routeDot, { backgroundColor: COLORS.red }]} />
          </View>
          <View style={t.routeLabels}>
            <Text style={t.routeLabel}>Pickup</Text>
            <Text style={[t.routeLabel, { color: COLORS.gold }]}>
              {isCancelled ? 'Cancelado' : cfg.label}
            </Text>
            <Text style={t.routeLabel}>Destino</Text>
          </View>

          {/* ── REPARTIDOR — genérico, sin nombre real todavía ── */}
          {isShipped && (
            <View style={t.courierRow}>
              <View style={t.courierAvatar}>
                <Truck size={18} color={COLORS.black} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={t.courierTxt}>Repartidor asignado</Text>
                <Text style={t.courierSub}>Verificado por KaifMarket</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={t.courierNoteBold}>En camino</Text>
                <Text style={t.courierNote}>Actualizaciones próximamente</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── PRODUCTO ── */}
        <View style={t.productCard}>
          <View style={[t.productImg, { backgroundColor: firstItem?.products?.bg_color || COLORS.gray800 }]}>
            {firstItem?.products?.image_url ? (
              <Image source={{ uri: firstItem.products.image_url }} style={t.productImgReal} />
            ) : (
              <Package size={22} color={COLORS.gray600} strokeWidth={1.5} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.productName} numberOfLines={1}>{firstItem?.products?.name || 'Producto'}</Text>
            <Text style={t.productSub}>
              Pedido #{String(order.id).substring(0, 8).toUpperCase()} · {firstItem?.qty || 1} item · S/ {order.total}
            </Text>
          </View>
        </View>

        {/* ── TIMELINE ── */}
        {isCancelled ? (
          <View style={t.cancelledCard}>
            <Text style={t.cancelledTxt}>Este pedido fue cancelado.</Text>
          </View>
        ) : (
          <View style={t.timelineCard}>
            <Text style={t.timelineTitle}>Estado del pedido</Text>
            {STEPS.map((step, i) => {
              const done = i <= doneIndex;
              const isLast = i === STEPS.length - 1;
              let timeLabel = '';
              if (i === 0) { timeLabel = formatTime(order.created_at); }
              else if (i === doneIndex) { timeLabel = formatTime(order.updated_at); }
              else if (done) { timeLabel = 'Completado'; }
              else { timeLabel = 'Pendiente'; }

              return (
                <View key={step.key} style={t.stepRow}>
                  <View style={t.stepIconCol}>
                    <View style={[t.stepDot, done ? t.stepDotDone : t.stepDotPending]}>
                      {done && <Check size={13} color={COLORS.white} strokeWidth={3} />}
                    </View>
                    {!isLast && <View style={[t.stepConnector, i <= doneIndex && t.stepConnectorDone]} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: isLast ? 0 : SPACING.lg }}>
                    <Text style={[t.stepTitle, !done && t.stepTitlePending]}>{step.title}</Text>
                    <Text style={t.stepSub}>{step.sub}</Text>
                    <Text style={[t.stepTime, done && i === doneIndex && { color: COLORS.green }]}>{timeLabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const t = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  statusBadge:  { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeTxt: { fontSize: 10, fontWeight: FONT.black },

  routeCard:    { backgroundColor: '#161B2E', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)' },
  routeRow:     { flexDirection: 'row', alignItems: 'center' },
  routeDot:     { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)' },
  routeLine:    { flex: 1, height: 3, marginHorizontal: 4 },
  routeTruckWrap: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  routeTruckWrapActive: { shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  routeLabels:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  routeLabel:   { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.semibold },

  courierRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)' },
  courierAvatar:   { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  courierTxt:      { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white },
  courierSub:      { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
  courierNoteBold: { fontSize: 12, fontWeight: FONT.black, color: COLORS.green },
  courierNote:     { fontSize: 10, color: COLORS.gray400, marginTop: 1 },

  productCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  productImg:   { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productImgReal: { width: '100%', height: '100%' },
  productName:  { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  productSub:   { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  cancelledCard: { backgroundColor: COLORS.red + '15', borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center' },
  cancelledTxt:  { fontSize: 14, color: COLORS.red, fontWeight: FONT.bold },

  timelineCard: { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg },
  timelineTitle:{ fontSize: 15, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.md },
  stepRow:      { flexDirection: 'row', gap: 12 },
  stepIconCol:  { alignItems: 'center' },
  stepDot:      { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepDotDone:  { backgroundColor: COLORS.green },
  stepDotPending: { backgroundColor: COLORS.red },
  stepConnector:{ width: 2, flex: 1, backgroundColor: COLORS.gray800, marginTop: 2 },
  stepConnectorDone: { backgroundColor: COLORS.green },
  stepTitle:    { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  stepTitlePending: { color: COLORS.gray400 },
  stepSub:      { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  stepTime:     { fontSize: 11, color: COLORS.gray600, marginTop: 4, fontWeight: FONT.semibold },
});