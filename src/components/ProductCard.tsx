// src/components/ProductCard.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent,
} from 'react-native';
import {
  Heart, Star, Plus, Minus, ShoppingCart, Package,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, FONT } from '../theme';
import { Product, CATEGORIES } from '../data';
import { useCart, useFavs } from '../context';

// ── Metadata visual por tipo de tag ────────────────────────────
// 'top' es nuevo (no estaba en el modelo original) — lo agrego
// porque tu diseño lo pide como badge propio, distinto de 'hot'.
const TAG_META: Record<string, { label: string; color: string }> = {
  hot:  { label: 'HOT',  color: '#EA580C' },
  new:  { label: 'NUEVO', color: COLORS.green },
  top:  { label: 'TOP',  color: COLORS.gold },
};

export default function ProductCard({ product, onPress, style }: {
  product: Product;
  onPress: () => void;
  style?: object;
}) {
  const { items, dispatch } = useCart();
  const { isFav, toggle }   = useFavs();
  const qty = items[product.id] || 0;

  const oldPrice = (product as any).oldPrice ?? (product as any).old_price ?? null;
  const disc     = oldPrice ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : null;
  const stock    = (product as any).stock;

  const [imgWidth,  setImgWidth]  = useState(0);
  const [activeImg, setActiveImg] = useState(0);

  const images = [
    (product as any).image_url,
    (product as any).image_url_2,
    (product as any).image_url_3,
  ].filter((url): url is string => !!url && url.trim().length > 0);

  const hasImages = images.length > 0;

  const onImgLayout = (e: LayoutChangeEvent) => setImgWidth(e.nativeEvent.layout.width);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (imgWidth === 0) { return; }
    setActiveImg(Math.round(e.nativeEvent.contentOffset.x / imgWidth));
  };

  // Badge de categoría/tipo: prioridad tag conocido → si no, 'OFERTA' si tiene descuento
  const tagKey  = (product as any).tag as string | undefined;
  const tagMeta = tagKey && TAG_META[tagKey] ? TAG_META[tagKey] : (disc ? { label: 'OFERTA', color: COLORS.red } : null);

  const categoryLabel = CATEGORIES.find(
    c => c.id === ((product as any).category_id || (product as any).category),
  )?.label;

  return (
    <TouchableOpacity style={[s.card, style]} onPress={onPress} activeOpacity={0.9}>

      {/* ── IMAGEN ── */}
      <View
        style={[s.imgArea, { backgroundColor: hasImages ? COLORS.gray800 : ((product as any).bgColor || (product as any).bg_color || COLORS.gray800) }]}
        onLayout={onImgLayout}>
        {hasImages ? (
          images.length > 1 ? (
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onScroll={onScroll} scrollEventThrottle={16} style={s.imgScroll}>
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={{ width: imgWidth, height: '100%' }} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <Image source={{ uri: images[0] }} style={s.productImage} resizeMode="cover" />
          )
        ) : (
          <Package size={44} color={COLORS.gray600} strokeWidth={1.5} />
        )}

        {images.length > 1 && (
          <View style={s.imgDots}>
            {images.map((_, i) => (
              <View key={i} style={[s.imgDot, i === activeImg && s.imgDotActive]} />
            ))}
          </View>
        )}

        {/* ── Badge combinado: categoría/tipo + descuento ── */}
        {(tagMeta || disc) && (
          <View style={s.badgeRow}>
            {tagMeta && (
              <View style={[s.badgePill, { backgroundColor: tagMeta.color }]}>
                <Text style={s.badgeTxt}>{tagMeta.label}</Text>
              </View>
            )}
            {disc ? (
              <View style={[s.badgePill, s.badgeDisc]}>
                <Text style={s.badgeTxt}>-{disc}%</Text>
              </View>
            ) : null}
          </View>
        )}

        {stock === 0 && (
          <View style={s.outOfStock}>
            <Text style={s.outOfStockTxt}>Agotado</Text>
          </View>
        )}

        {(product as any).isPremiumSeller && (
          <View style={s.premBadge}>
            <Star size={10} color={COLORS.black} fill={COLORS.black} strokeWidth={0} />
            <Text style={s.premTxt}>PRO</Text>
          </View>
        )}

        <TouchableOpacity style={s.favBtn} onPress={() => toggle(product.id)}>
          <Heart
            size={16}
            color={isFav(product.id) ? COLORS.red : COLORS.white}
            fill={isFav(product.id) ? COLORS.red : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* ── INFO ── */}
      <View style={s.info}>
        {categoryLabel && <Text style={s.category}>{categoryLabel}</Text>}

        <Text style={s.name} numberOfLines={2}>{product.name}</Text>

        <View style={s.ratingRow}>
          <Star size={11} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
          <Text style={s.stars}>{product.rating}</Text>
          <Text style={s.sold}>
            {' '}({(product as any).sold > 999 ? `${((product as any).sold / 1000).toFixed(1)}K` : (product as any).sold})
          </Text>
        </View>

        <View style={s.bottomRow}>
          <View>
            <Text style={s.price}>S/ {product.price}</Text>
            {oldPrice ? <Text style={s.oldPrice}>S/ {oldPrice}</Text> : null}
          </View>

          {stock === 0 ? (
            <View style={[s.cartBtn, s.cartBtnDisabled]}>
              <ShoppingCart size={16} color={COLORS.gray600} strokeWidth={2} />
            </View>
          ) : qty === 0 ? (
            <TouchableOpacity
              style={s.cartBtn}
              onPress={() => dispatch({ type: 'ADD', id: product.id })}
              activeOpacity={0.8}>
              <ShoppingCart size={16} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => dispatch({ type: 'DECREMENT', id: product.id })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Minus size={14} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={s.stepperQty}>{qty}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => dispatch({ type: 'INCREMENT', id: product.id })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Plus size={14} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:            { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, overflow: 'hidden' },
  imgArea:         { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  imgScroll:       { width: '100%', height: '100%' },
  productImage:    { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  imgDots:         { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  imgDot:          { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  imgDotActive:    { backgroundColor: COLORS.white, width: 14 },

  badgeRow:        { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 4 },
  badgePill:       { borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 3 },
  badgeDisc:       { backgroundColor: '#7A1515' },
  badgeTxt:        { color: '#fff', fontSize: 9, fontWeight: FONT.black },

  outOfStock:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, alignItems: 'center' },
  outOfStockTxt:   { color: '#fff', fontSize: 11, fontWeight: FONT.black },
  premBadge:       { position: 'absolute', top: 8, right: 34, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  premTxt:         { color: COLORS.black, fontSize: 9, fontWeight: FONT.black },
  favBtn:          { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  info:            { padding: SPACING.sm },
  category:        { fontSize: 10, color: COLORS.primaryMid, fontWeight: FONT.bold, marginBottom: 2, textTransform: 'capitalize' },
  name:            { fontSize: 12, color: COLORS.white, fontWeight: FONT.semibold, lineHeight: 16, marginBottom: 4 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  stars:           { fontSize: 11, color: COLORS.gray200, fontWeight: FONT.bold },
  sold:            { fontSize: 11, color: COLORS.gray400 },

  bottomRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price:           { fontSize: 16, fontWeight: FONT.black, color: COLORS.red },
  oldPrice:        { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through', marginTop: 1 },
  cartBtn:         { width: 34, height: 34, borderRadius: RADIUS.full, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  cartBtnActive:   { backgroundColor: COLORS.green },
  cartBtnDisabled: { backgroundColor: COLORS.gray800 },
  stepper:         { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.red, borderRadius: RADIUS.full, height: 34, paddingHorizontal: 6, gap: 8 },
  stepperBtn:      { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  stepperQty:      { fontSize: 13, fontWeight: FONT.black, color: '#fff', minWidth: 14, textAlign: 'center' },
});