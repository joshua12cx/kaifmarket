// src/screens/SellerAddProductScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Image, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';

const CATEGORIES = [
  { id: 'electro', label: 'Electrónica', emoji: '📱' },
  { id: 'hogar',   label: 'Hogar',       emoji: '🛋️' },
  { id: 'moda',    label: 'Moda',        emoji: '👟' },
  { id: 'belleza', label: 'Belleza',     emoji: '💄' },
  { id: 'deporte', label: 'Deporte',     emoji: '⚽' },
  { id: 'otros',   label: 'Otros',       emoji: '🛍️' },
];

export default function SellerAddProductScreen({ route, navigation }: any) {
  const { sellerId, product } = route.params || {};
  const isEditing = !!product;
  const insets    = useSafeAreaInsets();
  const { user }  = useAuth();

  const [name,        setName]        = useState(product?.name        || '');
  const [shortName,   setShortName]   = useState(product?.short_name  || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price,       setPrice]       = useState(product?.price?.toString()     || '');
  const [oldPrice,    setOldPrice]    = useState(product?.old_price?.toString() || '');
  const [stock,       setStock]       = useState(product?.stock?.toString()     || '');
  const [category,    setCategory]    = useState(product?.category_id || '');
  const [isActive,    setIsActive]    = useState(product?.is_active ?? true);
  const [specs,       setSpecs]       = useState<string[]>(product?.specs || ['']);
  const [images,      setImages]      = useState<string[]>([
    product?.image_url   || '',
    product?.image_url_2 || '',
    product?.image_url_3 || '',
  ]);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // ── Verificación de aprobación del vendedor ───────────────────
  const [checkingApproval, setCheckingApproval] = useState(true);
  const [sellerStatus,      setSellerStatus]    = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!sellerId) { setCheckingApproval(false); return; }
      try {
        const { data } = await supabase
          .from('sellers')
          .select('status')
          .eq('id', sellerId)
          .single();
        setSellerStatus(data?.status || 'pending');
      } catch (e) {
        if (__DEV__) { console.log('[ADD_PRODUCT] Status check error:', e); }
        setSellerStatus('pending');
      } finally {
        setCheckingApproval(false);
      }
    };
    checkStatus();
  }, [sellerId]);

  const validImages = images.filter(img => img && img.trim().length > 0);

  // ── Seleccionar imagen ────────────────────────────────────────
  const pickImage = (index: number) => {
    Alert.alert('Seleccionar imagen', '¿De dónde quieres subir la foto?', [
      {
        text: '📷 Cámara',
        onPress: async () => {
          const result = await launchCamera({
            mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800,
          });
          if (result.assets?.[0]?.uri) {
            setImages(prev => {
              const next = [...prev];
              next[index] = result.assets![0].uri!;
              return next;
            });
            setErrors(e => ({ ...e, images: '' }));
          }
        },
      },
      {
        text: '🖼️ Galería',
        onPress: async () => {
          const result = await launchImageLibrary({
            mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800,
          });
          if (result.assets?.[0]?.uri) {
            setImages(prev => {
              const next = [...prev];
              next[index] = result.assets![0].uri!;
              return next;
            });
            setErrors(e => ({ ...e, images: '' }));
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = [...prev];
      next[index] = '';
      return next;
    });
  };

  // ── Subir imagen con RNFS ─────────────────────────────────────
  const uploadImage = async (uri: string, index: number): Promise<string | null> => {
    try {
      const cleanUri = uri.replace('file://', '');
      const base64 = await RNFS.readFile(cleanUri, 'base64');

      const chars   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const lookup  = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) { lookup[chars.charCodeAt(i)] = i; }

      const b64 = base64.replace(/=/g, '');
      const len = b64.length;
      const bytes = new Uint8Array(Math.floor((len * 3) / 4));
      let j = 0;

      for (let i = 0; i < len; i += 4) {
        const a = lookup[b64.charCodeAt(i)];
        const b = lookup[b64.charCodeAt(i + 1)];
        const c = lookup[b64.charCodeAt(i + 2)];
        const d = lookup[b64.charCodeAt(i + 3)];
        bytes[j++] = (a << 2) | (b >> 4);
        if (i + 2 < len) { bytes[j++] = ((b & 15) << 4) | (c >> 2); }
        if (i + 3 < len) { bytes[j++] = ((c & 3) << 6) | d; }
      }

      const fileName = `product_${sellerId}_${Date.now()}_${index}.jpg`;
      const { error } = await supabase.storage
        .from('products')
        .upload(fileName, bytes, { contentType: 'image/jpeg', upsert: true });

      if (error) {
        if (__DEV__) { console.log('[UPLOAD] Error:', JSON.stringify(error)); }
        return null;
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
      return urlData.publicUrl;

    } catch (e) {
      if (__DEV__) { console.log('[UPLOAD] Exception:', e); }
      return null;
    }
  };

  // ── Specs ─────────────────────────────────────────────────────
  const addSpec    = () => setSpecs(prev => [...prev, '']);
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, val: string) => {
    const next = [...specs]; next[i] = val; setSpecs(next);
  };

  // ── Validación ────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())        { errs.name        = 'El nombre es requerido'; }
    if (!description.trim()) { errs.description = 'La descripción es requerida'; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      errs.price = 'El precio debe ser mayor a 0';
    }
    if (!stock || isNaN(Number(stock)) || Number(stock) < 0) {
      errs.stock = 'El stock debe ser 0 o mayor';
    }
    if (!category) { errs.category = 'Selecciona una categoría'; }

    const newImages = validImages.filter(img => img.startsWith('file://') || img.startsWith('/'));
    const existingImages = validImages.filter(img => img.startsWith('http'));

    if (newImages.length === 0 && existingImages.length === 0) {
      errs.images = 'Agrega al menos una foto';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Guardar producto ──────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) {
      Alert.alert('Faltan datos', 'Por favor completa todos los campos requeridos.');
      return;
    }
    setLoading(true);

    try {
      const imageUrls: string[] = [];

      for (let i = 0; i < validImages.length; i++) {
        const img = validImages[i];
        if (img.startsWith('http')) {
          imageUrls.push(img);
        } else {
          const url = await uploadImage(img, i);
          if (url) { imageUrls.push(url); }
        }
      }

      const productData = {
        seller_id:    sellerId,
        category_id:  category,
        name:         name.trim(),
        short_name:   shortName.trim() || name.trim().substring(0, 30),
        description:  description.trim(),
        price:        Number(price),
        old_price:    oldPrice ? Number(oldPrice) : null,
        stock:        Number(stock),
        is_active:    isActive,
        image_url:    imageUrls[0] || null,
        image_url_2:  imageUrls[1] || null,
        image_url_3:  imageUrls[2] || null,
        sold:         product?.sold         || 0,
        rating:       product?.rating       || 5.0,
        review_count: product?.review_count || 0,
        tag:          oldPrice ? 'sale' : null,
        tag_label:    oldPrice
          ? `-${Math.round(((Number(oldPrice) - Number(price)) / Number(oldPrice)) * 100)}%`
          : null,
      };

      let savedProduct;

      if (isEditing) {
        const { data, error } = await supabase
          .from('products').update(productData).eq('id', product.id).select().single();
        if (error) { throw error; }
        savedProduct = data;
      } else {
        const { data, error } = await supabase
          .from('products').insert(productData).select().single();
        if (error) { throw error; }
        savedProduct = data;
      }

      if (savedProduct && specs.filter(s => s.trim()).length > 0) {
        if (isEditing) {
          await supabase.from('product_specs').delete().eq('product_id', savedProduct.id);
        }
        const specsData = specs.filter(s => s.trim()).map((spec, i) => {
          const parts = spec.split(':');
          return {
            product_id: savedProduct.id,
            key:        parts[0]?.trim() || spec,
            value:      parts[1]?.trim() || '',
            order_num:  i,
          };
        });
        if (specsData.length > 0) {
          await supabase.from('product_specs').insert(specsData);
        }
      }

      setLoading(false);
      Alert.alert(
        isEditing ? '✅ Actualizado' : '✅ Publicado',
        `Producto guardado con ${imageUrls.length} foto(s).`,
        [{ text: '¡Genial!', onPress: () => navigation.goBack() }],
      );

    } catch (e: any) {
      if (__DEV__) { console.log('[SAVE] Error:', e); }
      setLoading(false);
      Alert.alert('Error', e?.message || 'Intenta de nuevo');
    }
  };

  // ── Cargando verificación ─────────────────────────────────────
  if (checkingApproval) {
    return (
      <View style={[ap.container, { paddingTop: insets.top }]}>
        <View style={ap.header}>
          <TouchableOpacity style={ap.backBtn} onPress={() => navigation.goBack()}>
            <Text style={ap.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={ap.headerTitle}>Nuevo producto</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  // ── Bloqueado — vendedor no aprobado ──────────────────────────
  if (sellerStatus !== 'approved') {
    return (
      <View style={[ap.container, { paddingTop: insets.top }]}>
        <View style={ap.header}>
          <TouchableOpacity style={ap.backBtn} onPress={() => navigation.goBack()}>
            <Text style={ap.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={ap.headerTitle}>Nuevo producto</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={ap.blockedWrap}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>
            {sellerStatus === 'rejected' ? '❌' : '⏳'}
          </Text>
          <Text style={ap.blockedTitle}>
            {sellerStatus === 'rejected'
              ? 'Tu tienda no fue aprobada'
              : 'Tu tienda está en revisión'}
          </Text>
          <Text style={ap.blockedSub}>
            {sellerStatus === 'rejected'
              ? 'Corrige la información de tu tienda para volver a solicitar la aprobación.'
              : 'Podrás publicar productos una vez que tu tienda sea aprobada por nuestro equipo (24-48 horas).'}
          </Text>
          <TouchableOpacity
            style={ap.blockedBtn}
            onPress={() => navigation.goBack()}>
            <Text style={ap.blockedBtnTxt}>Volver a mi tienda</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Formulario normal ─────────────────────────────────────────
  return (
    <View style={[ap.container, { paddingTop: insets.top }]}>
      <View style={ap.header}>
        <TouchableOpacity style={ap.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ap.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={ap.headerTitle}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">

        {/* ── FOTOS ── */}
        <View style={ap.card}>
          <Text style={ap.cardTitle}>📸 Fotos del producto</Text>
          <Text style={ap.cardSub}>
            Agrega hasta 3 fotos.{'  '}
            <Text style={{ color: validImages.length > 0 ? COLORS.green : COLORS.primary, fontWeight: FONT.bold }}>
              {validImages.length}/3 seleccionadas
            </Text>
          </Text>
          {errors.images ? <Text style={ap.errorTxt}>{errors.images}</Text> : null}
          <View style={ap.imagesRow}>
            {[0, 1, 2].map(i => (
              <TouchableOpacity
                key={i}
                style={[ap.imageSlot, i === 0 && ap.imageSlotMain]}
                onPress={() => pickImage(i)}
                activeOpacity={0.8}>
                {images[i] && images[i].length > 0 ? (
                  <>
                    <Image source={{ uri: images[i] }} style={ap.imagePreview} />
                    <TouchableOpacity style={ap.removeImg} onPress={() => removeImage(i)}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: FONT.black }}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={ap.imagePlaceholder}>
                    <Text style={{ fontSize: i === 0 ? 32 : 24 }}>📷</Text>
                    <Text style={ap.imageHint}>{i === 0 ? 'Principal' : `Foto ${i + 1}`}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── DATOS BÁSICOS ── */}
        <View style={ap.card}>
          <Text style={ap.cardTitle}>📝 Información del producto</Text>

          <View style={ap.field}>
            <Text style={ap.label}>Nombre completo *</Text>
            <View style={[ap.inputWrap, errors.name && ap.inputError]}>
              <TextInput
                style={ap.input}
                placeholder="Ej: Samsung Galaxy A16 128GB"
                placeholderTextColor={COLORS.gray400}
                value={name}
                onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
              />
            </View>
            {errors.name ? <Text style={ap.errorTxt}>{errors.name}</Text> : null}
          </View>

          <View style={ap.field}>
            <Text style={ap.label}>Nombre corto <Text style={ap.optional}>(para cards)</Text></Text>
            <View style={ap.inputWrap}>
              <TextInput
                style={ap.input}
                placeholder="Ej: Samsung A16"
                placeholderTextColor={COLORS.gray400}
                value={shortName}
                onChangeText={setShortName}
              />
            </View>
          </View>

          <View style={ap.field}>
            <Text style={ap.label}>Descripción *</Text>
            <View style={[ap.inputWrap, errors.description && ap.inputError, { minHeight: 80 }]}>
              <TextInput
                style={[ap.input, { textAlignVertical: 'top' }]}
                placeholder="Describe tu producto detalladamente..."
                placeholderTextColor={COLORS.gray400}
                value={description}
                onChangeText={t => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
                multiline
                numberOfLines={4}
              />
            </View>
            {errors.description ? <Text style={ap.errorTxt}>{errors.description}</Text> : null}
          </View>
        </View>

        {/* ── PRECIOS Y STOCK ── */}
        <View style={ap.card}>
          <Text style={ap.cardTitle}>💰 Precio y stock</Text>
          <View style={ap.priceRow}>
            <View style={[ap.field, { flex: 1 }]}>
              <Text style={ap.label}>Precio (S/) *</Text>
              <View style={[ap.inputWrap, errors.price && ap.inputError]}>
                <TextInput
                  style={ap.input} placeholder="0.00"
                  placeholderTextColor={COLORS.gray400}
                  value={price} keyboardType="decimal-pad"
                  onChangeText={t => { setPrice(t); setErrors(e => ({ ...e, price: '' })); }}
                />
              </View>
              {errors.price ? <Text style={ap.errorTxt}>{errors.price}</Text> : null}
            </View>
            <View style={[ap.field, { flex: 1 }]}>
              <Text style={ap.label}>Precio anterior <Text style={ap.optional}>(oferta)</Text></Text>
              <View style={ap.inputWrap}>
                <TextInput
                  style={ap.input} placeholder="0.00"
                  placeholderTextColor={COLORS.gray400}
                  value={oldPrice} keyboardType="decimal-pad"
                  onChangeText={setOldPrice}
                />
              </View>
            </View>
          </View>

          <View style={ap.field}>
            <Text style={ap.label}>Stock disponible *</Text>
            <View style={[ap.inputWrap, errors.stock && ap.inputError]}>
              <TextInput
                style={ap.input} placeholder="Cantidad disponible"
                placeholderTextColor={COLORS.gray400}
                value={stock} keyboardType="number-pad"
                onChangeText={t => { setStock(t); setErrors(e => ({ ...e, stock: '' })); }}
              />
            </View>
            {errors.stock ? <Text style={ap.errorTxt}>{errors.stock}</Text> : null}
          </View>

          <View style={ap.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={ap.switchLabel}>Producto activo</Text>
              <Text style={ap.switchSub}>{isActive ? 'Visible para compradores' : 'Oculto'}</Text>
            </View>
            <Switch
              value={isActive} onValueChange={setIsActive}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* ── CATEGORÍA ── */}
        <View style={ap.card}>
          <Text style={ap.cardTitle}>🏷️ Categoría *</Text>
          {errors.category ? <Text style={ap.errorTxt}>{errors.category}</Text> : null}
          <View style={ap.catsRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[ap.catBtn, category === cat.id && ap.catBtnActive]}
                onPress={() => { setCategory(cat.id); setErrors(e => ({ ...e, category: '' })); }}
                activeOpacity={0.8}>
                <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                <Text style={[ap.catLabel, category === cat.id && ap.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── ESPECIFICACIONES ── */}
        <View style={ap.card}>
          <Text style={ap.cardTitle}>📋 Especificaciones</Text>
          <Text style={ap.cardSub}>Formato: "Clave: Valor" — Ej: "Color: Negro"</Text>
          {specs.map((spec, i) => (
            <View key={i} style={ap.specRow}>
              <View style={[ap.inputWrap, { flex: 1 }]}>
                <TextInput
                  style={ap.input} placeholder="Ej: Almacenamiento: 128GB"
                  placeholderTextColor={COLORS.gray400}
                  value={spec} onChangeText={t => updateSpec(i, t)}
                />
              </View>
              {specs.length > 1 && (
                <TouchableOpacity style={ap.removeSpecBtn} onPress={() => removeSpec(i)}>
                  <Text style={{ color: COLORS.red, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={ap.addSpecBtn} onPress={addSpec}>
            <Text style={ap.addSpecBtnTxt}>+ Agregar especificación</Text>
          </TouchableOpacity>
        </View>

        {/* ── BOTÓN GUARDAR ── */}
        <TouchableOpacity
          style={[ap.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={ap.saveBtnTxt}>Subiendo fotos...</Text>
            </View>
          ) : (
            <Text style={ap.saveBtnTxt}>
              {isEditing
                ? 'Guardar cambios →'
                : `Publicar producto ${validImages.length > 0 ? `(${validImages.length} foto${validImages.length > 1 ? 's' : ''})` : ''} →`}
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const ap = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.gray50 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:         { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:         { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:     { fontSize: 17, fontWeight: FONT.black, color: COLORS.gray800 },
  card:            { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardTitle:       { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 4 },
  cardSub:         { fontSize: 12, color: COLORS.gray400, marginBottom: SPACING.md },
  imagesRow:       { flexDirection: 'row', gap: 10 },
  imageSlot:       { width: 90, height: 90, borderRadius: RADIUS.lg, overflow: 'hidden', position: 'relative' },
  imageSlotMain:   { width: 120, height: 120 },
  imagePreview:    { width: '100%', height: '100%' },
  imagePlaceholder:{ width: '100%', height: '100%', backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: RADIUS.lg, gap: 4 },
  imageHint:       { fontSize: 10, color: COLORS.gray400, fontWeight: FONT.semibold },
  removeImg:       { position: 'absolute', top: 4, right: 4, backgroundColor: COLORS.red, borderRadius: RADIUS.full, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  field:           { marginBottom: SPACING.md },
  label:           { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray600, marginBottom: 6 },
  optional:        { fontWeight: FONT.regular, color: COLORS.gray400, fontSize: 12 },
  inputWrap:       { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, backgroundColor: COLORS.gray50 },
  inputError:      { borderColor: COLORS.red },
  input:           { fontSize: 14, color: COLORS.gray800, padding: 0 },
  errorTxt:        { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  priceRow:        { flexDirection: 'row', gap: 10 },
  switchRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: SPACING.sm, borderTopWidth: 0.5, borderTopColor: COLORS.border, marginTop: SPACING.sm },
  switchLabel:     { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  switchSub:       { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  catsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 8 },
  catBtnActive:    { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  catLabel:        { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray600 },
  catLabelActive:  { color: COLORS.primary },
  specRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeSpecBtn:   { padding: 4 },
  addSpecBtn:      { alignSelf: 'flex-start', marginTop: 4 },
  addSpecBtnTxt:   { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  saveBtn:         { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', ...SHADOW.strong },
  saveBtnTxt:      { color: COLORS.white, fontSize: 15, fontWeight: FONT.black },
  blockedWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  blockedTitle:    { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800, textAlign: 'center', marginBottom: 10 },
  blockedSub:      { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  blockedBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, paddingHorizontal: 32, ...SHADOW.strong },
  blockedBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: FONT.black },
});