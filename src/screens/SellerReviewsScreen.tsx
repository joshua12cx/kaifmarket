// src/screens/SellerReviewsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { supabase } from '../lib/supabase';

interface Review {
  id:         string;
  rating:     number;
  text:       string;
  likes:      number;
  created_at: string;
  users:      { name: string; avatar: string } | null;
  products:   { name: string } | null;
}

export default function SellerReviewsScreen({ route, navigation }: any) {
  const { sellerId } = route.params;
  const insets = useSafeAreaInsets();

  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avgRating,  setAvgRating]  = useState(0);

  const fetchReviews = useCallback(async () => {
    try {
      // Obtener IDs de productos del vendedor
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', sellerId);

      if (!products || products.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const productIds = products.map((p: { id: string }) => p.id);

      // Obtener reseñas de esos productos
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users (name, avatar),
          products (name)
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (__DEV__) { console.log('[REVIEWS] fetch:', { count: data?.length, error }); }

      if (data && !error) {
        setReviews(data as Review[]);
        const avg = data.length
          ? data.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / data.length
          : 0;
        setAvgRating(avg);
      }
    } catch (e) {
      if (__DEV__) { console.log('[REVIEWS] Error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const onRefresh = () => { setRefreshing(true); fetchReviews(); };

  const renderStars = (n: number) =>
    Array(5).fill(0).map((_, i) => (
      <Text key={i} style={{ color: i < n ? '#F5A623' : COLORS.gray200, fontSize: 14 }}>★</Text>
    ));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

  // Distribución de estrellas
  const starDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct:   reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <View style={[rv.container, { paddingTop: insets.top }]}>
      <View style={rv.header}>
        <TouchableOpacity style={rv.backBtn} onPress={() => navigation.goBack()}>
          <Text style={rv.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={rv.headerTitle}>Reseñas de mi tienda</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }>

          {/* ── RESUMEN ── */}
          <View style={rv.summaryCard}>
            <View style={rv.summaryLeft}>
              <Text style={rv.avgRating}>{avgRating.toFixed(1)}</Text>
              <View style={{ flexDirection: 'row' }}>{renderStars(Math.round(avgRating))}</View>
              <Text style={rv.reviewCount}>{reviews.length} reseñas</Text>
            </View>
            <View style={rv.summaryRight}>
              {starDist.map(({ star, count, pct }) => (
                <View key={star} style={rv.starRow}>
                  <Text style={rv.starNum}>{star}★</Text>
                  <View style={rv.starBarBg}>
                    <View style={[rv.starBarFill, { width: `${pct}%` as any }]} />
                  </View>
                  <Text style={rv.starCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── LISTA DE RESEÑAS ── */}
          {reviews.length === 0 ? (
            <View style={rv.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
              <Text style={rv.emptyTitle}>Aún no tienes reseñas</Text>
              <Text style={rv.emptySub}>Las reseñas aparecerán cuando tus clientes compren y valoren tus productos</Text>
            </View>
          ) : (
            reviews.map(review => (
              <View key={review.id} style={rv.reviewCard}>
                {/* Header */}
                <View style={rv.reviewHeader}>
                  <View style={rv.reviewAvatar}>
                    <Text style={{ fontSize: 20 }}>{review.users?.avatar || '👤'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={rv.reviewName}>{review.users?.name || 'Usuario'}</Text>
                    <View style={{ flexDirection: 'row' }}>{renderStars(review.rating)}</View>
                  </View>
                  <Text style={rv.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>

                {/* Producto */}
                {review.products && (
                  <View style={rv.productTag}>
                    <Text style={rv.productTagTxt}>📦 {review.products.name}</Text>
                  </View>
                )}

                {/* Texto */}
                {review.text && (
                  <Text style={rv.reviewText}>{review.text}</Text>
                )}

                {/* Likes */}
                <View style={rv.reviewFooter}>
                  <Text style={rv.likeTxt}>👍 {review.likes} personas encontraron útil esta reseña</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const rv = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.gray50 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:      { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:  { fontSize: 17, fontWeight: FONT.black, color: COLORS.gray800 },
  summaryCard:  { flexDirection: 'row', gap: 20, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  summaryLeft:  { alignItems: 'center', gap: 4 },
  avgRating:    { fontSize: 48, fontWeight: FONT.black, color: COLORS.gray800 },
  reviewCount:  { fontSize: 12, color: COLORS.gray400 },
  summaryRight: { flex: 1, gap: 4 },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starNum:      { fontSize: 12, color: COLORS.gray400, width: 20 },
  starBarBg:    { flex: 1, height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
  starBarFill:  { height: 8, backgroundColor: '#F5A623', borderRadius: 4 },
  starCount:    { fontSize: 12, color: COLORS.gray400, width: 20, textAlign: 'right' },
  empty:        { alignItems: 'center', paddingVertical: 48 },
  emptyTitle:   { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 8 },
  emptySub:     { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },
  reviewCard:   { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  reviewName:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 2 },
  reviewDate:   { fontSize: 11, color: COLORS.gray400 },
  productTag:   { backgroundColor: COLORS.gray100, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  productTagTxt:{ fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },
  reviewText:   { fontSize: 14, color: COLORS.gray600, lineHeight: 21, marginBottom: SPACING.sm },
  reviewFooter: { borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  likeTxt:      { fontSize: 12, color: COLORS.gray400 },
});
