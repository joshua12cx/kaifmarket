// src/screens/SellerProductsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
  RefreshControl, Switch, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Plus, Package, Check, Star, Pencil, Trash2,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { supabase } from '../lib/supabase';

interface Product {
  id:          string;
  name:        string;
  price:       number;
  old_price:   number | null;
  stock:       number;
  sold:        number;
  rating:      number;
  is_active:   boolean;
  image_url:   string | null;
  category_id: string;
}

export default function SellerProductsScreen({ route, navigation }: any) {
  const { sellerId } = route.params;
  const insets = useSafeAreaInsets();

  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<'all' | 'active' | 'inactive' | 'low_stock'>('all');

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (__DEV__) { console.log('[PRODUCTS] fetch:', { count: data?.length, error }); }
      if (data && !error) { setProducts(data as Product[]); }
    } catch (e) {
      if (__DEV__) { console.log('[PRODUCTS] Error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  // ── Activar/desactivar producto ───────────────────────────────
  const toggleActive = async (product: Product) => {
    const newActive = !product.is_active;
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newActive } : p));

    const { error } = await supabase
      .from('products')
      .update({ is_active: newActive })
      .eq('id', product.id);

    if (error) {
      // Revertir si hay error
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !newActive } : p));
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  };

  // ── Eliminar producto ─────────────────────────────────────────
  const deleteProduct = (product: Product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro que quieres eliminar "${product.name}"?`,
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', product.id);

            if (!error) {
              setProducts(prev => prev.filter(p => p.id !== product.id));
            } else {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ],
    );
  };

  // ── Filtrar productos ─────────────────────────────────────────
  const filtered = products.filter(p => {
    if (filter === 'active')    { return p.is_active && p.stock > 0; }
    if (filter === 'inactive')  { return !p.is_active; }
    if (filter === 'low_stock') { return p.stock <= 5 && p.stock > 0; }
    return true;
  });

  const FILTERS = [
    { id: 'all',       label: `Todos (${products.length})` },
    { id: 'active',    label: `Activos (${products.filter(p => p.is_active).length})` },
    { id: 'inactive',  label: `Inactivos (${products.filter(p => !p.is_active).length})` },
    { id: 'low_stock', label: `Stock bajo (${products.filter(p => p.stock <= 5).length})` },
  ] as const;

  return (
    <View style={[sp.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={sp.header}>
        <TouchableOpacity style={sp.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={sp.headerTitle}>Mis productos</Text>
        <TouchableOpacity
          style={sp.addBtn}
          onPress={() => navigation.navigate('SellerAddProduct', { sellerId })}>
          <Plus size={14} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={sp.addBtnTxt}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* ── FILTROS ── */}
      <View style={sp.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: SPACING.lg }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[sp.filterBtn, filter === f.id && sp.filterBtnActive]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.8}>
              <Text style={[sp.filterTxt, filter === f.id && sp.filterTxtActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={sp.empty}>
          <View style={sp.emptyIconWrap}>
            <Package size={40} color={COLORS.gray400} strokeWidth={1.5} />
          </View>
          <Text style={sp.emptyTitle}>
            {products.length === 0 ? 'Aún no tienes productos' : 'Sin productos en este filtro'}
          </Text>
          {products.length === 0 && (
            <TouchableOpacity
              style={sp.emptyBtn}
              onPress={() => navigation.navigate('SellerAddProduct', { sellerId })}>
              <Text style={sp.emptyBtnTxt}>Agregar mi primer producto</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }>
          {filtered.map(product => (
            <View key={product.id} style={sp.productCard}>
              {/* Imagen */}
              <View style={[sp.productImg, { backgroundColor: product.image_url ? COLORS.gray200 : COLORS.gray100 }]}>
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={sp.productImgReal} />
                ) : (
                  <Package size={28} color={COLORS.gray400} strokeWidth={1.5} />
                )}
              </View>

              {/* Info */}
              <View style={sp.productInfo}>
                <Text style={sp.productName} numberOfLines={2}>{product.name}</Text>
                <View style={sp.productPriceRow}>
                  <Text style={sp.productPrice}>S/ {product.price}</Text>
                  {product.old_price && (
                    <Text style={sp.productOldPrice}>S/ {product.old_price}</Text>
                  )}
                </View>
                <View style={sp.productStats}>
                  <View style={sp.statRow}>
                    <Package size={11} color={product.stock <= 5 ? COLORS.primary : COLORS.gray600} strokeWidth={2} />
                    <Text style={[sp.stockTxt, product.stock <= 5 && { color: COLORS.primary }]}>
                      Stock: {product.stock}
                    </Text>
                  </View>
                  <View style={sp.statRow}>
                    <Check size={11} color={COLORS.gray600} strokeWidth={2} />
                    <Text style={sp.soldTxt}>Vendidos: {product.sold}</Text>
                  </View>
                </View>
                <View style={sp.statRow}>
                  <Star size={11} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                  <Text style={sp.ratingTxt}>{product.rating}</Text>
                </View>
              </View>

              {/* Acciones */}
              <View style={sp.productActions}>
                <Switch
                  value={product.is_active}
                  onValueChange={() => toggleActive(product)}
                  trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <TouchableOpacity
                  style={sp.editBtn}
                  onPress={() => navigation.navigate('SellerAddProduct', { sellerId, product })}>
                  <Pencil size={16} color={COLORS.gray600} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={sp.deleteBtn}
                  onPress={() => deleteProduct(product)}>
                  <Trash2 size={16} color={COLORS.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const sp = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.black },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.primary },
  backBtn:         { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnTxt:       { color: COLORS.primary, fontWeight: FONT.bold, fontSize: 13 },
  filterWrap:      { backgroundColor: COLORS.black, paddingVertical: 10 },
  filterBtn:       { backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'transparent' },
  filterBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterTxt:       { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray600 },
  filterTxtActive: { color: COLORS.primary, fontWeight: FONT.bold },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconWrap:   { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:      { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, textAlign: 'center', marginBottom: 16 },
  emptyBtn:        { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnTxt:     { color: COLORS.white, fontWeight: FONT.black },
  productCard:     { flexDirection: 'row', gap: 12, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, alignItems: 'flex-start', ...SHADOW.card },
  productImg:      { width: 72, height: 72, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  productImgReal:  { width: 72, height: 72 },
  productInfo:     { flex: 1 },
  productName:     { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800, lineHeight: 18, marginBottom: 4 },
  productPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  productPrice:    { fontSize: 15, fontWeight: FONT.black, color: COLORS.primary },
  productOldPrice: { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  productStats:    { flexDirection: 'row', gap: 12, marginBottom: 4 },
  statRow:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockTxt:        { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },
  soldTxt:         { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },
  ratingTxt:       { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.bold },
  productActions:  { alignItems: 'center', gap: 6 },
  editBtn:         { padding: 6 },
  deleteBtn:       { padding: 6 },
});