// src/screens/OrdersHistoryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';

// ── Tipos ──────────────────────────────────────────────────────────
interface OrderItem {
  id:          string;
  product_id:  string;
  qty:         number;
  price:       number;
}

interface Order {
  id:             string;
  status:         string;
  total:          number;
  delivery_type:  string;
  delivery_cost:  number;
  address:        string;
  payment_method: string;
  buyer_name:     string;
  buyer_email:    string;
  created_at:     string;
  order_items:    OrderItem[];
}

// ── Config de estados ─────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  processing: { label: 'Procesando',  color: '#BA7517', bg: '#FDF3E0', icon: '⏳' },
  confirmed:  { label: 'Confirmado',  color: '#185FA5', bg: '#E6F1FB', icon: '✅' },
  shipped:    { label: 'En camino',   color: '#185FA5', bg: '#E6F1FB', icon: '🚚' },
  delivered:  { label: 'Entregado',   color: '#2D7A3A', bg: '#E8F5EA', icon: '📦' },
  cancelled:  { label: 'Cancelado',   color: '#CC1A1A', bg: '#FCEAEA', icon: '❌' },
};

const DELIVERY_LABELS: Record<string, string> = {
  standard: 'Entrega estándar',
  express:  'Entrega exprés',
  pickup:   'Recojo en tienda',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: '💵 Efectivo',
  yape: '📱 Yape',
  plin: '💜 Plin',
  card: '💳 Tarjeta',
};

export default function OrdersHistoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [orders,      setOrders]      = useState<Order[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);

  // ── Cargar pedidos ────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      // ════════════════════════════════════════════════════════
      // Obtener pedidos del usuario desde Supabase
      // ════════════════════════════════════════════════════════
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .or(`buyer_id.eq.${user.id},buyer_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (__DEV__) { console.log('[ORDERS] fetch:', { count: data?.length, error }); }

      if (data && !error) {
        setOrders(data as Order[]);
      }
    } catch (e) {
      if (__DEV__) { console.log('[ORDERS] Error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  // ── Formato de fecha ──────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Sin sesión ────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[oh.container, { paddingTop: insets.top }]}>
        <View style={oh.header}>
          <TouchableOpacity style={oh.backBtn} onPress={() => navigation.goBack()}>
            <Text style={oh.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={oh.headerTitle}>Mis pedidos</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={oh.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🔐</Text>
          <Text style={oh.emptyTitle}>Inicia sesión para ver tus pedidos</Text>
          <Text style={oh.emptySub}>Necesitas una cuenta para ver tu historial de compras</Text>
          <TouchableOpacity
            style={oh.loginBtn}
            onPress={() => navigation.navigate('Login')}>
            <Text style={oh.loginBtnTxt}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Sin pedidos ───────────────────────────────────────────────
  if (!loading && orders.length === 0) {
    return (
      <View style={[oh.container, { paddingTop: insets.top }]}>
        <View style={oh.header}>
          <TouchableOpacity style={oh.backBtn} onPress={() => navigation.goBack()}>
            <Text style={oh.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={oh.headerTitle}>Mis pedidos</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={oh.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📦</Text>
          <Text style={oh.emptyTitle}>Aún no tienes pedidos</Text>
          <Text style={oh.emptySub}>Cuando realices una compra aparecerá aquí</Text>
          <TouchableOpacity
            style={oh.loginBtn}
            onPress={() => navigation.navigate('HomeMain')}>
            <Text style={oh.loginBtnTxt}>Ir a comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[oh.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={oh.header}>
        <TouchableOpacity style={oh.backBtn} onPress={() => navigation.goBack()}>
          <Text style={oh.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={oh.headerTitle}>Mis pedidos</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: COLORS.gray400, marginTop: 12 }}>Cargando pedidos...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }>

          {/* ── RESUMEN ── */}
          <View style={oh.summaryRow}>
            <View style={oh.summaryCard}>
              <Text style={oh.summaryVal}>{orders.length}</Text>
              <Text style={oh.summaryLbl}>Total pedidos</Text>
            </View>
            <View style={oh.summaryCard}>
              <Text style={oh.summaryVal}>
                {orders.filter(o => o.status === 'delivered').length}
              </Text>
              <Text style={oh.summaryLbl}>Entregados</Text>
            </View>
            <View style={oh.summaryCard}>
              <Text style={oh.summaryVal}>
                S/ {orders.reduce((s, o) => s + (o.total || 0), 0)}
              </Text>
              <Text style={oh.summaryLbl}>Total gastado</Text>
            </View>
          </View>

          {/* ── LISTA DE PEDIDOS ── */}
          {orders.map(order => {
            const cfg      = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
            const expanded = expandedId === order.id;
            const date     = formatDate(order.created_at);

            return (
              <TouchableOpacity
                key={order.id}
                style={oh.orderCard}
                onPress={() => setExpandedId(expanded ? null : order.id)}
                activeOpacity={0.9}>

                {/* ── CABECERA ── */}
                <View style={oh.orderHeader}>
                  <View style={oh.orderHeaderLeft}>
                    <Text style={oh.orderIcon}>{cfg.icon}</Text>
                    <View>
                      <Text style={oh.orderId}>
                        #{String(order.id).substring(0, 8).toUpperCase()}
                      </Text>
                      <Text style={oh.orderDate}>{date}</Text>
                    </View>
                  </View>
                  <View style={[oh.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[oh.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                {/* ── RESUMEN ── */}
                <View style={oh.orderSummary}>
                  <View style={oh.orderSummaryLeft}>
                    <Text style={oh.orderItemCount}>
                      {order.order_items?.length || 0} producto(s)
                    </Text>
                    <Text style={oh.orderDelivery}>
                      {DELIVERY_LABELS[order.delivery_type] || order.delivery_type}
                    </Text>
                  </View>
                  <View style={oh.orderTotalWrap}>
                    <Text style={oh.orderTotal}>S/ {order.total}</Text>
                    <Text style={oh.orderPayment}>
                      {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                    </Text>
                  </View>
                </View>

                {/* ── DETALLE EXPANDIDO ── */}
                {expanded && (
                  <View style={oh.orderDetail}>
                    <View style={oh.detailDivider} />

                    {/* Dirección */}
                    {order.address && (
                      <View style={oh.detailRow}>
                        <Text style={oh.detailIcon}>📍</Text>
                        <Text style={oh.detailTxt}>{order.address}</Text>
                      </View>
                    )}

                    {/* Contacto */}
                    <View style={oh.detailRow}>
                      <Text style={oh.detailIcon}>👤</Text>
                      <Text style={oh.detailTxt}>{order.buyer_name}</Text>
                    </View>
                    <View style={oh.detailRow}>
                      <Text style={oh.detailIcon}>📧</Text>
                      <Text style={oh.detailTxt}>{order.buyer_email}</Text>
                    </View>

                    {/* Items */}
                    {order.order_items && order.order_items.length > 0 && (
                      <View style={oh.itemsWrap}>
                        <Text style={oh.itemsTitle}>Productos:</Text>
                        {order.order_items.map(item => (
                          <View key={item.id} style={oh.itemRow}>
                            <Text style={oh.itemName}>
                              Producto #{String(item.product_id).substring(0, 6)}
                            </Text>
                            <Text style={oh.itemQty}>x{item.qty}</Text>
                            <Text style={oh.itemPrice}>S/ {item.price * item.qty}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Desglose */}
                    <View style={oh.priceBreak}>
                      <View style={oh.priceRow}>
                        <Text style={oh.priceLbl}>Envío</Text>
                        <Text style={[oh.priceVal, order.delivery_cost === 0 && { color: COLORS.green }]}>
                          {order.delivery_cost === 0 ? 'Gratis' : `S/ ${order.delivery_cost}`}
                        </Text>
                      </View>
                      <View style={[oh.priceRow, oh.totalPriceRow]}>
                        <Text style={oh.totalPriceLbl}>Total</Text>
                        <Text style={oh.totalPriceVal}>S/ {order.total}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Expandir/Colapsar */}
                <View style={oh.expandRow}>
                  <Text style={oh.expandTxt}>
                    {expanded ? 'Ver menos ▲' : 'Ver detalle ▼'}
                  </Text>
                </View>

              </TouchableOpacity>
            );
          })}

          {/* Pull to refresh hint */}
          <Text style={oh.refreshHint}>↓ Desliza para actualizar</Text>

        </ScrollView>
      )}
    </View>
  );
}

const oh = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.gray50 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:        { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:        { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:    { fontSize: 17, fontWeight: FONT.black, color: COLORS.gray800 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800, textAlign: 'center', marginBottom: 8 },
  emptySub:       { fontSize: 14, color: COLORS.gray400, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  loginBtn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 32, paddingVertical: 14 },
  loginBtnTxt:    { color: COLORS.white, fontWeight: FONT.black, fontSize: 15 },
  summaryRow:     { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  summaryCard:    { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border },
  summaryVal:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.primary, marginBottom: 2 },
  summaryLbl:     { fontSize: 10, color: COLORS.gray400, fontWeight: FONT.semibold, textAlign: 'center' },
  orderCard:      { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: SPACING.md, overflow: 'hidden', ...SHADOW.card },
  orderHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, paddingBottom: SPACING.sm },
  orderHeaderLeft:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIcon:      { fontSize: 24 },
  orderId:        { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800 },
  orderDate:      { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  statusBadge:    { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:      { fontSize: 11, fontWeight: FONT.black },
  orderSummary:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  orderSummaryLeft:{ gap: 2 },
  orderItemCount: { fontSize: 13, color: COLORS.gray600, fontWeight: FONT.semibold },
  orderDelivery:  { fontSize: 12, color: COLORS.gray400 },
  orderTotalWrap: { alignItems: 'flex-end' },
  orderTotal:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800 },
  orderPayment:   { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  orderDetail:    { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  detailDivider:  { height: 0.5, backgroundColor: COLORS.border, marginBottom: SPACING.md },
  detailRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailIcon:     { fontSize: 14 },
  detailTxt:      { flex: 1, fontSize: 13, color: COLORS.gray600, lineHeight: 18 },
  itemsWrap:      { backgroundColor: COLORS.gray50, borderRadius: RADIUS.md, padding: SPACING.sm, marginVertical: SPACING.sm },
  itemsTitle:     { fontSize: 12, fontWeight: FONT.black, color: COLORS.gray600, marginBottom: 6 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  itemName:       { flex: 1, fontSize: 12, color: COLORS.gray600 },
  itemQty:        { fontSize: 12, color: COLORS.gray400, marginHorizontal: 8 },
  itemPrice:      { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray800 },
  priceBreak:     { marginTop: SPACING.sm },
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLbl:       { fontSize: 13, color: COLORS.gray400 },
  priceVal:       { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  totalPriceRow:  { borderTopWidth: 0.5, borderTopColor: COLORS.border, marginTop: 4, paddingTop: 8 },
  totalPriceLbl:  { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  totalPriceVal:  { fontSize: 18, fontWeight: FONT.black, color: COLORS.primary },
  expandRow:      { alignItems: 'center', paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  expandTxt:      { fontSize: 12, color: COLORS.primary, fontWeight: FONT.bold },
  refreshHint:    { textAlign: 'center', fontSize: 12, color: COLORS.gray400, marginTop: SPACING.md },
});
