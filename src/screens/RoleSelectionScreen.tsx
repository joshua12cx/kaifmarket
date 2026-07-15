// src/screens/RoleSelectionScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Store, Truck, ChevronRight, Clock } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { supabase } from '../lib/supabase';

// ── Tipos de estado por rol ──────────────────────────────────────
type RoleStatus = 'none' | 'pending' | 'approved' | 'rejected';

// Le dice al AppNavigator qué EXPERIENCIA completa mostrar — no un
// destino dentro del stack de comprador, sino un modo aparte con su
// propia barra de tabs (comprador vs vendedor tienen tabs distintos).
export type EntryIntent =
  | { mode: 'buyer' }
  | { mode: 'seller'; sellerScreen?: 'panel' | 'register' | 'status' }
  | { mode: 'motorizado'; motorizadoScreen?: 'panel' | 'register' | 'status' };

type Props = { onContinue: (intent: EntryIntent) => void };

const ROLES_META = {
  seller: {
    icon: Store,
    title: 'Vendedor',
    color: COLORS.gold,
    tint: 'rgba(229,166,35,0.08)',
    border: 'rgba(229,166,35,0.35)',
    desc: 'Crea tu tienda y vende en KaifMarket. El administrador debe aprobar tu solicitud antes de activar el acceso.',
  },
  motorizado: {
    icon: Truck,
    title: 'Transportista',
    color: COLORS.green,
    tint: 'rgba(21,128,61,0.08)',
    border: 'rgba(21,128,61,0.35)',
    desc: 'Entrega pedidos y gana dinero repartiendo. Verificación de documentos requerida antes de la activación.',
  },
};

export default function RoleSelectionScreen({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sellerStatus, setSellerStatus] = useState<RoleStatus>('none');
  const [motorizadoStatus, setMotorizadoStatus] = useState<RoleStatus>('none');

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, status')
          .eq('user_id', user.id)
          .in('role', ['seller', 'motorizado']);

        if (!error && data) {
          const seller = data.find((r: { role: string; status: string }) => r.role === 'seller');
          const moto   = data.find((r: { role: string; status: string }) => r.role === 'motorizado');
          setSellerStatus((seller?.status as RoleStatus) || 'none');
          setMotorizadoStatus((moto?.status as RoleStatus) || 'none');
        }
      } catch (e) {
        if (__DEV__) { console.log('[ROLE_SELECT] fetch error:', e); }
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();
  }, [user?.id]);

  // ── Comprador — siempre acceso inmediato ──────────────────────
  const handleBuyer = () => onContinue({ mode: 'buyer' });

  // ── Vendedor / Transportista — según status real ──────────────
  const handleRole = (role: 'seller' | 'motorizado') => {
    const status = role === 'seller' ? sellerStatus : motorizadoStatus;
    const modeKey = role === 'seller' ? 'seller' as const : 'motorizado' as const;
    const screenKey = role === 'seller' ? 'sellerScreen' as const : 'motorizadoScreen' as const;

    switch (status) {
      case 'approved':
        onContinue({ mode: modeKey, [screenKey]: 'panel' } as EntryIntent);
        return;
      case 'pending':
        onContinue({ mode: modeKey, [screenKey]: 'status' } as EntryIntent);
        return;
      case 'rejected':
        onContinue({ mode: modeKey, [screenKey]: 'register' } as EntryIntent);
        return;
      default: // 'none'
        onContinue({ mode: modeKey, [screenKey]: 'register' } as EntryIntent);
        return;
    }
  };

  const renderRoleCard = (role: 'seller' | 'motorizado') => {
    const meta   = ROLES_META[role];
    const status = role === 'seller' ? sellerStatus : motorizadoStatus;
    const Icon   = meta.icon;

    let badgeText = 'REQUIERE APROBACIÓN';
    let ctaText   = `Solicitar como ${meta.title}`;
    let CtaIcon   = meta.icon;
    let dimmed    = false;

    if (status === 'pending') {
      badgeText = 'EN REVISIÓN';
      ctaText   = 'Esperando aprobación';
      CtaIcon   = Clock;
      dimmed    = true;
    } else if (status === 'approved') {
      badgeText = 'ACCESO ACTIVO';
      ctaText   = `Empezar a ${role === 'seller' ? 'vender' : 'repartir'}`;
    } else if (status === 'rejected') {
      badgeText = 'RECHAZADA — REINTENTAR';
      ctaText   = 'Volver a intentar';
    }

    return (
      <TouchableOpacity
        key={role}
        style={[sx.card, { backgroundColor: meta.tint, borderColor: meta.border }, dimmed && { opacity: 0.7 }]}
        onPress={() => handleRole(role)}
        activeOpacity={0.85}>
        <View style={sx.cardTop}>
          <View style={[sx.iconWrap, { backgroundColor: meta.color + '22' }]}>
            <Icon size={22} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sx.cardTitle}>{meta.title}</Text>
            <Text style={[sx.cardBadge, { color: meta.color }]}>{badgeText}</Text>
          </View>
          <ChevronRight size={20} color={COLORS.gray400} />
        </View>

        <Text style={sx.cardDesc}>{meta.desc}</Text>

        <View style={[sx.ctaBtn, { backgroundColor: meta.color }]}>
          <CtaIcon size={16} color={COLORS.white} />
          <Text style={sx.ctaTxt}>{ctaText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[sx.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={sx.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView
        contentContainerStyle={[sx.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>

        <View style={sx.header}>
          <Image source={require('../assets/logo-horizontal.png')} style={sx.logo} resizeMode="contain" />
        </View>

        <Text style={sx.title}>¿Cómo quieres usar{'\n'}KaifMarket?</Text>
        <Text style={sx.subtitle}>Elige la experiencia que mejor se adapte a ti.</Text>

        {/* ── COMPRADOR — siempre igual ── */}
        <TouchableOpacity
          style={[sx.card, { backgroundColor: 'rgba(211,43,43,0.08)', borderColor: 'rgba(211,43,43,0.35)' }]}
          onPress={handleBuyer}
          activeOpacity={0.85}>
          <View style={sx.cardTop}>
            <View style={[sx.iconWrap, { backgroundColor: COLORS.primary + '22' }]}>
              <ShoppingBag size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sx.cardTitle}>Comprador</Text>
              <Text style={[sx.cardBadge, { color: COLORS.primary }]}>ACCESO INMEDIATO</Text>
            </View>
            <ChevronRight size={20} color={COLORS.gray400} />
          </View>
          <Text style={sx.cardDesc}>
            Explora miles de productos verificados de todo el Perú. Sin aprobación requerida — acceso inmediato.
          </Text>
          <View style={[sx.ctaBtn, { backgroundColor: COLORS.primary }]}>
            <ShoppingBag size={16} color={COLORS.white} />
            <Text style={sx.ctaTxt}>Empezar a Comprar</Text>
          </View>
        </TouchableOpacity>

        {renderRoleCard('seller')}
        {renderRoleCard('motorizado')}
      </ScrollView>
    </View>
  );
}

const sx = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { paddingHorizontal: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.sm },
  logo: { width: 220, height: 147 },
  title: { fontSize: 24, fontWeight: FONT.black, color: COLORS.white, letterSpacing: -0.3, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, marginBottom: SPACING.xl },
  card: { borderWidth: 1.5, borderRadius: RADIUS.xxl, padding: SPACING.lg, marginBottom: SPACING.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.sm },
  iconWrap: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },
  cardBadge: { fontSize: 11, fontWeight: FONT.black, letterSpacing: 0.4, marginTop: 2 },
  cardDesc: { fontSize: 13, color: COLORS.gray400, lineHeight: 19, marginBottom: SPACING.md },
  ctaBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, paddingVertical: 13 },
  ctaTxt: { color: COLORS.white, fontSize: 14, fontWeight: FONT.black },
});