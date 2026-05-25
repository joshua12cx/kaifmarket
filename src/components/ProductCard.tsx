// src/components/ProductCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

  // ── Determinar si tiene imagen real ──────────────────────────
  const imageUrl = (product as any).image_url || null;

  return (
    <TouchableOpacity style={[s.card, style]} onPress={onPress} activeOpacity={0.9}>

      {/* ── IMAGEN ── */}
      <View style={[s.imgArea, { backgroundColor: product.bgColor || '#F5F5F5' }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={s.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={s.emoji}>{product.emoji || '📦'}</Text>
        )}

        {/* Descuento */}
        {disc && (
          <View style={s.discBadge}>
            <Text style={s.discTxt}>-{disc}%</Text>
          </View>
        )}

        {/* Tag */}
        {product.tag && !disc && (
          <View style={[s.tagBadge, {
            backgroundColor:
              product.tag === 'hot'  ? COLORS.primary :
              product.tag === 'new'  ? COLORS.black   : COLORS.amber,
          }]}>
            <Text style={s.tagTxt}>
              {product.tag === 'hot'  ? '🔥 Top'    :
               product.tag === 'new'  ? '✨ Nuevo'   : '🏷️ Oferta'}
            </Text>
          </View>
        )}

        {/* Sin stock */}
        {(product as any).stock === 0 && (
          <View style={s.outOfStock}>
            <Text style={s.outOfStockTxt}>Agotado</Text>
          </View>
        )}

        {/* Premium */}
        {product.isPremiumSeller && (
          <View style={s.premBadge}>
            <Text style={s.premTxt}>★ PRO</Text>
          </View>
        )}

        {/* Favorito */}
        <TouchableOpacity style={s.favBtn} onPress={() => toggle(product.id)}>
          <Text style={{ fontSize: 18 }}>{isFav(product.id) ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── INFO ── */}
      <View style={s.info}>
        <View style={s.priceRow}>
          <Text style={s.price}>S/ {product.price}</Text>
          {product.oldPrice && (
            <Text style={s.oldPrice}>S/ {product.oldPrice}</Text>
          )}
        </View>

        <Text style={s.name} numberOfLines={2}>{product.name}</Text>

        <View style={s.ratingRow}>
          <Text style={s.stars}>★ {product.rating}</Text>
          <Text style={s.sold}>
            {' · '}{product.sold > 999
              ? `${(product.sold / 1000).toFixed(1)}K`
              : product.sold} vendidos
          </Text>
        </View>

        <TouchableOpacity
          style={[
            s.cartBtn,
            inCart && s.cartBtnActive,
            (product as any).stock === 0 && s.cartBtnDisabled,
          ]}
          onPress={() => {
            if ((product as any).stock !== 0) {
              dispatch({ type: 'ADD', id: product.id });
            }
          }}
          activeOpacity={0.8}
          disabled={(product as any).stock === 0}>
          <Text style={[s.cartBtnTxt, inCart && s.cartBtnTxtActive]}>
            {(product as any).stock === 0
              ? 'Agotado'
              : inCart ? '✓  En carrito' : '🛒  Al carrito'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:            { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  imgArea:         { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  productImage:    { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  emoji:           { fontSize: 56 },
  discBadge:       { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt:         { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  tagBadge:        { position: 'absolute', top: 8, left: 8, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt:          { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  outOfStock:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 4, alignItems: 'center' },
  outOfStockTxt:   { color: '#fff', fontSize: 11, fontWeight: FONT.black },
  premBadge:       { position: 'absolute', top: 8, right: 34, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  premTxt:         { color: COLORS.black, fontSize: 9, fontWeight: FONT.black },
  favBtn:          { position: 'absolute', top: 6, right: 6, padding: 3 },
  info:            { padding: SPACING.sm },
  priceRow:        { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 },
  price:           { fontSize: 16, fontWeight: FONT.black, color: COLORS.black },
  oldPrice:        { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name:            { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginBottom: 4 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stars:           { fontSize: 11, color: '#F5A623', fontWeight: FONT.bold },
  sold:            { fontSize: 11, color: COLORS.gray400 },
  cartBtn:         { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  cartBtnActive:   { backgroundColor: COLORS.primary },
  cartBtnDisabled: { backgroundColor: COLORS.gray200 },
  cartBtnTxt:      { fontSize: 12, fontWeight: FONT.black, color: COLORS.black },
  cartBtnTxtActive:{ color: '#fff' },
});