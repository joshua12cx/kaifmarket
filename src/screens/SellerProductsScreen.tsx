// src/screens/SellerProductsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
  RefreshControl, StatusBar, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Package, Check, Star, Pencil, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';

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

// NOTA: esta pantalla ahora vive como tab dentro de SellerTabs, no
// como pantalla de stack con parámetros — por eso ya no depende de
// route.params.sellerId, lo resuelve solo a partir del usuario logueado.
export default function SellerProductsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [sellerId,   setSellerId]   = useState<string | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<'all' | 'active' | 'inactive' | 'low_stock'>('all');

  const fetchProducts = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      // 1. Resolver el seller_id del usuario logueado
      const { data: sellerRow } = await supabase
        .from('sellers').select('id').eq('user_id', user.id).single();

      if (!sellerRow) { setLoading(false); setRefreshing(false); return; }
      setSellerId(sellerRow.id);

      // 2. Sus productos
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerRow.id)
        .order('created_at', { ascending: false });

      if (data && !error) { setProducts(data as Product[]); }
    } catch (e) {
      if (__DEV__) { console.log('[PRODUCTS] Error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

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
            const { error } = await supabase.from('products').delete().eq('id', product.id);
            if (!error) { setProducts(prev => prev.filter(p => p.id !== product.id)); }
            else { Alert.alert('Error', 'No se pudo eliminar el producto'); }
          },
        },
      ],
    );
  };

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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={sp.header}>
        <Text style={sp.headerTitle}>Mis Productos</Text>
        <TouchableOpacity
          style={sp.addBtn}
          onPress={() => navigation.navigate('SellerAddProduct', { sellerId })}
          disabled={!sellerId}
          activeOpacity={0.85}>
          <Plus size={16} color={COLORS.black} strokeWidth={2.5} />
          <Text style={sp.addBtnTxt}>Agregar</Text>
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
              <Text style={[sp.filterTxt, filter === f.id && sp.filterTxtActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={sp.empty}>
          <View style={sp.emptyIconWrap}>
            <Package size={40} color={COLORS.gray400} strokeWidth={1.5} />
          </View>
          <Text style={sp.emptyTitle}>
            {products.length === 0 ? 'Aún no tienes productos' : 'Sin productos en este filtro'}
          </Text>
          {products.length === 0 && sellerId && (
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
          }>
          {filtered.map(product => (
            <TouchableOpacity
              key={product.id}
              style={sp.productCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SellerAddProduct', { sellerId, product })}>
              {/* Imagen */}
              <View style={sp.productImg}>
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={sp.productImgReal} />
                ) : (
                  <Package size={26} color={COLORS.gray400} strokeWidth={1.5} />
                )}
              </View>

              {/* Info */}
              <View style={sp.productInfo}>
                <Text style={sp.productName} numberOfLines={2}>{product.name}</Text>
                <View style={sp.productPriceRow}>
                  <Text style={sp.productPrice}>S/ {product.price}</Text>
                  {product.old_price ? <Text style={sp.productOldPrice}>S/ {product.old_price}</Text> : null}
                </View>
                <View style={sp.productStats}>
                  <View style={sp.statRow}>
                    <Package size={11} color={product.stock <= 5 ? COLORS.red : COLORS.gray400} strokeWidth={2} />
                    <Text style={[sp.stockTxt, product.stock <= 5 && { color: COLORS.red }]}>
                      {product.stock} en stock
                    </Text>
                  </View>
                </View>
                <View style={sp.statRow}>
                  <Star size={11} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                  <Text style={sp.ratingTxt}>{product.rating}</Text>
                  <Check size={11} color={COLORS.gray400} strokeWidth={2} style={{ marginLeft: 8 }} />
                  <Text style={sp.soldTxt}>{product.sold} vendidos</Text>
                </View>
              </View>

              {/* Acciones */}
              <View style={sp.productActions}>
                <Switch
                  value={product.is_active}
                  onValueChange={() => toggleActive(product)}
                  trackColor={{ false: COLORS.gray800, true: COLORS.gold }}
                  thumbColor={COLORS.white}
                  ios_backgroundColor={COLORS.gray800}
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
                <Text style={[sp.statusLabel, { color: product.is_active ? COLORS.gold : COLORS.gray400 }]}>
                  {product.is_active ? 'ACTIVO' : 'PAUSADO'}
                </Text>
                <View style={sp.miniActions}>
                  <TouchableOpacity
                    style={sp.miniBtn}
                    onPress={() => navigation.navigate('SellerAddProduct', { sellerId, product })}>
                    <Pencil size={14} color={COLORS.gray400} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity style={sp.miniBtn} onPress={() => deleteProduct(product)}>
                    <Trash2 size={14} color={COLORS.red} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const sp = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.black },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle:     { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnTxt:       { color: COLORS.black, fontWeight: FONT.black, fontSize: 13 },
  filterWrap:      { paddingVertical: 10 },
  filterBtn:       { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.blackSoft },
  filterBtnActive: { backgroundColor: COLORS.gold + '22', borderColor: COLORS.gold },
  filterTxt:       { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray400 },
  filterTxtActive: { color: COLORS.gold, fontWeight: FONT.bold },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconWrap:   { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:      { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, textAlign: 'center', marginBottom: 16 },
  emptyBtn:        { backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnTxt:     { color: COLORS.black, fontWeight: FONT.black },
  productCard:     { flexDirection: 'row', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.sm, alignItems: 'flex-start' },
  productImg:      { width: 64, height: 64, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', backgroundColor: COLORS.gray800 },
  productImgReal:  { width: 64, height: 64 },
  productInfo:     { flex: 1 },
  productName:     { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white, lineHeight: 18, marginBottom: 4 },
  productPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  productPrice:    { fontSize: 15, fontWeight: FONT.black, color: COLORS.gold },
  productOldPrice: { fontSize: 11, color: COLORS.gray400, textDecorationLine: 'line-through' },
  productStats:    { flexDirection: 'row', gap: 12, marginBottom: 4 },
  statRow:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockTxt:        { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.semibold },
  soldTxt:         { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.semibold },
  ratingTxt:       { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.bold },
  productActions:  { alignItems: 'center', gap: 4 },
  statusLabel:     { fontSize: 10, fontWeight: FONT.black, letterSpacing: 0.3, marginBottom: 4 },
  miniActions:     { flexDirection: 'row', gap: 4, marginTop: 4 },
  miniBtn:         { padding: 4 },
});