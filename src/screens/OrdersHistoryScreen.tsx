// src/screens/OrdersHistoryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Truck, MapPin, User, Mail } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';

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
  updated_at:     string;
  order_items:    OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  processing: { label: 'Procesando', color: COLORS.gold,  icon: '⏳' },
  shipped:    { label: 'En camino',  color: COLORS.blue,  icon: '🚚' },
  delivered:  { label: 'Entregado',  color: COLORS.green, icon: '📦' },
  cancelled:  { label: 'Cancelado',  color: COLORS.red,   icon: '❌' },
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

  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .or(`buyer_id.eq.${user.id},buyer_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (__DEV__) { console.log('[ORDERS] fetch:', { count: data?.length, error }); }
      if (data && !error) { setOrders(data as Order[]); }
    } catch (e) {
      if (__DEV__) { console.log('[ORDERS] Error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const Header = () => (
    <View style={oh.header}>
      <TouchableOpacity style={oh.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={oh.headerTitle}>Mis pedidos</Text>
      <View style={{ width: 36 }} />
    </View>
  );

  if (!user) {
    return (
      <View style={[oh.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <Header />
        <View style={oh.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🔐</Text>
          <Text style={oh.emptyTitle}>Inicia sesión para ver tus pedidos</Text>
          <TouchableOpacity style={oh.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={oh.loginBtnTxt}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <View style={[oh.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <Header />
        <View style={oh.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📦</Text>
          <Text style={oh.emptyTitle}>Aún no tienes pedidos</Text>
          <TouchableOpacity style={oh.loginBtn} onPress={() => navigation.navigate('HomeMain')}>
            <Text style={oh.loginBtnTxt}>Ir a comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[oh.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <Header />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

          <View style={oh.summaryRow}>
            <View style={oh.summaryCard}>
              <Text style={oh.summaryVal}>{orders.length}</Text>
              <Text style={oh.summaryLbl}>Total pedidos</Text>
            </View>
            <View style={oh.summaryCard}>
              <Text style={oh.summaryVal}>{orders.filter(o => o.status === 'delivered').length}</Text>
              <Text style={oh.summaryLbl}>Entregados</Text>
            </View>
            <View style={oh.summaryCard}>
              <Text style={oh.summaryVal}>S/ {orders.reduce((s, o) => s + (o.total || 0), 0)}</Text>
              <Text style={oh.summaryLbl}>Total gastado</Text>
            </View>
          </View>

          {orders.map(order => {
            const cfg      = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
            const expanded = expandedId === order.id;
            const trackable = order.status === 'processing' || order.status === 'shipped';

            return (
              <View key={order.id} style={oh.orderCard}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setExpandedId(expanded ? null : order.id)}>
                  <View style={oh.orderHeader}>
                    <View style={oh.orderHeaderLeft}>
                      <Text style={oh.orderIcon}>{cfg.icon}</Text>
                      <View>
                        <Text style={oh.orderId}>#{String(order.id).substring(0, 8).toUpperCase()}</Text>
                        <Text style={oh.orderDate}>{formatDate(order.created_at)}</Text>
                      </View>
                    </View>
                    <View style={[oh.statusBadge, { backgroundColor: cfg.color + '22' }]}>
                      <Text style={[oh.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  <View style={oh.orderSummary}>
                    <View>
                      <Text style={oh.orderItemCount}>{order.order_items?.length || 0} producto(s)</Text>
                      <Text style={oh.orderDelivery}>{DELIVERY_LABELS[order.delivery_type] || order.delivery_type}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={oh.orderTotal}>S/ {order.total}</Text>
                      <Text style={oh.orderPayment}>{PAYMENT_LABELS[order.payment_method] || order.payment_method}</Text>
                    </View>
                  </View>

                  {expanded && (
                    <View style={oh.orderDetail}>
                      <View style={oh.detailDivider} />
                      {order.address && (
                        <View style={oh.detailRow}>
                          <MapPin size={13} color={COLORS.gray400} strokeWidth={2} />
                          <Text style={oh.detailTxt}>{order.address}</Text>
                        </View>
                      )}
                      <View style={oh.detailRow}>
                        <User size={13} color={COLORS.gray400} strokeWidth={2} />
                        <Text style={oh.detailTxt}>{order.buyer_name}</Text>
                      </View>
                      <View style={oh.detailRow}>
                        <Mail size={13} color={COLORS.gray400} strokeWidth={2} />
                        <Text style={oh.detailTxt}>{order.buyer_email}</Text>
                      </View>

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

                  <View style={oh.expandRow}>
                    <Text style={oh.expandTxt}>{expanded ? 'Ver menos ▲' : 'Ver detalle ▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* ── SEGUIMIENTO — solo si sigue en curso ── */}
                {trackable && (
                  <TouchableOpacity
                    style={oh.trackBtn}
                    onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
                    activeOpacity={0.85}>
                    <Truck size={15} color={COLORS.white} strokeWidth={2} />
                    <Text style={oh.trackBtnTxt}>Ver seguimiento</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <Text style={oh.refreshHint}>↓ Desliza para actualizar</Text>
        </ScrollView>
      )}
    </View>
  );
}

const oh = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.black },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:        { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.white, textAlign: 'center', marginBottom: 24 },
  loginBtn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 32, paddingVertical: 14 },
  loginBtnTxt:    { color: COLORS.white, fontWeight: FONT.black, fontSize: 15 },
  summaryRow:     { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  summaryCard:    { flex: 1, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  summaryVal:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.primary, marginBottom: 2 },
  summaryLbl:     { fontSize: 10, color: COLORS.gray400, fontWeight: FONT.semibold, textAlign: 'center' },
  orderCard:      { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, marginBottom: SPACING.md, overflow: 'hidden' },
  orderHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, paddingBottom: SPACING.sm },
  orderHeaderLeft:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIcon:      { fontSize: 24 },
  orderId:        { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
  orderDate:      { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  statusBadge:    { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:      { fontSize: 11, fontWeight: FONT.black },
  orderSummary:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  orderItemCount: { fontSize: 13, color: COLORS.gray200, fontWeight: FONT.semibold },
  orderDelivery:  { fontSize: 12, color: COLORS.gray400 },
  orderTotal:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.white },
  orderPayment:   { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  orderDetail:    { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  detailDivider:  { height: 0.5, backgroundColor: COLORS.gray800, marginBottom: SPACING.md },
  detailRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailTxt:      { flex: 1, fontSize: 13, color: COLORS.gray400, lineHeight: 18 },
  priceBreak:     { marginTop: SPACING.sm },
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLbl:       { fontSize: 13, color: COLORS.gray400 },
  priceVal:       { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white },
  totalPriceRow:  { borderTopWidth: 0.5, borderTopColor: COLORS.gray800, marginTop: 4, paddingTop: 8 },
  totalPriceLbl:  { fontSize: 15, fontWeight: FONT.black, color: COLORS.white },
  totalPriceVal:  { fontSize: 18, fontWeight: FONT.black, color: COLORS.primary },
  expandRow:      { alignItems: 'center', paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: COLORS.gray800 },
  expandTxt:      { fontSize: 12, color: COLORS.primaryMid, fontWeight: FONT.bold },
  trackBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.blue, paddingVertical: 12 },
  trackBtnTxt:    { fontSize: 13, fontWeight: FONT.black, color: COLORS.white },
  refreshHint:    { textAlign: 'center', fontSize: 12, color: COLORS.gray400, marginTop: SPACING.md },
});