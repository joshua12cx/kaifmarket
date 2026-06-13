// src/screens/SearchScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { CATEGORIES, PRODUCTS } from '../data';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';

const PRICE_RANGES = [
  { label: 'Hasta S/ 50',   min: 0,   max: 50   },
  { label: 'S/ 50–100',     min: 50,  max: 100  },
  { label: 'S/ 100–200',    min: 100, max: 200  },
  { label: 'Más de S/ 200', min: 200, max: 9999 },
];

const SORT_OPTIONS = ['Relevancia', 'Precio ↑', 'Precio ↓', 'Más vendidos', 'Mejor rating'];
const DEFAULT_RECENT = ['Auriculares', 'Zapatillas', 'Tablet', 'Cafetera', 'Smartwatch'];

export default function SearchScreen({ navigation }: any) {
  const insets   = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query,            setQuery]            = useState('');
  const [activeCat,        setActiveCat]        = useState('todos');
  const [onlyPremium,      setOnlyPremium]      = useState(false);
  const [onlySale,         setOnlySale]         = useState(false);
  const [activePriceRange, setActivePriceRange] = useState<number | null>(null);
  const [activeSort,       setActiveSort]       = useState(0);
  const [products,         setProducts]         = useState<any[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [recent,           setRecent]           = useState<string[]>(DEFAULT_RECENT);
  const [searched,         setSearched]         = useState(false);
  const [showFilters,      setShowFilters]      = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // ── Búsqueda combinada Supabase + estáticos ───────────────────
  const doSearch = async (q = query) => {
    if (!q.trim()) { return; }
    setLoading(true);
    setSearched(true);
    setShowFilters(false);

    try {
      // 1. Query a Supabase
      let supaQuery = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${q.trim()}%`);

      if (activeCat !== 'todos') {
        supaQuery = supaQuery.eq('category_id', activeCat);
      }
      if (onlySale) {
        supaQuery = supaQuery.not('old_price', 'is', null);
      }
      if (activePriceRange !== null) {
        const range = PRICE_RANGES[activePriceRange];
        supaQuery = supaQuery.gte('price', range.min).lte('price', range.max);
      }

      const { data: supabaseResults } = await supaQuery;

      // 2. Filtrar estáticos
      const qLower = q.trim().toLowerCase();
      let staticResults = PRODUCTS.filter(p => {
        const matchQuery = p.name.toLowerCase().includes(qLower) ||
          p.description?.toLowerCase().includes(qLower);
        const matchCat   = activeCat === 'todos' || p.category === activeCat;
        const matchSale  = !onlySale || !!p.oldPrice;
        const matchPrice = activePriceRange === null ||
          (p.price >= PRICE_RANGES[activePriceRange].min &&
           p.price <= PRICE_RANGES[activePriceRange].max);
        return matchQuery && matchCat && matchSale && matchPrice;
      });

      // 3. Combinar — Supabase primero
      let combined: any[] = [
        ...(supabaseResults || []),
        ...staticResults,
      ];

      // 4. Ordenar
      if (activeSort === 1) { combined.sort((a, b) => a.price - b.price); }
      if (activeSort === 2) { combined.sort((a, b) => b.price - a.price); }
      if (activeSort === 3) { combined.sort((a, b) => (b.sold || 0) - (a.sold || 0)); }
      if (activeSort === 4) { combined.sort((a, b) => (b.rating || 0) - (a.rating || 0)); }

      setProducts(combined);

      // Guardar en recientes
      if (!recent.includes(q.trim())) {
        setRecent(prev => [q.trim(), ...prev.slice(0, 6)]);
      }

    } catch (e) {
      if (__DEV__) { console.log('[SEARCH] Error:', e); }
      // Si falla Supabase, solo estáticos
      const qLower = q.trim().toLowerCase();
      const staticResults = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(qLower)
      );
      setProducts(staticResults as any[]);
    } finally {
      setLoading(false);
    }
  };

  const clearQuery  = () => { setQuery(''); setSearched(false); setProducts([]); };
  const removeRecent = (r: string) => setRecent(prev => prev.filter(x => x !== r));

  return (
    <View style={[ss.container, { paddingTop: insets.top }]}>

      {/* ── BUSCADOR ── */}
      <View style={ss.searchHeader}>
        <View style={ss.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={ss.input}
            placeholder="Busca en Kaif Market..."
            placeholderTextColor={COLORS.gray400}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery}>
              <Text style={{ color: COLORS.gray400, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={ss.searchBtn} onPress={() => doSearch()}>
          <Text style={ss.searchBtnTxt}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* ── FILTROS RÁPIDOS ── */}
      {searched && (
        <View style={ss.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: SPACING.lg }}>
            <TouchableOpacity
              style={[ss.filterChip, showFilters && ss.filterChipActive]}
              onPress={() => setShowFilters(v => !v)}>
              <Text style={{ fontSize: 12 }}>⇅</Text>
              <Text style={[ss.filterChipTxt, showFilters && ss.filterChipTxtActive]}>
                {SORT_OPTIONS[activeSort]}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[ss.filterChip, onlySale && ss.filterChipActive]}
              onPress={() => { setOnlySale(v => !v); setTimeout(() => doSearch(), 100); }}>
              <Text style={[ss.filterChipTxt, onlySale && ss.filterChipTxtActive]}>
                🏷️ Oferta
              </Text>
            </TouchableOpacity>

            {PRICE_RANGES.map((range, i) => (
              <TouchableOpacity
                key={i}
                style={[ss.filterChip, activePriceRange === i && ss.filterChipActive]}
                onPress={() => {
                  setActivePriceRange(activePriceRange === i ? null : i);
                  setTimeout(() => doSearch(), 100);
                }}>
                <Text style={[ss.filterChipTxt, activePriceRange === i && ss.filterChipTxtActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── PANEL ORDENAMIENTO ── */}
      {showFilters && (
        <View style={ss.sortPanel}>
          {SORT_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt}
              style={ss.sortOpt}
              onPress={() => {
                setActiveSort(i);
                setShowFilters(false);
                setTimeout(() => doSearch(), 100);
              }}>
              <Text style={[ss.sortOptTxt, activeSort === i && ss.sortOptTxtActive]}>
                {opt}
              </Text>
              {activeSort === i && <Text style={{ color: COLORS.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── PANTALLA INICIAL ── */}
        {!searched && (
          <>
            {recent.length > 0 && (
              <View style={ss.section}>
                <View style={ss.secHeader}>
                  <Text style={ss.secTitle}>Búsquedas recientes</Text>
                  <TouchableOpacity onPress={() => setRecent([])}>
                    <Text style={ss.secLink}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
                <View style={ss.chips}>
                  {recent.map(r => (
                    <View key={r} style={ss.chip}>
                      <TouchableOpacity onPress={() => { setQuery(r); doSearch(r); }}>
                        <Text style={ss.chipTxt}>🕐 {r}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeRecent(r)} style={{ paddingLeft: 4 }}>
                        <Text style={{ color: COLORS.gray400, fontSize: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Categorías */}
            <View style={ss.section}>
              <Text style={ss.secTitle}>Categorías</Text>
              <View style={ss.catsGrid}>
                {CATEGORIES.filter(c => c.id !== 'todos').map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={ss.catCard}
                    onPress={() => {
                      setActiveCat(cat.id);
                      setQuery(cat.label);
                      doSearch(cat.label);
                    }}>
                    <View style={[ss.catImgWrap, { backgroundColor: COLORS.primaryLight }]}>
                      <Text style={{ fontSize: 32 }}>{cat.emoji}</Text>
                    </View>
                    <Text style={ss.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Populares */}
            <View style={ss.section}>
              <Text style={ss.secTitle}>Populares ahora</Text>
              <View style={ss.chips}>
                {['Auriculares BT', 'Smartwatch', 'Licuadora', 'Running', 'Vitamina C'].map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={ss.tagChip}
                    onPress={() => { setQuery(tag); doSearch(tag); }}>
                    <Text style={ss.tagChipTxt}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.gray400, marginTop: 12 }}>Buscando...</Text>
          </View>
        )}

        {/* ── SIN RESULTADOS ── */}
        {!loading && searched && products.length === 0 && (
          <View style={ss.noResults}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
            <Text style={ss.noResultsTitle}>Sin resultados para "{query}"</Text>
            <Text style={ss.noResultsSub}>
              Intenta con otra palabra o revisa los filtros
            </Text>
            <TouchableOpacity style={ss.noResultsBtn} onPress={clearQuery}>
              <Text style={ss.noResultsBtnTxt}>Nueva búsqueda</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── RESULTADOS ── */}
        {!loading && products.length > 0 && (
          <View style={ss.section}>
            <View style={ss.resultsHeader}>
              <Text style={ss.resultsCount}>
                {products.length} resultado(s) para "{query}"
              </Text>
              <TouchableOpacity onPress={clearQuery}>
                <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold }}>
                  Limpiar
                </Text>
              </TouchableOpacity>
            </View>
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
  container:           { flex: 1, backgroundColor: COLORS.gray50 },
  searchHeader:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  searchBar:           { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 11, gap: 6 },
  input:               { flex: 1, fontSize: 14, color: COLORS.gray800, padding: 0 },
  searchBtn:           { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 11 },
  searchBtnTxt:        { color: '#fff', fontWeight: FONT.bold, fontSize: 14 },
  filterBar:           { backgroundColor: COLORS.white, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  filterChip:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'transparent' },
  filterChipActive:    { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterChipTxt:       { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray600 },
  filterChipTxtActive: { color: COLORS.primary, fontWeight: FONT.bold },
  sortPanel:           { backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  sortOpt:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  sortOptTxt:          { fontSize: 14, color: COLORS.gray600 },
  sortOptTxtActive:    { color: COLORS.primary, fontWeight: FONT.bold },
  section:             { padding: SPACING.lg },
  secHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle:            { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 12 },
  secLink:             { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  chips:               { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:                { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 7, gap: 4 },
  chipTxt:             { fontSize: 13, color: COLORS.gray600, fontWeight: FONT.semibold },
  tagChip:             { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  tagChipTxt:          { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  catsGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard:             { width: '30%', alignItems: 'center', gap: 6 },
  catImgWrap:          { width: 64, height: 64, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  catLabel:            { fontSize: 12, fontWeight: FONT.semibold, color: COLORS.gray600, textAlign: 'center' },
  resultsHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  resultsCount:        { fontSize: 13, color: COLORS.gray400 },
  grid:                { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem:            { width: '47.5%' },
  noResults:           { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  noResultsTitle:      { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, textAlign: 'center', marginBottom: 8 },
  noResultsSub:        { fontSize: 13, color: COLORS.gray400, textAlign: 'center', marginBottom: 24 },
  noResultsBtn:        { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 12 },
  noResultsBtnTxt:     { color: '#fff', fontWeight: FONT.bold },
});