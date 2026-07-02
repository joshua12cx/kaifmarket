// src/screens/SellerStoreScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  Image, RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Search, X, Share2, Store, Check,
  Star, MessageCircle, Heart, ShoppingCart, Package,
  Tag, Copy, Sparkles,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { PRODUCTS, SELLERS } from '../data';
import { useCart, useFavs } from '../context';
import { supabase } from '../lib/supabase';

const STORE_TABS = ['Principal', 'Reseñas', 'Novedades'];

const STORE_REVIEWS = [
  { id: 1, name: 'Ana C.',  rating: 5, text: 'Excelente vendedor, muy puntual.', date: 'hace 1 día' },
  { id: 2, name: 'Luis M.', rating: 5, text: 'Todo perfecto, lo recomiendo.', date: 'hace 3 días' },
  { id: 3, name: 'Rosa P.', rating: 4, text: 'Buen producto, envío tardó pero llegó bien.', date: 'hace 1 sem' },
];

export default function SellerStoreScreen({ route, navigation }: any) {
  const { sellerId } = route.params;
  const insets       = useSafeAreaInsets();
  const { dispatch } = useCart();
  const { isFav, toggle } = useFavs();

  const [seller,      setSeller]      = useState<any>(null);
  const [products,    setProducts]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [activeTab,   setActiveTab]   = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  // ── Cargar datos del vendedor y sus productos ─────────────────
  const fetchData = useCallback(async () => {
    try {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (sellerData) {
        setSeller(sellerData);

        const { data: supabaseProducts } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', sellerId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        setProducts(supabaseProducts || []);
      } else {
        const staticSeller = SELLERS.find(s => s.id === sellerId) || SELLERS[0];
        setSeller({
          ...staticSeller,
          is_verified: staticSeller.verified,
          is_premium:  staticSeller.premium,
          logo_url:    null,
        });
        const staticProducts = PRODUCTS.filter(p => p.sellerId === sellerId);
        setProducts(staticProducts as any[]);
      }
    } catch (e) {
      if (__DEV__) { console.log('[STORE] Error:', e); }
      const staticSeller = SELLERS.find(s => s.id === sellerId) || SELLERS[0];
      setSeller(staticSeller);
      setProducts(PRODUCTS.filter(p => p.sellerId === sellerId) as any[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Filtrar productos por búsqueda ────────────────────────────
  const filtered = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const newProducts  = products.filter(p => p.tag === 'new');

  const renderStars = (n: number, size = 13) =>
    Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={size}
        color={i < n ? COLORS.gold : COLORS.gray200}
        fill={i < n ? COLORS.gold : COLORS.gray200}
        strokeWidth={0}
      />
    ));

  // ── Card de producto ──────────────────────────────────────────
  const ProductItem = ({ product }: { product: any }) => {
    const disc      = (product.oldPrice || product.old_price)
      ? Math.round((((product.oldPrice || product.old_price) - product.price) / (product.oldPrice || product.old_price)) * 100)
      : null;
    const imageUrl  = product.image_url || null;
    const bgColor   = product.bgColor   || product.bg_color || COLORS.gray100;
    const oldPrice  = product.oldPrice  || product.old_price || null;
    const sold      = product.sold      || 0;
    const isFavd    = isFav(product.id);

    return (
      <TouchableOpacity
        style={ss.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
        activeOpacity={0.9}>
        <View style={[ss.cardImg, { backgroundColor: imageUrl ? COLORS.gray200 : bgColor }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={ss.cardImgReal} resizeMode="cover" />
          ) : (
            <Package size={40} color={COLORS.gray400} strokeWidth={1.5} />
          )}
          {disc && (
            <View style={ss.discBadge}>
              <Text style={ss.discTxt}>-{disc}%</Text>
            </View>
          )}
          <TouchableOpacity
            style={ss.favBtn}
            onPress={() => toggle(product.id)}>
            <Heart
              size={15}
              color={isFavd ? COLORS.primary : COLORS.white}
              fill={isFavd ? COLORS.primary : 'transparent'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
        <View style={ss.cardInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={ss.cardPrice}>S/ {product.price}</Text>
            {oldPrice && (
              <Text style={ss.cardOldPrice}>S/ {oldPrice}</Text>
            )}
          </View>
          <Text style={ss.cardName} numberOfLines={2}>{product.name}</Text>
          <View style={ss.cardStarsRow}>
            <Star size={11} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
            <Text style={ss.cardStars}>
              {product.rating || 5} · {sold > 999
                ? `${(sold / 1000).toFixed(1)}K`
                : sold} vendidos
            </Text>
          </View>
          <TouchableOpacity
            style={ss.cartBtn}
            onPress={() => dispatch({ type: 'ADD', id: product.id })}>
            <ShoppingCart size={13} color={COLORS.black} strokeWidth={2} />
            <Text style={ss.cartBtnTxt}>Al carrito</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[ss.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={ss.topBar}>
          <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[ss.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── TOP BAR ── */}
      <View style={ss.topBar}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={ss.searchWrap}>
          <Search size={15} color={COLORS.gray400} strokeWidth={2} />
          <TextInput
            style={ss.searchInput}
            placeholder="Buscar en la tienda"
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={COLORS.gray400} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={ss.backBtn}>
          <Share2 size={17} color={COLORS.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }>

        {/* ── HEADER TIENDA ── */}
        <View style={ss.storeHeader}>
          {/* Logo */}
          {seller?.logo_url ? (
            <Image source={{ uri: seller.logo_url }} style={ss.storeLogoImg} />
          ) : (
            <View style={ss.storeAvatar}>
              <Store size={32} color={COLORS.primary} strokeWidth={1.8} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={ss.storeNameRow}>
              <Text style={ss.storeName}>{seller?.name || 'Tienda'}</Text>
              {(seller?.is_verified || seller?.verified) && (
                <View style={ss.verifiedBadge}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </View>
              )}
              {(seller?.is_premium || seller?.premium) && (
                <View style={ss.premiumBadge}>
                  <Text style={ss.premiumTxt}>PREMIUM</Text>
                </View>
              )}
            </View>
            <Text style={ss.storeType}>
              Tienda oficial · {seller?.location || 'Lima, Perú'}
            </Text>
            {seller?.description && (
              <Text style={ss.storeDesc} numberOfLines={2}>
                {seller.description}
              </Text>
            )}
          </View>
        </View>

        {/* ── ESTADÍSTICAS ── */}
        <View style={ss.statsRow}>
          <View style={ss.stat}>
            <View style={ss.statValRow}>
              <Star size={13} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
              <Text style={ss.statVal}>{seller?.rating || 5}</Text>
            </View>
            <Text style={ss.statLbl}>Rating</Text>
          </View>
          <View style={ss.statDiv} />
          <View style={ss.stat}>
            <Text style={ss.statVal}>{products.length}</Text>
            <Text style={ss.statLbl}>Productos</Text>
          </View>
          <View style={ss.statDiv} />
          <View style={ss.stat}>
            <Text style={ss.statVal}>{seller?.total_sales || 0}</Text>
            <Text style={ss.statLbl}>Ventas</Text>
          </View>
          <View style={ss.statDiv} />
          <View style={ss.stat}>
            <Text style={ss.statVal}>{seller?.followers || 0}</Text>
            <Text style={ss.statLbl}>Seguidores</Text>
          </View>
        </View>

        {/* ── CUPÓN ── */}
        <View style={ss.couponStrip}>
          <View style={ss.couponBadge}>
            <Text style={ss.couponBadgeTxt}>-5%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.couponTitle}>Código KAIF10</Text>
            <Text style={ss.couponSub}>Válido hasta el 31 de Mayo</Text>
          </View>
          <TouchableOpacity style={ss.couponCopyBtn}>
            <Copy size={13} color={COLORS.primary} strokeWidth={2} />
            <Text style={ss.couponCopyTxt}>Copiar</Text>
          </TouchableOpacity>
        </View>

        {/* ── BOTONES ACCIÓN ── */}
        <View style={ss.actionRow}>
          <TouchableOpacity
            style={[ss.followBtn, isFollowing && ss.followBtnActive]}
            onPress={() => setIsFollowing(v => !v)}>
            {isFollowing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Check size={15} color="#fff" strokeWidth={2.5} />
                <Text style={ss.followBtnTxtActive}>Siguiendo</Text>
              </View>
            ) : (
              <Text style={ss.followBtnTxt}>+ Seguir</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={ss.chatBtn}>
            <MessageCircle size={16} color={COLORS.gray800} strokeWidth={2} />
            <Text style={ss.chatBtnTxt}>Escribir</Text>
          </TouchableOpacity>
        </View>

        {/* ── TABS ── */}
        <View style={ss.tabs}>
          {STORE_TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[ss.tab, activeTab === i && ss.tabActive]}
              onPress={() => setActiveTab(i)}>
              <Text style={[ss.tabTxt, activeTab === i && ss.tabTxtActive]}>
                {tab}
                {i === 0 && products.length > 0 && (
                  <Text style={{ fontSize: 11 }}> ({products.length})</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB: PRINCIPAL ── */}
        {activeTab === 0 && (
          <View style={ss.tabContent}>
            {filtered.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Search size={36} color={COLORS.gray200} strokeWidth={1.5} />
                <Text style={ss.noResultsTxt}>
                  {searchQuery
                    ? `Sin productos para "${searchQuery}"`
                    : 'Esta tienda aún no tiene productos'}
                </Text>
              </View>
            ) : (
              <>
                <View style={ss.secHeader}>
                  <Text style={ss.secTitle}>
                    {searchQuery
                      ? `${filtered.length} resultado(s)`
                      : `${products.length} productos`}
                  </Text>
                </View>
                <View style={ss.grid}>
                  {filtered.map(product => (
                    <ProductItem key={String(product.id)} product={product} />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── TAB: RESEÑAS ── */}
        {activeTab === 1 && (
          <View style={ss.tabContent}>
            <View style={ss.ratingSum}>
              <Text style={ss.ratingSumBig}>{seller?.rating || 5}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 1, marginBottom: 4 }}>
                  {renderStars(Math.floor(seller?.rating || 5))}
                </View>
                <Text style={{ fontSize: 13, color: COLORS.gray400 }}>
                  Basado en todas las reseñas
                </Text>
              </View>
            </View>
            {STORE_REVIEWS.map(rev => (
              <View key={rev.id} style={ss.reviewCard}>
                <View style={ss.revHeader}>
                  <View style={ss.revAvatar}>
                    <Text style={ss.revAvatarTxt}>{rev.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.revName}>{rev.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 1 }}>{renderStars(rev.rating)}</View>
                  </View>
                  <Text style={ss.revDate}>{rev.date}</Text>
                </View>
                <Text style={ss.revText}>{rev.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── TAB: NOVEDADES ── */}
        {activeTab === 2 && (
          <View style={ss.tabContent}>
            <View style={ss.novedadCard}>
              <View style={ss.novedadIconWrap}>
                <Sparkles size={28} color={COLORS.primary} strokeWidth={1.8} />
              </View>
              <Text style={ss.novedadTitle}>Nuevos productos</Text>
              <Text style={ss.novedadSub}>
                {newProducts.length > 0
                  ? `${newProducts.length} artículos nuevos disponibles`
                  : 'Sin novedades por ahora'}
              </Text>
            </View>
            {newProducts.length > 0 ? (
              <View style={ss.grid}>
                {newProducts.map(product => (
                  <ProductItem key={String(product.id)} product={product} />
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: COLORS.gray400, fontSize: 14 }}>
                  No hay productos nuevos aún
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.white },
  topBar:          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.lg, paddingVertical: 10, backgroundColor: COLORS.primary },
  backBtn:         { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  searchWrap:      { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  searchInput:     { flex: 1, fontSize: 13, color: COLORS.gray800, padding: 0 },
  storeHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: SPACING.lg },
  storeAvatar:     { width: 64, height: 64, borderRadius: RADIUS.xl, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  storeLogoImg:    { width: 64, height: 64, borderRadius: RADIUS.xl },
  storeNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  storeName:       { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800 },
  verifiedBadge:   { backgroundColor: COLORS.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  premiumBadge:    { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  premiumTxt:      { color: COLORS.primary, fontSize: 9, fontWeight: FONT.black, letterSpacing: 0.5 },
  storeType:       { fontSize: 13, color: COLORS.gray400, marginBottom: 4 },
  storeDesc:       { fontSize: 12, color: COLORS.gray600, lineHeight: 17 },
  statsRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  stat:            { flex: 1, alignItems: 'center' },
  statVal:         { fontSize: 13, fontWeight: FONT.black, color: COLORS.gray800 },
  statValRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLbl:         { fontSize: 10, color: COLORS.gray400, marginTop: 2, textAlign: 'center' },
  statDiv:         { width: 1, height: 32, backgroundColor: COLORS.border },
  couponStrip:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.goldLight, borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.md },
  couponBadge:     { backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  couponBadgeTxt:  { fontWeight: FONT.black, fontSize: 14, color: COLORS.gray800 },
  couponTitle:     { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  couponSub:       { fontSize: 11, color: COLORS.gray400 },
  couponCopyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.white, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  couponCopyTxt:   { fontSize: 12, fontWeight: FONT.bold, color: COLORS.primary },
  actionRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  followBtn:       { flex: 1, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 10, alignItems: 'center' },
  followBtnActive: { backgroundColor: COLORS.primary },
  followBtnTxt:    { fontSize: 14, fontWeight: FONT.bold, color: COLORS.primary },
  followBtnTxtActive: { fontSize: 14, fontWeight: FONT.bold, color: '#fff' },
  chatBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: 20, paddingVertical: 10 },
  chatBtnTxt:      { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  tabs:            { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab:             { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabTxt:          { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.gray400 },
  tabTxtActive:    { color: COLORS.primary, fontWeight: FONT.bold },
  tabContent:      { padding: SPACING.lg },
  secHeader:       { marginBottom: SPACING.md },
  secTitle:        { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:            { width: '47.5%', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardImg:         { height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardImgReal:     { width: '100%', height: '100%', position: 'absolute' },
  discBadge:       { position: 'absolute', top: 7, left: 7, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  discTxt:         { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  favBtn:          { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  cardInfo:        { padding: SPACING.sm },
  cardPrice:       { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  cardOldPrice:    { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  cardName:        { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginVertical: 3 },
  cardStarsRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  cardStars:       { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },
  cartBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 7 },
  cartBtnTxt:      { fontSize: 12, fontWeight: FONT.black, color: COLORS.black },
  noResultsTxt:    { fontSize: 15, color: COLORS.gray400, marginTop: 10, textAlign: 'center' },
  ratingSum:       { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  ratingSumBig:    { fontSize: 40, fontWeight: FONT.black, color: COLORS.gray800 },
  reviewCard:      { backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10 },
  revHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  revAvatar:       { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  revAvatarTxt:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.primary },
  revName:         { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 2 },
  revDate:         { fontSize: 11, color: COLORS.gray400 },
  revText:         { fontSize: 13, color: COLORS.gray600, lineHeight: 20 },
  novedadCard:     { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg },
  novedadIconWrap: { width: 56, height: 56, borderRadius: RADIUS.full, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  novedadTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.primaryDark, marginBottom: 4 },
  novedadSub:      { fontSize: 13, color: COLORS.primary },
});