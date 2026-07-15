// src/screens/CartScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShoppingCart, Trash2, MapPin, Tag, Sparkles, ChevronRight,
  Minus, Plus, ArrowRight, Star, Package,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useCart } from '../context';
import { supabase } from '../lib/supabase';

export default function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, dispatch } = useCart();
  const [couponApplied, setCouponApplied] = useState(false);
  const [expresss, setExpress] = useState(false);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // ── Cargar SOLO productos reales de Supabase (sin data sintética) ──
  const ids = Object.keys(items).filter(id => items[id] > 0);
  const idsKey = ids.slice().sort().join(',');

  const loadProducts = useCallback(async () => {
    if (ids.length === 0) { setProducts({}); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', ids);

      if (__DEV__) { console.log('[CART] loadProducts:', { count: data?.length, error }); }

      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => { map[p.id] = p; });
      setProducts(map);
    } catch (e) {
      if (__DEV__) { console.log('[CART] loadProducts error:', e); }
    } finally {
      setLoading(false);
    }
  }, [idsKey]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const cartEntries = ids
    .map(id => {
      const product = products[id];
      if (!product) { return null; }
      return { product, qty: items[id], id };
    })
    .filter(Boolean) as { product: any; qty: number; id: string }[];

  const subtotal = cartEntries.reduce((s, e) => s + e.product.price * e.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const delivery = expresss ? 8 : 0;
  const total = subtotal - discount + delivery;

  // ── Cargando ─────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[cs.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Carrito vacío ─────────────────────────────────────────────
  if (cartEntries.length === 0) {
    return (
      <View style={[cs.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <View style={cs.header}>
          <Text style={cs.headerTitle}>Mi Carrito</Text>
          <Text style={cs.headerCount}>0 items</Text>
        </View>
        <View style={cs.empty}>
          <View style={cs.emptyIconWrap}>
            <ShoppingCart size={40} color={COLORS.gray600} strokeWidth={1.5} />
          </View>
          <Text style={cs.emptyTitle}>Carrito vacío</Text>
          <Text style={cs.emptySub}>Agrega productos para comenzar</Text>
          <TouchableOpacity
            style={cs.emptyBtn}
            onPress={() => navigation.navigate('HomeMain')}>
            <Text style={cs.emptyBtnTxt}>Explorar productos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[cs.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* ── HEADER ── */}
      <View style={cs.header}>
        <Text style={cs.headerTitle}>Mi Carrito</Text>
        <TouchableOpacity style={cs.clearBtn} onPress={() => dispatch({ type: 'CLEAR' })}>
          <Trash2 size={14} color={COLORS.gray400} strokeWidth={2} />
          <Text style={cs.clearTxt}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: SPACING.md }}>

        {/* ── ITEMS ── */}
        <View style={cs.itemsCard}>
          {cartEntries.map(({ product, qty, id }, idx) => {
            const oldPrice = product.old_price;
            const disc = oldPrice
              ? Math.round(((oldPrice - product.price) / oldPrice) * 100)
              : null;

            return (
              <View key={id}>
                <View style={cs.item}>
                  <TouchableOpacity
                    style={cs.itemImg}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}>
                    {product.image_url ? (
                      <Image source={{ uri: product.image_url }} style={cs.itemImgReal} resizeMode="cover" />
                    ) : (
                      <Package size={28} color={COLORS.gray600} strokeWidth={1.5} />
                    )}
                    {disc && (
                      <View style={cs.itemDisc}>
                        <Text style={cs.itemDiscTxt}>-{disc}%</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={cs.itemInfo}>
                    <Text style={cs.itemName} numberOfLines={2}>{product.name}</Text>
                    {product.is_premium && (
                      <View style={cs.premBadge}>
                        <Star size={10} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                        <Text style={cs.premBadgeTxt}>Vendedor Premium</Text>
                      </View>
                    )}
                    <View style={cs.itemPriceRow}>
                      <Text style={cs.itemPrice}>S/ {product.price * qty}</Text>
                      {oldPrice && <Text style={cs.itemOldPrice}>S/ {oldPrice * qty}</Text>}
                    </View>

                    <View style={cs.qtyRow}>
                      <TouchableOpacity style={cs.qtyBtn} onPress={() => dispatch({ type: 'DECREMENT', id })}>
                        <Minus size={14} color={COLORS.white} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={cs.qtyNum}>{qty}</Text>
                      <TouchableOpacity style={cs.qtyBtn} onPress={() => dispatch({ type: 'INCREMENT', id })}>
                        <Plus size={14} color={COLORS.white} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity style={cs.deleteBtn} onPress={() => dispatch({ type: 'REMOVE', id })}>
                        <Trash2 size={16} color={COLORS.red} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {idx < cartEntries.length - 1 && <View style={cs.divider} />}
              </View>
            );
          })}
        </View>

        {/* ── ENTREGA ── */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>Entrega</Text>
          <TouchableOpacity
            style={[cs.deliveryOpt, !expresss && cs.deliveryOptActive]}
            onPress={() => setExpress(false)}>
            <View style={[cs.radio, !expresss && cs.radioActive]} />
            <View style={{ flex: 1 }}>
              <Text style={cs.deliveryLabel}>Estándar · Gratis</Text>
              <Text style={cs.deliveryDate}>Mañana, 9:00–18:00</Text>
            </View>
            {!expresss && <Text style={cs.freeTag}>Gratis</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[cs.deliveryOpt, expresss && cs.deliveryOptActive]}
            onPress={() => setExpress(true)}>
            <View style={[cs.radio, expresss && cs.radioActive]} />
            <View style={{ flex: 1 }}>
              <Text style={cs.deliveryLabel}>Exprés · S/ 8</Text>
              <Text style={cs.deliveryDate}>Hoy, 14:00–18:00</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={cs.addressRow}>
            <MapPin size={16} color={COLORS.primary} strokeWidth={2} />
            <Text style={cs.addressTxt}>Miraflores, Lima · Agregar dirección exacta</Text>
            <ChevronRight size={16} color={COLORS.gray400} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── CUPÓN ── */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>Promociones</Text>
          <TouchableOpacity
            style={[cs.couponRow, couponApplied && cs.couponRowActive]}
            onPress={() => setCouponApplied(v => !v)}>
            <Tag size={18} color={couponApplied ? COLORS.green : COLORS.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={cs.couponLabel}>
                {couponApplied ? 'KAIF10 aplicado — −10%' : 'Aplicar cupón KAIF10'}
              </Text>
              <Text style={cs.couponSub}>
                {couponApplied ? `Ahorras S/ ${discount}` : 'Toca para aplicar 10% de descuento'}
              </Text>
            </View>
            <Text style={{ color: couponApplied ? COLORS.green : COLORS.primary, fontWeight: FONT.bold }}>
              {couponApplied ? 'Quitar' : 'Aplicar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── PLUS HINT ── */}
        <TouchableOpacity style={cs.plusHint} onPress={() => navigation.navigate('Profile')}>
          <View style={cs.plusHintIconWrap}>
            <Sparkles size={18} color={COLORS.gold} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cs.plusHintTitle}>Con Kaif Plus ahorras S/ {Math.round(total * 0.02)} extra</Text>
            <Text style={cs.plusHintSub}>2% cashback en cada compra · S/ 19.90/mes</Text>
          </View>
          <ChevronRight size={18} color={COLORS.gold} strokeWidth={2} />
        </TouchableOpacity>

        {/* ── RESUMEN ── */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>Resumen</Text>
          <View style={cs.sumRow}>
            <Text style={cs.sumLabel}>Productos ({cartEntries.reduce((s, e) => s + e.qty, 0)})</Text>
            <Text style={cs.sumVal}>S/ {subtotal}</Text>
          </View>
          <View style={cs.sumRow}>
            <Text style={cs.sumLabel}>Envío</Text>
            <Text style={[cs.sumVal, !expresss && { color: COLORS.green }]}>
              {expresss ? `S/ ${delivery}` : 'Gratis'}
            </Text>
          </View>
          {couponApplied && (
            <View style={cs.sumRow}>
              <Text style={cs.sumLabel}>Descuento KAIF10</Text>
              <Text style={[cs.sumVal, { color: COLORS.red }]}>−S/ {discount}</Text>
            </View>
          )}
          <View style={[cs.sumRow, { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 0.5, borderTopColor: COLORS.gray800 }]}>
            <Text style={cs.totalLabel}>Total</Text>
            <Text style={cs.totalVal}>S/ {total}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={[cs.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={cs.bottomLabel}>Total del pedido</Text>
          <Text style={cs.bottomTotal}>S/ {total}</Text>
        </View>
        <TouchableOpacity
          style={cs.confirmBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.85}>
          <Text style={cs.confirmBtnTxt}>Ir al pago</Text>
          <ArrowRight size={16} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.black },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  headerTitle:   { fontSize: 20, fontWeight: FONT.black, color: COLORS.white },
  headerCount:   { fontSize: 13, color: COLORS.gray400 },
  clearBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clearTxt:      { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.bold },

  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: FONT.black, color: COLORS.white, marginBottom: 8 },
  emptySub:      { fontSize: 14, color: COLORS.gray400, textAlign: 'center', marginBottom: 24 },
  emptyBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 32, paddingVertical: 14 },
  emptyBtnTxt:   { color: '#fff', fontWeight: FONT.black, fontSize: 15 },

  itemsCard:     { backgroundColor: COLORS.blackSoft, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden' },
  item:          { flexDirection: 'row', gap: 12, padding: SPACING.lg, alignItems: 'flex-start' },
  itemImg:       { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: COLORS.gray800, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, overflow: 'hidden' },
  itemImgReal:   { width: 72, height: 72 },
  itemDisc:      { position: 'absolute', top: 4, left: 4, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 4, paddingVertical: 2 },
  itemDiscTxt:   { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  itemInfo:      { flex: 1 },
  itemName:      { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.white, lineHeight: 18, marginBottom: 4 },
  premBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: COLORS.gold + '22', borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  premBadgeTxt:  { fontSize: 10, color: COLORS.gold, fontWeight: FONT.bold },
  itemPriceRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  itemPrice:     { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  itemOldPrice:  { fontSize: 12, color: COLORS.gray400, textDecorationLine: 'line-through' },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn:        { width: 30, height: 30, borderRadius: RADIUS.sm, backgroundColor: COLORS.gray800, alignItems: 'center', justifyContent: 'center' },
  qtyNum:        { fontSize: 15, fontWeight: FONT.black, color: COLORS.white, minWidth: 26, textAlign: 'center' },
  deleteBtn:     { marginLeft: 8, padding: 4 },
  divider:       { height: 0.5, backgroundColor: COLORS.gray800, marginHorizontal: SPACING.lg },

  card:          { backgroundColor: COLORS.blackSoft, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg },
  cardTitle:     { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginBottom: 12 },
  deliveryOpt:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.gray800, marginBottom: 8 },
  deliveryOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  radio:         { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.gray800 },
  radioActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  deliveryLabel: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  deliveryDate:  { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  freeTag:       { color: COLORS.green, fontSize: 13, fontWeight: FONT.bold },
  addressRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addressTxt:    { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: FONT.semibold },

  couponRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.gray800 },
  couponRowActive: { borderColor: COLORS.green, backgroundColor: COLORS.green + '15' },
  couponLabel:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  couponSub:     { fontSize: 12, color: COLORS.gray400, marginTop: 2 },

  plusHint:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#3A2E0A', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.gold + '30' },
  plusHintIconWrap:  { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.gold + '22', alignItems: 'center', justifyContent: 'center' },
  plusHintTitle:     { fontSize: 13, fontWeight: FONT.black, color: COLORS.gold },
  plusHintSub:       { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  sumRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sumLabel:      { fontSize: 14, color: COLORS.gray400 },
  sumVal:        { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  totalLabel:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  totalVal:      { fontSize: 20, fontWeight: FONT.black, color: COLORS.primary },

  bottomBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 16, padding: SPACING.lg, backgroundColor: COLORS.blackSoft, borderTopWidth: 0.5, borderTopColor: COLORS.gray800 },
  bottomLabel:   { fontSize: 12, color: COLORS.gray400 },
  bottomTotal:   { fontSize: 20, fontWeight: FONT.black, color: COLORS.white },
  confirmBtn:    { flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmBtnTxt: { fontSize: 15, fontWeight: FONT.black, color: COLORS.white },
});