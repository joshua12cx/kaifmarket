// src/screens/SellerStoreScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { PRODUCTS, SELLERS } from '../data';
import { useCart } from '../context';

const STORE_TABS = ['Principal', 'Reseñas', 'Novedades'];

export default function SellerStoreScreen({ route, navigation }: any) {
  const { sellerId } = route.params;
  const insets = useSafeAreaInsets();
  const { dispatch } = useCart();

  const [activeTab,  setActiveTab]  = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  const seller   = SELLERS.find(s => s.id === sellerId) || SELLERS[0];
  const products = PRODUCTS.filter(p => p.sellerId === sellerId);
  const filtered = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  // ════════════════════════════════════════════════════
  // TODO BACKEND — descomentar cuando el backend esté listo
  // ════════════════════════════════════════════════════
  // useEffect(() => {
  //   const fetchSellerData = async () => {
  //     const res = await fetch(`${API_URL}/sellers/${sellerId}`);
  //     const data = await res.json();
  //     setSeller(data.seller);
  //     setProducts(data.products);
  //   };
  //   fetchSellerData();
  // }, [sellerId]);
  //
  // const handleFollow = async () => {
  //   const token = await AsyncStorage.getItem('token');
  //   setIsFollowing(v => !v); // Optimista
  //   await fetch(`${API_URL}/sellers/${sellerId}/follow`, {
  //     method: isFollowing ? 'DELETE' : 'POST',
  //     headers: { Authorization: `Bearer ${token}` },
  //   });
  // };
  // ════════════════════════════════════════════════════

  const STORE_REVIEWS = [
    { id: 1, name: 'Ana C.',    avatar: '👩', rating: 5, text: 'Excelente vendedor, muy puntual y producto de calidad.', date: 'hace 1 día' },
    { id: 2, name: 'Luis M.',   avatar: '👨', rating: 5, text: 'Todo perfecto, lo recomiendo totalmente.', date: 'hace 3 días' },
    { id: 3, name: 'Rosa P.',   avatar: '🧑', rating: 4, text: 'Buen producto, envío un poco tardó pero llegó bien.', date: 'hace 1 sem' },
  ];

  const renderStars = (n: number) =>
    Array(5).fill(0).map((_, i) => (
      <Text key={i} style={{ color: i < n ? '#F5A623' : COLORS.gray200, fontSize: 13 }}>★</Text>
    ));

  return (
    <View style={[ss.container, { paddingTop: insets.top }]}>

      {/* ── TOP BAR ── */}
      <View style={ss.topBar}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ss.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={ss.searchWrap}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={ss.searchInput}
            placeholder="Buscar en la tienda"
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={ss.topBtn}>
          <Text style={{ fontSize: 18 }}>↗️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ss.topBtn}>
          <Text style={{ fontSize: 18 }}>🤍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HEADER TIENDA ── */}
        <View style={ss.storeHeader}>
          <View style={ss.storeAvatar}>
            <Text style={{ fontSize: 32 }}>🏪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={ss.storeNameRow}>
              <Text style={ss.storeName}>{seller.name}</Text>
              {seller.verified && (
                <View style={ss.verifiedBadge}>
                  <Text style={ss.verifiedTxt}>✓</Text>
                </View>
              )}
              {seller.premium && (
                <View style={ss.premiumBadge}>
                  <Text style={ss.premiumTxt}>PREMIUM</Text>
                </View>
              )}
            </View>
            <Text style={ss.storeType}>Tienda oficial · {seller.location}</Text>
          </View>
        </View>

        {/* ── ESTADÍSTICAS ── */}
        <View style={ss.statsRow}>
          <View style={ss.stat}>
            <Text style={ss.statVal}>⭐ {seller.rating}</Text>
            <Text style={ss.statLbl}>3.9K opiniones</Text>
          </View>
          <View style={ss.statDiv} />
          <View style={ss.stat}>
            <Text style={ss.statVal}>25.6K</Text>
            <Text style={ss.statLbl}>Pedidos</Text>
          </View>
          <View style={ss.statDiv} />
          <View style={ss.stat}>
            <Text style={ss.statVal}>4.4K</Text>
            <Text style={ss.statLbl}>Seguidores</Text>
          </View>
          <View style={ss.statDiv} />
          <View style={ss.stat}>
            <Text style={ss.statVal}>3 años</Text>
            <Text style={ss.statLbl}>En Kaif</Text>
          </View>
        </View>

        {/* ── CUPÓN ── */}
        <View style={ss.couponStrip}>
          <Text style={ss.couponBadge}>-5%</Text>
          <View style={{ flex: 1 }}>
            <Text style={ss.couponTitle}>Código KAIF10 para suscriptores</Text>
            <Text style={ss.couponSub}>Válido hasta el 12/11</Text>
          </View>
          <TouchableOpacity style={ss.couponCopyBtn}>
            <Text style={ss.couponCopyTxt}>Copiar</Text>
          </TouchableOpacity>
        </View>

        {/* ── BOTONES ACCIÓN ── */}
        <View style={ss.actionRow}>
          <TouchableOpacity
            style={[ss.followBtn, isFollowing && ss.followBtnActive]}
            onPress={() => setIsFollowing(v => !v)}>
            <Text style={[ss.followBtnTxt, isFollowing && ss.followBtnTxtActive]}>
              {isFollowing ? '✓ Siguiendo' : '+ Seguir'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={ss.chatBtn}>
            <Text style={{ fontSize: 16 }}>💬</Text>
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
              <Text style={[ss.tabTxt, activeTab === i && ss.tabTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB: PRINCIPAL ── */}
        {activeTab === 0 && (
          <View style={ss.tabContent}>
            {filtered.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40 }}>🔍</Text>
                <Text style={ss.noResultsTxt}>Sin productos para "{searchQuery}"</Text>
              </View>
            ) : (
              <>
                <View style={ss.secHeader}>
                  <Text style={ss.secTitle}>
                    {searchQuery ? `${filtered.length} resultado(s)` : `${products.length} productos`}
                  </Text>
                </View>
                <View style={ss.grid}>
                  {filtered.map(product => {
                    const disc = product.oldPrice
                      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;
                    return (
                      <TouchableOpacity
                        key={product.id}
                        style={ss.card}
                        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                        activeOpacity={0.9}>
                        <View style={[ss.cardImg, { backgroundColor: product.bgColor }]}>
                          <Text style={{ fontSize: 50 }}>{product.emoji}</Text>
                          {disc && (
                            <View style={ss.discBadge}>
                              <Text style={ss.discTxt}>-{disc}%</Text>
                            </View>
                          )}
                          <TouchableOpacity style={ss.favBtn}>
                            <Text style={{ fontSize: 16 }}>🤍</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={ss.cardInfo}>
                          <Text style={ss.cardPrice}>S/ {product.price}</Text>
                          {product.oldPrice && (
                            <Text style={ss.cardOldPrice}>S/ {product.oldPrice}</Text>
                          )}
                          <Text style={ss.cardName} numberOfLines={2}>{product.name}</Text>
                          <Text style={ss.cardStars}>★ {product.rating} · {product.sold} vendidos</Text>
                          <TouchableOpacity
                            style={ss.cartBtn}
                            onPress={() => dispatch({ type: 'ADD', id: product.id })}>
                            <Text style={ss.cartBtnTxt}>🛒  Al carrito</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── TAB: RESEÑAS ── */}
        {activeTab === 1 && (
          <View style={ss.tabContent}>
            {/* Rating summary */}
            <View style={ss.ratingSum}>
              <Text style={ss.ratingSumBig}>{seller.rating}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>{renderStars(Math.floor(seller.rating))}</View>
                <Text style={{ fontSize: 13, color: COLORS.gray400 }}>3.9K opiniones</Text>
              </View>
            </View>

            {STORE_REVIEWS.map(rev => (
              <View key={rev.id} style={ss.reviewCard}>
                <View style={ss.revHeader}>
                  <Text style={ss.revAvatar}>{rev.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.revName}>{rev.name}</Text>
                    <View style={{ flexDirection: 'row' }}>{renderStars(rev.rating)}</View>
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
              <Text style={ss.novedadEmoji}>🆕</Text>
              <Text style={ss.novedadTitle}>Nuevos productos esta semana</Text>
              <Text style={ss.novedadSub}>{products.filter(p => p.tag === 'new').length} artículos nuevos disponibles</Text>
            </View>
            <View style={ss.grid}>
              {products.filter(p => p.tag === 'new').map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={ss.card}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  activeOpacity={0.9}>
                  <View style={[ss.cardImg, { backgroundColor: product.bgColor }]}>
                    <Text style={{ fontSize: 50 }}>{product.emoji}</Text>
                    <View style={ss.newBadge}><Text style={ss.newBadgeTxt}>NUEVO</Text></View>
                  </View>
                  <View style={ss.cardInfo}>
                    <Text style={ss.cardPrice}>S/ {product.price}</Text>
                    <Text style={ss.cardName} numberOfLines={2}>{product.name}</Text>
                    <Text style={ss.cardStars}>★ {product.rating}</Text>
                    <TouchableOpacity
                      style={ss.cartBtn}
                      onPress={() => dispatch({ type: 'ADD', id: product.id })}>
                      <Text style={ss.cartBtnTxt}>🛒  Al carrito</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.white },
  topBar:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:        { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:        { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  searchWrap:     { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  searchInput:    { flex: 1, fontSize: 13, color: COLORS.gray800, padding: 0 },
  topBtn:         { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  storeHeader:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: SPACING.lg },
  storeAvatar:    { width: 64, height: 64, borderRadius: RADIUS.xl, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  storeNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  storeName:      { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800 },
  verifiedBadge:  { backgroundColor: COLORS.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  verifiedTxt:    { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  premiumBadge:   { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  premiumTxt:     { color: COLORS.primary, fontSize: 9, fontWeight: FONT.black, letterSpacing: 0.5 },
  storeType:      { fontSize: 13, color: COLORS.gray400 },
  statsRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  stat:           { flex: 1, alignItems: 'center' },
  statVal:        { fontSize: 13, fontWeight: FONT.black, color: COLORS.gray800 },
  statLbl:        { fontSize: 10, color: COLORS.gray400, marginTop: 2, textAlign: 'center' },
  statDiv:        { width: 1, height: 32, backgroundColor: COLORS.border },
  couponStrip:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD700', borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.md },
  couponBadge:    { backgroundColor: '#FFD700', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, fontWeight: FONT.black, fontSize: 14, color: COLORS.gray800 },
  couponTitle:    { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  couponSub:      { fontSize: 11, color: COLORS.gray400 },
  couponCopyBtn:  { backgroundColor: COLORS.white, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  couponCopyTxt:  { fontSize: 12, fontWeight: FONT.bold, color: COLORS.primary },
  actionRow:      { flexDirection: 'row', gap: 10, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  followBtn:      { flex: 1, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 10, alignItems: 'center' },
  followBtnActive:{ backgroundColor: COLORS.primary },
  followBtnTxt:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.primary },
  followBtnTxtActive: { color: '#fff' },
  chatBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: 20, paddingVertical: 10 },
  chatBtnTxt:     { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  tabs:           { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab:            { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabTxt:         { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.gray400 },
  tabTxtActive:   { color: COLORS.primary, fontWeight: FONT.bold },
  tabContent:     { padding: SPACING.lg },
  secHeader:      { marginBottom: SPACING.md },
  secTitle:       { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:           { width: '47.5%', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardImg:        { height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  discBadge:      { position: 'absolute', top: 7, left: 7, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  discTxt:        { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  newBadge:       { position: 'absolute', top: 7, left: 7, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 },
  newBadgeTxt:    { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  favBtn:         { position: 'absolute', top: 6, right: 8, padding: 4 },
  cardInfo:       { padding: SPACING.sm },
  cardPrice:      { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  cardOldPrice:   { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  cardName:       { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginVertical: 3 },
  cardStars:      { fontSize: 11, color: '#F5A623', marginBottom: 6 },
  cartBtn:        { backgroundColor: '#FFD700', borderRadius: RADIUS.md, paddingVertical: 7, alignItems: 'center' },
  cartBtnTxt:     { fontSize: 12, fontWeight: FONT.black, color: COLORS.gray800 },
  noResultsTxt:   { fontSize: 15, color: COLORS.gray400, marginTop: 10 },
  ratingSum:      { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  ratingSumBig:   { fontSize: 40, fontWeight: FONT.black, color: COLORS.gray800 },
  reviewCard:     { backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10 },
  revHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  revAvatar:      { fontSize: 28, width: 40, height: 40, textAlign: 'center', lineHeight: 40 },
  revName:        { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 2 },
  revDate:        { fontSize: 11, color: COLORS.gray400 },
  revText:        { fontSize: 13, color: COLORS.gray600, lineHeight: 20 },
  novedadCard:    { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg },
  novedadEmoji:   { fontSize: 40, marginBottom: 8 },
  novedadTitle:   { fontSize: 16, fontWeight: FONT.black, color: COLORS.primaryDark, marginBottom: 4 },
  novedadSub:     { fontSize: 13, color: COLORS.primary },
});
