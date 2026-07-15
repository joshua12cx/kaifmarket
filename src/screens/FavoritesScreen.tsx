// src/screens/FavoritesScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useFavs } from '../context';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function FavoritesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { favs, favCount } = useFavs();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const favIds = Object.keys(favs).filter(id => favs[id]);
  const favIdsKey = favIds.slice().sort().join(',');

  // ── Solo productos reales de Supabase, sin data sintética ──────
  const fetchFavorites = useCallback(async () => {
    if (favIds.length === 0) { setProducts([]); setLoading(false); setRefreshing(false); return; }
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favIds);

      if (__DEV__) { console.log('[FAVS] fetch:', { count: data?.length, error }); }
      setProducts(data || []);
    } catch (e) {
      if (__DEV__) { console.log('[FAVS] fetch error:', e); }
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favIdsKey]);

  useEffect(() => { setLoading(true); fetchFavorites(); }, [fetchFavorites]);

  const onRefresh = () => { setRefreshing(true); fetchFavorites(); };

  return (
    <View style={[fs.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={fs.header}>
        <Text style={fs.headerTitle}>Mis Favoritos</Text>
        {favCount > 0 && (
          <Text style={fs.headerCount}>{favCount} producto{favCount > 1 ? 's' : ''}</Text>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={fs.empty}>
          <View style={fs.emptyIconWrap}>
            <Heart size={40} color={COLORS.gray600} strokeWidth={1.5} />
          </View>
          <Text style={fs.emptyTitle}>Sin favoritos aún</Text>
          <Text style={fs.emptySub}>Toca el ♥ en los productos que te gusten</Text>
          <TouchableOpacity
            style={fs.emptyBtn}
            onPress={() => navigation.navigate('HomeMain')}>
            <Text style={fs.emptyBtnTxt}>Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
          <View style={fs.grid}>
            {products.map((p, i) => (
              <ProductCard
                key={`${p.id}-${i}`}
                product={p}
                style={fs.gridItem}
                onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const fs = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.black },
  header:        { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  headerTitle:   { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },
  headerCount:   { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },

  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: FONT.black, color: COLORS.white, marginBottom: 8 },
  emptySub:      { fontSize: 14, color: COLORS.gray400, textAlign: 'center', marginBottom: 24 },
  emptyBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 28, paddingVertical: 13 },
  emptyBtnTxt:   { color: '#fff', fontWeight: FONT.black, fontSize: 14 },

  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem:      { width: '47.5%' },
});