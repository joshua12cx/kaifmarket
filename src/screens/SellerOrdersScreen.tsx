// src/screens/SellerOrdersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, ShoppingBag, User, Phone, MapPin, CreditCard,
  Package, Truck, CheckCircle2, XCircle, Info, Wallet, Smartphone,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { supabase } from '../lib/supabase';

const STATUS_OPTIONS = ['todos', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusLabel = (s: string) => ({
  processing: 'Procesando',
  shipped:    'En camino',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
}[s] || s);

const statusColor = (s: string) => ({
  processing: { bg: COLORS.amberLight, txt: COLORS.amber },
  shipped:    { bg: COLORS.blueLight,  txt: COLORS.blue  },
  delivered:  { bg: COLORS.greenLight, txt: COLORS.green },
  cancelled:  { bg: COLORS.redLight,   txt: COLORS.primary },
}[s] || { bg: COLORS.gray100, txt: COLORS.gray400 });

const paymentMeta = (m: string) => ({
  cash: { label: 'Efectivo', icon: Wallet },
  yape: { label: 'Yape',     icon: Smartphone },
  plin: { label: 'Plin',     icon: Smartphone },
}[m] || { label: m, icon: CreditCard });

const deliveryLabel = (d: string) => ({
  express: 'Exprés',
  pickup:  'Recojo',
}[d] || 'Estándar');

export default function SellerOrdersScreen({ route, navigation }: any) {
  const { sellerId } = route.params;
  const insets = useSafeAreaInsets();

  const [orders,       setOrders]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [updating,     setUpdating]     = useState<string | null>(null);

  // ── Cargar pedidos del vendedor ───────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      // 1. IDs de productos del vendedor
      const { data: prods } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', sellerId);

      const pIds = (prods || []).map((p: any) => p.id);

      if (pIds.length === 0) { setOrders([]); return; }

      // 2. Order items con esos productos
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, qty, price, product_id')
        .in('product_id', pIds);

      if (!orderItems || orderItems.length === 0) { setOrders([]); return; }

      // 3. IDs únicos de órdenes
      const orderIds = [...new Set(orderItems.map((i: any) => i.order_id))];

      // 4. Datos completos de las órdenes
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      // 5. Combinar con items del vendedor
      const combined = (ordersData || []).map((order: any) => ({
        ...order,
        sellerItems: orderItems.filter((i: any) => i.order_id === order.id),
        sellerTotal: orderItems
          .filter((i: any) => i.order_id === order.id)
          .reduce((s: number, i: any) => s + i.price * i.qty, 0),
      }));

      setOrders(combined);
    } catch (e) {
      if (__DEV__) { console.log('[SELLER_ORDERS] Error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  // ── Actualizar status + lógica de stock ──────────────────────
  const updateStatus = async (orderId: string, newStatus: string, order: any) => {
    // Confirmar antes de cancelar
    if (newStatus === 'cancelled') {
      Alert.alert(
        '¿Cancelar pedido?',
        'Esta acción no se puede deshacer.',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Sí, cancelar', style: 'destructive',
            onPress: () => doUpdateStatus(orderId, newStatus, order) },
        ],
      );
      return;
    }

    // Confirmar antes de marcar entregado (descuenta stock)
    if (newStatus === 'delivered') {
      Alert.alert(
        '¿Marcar como entregado?',
        'Se descontará el stock de tus productos. Esta acción no se puede deshacer.',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Sí, confirmar', onPress: () => doUpdateStatus(orderId, newStatus, order) },
        ],
      );
      return;
    }

    doUpdateStatus(orderId, newStatus, order);
  };

  const doUpdateStatus = async (orderId: string, newStatus: string, order: any) => {
    setUpdating(orderId);
    try {
      // 1. Actualizar status en orders
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // 2. Si se marca como ENTREGADO → descontar stock y sumar sold
      if (newStatus === 'delivered') {
        for (const item of order.sellerItems) {
          if (!item.product_id) { continue; }

          const { data: prod } = await supabase
            .from('products')
            .select('stock, sold')
            .eq('id', item.product_id)
            .single();

          if (prod) {
            await supabase
              .from('products')
              .update({
                stock: Math.max(0, (prod.stock || 0) - item.qty),
                sold:  (prod.sold  || 0) + item.qty,
              })
              .eq('id', item.product_id);

            if (__DEV__) {
              console.log(`[STOCK] ${item.product_id}: stock ${prod.stock} → ${Math.max(0, prod.stock - item.qty)}, sold ${prod.sold} → ${prod.sold + item.qty}`);
            }
          }
        }
      }

      // 3. Actualizar estado local
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

    } catch (e) {
      if (__DEV__) { console.log('[UPDATE_STATUS] Error:', e); }
      Alert.alert('Error', 'No se pudo actualizar el pedido. Intenta de nuevo.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Filtrar ───────────────────────────────────────────────────
  const filtered = activeFilter === 'todos'
    ? orders
    : orders.filter(o => o.status === activeFilter);

  const totalRevenue  = orders
    .filter(o => o.status === 'delivered')
    .reduce((s, o) => s + (o.sellerTotal || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'processing').length;

  return (
    <View style={[so.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── HEADER ── */}
      <View style={so.header}>
        <TouchableOpacity style={so.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={so.headerTitle}>Mis Ventas</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.black }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {/* ── RESUMEN ── */}
          <View style={so.summaryRow}>
            <View style={so.summaryCard}>
              <Text style={so.summaryVal}>{orders.length}</Text>
              <Text style={so.summaryLbl}>Total pedidos</Text>
            </View>
            <View style={[so.summaryCard, so.summaryCardMid]}>
              <Text style={[so.summaryVal, pendingOrders > 0 && { color: COLORS.amber }]}>
                {pendingOrders}
              </Text>
              <Text style={so.summaryLbl}>Pendientes</Text>
            </View>
            <View style={so.summaryCard}>
              <Text style={[so.summaryVal, { color: COLORS.green, fontSize: 13 }]}>
                S/ {totalRevenue.toFixed(0)}
              </Text>
              <Text style={so.summaryLbl}>Confirmados</Text>
            </View>
          </View>

          {/* ── NOTA DE STOCK ── */}
          <View style={so.stockNote}>
            <Info size={14} color={COLORS.blue} strokeWidth={2} />
            <Text style={so.stockNoteTxt}>
              El stock se descuenta automáticamente al marcar un pedido como <Text style={{ fontWeight: FONT.black }}>Entregado</Text>
            </Text>
          </View>

          {/* ── FILTROS ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={so.filtersRow}>
            {STATUS_OPTIONS.map(f => (
              <TouchableOpacity
                key={f}
                style={[so.filterBtn, activeFilter === f && so.filterBtnActive]}
                onPress={() => setActiveFilter(f)}>
                <Text style={[so.filterTxt, activeFilter === f && so.filterTxtActive]}>
                  {f === 'todos' ? `Todos (${orders.length})` : `${statusLabel(f)} (${orders.filter(o => o.status === f).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── LISTA ── */}
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

            {filtered.length === 0 ? (
              <View style={so.empty}>
                <View style={so.emptyIconWrap}>
                  <ShoppingBag size={40} color={COLORS.gray400} strokeWidth={1.5} />
                </View>
                <Text style={so.emptyTitle}>
                  {orders.length === 0
                    ? 'Aún no tienes ventas'
                    : 'Sin pedidos en este estado'}
                </Text>
                <Text style={so.emptySub}>
                  {orders.length === 0
                    ? 'Cuando alguien compre tus productos aparecerán aquí'
                    : 'Prueba con otro filtro'}
                </Text>
              </View>
            ) : (
              filtered.map(order => {
                const sc        = statusColor(order.status);
                const isUpdating = updating === order.id;
                const pm        = paymentMeta(order.payment_method);
                const PayIcon   = pm.icon;
                return (
                  <View key={order.id} style={so.orderCard}>

                    {/* ── Cabecera ── */}
                    <View style={so.orderHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={so.orderId}>
                          #{order.id.substring(0, 8).toUpperCase()}
                        </Text>
                        <Text style={so.orderDate}>
                          {new Date(order.created_at).toLocaleDateString('es-PE', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={[so.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[so.statusTxt, { color: sc.txt }]}>
                          {statusLabel(order.status)}
                        </Text>
                      </View>
                    </View>

                    {/* ── Comprador ── */}
                    <View style={so.buyerRow}>
                      <View style={so.buyerIconWrap}>
                        <User size={16} color={COLORS.primary} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={so.buyerName}>{order.buyer_name || 'Cliente'}</Text>
                        <Text style={so.buyerEmail}>{order.buyer_email}</Text>
                        {order.buyer_phone && (
                          <View style={so.buyerPhoneRow}>
                            <Phone size={11} color={COLORS.gray400} strokeWidth={2} />
                            <Text style={so.buyerPhone}>{order.buyer_phone}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ── Dirección ── */}
                    {order.address && (
                      <View style={so.addressRow}>
                        <MapPin size={14} color={COLORS.gray400} strokeWidth={2} />
                        <Text style={so.addressTxt}>{order.address}</Text>
                      </View>
                    )}

                    {/* ── Items ── */}
                    <View style={so.itemsWrap}>
                      <Text style={so.itemsTitle}>Tus productos en este pedido:</Text>
                      {order.sellerItems.map((item: any, i: number) => (
                        <View key={i} style={so.itemRow}>
                          <Text style={so.itemDot}>•</Text>
                          <Text style={so.itemTxt}>x{item.qty} · S/ {item.price} c/u</Text>
                          <Text style={so.itemTotal}>
                            S/ {(item.price * item.qty).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* ── Footer ── */}
                    <View style={so.orderFooter}>
                      <View>
                        <View style={so.footerInfoRow}>
                          <PayIcon size={13} color={COLORS.gray400} strokeWidth={2} />
                          <Text style={so.paymentTxt}>{pm.label}</Text>
                        </View>
                        <View style={so.footerInfoRow}>
                          <Package size={13} color={COLORS.gray400} strokeWidth={2} />
                          <Text style={so.deliveryTxt}>{deliveryLabel(order.delivery_type)}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={so.sellerTotalLbl}>Tu ingreso</Text>
                        <Text style={so.sellerTotalVal}>
                          S/ {order.sellerTotal.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* ── Acciones ── */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <View style={so.actionsRow}>
                        {isUpdating ? (
                          <ActivityIndicator color={COLORS.primary} style={{ flex: 1, paddingVertical: 8 }} />
                        ) : (
                          <>
                            {order.status === 'processing' && (
                              <TouchableOpacity
                                style={[so.actionBtn, { backgroundColor: COLORS.blueLight }]}
                                onPress={() => updateStatus(order.id, 'shipped', order)}>
                                <Truck size={14} color={COLORS.blue} strokeWidth={2} />
                                <Text style={[so.actionBtnTxt, { color: COLORS.blue }]}>
                                  Marcar enviado
                                </Text>
                              </TouchableOpacity>
                            )}
                            {order.status === 'shipped' && (
                              <TouchableOpacity
                                style={[so.actionBtn, { backgroundColor: COLORS.greenLight }]}
                                onPress={() => updateStatus(order.id, 'delivered', order)}>
                                <CheckCircle2 size={14} color={COLORS.green} strokeWidth={2} />
                                <Text style={[so.actionBtnTxt, { color: COLORS.green }]}>
                                  Marcar entregado
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={[so.actionBtn, { backgroundColor: COLORS.redLight }]}
                              onPress={() => updateStatus(order.id, 'cancelled', order)}>
                              <XCircle size={14} color={COLORS.primary} strokeWidth={2} />
                              <Text style={[so.actionBtnTxt, { color: COLORS.primary }]}>
                                Cancelar
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const so = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.black },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.primary },
  backBtn:        { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  summaryRow:     { flexDirection: 'row', gap: 10, padding: SPACING.lg },
  summaryCard:    { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOW.card },
  summaryCardMid: {},
  summaryVal:     { fontSize: 20, fontWeight: FONT.black, color: COLORS.primary, marginBottom: 2 },
  summaryLbl:     { fontSize: 11, color: COLORS.gray400 },
  stockNote:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.blueLight, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  stockNoteTxt:   { flex: 1, fontSize: 12, color: COLORS.blue, lineHeight: 18 },
  filtersRow:     { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: 8 },
  filterBtn:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: 'transparent' },
  filterBtnActive:{ borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  filterTxt:      { fontSize: 12, fontWeight: FONT.semibold, color: COLORS.gray600 },
  filterTxtActive:{ color: COLORS.primary, fontWeight: FONT.bold },
  empty:          { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap:  { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:     { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginBottom: 8 },
  emptySub:       { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },
  orderCard:      { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, marginBottom: SPACING.md, overflow: 'hidden', ...SHADOW.card },
  orderHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  orderId:        { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800 },
  orderDate:      { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  statusBadge:    { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:      { fontSize: 12, fontWeight: FONT.bold },
  buyerRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  buyerIconWrap:  { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  buyerName:      { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  buyerEmail:     { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  buyerPhoneRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  buyerPhone:     { fontSize: 12, color: COLORS.gray400 },
  addressRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, paddingTop: SPACING.sm },
  addressTxt:     { flex: 1, fontSize: 12, color: COLORS.gray600, lineHeight: 18 },
  itemsWrap:      { backgroundColor: COLORS.gray50, padding: SPACING.md },
  itemsTitle:     { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray600, marginBottom: 6 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  itemDot:        { color: COLORS.primary, fontSize: 16 },
  itemTxt:        { flex: 1, fontSize: 13, color: COLORS.gray600 },
  itemTotal:      { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  orderFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  footerInfoRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  paymentTxt:     { fontSize: 12, color: COLORS.gray400 },
  deliveryTxt:    { fontSize: 12, color: COLORS.gray400 },
  sellerTotalLbl: { fontSize: 11, color: COLORS.gray400, marginBottom: 2 },
  sellerTotalVal: { fontSize: 18, fontWeight: FONT.black, color: COLORS.primary },
  actionsRow:     { flexDirection: 'row', gap: 8, padding: SPACING.md, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: RADIUS.lg, paddingVertical: 10 },
  actionBtnTxt:   { fontSize: 13, fontWeight: FONT.black },
});