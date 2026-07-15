// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, FlatList,
  Dimensions, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell, ShoppingCart, MapPin, Search as SearchIcon, X, SlidersHorizontal,
  ShoppingBag, Gift, Percent, Sparkles, Star, Plus, Minus, Zap,
  TrendingUp, Tag, ChevronRight, Award,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { CATEGORIES } from '../data';
import { getCategoryIcon } from '../utils/categoryIcons';
import ProductCard from '../components/ProductCard';
import { useCart, useNotifs } from '../context';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const BANNERS = [
  { id: 1, label: 'HASTA 40% OFF', title: 'Ofertas que\nvuelan',    bg: COLORS.primaryDark, panel: COLORS.red },
  { id: 2, label: 'SOLO HOY',      title: '20% OFF en\nElectrónica', bg: '#3A2A0F',           panel: '#5A4415' },
  { id: 3, label: 'KAIF PLUS',     title: 'Cashback en\ntodo',       bg: '#1F2937',           panel: '#374151' },
];

// Duración de la Flash Sale — cuenta regresiva hasta medianoche.
// TODO en BD: si más adelante quieres que el admin configure la
// hora de fin real, haría falta una tabla/columna tipo
// `flash_sales(ends_at timestamp)`. Por ahora es una cuenta
// regresiva fija hasta las 00:00 del día, calculada en el cliente.
function useCountdownToMidnight() {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const sec = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setRemaining(`${h}:${m}:${sec}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return remaining;
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { totalItems }  = useCart();
  const { unreadCount } = useNotifs();
  const countdown = useCountdownToMidnight();

  const [activeCats, setActiveCats] = useState<string[]>(['todos']);
  const [search,     setSearch]     = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [gridY, setGridY] = useState(0);

  // ── Multi-selección de categorías ────────────────────────────
  // "Todos" siempre es exclusivo; cualquier otra categoría se va
  // sumando/quitando del set, y si queda vacío vuelve a "Todos".
  // Al tocar cualquiera, baja el scroll hasta la grilla de resultados.
  const toggleCat = (id: string) => {
    if (id === 'todos') { setActiveCats(['todos']); }
    else {
      setActiveCats(prev => {
        const withoutTodos = prev.filter(c => c !== 'todos');
        if (withoutTodos.includes(id)) {
          const next = withoutTodos.filter(c => c !== id);
          return next.length === 0 ? ['todos'] : next;
        }
        return [...withoutTodos, id];
      });
    }
    scrollRef.current?.scrollTo({ y: gridY, animated: true });
  };
  const [allProducts, setAllProducts] = useState<any[]>([]); // pool completo, sin filtrar
  const [loading,    setLoading]    = useState(true);
  const [bannerIdx,  setBannerIdx]  = useState(0);
  const bannerRef = useRef<FlatList>(null);

  // ── Cargar TODOS los productos activos una sola vez (data real) ──
  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(100);

      if (__DEV__) { console.log('[HOME] fetchAllProducts:', data?.length, error); }
      setAllProducts(data || []);
    } catch (e) {
      if (__DEV__) { console.log('[HOME] fetchAllProducts error:', e); }
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllProducts(); }, [fetchAllProducts]);

  // ── Secciones derivadas del pool real (sin data sintética) ──────
  // "Depende de qué": criterios objetivos que cualquier producto real
  // ya tiene, sin favorecer a ningún vendedor — más vendidos por
  // `sold`, nuevos por `created_at`, ofertas por % de descuento real.
  const featuredProducts = [...allProducts].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 6);
  const newProducts      = [...allProducts].slice(0, 6); // ya vienen ordenados por created_at desc
  const saleProducts     = allProducts
    .filter(p => p.old_price)
    .sort((a, b) => ((b.old_price - b.price) / b.old_price) - ((a.old_price - a.price) / a.old_price))
    .slice(0, 6);
  const flashProducts    = saleProducts.slice(0, 3);

  // ── Grid "Todos los productos" — filtra el mismo pool en el cliente ──
  const products = allProducts.filter(p => {
    const matchCat = activeCats.includes('todos') || activeCats.includes(p.category_id);
    const matchSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Auto-scroll de banners ────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const next = (bannerIdx + 1) % BANNERS.length;
      setBannerIdx(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3500);
    return () => clearInterval(t);
  }, [bannerIdx]);

  const goToDetail = (product: any) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* ── HEADER — sin barra roja, ubicación + iconos ── */}
      <View style={s.header}>
        <TouchableOpacity style={{ flex: 1 }}>
          <Text style={s.deliverTo}>📍 Entregar en</Text>
          <Text style={s.locationTxt}>Lima, Miraflores</Text>
        </TouchableOpacity>
        <View style={s.topIcons}>
          <TouchableOpacity style={s.topIconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={18} color={COLORS.white} strokeWidth={2} />
            {unreadCount > 0 && <View style={s.badgeDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.topIconBtn} onPress={() => navigation.navigate('Cart')}>
            <ShoppingCart size={18} color={COLORS.white} strokeWidth={2} />
            {totalItems > 0 && (
              <View style={s.badge}><Text style={s.badgeTxt}>{totalItems}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── LOGO CENTRADO ── */}
      <Image
        source={require('../assets/logo-horizontal.png')}
        style={s.logo}
        resizeMode="contain"
      />

      {/* ── BUSCADOR + FILTRO ── */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <SearchIcon size={16} color={COLORS.gray400} strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Busca productos, marcas..."
            placeholderTextColor={COLORS.gray400}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={COLORS.gray400} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.filterBtn} activeOpacity={0.85}>
          <SlidersHorizontal size={18} color={COLORS.white} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

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
                    <View style={s.bannerLeft}>
                      <Text style={s.bannerLabel}>{item.label}</Text>
                      <Text style={s.bannerTitle}>{item.title}</Text>
                      <TouchableOpacity style={s.bannerBtn} activeOpacity={0.85}>
                        <Text style={s.bannerBtnTxt}>Ver ofertas →</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[s.bannerRight, { backgroundColor: item.panel }]}>
                      <Percent size={64} color="rgba(255,255,255,0.15)" strokeWidth={1.2} />
                    </View>
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
              <View style={s.plusIconWrap}>
                <Award size={20} color={COLORS.gold} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.plusTitle}>Kaif <Text style={{ color: COLORS.gold }}>Plus</Text></Text>
                <Text style={s.plusSub}>Cashback · Cupones VIP · Envíos gratis</Text>
              </View>
              <Text style={s.plusJoin}>Unirse →</Text>
            </TouchableOpacity>

            {/* ── FLASH SALE ── */}
            {flashProducts.length > 0 && (
              <View style={s.flashCard}>
                <View style={s.flashHeader}>
                  <View style={s.flashTitleRow}>
                    <Zap size={16} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                    <View>
                      <Text style={s.flashTitle}>Flash Sale</Text>
                      <Text style={s.flashSub}>Termina en:</Text>
                    </View>
                  </View>
                  <Text style={s.flashCountdown}>{countdown}</Text>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={flashProducts}
                  keyExtractor={p => `flash-${p.id}`}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item }) => (
                    <FlashProductCard product={item} onPress={() => goToDetail(item)} />
                  )}
                />
              </View>
            )}

            {/* ── CATEGORÍAS ── */}
            <View style={s.section}>
              <Text style={[s.secTitle, { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm }]}>
                Categorías
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsRow}>
                {CATEGORIES.map(cat => {
                  const Icon = getCategoryIcon(cat.id);
                  const active = activeCats.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catPill, active && s.catPillActive]}
                      onPress={() => toggleCat(cat.id)}
                      activeOpacity={0.85}>
                      <Icon size={16} color={active ? COLORS.white : COLORS.gray400} strokeWidth={2} />
                      <Text style={[s.catPillTxt, active && s.catPillTxtActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── SECCIONES HORIZONTALES (data estática) ── */}
            {[
              { title: 'Más vendidos',    icon: TrendingUp, data: featuredProducts },
              { title: 'Nuevos ingresos', icon: Sparkles,   data: newProducts      },
              { title: 'Mejores ofertas', icon: Tag,        data: saleProducts     },
            ].map(sec => {
              const SecIcon = sec.icon;
              return (
                <View key={sec.title} style={s.section}>
                  <View style={s.secHeader}>
                    <View style={s.secTitleRow}>
                      <SecIcon size={16} color={COLORS.gray200} strokeWidth={2} />
                      <Text style={s.secTitle}>{sec.title}</Text>
                    </View>
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
                      <HorizCard product={item} onPress={() => goToDetail(item)} />
                    )}
                  />
                </View>
              );
            })}

            {/* ── GRID TODOS — Supabase + estáticos ── */}
            <View style={s.section} onLayout={e => setGridY(e.nativeEvent.layout.y)}>
              <View style={s.secHeader}>
                <View style={s.secTitleRow}>
                  <ShoppingBag size={16} color={COLORS.gray200} strokeWidth={2} />
                  <Text style={s.secTitle}>Todos los productos</Text>
                </View>
                <Text style={s.secCount}>{products.length} productos</Text>
              </View>
              {loading
                ? <ActivityIndicator size="large" color={COLORS.primary} style={{ paddingVertical: 30 }} />
                : products.length === 0
                ? <View style={s.catEmpty}>
                    <Text style={s.catEmptyTxt}>No hay productos en esta categoría todavía</Text>
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
                  <SearchIcon size={40} color={COLORS.gray600} strokeWidth={1.5} />
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

// ── Card horizontal (secciones Más vendidos / Nuevos / Ofertas) ──
function HorizCard({ product, onPress }: { product: any; onPress: () => void }) {
  const { items, dispatch } = useCart();
  const qty    = items[product.id] || 0;
  const disc   = product.oldPrice || product.old_price
    ? Math.round((((product.oldPrice || product.old_price) - product.price) / (product.oldPrice || product.old_price)) * 100)
    : null;
  const imageUrl = product.image_url || null;

  return (
    <TouchableOpacity style={hc.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[hc.img, { backgroundColor: product.bgColor || product.bg_color || COLORS.gray800 }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={hc.realImg} resizeMode="cover" />
        ) : (
          <ShoppingBag size={40} color={COLORS.gray600} strokeWidth={1.5} />
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
        <View style={hc.starsRow}>
          <Star size={11} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
          <Text style={hc.stars}>
            {product.rating} · {product.sold > 999
              ? `${(product.sold / 1000).toFixed(1)}K`
              : product.sold}
          </Text>
        </View>
      </View>
      {qty === 0 ? (
        <TouchableOpacity
          style={hc.cartBtn}
          onPress={() => dispatch({ type: 'ADD', id: product.id })}
          activeOpacity={0.8}>
          <ShoppingCart size={16} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View style={hc.stepper}>
          <TouchableOpacity
            style={hc.stepperBtn}
            onPress={() => dispatch({ type: 'DECREMENT', id: product.id })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Minus size={14} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={hc.stepperQty}>{qty}</Text>
          <TouchableOpacity
            style={hc.stepperBtn}
            onPress={() => dispatch({ type: 'INCREMENT', id: product.id })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Plus size={14} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Card compacta para Flash Sale ──────────────────────────────
function FlashProductCard({ product, onPress }: { product: any; onPress: () => void }) {
  const disc = product.oldPrice || product.old_price
    ? Math.round((((product.oldPrice || product.old_price) - product.price) / (product.oldPrice || product.old_price)) * 100)
    : null;
  const imageUrl = product.image_url || null;

  return (
    <TouchableOpacity style={fc.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[fc.img, { backgroundColor: product.bgColor || product.bg_color || COLORS.gray800 }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={fc.realImg} resizeMode="cover" />
        ) : (
          <ShoppingBag size={30} color={COLORS.gray600} strokeWidth={1.5} />
        )}
        {disc && (
          <View style={fc.disc}><Text style={fc.discTxt}>-{disc}% OFF</Text></View>
        )}
      </View>
      <Text style={fc.name} numberOfLines={1}>{product.name}</Text>
      <Text style={fc.price}>S/ {product.price}</Text>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card:    { width: 110 },
  img:     { width: 110, height: 100, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  realImg: { width: '100%', height: '100%', position: 'absolute' },
  disc:    { position: 'absolute', bottom: 6, left: 6, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt: { fontSize: 9, fontWeight: FONT.black, color: COLORS.black },
  name:    { fontSize: 11, color: COLORS.gray200, marginTop: 6, fontWeight: FONT.semibold },
  price:   { fontSize: 13, fontWeight: FONT.black, color: COLORS.red, marginTop: 2 },
});

const hc = StyleSheet.create({
  card:      { width: 150, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, overflow: 'hidden' },
  img:       { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  realImg:   { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  disc:      { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt:   { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  info:      { padding: SPACING.sm },
  price:     { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  oldPrice:  { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name:      { fontSize: 12, color: COLORS.gray400, lineHeight: 16, marginTop: 3, marginBottom: 4 },
  starsRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars:     { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.semibold },
  cartBtn:   { margin: SPACING.sm, marginTop: 6, backgroundColor: COLORS.red, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  stepper:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: SPACING.sm, marginTop: 6, backgroundColor: COLORS.red, borderRadius: RADIUS.md, paddingVertical: 7 },
  stepperBtn:{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  stepperQty:{ fontSize: 13, fontWeight: FONT.black, color: '#fff', minWidth: 14, textAlign: 'center' },
});

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.black },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  deliverTo:      { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.semibold },
  locationTxt:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginTop: 2 },
  topIcons:       { flexDirection: 'row', gap: 8 },
  topIconBtn:     { width: 38, height: 38, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge:          { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.red, borderRadius: RADIUS.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt:       { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  badgeDot:       { position: 'absolute', top: 6, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.red },

  logo:           { width: 170, height: 57, alignSelf: 'center', marginTop: SPACING.sm },

  searchRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.sm },
  searchBar:      { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  searchInput:    { flex: 1, fontSize: 14, color: COLORS.white, padding: 0 },
  filterBtn:      { width: 46, height: 46, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },

  bannerWrap:     { marginHorizontal: SPACING.lg, marginVertical: SPACING.sm },
  banner:         { width: width - 32, borderRadius: RADIUS.xl, flexDirection: 'row', height: 150, overflow: 'hidden' },
  bannerLeft:     { flex: 1.3, padding: SPACING.lg, justifyContent: 'center' },
  bannerLabel:    { fontSize: 11, fontWeight: FONT.bold, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  bannerTitle:    { fontSize: 20, fontWeight: FONT.black, color: '#fff', lineHeight: 25, marginBottom: 12 },
  bannerBtn:      { backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  bannerBtnTxt:   { fontSize: 12, fontWeight: FONT.black, color: COLORS.primary },
  bannerRight:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bannerDots:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  bannerDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gray800 },
  bannerDotActive:{ backgroundColor: COLORS.white, width: 18 },

  plusStrip:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: '#3A2E0A', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.gold + '40' },
  plusIconWrap:   { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.gold + '22', alignItems: 'center', justifyContent: 'center' },
  plusTitle:      { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
  plusSub:        { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  plusJoin:       { fontSize: 13, fontWeight: FONT.black, color: COLORS.gold },

  flashCard:      { backgroundColor: '#3A1414', borderRadius: RADIUS.xl, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.red + '30' },
  flashHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  flashTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashTitle:     { fontSize: 15, fontWeight: FONT.black, color: COLORS.white },
  flashSub:       { fontSize: 10, color: COLORS.gray400 },
  flashCountdown: { fontSize: 15, fontWeight: FONT.black, color: COLORS.white, fontVariant: ['tabular-nums'] },

  section:        { marginBottom: SPACING.lg },
  secHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  secTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secTitle:       { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  secLink:        { fontSize: 13, color: COLORS.primaryMid, fontWeight: FONT.bold },
  secCount:       { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },
  catEmpty:       { alignItems: 'center', paddingVertical: 40, paddingHorizontal: SPACING.lg },
  catEmptyTxt:    { fontSize: 13, color: COLORS.gray400, textAlign: 'center' },

  catsRow:        { paddingHorizontal: SPACING.lg, gap: 8 },
  catPill:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 9 },
  catPillActive:  { backgroundColor: COLORS.primary },
  catPillTxt:     { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray400 },
  catPillTxtActive: { color: COLORS.white },

  grid:           { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: 10 },
  gridItem:       { width: '47.5%' },
  searchLabel:    { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  empty:          { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:       { fontSize: 15, color: COLORS.gray400, fontWeight: FONT.semibold },
});