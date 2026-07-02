// src/components/ProductCard.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent,
} from 'react-native';
import {
  Heart, ShoppingCart, Check, Star, Flame, Sparkles, Tag, Package,
} from 'lucide-react-native';
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

  const [imgWidth,  setImgWidth]  = useState(0);
  const [activeImg, setActiveImg] = useState(0);

  // ── Recolectar hasta 3 imágenes reales ────────────────────────
  const images = [
    (product as any).image_url,
    (product as any).image_url_2,
    (product as any).image_url_3,
  ].filter((url): url is string => !!url && url.trim().length > 0);

  const hasImages = images.length > 0;

  const onImgLayout = (e: LayoutChangeEvent) => {
    setImgWidth(e.nativeEvent.layout.width);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (imgWidth === 0) { return; }
    const idx = Math.round(e.nativeEvent.contentOffset.x / imgWidth);
    setActiveImg(idx);
  };

  return (
    <TouchableOpacity style={[s.card, style]} onPress={onPress} activeOpacity={0.9}>

      {/* ── IMAGEN ── */}
      <View
        style={[s.imgArea, { backgroundColor: hasImages ? COLORS.gray200 : (product.bgColor || COLORS.gray100) }]}
        onLayout={onImgLayout}>
        {hasImages ? (
          images.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              style={s.imgScroll}>
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width: imgWidth, height: '100%' }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <Image source={{ uri: images[0] }} style={s.productImage} resizeMode="cover" />
          )
        ) : (
          <Package size={44} color={COLORS.gray400} strokeWidth={1.5} />
        )}

        {/* Dots del slider */}
        {images.length > 1 && (
          <View style={s.imgDots}>
            {images.map((_, i) => (
              <View key={i} style={[s.imgDot, i === activeImg && s.imgDotActive]} />
            ))}
          </View>
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
              product.tag === 'hot'  ? COLORS.primary   :
              product.tag === 'new'  ? COLORS.blackSoft : COLORS.amber,
          }]}>
            {product.tag === 'hot'  ? <Flame size={10} color="#fff" strokeWidth={2.5} /> :
             product.tag === 'new'  ? <Sparkles size={10} color="#fff" strokeWidth={2.5} /> :
             <Tag size={10} color="#fff" strokeWidth={2.5} />}
            <Text style={s.tagTxt}>
              {product.tag === 'hot'  ? 'Top'   :
               product.tag === 'new'  ? 'Nuevo' : 'Oferta'}
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
            <Star size={10} color={COLORS.black} fill={COLORS.black} strokeWidth={0} />
            <Text style={s.premTxt}>PRO</Text>
          </View>
        )}

        {/* Favorito */}
        <TouchableOpacity style={s.favBtn} onPress={() => toggle(product.id)}>
          <Heart
            size={16}
            color={isFav(product.id) ? COLORS.primary : COLORS.white}
            fill={isFav(product.id) ? COLORS.primary : 'transparent'}
            strokeWidth={2}
          />
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
          <Star size={11} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
          <Text style={s.stars}>{product.rating}</Text>
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
          {(product as any).stock === 0 ? (
            <Text style={s.cartBtnTxt}>Agotado</Text>
          ) : (
            <View style={s.cartBtnContent}>
              {inCart
                ? <Check size={14} color="#fff" strokeWidth={2.5} />
                : <ShoppingCart size={14} color={COLORS.black} strokeWidth={2} />}
              <Text style={[s.cartBtnTxt, inCart && s.cartBtnTxtActive]}>
                {inCart ? 'En carrito' : 'Al carrito'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:            { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  imgArea:         { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  imgScroll:       { width: '100%', height: '100%' },
  productImage:    { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  imgDots:         { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  imgDot:          { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.6)' },
  imgDotActive:    { backgroundColor: COLORS.white, width: 14 },
  discBadge:       { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt:         { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  tagBadge:        { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt:          { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  outOfStock:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 4, alignItems: 'center' },
  outOfStockTxt:   { color: '#fff', fontSize: 11, fontWeight: FONT.black },
  premBadge:       { position: 'absolute', top: 8, right: 34, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  premTxt:         { color: COLORS.black, fontSize: 9, fontWeight: FONT.black },
  favBtn:          { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  info:            { padding: SPACING.sm },
  priceRow:        { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 },
  price:           { fontSize: 16, fontWeight: FONT.black, color: COLORS.black },
  oldPrice:        { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name:            { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginBottom: 4 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  stars:           { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.bold },
  sold:            { fontSize: 11, color: COLORS.gray400 },
  cartBtn:         { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  cartBtnActive:   { backgroundColor: COLORS.primary },
  cartBtnDisabled: { backgroundColor: COLORS.gray200 },
  cartBtnContent:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartBtnTxt:      { fontSize: 12, fontWeight: FONT.black, color: COLORS.black },
  cartBtnTxtActive:{ color: '#fff' },
});