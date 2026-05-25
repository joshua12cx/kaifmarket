// src/screens/SellerRegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';

const CATEGORIES = [
  { id: 'electro', label: 'Electrónica',  emoji: '📱' },
  { id: 'hogar',   label: 'Hogar',        emoji: '🛋️' },
  { id: 'moda',    label: 'Moda',         emoji: '👟' },
  { id: 'belleza', label: 'Belleza',      emoji: '💄' },
  { id: 'deporte', label: 'Deporte',      emoji: '⚽' },
  { id: 'otros',   label: 'Otros',        emoji: '🛍️' },
];

export default function SellerRegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [storeName,    setStoreName]    = useState('');
  const [description,  setDescription]  = useState('');
  const [location,     setLocation]     = useState('Lima, Perú');
  const [phone,        setPhone]        = useState('');
  const [category,     setCategory]     = useState('');
  const [logoUri,      setLogoUri]      = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  // ── Seleccionar logo ──────────────────────────────────────────
  const pickLogo = async () => {
    const result = await launchImageLibrary({
      mediaType:   'photo',
      quality:     0.8,
      maxWidth:    400,
      maxHeight:   400,
    });

    if (result.assets && result.assets[0]?.uri) {
      setLogoUri(result.assets[0].uri);
    }
  };

  // ── Subir logo a Supabase Storage ────────────────────────────
  const uploadLogo = async (uri: string): Promise<string | null> => {
    try {
      const response  = await fetch(uri);
      const blob      = await response.blob();
      const fileName  = `seller_${user?.id}_${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('sellers')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

      if (error) {
        if (__DEV__) { console.log('[SELLER] Logo upload error:', error); }
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('sellers')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (e) {
      if (__DEV__) { console.log('[SELLER] Upload error:', e); }
      return null;
    }
  };

  // ── Validación ────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!storeName.trim())   { errs.storeName   = 'El nombre de la tienda es requerido'; }
    if (!description.trim()) { errs.description = 'La descripción es requerida'; }
    if (!category)           { errs.category    = 'Selecciona una categoría'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Crear tienda ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) { return; }
    if (!user) { Alert.alert('Error', 'Debes iniciar sesión primero'); return; }

    setLoading(true);
    try {
      // Subir logo si hay uno
      let logoUrl: string | null = null;
      if (logoUri) { logoUrl = await uploadLogo(logoUri); }

      // Crear tienda en Supabase
      const { data: seller, error } = await supabase
        .from('sellers')
        .insert({
          user_id:     user.id,
          name:        storeName.trim(),
          description: description.trim(),
          location:    location.trim(),
          phone:       phone.trim() || null,
          category:    category,
          logo_url:    logoUrl,
          is_premium:  false,
          is_verified: false,
          rating:      5.0,
          total_sales: 0,
          followers:   0,
        })
        .select()
        .single();

      if (error) {
        if (__DEV__) { console.log('[SELLER] Create error:', error); }
        Alert.alert('Error', 'No se pudo crear la tienda. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      // Actualizar usuario como vendedor
      await supabase
        .from('users')
        .update({ is_seller: true })
        .eq('id', user.id);

      updateUser({ is_seller: true });

      setLoading(false);
      Alert.alert(
        '¡Tienda creada! 🎉',
        'Tu tienda está lista. Ahora puedes empezar a subir productos.',
        [{ text: '¡Vamos!', onPress: () => navigation.replace('SellerDashboard') }],
      );

    } catch (e) {
      if (__DEV__) { console.log('[SELLER] handleCreate error:', e); }
      setLoading(false);
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    }
  };

  return (
    <View style={[sr.container, { paddingTop: insets.top }]}>
      <View style={sr.header}>
        <TouchableOpacity style={sr.backBtn} onPress={() => navigation.goBack()}>
          <Text style={sr.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={sr.headerTitle}>Crear mi tienda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">

        {/* ── LOGO ── */}
        <View style={sr.card}>
          <Text style={sr.cardTitle}>Logo de tu tienda</Text>
          <TouchableOpacity style={sr.logoWrap} onPress={pickLogo} activeOpacity={0.8}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={sr.logoImg} />
            ) : (
              <View style={sr.logoPlaceholder}>
                <Text style={{ fontSize: 36 }}>🏪</Text>
                <Text style={sr.logoHint}>Toca para subir tu logo</Text>
              </View>
            )}
          </TouchableOpacity>
          {logoUri && (
            <TouchableOpacity style={sr.changeLogoBtn} onPress={pickLogo}>
              <Text style={sr.changeLogoBtnTxt}>Cambiar logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── DATOS DE LA TIENDA ── */}
        <View style={sr.card}>
          <Text style={sr.cardTitle}>Datos de tu tienda</Text>

          <View style={sr.field}>
            <Text style={sr.label}>Nombre de la tienda *</Text>
            <View style={[sr.inputWrap, errors.storeName && sr.inputError]}>
              <TextInput
                style={sr.input}
                placeholder="Ej: TechStore Lima"
                placeholderTextColor={COLORS.gray400}
                value={storeName}
                onChangeText={t => { setStoreName(t); setErrors(e => ({ ...e, storeName: '' })); }}
                autoCapitalize="words"
              />
            </View>
            {errors.storeName ? <Text style={sr.errorTxt}>{errors.storeName}</Text> : null}
          </View>

          <View style={sr.field}>
            <Text style={sr.label}>Descripción *</Text>
            <View style={[sr.inputWrap, errors.description && sr.inputError, { minHeight: 80 }]}>
              <TextInput
                style={[sr.input, { textAlignVertical: 'top' }]}
                placeholder="Cuéntanos qué vendes y qué hace especial a tu tienda..."
                placeholderTextColor={COLORS.gray400}
                value={description}
                onChangeText={t => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
                multiline
                numberOfLines={3}
              />
            </View>
            {errors.description ? <Text style={sr.errorTxt}>{errors.description}</Text> : null}
          </View>

          <View style={sr.field}>
            <Text style={sr.label}>Ubicación</Text>
            <View style={sr.inputWrap}>
              <TextInput
                style={sr.input}
                placeholder="Ej: Miraflores, Lima"
                placeholderTextColor={COLORS.gray400}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={sr.field}>
            <Text style={sr.label}>Teléfono de contacto <Text style={sr.optional}>(opcional)</Text></Text>
            <View style={sr.inputWrap}>
              <TextInput
                style={sr.input}
                placeholder="+51 999 999 999"
                placeholderTextColor={COLORS.gray400}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* ── CATEGORÍA PRINCIPAL ── */}
        <View style={sr.card}>
          <Text style={sr.cardTitle}>Categoría principal *</Text>
          {errors.category ? <Text style={sr.errorTxt}>{errors.category}</Text> : null}
          <View style={sr.catsGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[sr.catBtn, category === cat.id && sr.catBtnActive]}
                onPress={() => { setCategory(cat.id); setErrors(e => ({ ...e, category: '' })); }}
                activeOpacity={0.8}>
                <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
                <Text style={[sr.catLabel, category === cat.id && sr.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── INFO ── */}
        <View style={sr.infoCard}>
          <Text style={sr.infoIcon}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={sr.infoTitle}>¿Cómo funciona?</Text>
            <Text style={sr.infoTxt}>
              • Listado gratuito de productos{'\n'}
              • Pagamos cuando el cliente compra{'\n'}
              • Plan Premium disponible: S/ 55–80/mes{'\n'}
              • Badge PREMIUM + mayor visibilidad
            </Text>
          </View>
        </View>

        {/* ── BOTÓN CREAR ── */}
        <TouchableOpacity
          style={[sr.createBtn, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={sr.createBtnTxt}>Crear mi tienda →</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const sr = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.gray50 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:        { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:        { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:    { fontSize: 17, fontWeight: FONT.black, color: COLORS.gray800 },
  card:           { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardTitle:      { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  logoWrap:       { alignItems: 'center', marginBottom: SPACING.sm },
  logoImg:        { width: 120, height: 120, borderRadius: RADIUS.xl },
  logoPlaceholder:{ width: 120, height: 120, borderRadius: RADIUS.xl, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', gap: 6 },
  logoHint:       { fontSize: 11, color: COLORS.primary, fontWeight: FONT.semibold, textAlign: 'center' },
  changeLogoBtn:  { alignSelf: 'center', marginTop: 8 },
  changeLogoBtnTxt:{ fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  field:          { marginBottom: SPACING.md },
  label:          { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray600, marginBottom: 6 },
  optional:       { fontWeight: FONT.regular, color: COLORS.gray400 },
  inputWrap:      { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, backgroundColor: COLORS.gray50 },
  inputError:     { borderColor: COLORS.red },
  input:          { fontSize: 14, color: COLORS.gray800, padding: 0 },
  errorTxt:       { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  catsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACING.sm },
  catBtn:         { width: '30%', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, gap: 4 },
  catBtnActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  catLabel:       { fontSize: 11, fontWeight: FONT.bold, color: COLORS.gray600, textAlign: 'center' },
  catLabelActive: { color: COLORS.primary },
  infoCard:       { flexDirection: 'row', gap: 10, backgroundColor: COLORS.blueLight, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  infoIcon:       { fontSize: 20 },
  infoTitle:      { fontSize: 13, fontWeight: FONT.black, color: COLORS.blue, marginBottom: 6 },
  infoTxt:        { fontSize: 12, color: COLORS.blue, lineHeight: 20 },
  createBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', ...SHADOW.strong },
  createBtnTxt:   { color: COLORS.white, fontSize: 15, fontWeight: FONT.black },
});
