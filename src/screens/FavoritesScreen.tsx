// src/screens/FavoritesScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { PRODUCTS, SELLERS } from '../data';
import { useFavs, useCart } from '../context';

export default function FavoritesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { favs, toggle, favCount } = useFavs();
  const { dispatch } = useCart();

  const favProducts = PRODUCTS.filter(p => !!favs[p.id]);

  // ════════════════════════════════════════════════════
  // TODO BACKEND — descomentar cuando el backend esté listo
  // ════════════════════════════════════════════════════
  // useEffect(() => {
  //   const fetchFavs = async () => {
  //     const token = await AsyncStorage.getItem('token');
  //     const res = await fetch(`${API_URL}/users/me/favorites`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     const data = await res.json();
  //     // data.forEach(p => toggle(p.id)); // Hidratar favoritos desde servidor
  //   };
  //   fetchFavs();
  // }, []);
  //
  // const toggleFavBackend = async (productId: number) => {
  //   toggle(productId); // Actualización optimista local
  //   const token = await AsyncStorage.getItem('token');
  //   await fetch(`${API_URL}/users/me/favorites/${productId}`, {
  //     method: favs[productId] ? 'DELETE' : 'POST',
  //     headers: { Authorization: `Bearer ${token}` },
  //   });
  // };
  // ════════════════════════════════════════════════════

  const recommendedProducts = PRODUCTS.filter(p => !favs[p.id] && p.tag === 'hot').slice(0, 6);

  return (
    <View style={[fs.container, { paddingTop: insets.top }]}>
      <View style={fs.header}>
        <Text style={fs.headerTitle}>Favoritos</Text>
        {favCount > 0 && <Text style={fs.headerCount}>{favCount} productos</Text>}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {favProducts.length === 0 ? (
          /* ── VACÍO ── */
          <View style={fs.emptySection}>
            <Text style={fs.emptyEmoji}>❤️</Text>
            <Text style={fs.emptyTitle}>En favoritos aún no hay nada</Text>
            <Text style={fs.emptySub}>Mira los productos que hemos seleccionado para ti</Text>
          </View>
        ) : (
          /* ── LISTA DE FAVORITOS ── */
          <View style={fs.section}>
            <Text style={fs.sectionTitle}>Mis favoritos</Text>
            <View style={fs.grid}>
              {favProducts.map(product => {
                const disc = product.oldPrice
                  ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={fs.card}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                    activeOpacity={0.9}>

                    <View style={[fs.cardImg, { backgroundColor: product.bgColor }]}>
                      <Text style={{ fontSize: 52 }}>{product.emoji}</Text>
                      {disc && (
                        <View style={fs.discBadge}>
                          <Text style={fs.discTxt}>-{disc}%</Text>
                        </View>
                      )}
                      <TouchableOpacity style={fs.favBtn} onPress={() => toggle(product.id)}>
                        <Text style={{ fontSize: 18 }}>❤️</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={fs.cardInfo}>
                      <View style={fs.priceRow}>
                        <Text style={fs.price}>S/ {product.price}</Text>
                        {product.oldPrice && <Text style={fs.oldPrice}>S/ {product.oldPrice}</Text>}
                      </View>
                      <Text style={fs.name} numberOfLines={2}>{product.name}</Text>
                      <Text style={fs.stars}>★ {product.rating} ({product.reviews})</Text>

                      <TouchableOpacity
                        style={fs.addBtn}
                        onPress={() => dispatch({ type: 'ADD', id: product.id })}>
                        <Text style={fs.addBtnTxt}>🛒  Al carrito</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── TIENDAS / VENDEDORES FAVORITOS ── */}
        <View style={fs.section}>
          <View style={fs.sectionHeader}>
            <Text style={fs.sectionTitle}>Tiendas y marcas</Text>
            <Text style={fs.sectionSub}>Compras similares anteriores</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingLeft: 0 }}>
            {SELLERS.map(seller => (
              <TouchableOpacity key={seller.id} style={fs.sellerCard} activeOpacity={0.85}>
                <View style={fs.sellerAvatar}>
                  <Text style={{ fontSize: 22 }}>🏪</Text>
                </View>
                <Text style={fs.sellerName} numberOfLines={1}>{seller.name}</Text>
                <Text style={fs.sellerDisc}>-20%</Text>
                <TouchableOpacity style={fs.sellerFavBtn}>
                  <Text style={{ fontSize: 14 }}>🤍</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── RECOMENDADOS ── */}
        <View style={fs.section}>
          <View style={fs.sectionHeader}>
            <Text style={fs.sectionTitle}>Merecen tu primer corazón</Text>
          </View>
          <View style={fs.grid}>
            {recommendedProducts.map(product => {
              const disc = product.oldPrice
                ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

              return (
                <TouchableOpacity
                  key={product.id}
                  style={fs.card}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  activeOpacity={0.9}>
                  <View style={[fs.cardImg, { backgroundColor: product.bgColor }]}>
                    <Text style={{ fontSize: 52 }}>{product.emoji}</Text>
                    {disc && (
                      <View style={fs.discBadge}>
                        <Text style={fs.discTxt}>-{disc}%</Text>
                      </View>
                    )}
                    <TouchableOpacity style={fs.favBtn} onPress={() => toggle(product.id)}>
                      <Text style={{ fontSize: 18 }}>{favs[product.id] ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={fs.cardInfo}>
                    <View style={fs.priceRow}>
                      <Text style={fs.price}>S/ {product.price}</Text>
                      {product.oldPrice && <Text style={fs.oldPrice}>S/ {product.oldPrice}</Text>}
                    </View>
                    <Text style={fs.name} numberOfLines={2}>{product.name}</Text>
                    <Text style={fs.stars}>★ {product.rating} ({product.reviews})</Text>
                    <TouchableOpacity
                      style={fs.addBtn}
                      onPress={() => dispatch({ type: 'ADD', id: product.id })}>
                      <Text style={fs.addBtnTxt}>🛒  Al carrito</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const fs = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.gray50 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  headerTitle:  { fontSize: 20, fontWeight: FONT.black, color: COLORS.gray800 },
  headerCount:  { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold },
  emptySection: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 40 },
  emptyEmoji:   { fontSize: 72, marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800, textAlign: 'center', marginBottom: 8 },
  emptySub:     { fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  section:      { padding: SPACING.lg, paddingBottom: SPACING.sm },
  sectionHeader:{ marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 4 },
  sectionSub:   { fontSize: 12, color: COLORS.gray400 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:         { width: '47.5%', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardImg:      { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  discBadge:    { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt:      { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  favBtn:       { position: 'absolute', top: 6, right: 8, padding: 4 },
  cardInfo:     { padding: SPACING.sm },
  priceRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 },
  price:        { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  oldPrice:     { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name:         { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginBottom: 4 },
  stars:        { fontSize: 11, color: '#F5A623', marginBottom: 6 },
  addBtn:       { backgroundColor: '#FFD700', borderRadius: RADIUS.md, paddingVertical: 7, alignItems: 'center' },
  addBtnTxt:    { fontSize: 12, fontWeight: FONT.black, color: COLORS.gray800 },
  sellerCard:   { width: 110, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center', position: 'relative', ...SHADOW.card },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  sellerName:   { fontSize: 11, fontWeight: FONT.bold, color: COLORS.gray800, textAlign: 'center', marginBottom: 4 },
  sellerDisc:   { fontSize: 12, fontWeight: FONT.black, color: COLORS.red },
  sellerFavBtn: { position: 'absolute', top: 6, right: 6 },
});
