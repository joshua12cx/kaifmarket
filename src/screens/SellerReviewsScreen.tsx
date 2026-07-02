// src/screens/SellerReviewsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Star, User, Package, ThumbsUp,
} from 'lucide-react-native';
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

  const renderStars = (n: number, size = 14) =>
    Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={size}
        color={i < n ? COLORS.gold : COLORS.gray200}
        fill={i < n ? COLORS.gold : COLORS.gray200}
        strokeWidth={0}
      />
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={rv.header}>
        <TouchableOpacity style={rv.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }>

          {/* ── RESUMEN ── */}
          <View style={rv.summaryCard}>
            <View style={rv.summaryLeft}>
              <Text style={rv.avgRating}>{avgRating.toFixed(1)}</Text>
              <View style={{ flexDirection: 'row', gap: 1 }}>{renderStars(Math.round(avgRating))}</View>
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
              <View style={rv.emptyIconWrap}>
                <Star size={40} color={COLORS.gray400} strokeWidth={1.5} />
              </View>
              <Text style={rv.emptyTitle}>Aún no tienes reseñas</Text>
              <Text style={rv.emptySub}>Las reseñas aparecerán cuando tus clientes compren y valoren tus productos</Text>
            </View>
          ) : (
            reviews.map(review => (
              <View key={review.id} style={rv.reviewCard}>
                {/* Header */}
                <View style={rv.reviewHeader}>
                  <View style={rv.reviewAvatar}>
                    <User size={18} color={COLORS.primary} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={rv.reviewName}>{review.users?.name || 'Usuario'}</Text>
                    <View style={{ flexDirection: 'row', gap: 1 }}>{renderStars(review.rating, 12)}</View>
                  </View>
                  <Text style={rv.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>

                {/* Producto */}
                {review.products && (
                  <View style={rv.productTag}>
                    <Package size={11} color={COLORS.gray600} strokeWidth={2} />
                    <Text style={rv.productTagTxt}>{review.products.name}</Text>
                  </View>
                )}

                {/* Texto */}
                {review.text && (
                  <Text style={rv.reviewText}>{review.text}</Text>
                )}

                {/* Likes */}
                <View style={rv.reviewFooter}>
                  <ThumbsUp size={13} color={COLORS.gray400} strokeWidth={2} />
                  <Text style={rv.likeTxt}>{review.likes} personas encontraron útil esta reseña</Text>
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
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.primary },
  backBtn:      { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  summaryCard:  { flexDirection: 'row', gap: 20, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.card },
  summaryLeft:  { alignItems: 'center', gap: 4 },
  avgRating:    { fontSize: 48, fontWeight: FONT.black, color: COLORS.gray800 },
  reviewCount:  { fontSize: 12, color: COLORS.gray400 },
  summaryRight: { flex: 1, gap: 4, justifyContent: 'center' },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starNum:      { fontSize: 12, color: COLORS.gray400, width: 20 },
  starBarBg:    { flex: 1, height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
  starBarFill:  { height: 8, backgroundColor: COLORS.gold, borderRadius: 4 },
  starCount:    { fontSize: 12, color: COLORS.gray400, width: 20, textAlign: 'right' },
  empty:        { alignItems: 'center', paddingVertical: 48 },
  emptyIconWrap:{ width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:   { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginBottom: 8 },
  emptySub:     { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },
  reviewCard:   { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.card },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  reviewName:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 2 },
  reviewDate:   { fontSize: 11, color: COLORS.gray400 },
  productTag:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.gray100, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  productTagTxt:{ fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },
  reviewText:   { fontSize: 14, color: COLORS.gray600, lineHeight: 21, marginBottom: SPACING.sm },
  reviewFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  likeTxt:      { fontSize: 12, color: COLORS.gray400 },
});