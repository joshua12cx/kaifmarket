// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { CATEGORIES, Product, PRODUCTS } from '../data';
import { getProducts } from '../services';
import ProductCard from '../components/ProductCard';
import { useCart, useNotifs } from '../context';

const { width } = Dimensions.get('window');

// ── Banners promocionales ─────────────────────────────────────────
const BANNERS = [
  { id: 1, title: 'Semana de\nlanzamiento', sub: 'Envíos gratis en Lima', emoji: '🎁', bg: '#534AB7', accent: '#AFA9EC' },
  { id: 2, title: '20% OFF\nElectrónica', sub: 'Solo hasta el domingo', emoji: '📱', bg: '#1a1a2e', accent: '#E94560' },
  { id: 3, title: 'Kaif Plus', sub: '2% cashback en todo', emoji: '✦', bg: '#0F3460', accent: '#E94560' },
];

// ── Secciones destacadas ──────────────────────────────────────────
const SECTIONS = [
  { id: 'hot',  label: '🔥 Más vendidos',    filter: (p: Product) => p.tag === 'hot' },
  { id: 'new',  label: '✨ Nuevos ingresos',  filter: (p: Product) => p.tag === 'new' },
  { id: 'sale', label: '🏷️ Mejores ofertas',  filter: (p: Product) => p.oldPrice !== null },
];

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { totalItems }  = useCart();
  const { unreadCount } = useNotifs();

  const [activeCat, setActiveCat] = useState('todos');
  const [search, setSearch]       = useState('');
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerRef = useRef<FlatList>(null);

  useEffect(() => {
    setLoading(true);
    getProducts({ category: activeCat, query: search })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [activeCat, search]);

  // Auto-scroll banners
  useEffect(() => {
    const t = setInterval(() => {
      const next = (bannerIdx + 1) % BANNERS.length;
      setBannerIdx(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3500);
    return () => clearInterval(t);
  }, [bannerIdx]);

  const featuredProducts = PRODUCTS.filter(p => p.tag === 'hot').slice(0, 6);
  const newProducts      = PRODUCTS.filter(p => p.tag === 'new').slice(0, 6);
  const saleProducts     = PRODUCTS.filter(p => p.oldPrice !== null).slice(0, 6);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ── TOP BAR ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.locationRow}>
          <Text style={s.locationPin}>📍</Text>
          <Text style={s.locationText}>Miraflores, Lima</Text>
          <Text style={s.locationArrow}>›</Text>
        </TouchableOpacity>
        <View style={s.topIcons}>
          <TouchableOpacity style={s.topIconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={s.topIconEmoji}>🔔</Text>
            {unreadCount > 0 && (
              <View style={s.dot}><Text style={s.dotTxt}>{unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.topIconBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={s.topIconEmoji}>🛒</Text>
            {totalItems > 0 && (
              <View style={s.dot}><Text style={s.dotTxt}>{totalItems}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BUSCADOR ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Buscar productos y marcas"
            placeholderTextColor={COLORS.gray400}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: COLORS.gray400, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
          <View style={s.searchDivider} />
          <Text style={{ fontSize: 18 }}>📷</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── CATEGORÍAS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.catPill, activeCat === cat.id && s.catPillActive]}
              onPress={() => setActiveCat(cat.id)}
              activeOpacity={0.8}>
              <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
              <Text style={[s.catTxt, activeCat === cat.id && s.catTxtActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!search ? (
          <>
            {/* ── BANNERS SLIDER ── */}
            <View style={s.bannerWrap}>
              <FlatList
                ref={bannerRef}
                data={BANNERS}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                  setBannerIdx(idx);
                }}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <View style={[s.banner, { backgroundColor: item.bg }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.bannerTitle}>{item.title}</Text>
                      <Text style={[s.bannerSub, { color: item.accent }]}>{item.sub}</Text>
                    </View>
                    <Text style={s.bannerEmoji}>{item.emoji}</Text>
                  </View>
                )}
              />
              {/* Dots */}
              <View style={s.bannerDots}>
                {BANNERS.map((_, i) => (
                  <View key={i} style={[s.bannerDot, i === bannerIdx && s.bannerDotActive]} />
                ))}
              </View>
            </View>

            {/* ── KAIF PLUS STRIP ── */}
            <TouchableOpacity style={s.plusStrip} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
              <View style={s.plusLeft}>
                <View style={s.plusBadge}><Text style={s.plusBadgeTxt}>PLUS</Text></View>
                <View>
                  <Text style={s.plusTitle}>Kaif Plus — S/ 19.90/mes</Text>
                  <Text style={s.plusSub}>Cashback · Cuotas sin interés · Envío prioritario</Text>
                </View>
              </View>
              <Text style={s.plusArrow}>›</Text>
            </TouchableOpacity>

            {/* ── SECCIÓN: MÁS VENDIDOS ── */}
            <View style={s.section}>
              <View style={s.secHeader}>
                <Text style={s.secTitle}>🔥 Más vendidos</Text>
                <TouchableOpacity><Text style={s.secLink}>Ver todo ›</Text></TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featuredProducts}
                keyExtractor={p => String(p.id)}
                contentContainerStyle={{ gap: 10, paddingHorizontal: SPACING.lg }}
                renderItem={({ item }) => (
                  <ProductCardHoriz
                    product={item}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  />
                )}
              />
            </View>

            {/* ── SECCIÓN: NUEVOS ── */}
            <View style={s.section}>
              <View style={s.secHeader}>
                <Text style={s.secTitle}>✨ Nuevos ingresos</Text>
                <TouchableOpacity><Text style={s.secLink}>Ver todo ›</Text></TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={newProducts}
                keyExtractor={p => String(p.id)}
                contentContainerStyle={{ gap: 10, paddingHorizontal: SPACING.lg }}
                renderItem={({ item }) => (
                  <ProductCardHoriz
                    product={item}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  />
                )}
              />
            </View>

            {/* ── SECCIÓN: OFERTAS ── */}
            <View style={s.section}>
              <View style={s.secHeader}>
                <Text style={s.secTitle}>🏷️ Mejores ofertas</Text>
                <TouchableOpacity><Text style={s.secLink}>Ver todo ›</Text></TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={saleProducts}
                keyExtractor={p => String(p.id)}
                contentContainerStyle={{ gap: 10, paddingHorizontal: SPACING.lg }}
                renderItem={({ item }) => (
                  <ProductCardHoriz
                    product={item}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  />
                )}
              />
            </View>

            {/* ── GRID TODOS ── */}
            <View style={s.section}>
              <View style={s.secHeader}>
                <Text style={s.secTitle}>🛍️ Todos los productos</Text>
              </View>
              {loading
                ? <ActivityIndicator size="large" color={COLORS.primary} style={{ paddingVertical: 30 }} />
                : <View style={s.grid}>
                    {products.map(p => (
                      <ProductCard
                        key={p.id} product={p} style={s.gridItem}
                        onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                      />
                    ))}
                  </View>}
            </View>
          </>
        ) : (
          /* ── RESULTADOS BÚSQUEDA ── */
          <View style={s.section}>
            <Text style={s.searchResultsLabel}>
              {loading ? 'Buscando...' : `${products.length} resultado(s) para "${search}"`}
            </Text>
            {loading
              ? <ActivityIndicator size="large" color={COLORS.primary} style={{ paddingVertical: 30 }} />
              : products.length === 0
              ? <View style={s.empty}><Text style={{ fontSize: 40 }}>🔍</Text><Text style={s.emptyTxt}>Sin resultados</Text></View>
              : <View style={s.grid}>
                  {products.map(p => (
                    <ProductCard
                      key={p.id} product={p} style={s.gridItem}
                      onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                    />
                  ))}
                </View>}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ── Card horizontal para secciones ───────────────────────────────
function ProductCardHoriz({ product, onPress }: { product: Product; onPress: () => void }) {
  const { items, dispatch } = useCart();
  const inCart = (items[product.id] || 0) > 0;
  const disc = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

  return (
    <TouchableOpacity style={ph.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[ph.img, { backgroundColor: product.bgColor }]}>
        <Text style={ph.emoji}>{product.emoji}</Text>
        {disc && <View style={ph.discBadge}><Text style={ph.discTxt}>-{disc}%</Text></View>}
      </View>
      <View style={ph.info}>
        <Text style={ph.price}>S/ {product.price}</Text>
        {product.oldPrice && <Text style={ph.oldPrice}>S/ {product.oldPrice}</Text>}
        <Text style={ph.name} numberOfLines={2}>{product.name}</Text>
        <View style={ph.row}>
          <Text style={ph.stars}>★ {product.rating}</Text>
          <Text style={ph.sold}> · {product.sold > 999 ? `${(product.sold/1000).toFixed(1)}K` : product.sold}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[ph.cartBtn, inCart && { backgroundColor: COLORS.primary }]}
        onPress={() => dispatch({ type: 'ADD', id: product.id })}>
        <Text style={[ph.cartBtnTxt, inCart && { color: '#fff' }]}>{inCart ? '✓' : '🛒'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const ph = StyleSheet.create({
  card:      { width: 150, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  img:       { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji:     { fontSize: 56 },
  discBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt:   { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  info:      { padding: SPACING.sm },
  price:     { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  oldPrice:  { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name:      { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginTop: 3, marginBottom: 4 },
  row:       { flexDirection: 'row', alignItems: 'center' },
  stars:     { fontSize: 11, color: '#F5A623', fontWeight: FONT.bold },
  sold:      { fontSize: 11, color: COLORS.gray400 },
  cartBtn:   { margin: SPACING.sm, marginTop: 0, backgroundColor: '#FFD700', borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  cartBtnTxt:{ fontSize: 16, fontWeight: FONT.bold, color: COLORS.gray800 },
});

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.white },
  topBar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 10, backgroundColor: COLORS.white },
  locationRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationPin:        { fontSize: 14 },
  locationText:       { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  locationArrow:      { fontSize: 18, color: COLORS.gray400, fontWeight: FONT.bold },
  topIcons:           { flexDirection: 'row', gap: 8 },
  topIconBtn:         { width: 38, height: 38, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  topIconEmoji:       { fontSize: 18 },
  dot:                { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.red, borderRadius: RADIUS.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  dotTxt:             { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  searchWrap:         { paddingHorizontal: SPACING.lg, paddingBottom: 10, backgroundColor: COLORS.white },
  searchBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchIcon:         { fontSize: 16 },
  searchInput:        { flex: 1, fontSize: 14, color: COLORS.gray800, padding: 0 },
  searchDivider:      { width: 1, height: 20, backgroundColor: COLORS.border },
  cats:               { paddingHorizontal: SPACING.lg, paddingVertical: 8, gap: 8 },
  catPill:            { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1.5, borderColor: 'transparent' },
  catPillActive:      { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  catTxt:             { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray600 },
  catTxtActive:       { color: COLORS.primary, fontWeight: FONT.bold },
  bannerWrap:         { marginHorizontal: SPACING.lg, marginVertical: SPACING.sm },
  banner:             { width: width - 32, borderRadius: RADIUS.xl, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', height: 140 },
  bannerTitle:        { fontSize: 20, fontWeight: FONT.black, color: '#fff', lineHeight: 26, marginBottom: 6 },
  bannerSub:          { fontSize: 13, fontWeight: FONT.semibold },
  bannerEmoji:        { fontSize: 64 },
  bannerDots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  bannerDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gray200 },
  bannerDotActive:    { backgroundColor: COLORS.primary, width: 18 },
  plusStrip:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, padding: SPACING.md },
  plusLeft:           { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  plusBadge:          { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  plusBadgeTxt:       { color: '#fff', fontSize: 10, fontWeight: FONT.black, letterSpacing: 1 },
  plusTitle:          { fontSize: 13, fontWeight: FONT.black, color: COLORS.primaryDark },
  plusSub:            { fontSize: 11, color: COLORS.primary, fontWeight: FONT.semibold, marginTop: 1 },
  plusArrow:          { fontSize: 20, color: COLORS.primary, fontWeight: FONT.bold },
  section:            { marginBottom: SPACING.lg },
  secHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  secTitle:           { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  secLink:            { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  grid:               { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: 10 },
  gridItem:           { width: '47.5%' },
  searchResultsLabel: { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  empty:              { alignItems: 'center', paddingVertical: 48 },
  emptyTxt:           { fontSize: 15, color: COLORS.gray400, fontWeight: FONT.semibold, marginTop: 8 },
});
