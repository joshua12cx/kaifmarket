// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, FlatList,
  Dimensions, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { CATEGORIES, Product, PRODUCTS } from '../data';
import ProductCard from '../components/ProductCard';
import { useCart, useNotifs } from '../context';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const BANNERS = [
  { id: 1, title: 'Semana de\nlanzamiento 🇵🇪', sub: 'Envíos gratis en Lima', emoji: '🎁', bg: '#E8420A', accent: '#FFB830' },
  { id: 2, title: '20% OFF\nElectrónica',        sub: 'Solo hasta el domingo', emoji: '📱', bg: '#1A1A1A', accent: '#FF6B35' },
  { id: 3, title: 'Kaif Plus',                   sub: '2% cashback en todo',   emoji: '✦',  bg: '#B5300A', accent: '#FFB830' },
];

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { totalItems }  = useCart();
  const { unreadCount } = useNotifs();

  const [activeCat,  setActiveCat]  = useState('todos');
  const [search,     setSearch]     = useState('');
  const [products,   setProducts]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [bannerIdx,  setBannerIdx]  = useState(0);
  const bannerRef = useRef<FlatList>(null);

  // ── Secciones estáticas ───────────────────────────────────────
  const featuredProducts = PRODUCTS.filter(p => p.tag === 'hot').slice(0, 6);
  const newProducts      = PRODUCTS.filter(p => p.tag === 'new').slice(0, 6);
  const saleProducts     = PRODUCTS.filter(p => p.oldPrice !== null).slice(0, 6);

  // ── Cargar productos desde Supabase + estáticos ───────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Query a Supabase
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (activeCat !== 'todos') {
        query = query.eq('category_id', activeCat);
      }
      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data: supabaseProducts, error } = await query;

      if (__DEV__) {
        console.log('[HOME] Supabase products:', supabaseProducts?.length, error);
      }

      // 2. Productos estáticos filtrados
      let staticProducts = PRODUCTS as any[];
      if (activeCat !== 'todos') {
        staticProducts = staticProducts.filter(p => p.category === activeCat);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        staticProducts = staticProducts.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
        );
      }

      // 3. Combinar — Supabase primero, luego estáticos
      const combined = [
        ...(supabaseProducts || []),
        ...staticProducts,
      ];

      setProducts(combined);
    } catch (e) {
      if (__DEV__) { console.log('[HOME] fetchProducts error:', e); }
      setProducts(PRODUCTS as any[]);
    } finally {
      setLoading(false);
    }
  }, [activeCat, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Auto-scroll de banners ────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const next = (bannerIdx + 1) % BANNERS.length;
      setBannerIdx(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3500);
    return () => clearInterval(t);
  }, [bannerIdx]);

  // ── Navegar a detalle ─────────────────────────────────────────
  const goToDetail = (product: any) => {
    // Si es de Supabase tiene string id, si es estático tiene número
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gray800} />

      {/* ── TOP BAR ── */}
      <View style={s.topBar}>
        <View style={s.logoWrap}>
          <View style={s.logoIcon}>
            <Text style={{ fontSize: 20 }}>🐦</Text>
          </View>
          <View>
            <Text style={s.logoText}>KaifMarket</Text>
            <Text style={s.logoSub}>Tu marketplace peruano 🇵🇪</Text>
          </View>
        </View>
        <View style={s.topIcons}>
          <TouchableOpacity
            style={s.topIconBtn}
            onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.topIconBtn}
            onPress={() => navigation.navigate('Cart')}>
            <Text style={{ fontSize: 18 }}>🛒</Text>
            {totalItems > 0 && (
              <View style={s.badge}><Text style={s.badgeTxt}>{totalItems}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BUSCADOR ── */}
      <View style={s.searchWrap}>
        <TouchableOpacity style={s.locationRow}>
          <Text style={{ fontSize: 13 }}>📍</Text>
          <Text style={s.locationTxt}>Miraflores, Lima ▾</Text>
        </TouchableOpacity>
        <View style={s.searchBar}>
          <Text style={{ fontSize: 15, color: COLORS.gray400 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Buscar en Kaif Market..."
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
          <View style={s.searchDiv} />
          <Text style={{ fontSize: 17 }}>📷</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── CATEGORÍAS ── */}
        <View style={s.catsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.cat, activeCat === cat.id && s.catActive]}
                onPress={() => setActiveCat(cat.id)}
                activeOpacity={0.8}>
                <View style={[s.catIcon, activeCat === cat.id && s.catIconActive]}>
                  <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                </View>
                <Text style={[s.catTxt, activeCat === cat.id && s.catTxtActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!search ? (
          <>
            {/* ── BANNERS ── */}
            <View style={s.bannerWrap}>
              <FlatList
                ref={bannerRef}
                data={BANNERS}
                horizontal pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScrollToIndexFailed={() => {}}
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
              <View style={s.bannerDots}>
                {BANNERS.map((_, i) => (
                  <View key={i} style={[s.bannerDot, i === bannerIdx && s.bannerDotActive]} />
                ))}
              </View>
            </View>

            {/* ── KAIF PLUS STRIP ── */}
            <TouchableOpacity
              style={s.plusStrip}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.85}>
              <View style={s.plusLeft}>
                <View style={s.plusBadge}>
                  <Text style={s.plusBadgeTxt}>PLUS</Text>
                </View>
                <View>
                  <Text style={s.plusTitle}>Kaif Plus — S/ 19.90/mes</Text>
                  <Text style={s.plusSub}>Cashback · Cuotas sin interés · Envío rápido</Text>
                </View>
              </View>
              <Text style={s.plusArrow}>›</Text>
            </TouchableOpacity>

            {/* ── SECCIONES HORIZONTALES (data estática) ── */}
            {[
              { title: '🔥 Más vendidos',   data: featuredProducts },
              { title: '✨ Nuevos ingresos', data: newProducts      },
              { title: '🏷️ Mejores ofertas', data: saleProducts     },
            ].map(sec => (
              <View key={sec.title} style={s.section}>
                <View style={s.secHeader}>
                  <Text style={s.secTitle}>{sec.title}</Text>
                  <TouchableOpacity>
                    <Text style={s.secLink}>Ver todo ›</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={sec.data}
                  keyExtractor={p => String(p.id)}
                  contentContainerStyle={{ gap: 10, paddingHorizontal: SPACING.lg }}
                  renderItem={({ item }) => (
                    <HorizCard
                      product={item}
                      onPress={() => goToDetail(item)}
                    />
                  )}
                />
              </View>
            ))}

            {/* ── GRID TODOS — Supabase + estáticos ── */}
            <View style={s.section}>
              <View style={s.secHeader}>
                <Text style={s.secTitle}>🛍️ Todos los productos</Text>
                <Text style={s.secCount}>{products.length} productos</Text>
              </View>
              {loading
                ? <ActivityIndicator size="large" color={COLORS.primary} style={{ paddingVertical: 30 }} />
                : <View style={s.grid}>
                    {products.map((p, i) => (
                      <ProductCard
                        key={`${p.id}-${i}`}
                        product={p}
                        style={s.gridItem}
                        onPress={() => goToDetail(p)}
                      />
                    ))}
                  </View>}
            </View>
          </>
        ) : (
          /* ── RESULTADOS DE BÚSQUEDA ── */
          <View style={s.section}>
            <Text style={s.searchLabel}>
              {loading ? 'Buscando...' : `${products.length} resultado(s) para "${search}"`}
            </Text>
            {loading
              ? <ActivityIndicator size="large" color={COLORS.primary} style={{ paddingVertical: 30 }} />
              : products.length === 0
              ? <View style={s.empty}>
                  <Text style={{ fontSize: 40 }}>🔍</Text>
                  <Text style={s.emptyTxt}>Sin resultados para "{search}"</Text>
                </View>
              : <View style={s.grid}>
                  {products.map((p, i) => (
                    <ProductCard
                      key={`${p.id}-${i}`}
                      product={p}
                      style={s.gridItem}
                      onPress={() => goToDetail(p)}
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

// ── Card horizontal ───────────────────────────────────────────────
function HorizCard({ product, onPress }: { product: any; onPress: () => void }) {
  const { items, dispatch } = useCart();
  const inCart = (items[product.id] || 0) > 0;
  const disc   = product.oldPrice || product.old_price
    ? Math.round((((product.oldPrice || product.old_price) - product.price) / (product.oldPrice || product.old_price)) * 100)
    : null;
  const imageUrl = product.image_url || null;

  return (
    <TouchableOpacity style={hc.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[hc.img, { backgroundColor: product.bgColor || product.bg_color || '#F5F5F5' }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={hc.realImg} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 52 }}>{product.emoji || '📦'}</Text>
        )}
        {disc && (
          <View style={hc.disc}><Text style={hc.discTxt}>-{disc}%</Text></View>
        )}
      </View>
      <View style={hc.info}>
        <Text style={hc.price}>S/ {product.price}</Text>
        {(product.oldPrice || product.old_price) && (
          <Text style={hc.oldPrice}>S/ {product.oldPrice || product.old_price}</Text>
        )}
        <Text style={hc.name} numberOfLines={2}>{product.name}</Text>
        <Text style={hc.stars}>
          ★ {product.rating} · {product.sold > 999
            ? `${(product.sold / 1000).toFixed(1)}K`
            : product.sold}
        </Text>
      </View>
      <TouchableOpacity
        style={[hc.cartBtn, inCart && { backgroundColor: COLORS.primary }]}
        onPress={() => dispatch({ type: 'ADD', id: product.id })}>
        <Text style={[hc.cartBtnTxt, inCart && { color: '#fff' }]}>
          {inCart ? '✓' : '🛒'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const hc = StyleSheet.create({
  card:      { width: 150, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  img:       { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  realImg:   { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  disc:      { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt:   { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  info:      { padding: SPACING.sm },
  price:     { fontSize: 16, fontWeight: FONT.black, color: COLORS.black },
  oldPrice:  { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name:      { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginTop: 3, marginBottom: 4 },
  stars:     { fontSize: 11, color: '#F5A623', fontWeight: FONT.bold },
  cartBtn:   { margin: SPACING.sm, marginTop: 0, backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  cartBtnTxt:{ fontSize: 16, fontWeight: FONT.bold, color: COLORS.black },
});

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.gray50 },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 10, backgroundColor: COLORS.gray800 },
  logoWrap:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon:       { width: 38, height: 38, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  logoText:       { fontSize: 18, fontWeight: FONT.black, color: COLORS.white, letterSpacing: -0.5 },
  logoSub:        { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: FONT.semibold },
  topIcons:       { flexDirection: 'row', gap: 8 },
  topIconBtn:     { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge:          { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt:       { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  searchWrap:     { backgroundColor: COLORS.gray800, paddingHorizontal: SPACING.lg, paddingBottom: 12, gap: 8 },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTxt:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: FONT.semibold },
  searchBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput:    { flex: 1, fontSize: 14, color: COLORS.black, padding: 0 },
  searchDiv:      { width: 1, height: 20, backgroundColor: COLORS.border },
  catsWrap:       { backgroundColor: COLORS.white, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  cats:           { paddingHorizontal: SPACING.lg, gap: 8 },
  cat:            { alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 4, borderRadius: RADIUS.md },
  catActive:      { backgroundColor: COLORS.primaryLight },
  catIcon:        { width: 50, height: 50, backgroundColor: COLORS.gray100, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  catIconActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  catTxt:         { fontSize: 10, fontWeight: FONT.bold, color: COLORS.gray400 },
  catTxtActive:   { color: COLORS.primary },
  bannerWrap:     { marginHorizontal: SPACING.lg, marginVertical: SPACING.sm },
  banner:         { width: width - 32, borderRadius: RADIUS.xl, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', height: 140 },
  bannerTitle:    { fontSize: 20, fontWeight: FONT.black, color: '#fff', lineHeight: 26, marginBottom: 6 },
  bannerSub:      { fontSize: 13, fontWeight: FONT.semibold },
  bannerEmoji:    { fontSize: 64 },
  bannerDots:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  bannerDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gray200 },
  bannerDotActive:{ backgroundColor: COLORS.primary, width: 18 },
  plusStrip:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primary },
  plusLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  plusBadge:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  plusBadgeTxt:   { color: '#fff', fontSize: 10, fontWeight: FONT.black, letterSpacing: 1 },
  plusTitle:      { fontSize: 13, fontWeight: FONT.black, color: COLORS.primaryDark },
  plusSub:        { fontSize: 11, color: COLORS.primary, fontWeight: FONT.semibold, marginTop: 1 },
  plusArrow:      { fontSize: 20, color: COLORS.primary, fontWeight: FONT.bold },
  section:        { marginBottom: SPACING.lg },
  secHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  secTitle:       { fontSize: 16, fontWeight: FONT.black, color: COLORS.black },
  secLink:        { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  secCount:       { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: 10 },
  gridItem:       { width: '47.5%' },
  searchLabel:    { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  empty:          { alignItems: 'center', paddingVertical: 48 },
  emptyTxt:       { fontSize: 15, color: COLORS.gray400, fontWeight: FONT.semibold, marginTop: 8 },
});