// src/screens/SellerDashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ScrollView, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { useAuth, useNotifs } from '../context';
import { supabase, Seller } from '../lib/supabase';

type RecentOrder = {
  order_id: string;
  product_name: string;
  product_image: string | null;
  buyer_name: string | null;
  price: number;
  qty: number;
  status: string;
  created_at: string;
};

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1)   { return 'ahora'; }
  if (min < 60)  { return `hace ${min} min`; }
  const hr = Math.floor(min / 60);
  if (hr < 24)   { return `hace ${hr}h`; }
  return `hace ${Math.floor(hr / 24)}d`;
}

export default function SellerDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { unreadCount } = useNotifs();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [stats, setStats] = useState({ ventas: 0, pedidos: 0, clientes: 0 });
  const [weekSales, setWeekSales] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]); // Dom..Sab
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) { return; }
    try {
      // 1. Mi tienda
      const { data: sellerRow } = await supabase
        .from('sellers').select('*').eq('user_id', user.id).single();
      if (!sellerRow) { setLoading(false); setRefreshing(false); return; }
      setSeller(sellerRow as Seller);

      // 2. Todos mis order_items con datos del pedido y producto
      const { data: items } = await supabase
        .from('order_items')
        .select('id, qty, price, created_at, order_id, product_id, products!inner(id, name, image_url, seller_id), orders!inner(id, buyer_id, buyer_name, status, created_at)')
        .eq('products.seller_id', sellerRow.id)
        .order('created_at', { ascending: false });

      const rows = (items || []) as any[];

      // Ventas totales + pedidos únicos + clientes únicos
      const ventas = rows.reduce((sum, r) => sum + (Number(r.price) * r.qty), 0);
      const pedidosUnicos = new Set(rows.map(r => r.order_id));
      const clientesUnicos = new Set(rows.map(r => r.orders?.buyer_id).filter(Boolean));
      setStats({ ventas, pedidos: pedidosUnicos.size, clientes: clientesUnicos.size });

      // Ventas por día (últimos 7 días, Dom→Sáb)
      const week = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 6); weekAgo.setHours(0, 0, 0, 0);
      rows.forEach(r => {
        const d = new Date(r.created_at);
        if (d >= weekAgo) { week[d.getDay()] += Number(r.price) * r.qty; }
      });
      setWeekSales(week);

      // 3 pedidos más recientes
      const recent: RecentOrder[] = rows.slice(0, 3).map(r => ({
        order_id: r.order_id,
        product_name: r.products?.name || 'Producto',
        product_image: r.products?.image_url || null,
        buyer_name: r.orders?.buyer_name || 'Cliente',
        price: Number(r.price) * r.qty,
        qty: r.qty,
        status: r.orders?.status || 'processing',
        created_at: r.created_at,
      }));
      setRecentOrders(recent);
    } catch (e) {
      if (__DEV__) { console.log('[SELLER_DASHBOARD] load error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={[d.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  const maxWeek = Math.max(...weekSales, 1);
  const weekTotal = weekSales.reduce((a, b) => a + b, 0);
  const initials = (seller?.name || 'T').charAt(0).toUpperCase();

  const statusLabel: Record<string, { label: string; color: string }> = {
    processing: { label: 'NUEVO',     color: COLORS.red },
    shipped:    { label: 'EN CAMINO', color: COLORS.gold },
    delivered:  { label: 'ENTREGADO', color: COLORS.green },
    cancelled:  { label: 'CANCELADO', color: COLORS.gray400 },
  };

  return (
    <View style={[d.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>

        {/* ── HEADER ── */}
        <View style={d.header}>
          <View>
            <Text style={d.welcome}>Bienvenido</Text>
            <Text style={d.storeName}>{seller?.name || 'Mi Tienda'} 🏪</Text>
          </View>
          <View style={d.headerRight}>
            <TouchableOpacity style={d.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={18} color={COLORS.white} />
              {unreadCount > 0 && <View style={d.bellDot} />}
            </TouchableOpacity>
            <View style={d.avatar}>
              <Text style={d.avatarTxt}>{initials}</Text>
            </View>
          </View>
        </View>

        {/* ── STATS GRID ── */}
        <View style={d.statsGrid}>
          <View style={d.statCard}>
            <Text style={d.statLabel}>Ventas</Text>
            <Text style={d.statValue}>S/ {stats.ventas.toFixed(0)}</Text>
            <View style={d.statDelta}>
              <TrendingUp size={12} color={COLORS.green} />
              <Text style={d.statDeltaTxt}>esta semana</Text>
            </View>
          </View>
          <View style={d.statCard}>
            <Text style={d.statLabel}>Pedidos</Text>
            <Text style={d.statValue}>{stats.pedidos}</Text>
            <View style={d.statDelta}>
              <TrendingUp size={12} color={COLORS.green} />
              <Text style={d.statDeltaTxt}>total</Text>
            </View>
          </View>
          <View style={d.statCard}>
            <Text style={d.statLabel}>Clientes</Text>
            <Text style={d.statValue}>{stats.clientes}</Text>
            <View style={d.statDelta}>
              <TrendingUp size={12} color={COLORS.green} />
              <Text style={d.statDeltaTxt}>únicos</Text>
            </View>
          </View>
          <View style={d.statCard}>
            <Text style={d.statLabel}>Calificación</Text>
            <Text style={d.statValue}>{Number(seller?.rating || 5).toFixed(1)}★</Text>
            <View style={d.statDelta}>
              <TrendingUp size={12} color={COLORS.green} />
              <Text style={d.statDeltaTxt}>promedio</Text>
            </View>
          </View>
        </View>

        {/* ── VENTAS ESTA SEMANA (sparkline simple) ── */}
        <View style={d.chartCard}>
          <View style={d.chartHeader}>
            <Text style={d.chartTitle}>Ventas esta semana</Text>
            <View style={d.chartBadge}>
              <Text style={d.chartBadgeTxt}>S/ {weekTotal.toFixed(0)}</Text>
            </View>
          </View>
          <View style={d.chartBars}>
            {weekSales.map((v, i) => (
              <View key={i} style={d.chartBarWrap}>
                <View style={[d.chartBar, { height: Math.max((v / maxWeek) * 70, 3) }]} />
                <Text style={d.chartBarLabel}>{DAY_LABELS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── PEDIDOS RECIENTES ── */}
        <View style={d.sectionHeader}>
          <Text style={d.sectionTitle}>Pedidos recientes</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('SellerOrdersTab')}>
            <Text style={d.sectionLink}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={d.emptyCard}>
            <Text style={d.emptyTxt}>Todavía no tienes pedidos</Text>
          </View>
        ) : (
          recentOrders.map(o => {
            const st = statusLabel[o.status] || statusLabel.processing;
            return (
              <View key={o.order_id + o.product_name} style={d.orderCard}>
                <View style={d.orderThumb}>
                  {o.product_image
                    ? <Image source={{ uri: o.product_image }} style={d.orderThumbImg} />
                    : <Text style={{ fontSize: 20 }}>📦</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={d.orderProduct} numberOfLines={1}>{o.product_name}</Text>
                  <Text style={d.orderBuyer}>{o.buyer_name} · {timeAgo(o.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={d.orderPrice}>S/ {o.price.toFixed(0)}</Text>
                  <View style={[d.orderStatusBadge, { backgroundColor: st.color + '22' }]}>
                    <Text style={[d.orderStatusTxt, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const d = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  welcome:      { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },
  storeName:    { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, marginTop: 2 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn:      { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center' },
  bellDot:      { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red, borderWidth: 1.5, borderColor: COLORS.black },
  avatar:       { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { color: COLORS.black, fontSize: 15, fontWeight: FONT.black },

  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard:     { width: '48%', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.md },
  statLabel:    { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold, marginBottom: 6 },
  statValue:    { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },
  statDelta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  statDeltaTxt: { fontSize: 11, color: COLORS.green, fontWeight: FONT.semibold },

  chartCard:      { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  chartHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  chartTitle:     { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  chartBadge:     { backgroundColor: COLORS.gold + '22', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  chartBadgeTxt:  { fontSize: 12, fontWeight: FONT.black, color: COLORS.gold },
  chartBars:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90 },
  chartBarWrap:   { alignItems: 'center', gap: 6, flex: 1 },
  chartBar:       { width: 14, borderRadius: 4, backgroundColor: COLORS.gold },
  chartBarLabel:  { fontSize: 10, color: COLORS.gray400, fontWeight: FONT.semibold },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle:  { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  sectionLink:   { fontSize: 13, color: COLORS.gold, fontWeight: FONT.bold },

  emptyCard: { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center' },
  emptyTxt:  { fontSize: 13, color: COLORS.gray400 },

  orderCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.sm },
  orderThumb:       { width: 46, height: 46, borderRadius: RADIUS.lg, backgroundColor: COLORS.gray800, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  orderThumbImg:    { width: '100%', height: '100%' },
  orderProduct:     { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  orderBuyer:       { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  orderPrice:       { fontSize: 14, fontWeight: FONT.black, color: COLORS.gold },
  orderStatusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  orderStatusTxt:   { fontSize: 10, fontWeight: FONT.black },
});