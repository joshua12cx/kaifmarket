// src/screens/ComplaintsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Alert, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { ChevronLeft, Paperclip, Check } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { id: 'no_recibido',             label: 'Producto no recibido' },
  { id: 'defectuoso',              label: 'Producto defectuoso' },
  { id: 'cobro_incorrecto',        label: 'Cobro incorrecto' },
  { id: 'vendedor_irresponsable',  label: 'Vendedor irresponsable' },
  { id: 'entrega_tardia',          label: 'Entrega tardía' },
  { id: 'otro',                    label: 'Otro' },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  proceso:   { label: 'PROCESO',   color: COLORS.gold },
  resuelto:  { label: 'RESUELTO',  color: COLORS.green },
  rechazado: { label: 'RECHAZADO', color: COLORS.red },
};

// Ancho de cada mitad de la píldora del toggle — se calcula del
// ancho real de pantalla menos el padding horizontal (SPACING.lg*2).
const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - 8) / 2; // -8 = padding interno de la píldora

export default function ComplaintsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<'nueva' | 'historial'>('nueva');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const changeTab = (next: 'nueva' | 'historial') => {
    setTab(next);
    Animated.spring(slideAnim, {
      toValue: next === 'nueva' ? 0 : 1,
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  };

  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id) { return; }
    setLoadingHist(true);
    const { data } = await supabase
      .from('complaints').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setComplaints(data || []);
    setLoadingHist(false);
  }, [user?.id]);

  useEffect(() => { if (tab === 'historial') { loadHistory(); } }, [tab, loadHistory]);

  const pickEvidence = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets?.[0]?.uri) { setEvidenceUri(result.assets[0].uri); }
  };

  const uploadEvidence = async (uri: string): Promise<string | null> => {
    try {
      const cleanUri = uri.replace('file://', '');
      const base64 = await RNFS.readFile(cleanUri, 'base64');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) { lookup[chars.charCodeAt(i)] = i; }
      const b64 = base64.replace(/=/g, '');
      const len = b64.length;
      const bytes = new Uint8Array(Math.floor((len * 3) / 4));
      let j = 0;
      for (let i = 0; i < len; i += 4) {
        const a = lookup[b64.charCodeAt(i)], b = lookup[b64.charCodeAt(i + 1)];
        const c = lookup[b64.charCodeAt(i + 2)], d = lookup[b64.charCodeAt(i + 3)];
        bytes[j++] = (a << 2) | (b >> 4);
        if (i + 2 < len) { bytes[j++] = ((b & 15) << 4) | (c >> 2); }
        if (i + 3 < len) { bytes[j++] = ((c & 3) << 6) | d; }
      }
      const fileName = `complaint_${user?.id}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('complaints').upload(fileName, bytes, { contentType: 'image/jpeg' });
      if (error) { return null; }
      const { data } = supabase.storage.from('complaints').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      if (__DEV__) { console.log('[COMPLAINTS] upload error:', e); }
      return null;
    }
  };

  const submit = async () => {
    if (!category || !description.trim() || !user?.id) { return; }
    setSubmitting(true);
    let evidenceUrl: string | null = null;
    if (evidenceUri) { evidenceUrl = await uploadEvidence(evidenceUri); }

    const { error } = await supabase.from('complaints').insert({
      user_id: user.id,
      category,
      description: description.trim(),
      evidence_url: evidenceUrl,
    });
    setSubmitting(false);

    if (error) { Alert.alert('Error', 'No se pudo enviar la reclamación. Intenta de nuevo.'); return; }

    Alert.alert(
      '✅ Reclamación enviada',
      'KaifMarket te responderá en un plazo máximo de 15 días hábiles.',
      [{ text: 'Entendido', onPress: () => { setCategory(null); setDescription(''); setEvidenceUri(null); setTab('historial'); } }],
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Libro de Reclamaciones</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.tabsRow}>
        <Animated.View
          style={[
            s.tabsSlider,
            {
              transform: [{
                translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, TAB_WIDTH] }),
              }],
            },
          ]}
        />
        <TouchableOpacity style={s.tabBtn} onPress={() => changeTab('nueva')} activeOpacity={0.8}>
          <Text style={[s.tabTxt, tab === 'nueva' && s.tabTxtActive]}>Nueva queja</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabBtn} onPress={() => changeTab('historial')} activeOpacity={0.8}>
          <Text style={[s.tabTxt, tab === 'historial' && s.tabTxtActive]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {tab === 'nueva' ? (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Categoría de la queja</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catBtn, category === cat.id && s.catBtnActive]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.8}>
                  <Text style={[s.catTxt, category === cat.id && s.catTxtActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Descripción detallada</Text>
            <TextInput
              style={s.textarea}
              placeholder="Describe lo ocurrido con el mayor detalle posible..."
              placeholderTextColor={COLORS.gray600}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={s.evidenceRow} onPress={pickEvidence} activeOpacity={0.8}>
            <View style={s.evidenceIconWrap}>
              {evidenceUri
                ? <Check size={16} color={COLORS.green} strokeWidth={2.5} />
                : <Paperclip size={16} color={COLORS.gold} strokeWidth={2} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.evidenceTitle}>Adjuntar evidencia</Text>
              <Text style={s.evidenceSub}>
                {evidenceUri ? 'Foto adjunta ✓ — toca para cambiar' : 'Fotos, capturas o documentos (máx. 10MB)'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.submitBtn, (!category || !description.trim()) && { opacity: 0.5 }]}
            disabled={!category || !description.trim() || submitting}
            onPress={submit}
            activeOpacity={0.85}>
            {submitting
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={s.submitBtnTxt}>Enviar reclamación</Text>}
          </TouchableOpacity>

          <Text style={s.legalTxt}>
            Al presentar esta reclamación certificas que la información proporcionada es veraz.
            KaifMarket responderá en un plazo máximo de 15 días hábiles conforme a la Ley N° 29571 del Consumidor.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {loadingHist ? (
            <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
          ) : complaints.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTxt}>Aún no has presentado ninguna reclamación</Text>
            </View>
          ) : (
            complaints.map(c => {
              const meta = STATUS_META[c.status] || STATUS_META.proceso;
              const catLabel = CATEGORIES.find(cat => cat.id === c.category)?.label || c.category;
              return (
                <View key={c.id} style={s.histCard}>
                  <View style={s.histTop}>
                    <Text style={s.histId}>#QR-{c.id.substring(0, 4).toUpperCase()}</Text>
                    <View style={[s.histBadge, { backgroundColor: meta.color + '22' }]}>
                      <Text style={[s.histBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>
                  <Text style={s.histCat}>{catLabel}</Text>
                  <Text style={s.histDate}>
                    Presentada el {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                  {c.admin_response && (
                    <View style={s.responseTag}>
                      <Check size={12} color={COLORS.green} strokeWidth={2.5} />
                      <Text style={s.responseTagTxt}>Respuesta del administrador disponible</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },

  tabsRow:      { flexDirection: 'row', position: 'relative', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, padding: 4, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  tabsSlider:   { position: 'absolute', top: 4, left: 4, bottom: 4, width: TAB_WIDTH, backgroundColor: COLORS.red, borderRadius: RADIUS.full },
  tabBtn:       { flex: 1, alignItems: 'center', paddingVertical: 10, zIndex: 1 },
  tabTxt:       { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray400 },
  tabTxtActive: { color: COLORS.white },

  card:         { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  cardTitle:    { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white, marginBottom: SPACING.md },
  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:       { width: '48%', borderWidth: 1.5, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  catBtnActive: { borderColor: COLORS.red, backgroundColor: COLORS.red + '15' },
  catTxt:       { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold, textAlign: 'center' },
  catTxtActive: { color: COLORS.red },

  textarea:     { backgroundColor: COLORS.black, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.gray800, padding: SPACING.md, color: COLORS.white, fontSize: 13, minHeight: 110 },

  evidenceRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  evidenceIconWrap: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.gold + '1A', alignItems: 'center', justifyContent: 'center' },
  evidenceTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white },
  evidenceSub:   { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  submitBtn:    { backgroundColor: COLORS.gray800, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center', marginBottom: SPACING.md },
  submitBtnTxt: { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
  legalTxt:     { fontSize: 10, color: COLORS.gray600, lineHeight: 16, textAlign: 'center' },

  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyTxt:     { fontSize: 13, color: COLORS.gray400 },

  histCard:     { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  histTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  histId:       { fontSize: 12, fontWeight: FONT.black, color: COLORS.red },
  histBadge:    { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  histBadgeTxt: { fontSize: 9, fontWeight: FONT.black },
  histCat:      { fontSize: 15, fontWeight: FONT.bold, color: COLORS.white, marginBottom: 4 },
  histDate:     { fontSize: 11, color: COLORS.gray400 },
  responseTag:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.green + '15', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 6, marginTop: SPACING.sm, alignSelf: 'flex-start' },
  responseTagTxt: { fontSize: 11, color: COLORS.green, fontWeight: FONT.bold },
});