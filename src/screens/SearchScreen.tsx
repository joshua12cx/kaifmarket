// src/screens/SearchScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Flame } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';

// Términos de tendencia — contenido fijo por ahora. Si más adelante
// quieres que salgan solos según lo más buscado de verdad, haría
// falta una tabla tipo `search_logs(query, count)` para calcularlo.
const TRENDING = ['Audífonos Bluetooth', 'Smart Watch', 'Zapatillas', 'iPhone', 'Samsung'];

export default function SearchScreen({ navigation }: any) {
  const insets   = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query,    setQuery]    = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [searched, setSearched] = useState(false);

  // ── Destacados (grid inicial, sin búsqueda) ────────────────────
  const loadFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('sold', { ascending: false })
        .limit(20);

      setProducts(data || []);
    } catch (e) {
      if (__DEV__) { console.log('[SEARCH] loadFeatured error:', e); }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  // ── Búsqueda combinada Supabase + estáticos ───────────────────
  const doSearch = async (q = query) => {
    if (!q.trim()) { setSearched(false); loadFeatured(); return; }
    setLoading(true);
    setSearched(true);

    try {
      const { data: supabaseResults } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${q.trim()}%`);

      setProducts(supabaseResults || []);
    } catch (e) {
      if (__DEV__) { console.log('[SEARCH] doSearch error:', e); }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearQuery = () => { setQuery(''); setSearched(false); loadFeatured(); };

  return (
    <View style={[ss.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* ── BUSCADOR ── */}
      <View style={ss.searchWrap}>
        <View style={ss.searchBar}>
          <SearchIcon size={16} color={COLORS.gray400} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            style={ss.input}
            placeholder="Busca productos, marcas, tiendas..."
            placeholderTextColor={COLORS.gray400}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery}>
              <X size={16} color={COLORS.gray400} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── TENDENCIAS ── */}
        {!searched && (
          <View style={ss.section}>
            <View style={ss.trendTitleRow}>
              <Text style={ss.secTitle}>Tendencias</Text>
              <Flame size={16} color="#EA580C" strokeWidth={2} />
            </View>
            <View style={ss.chips}>
              {TRENDING.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={ss.chip}
                  onPress={() => { setQuery(tag); doSearch(tag); }}
                  activeOpacity={0.8}>
                  <Text style={ss.chipTxt}>📈 {tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* ── SIN RESULTADOS ── */}
        {!loading && searched && products.length === 0 && (
          <View style={ss.noResults}>
            <SearchIcon size={40} color={COLORS.gray600} strokeWidth={1.5} />
            <Text style={ss.noResultsTitle}>Sin resultados para "{query}"</Text>
            <TouchableOpacity style={ss.noResultsBtn} onPress={clearQuery}>
              <Text style={ss.noResultsBtnTxt}>Nueva búsqueda</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── GRID (Destacados o resultados) ── */}
        {!loading && products.length > 0 && (
          <View style={ss.section}>
            <Text style={ss.secTitle}>
              {searched ? `${products.length} resultado(s)` : 'Destacados'}
            </Text>
            <View style={ss.grid}>
              {products.map((product, i) => (
                <ProductCard
                  key={`${product.id}-${i}`}
                  product={product}
                  style={ss.gridItem}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                />
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
  container:      { flex: 1, backgroundColor: COLORS.black },
  searchWrap:     { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  searchBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 13, gap: 8 },
  input:          { flex: 1, fontSize: 14, color: COLORS.white, padding: 0 },

  section:        { padding: SPACING.lg },
  trendTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md },
  secTitle:       { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.md },

  chips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 9 },
  chipTxt:        { fontSize: 13, color: COLORS.gray200, fontWeight: FONT.semibold },

  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem:       { width: '47.5%' },

  noResults:      { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  noResultsTitle: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.white, textAlign: 'center' },
  noResultsBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  noResultsBtnTxt:{ color: '#fff', fontWeight: FONT.bold },
});