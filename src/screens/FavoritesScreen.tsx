// src/screens/FavoritesScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { PRODUCTS, SELLERS } from '../data';
import { useFavs, useCart, useAuth } from '../context';
import { supabase } from '../lib/supabase';

export default function FavoritesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { favs, toggle, favCount } = useFavs();
  const { dispatch } = useCart();
  const { user } = useAuth();

  const [supabaseProds, setSupabaseProds] = useState<Record<string, any>>({});
  const [supabaseSellers, setSupabaseSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Cargar productos y vendedores de Supabase ─────────────────
  const fetchData = useCallback(async () => {
    try {
      // 1. Productos favoritos de Supabase
      const stringIds = Object.keys(favs).filter(id =>
        favs[id] && isNaN(Number(id))
      );
      if (stringIds.length > 0) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .in('id', stringIds);

        if (data) {
          const map: Record<string, any> = {};
          data.forEach((p: any) => { map[p.id] = p; });
          setSupabaseProds(map);
        }
      }

      // 2. Vendedores de Supabase
      const { data: sellersData } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      setSupabaseSellers(sellersData || []);

    } catch (e) {
      if (__DEV__) { console.log('[FAVS] Error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favs]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Construir lista de favoritos ──────────────────────────────
  const favProducts = Object.keys(favs)
    .filter(id => favs[id])
    .map(id => {
      const isString = isNaN(Number(id));
      const raw = isString
        ? supabaseProds[id]
        : PRODUCTS.find(p => p.id === Number(id));
      if (!raw) { return null; }
      return {
        ...raw,
        bgColor: raw.bgColor || raw.bg_color || '#F5F5F5',
        oldPrice: raw.oldPrice || raw.old_price || null,
        imageUrl: raw.image_url || null,
        emoji: raw.emoji || '📦',
        reviews: raw.reviews || raw.review_count || 0,
      };
    })
    .filter(Boolean) as any[];

  // ── Combinar vendedores Supabase + estáticos sin duplicados ───
  const staticSellerIds = new Set(supabaseSellers.map((s: any) => s.user_id));
  const allSellers = [
    ...supabaseSellers,
    ...SELLERS.filter(s => !staticSellerIds.has(s.id)),
  ];

  const recommendedProducts = PRODUCTS
    .filter(p => !favs[p.id] && p.tag === 'hot')
    .slice(0, 6);

  // ── Card de producto ──────────────────────────────────────────
  const ProductCard = ({ product }: { product: any }) => {
    const disc = product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

    return (
      <TouchableOpacity
        style={fs.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
        activeOpacity={0.9}>
        <View style={[fs.cardImg, { backgroundColor: product.bgColor }]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={fs.cardImgReal} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 52 }}>{product.emoji}</Text>
          )}
          {disc && (
            <View style={fs.discBadge}>
              <Text style={fs.discTxt}>-{disc}%</Text>
            </View>
          )}
          <TouchableOpacity style={fs.favBtn} onPress={() => toggle(product.id)}>
            <Text style={{ fontSize: 18 }}>{favs[String(product.id)] ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        <View style={fs.cardInfo}>
          <View style={fs.priceRow}>
            <Text style={fs.price}>S/ {product.price}</Text>
            {product.oldPrice && <Text style={fs.oldPrice}>S/ {product.oldPrice}</Text>}
          </View>
          <Text style={fs.name} numberOfLines={2}>{product.name}</Text>
          <Text style={fs.stars}>★ {product.rating || 5} ({product.reviews || 0})</Text>
          <TouchableOpacity
            style={fs.addBtn}
            onPress={() => dispatch({ type: 'ADD', id: product.id })}>
            <Text style={fs.addBtnTxt}>🛒 Al carrito</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[fs.container, { paddingTop: insets.top }]}>
      <View style={fs.header}>
        <Text style={fs.headerTitle}>Favoritos</Text>
        {favCount > 0 && (
          <Text style={fs.headerCount}>{favCount} producto{favCount > 1 ? 's' : ''}</Text>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }>

          {/* ── VACÍO ── */}
          {favProducts.length === 0 && (
            <View style={fs.emptySection}>
              <Text style={fs.emptyEmoji}>❤️</Text>
              <Text style={fs.emptyTitle}>En favoritos aún no hay nada</Text>
              <Text style={fs.emptySub}>
                Toca el ❤️ en cualquier producto para guardarlo aquí
              </Text>
              <TouchableOpacity
                style={fs.emptyBtn}
                onPress={() => navigation.navigate('HomeMain')}>
                <Text style={fs.emptyBtnTxt}>Explorar productos</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── LISTA DE FAVORITOS ── */}
          {favProducts.length > 0 && (
            <View style={fs.section}>
              <View style={fs.sectionHeader}>
                <Text style={fs.sectionTitle}>Mis favoritos</Text>
                <TouchableOpacity onPress={() => {
                  Object.keys(favs).filter(id => favs[id]).forEach(id => toggle(id));
                }}>
                  <Text style={{ fontSize: 13, color: COLORS.red, fontWeight: FONT.bold }}>
                    Limpiar
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}>
                {favProducts.map(product => (
                  <ProductCard key={String(product.id)} product={product} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── TIENDAS Y MARCAS ── */}
          <View style={fs.section}>
            <View style={fs.sectionHeader}>
              <Text style={fs.sectionTitle}>Tiendas y marcas</Text>
              <Text style={fs.sectionSub}>Compras similares anteriores</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}>
              {allSellers.map((seller: any) => (
                <TouchableOpacity
                  key={String(seller.id)}
                  style={fs.sellerCard}
                  onPress={() => navigation.navigate('SellerStore', { sellerId: seller.id })}
                  activeOpacity={0.85}>
                  {seller.logo_url ? (
                    <Image
                      source={{ uri: seller.logo_url }}
                      style={fs.sellerLogoImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={fs.sellerAvatar}>
                      <Text style={{ fontSize: 22 }}>🏪</Text>
                    </View>
                  )}
                  <Text style={fs.sellerName} numberOfLines={1}>{seller.name}</Text>
                  <Text style={fs.sellerDisc}>-20%</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── RECOMENDADOS ── */}
          {recommendedProducts.length > 0 && (
            <View style={fs.section}>
              <Text style={fs.sectionTitle}>Merecen tu primer corazón</Text>
              <View style={fs.grid}>
                {recommendedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      bgColor: product.bgColor || '#F5F5F5',
                      oldPrice: product.oldPrice || null,
                      imageUrl: null,
                      emoji: product.emoji || '📦',
                      reviews: product.reviews || 0,
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const fs = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: FONT.black, color: COLORS.gray800 },
  headerCount: { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold },
  emptySection: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.gray400, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 28, paddingVertical: 12 },
  emptyBtnTxt: { color: '#fff', fontWeight: FONT.black, fontSize: 14 },
  section: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: COLORS.gray400 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: 160, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardImg: { height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardImgReal: { width: '100%', height: '100%', position: 'absolute' },
  discBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discTxt: { color: '#fff', fontSize: 10, fontWeight: FONT.black },
  favBtn: { position: 'absolute', top: 6, right: 8, padding: 4 },
  cardInfo: { padding: SPACING.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 },
  price: { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  oldPrice: { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  name: { fontSize: 12, color: COLORS.gray600, lineHeight: 16, marginBottom: 4 },
  stars: { fontSize: 11, color: '#F5A623', marginBottom: 6 },
  addBtn: { backgroundColor: '#FFD700', borderRadius: RADIUS.md, paddingVertical: 7, alignItems: 'center' },
  addBtnTxt: { fontSize: 12, fontWeight: FONT.black, color: COLORS.gray800 },
  sellerCard: { width: 110, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center', ...SHADOW.card },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  sellerLogoImg: { width: 52, height: 52, borderRadius: 26, marginBottom: 6 },
  sellerName: { fontSize: 11, fontWeight: FONT.bold, color: COLORS.gray800, textAlign: 'center', marginBottom: 4 },
  sellerDisc: { fontSize: 12, fontWeight: FONT.black, color: COLORS.red },
});