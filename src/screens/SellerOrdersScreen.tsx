// src/screens/SellerOrdersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Package, Truck, CheckCircle2 } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';

const TABS = [
  { key: 'processing', label: 'Nuevos' },
  { key: 'shipped',    label: 'En proceso' },
  { key: 'delivered',  label: 'Entregados' },
] as const;

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1)  { return 'ahora'; }
  if (min < 60) { return `hace ${min} min`; }
  const hr = Math.floor(min / 60);
  if (hr < 24)  { return `hace ${hr}h`; }
  const days = Math.floor(hr / 24);
  return days === 1 ? 'ayer' : `hace ${days}d`;
}

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [orders,     setOrders]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<'processing' | 'shipped' | 'delivered' | 'cancelled'>('processing');
  const [updating,   setUpdating]   = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data: sellerRow } = await supabase
        .from('sellers').select('id').eq('user_id', user.id).single();
      if (!sellerRow) { setLoading(false); setRefreshing(false); return; }

      const { data: prods } = await supabase
        .from('products').select('id').eq('seller_id', sellerRow.id);
      const pIds = (prods || []).map((p: any) => p.id);
      if (pIds.length === 0) { setOrders([]); setLoading(false); setRefreshing(false); return; }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, qty, price, product_id, products(name, image_url, bg_color)')
        .in('product_id', pIds);

      if (!orderItems || orderItems.length === 0) { setOrders([]); setLoading(false); setRefreshing(false); return; }

      const orderIds = [...new Set(orderItems.map((i: any) => i.order_id))];
      const { data: ordersData } = await supabase
        .from('orders').select('*').in('id', orderIds).order('created_at', { ascending: false });

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
  }, [user?.id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const updateStatus = (orderId: string, newStatus: string, order: any) => {
    if (newStatus === 'delivered') {
      Alert.alert('¿Marcar como enviado/entregado?', 'Se descontará el stock de tus productos. Esta acción no se puede deshacer.', [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, confirmar', onPress: () => doUpdateStatus(orderId, newStatus, order) },
      ]);
      return;
    }
    doUpdateStatus(orderId, newStatus, order);
  };

  const doUpdateStatus = async (orderId: string, newStatus: string, order: any) => {
    setUpdating(orderId);
    try {
      await supabase.from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (newStatus === 'delivered') {
        for (const item of order.sellerItems) {
          if (!item.product_id) { continue; }
          const { data: prod } = await supabase
            .from('products').select('stock, sold').eq('id', item.product_id).single();
          if (prod) {
            await supabase.from('products').update({
              stock: Math.max(0, (prod.stock || 0) - item.qty),
              sold:  (prod.sold  || 0) + item.qty,
            }).eq('id', item.product_id);
          }
        }
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      if (__DEV__) { console.log('[UPDATE_STATUS] Error:', e); }
      Alert.alert('Error', 'No se pudo actualizar el pedido. Intenta de nuevo.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => o.status === activeTab);
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const tabCount = (key: string) => orders.filter(o => o.status === key).length;

  if (loading) {
    return (
      <View style={[so.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={[so.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={so.header}>
        <Text style={so.headerTitle}>Pedidos</Text>
      </View>

      {/* ── TABS ── */}
      <View style={so.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[so.tabBtn, activeTab === t.key && so.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.85}>
            <Text style={[so.tabTxt, activeTab === t.key && so.tabTxtActive]}>
              {t.label} ({tabCount(t.key)})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {cancelledCount > 0 && (
        <TouchableOpacity style={so.cancelledLink} onPress={() => setActiveTab('cancelled')}>
          <Text style={[so.cancelledLinkTxt, activeTab === 'cancelled' && { color: COLORS.gold }]}>
            Ver cancelados ({cancelledCount})
          </Text>
        </TouchableOpacity>
      )}

      {/* ── LISTA ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>

        {filtered.length === 0 ? (
          <View style={so.empty}>
            <View style={so.emptyIconWrap}>
              <ShoppingBag size={40} color={COLORS.gray400} strokeWidth={1.5} />
            </View>
            <Text style={so.emptyTitle}>Sin pedidos aquí</Text>
          </View>
        ) : (
          filtered.map(order => {
            const isUpdating = updating === order.id;
            const firstItem  = order.sellerItems[0];
            const extraCount = order.sellerItems.length - 1;
            const thumbBg    = firstItem?.products?.bg_color || COLORS.gray800;

            return (
              <View key={order.id} style={so.orderCard}>
                <View style={so.orderTop}>
                  <Text style={so.orderId}>#KM-{order.id.substring(0, 4).toUpperCase()}</Text>
                  <Text style={so.orderTime}>{timeAgo(order.created_at)}</Text>
                </View>

                <View style={so.productRow}>
                  <View style={[so.productThumb, { backgroundColor: thumbBg }]}>
                    {firstItem?.products?.image_url ? (
                      <Image source={{ uri: firstItem.products.image_url }} style={so.productThumbImg} />
                    ) : (
                      <Package size={20} color={COLORS.gray600} strokeWidth={1.5} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={so.productName} numberOfLines={1}>
                      {firstItem?.products?.name || 'Producto'}
                      {extraCount > 0 ? ` +${extraCount} más` : ''}
                    </Text>
                    <Text style={so.buyerTxt}>Comprador: {order.buyer_name || 'Cliente'}</Text>
                  </View>
                </View>

                <View style={so.bottomRow}>
                  <Text style={so.orderPrice}>S/ {order.sellerTotal.toFixed(0)}</Text>

                  {isUpdating ? (
                    <ActivityIndicator color={COLORS.gold} />
                  ) : order.status === 'processing' ? (
                    <TouchableOpacity
                      style={[so.actionBtn, { backgroundColor: COLORS.gold }]}
                      onPress={() => updateStatus(order.id, 'shipped', order)}
                      activeOpacity={0.85}>
                      <Text style={[so.actionBtnTxt, { color: COLORS.black }]}>Aceptar pedido</Text>
                    </TouchableOpacity>
                  ) : order.status === 'shipped' ? (
                    <TouchableOpacity
                      style={[so.actionBtn, { backgroundColor: COLORS.green }]}
                      onPress={() => updateStatus(order.id, 'delivered', order)}
                      activeOpacity={0.85}>
                      <Text style={[so.actionBtnTxt, { color: COLORS.white }]}>Marcar enviado</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const so = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle:  { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },

  tabsRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.lg },
  tabBtn:       { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft },
  tabBtnActive: { backgroundColor: COLORS.gold },
  tabTxt:       { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray400 },
  tabTxtActive: { color: COLORS.black, fontWeight: FONT.black },

  cancelledLink:    { alignSelf: 'flex-end', marginRight: SPACING.lg, marginTop: 8 },
  cancelledLinkTxt: { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },

  empty:         { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },

  orderCard:      { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  orderTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  orderId:        { fontSize: 13, fontWeight: FONT.black, color: COLORS.gold },
  orderTime:      { fontSize: 12, color: COLORS.gray400 },

  productRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.md },
  productThumb:   { width: 48, height: 48, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productThumbImg:{ width: '100%', height: '100%' },
  productName:    { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  buyerTxt:       { fontSize: 12, color: COLORS.gray400, marginTop: 2 },

  bottomRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderPrice:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.gold },
  actionBtn:      { borderRadius: RADIUS.full, paddingHorizontal: 18, paddingVertical: 10 },
  actionBtnTxt:   { fontSize: 13, fontWeight: FONT.black },
});