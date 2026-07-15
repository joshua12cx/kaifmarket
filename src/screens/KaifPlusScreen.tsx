// src/screens/KaifPlusScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Crown, Wallet, Rocket, Zap, Check,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { supabase } from '../lib/supabase';
import LinearGradient from 'react-native-linear-gradient';

const BENEFITS = [
  { icon: Wallet, title: 'Cashback en cada compra', sub: 'Hasta 5% de retorno automático' },
  { icon: Rocket,  title: 'Envíos gratis',            sub: 'En todos tus pedidos sin mínimo' },
  { icon: Zap,     title: 'Acceso anticipado a ventas', sub: '24h antes que todos' },
  { icon: Crown,   title: 'Soporte VIP prioritario',  sub: 'Respuesta en menos de 1 hora' },
];

const PRICE_MONTHLY = 29;
const PRICE_YEARLY  = Math.round(PRICE_MONTHLY * 12 * 0.8); // -20%

export default function KaifPlusScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [billing, setBilling] = useState<'mensual' | 'anual'>('mensual');
  const isPlus = !!user?.is_plus;

  const handleSubscribe = () => {
    Alert.alert(
      'Pago pendiente de integrar',
      'La pasarela de pagos todavía no está conectada en la app. Cuando esté lista, aquí podrás suscribirte.',
    );
  };

  const handleCancel = () => {
    Alert.alert('¿Cancelar Kaif Plus?', 'Perderás el cashback, envíos gratis y demás beneficios.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          if (!user) { return; }
          const { error } = await supabase.from('users').update({ is_plus: false }).eq('id', user.id);
          if (!error) { updateUser({ is_plus: false }); }
          else { Alert.alert('Error', 'No se pudo cancelar. Intenta de nuevo.'); }
        },
      },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kaif Plus</Text>
        {isPlus ? (
          <View style={s.premiumBadge}><Text style={s.premiumBadgeTxt}>PREMIUM</Text></View>
        ) : <View style={{ width: 36 }} />}
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── TARJETA MEMBRESÍA ── */}
        <LinearGradient
          colors={['#E5A623', '#6B4E0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.card}>
          <View style={s.cardTopRow}>
            <View style={s.cardBadge}>
              <Crown size={12} color={COLORS.black} strokeWidth={2.5} />
              <Text style={s.cardBadgeTxt}>KAIF PLUS</Text>
            </View>
          </View>
          <Text style={s.cardName}>{user?.name || 'Usuario'}</Text>
          <Text style={s.cardSub}>{isPlus ? 'Miembro Premium' : 'Aún no eres miembro'}</Text>

          {/* Kaif Points — TODO en BD: no existe columna de puntos
              todavía (ej. users.plus_points). Muestro 0 honestamente
              en vez de inventar un número. */}
          <View style={s.pointsRow}>
            <Text style={s.pointsLabel}>Kaif Points</Text>
            <Text style={s.pointsVal}>0 / 5,000</Text>
          </View>
          <View style={s.pointsBarBg}>
            <View style={[s.pointsBarFill, { width: '0%' }]} />
          </View>

          <View style={s.tagsRow}>
            {['Cashback activo', '3x Points', 'VIP', 'Envíos gratis'].map(tag => (
              <View key={tag} style={s.tag}><Text style={s.tagTxt}>{tag}</Text></View>
            ))}
          </View>
        </LinearGradient>

        {/* ── TOGGLE MENSUAL/ANUAL ── */}
        {!isPlus && (
          <View style={s.billingRow}>
            <TouchableOpacity
              style={[s.billingBtn, billing === 'mensual' && s.billingBtnActive]}
              onPress={() => setBilling('mensual')}>
              <Text style={[s.billingTxt, billing === 'mensual' && s.billingTxtActive]}>Mensual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.billingBtn, billing === 'anual' && s.billingBtnActive]}
              onPress={() => setBilling('anual')}>
              <Text style={[s.billingTxt, billing === 'anual' && s.billingTxtActive]}>Anual</Text>
              <View style={s.discBadge}><Text style={s.discBadgeTxt}>-20%</Text></View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── PRECIO ── */}
        {!isPlus && (
          <View style={s.priceCard}>
            <Text style={s.priceVal}>
              S/ {billing === 'mensual' ? PRICE_MONTHLY : PRICE_YEARLY}
              <Text style={s.priceUnit}>/{billing === 'mensual' ? 'mes' : 'año'}</Text>
            </Text>
          </View>
        )}

        {/* ── BENEFICIOS ── */}
        <Text style={s.sectionTitle}>Beneficios incluidos</Text>
        {BENEFITS.map(b => {
          const Icon = b.icon;
          return (
            <View key={b.title} style={s.benefitRow}>
              <View style={s.benefitIconWrap}><Icon size={18} color={COLORS.gold} strokeWidth={2} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitSub}>{b.sub}</Text>
              </View>
              <Check size={18} color={COLORS.gold} strokeWidth={2.5} />
            </View>
          );
        })}

        {isPlus ? (
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={s.cancelBtnTxt}>Cancelar membresía</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.subscribeBtn} onPress={handleSubscribe} activeOpacity={0.85}>
            <Text style={s.subscribeBtnTxt}>Unirme a Kaif Plus</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  premiumBadge: { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  premiumBadgeTxt: { fontSize: 10, fontWeight: FONT.black, color: COLORS.black },

  card:         { borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  cardTopRow:   { flexDirection: 'row', marginBottom: SPACING.sm },
  cardBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  cardBadgeTxt: { fontSize: 10, fontWeight: FONT.black, color: COLORS.black },
  cardName:     { fontSize: 20, fontWeight: FONT.black, color: COLORS.white },
  cardSub:      { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: SPACING.md },
  pointsRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pointsLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  pointsVal:    { fontSize: 12, fontWeight: FONT.black, color: COLORS.white },
  pointsBarBg:  { height: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, marginBottom: SPACING.md, overflow: 'hidden' },
  pointsBarFill:{ height: '100%', backgroundColor: COLORS.white, borderRadius: 3 },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:          { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  tagTxt:       { fontSize: 10, fontWeight: FONT.bold, color: COLORS.white },

  billingRow:   { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  billingBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, paddingVertical: 14 },
  billingBtnActive: { backgroundColor: COLORS.gold },
  billingTxt:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray400 },
  billingTxtActive: { color: COLORS.black },
  discBadge:    { backgroundColor: COLORS.green, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discBadgeTxt: { fontSize: 9, fontWeight: FONT.black, color: COLORS.white },

  priceCard:    { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
  priceVal:     { fontSize: 30, fontWeight: FONT.black, color: COLORS.gold },
  priceUnit:    { fontSize: 15, fontWeight: FONT.bold, color: COLORS.gray400 },

  sectionTitle: { fontSize: 15, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.md },
  benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  benefitIconWrap: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.gold + '1A', alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white },
  benefitSub:   { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  subscribeBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.sm },
  subscribeBtnTxt: { fontSize: 15, fontWeight: FONT.black, color: COLORS.black },
  cancelBtn:    { borderWidth: 1.5, borderColor: COLORS.red, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.sm },
  cancelBtnTxt: { fontSize: 15, fontWeight: FONT.black, color: COLORS.red },
});