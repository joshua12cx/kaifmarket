// src/screens/CartScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { PRODUCTS } from '../data';
import { useCart } from '../context';
import { supabase } from '../lib/supabase';

export default function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, dispatch } = useCart();
  const [couponApplied, setCouponApplied] = useState(false);
  const [expresss, setExpress] = useState(false);
  const [supabaseProds, setSupabaseProds] = useState<Record<string, any>>({});

  // ── Cargar productos de Supabase si hay IDs string ────────────
  React.useEffect(() => {
    const stringIds = Object.keys(items).filter(id =>
      isNaN(Number(id)) && items[id] > 0
    );
    if (stringIds.length === 0) { return; }

    supabase
      .from('products')
      .select('*')
      .in('id', stringIds)
      .then(({ data }: { data: any[] | null }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((p: any) => { map[p.id] = p; });
          setSupabaseProds(map);
        }
      });
  }, [items]);

  // ── Construir entries mezclando estáticos y Supabase ──────────
  const cartEntries = Object.entries(items)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const isString = isNaN(Number(id));
      const product = isString
        ? supabaseProds[id]
        : PRODUCTS.find(p => p.id === Number(id));
      if (!product) { return null; }
      return {
        product: {
          ...product,
          // Normalizar campos
          bgColor: product.bgColor || product.bg_color || '#F5F5F5',
          oldPrice: product.oldPrice || product.old_price || null,
          imageUrl: product.image_url || null,
          emoji: product.emoji || '📦',
          isPremiumSeller: product.isPremiumSeller || product.is_premium || false,
        },
        qty,
        id,
      };
    })
    .filter(Boolean) as { product: any; qty: number; id: string }[];

  const subtotal = cartEntries.reduce((s, e) => s + e.product.price * e.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const delivery = expresss ? 8 : 0;
  const total = subtotal - discount + delivery;

  // ── Carrito vacío ─────────────────────────────────────────────
  if (cartEntries.length === 0) {
    return (
      <View style={[cs.container, { paddingTop: insets.top }]}>
        <View style={cs.header}>
          <Text style={cs.headerTitle}>Carrito</Text>
        </View>
        <View style={cs.empty}>
          <Text style={cs.emptyEmoji}>🛒</Text>
          <Text style={cs.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={cs.emptySub}>Agrega productos para empezar a comprar</Text>
          <TouchableOpacity
            style={cs.emptyBtn}
            onPress={() => navigation.navigate('HomeMain')}>
            <Text style={cs.emptyBtnTxt}>Ir a la tienda</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[cs.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={cs.header}>
        <Text style={cs.headerTitle}>Carrito</Text>
        <TouchableOpacity onPress={() => dispatch({ type: 'CLEAR' })}>
          <Text style={cs.clearTxt}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}>

        {/* ── ITEMS ── */}
        <View style={cs.itemsCard}>
          {cartEntries.map(({ product, qty, id }, idx) => {
            const disc = product.oldPrice
              ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
              : null;

            return (
              <View key={id}>
                <View style={cs.item}>
                  <View style={cs.checkbox}>
                    <Text style={{ color: COLORS.white, fontSize: 12 }}>✓</Text>
                  </View>

                  {/* Imagen */}
                  <TouchableOpacity
                    style={[cs.itemImg, { backgroundColor: product.bgColor }]}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}>
                    {product.imageUrl ? (
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={cs.itemImgReal}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ fontSize: 36 }}>{product.emoji}</Text>
                    )}
                    {disc && (
                      <View style={cs.itemDisc}>
                        <Text style={cs.itemDiscTxt}>-{disc}%</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Info */}
                  <View style={cs.itemInfo}>
                    <Text style={cs.itemName} numberOfLines={2}>{product.name}</Text>
                    {product.isPremiumSeller && (
                      <View style={cs.premBadge}>
                        <Text style={cs.premBadgeTxt}>★ Vendedor Premium</Text>
                      </View>
                    )}
                    <View style={cs.itemPriceRow}>
                      <Text style={cs.itemPrice}>S/ {product.price * qty}</Text>
                      {product.oldPrice && (
                        <Text style={cs.itemOldPrice}>S/ {product.oldPrice * qty}</Text>
                      )}
                    </View>

                    {/* Cantidad */}
                    <View style={cs.qtyRow}>
                      <TouchableOpacity
                        style={cs.qtyBtn}
                        onPress={() => dispatch({ type: 'DECREMENT', id: product.id })}>
                        <Text style={cs.qtyBtnTxt}>−</Text>
                      </TouchableOpacity>
                      <Text style={cs.qtyNum}>{qty}</Text>
                      <TouchableOpacity
                        style={cs.qtyBtn}
                        onPress={() => dispatch({ type: 'INCREMENT', id: product.id })}>
                        <Text style={cs.qtyBtnTxt}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={cs.deleteBtn}
                        onPress={() => dispatch({ type: 'REMOVE', id: product.id })}>
                        <Text style={{ fontSize: 16 }}>🗑️</Text>
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
            {!expresss && (
              <Text style={{ color: COLORS.green, fontSize: 13, fontWeight: FONT.bold }}>Gratis</Text>
            )}
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
            <Text style={{ fontSize: 16 }}>📍</Text>
            <Text style={cs.addressTxt}>Miraflores, Lima · Agregar dirección exacta</Text>
            <Text style={{ color: COLORS.gray400 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── CUPÓN ── */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>Promociones</Text>
          <TouchableOpacity
            style={[cs.couponRow, couponApplied && cs.couponRowActive]}
            onPress={() => setCouponApplied(v => !v)}>
            <Text style={{ fontSize: 18 }}>🏷️</Text>
            <View style={{ flex: 1 }}>
              <Text style={cs.couponLabel}>
                {couponApplied ? '✓ KAIF10 aplicado — −10%' : 'Aplicar cupón KAIF10'}
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
        <TouchableOpacity
          style={cs.plusHint}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={cs.plusHintIcon}>✦</Text>
          <View style={{ flex: 1 }}>
            <Text style={cs.plusHintTitle}>Con Kaif Plus ahorras S/ {Math.round(total * 0.02)} extra</Text>
            <Text style={cs.plusHintSub}>2% cashback en cada compra · S/ 19.90/mes</Text>
          </View>
          <Text style={{ color: COLORS.primary, fontSize: 16 }}>›</Text>
        </TouchableOpacity>

        {/* ── RESUMEN ── */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>Resumen</Text>
          <View style={cs.sumRow}>
            <Text style={cs.sumLabel}>
              Productos ({cartEntries.reduce((s, e) => s + e.qty, 0)})
            </Text>
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
          <View style={[cs.sumRow, {
            marginTop: SPACING.sm, paddingTop: SPACING.sm,
            borderTopWidth: 0.5, borderTopColor: COLORS.border,
          }]}>
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
          <Text style={cs.confirmBtnTxt}>Finalizar compra →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: FONT.black, color: COLORS.gray800 },
  clearTxt: { fontSize: 14, color: COLORS.red, fontWeight: FONT.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.gray400, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 32, paddingVertical: 14 },
  emptyBtnTxt: { color: '#fff', fontWeight: FONT.black, fontSize: 15 },
  itemsCard: { backgroundColor: COLORS.white, marginBottom: SPACING.sm },
  item: { flexDirection: 'row', gap: 12, padding: SPACING.lg, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 },
  itemImg: { width: 80, height: 80, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, overflow: 'hidden' },
  itemImgReal: { width: 80, height: 80, borderRadius: RADIUS.md },
  itemDisc: { position: 'absolute', top: 4, left: 4, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 4, paddingVertical: 2 },
  itemDiscTxt: { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray800, lineHeight: 18, marginBottom: 4 },
  premBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  premBadgeTxt: { fontSize: 10, color: COLORS.primary, fontWeight: FONT.bold },
  itemPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  itemPrice: { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  itemOldPrice: { fontSize: 12, color: COLORS.gray400, textDecorationLine: 'line-through' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 32, height: 32, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  qtyBtnTxt: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.gray800, lineHeight: 22 },
  qtyNum: { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, minWidth: 28, textAlign: 'center' },
  deleteBtn: { marginLeft: 8, padding: 4 },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginHorizontal: SPACING.lg },
  card: { backgroundColor: COLORS.white, marginBottom: SPACING.sm, padding: SPACING.lg },
  cardTitle: { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 12 },
  deliveryOpt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8 },
  deliveryOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.border },
  radioActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  deliveryLabel: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  deliveryDate: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addressTxt: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: FONT.semibold },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border },
  couponRowActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenLight },
  couponLabel: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  couponSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  plusHint: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primaryLight, marginHorizontal: 0, marginBottom: SPACING.sm, padding: SPACING.lg },
  plusHintIcon: { fontSize: 20, color: COLORS.primary },
  plusHintTitle: { fontSize: 13, fontWeight: FONT.black, color: COLORS.primaryDark },
  plusHintSub: { fontSize: 11, color: COLORS.primary, marginTop: 2 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sumLabel: { fontSize: 14, color: COLORS.gray400 },
  sumVal: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  totalLabel: { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  totalVal: { fontSize: 20, fontWeight: FONT.black, color: COLORS.gray800 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 16, padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, ...SHADOW.strong },
  bottomLabel: { fontSize: 12, color: COLORS.gray400 },
  bottomTotal: { fontSize: 20, fontWeight: FONT.black, color: COLORS.gray800 },
  confirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center' },
  confirmBtnTxt: { fontSize: 15, fontWeight: FONT.black, color: COLORS.white },
});