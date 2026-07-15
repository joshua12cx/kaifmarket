// src/screens/SellerEditStore.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Image, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import {
  ChevronLeft, Store, Pencil, AlertTriangle, Power,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context';
import { getCategoryIcon } from '../utils/categoryIcons';

const CATEGORIES = [
  { id: 'electro', label: 'Electrónica' },
  { id: 'hogar',   label: 'Hogar'       },
  { id: 'moda',    label: 'Moda'        },
  { id: 'belleza', label: 'Belleza'     },
  { id: 'deporte', label: 'Deporte'     },
  { id: 'otros',   label: 'Otros'       },
];

export default function SellerEditStore({ route, navigation }: any) {
  const { seller } = route.params;
  const insets     = useSafeAreaInsets();
  const { user }   = useAuth();

  const [storeName,   setStoreName]   = useState(seller?.name        || '');
  const [description, setDescription] = useState(seller?.description || '');
  const [location,    setLocation]    = useState(seller?.location    || 'Lima, Perú');
  const [phone,       setPhone]       = useState(seller?.phone       || '');
  const [category,    setCategory]    = useState(seller?.category    || '');
  const [logoUri,     setLogoUri]     = useState<string | null>(seller?.logo_url || null);
  const [newLogoUri,  setNewLogoUri]  = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // ── Seleccionar nuevo logo ────────────────────────────────────
  const pickLogo = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', quality: 0.8, maxWidth: 400, maxHeight: 400,
    });
    if (result.assets?.[0]?.uri) {
      setNewLogoUri(result.assets[0].uri);
      setLogoUri(result.assets[0].uri);
    }
  };

  // ── Subir logo con RNFS ───────────────────────────────────────
  const uploadLogo = async (uri: string): Promise<string | null> => {
    try {
      const cleanUri  = uri.replace('file://', '');
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

      const fileName = `seller_${user?.id}_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('sellers')
        .upload(fileName, bytes, { contentType: 'image/jpeg', upsert: true });

      if (error) {
        if (__DEV__) { console.log('[EDIT_STORE] Logo error:', error); }
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('sellers')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (e) {
      if (__DEV__) { console.log('[EDIT_STORE] Upload error:', e); }
      return null;
    }
  };

  // ── Validación ────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!storeName.trim())   { errs.storeName   = 'El nombre es requerido'; }
    if (!description.trim()) { errs.description = 'La descripción es requerida'; }
    if (!category)           { errs.category    = 'Selecciona una categoría'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Guardar cambios ───────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) { return; }
    setLoading(true);

    try {
      let logoUrl = seller?.logo_url || null;
      if (newLogoUri) {
        const uploaded = await uploadLogo(newLogoUri);
        if (uploaded) { logoUrl = uploaded; }
      }

      const { error } = await supabase
        .from('sellers')
        .update({
          name:        storeName.trim(),
          description: description.trim(),
          location:    location.trim(),
          phone:       phone.trim() || null,
          category,
          logo_url:    logoUrl,
        })
        .eq('id', seller.id);

      if (error) {
        if (__DEV__) { console.log('[EDIT_STORE] Update error:', error); }
        Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      setLoading(false);
      Alert.alert(
        '✅ Tienda actualizada',
        'Los cambios se guardaron correctamente.',
        [{ text: '¡Genial!', onPress: () => navigation.goBack() }],
      );

    } catch (e) {
      if (__DEV__) { console.log('[EDIT_STORE] Error:', e); }
      setLoading(false);
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    }
  };

  return (
    <View style={[es.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={es.header}>
        <TouchableOpacity style={es.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={es.headerTitle}>Perfil de tienda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">

        {/* ── LOGO ── */}
        <View style={es.card}>
          <Text style={es.cardTitle}>Logo de tu tienda</Text>
          <TouchableOpacity style={es.logoWrap} onPress={pickLogo} activeOpacity={0.8}>
            {logoUri ? (
              <>
                <Image source={{ uri: logoUri }} style={es.logoImg} />
                <View style={es.logoEditBadge}>
                  <Pencil size={13} color={COLORS.black} strokeWidth={2.5} />
                </View>
              </>
            ) : (
              <View style={es.logoPlaceholder}>
                <Store size={32} color={COLORS.gold} strokeWidth={1.8} />
                <Text style={es.logoHint}>Toca para subir logo</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={es.changeLogoBtn} onPress={pickLogo}>
            <Text style={es.changeLogoBtnTxt}>
              {logoUri ? 'Cambiar logo' : 'Agregar logo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── DATOS ── */}
        <View style={es.card}>
          <Text style={es.cardTitle}>Datos de tu tienda</Text>

          <View style={es.field}>
            <Text style={es.label}>Nombre de la tienda *</Text>
            <View style={[es.inputWrap, errors.storeName && es.inputError]}>
              <TextInput
                style={es.input}
                placeholder="Ej: TechStore Lima"
                placeholderTextColor={COLORS.gray400}
                value={storeName}
                onChangeText={t => { setStoreName(t); setErrors(e => ({ ...e, storeName: '' })); }}
                autoCapitalize="words"
              />
            </View>
            {errors.storeName ? <Text style={es.errorTxt}>{errors.storeName}</Text> : null}
          </View>

          <View style={es.field}>
            <Text style={es.label}>Descripción *</Text>
            <View style={[es.inputWrap, errors.description && es.inputError, { minHeight: 80 }]}>
              <TextInput
                style={[es.input, { textAlignVertical: 'top' }]}
                placeholder="Cuéntanos qué vendes..."
                placeholderTextColor={COLORS.gray400}
                value={description}
                onChangeText={t => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
                multiline
                numberOfLines={3}
              />
            </View>
            {errors.description ? <Text style={es.errorTxt}>{errors.description}</Text> : null}
          </View>

          <View style={es.field}>
            <Text style={es.label}>Ubicación</Text>
            <View style={es.inputWrap}>
              <TextInput
                style={es.input}
                placeholder="Ej: Miraflores, Lima"
                placeholderTextColor={COLORS.gray400}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={es.field}>
            <Text style={es.label}>
              Teléfono <Text style={es.optional}>(opcional)</Text>
            </Text>
            <View style={es.inputWrap}>
              <TextInput
                style={es.input}
                placeholder="+51 999 999 999"
                placeholderTextColor={COLORS.gray400}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* ── CATEGORÍA ── */}
        <View style={es.card}>
          <Text style={es.cardTitle}>Categoría principal *</Text>
          {errors.category ? <Text style={es.errorTxt}>{errors.category}</Text> : null}
          <View style={es.catsGrid}>
            {CATEGORIES.map(cat => {
              const Icon = getCategoryIcon(cat.id);
              const active = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[es.catBtn, active && es.catBtnActive]}
                  onPress={() => { setCategory(cat.id); setErrors(e => ({ ...e, category: '' })); }}
                  activeOpacity={0.8}>
                  <Icon size={24} color={active ? COLORS.gold : COLORS.gray400} strokeWidth={1.8} />
                  <Text style={[es.catLabel, active && es.catLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── ZONA PELIGROSA ── */}
        <View style={es.dangerCard}>
          <View style={es.dangerTitleRow}>
            <AlertTriangle size={16} color={COLORS.red} strokeWidth={2} />
            <Text style={es.dangerTitle}>Zona peligrosa</Text>
          </View>
          <TouchableOpacity
            style={es.dangerBtn}
            onPress={() => {
              Alert.alert(
                'Desactivar tienda',
                '¿Seguro que quieres desactivar tu tienda? Tus productos no serán visibles para los compradores.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Desactivar',
                    style: 'destructive',
                    onPress: async () => {
                      await supabase
                        .from('products')
                        .update({ is_active: false })
                        .eq('seller_id', seller.id);
                      Alert.alert('Tienda desactivada', 'Tus productos ya no son visibles.');
                      navigation.goBack();
                    },
                  },
                ],
              );
            }}>
            <Power size={15} color={COLORS.red} strokeWidth={2} />
            <Text style={es.dangerBtnTxt}>Desactivar todos mis productos</Text>
          </TouchableOpacity>
        </View>

        {/* ── BOTÓN GUARDAR ── */}
        <TouchableOpacity
          style={[es.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.black} size="small" />
              <Text style={es.saveBtnTxt}>Guardando...</Text>
            </View>
          ) : (
            <Text style={es.saveBtnTxt}>Guardar cambios →</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const es = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.black },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:         { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  card:            { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  cardTitle:       { fontSize: 15, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.md },
  logoWrap:        { alignItems: 'center', marginBottom: SPACING.sm, position: 'relative' },
  logoImg:         { width: 120, height: 120, borderRadius: RADIUS.xl },
  logoEditBadge:   { position: 'absolute', bottom: 0, right: '35%', backgroundColor: COLORS.gold, borderRadius: RADIUS.full, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  logoPlaceholder: { width: 120, height: 120, borderRadius: RADIUS.xl, backgroundColor: COLORS.gold + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.gold, borderStyle: 'dashed', gap: 6 },
  logoHint:        { fontSize: 11, color: COLORS.gold, fontWeight: FONT.semibold, textAlign: 'center' },
  changeLogoBtn:   { alignSelf: 'center', marginTop: 8 },
  changeLogoBtnTxt:{ fontSize: 13, color: COLORS.gold, fontWeight: FONT.bold },
  field:           { marginBottom: SPACING.md },
  label:           { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray400, marginBottom: 6 },
  optional:        { fontWeight: FONT.regular, color: COLORS.gray400 },
  inputWrap:       { borderWidth: 1.5, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, backgroundColor: COLORS.black },
  inputError:      { borderColor: COLORS.red },
  input:           { fontSize: 14, color: COLORS.white, padding: 0 },
  errorTxt:        { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  catsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACING.sm },
  catBtn:          { width: '30%', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.gray800, gap: 6 },
  catBtnActive:    { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '15' },
  catLabel:        { fontSize: 11, fontWeight: FONT.bold, color: COLORS.gray400, textAlign: 'center' },
  catLabelActive:  { color: COLORS.gold },
  dangerCard:      { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  dangerTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
  dangerTitle:     { fontSize: 14, fontWeight: FONT.black, color: COLORS.red },
  dangerBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.lg, paddingVertical: 12 },
  dangerBtnTxt:    { fontSize: 14, fontWeight: FONT.bold, color: COLORS.red },
  saveBtn:         { backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center' },
  saveBtnTxt:      { color: COLORS.black, fontSize: 15, fontWeight: FONT.black },
});