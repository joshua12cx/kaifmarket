// src/screens/SellerRegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
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

export default function SellerRegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [storeName,    setStoreName]    = useState('');
  const [description,  setDescription]  = useState('');
  const [location,     setLocation]     = useState('Lima, Perú');
  const [phone,        setPhone]        = useState('');
  const [category,     setCategory]     = useState('');
  const [dniRuc,       setDniRuc]       = useState('');
  const [logoUri,      setLogoUri]      = useState<string | null>(null);
  const [docUri,       setDocUri]       = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  // ── Seleccionar logo ──────────────────────────────────────────
  const pickLogo = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', quality: 0.8, maxWidth: 400, maxHeight: 400,
    });
    if (result.assets?.[0]?.uri) { setLogoUri(result.assets[0].uri); }
  };

  // ── Seleccionar foto del documento (DNI/RUC) ──────────────────
  const pickDocument = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', quality: 0.8, maxWidth: 1200, maxHeight: 1200,
    });
    if (result.assets?.[0]?.uri) { setDocUri(result.assets[0].uri); }
  };

  // ── Subir imagen a Supabase Storage con RNFS ──────────────────
  const uploadImage = async (uri: string, prefix: string): Promise<string | null> => {
    try {
      const cleanUri = uri.replace('file://', '');
      const base64    = await RNFS.readFile(cleanUri, 'base64');

      const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) { lookup[chars.charCodeAt(i)] = i; }

      const b64   = base64.replace(/=/g, '');
      const len   = b64.length;
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

      const fileName = `${prefix}_${user?.id}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('sellers')
        .upload(fileName, bytes, { contentType: 'image/jpeg', upsert: true });

      if (error) {
        if (__DEV__) { console.log('[SELLER] Upload error:', error); }
        return null;
      }

      const { data: urlData } = supabase.storage.from('sellers').getPublicUrl(fileName);
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
    if (!dniRuc.trim())      { errs.dniRuc      = 'El DNI o RUC es requerido'; }
    else if (dniRuc.trim().length < 8) { errs.dniRuc = 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos) válido'; }
    if (!docUri)             { errs.docUri      = 'Sube una foto de tu DNI o RUC'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Crear tienda (queda pendiente de revisión) ────────────────
  const handleCreate = async () => {
    if (!validate()) { return; }
    if (!user) { Alert.alert('Error', 'Debes iniciar sesión primero'); return; }

    setLoading(true);
    try {
      let logoUrl: string | null = null;
      if (logoUri) { logoUrl = await uploadImage(logoUri, 'logo'); }

      let documentUrl: string | null = null;
      if (docUri) { documentUrl = await uploadImage(docUri, 'doc'); }

      if (!documentUrl) {
        Alert.alert('Error', 'No se pudo subir tu documento. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('sellers')
        .insert({
          user_id:     user.id,
          name:        storeName.trim(),
          description: description.trim(),
          location:    location.trim(),
          phone:       phone.trim() || null,
          category:    category,
          logo_url:    logoUrl,
          dni_ruc:     dniRuc.trim(),
          document_url: documentUrl,
          status:      'pending',
          is_premium:  false,
          is_verified: false,
          rating:      5.0,
          total_sales: 0,
          followers:   0,
        });

      if (error) {
        if (__DEV__) { console.log('[SELLER] Create error:', error); }
        Alert.alert('Error', 'No se pudo crear la tienda. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      // El usuario YA es vendedor (puede ver su panel),
      // pero su tienda está "pending" hasta revisión manual
      await supabase
        .from('users')
        .update({ is_seller: true })
        .eq('id', user.id);

      updateUser({ is_seller: true });

      setLoading(false);
      Alert.alert(
        '📋 Solicitud enviada',
        'Hemos recibido tu solicitud para vender en KaifMarket. Revisaremos tu información en las próximas 24-48 horas. Te notificaremos cuando sea aprobada.',
        [{ text: 'Entendido', onPress: () => navigation.replace('SellerDashboard') }],
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
            <Text style={sr.label}>
              Teléfono de contacto <Text style={sr.optional}>(opcional)</Text>
            </Text>
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

        {/* ── VERIFICACIÓN DE IDENTIDAD ── */}
        <View style={sr.card}>
          <Text style={sr.cardTitle}>Verificación de identidad</Text>
          <Text style={sr.verifySub}>
            Necesitamos verificar tu identidad para aprobar tu tienda y mantener KaifMarket seguro.
          </Text>

          <View style={sr.field}>
            <Text style={sr.label}>DNI o RUC *</Text>
            <View style={[sr.inputWrap, errors.dniRuc && sr.inputError]}>
              <TextInput
                style={sr.input}
                placeholder="Ej: 12345678 o 20123456789"
                placeholderTextColor={COLORS.gray400}
                value={dniRuc}
                onChangeText={t => { setDniRuc(t.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, dniRuc: '' })); }}
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>
            {errors.dniRuc ? <Text style={sr.errorTxt}>{errors.dniRuc}</Text> : null}
          </View>

          <View style={sr.field}>
            <Text style={sr.label}>Foto de tu DNI o RUC *</Text>
            <TouchableOpacity
              style={[sr.docWrap, errors.docUri && sr.inputError]}
              onPress={pickDocument}
              activeOpacity={0.8}>
              {docUri ? (
                <>
                  <Image source={{ uri: docUri }} style={sr.docImg} resizeMode="cover" />
                  <View style={sr.docEditBadge}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: FONT.bold }}>Cambiar foto</Text>
                  </View>
                </>
              ) : (
                <View style={sr.docPlaceholder}>
                  <Text style={{ fontSize: 32 }}>📄</Text>
                  <Text style={sr.docHint}>Toca para subir foto de tu documento</Text>
                  <Text style={sr.docHintSub}>Asegúrate que se vea claro y completo</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.docUri ? <Text style={sr.errorTxt}>{errors.docUri}</Text> : null}
          </View>
        </View>

        {/* ── INFO ── */}
        <View style={sr.infoCard}>
          <Text style={sr.infoIcon}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={sr.infoTitle}>¿Cómo funciona?</Text>
            <Text style={sr.infoTxt}>
              • Tu solicitud será revisada en 24-48 horas{'\n'}
              • Una vez aprobada, podrás publicar productos{'\n'}
              • Listado gratuito de productos{'\n'}
              • Pagamos cuando el cliente compra{'\n'}
              • Plan Premium disponible: S/ 55–80/mes
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
            ? (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.white} size="small" />
                <Text style={sr.createBtnTxt}>Enviando solicitud...</Text>
              </View>
            )
            : <Text style={sr.createBtnTxt}>Enviar solicitud →</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const sr = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.gray50 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:         { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:         { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:     { fontSize: 17, fontWeight: FONT.black, color: COLORS.gray800 },
  card:            { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardTitle:       { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  logoWrap:        { alignItems: 'center', marginBottom: SPACING.sm },
  logoImg:         { width: 120, height: 120, borderRadius: RADIUS.xl },
  logoPlaceholder: { width: 120, height: 120, borderRadius: RADIUS.xl, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', gap: 6 },
  logoHint:        { fontSize: 11, color: COLORS.primary, fontWeight: FONT.semibold, textAlign: 'center' },
  changeLogoBtn:   { alignSelf: 'center', marginTop: 8 },
  changeLogoBtnTxt:{ fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  field:           { marginBottom: SPACING.md },
  label:           { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray600, marginBottom: 6 },
  optional:        { fontWeight: FONT.regular, color: COLORS.gray400 },
  inputWrap:       { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, backgroundColor: COLORS.gray50 },
  inputError:      { borderColor: COLORS.red },
  input:           { fontSize: 14, color: COLORS.gray800, padding: 0 },
  errorTxt:        { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  catsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACING.sm },
  catBtn:          { width: '30%', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, gap: 4 },
  catBtnActive:    { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  catLabel:        { fontSize: 11, fontWeight: FONT.bold, color: COLORS.gray600, textAlign: 'center' },
  catLabelActive:  { color: COLORS.primary },
  verifySub:       { fontSize: 12, color: COLORS.gray400, marginBottom: SPACING.md, lineHeight: 18, marginTop: -8 },
  docWrap:         { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.border },
  docImg:          { width: '100%', height: 180 },
  docEditBadge:    { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  docPlaceholder:  { height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gray50, gap: 6, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.lg },
  docHint:         { fontSize: 13, color: COLORS.gray600, fontWeight: FONT.semibold, textAlign: 'center', paddingHorizontal: 20 },
  docHintSub:      { fontSize: 11, color: COLORS.gray400, textAlign: 'center' },
  infoCard:        { flexDirection: 'row', gap: 10, backgroundColor: COLORS.blueLight, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  infoIcon:        { fontSize: 20 },
  infoTitle:       { fontSize: 13, fontWeight: FONT.black, color: COLORS.blue, marginBottom: 6 },
  infoTxt:         { fontSize: 12, color: COLORS.blue, lineHeight: 20 },
  createBtn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', ...SHADOW.strong },
  createBtnTxt:    { color: COLORS.white, fontSize: 15, fontWeight: FONT.black },
});