// src/screens/ProductDetailScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { getProductById } from '../services';
import { Product, Seller, PRODUCTS, SELLERS } from '../data';
import { useCart, useFavs } from '../context';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

// ── Reseñas estáticas ─────────────────────────────────────────────
const REVIEWS = [
  { id: 1, name: 'Carlos M.', avatar: '👨', rating: 5, date: 'hace 2 días', text: 'Excelente producto, llegó rápido y bien empacado. Totalmente recomendado.', likes: 12 },
  { id: 2, name: 'María G.',  avatar: '👩', rating: 4, date: 'hace 5 días', text: 'Muy buena calidad para el precio. El envío fue puntual.', likes: 8 },
  { id: 3, name: 'Pedro R.',  avatar: '🧑', rating: 5, date: 'hace 1 sem',  text: 'Superó mis expectativas. La tienda atiende rápido las consultas.', likes: 5 },
];

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const { items, dispatch } = useCart();
  const { isFav, toggle }   = useFavs();

  const [data, setData]         = useState<(Product & { seller?: Seller }) | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'specs' | 'reviews'>('info');
  const [showCoupon, setShowCoupon] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getProductById(productId).then(d => { setData(d as any); setLoading(false); });
  }, [productId]);

  if (loading || !data) {
    return (
      <View style={[pd.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const p        = data;
  const seller   = data.seller || SELLERS[0];
  const qty      = items[p.id] || 0;
  const inCart   = qty > 0;
  const disc     = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null;
  const related  = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 6);

  // Estrellas
  const renderStars = (n: number) =>
    Array(5).fill(0).map((_, i) => (
      <Text key={i} style={{ color: i < n ? '#F5A623' : COLORS.gray200, fontSize: 14 }}>★</Text>
    ));

  return (
    <View style={[pd.container, { paddingTop: insets.top }]}>

      {/* ── TOP BAR ── */}
      <View style={pd.topBar}>
        <TouchableOpacity style={pd.topBtn} onPress={() => navigation.goBack()}>
          <Text style={pd.topBtnTxt}>‹</Text>
        </TouchableOpacity>
        <View style={pd.topRight}>
          <TouchableOpacity style={pd.topBtn}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pd.topBtn} onPress={() => toggle(p.id)}>
            <Text style={{ fontSize: 18 }}>{isFav(p.id) ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pd.topBtn}>
            <Text style={{ fontSize: 18 }}>↗️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}>

        {/* ── IMAGEN SLIDER ── */}
        <View style={pd.imgWrap}>
          <FlatList
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            data={p.images}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={e => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={[pd.imgSlide, { backgroundColor: p.bgColor }]}>
                <Text style={pd.imgEmoji}>{item}</Text>
              </View>
            )}
          />
          {/* Dots */}
          <View style={pd.imgDots}>
            {p.images.map((_, i) => (
              <View key={i} style={[pd.imgDot, i === activeImg && pd.imgDotActive]} />
            ))}
          </View>
          {/* Descuento badge */}
          {disc && (
            <View style={pd.discBadge}>
              <Text style={pd.discTxt}>-{disc}%</Text>
            </View>
          )}
        </View>

        <View style={pd.body}>

          {/* ── PRECIO Y TÍTULO ── */}
          <View style={pd.priceSection}>
            <View style={pd.priceRow}>
              <Text style={pd.price}>S/ {p.price}</Text>
              {p.oldPrice && <Text style={pd.oldPrice}>S/ {p.oldPrice}</Text>}
              {disc && <Text style={pd.discLabel}>−{disc}%</Text>}
              <TouchableOpacity style={pd.priceArrow}>
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: FONT.bold }}>Ver precio plus ›</Text>
              </TouchableOpacity>
            </View>
            <Text style={pd.productName}>{p.name}</Text>

            {/* Rating row */}
            <View style={pd.ratingRow}>
              <View style={{ flexDirection: 'row' }}>{renderStars(Math.floor(p.rating))}</View>
              <Text style={pd.ratingNum}>{p.rating}</Text>
              <Text style={pd.ratingCount}>({p.reviews} reseñas)</Text>
              <Text style={pd.soldCount}>· {p.sold.toLocaleString()} vendidos</Text>
            </View>
          </View>

          {/* ── CUPÓN ── */}
          {showCoupon && (
            <View style={pd.couponBanner}>
              <Text style={pd.couponBadge}>-5%</Text>
              <View style={{ flex: 1 }}>
                <Text style={pd.couponTitle}>Código KAIF10 para suscriptores</Text>
                <Text style={pd.couponSub}>Válido hasta el 12/11</Text>
              </View>
              <TouchableOpacity style={pd.couponCopy}>
                <Text style={{ fontSize: 16 }}>📋</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCoupon(false)}>
                <Text style={{ color: COLORS.gray400, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ENTREGA ── */}
          <View style={pd.deliveryCard}>
            <Text style={pd.deliveryTitle}>Entrega</Text>
            <View style={pd.deliveryOpts}>
              <View style={[pd.deliveryOpt, { borderColor: COLORS.primary }]}>
                <Text style={pd.deliveryOptLabel}>Kaif Market</Text>
                <Text style={pd.deliveryOptDate}>Mañana, Gratis</Text>
              </View>
              <View style={pd.deliveryOpt}>
                <Text style={pd.deliveryOptLabel}>Exprés</Text>
                <Text style={pd.deliveryOptDate}>Hoy, S/ 8</Text>
              </View>
            </View>
            <TouchableOpacity style={pd.addressRow}>
              <Text style={{ fontSize: 16 }}>📍</Text>
              <Text style={pd.addressTxt}>Miraflores, Lima · Indicar dirección exacta</Text>
              <Text style={{ color: COLORS.gray400 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── TABS ── */}
          <View style={pd.tabs}>
            {(['info', 'specs', 'reviews'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[pd.tab, activeTab === tab && pd.tabActive]}
                onPress={() => setActiveTab(tab)}>
                <Text style={[pd.tabTxt, activeTab === tab && pd.tabTxtActive]}>
                  {tab === 'info' ? 'Descripción' : tab === 'specs' ? 'Características' : 'Reseñas'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── TAB CONTENT ── */}
          {activeTab === 'info' && (
            <View style={pd.tabContent}>
              <Text style={pd.descText}>{p.description}</Text>
            </View>
          )}

          {activeTab === 'specs' && (
            <View style={pd.tabContent}>
              {p.specs.map((spec, i) => {
                const [key, val] = spec.split(': ');
                return (
                  <View key={i} style={[pd.specRow, { backgroundColor: i % 2 === 0 ? COLORS.gray100 : COLORS.white }]}>
                    <Text style={pd.specKey}>{key}</Text>
                    <Text style={pd.specVal}>{val}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={pd.tabContent}>
              {/* Rating summary */}
              <View style={pd.ratingSum}>
                <Text style={pd.ratingSumBig}>{p.rating}</Text>
                <View>
                  <View style={{ flexDirection: 'row', marginBottom: 4 }}>{renderStars(Math.floor(p.rating))}</View>
                  <Text style={{ fontSize: 12, color: COLORS.gray400 }}>{p.reviews} reseñas · {p.sold} vendidos</Text>
                </View>
              </View>
              {/* Review items */}
              {REVIEWS.map(rev => (
                <View key={rev.id} style={pd.reviewCard}>
                  <View style={pd.revHeader}>
                    <Text style={pd.revAvatar}>{rev.avatar}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={pd.revName}>{rev.name}</Text>
                      <View style={{ flexDirection: 'row' }}>{renderStars(rev.rating)}</View>
                    </View>
                    <Text style={pd.revDate}>{rev.date}</Text>
                  </View>
                  <Text style={pd.revText}>{rev.text}</Text>
                  <TouchableOpacity style={pd.revLike}>
                    <Text style={{ fontSize: 14 }}>👍</Text>
                    <Text style={pd.revLikeTxt}>{rev.likes}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── VENDEDOR ── */}
          <TouchableOpacity
            style={pd.sellerCard}
            onPress={() => navigation.navigate('SellerStore', { sellerId: seller.id } as any)}
            activeOpacity={0.85}>
            <View style={pd.sellerHeader}>
              <View style={pd.sellerAvatar}>
                <Text style={{ fontSize: 22 }}>🏪</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={pd.sellerName}>{seller.name}</Text>
                  {seller.verified && <Text style={pd.verifiedBadge}>✓</Text>}
                </View>
                <Text style={pd.sellerSub}>Tienda oficial</Text>
              </View>
              <Text style={{ color: COLORS.gray400, fontSize: 18 }}>›</Text>
            </View>
            <View style={pd.sellerStats}>
              <View style={pd.sellerStat}>
                <Text style={pd.sellerStatVal}>⭐ {seller.rating}</Text>
                <Text style={pd.sellerStatLbl}>Rating</Text>
              </View>
              <View style={pd.sellerStatDiv} />
              <View style={pd.sellerStat}>
                <Text style={pd.sellerStatVal}>25.6K</Text>
                <Text style={pd.sellerStatLbl}>Pedidos</Text>
              </View>
              <View style={pd.sellerStatDiv} />
              <View style={pd.sellerStat}>
                <Text style={pd.sellerStatVal}>4.4K</Text>
                <Text style={pd.sellerStatLbl}>Seguidores</Text>
              </View>
              <View style={pd.sellerStatDiv} />
              <View style={pd.sellerStat}>
                <Text style={pd.sellerStatVal}>3 años</Text>
                <Text style={pd.sellerStatLbl}>En Kaif</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── PRODUCTOS RELACIONADOS ── */}
          {related.length > 0 && (
            <View style={pd.relatedWrap}>
              <Text style={pd.relatedTitle}>También te puede gustar</Text>
              <FlatList
                horizontal showsHorizontalScrollIndicator={false}
                data={related}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={pd.relCard}
                    onPress={() => navigation.replace('ProductDetail', { productId: item.id })}
                    activeOpacity={0.9}>
                    <View style={[pd.relImg, { backgroundColor: item.bgColor }]}>
                      <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
                      {item.oldPrice && (
                        <View style={pd.relDisc}>
                          <Text style={pd.relDiscTxt}>-{Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)}%</Text>
                        </View>
                      )}
                    </View>
                    <View style={pd.relInfo}>
                      <Text style={pd.relPrice}>S/ {item.price}</Text>
                      {item.oldPrice && <Text style={pd.relOld}>S/ {item.oldPrice}</Text>}
                      <Text style={pd.relName} numberOfLines={2}>{item.name}</Text>
                      <Text style={pd.relStars}>★ {item.rating}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={[pd.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {inCart && (
          <View style={pd.qtyRow}>
            <TouchableOpacity style={pd.qtyBtn} onPress={() => dispatch({ type: 'DECREMENT', id: p.id })}>
              <Text style={pd.qtyBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={pd.qtyNum}>{qty}</Text>
            <TouchableOpacity style={pd.qtyBtn} onPress={() => dispatch({ type: 'INCREMENT', id: p.id })}>
              <Text style={pd.qtyBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={pd.buyNowBtn}
          onPress={() => { dispatch({ type: 'ADD', id: p.id }); navigation.navigate('Cart'); }}>
          <Text style={pd.buyNowTxt}>Comprar ahora</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[pd.cartBtn, inCart && { backgroundColor: COLORS.primary }]}
          onPress={() => { if (inCart) navigation.navigate('Cart'); else dispatch({ type: 'ADD', id: p.id }); }}>
          <Text style={[pd.cartBtnTxt, inCart && { color: '#fff' }]}>
            {inCart ? `En carrito (${qty})` : 'Al carrito'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pd = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.white },
  loader:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 8, backgroundColor: COLORS.white },
  topBtn:          { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  topBtnTxt:       { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  topRight:        { flexDirection: 'row', gap: 8 },
  imgWrap:         { position: 'relative' },
  imgSlide:        { width, height: 300, alignItems: 'center', justifyContent: 'center' },
  imgEmoji:        { fontSize: 110 },
  imgDots:         { position: 'absolute', bottom: 12, flexDirection: 'row', alignSelf: 'center', gap: 6 },
  imgDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  imgDotActive:    { backgroundColor: COLORS.primary, width: 18 },
  discBadge:       { position: 'absolute', top: 16, left: 16, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  discTxt:         { color: '#fff', fontSize: 13, fontWeight: FONT.black },
  body:            { backgroundColor: COLORS.white },
  priceSection:    { padding: SPACING.lg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  priceRow:        { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  price:           { fontSize: 28, fontWeight: FONT.black, color: COLORS.red },
  oldPrice:        { fontSize: 16, color: COLORS.gray400, textDecorationLine: 'line-through' },
  discLabel:       { fontSize: 14, color: COLORS.red, fontWeight: FONT.bold },
  priceArrow:      { marginLeft: 'auto' },
  productName:     { fontSize: 16, fontWeight: FONT.bold, color: COLORS.gray800, lineHeight: 22, marginBottom: 10 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  ratingNum:       { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  ratingCount:     { fontSize: 13, color: COLORS.gray400 },
  soldCount:       { fontSize: 13, color: COLORS.gray400 },
  couponBanner:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD700', borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.md },
  couponBadge:     { backgroundColor: '#FFD700', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, fontWeight: FONT.black, fontSize: 14, color: COLORS.gray800 },
  couponTitle:     { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  couponSub:       { fontSize: 11, color: COLORS.gray400 },
  couponCopy:      { padding: 4 },
  deliveryCard:    { margin: SPACING.lg, marginTop: 0, backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md },
  deliveryTitle:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 10 },
  deliveryOpts:    { flexDirection: 'row', gap: 10, marginBottom: 10 },
  deliveryOpt:     { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, padding: 10, alignItems: 'center' },
  deliveryOptLabel:{ fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  deliveryOptDate: { fontSize: 12, color: COLORS.green, fontWeight: FONT.semibold, marginTop: 2 },
  addressRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressTxt:      { flex: 1, fontSize: 13, color: COLORS.gray600 },
  tabs:            { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab:             { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabTxt:          { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray400 },
  tabTxtActive:    { color: COLORS.primary, fontWeight: FONT.bold },
  tabContent:      { padding: SPACING.lg },
  descText:        { fontSize: 14, color: COLORS.gray600, lineHeight: 22 },
  specRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.sm, marginBottom: 4 },
  specKey:         { fontSize: 13, color: COLORS.gray600, fontWeight: FONT.semibold, flex: 1 },
  specVal:         { fontSize: 13, color: COLORS.gray800, fontWeight: FONT.bold, flex: 1, textAlign: 'right' },
  ratingSum:       { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  ratingSumBig:    { fontSize: 40, fontWeight: FONT.black, color: COLORS.gray800 },
  reviewCard:      { backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10 },
  revHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  revAvatar:       { fontSize: 28, width: 40, height: 40, textAlign: 'center', lineHeight: 40 },
  revName:         { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 2 },
  revDate:         { fontSize: 11, color: COLORS.gray400 },
  revText:         { fontSize: 13, color: COLORS.gray600, lineHeight: 20, marginBottom: 8 },
  revLike:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revLikeTxt:      { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },
  sellerCard:      { margin: SPACING.lg, backgroundColor: COLORS.gray100, borderRadius: RADIUS.xl, padding: SPACING.lg },
  sellerHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.md },
  sellerAvatar:    { width: 52, height: 52, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  sellerName:      { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  verifiedBadge:   { backgroundColor: COLORS.primary, color: '#fff', fontSize: 10, borderRadius: RADIUS.full, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
  sellerSub:       { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  sellerStats:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellerStat:      { flex: 1, alignItems: 'center' },
  sellerStatVal:   { fontSize: 13, fontWeight: FONT.black, color: COLORS.gray800 },
  sellerStatLbl:   { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  sellerStatDiv:   { width: 1, height: 30, backgroundColor: COLORS.border },
  relatedWrap:     { padding: SPACING.lg },
  relatedTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  relCard:         { width: 140, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  relImg:          { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  relDisc:         { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  relDiscTxt:      { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  relInfo:         { padding: 8 },
  relPrice:        { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  relOld:          { fontSize: 10, color: COLORS.gray400, textDecorationLine: 'line-through' },
  relName:         { fontSize: 11, color: COLORS.gray600, lineHeight: 15, marginTop: 2 },
  relStars:        { fontSize: 11, color: '#F5A623', marginTop: 3 },
  bottomBar:       { flexDirection: 'row', gap: 10, padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, ...SHADOW.strong },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.gray100, borderRadius: RADIUS.md, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn:          { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnTxt:       { fontSize: 20, fontWeight: FONT.bold, color: COLORS.primary, lineHeight: 24 },
  qtyNum:          { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, minWidth: 18, textAlign: 'center' },
  buyNowBtn:       { flex: 1, backgroundColor: COLORS.gray800, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  buyNowTxt:       { color: '#fff', fontSize: 14, fontWeight: FONT.black },
  cartBtn:         { flex: 1, backgroundColor: '#FFD700', borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  cartBtnTxt:      { color: COLORS.gray800, fontSize: 14, fontWeight: FONT.black },
});
