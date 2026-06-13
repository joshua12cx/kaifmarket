// src/screens/SellerDashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';

interface SellerStats {
  totalProducts:  number;
  activeProducts: number;
  totalSales:     number;
  totalRevenue:   number;
  avgRating:      number;
  totalReviews:   number;
}

interface RecentOrder {
  id:          string;
  total:       number;
  status:      string;
  created_at:  string;
  buyer_name:  string;
  buyer_email: string;
}

type ProductRow = {
  id:           string;
  is_active:    boolean;
  sold:         number;
  rating:       number;
  review_count: number;
  price:        number;
};

export default function SellerDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [seller,     setSeller]     = useState<any>(null);
  const [stats,      setStats]      = useState<SellerStats | null>(null);
  const [orders,     setOrders]     = useState<RecentOrder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data: sellerData } = await supabase
        .from('sellers').select('*').eq('user_id', user.id).single();

      setSeller(sellerData);
      if (!sellerData) { setLoading(false); return; }

      // ── Si no está aprobado, no calcular stats todavía ────────
      if (sellerData.status !== 'approved') {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: products } = await supabase
        .from('products')
        .select('id, is_active, sold, rating, review_count, price')
        .eq('seller_id', sellerData.id);

      const rows = (products || []) as ProductRow[];

      const totalProducts  = rows.length;
      const activeProducts = rows.filter(p => p.is_active).length;
      const totalSales     = rows.reduce((s, p) => s + (p.sold || 0), 0);
      const totalRevenue   = rows.reduce((s, p) => s + ((p.sold || 0) * (p.price || 0)), 0);
      const avgRating      = rows.length
        ? rows.reduce((s, p) => s + (p.rating || 0), 0) / rows.length : 0;
      const totalReviews   = rows.reduce((s, p) => s + (p.review_count || 0), 0);

      setStats({ totalProducts, activeProducts, totalSales, totalRevenue, avgRating, totalReviews });

      const productIds = rows.map(p => p.id);
      if (productIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items').select('order_id').in('product_id', productIds);

        const orderIds = [...new Set((orderItems || []).map((i: any) => i.order_id))];

        if (orderIds.length > 0) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, total, status, created_at, buyer_name, buyer_email')
            .in('id', orderIds)
            .order('created_at', { ascending: false })
            .limit(5);
          setOrders(ordersData || []);
        } else { setOrders([]); }
      } else { setOrders([]); }

    } catch (e) {
      if (__DEV__) { console.log('[SELLER] fetchData error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Sin sesión ────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[sd.container, { paddingTop: insets.top }]}>
        <View style={sd.header}>
          <TouchableOpacity style={sd.backBtn} onPress={() => navigation.goBack()}>
            <Text style={sd.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={sd.headerTitle}>Panel de Vendedor</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={sd.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🔐</Text>
          <Text style={sd.emptyTitle}>Inicia sesión primero</Text>
          <TouchableOpacity style={sd.emptyBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={sd.emptyBtnTxt}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Sin tienda ────────────────────────────────────────────────
  if (!loading && !seller) {
    return (
      <View style={[sd.container, { paddingTop: insets.top }]}>
        <View style={sd.header}>
          <TouchableOpacity style={sd.backBtn} onPress={() => navigation.goBack()}>
            <Text style={sd.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={sd.headerTitle}>Panel de Vendedor</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={sd.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🏪</Text>
          <Text style={sd.emptyTitle}>Aún no tienes una tienda</Text>
          <Text style={sd.emptySub}>Regístrate como vendedor para empezar a vender en KaifMarket</Text>
          <TouchableOpacity style={sd.emptyBtn} onPress={() => navigation.navigate('SellerRegister')}>
            <Text style={sd.emptyBtnTxt}>Crear mi tienda</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[sd.container, { paddingTop: insets.top }]}>
        <View style={sd.header}>
          <TouchableOpacity style={sd.backBtn} onPress={() => navigation.goBack()}>
            <Text style={sd.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={sd.headerTitle}>Mi Tienda</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  // ── PENDIENTE DE REVISIÓN ─────────────────────────────────────
  if (seller.status === 'pending') {
    return (
      <View style={[sd.container, { paddingTop: insets.top }]}>
        <View style={sd.header}>
          <TouchableOpacity style={sd.backBtn} onPress={() => navigation.goBack()}>
            <Text style={sd.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={sd.headerTitle}>Mi Tienda</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }>
          <View style={sd.statusWrap}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>⏳</Text>
            <Text style={sd.statusTitle}>Tu tienda está en revisión</Text>
            <Text style={sd.statusSub}>
              Estamos verificando la información de "{seller.name}". Este proceso toma entre
              24 y 48 horas. Te avisaremos cuando esté aprobada.
            </Text>

            <View style={sd.statusCard}>
              {seller.logo_url ? (
                <Image source={{ uri: seller.logo_url }} style={sd.statusLogoImg} resizeMode="cover" />
              ) : (
                <View style={sd.storeAvatar}>
                  <Text style={{ fontSize: 28 }}>🏪</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={sd.statusCardName}>{seller.name}</Text>
                <Text style={sd.statusCardSub}>📍 {seller.location || 'Lima, Perú'}</Text>
                <View style={sd.statusBadgePending}>
                  <Text style={sd.statusBadgeTxt}>⏳ Pendiente de aprobación</Text>
                </View>
              </View>
            </View>

            <View style={sd.statusInfoCard}>
              <Text style={sd.statusInfoTxt}>
                Mientras tanto puedes editar la información de tu tienda, pero tus productos
                no serán visibles hasta la aprobación.
              </Text>
            </View>

            <TouchableOpacity
              style={sd.statusEditBtn}
              onPress={() => navigation.navigate('SellerEditStore', { seller })}>
              <Text style={sd.statusEditBtnTxt}>⚙️ Editar información de mi tienda</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── RECHAZADO ─────────────────────────────────────────────────
  if (seller.status === 'rejected') {
    return (
      <View style={[sd.container, { paddingTop: insets.top }]}>
        <View style={sd.header}>
          <TouchableOpacity style={sd.backBtn} onPress={() => navigation.goBack()}>
            <Text style={sd.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={sd.headerTitle}>Mi Tienda</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }>
          <View style={sd.statusWrap}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>❌</Text>
            <Text style={[sd.statusTitle, { color: COLORS.red }]}>
              Tu solicitud no fue aprobada
            </Text>
            <Text style={sd.statusSub}>
              Revisa el motivo y corrige la información para volver a intentarlo.
            </Text>

            {seller.rejection_reason && (
              <View style={sd.rejectionCard}>
                <Text style={sd.rejectionTitle}>Motivo del rechazo:</Text>
                <Text style={sd.rejectionTxt}>{seller.rejection_reason}</Text>
              </View>
            )}

            <TouchableOpacity
              style={sd.statusEditBtn}
              onPress={() => navigation.navigate('SellerEditStore', { seller })}>
              <Text style={sd.statusEditBtnTxt}>⚙️ Editar y corregir información</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── APROBADO — DASHBOARD NORMAL ───────────────────────────────
  return (
    <View style={[sd.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={sd.header}>
        <TouchableOpacity style={sd.backBtn} onPress={() => navigation.goBack()}>
          <Text style={sd.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={sd.headerTitle}>Mi Tienda</Text>
        <TouchableOpacity
          style={sd.settingsBtn}
          onPress={() => navigation.navigate('SellerEditStore', { seller })}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }>

        {/* ── PERFIL TIENDA ── */}
        <View style={sd.storeCard}>
          {seller?.logo_url ? (
            <Image source={{ uri: seller.logo_url }} style={sd.storeLogoImg} resizeMode="cover" />
          ) : (
            <View style={sd.storeAvatar}>
              <Text style={{ fontSize: 36 }}>🏪</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={sd.storeNameRow}>
              <Text style={sd.storeName}>{seller?.name || 'Mi Tienda'}</Text>
              {seller?.is_verified && (
                <View style={sd.verifiedBadge}>
                  <Text style={sd.verifiedTxt}>✓</Text>
                </View>
              )}
              {seller?.is_premium && (
                <View style={sd.premiumBadge}>
                  <Text style={sd.premiumTxt}>PREMIUM</Text>
                </View>
              )}
            </View>
            <Text style={sd.storeLocation}>📍 {seller?.location || 'Lima, Perú'}</Text>
            {seller?.description && (
              <Text style={sd.storeDesc} numberOfLines={2}>{seller.description}</Text>
            )}
          </View>
        </View>

        {/* ── ACCIONES RÁPIDAS ── */}
        <View style={sd.actionsRow}>
          <TouchableOpacity
            style={sd.actionBtn}
            onPress={() => navigation.navigate('SellerProducts', { sellerId: seller.id })}
            activeOpacity={0.85}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>📦</Text>
            <Text style={sd.actionLabel}>Mis productos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sd.actionBtn}
            onPress={() => navigation.navigate('SellerAddProduct', { sellerId: seller.id })}
            activeOpacity={0.85}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>➕</Text>
            <Text style={sd.actionLabel}>Agregar producto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sd.actionBtn}
            onPress={() => navigation.navigate('SellerOrders', { sellerId: seller.id })}
            activeOpacity={0.85}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>🛍️</Text>
            <Text style={sd.actionLabel}>Mis ventas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sd.actionBtn}
            onPress={() => navigation.navigate('SellerReviews', { sellerId: seller.id })}
            activeOpacity={0.85}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>⭐</Text>
            <Text style={sd.actionLabel}>Reseñas</Text>
          </TouchableOpacity>
        </View>

        {/* ── ESTADÍSTICAS ── */}
        {stats && (
          <View style={sd.section}>
            <Text style={sd.sectionTitle}>📊 Resumen</Text>
            <View style={sd.statsGrid}>
              <View style={sd.statCard}>
                <Text style={sd.statVal}>{stats.totalProducts}</Text>
                <Text style={sd.statLbl}>Productos</Text>
              </View>
              <View style={sd.statCard}>
                <Text style={[sd.statVal, { color: COLORS.green }]}>{stats.activeProducts}</Text>
                <Text style={sd.statLbl}>Activos</Text>
              </View>
              <View style={sd.statCard}>
                <Text style={sd.statVal}>{stats.totalSales}</Text>
                <Text style={sd.statLbl}>Vendidos</Text>
              </View>
              <View style={sd.statCard}>
                <Text style={[sd.statVal, { fontSize: 14 }]}>
                  S/ {stats.totalRevenue.toLocaleString()}
                </Text>
                <Text style={sd.statLbl}>Ingresos</Text>
              </View>
              <View style={sd.statCard}>
                <Text style={sd.statVal}>⭐ {stats.avgRating.toFixed(1)}</Text>
                <Text style={sd.statLbl}>Rating</Text>
              </View>
              <View style={sd.statCard}>
                <Text style={sd.statVal}>{stats.totalReviews}</Text>
                <Text style={sd.statLbl}>Reseñas</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── PEDIDOS RECIENTES ── */}
        <View style={sd.section}>
          <View style={sd.sectionHeader}>
            <Text style={sd.sectionTitle}>🛍️ Ventas recientes</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SellerOrders', { sellerId: seller?.id })}>
              <Text style={sd.sectionLink}>Ver todas ›</Text>
            </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
            <View style={sd.emptyOrders}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text style={sd.emptyOrdersTxt}>Aún no tienes ventas</Text>
              <Text style={sd.emptyOrdersSub}>
                Cuando alguien compre tus productos aparecerán aquí
              </Text>
            </View>
          ) : (
            orders.slice(0, 3).map(order => (
              <TouchableOpacity
                key={order.id}
                style={sd.orderCard}
                onPress={() => navigation.navigate('SellerOrders', { sellerId: seller?.id })}
                activeOpacity={0.85}>
                <View style={sd.orderLeft}>
                  <Text style={sd.orderBuyer}>{order.buyer_name || 'Cliente'}</Text>
                  <Text style={sd.orderEmail}>{order.buyer_email}</Text>
                  <Text style={sd.orderDate}>
                    {new Date(order.created_at).toLocaleDateString('es-PE')}
                  </Text>
                </View>
                <View style={sd.orderRight}>
                  <Text style={sd.orderTotal}>S/ {order.total}</Text>
                  <View style={[sd.orderStatus, {
                    backgroundColor:
                      order.status === 'delivered' ? COLORS.greenLight :
                      order.status === 'shipped'   ? COLORS.blueLight  :
                      order.status === 'cancelled' ? '#FFE5E5'          :
                      COLORS.amberLight,
                  }]}>
                    <Text style={[sd.orderStatusTxt, {
                      color:
                        order.status === 'delivered' ? COLORS.green :
                        order.status === 'shipped'   ? COLORS.blue  :
                        order.status === 'cancelled' ? COLORS.red   :
                        COLORS.amber,
                    }]}>
                      {order.status === 'processing' ? 'Procesando' :
                       order.status === 'delivered'  ? 'Entregado'  :
                       order.status === 'shipped'    ? 'En camino'  :
                       order.status === 'cancelled'  ? 'Cancelado'  : order.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── TIP ── */}
        <View style={sd.tipCard}>
          <Text style={sd.tipIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={sd.tipTitle}>Consejos para vender más</Text>
            <Text style={sd.tipTxt}>
              Sube fotos de calidad, describe bien tus productos y responde rápido a tus clientes.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[sd.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('SellerAddProduct', { sellerId: seller?.id })}
        activeOpacity={0.85}>
        <Text style={sd.fabTxt}>+ Producto</Text>
      </TouchableOpacity>

    </View>
  );
}

const sd = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.gray50 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:         { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:         { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:     { fontSize: 17, fontWeight: FONT.black, color: COLORS.gray800 },
  settingsBtn:     { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:      { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800, textAlign: 'center', marginBottom: 8 },
  emptySub:        { fontSize: 14, color: COLORS.gray400, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn:        { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 32, paddingVertical: 14 },
  emptyBtnTxt:     { color: COLORS.white, fontWeight: FONT.black, fontSize: 15 },
  emptyOrders:     { alignItems: 'center', paddingVertical: 24, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border },
  emptyOrdersTxt:  { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 4 },
  emptyOrdersSub:  { fontSize: 12, color: COLORS.gray400, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },
  storeCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.white, padding: SPACING.lg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  storeAvatar:     { width: 64, height: 64, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
  storeLogoImg:    { width: 64, height: 64, borderRadius: RADIUS.xl },
  storeNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  storeName:       { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800 },
  verifiedBadge:   { backgroundColor: COLORS.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  verifiedTxt:     { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  premiumBadge:    { backgroundColor: COLORS.amberLight, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  premiumTxt:      { color: COLORS.amber, fontSize: 9, fontWeight: FONT.black },
  storeLocation:   { fontSize: 12, color: COLORS.gray400, marginBottom: 4 },
  storeDesc:       { fontSize: 12, color: COLORS.gray600, lineHeight: 17 },
  actionsRow:      { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  actionBtn:       { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg, borderRightWidth: 0.5, borderRightColor: COLORS.border },
  actionLabel:     { fontSize: 11, fontWeight: FONT.bold, color: COLORS.gray600, textAlign: 'center' },
  section:         { padding: SPACING.lg },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  sectionLink:     { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:        { width: '30%', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  statVal:         { fontSize: 18, fontWeight: FONT.black, color: COLORS.primary, marginBottom: 4 },
  statLbl:         { fontSize: 11, color: COLORS.gray400, textAlign: 'center' },
  orderCard:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  orderLeft:       { flex: 1 },
  orderBuyer:      { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  orderEmail:      { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  orderDate:       { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  orderRight:      { alignItems: 'flex-end', gap: 6 },
  orderTotal:      { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  orderStatus:     { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  orderStatusTxt:  { fontSize: 11, fontWeight: FONT.bold },
  tipCard:         { flexDirection: 'row', gap: 12, backgroundColor: COLORS.primaryLight, marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.lg },
  tipIcon:         { fontSize: 24 },
  tipTitle:        { fontSize: 13, fontWeight: FONT.black, color: COLORS.primaryDark, marginBottom: 4 },
  tipTxt:          { fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  fab:             { position: 'absolute', right: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 20, paddingVertical: 14, ...SHADOW.strong },
  fabTxt:          { color: COLORS.white, fontWeight: FONT.black, fontSize: 14 },
  // ── ESTADOS PENDING/REJECTED ──
  statusWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, paddingTop: 40 },
  statusTitle:     { fontSize: 19, fontWeight: FONT.black, color: COLORS.gray800, textAlign: 'center', marginBottom: 10 },
  statusSub:       { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  statusCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, width: '100%', borderWidth: 0.5, borderColor: COLORS.border, marginBottom: SPACING.md, ...SHADOW.card },
  statusLogoImg:   { width: 52, height: 52, borderRadius: RADIUS.lg },
  statusCardName:  { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 2 },
  statusCardSub:   { fontSize: 12, color: COLORS.gray400, marginBottom: 6 },
  statusBadgePending: { backgroundColor: COLORS.amberLight, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusBadgeTxt:  { fontSize: 11, color: COLORS.amber, fontWeight: FONT.bold },
  statusInfoCard:  { backgroundColor: COLORS.blueLight, borderRadius: RADIUS.lg, padding: SPACING.md, width: '100%', marginBottom: SPACING.lg },
  statusInfoTxt:   { fontSize: 12, color: COLORS.blue, lineHeight: 18 },
  statusEditBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center', ...SHADOW.strong },
  statusEditBtnTxt:{ color: '#fff', fontSize: 14, fontWeight: FONT.black },
  rejectionCard:   { backgroundColor: '#FFF5F5', borderRadius: RADIUS.lg, padding: SPACING.lg, width: '100%', marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#FFD0D0' },
  rejectionTitle:  { fontSize: 13, fontWeight: FONT.black, color: COLORS.red, marginBottom: 6 },
  rejectionTxt:    { fontSize: 13, color: COLORS.gray600, lineHeight: 20 },
});