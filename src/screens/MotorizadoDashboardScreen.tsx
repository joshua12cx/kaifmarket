// src/screens/MotorizadoDashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Truck, Package, MapPin, Star, DollarSign } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { supabase, Motorizado } from '../lib/supabase';

const GREEN = COLORS.green;

// ── HONESTIDAD DE DATOS (mismo principio que el resto de la app) ──
// - "Entregas totales" y "Calificación" son REALES (motorizados.total_deliveries / rating)
// - "Km recorridos" y "Ganancias hoy" muestran "—" porque NO existen
//   todavía en la BD (Km requiere GPS; Ganancias requiere la migración
//   de orders.motorizado_id de la Parte 2). No se inventan números.
// - "Pedidos disponibles" se activa en la Parte 2 tras la migración.

export default function MotorizadoDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [moto, setMoto]               = useState<Motorizado | null>(null);
  const [toggling, setToggling]       = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('motorizados').select('*').eq('user_id', user.id).single();
      setMoto(data as Motorizado);
    } catch (e) {
      if (__DEV__) { console.log('[MOTO_DASH] load error:', e); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // ── Toggle En línea / Fuera de línea — columna real is_online ──
  // Actualización optimista + revert si falla (mismo patrón que
  // toggleVacation en SellerTiendaScreen).
  const toggleOnline = async () => {
    if (!moto || toggling) { return; }
    const next = !moto.is_online;
    setToggling(true);
    setMoto(prev => prev ? { ...prev, is_online: next } : prev);

    const { error } = await supabase
      .from('motorizados').update({ is_online: next }).eq('id', moto.id);

    if (error) {
      if (__DEV__) { console.log('[MOTO_DASH] toggle error:', error); }
      setMoto(prev => prev ? { ...prev, is_online: !next } : prev);
      Alert.alert(
        'Error',
        'No se pudo cambiar tu estado. Si el problema persiste, puede que falte una política RLS de UPDATE sobre is_online en la tabla motorizados.',
      );
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <View style={[d.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={GREEN} size="large" />
      </View>
    );
  }

  const firstName = (moto?.full_name || user?.name || 'Transportista').split(' ')[0];
  const isOnline  = !!moto?.is_online;

  const STATS = [
    { icon: Package,    label: 'Entregas totales', value: String(moto?.total_deliveries ?? 0) },
    { icon: MapPin,     label: 'Km recorridos',    value: '—' }, // TODO BD: no se registra distancia todavía
    { icon: DollarSign, label: 'Ganancias hoy',    value: '—' }, // TODO Parte 2: requiere orders.motorizado_id
    { icon: Star,       label: 'Calificación',     value: `${Number(moto?.rating ?? 5).toFixed(1)}★` },
  ];

  return (
    <View style={[d.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}>

        {/* ── HEADER ── */}
        <View style={d.header}>
          <View>
            <Text style={d.welcome}>¡Hola, {firstName}!</Text>
            <Text style={d.title}>Dashboard 🚚</Text>
          </View>
          <TouchableOpacity
            style={d.bellBtn}
            onPress={() => Alert.alert('Notificaciones', 'Esta sección todavía está en desarrollo.')}>
            <Bell size={18} color={COLORS.white} strokeWidth={2} />
            {isOnline && <View style={d.bellDot} />}
          </TouchableOpacity>
        </View>

        {/* ── TOGGLE EN LÍNEA / FUERA DE LÍNEA ── */}
        <TouchableOpacity
          style={[d.onlineCard, isOnline && d.onlineCardActive]}
          onPress={toggleOnline}
          disabled={toggling}
          activeOpacity={0.85}>
          <View style={d.onlineStatusRow}>
            <View style={[d.onlineDot, { backgroundColor: isOnline ? GREEN : COLORS.gray600 }]} />
            <Text style={[d.onlineStatusTxt, isOnline && { color: GREEN }]}>
              {isOnline ? 'En línea — Buscando pedidos...' : 'Fuera de línea'}
            </Text>
          </View>

          <View style={[d.onlineCircle, isOnline ? d.onlineCircleActive : d.onlineCircleInactive]}>
            {toggling
              ? <ActivityIndicator color={isOnline ? COLORS.white : COLORS.gray400} />
              : <Truck size={34} color={isOnline ? COLORS.white : COLORS.gray400} strokeWidth={2} />}
          </View>

          <Text style={d.onlineHint}>
            {isOnline ? 'Toca para ir fuera de línea' : 'Toca para empezar a recibir pedidos'}
          </Text>
        </TouchableOpacity>

        {/* ── STATS GRID ── */}
        <View style={d.statsGrid}>
          {STATS.map(stat => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={d.statCard}>
                <View style={d.statIconWrap}>
                  <Icon size={15} color={GREEN} strokeWidth={2} />
                </View>
                <Text style={d.statValue}>{stat.value}</Text>
                <Text style={d.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── PEDIDOS DISPONIBLES ── */}
        <View style={d.sectionHeader}>
          <Text style={d.sectionTitle}>Pedidos disponibles 📦</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MotorizadoDeliveriesTab')}>
            <Text style={d.sectionLink}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {/* TODO Parte 2: al correr la migración (orders.motorizado_id),
            aquí se listan los pedidos con status 'shipped' sin motorizado
            asignado, con botón "Aceptar". Por ahora, aviso honesto. */}
        <View style={d.emptyCard}>
          <Package size={28} color={COLORS.gray600} strokeWidth={1.5} />
          <Text style={d.emptyTitle}>
            {isOnline ? 'Sin pedidos disponibles por ahora' : 'Estás fuera de línea'}
          </Text>
          <Text style={d.emptySub}>
            {isOnline
              ? 'La asignación de pedidos estará disponible muy pronto.'
              : 'Ponte en línea para empezar a recibir pedidos.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const d = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.black },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  welcome:     { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },
  title:       { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, marginTop: 2 },
  bellBtn:     { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center' },
  bellDot:     { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, borderWidth: 1.5, borderColor: COLORS.black },

  onlineCard:        { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, paddingVertical: SPACING.xl, alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'transparent' },
  onlineCardActive:  { backgroundColor: '#0F2A18', borderColor: GREEN + '40' },
  onlineStatusRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.lg },
  onlineDot:         { width: 8, height: 8, borderRadius: 4 },
  onlineStatusTxt:   { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray400 },
  onlineCircle:      { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  onlineCircleActive: {
    backgroundColor: GREEN,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  onlineCircleInactive: { backgroundColor: COLORS.gray800 },
  onlineHint:        { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },

  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard:    { width: '48%', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.md },
  statIconWrap:{ width: 28, height: 28, borderRadius: RADIUS.md, backgroundColor: GREEN + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue:   { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },
  statLabel:   { fontSize: 11, color: COLORS.gray400, fontWeight: FONT.semibold, marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle:  { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  sectionLink:   { fontSize: 13, color: GREEN, fontWeight: FONT.bold },

  emptyCard:   { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', gap: 8 },
  emptyTitle:  { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white, textAlign: 'center' },
  emptySub:    { fontSize: 12, color: COLORS.gray400, textAlign: 'center', lineHeight: 18 },
});