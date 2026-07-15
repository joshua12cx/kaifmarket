// src/screens/SellerPlusScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Trophy, ArrowUp, BarChart3, Award, Target, Rocket, Check,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase, Seller } from '../lib/supabase';
import { useAuth } from '../context';
import LinearGradient from 'react-native-linear-gradient';

// Beneficios fijos del plan — no vienen de la base de datos, son
// contenido estático del plan Kaif Plus Seller.
const BENEFITS = [
  { icon: Trophy,    title: 'Badge Vendedor Verificado Premium', sub: 'Mayor confianza y más ventas' },
  { icon: ArrowUp,   title: 'Mayor posicionamiento en búsquedas', sub: 'Aparece primero que otros vendedores' },
  { icon: BarChart3, title: 'Analytics avanzado',                sub: 'Reportes detallados de conversión' },
  { icon: Award,     title: 'Comisión reducida',                 sub: 'Paga menos comisión al marketplace' },
  { icon: Target,    title: 'Créditos publicitarios',             sub: 'S/ 100 en ads cada mes' },
  { icon: Rocket,    title: 'Soporte prioritario',                sub: 'Atención dedicada en menos de 30 min' },
];

const PRICE_MONTHLY = 49;
const PRICE_YEARLY  = 470; // ahorro vs 49*12 = 588

export default function SellerPlusScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [seller, setSeller]   = useState<Seller | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase.from('sellers').select('*').eq('user_id', user.id).single();
    setSeller(data as Seller);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleSubscribe = () => {
    Alert.alert(
      'Pago pendiente de integrar',
      'La pasarela de pagos (Yape/Plin/tarjeta) todavía no está conectada en la app. Cuando esté lista, aquí podrás suscribirte por S/ 49/mes.',
    );
  };

  const handleCancel = () => {
    Alert.alert(
      '¿Cancelar tu membresía Plus?',
      'Perderás el badge premium, la comisión reducida y los créditos publicitarios al final de tu periodo actual.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar', style: 'destructive',
          onPress: async () => {
            if (!seller) { return; }
            const { error } = await supabase.from('sellers').update({ is_premium: false }).eq('id', seller.id);
            if (!error) { setSeller(prev => prev ? { ...prev, is_premium: false } : prev); }
            else { Alert.alert('Error', 'No se pudo cancelar. Intenta de nuevo.'); }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[p.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  const isPremium = !!seller?.is_premium;

  return (
    <View style={[p.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* ── HEADER ── */}
      <View style={p.header}>
        <TouchableOpacity style={p.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={p.headerTitle}>Kaif Plus Seller</Text>
        {isPremium ? (
          <View style={p.premiumBadge}><Text style={p.premiumBadgeTxt}>PREMIUM</Text></View>
        ) : <View style={{ width: 36 }} />}
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── TARJETA PRINCIPAL ── */}
        <LinearGradient
          colors={['#E5A623', '#6B4E0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={p.mainCard}>
          <View style={p.mainCardTop}>
            <Text style={{ fontSize: 26 }}>🏆</Text>
            <View>
              <Text style={p.mainCardTitle}>Kaif Plus Seller</Text>
              <Text style={p.mainCardSub}>
                {seller?.name || 'Mi Tienda'} · {isPremium ? 'Nivel Premium' : 'Aún no eres Premium'}
              </Text>
            </View>
          </View>

          <View style={p.statsRow}>
            <View style={p.statPill}>
              <Text style={p.statVal}>-3%</Text>
              <Text style={p.statLbl}>Comisión</Text>
            </View>
            <View style={p.statPill}>
              <Text style={p.statVal}>1°</Text>
              <Text style={p.statLbl}>Posición</Text>
            </View>
            <View style={p.statPill}>
              <Text style={p.statVal}>S/100</Text>
              <Text style={p.statLbl}>Ads/mes</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── PRECIO ── */}
        <View style={p.priceCard}>
          <Text style={p.priceVal}>
            S/ {PRICE_MONTHLY}<Text style={p.priceUnit}>/mes</Text>
          </Text>
          <Text style={p.priceSub}>
            O S/ {PRICE_YEARLY}/año · Ahorra S/ {PRICE_MONTHLY * 12 - PRICE_YEARLY}
          </Text>
        </View>

        {/* ── BENEFICIOS ── */}
        {BENEFITS.map(b => {
          const Icon = b.icon;
          return (
            <View key={b.title} style={p.benefitRow}>
              <View style={p.benefitIconWrap}>
                <Icon size={18} color={COLORS.gold} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={p.benefitTitle}>{b.title}</Text>
                <Text style={p.benefitSub}>{b.sub}</Text>
              </View>
              <Check size={18} color={COLORS.gold} strokeWidth={2.5} />
            </View>
          );
        })}

        {/* ── CTA ── */}
        {isPremium ? (
          <TouchableOpacity style={p.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={p.cancelBtnTxt}>Cancelar membresía</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={p.subscribeBtn} onPress={handleSubscribe} activeOpacity={0.85}>
            <Text style={p.subscribeBtnTxt}>Suscribirme por S/ {PRICE_MONTHLY}/mes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const p = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.black },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:        { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  premiumBadge:   { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  premiumBadgeTxt:{ fontSize: 10, fontWeight: FONT.black, color: COLORS.black },

  mainCard:       { borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  mainCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.lg },
  mainCardTitle:  { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  mainCardSub:    { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  statsRow:       { flexDirection: 'row', gap: 10 },
  statPill:       { flex: 1, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.lg, paddingVertical: SPACING.sm },
  statVal:        { fontSize: 15, fontWeight: FONT.black, color: COLORS.white },
  statLbl:        { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  priceCard:      { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
  priceVal:       { fontSize: 30, fontWeight: FONT.black, color: COLORS.gold },
  priceUnit:      { fontSize: 15, fontWeight: FONT.bold, color: COLORS.gray400 },
  priceSub:       { fontSize: 12, color: COLORS.green, marginTop: 4, fontWeight: FONT.semibold },

  benefitRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  benefitIconWrap:{ width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.gold + '1A', alignItems: 'center', justifyContent: 'center' },
  benefitTitle:   { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white },
  benefitSub:     { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  subscribeBtn:   { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.sm },
  subscribeBtnTxt:{ fontSize: 15, fontWeight: FONT.black, color: COLORS.black },
  cancelBtn:      { borderWidth: 1.5, borderColor: COLORS.red, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.sm },
  cancelBtnTxt:   { fontSize: 15, fontWeight: FONT.black, color: COLORS.red },
});