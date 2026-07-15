// src/screens/SellerTiendaScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, Switch,
  StyleSheet, ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star, ChevronRight, Store, Clock, Truck, Package2,
  Users, MessageSquare, Award,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase, Seller } from '../lib/supabase';
import { useAuth } from '../context';
import LinearGradient from 'react-native-linear-gradient';

// NOTA: "Horarios de atención", "Política de envíos" y "Política de
// devoluciones" no existen todavía como columnas en `sellers` — por
// ahora son un aviso "muy pronto". "Modo vacaciones" sí asume una
// columna nueva `on_vacation` (boolean) — hay que agregarla:
//   ALTER TABLE sellers ADD COLUMN IF NOT EXISTS on_vacation boolean DEFAULT false;

type Stats = { ventas: number; pedidos: number; reseñas: number };

export default function SellerTiendaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading]   = useState(true);
  const [seller, setSeller]     = useState<Seller | null>(null);
  const [stats, setStats]       = useState<Stats>({ ventas: 0, pedidos: 0, reseñas: 0 });
  const [productCount, setProductCount] = useState(0);
  const [onVacation, setOnVacation]     = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) { return; }
    try {
      const { data: sellerRow } = await supabase
        .from('sellers').select('*').eq('user_id', user.id).single();
      if (!sellerRow) { setLoading(false); return; }
      setSeller(sellerRow as Seller);
      setOnVacation(!!(sellerRow as any).on_vacation);

      const { count: prodCount } = await supabase
        .from('products').select('id', { count: 'exact', head: true }).eq('seller_id', sellerRow.id);
      setProductCount(prodCount || 0);

      const { data: prodIds } = await supabase
        .from('products').select('id').eq('seller_id', sellerRow.id);
      const pIds = (prodIds || []).map((p: any) => p.id);

      if (pIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items').select('order_id, qty, price').in('product_id', pIds);
        const rows = items || [];
        const ventas = rows.reduce((s: number, r: any) => s + Number(r.price) * r.qty, 0);
        const pedidos = new Set(rows.map((r: any) => r.order_id)).size;

        const { count: reviewCount } = await supabase
          .from('reviews').select('id', { count: 'exact', head: true }).in('product_id', pIds);

        setStats({ ventas, pedidos, reseñas: reviewCount || 0 });
      }
    } catch (e) {
      if (__DEV__) { console.log('[SELLER_TIENDA] load error:', e); }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const toggleVacation = async (value: boolean) => {
    setOnVacation(value);
    if (!seller) { return; }
    const { error } = await supabase
      .from('sellers').update({ on_vacation: value } as any).eq('id', seller.id);
    if (error) {
      setOnVacation(!value);
      Alert.alert('Error', 'No se pudo cambiar el modo vacaciones. Puede que falte la columna "on_vacation" en tu base de datos.');
    }
  };

  const stub = (title: string) => Alert.alert(title, 'Esta sección todavía está en desarrollo.');

  if (loading) {
    return (
      <View style={[t.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  const initials = (seller?.name || 'T').charAt(0).toUpperCase();

  const MENU = [
    { icon: Store,          title: 'Perfil de tienda',       sub: 'Logo, ubicación, categoría',      onPress: () => navigation.navigate('SellerEditStore', { seller }) },
    { icon: Clock,          title: 'Horarios de atención',   sub: 'Próximamente',                    onPress: () => stub('Horarios de atención') },
    { icon: Truck,          title: 'Política de envíos',     sub: 'Próximamente',                    onPress: () => stub('Política de envíos') },
    { icon: Package2,       title: 'Política de devoluciones', sub: 'Próximamente',                  onPress: () => stub('Política de devoluciones') },
    { icon: Users,          title: 'Seguidores y clientes',  sub: `${seller?.followers || 0} seguidores`, onPress: () => stub('Seguidores y clientes') },
    { icon: MessageSquare,  title: 'Reseñas y calificaciones', sub: `${stats.reseñas} reseñas · Promedio ${Number(seller?.rating || 5).toFixed(1)}`, onPress: () => stub('Reseñas y calificaciones') },
  ];

  return (
    <View style={[t.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── HEADER TIENDA ── */}
        {seller?.is_premium ? (
          <LinearGradient
            colors={['#E5A623', '#6B4E0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={t.storeHeader}>
            <View style={t.avatar}>
              {seller?.logo_url ? (
                <Image source={{ uri: seller.logo_url }} style={t.avatarImg} />
              ) : (
                <Text style={t.avatarTxt}>{initials}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={t.nameRow}>
                <Text style={t.storeName}>{seller?.name || 'Mi Tienda'}</Text>
                <View style={t.plusBadge}><Text style={t.plusBadgeTxt}>PLUS</Text></View>
              </View>
              <View style={t.metaRow}>
                <Star size={12} color={COLORS.white} fill={COLORS.white} strokeWidth={0} />
                <Text style={t.metaTxtPlus}>{Number(seller?.rating || 5).toFixed(1)}</Text>
                <Text style={t.metaDotPlus}>·</Text>
                <Text style={t.metaTxtPlus}>{seller?.followers || 0} seguidores</Text>
                <Text style={t.metaDotPlus}>·</Text>
                <Text style={t.metaTxtPlus}>{productCount} productos</Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={t.storeHeader}>
            <View style={t.avatar}>
              {seller?.logo_url ? (
                <Image source={{ uri: seller.logo_url }} style={t.avatarImg} />
              ) : (
                <Text style={t.avatarTxt}>{initials}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={t.nameRow}>
                <Text style={t.storeName}>{seller?.name || 'Mi Tienda'}</Text>
              </View>
              <View style={t.metaRow}>
                <Star size={12} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                <Text style={t.metaTxt}>{Number(seller?.rating || 5).toFixed(1)}</Text>
                <Text style={t.metaDot}>·</Text>
                <Text style={t.metaTxt}>{seller?.followers || 0} seguidores</Text>
                <Text style={t.metaDot}>·</Text>
                <Text style={t.metaTxt}>{productCount} productos</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── STATS ── */}
        <View style={t.statsRow}>
          <View style={t.statPill}>
            <Text style={[t.statVal, { color: COLORS.gold }]}>S/ {stats.ventas.toFixed(0)}</Text>
            <Text style={t.statLbl}>Ventas</Text>
          </View>
          <View style={t.statPill}>
            <Text style={[t.statVal, { color: COLORS.red }]}>{stats.pedidos}</Text>
            <Text style={t.statLbl}>Pedidos</Text>
          </View>
          <View style={t.statPill}>
            <Text style={[t.statVal, { color: COLORS.gold }]}>{Number(seller?.rating || 5).toFixed(1)}★</Text>
            <Text style={t.statLbl}>Rating</Text>
          </View>
          <View style={t.statPill}>
            <Text style={[t.statVal, { color: COLORS.green }]}>{stats.reseñas}</Text>
            <Text style={t.statLbl}>Reseñas</Text>
          </View>
        </View>

        {/* ── BANNER KAIF PLUS ── */}
        {!seller?.is_premium && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SellerPlus')}>
            <LinearGradient
              colors={['#E5A623', '#8A6410']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={t.plusBanner}>
              <View style={t.plusIconWrap}>
                <Award size={20} color={COLORS.white} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={t.plusBannerTitle}>Kaif Plus Seller</Text>
                <Text style={t.plusBannerSub}>Comisión reducida · Badge premium · Más ventas</Text>
              </View>
              <ChevronRight size={18} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── MENÚ ── */}
        <View style={t.menuCard}>
          {MENU.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={[t.menuRow, i === MENU.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.onPress}
                activeOpacity={0.7}>
                <View style={t.menuIconWrap}>
                  <Icon size={17} color={COLORS.gold} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={t.menuTitle}>{item.title}</Text>
                  <Text style={t.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.gray800} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── MODO VACACIONES ── */}
        <View style={t.vacationCard}>
          <View style={{ flex: 1 }}>
            <Text style={t.vacationTitle}>Modo vacaciones</Text>
            <Text style={t.vacationSub}>
              {onVacation ? 'Tu tienda está oculta temporalmente' : 'Tu tienda está activa y visible'}
            </Text>
          </View>
          <Switch
            value={onVacation}
            onValueChange={toggleVacation}
            trackColor={{ false: COLORS.gray800, true: COLORS.gold }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.gray800}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const t = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.black },
  storeHeader:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  metaTxtPlus:     { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: FONT.semibold },
  metaDotPlus:     { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  avatar:      { width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:   { width: '100%', height: '100%' },
  avatarTxt:   { fontSize: 22, fontWeight: FONT.black, color: COLORS.black },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storeName:   { fontSize: 18, fontWeight: FONT.black, color: COLORS.white },
  plusBadge:   { backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  plusBadgeTxt:{ fontSize: 9, fontWeight: FONT.black, color: COLORS.black },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  metaTxt:     { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },
  metaDot:     { fontSize: 12, color: COLORS.gray800 },

  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  statPill:    { flex: 1, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, paddingVertical: SPACING.sm, alignItems: 'center' },
  statVal:     { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
  statLbl:     { fontSize: 10, color: COLORS.gray400, marginTop: 2 },

  plusBanner:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  plusIconWrap:    { width: 40, height: 40, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  plusBannerTitle: { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
  plusBannerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  menuCard:    { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, marginBottom: SPACING.md, overflow: 'hidden' },
  menuRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  menuIconWrap:{ width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.gold + '22', alignItems: 'center', justifyContent: 'center' },
  menuTitle:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  menuSub:     { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  vacationCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg },
  vacationTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  vacationSub:   { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
});