// src/screens/ProductDetailScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Dimensions, Animated, Image, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { PRODUCTS, SELLERS } from '../data';
import { useCart, useFavs, useAuth } from '../context';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

const REVIEWS = [
  { id: 1, name: 'Carlos M.', avatar: '👨', rating: 5, date: 'hace 2 días', text: 'Excelente producto, llegó rápido y bien empacado.', likes: 12 },
  { id: 2, name: 'María G.',  avatar: '👩', rating: 4, date: 'hace 5 días', text: 'Muy buena calidad para el precio.', likes: 8 },
  { id: 3, name: 'Pedro R.',  avatar: '🧑', rating: 5, date: 'hace 1 sem',  text: 'Superó mis expectativas.', likes: 5 },
];

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const { items, dispatch } = useCart();
  const { isFav, toggle }   = useFavs();
  const { user }            = useAuth();

  const [data,          setData]          = useState<any>(null);
  const [seller,        setSeller]        = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [activeImg,     setActiveImg]     = useState(0);
  const [activeTab,     setActiveTab]     = useState<'info' | 'specs' | 'reviews'>('info');
  const [showCoupon,    setShowCoupon]    = useState(true);
  const [fullscreen,    setFullscreen]    = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        if (typeof productId === 'string') {
          const { data: sp, error } = await supabase
            .from('products').select('*').eq('id', productId).single();

          if (sp && !error) {
            // ── Cargar specs de Supabase ──────────────────────
            const { data: specsData } = await supabase
              .from('product_specs')
              .select('key, value, order_num')
              .eq('product_id', productId)
              .order('order_num', { ascending: true });

            setData(normalizeSupabaseProduct(sp, specsData || []));

            if (sp.seller_id) {
              const { data: sd } = await supabase
                .from('sellers').select('*').eq('id', sp.seller_id).single();
              setSeller(sd || SELLERS[0]);
            }
            setLoading(false);
            return;
          }
        }
        const staticProduct = PRODUCTS.find(p => p.id === productId || p.id === Number(productId));
        if (staticProduct) {
          setData(normalizeStaticProduct(staticProduct));
          setSeller(SELLERS[0]);
        }
      } catch (e) {
        if (__DEV__) { console.log('[DETAIL] Error:', e); }
        const staticProduct = PRODUCTS.find(p => p.id === productId || p.id === Number(productId));
        if (staticProduct) {
          setData(normalizeStaticProduct(staticProduct));
          setSeller(SELLERS[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // ── Normalizar con specs de Supabase ──────────────────────────
  const normalizeSupabaseProduct = (p: any, specs: any[]) => ({
    ...p,
    images:      [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean),
    imageUrls:   [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean),
    isRealImage: true,
    oldPrice:    p.old_price,
    bgColor:     p.bg_color || '#F5F5F5',
    reviews:     p.review_count || 0,
    specs:       specs, // ← specs reales de Supabase
    category:    p.category_id,
  });

  const normalizeStaticProduct = (p: any) => ({
    ...p,
    images:      p.images  || [p.emoji],
    imageUrls:   [],
    isRealImage: false,
    reviews:     p.reviews || 0,
    specs:       p.specs   || [],
  });

  if (loading || !data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const p       = data;
  const qty     = items[p.id] || 0;
  const inCart  = qty > 0;
  const isOwner = user && seller && seller.user_id === user.id;
  const disc    = (p.oldPrice || p.old_price)
    ? Math.round((((p.oldPrice || p.old_price) - p.price) / (p.oldPrice || p.old_price)) * 100)
    : null;

  const slideImages = p.isRealImage
    ? (p.imageUrls.length > 0 ? p.imageUrls : [null])
    : (p.images || [p.emoji]);

  const handleAddToCart = () => {
    dispatch({ type: 'ADD', id: p.id });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const renderStars = (n: number) =>
    Array(5).fill(0).map((_, i) => (
      <Text key={i} style={{ color: i < n ? '#F5A623' : COLORS.gray200, fontSize: 14 }}>★</Text>
    ));

  return (
    <View style={[pd.container, { paddingTop: insets.top }]}>

      {/* ── MODAL FULLSCREEN ── */}
      <Modal
        visible={fullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}>
        <View style={pd.fsWrap}>
          <FlatList
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={slideImages}
            keyExtractor={(_, i) => `fs-${i}`}
            initialScrollIndex={activeImg}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            renderItem={({ item }) => (
              <View style={pd.fsSlide}>
                {p.isRealImage && item ? (
                  <Image source={{ uri: item }} style={pd.fsImage} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 140 }}>{item || p.emoji || '📦'}</Text>
                )}
              </View>
            )}
          />
          <TouchableOpacity
            style={[pd.fsClose, { top: insets.top + 12 }]}
            onPress={() => setFullscreen(false)}>
            <Text style={pd.fsCloseTxt}>✕</Text>
          </TouchableOpacity>
          {slideImages.length > 1 && (
            <View style={pd.fsCounter}>
              <Text style={pd.fsCounterTxt}>{activeImg + 1} / {slideImages.length}</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* ── TOP BAR ── */}
      <View style={pd.topBar}>
        <TouchableOpacity style={pd.topBtn} onPress={() => navigation.goBack()}>
          <Text style={pd.topBtnTxt}>‹</Text>
        </TouchableOpacity>
        <View style={pd.topRight}>
          <TouchableOpacity style={pd.topBtn} onPress={() => toggle(p.id)}>
            <Text style={{ fontSize: 18 }}>{isFav(p.id) ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[pd.topBtn, { position: 'relative' }]}
            onPress={() => navigation.navigate('Cart')}>
            <Text style={{ fontSize: 18 }}>🛒</Text>
            {inCart && (
              <View style={pd.cartBadge}>
                <Text style={pd.cartBadgeTxt}>{qty}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}>

        {/* ── IMAGEN SLIDER ── */}
        <View style={pd.imgWrap}>
          <FlatList
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={slideImages}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={e =>
              setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => p.isRealImage && setFullscreen(true)}>
                <View style={[pd.imgSlide, { backgroundColor: p.bgColor || '#F5F5F5' }]}>
                  {p.isRealImage && item ? (
                    <Image source={{ uri: item }} style={pd.realImage} resizeMode="contain" />
                  ) : (
                    <Text style={pd.imgEmoji}>{item || p.emoji || '📦'}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
          {slideImages.length > 1 && (
            <View style={pd.imgDots}>
              {slideImages.map((_: any, i: number) => (
                <View key={i} style={[pd.imgDot, i === activeImg && pd.imgDotActive]} />
              ))}
            </View>
          )}
          {p.isRealImage && (
            <TouchableOpacity style={pd.zoomHint} onPress={() => setFullscreen(true)}>
              <Text style={pd.zoomHintTxt}>🔍 Toca para ampliar</Text>
            </TouchableOpacity>
          )}
          {disc && (
            <View style={pd.discBadge}>
              <Text style={pd.discTxt}>-{disc}%</Text>
            </View>
          )}
        </View>

        <View style={pd.body}>

          {/* ── PRECIO Y TÍTULO ── */}
          <View style={pd.priceSection}>
            <View style={pd.priceRow}>
              <Text style={pd.price}>S/ {p.price}</Text>
              {(p.oldPrice || p.old_price) && (
                <Text style={pd.oldPrice}>S/ {p.oldPrice || p.old_price}</Text>
              )}
              {disc && <Text style={pd.discLabel}>−{disc}%</Text>}
            </View>
            <Text style={pd.productName}>{p.name}</Text>
            <View style={pd.ratingRow}>
              <View style={{ flexDirection: 'row' }}>{renderStars(Math.floor(p.rating || 5))}</View>
              <Text style={pd.ratingNum}>{p.rating || 5}</Text>
              <Text style={pd.ratingCount}>({p.reviews || p.review_count || 0} reseñas)</Text>
              <Text style={pd.soldCount}>· {(p.sold || 0).toLocaleString()} vendidos</Text>
            </View>
          </View>

          {/* ── CUPÓN ── */}
          {showCoupon && (
            <View style={pd.couponBanner}>
              <Text style={pd.couponBadge}>-5%</Text>
              <View style={{ flex: 1 }}>
                <Text style={pd.couponTitle}>Código KAIF10</Text>
                <Text style={pd.couponSub}>Válido hasta el 31 de Mayo</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCoupon(false)}>
                <Text style={{ color: COLORS.gray400, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ENTREGA ── */}
          <View style={pd.deliveryCard}>
            <Text style={pd.deliveryTitle}>Entrega</Text>
            <View style={pd.deliveryOpts}>
              <View style={[pd.deliveryOpt, { borderColor: COLORS.primary }]}>
                <Text style={pd.deliveryOptLabel}>Estándar</Text>
                <Text style={pd.deliveryOptDate}>Mañana, Gratis</Text>
              </View>
              <View style={pd.deliveryOpt}>
                <Text style={pd.deliveryOptLabel}>Exprés</Text>
                <Text style={pd.deliveryOptDate}>Hoy, S/ 8</Text>
              </View>
            </View>
          </View>

          {/* ── TABS ── */}
          <View style={pd.tabs}>
            {(['info', 'specs', 'reviews'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[pd.tab, activeTab === tab && pd.tabActive]}
                onPress={() => setActiveTab(tab)}>
                <Text style={[pd.tabTxt, activeTab === tab && pd.tabTxtActive]}>
                  {tab === 'info'    ? 'Descripción' :
                   tab === 'specs'   ? `Características${p.specs?.length > 0 ? ` (${p.specs.length})` : ''}` :
                   'Reseñas'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── TAB: INFO ── */}
          {activeTab === 'info' && (
            <View style={pd.tabContent}>
              <Text style={pd.descText}>{p.description || 'Sin descripción disponible.'}</Text>
            </View>
          )}

          {/* ── TAB: SPECS ── */}
          {activeTab === 'specs' && (
            <View style={pd.tabContent}>
              {p.specs && p.specs.length > 0 ? (
                p.specs.map((spec: any, i: number) => {
                  // Soporta tanto objetos {key, value} como strings "key: value"
                  const key = typeof spec === 'string' ? spec.split(': ')[0] : spec.key;
                  const val = typeof spec === 'string' ? spec.split(': ')[1] : spec.value;
                  return (
                    <View
                      key={i}
                      style={[pd.specRow, { backgroundColor: i % 2 === 0 ? COLORS.gray100 : COLORS.white }]}>
                      <Text style={pd.specKey}>{key}</Text>
                      <Text style={pd.specVal}>{val || '—'}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={pd.specsEmpty}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
                  <Text style={pd.specsEmptyTxt}>Sin especificaciones disponibles</Text>
                  <Text style={pd.specsEmptySub}>
                    El vendedor no ha agregado características para este producto
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── TAB: REVIEWS ── */}
          {activeTab === 'reviews' && (
            <View style={pd.tabContent}>
              <View style={pd.ratingSum}>
                <Text style={pd.ratingSumBig}>{p.rating || 5}</Text>
                <View>
                  <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                    {renderStars(Math.floor(p.rating || 5))}
                  </View>
                  <Text style={{ fontSize: 12, color: COLORS.gray400 }}>
                    {p.reviews || p.review_count || 0} reseñas
                  </Text>
                </View>
              </View>
              {REVIEWS.map(rev => (
                <View key={rev.id} style={pd.reviewCard}>
                  <View style={pd.revHeader}>
                    <Text style={pd.revAvatar}>{rev.avatar}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={pd.revName}>{rev.name}</Text>
                      <View style={{ flexDirection: 'row' }}>{renderStars(rev.rating)}</View>
                    </View>
                    <Text style={pd.revDate}>{rev.date}</Text>
                  </View>
                  <Text style={pd.revText}>{rev.text}</Text>
                  <View style={pd.revLike}>
                    <Text style={{ fontSize: 14 }}>👍</Text>
                    <Text style={pd.revLikeTxt}>{rev.likes}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── VENDEDOR ── */}
          {seller && (
            <TouchableOpacity
              style={pd.sellerCard}
              onPress={() => navigation.navigate('SellerStore', { sellerId: seller.id })}
              activeOpacity={0.85}>
              <View style={pd.sellerHeader}>
                {seller.logo_url ? (
                  <Image
                    source={{ uri: seller.logo_url }}
                    style={pd.sellerLogoImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={pd.sellerAvatar}>
                    <Text style={{ fontSize: 22 }}>🏪</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={pd.sellerName}>{seller.name}</Text>
                    {(seller.is_verified || seller.verified) && (
                      <View style={pd.verifiedBadge}>
                        <Text style={pd.verifiedTxt}>✓</Text>
                      </View>
                    )}
                    {isOwner && (
                      <View style={pd.ownerTag}>
                        <Text style={pd.ownerTagTxt}>Tu tienda</Text>
                      </View>
                    )}
                  </View>
                  <Text style={pd.sellerSub}>
                    Tienda oficial · {seller.location || 'Lima, Perú'}
                  </Text>
                </View>
                <Text style={{ color: COLORS.gray400, fontSize: 18 }}>›</Text>
              </View>
              <View style={pd.sellerStats}>
                <View style={pd.sellerStat}>
                  <Text style={pd.sellerStatVal}>⭐ {seller.rating || 5}</Text>
                  <Text style={pd.sellerStatLbl}>Rating</Text>
                </View>
                <View style={pd.sellerStatDiv} />
                <View style={pd.sellerStat}>
                  <Text style={pd.sellerStatVal}>{seller.total_sales || 0}</Text>
                  <Text style={pd.sellerStatLbl}>Ventas</Text>
                </View>
                <View style={pd.sellerStatDiv} />
                <View style={pd.sellerStat}>
                  <Text style={pd.sellerStatVal}>{seller.followers || 0}</Text>
                  <Text style={pd.sellerStatLbl}>Seguidores</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── PRODUCTOS RELACIONADOS ── */}
          {(() => {
            const related = PRODUCTS
              .filter(x => x.category === p.category && x.id !== p.id)
              .slice(0, 6);
            return related.length > 0 ? (
              <View style={pd.relatedWrap}>
                <Text style={pd.relatedTitle}>También te puede gustar</Text>
                <FlatList
                  horizontal showsHorizontalScrollIndicator={false}
                  data={related}
                  keyExtractor={item => String(item.id)}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={pd.relCard}
                      onPress={() => navigation.replace('ProductDetail', { productId: item.id })}
                      activeOpacity={0.9}>
                      <View style={[pd.relImg, { backgroundColor: item.bgColor }]}>
                        <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
                      </View>
                      <View style={pd.relInfo}>
                        <Text style={pd.relPrice}>S/ {item.price}</Text>
                        <Text style={pd.relName} numberOfLines={2}>{item.name}</Text>
                        <Text style={pd.relStars}>★ {item.rating}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : null;
          })()}

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={[pd.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {isOwner ? (
          <TouchableOpacity
            style={pd.editBtn}
            onPress={() => navigation.navigate('ProfileTab', { screen: 'SellerDashboard' })}
            activeOpacity={0.85}>
            <Text style={pd.editBtnTxt}>🏪 Ir a mi panel de vendedor</Text>
          </TouchableOpacity>
        ) : (
          <>
            {inCart && (
              <View style={pd.qtyRow}>
                <TouchableOpacity
                  style={pd.qtyBtn}
                  onPress={() => dispatch({ type: 'DECREMENT', id: p.id })}>
                  <Text style={pd.qtyBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={pd.qtyNum}>{qty}</Text>
                <TouchableOpacity
                  style={pd.qtyBtn}
                  onPress={() => dispatch({ type: 'INCREMENT', id: p.id })}>
                  <Text style={pd.qtyBtnTxt}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={pd.buyNowBtn}
              onPress={() => {
                if (!inCart) { dispatch({ type: 'ADD', id: p.id }); }
                navigation.navigate('Cart');
              }}>
              <Text style={pd.buyNowTxt}>Comprar ahora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pd.cartBtn, addedFeedback && pd.cartBtnFeedback]}
              onPress={handleAddToCart}
              activeOpacity={0.8}>
              <Text style={[pd.cartBtnTxt, addedFeedback && { color: '#fff' }]}>
                {addedFeedback ? '✓ Agregado' : inCart ? `🛒 Agregar más (${qty})` : '🛒 Al carrito'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </View>
  );
}

const pd = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.white },
  topBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 8, backgroundColor: COLORS.white },
  topBtn:          { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  topBtnTxt:       { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  topRight:        { flexDirection: 'row', gap: 8 },
  cartBadge:       { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeTxt:    { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  fsWrap:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  fsSlide:         { width, height, alignItems: 'center', justifyContent: 'center' },
  fsImage:         { width, height: height * 0.8 },
  fsClose:         { position: 'absolute', right: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  fsCloseTxt:      { color: '#fff', fontSize: 16, fontWeight: FONT.black },
  fsCounter:       { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 6 },
  fsCounterTxt:    { color: '#fff', fontSize: 14, fontWeight: FONT.bold },
  imgWrap:         { position: 'relative' },
  imgSlide:        { width, height: 300, alignItems: 'center', justifyContent: 'center' },
  realImage:       { width: '100%', height: '100%' },
  imgEmoji:        { fontSize: 110 },
  imgDots:         { position: 'absolute', bottom: 28, flexDirection: 'row', alignSelf: 'center', gap: 6 },
  imgDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  imgDotActive:    { backgroundColor: COLORS.primary, width: 18 },
  zoomHint:        { position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  zoomHintTxt:     { color: '#fff', fontSize: 11, fontWeight: FONT.semibold },
  discBadge:       { position: 'absolute', top: 16, left: 16, backgroundColor: COLORS.red, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  discTxt:         { color: '#fff', fontSize: 13, fontWeight: FONT.black },
  body:            { backgroundColor: COLORS.white },
  priceSection:    { padding: SPACING.lg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  priceRow:        { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  price:           { fontSize: 28, fontWeight: FONT.black, color: COLORS.red },
  oldPrice:        { fontSize: 16, color: COLORS.gray400, textDecorationLine: 'line-through' },
  discLabel:       { fontSize: 14, color: COLORS.red, fontWeight: FONT.bold },
  productName:     { fontSize: 16, fontWeight: FONT.bold, color: COLORS.gray800, lineHeight: 22, marginBottom: 10 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  ratingNum:       { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  ratingCount:     { fontSize: 13, color: COLORS.gray400 },
  soldCount:       { fontSize: 13, color: COLORS.gray400 },
  couponBanner:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD700', borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.md },
  couponBadge:     { backgroundColor: '#FFD700', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, fontWeight: FONT.black, fontSize: 14, color: COLORS.gray800 },
  couponTitle:     { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  couponSub:       { fontSize: 11, color: COLORS.gray400 },
  deliveryCard:    { margin: SPACING.lg, marginTop: 0, backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md },
  deliveryTitle:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 10 },
  deliveryOpts:    { flexDirection: 'row', gap: 10 },
  deliveryOpt:     { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, padding: 10, alignItems: 'center' },
  deliveryOptLabel:{ fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  deliveryOptDate: { fontSize: 12, color: COLORS.green, fontWeight: FONT.semibold, marginTop: 2 },
  tabs:            { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab:             { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabTxt:          { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray400 },
  tabTxtActive:    { color: COLORS.primary, fontWeight: FONT.bold },
  tabContent:      { padding: SPACING.lg },
  descText:        { fontSize: 14, color: COLORS.gray600, lineHeight: 22 },
  specRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.sm, marginBottom: 4 },
  specKey:         { fontSize: 13, color: COLORS.gray600, fontWeight: FONT.semibold, flex: 1 },
  specVal:         { fontSize: 13, color: COLORS.gray800, fontWeight: FONT.bold, flex: 1, textAlign: 'right' },
  specsEmpty:      { alignItems: 'center', paddingVertical: 32 },
  specsEmptyTxt:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 6 },
  specsEmptySub:   { fontSize: 12, color: COLORS.gray400, textAlign: 'center', lineHeight: 18 },
  ratingSum:       { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  ratingSumBig:    { fontSize: 40, fontWeight: FONT.black, color: COLORS.gray800 },
  reviewCard:      { backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10 },
  revHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  revAvatar:       { fontSize: 28, width: 40, height: 40, textAlign: 'center', lineHeight: 40 },
  revName:         { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 2 },
  revDate:         { fontSize: 11, color: COLORS.gray400 },
  revText:         { fontSize: 13, color: COLORS.gray600, lineHeight: 20, marginBottom: 8 },
  revLike:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revLikeTxt:      { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },
  sellerCard:      { margin: SPACING.lg, backgroundColor: COLORS.gray100, borderRadius: RADIUS.xl, padding: SPACING.lg },
  sellerHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.md },
  sellerAvatar:    { width: 52, height: 52, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  sellerLogoImg:   { width: 52, height: 52, borderRadius: RADIUS.lg },
  sellerName:      { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  sellerSub:       { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  verifiedBadge:   { backgroundColor: COLORS.primary, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  verifiedTxt:     { color: '#fff', fontSize: 9, fontWeight: FONT.black },
  ownerTag:        { backgroundColor: COLORS.amberLight, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  ownerTagTxt:     { fontSize: 11, color: COLORS.amber, fontWeight: FONT.bold },
  sellerStats:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellerStat:      { flex: 1, alignItems: 'center' },
  sellerStatVal:   { fontSize: 13, fontWeight: FONT.black, color: COLORS.gray800 },
  sellerStatLbl:   { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  sellerStatDiv:   { width: 1, height: 30, backgroundColor: COLORS.border },
  relatedWrap:     { padding: SPACING.lg },
  relatedTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  relCard:         { width: 140, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  relImg:          { height: 110, alignItems: 'center', justifyContent: 'center' },
  relInfo:         { padding: 8 },
  relPrice:        { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  relName:         { fontSize: 11, color: COLORS.gray600, lineHeight: 15, marginTop: 2 },
  relStars:        { fontSize: 11, color: '#F5A623', marginTop: 3 },
  bottomBar:       { flexDirection: 'row', gap: 10, padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, ...SHADOW.strong },
  editBtn:         { flex: 1, backgroundColor: COLORS.amberLight, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.amber },
  editBtnTxt:      { color: COLORS.amber, fontSize: 14, fontWeight: FONT.black },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.gray100, borderRadius: RADIUS.md, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn:          { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnTxt:       { fontSize: 20, fontWeight: FONT.bold, color: COLORS.primary, lineHeight: 24 },
  qtyNum:          { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, minWidth: 18, textAlign: 'center' },
  buyNowBtn:       { flex: 1, backgroundColor: COLORS.gray800, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  buyNowTxt:       { color: '#fff', fontSize: 14, fontWeight: FONT.black },
  cartBtn:         { flex: 1, backgroundColor: '#FFD700', borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  cartBtnFeedback: { backgroundColor: COLORS.green },
  cartBtnTxt:      { color: COLORS.gray800, fontSize: 14, fontWeight: FONT.black },
});