// src/components/ProductCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT, SHADOW } from '../theme';
import { Product } from '../data';
import { useCart, useFavs } from '../context';

export default function ProductCard({ product, onPress, style }: {
  product: Product;
  onPress: () => void;
  style?: object;
}) {
  const { items, dispatch } = useCart();
  const { isFav, toggle }   = useFavs();

  const inCart = (items[product.id] || 0) > 0;
  const disc   = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

  return (
    <TouchableOpacity style={[s.card, style]} onPress={onPress} activeOpacity={0.9}>

      {/* ── IMAGEN ── */}
      <View style={[s.imgArea, { backgroundColor: product.bgColor }]}>
        <Text style={s.emoji}>{product.emoji}</Text>

        {/* Badge descuento */}
        {disc && (
          <View style={s.discBadge}>
            <Text style={s.discTxt}>-{disc}%</Text>
          </View>
        )}

        {/* Badge tag */}
        {product.tag && !disc && (
          <View style={[s.tagBadge, { backgroundColor: product.tag === 'hot' ? COLORS.red : COLORS.primary }]}>
            <Text style={s.tagTxt}>
              {product.tag === 'hot' ? '🔥 Top' : product.tag === 'new' ? '✨ Nuevo' : '🏷️ Oferta'}
            </Text>
          </View>
        )}

        {/* Premium badge */}
        {product.isPremiumSeller && (
          <View style={s.premBadge}>
            <Text style={s.premTxt}>★</Text>
          </View>
        )}

        {/* Favorito */}
        <TouchableOpacity style={s.favBtn} onPress={() => toggle(product.id)}>
          <Text style={{ fontSize: 18 }}>{isFav(product.id) ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── INFO ── */}
      <View style={s.info}>
        {/* Precio */}
        <View style={s.priceRow}>
          <Text style={s.price}>S/ {product.price}</Text>
          {product.oldPrice && (
            <Text style={s.oldPrice}>S/ {product.oldPrice}</Text>
          )}
        </View>

        {/* Nombre */}
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>

        {/* Rating */}
        <View style={s.ratingRow}>
          <Text style={s.stars}>★ {product.rating}</Text>
          <Text style={s.sold}>
            {' · '}{product.sold > 999 ? `${(product.sold / 1000).toFixed(1)}K` : product.sold} vendidos
          </Text>
        </View>

        {/* Botón carrito */}
        <TouchableOpacity
          style={[s.cartBtn, inCart && s.cartBtnActive]}
          onPress={() => dispatch({ type: 'ADD', id: product.id })}
          activeOpacity={0.8}>
          <Text style={[s.cartBtnTxt, inCart && s.cartBtnTxtActive]}>
            {inCart ? '✓  En carrito' : '🛒  Al carrito'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:        { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  imgArea:     { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji:       { fontSize: 56 },
  discBadge:   { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt:     { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  tagBadge:    { position: 'absolute', top: 8, left: 8, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt:      { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  premBadge:   { position: 'absolute', top: 8, right: 34, backgroundColor: '#FFD700', borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  premTxt:     { color: COLORS.gray800, fontSize: 9, fontWeight: FONT.black },
  favBtn:      { position: 'absolute', top: 6, right: 6, padding: 3 },
  info:        { padding: SPACING.sm },
  priceRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 },
  price:       { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  oldPrice:    { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name:        { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginBottom: 4 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stars:       { fontSize: 11, color: '#F5A623', fontWeight: FONT.bold },
  sold:        { fontSize: 11, color: COLORS.gray400 },
  cartBtn:     { backgroundColor: '#FFD700', borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  cartBtnActive: { backgroundColor: COLORS.primary },
  cartBtnTxt:  { fontSize: 12, fontWeight: FONT.black, color: COLORS.gray800 },
  cartBtnTxtActive: { color: '#fff' },
});
