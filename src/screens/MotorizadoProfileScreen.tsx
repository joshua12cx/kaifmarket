// src/screens/MotorizadoProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Truck, DollarSign, Settings, Users, LogOut, ChevronRight, Star,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase, Motorizado } from '../lib/supabase';
import { useAuth } from '../context';
import { useAppMode } from '../navigation/AppNavigator';

const GREEN = COLORS.green;

export default function MotorizadoProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { resetToRoleSelection } = useAppMode();

  const [loading, setLoading] = useState(true);
  const [moto, setMoto]       = useState<Motorizado | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from('motorizados').select('*').eq('user_id', user.id).single();
    setMoto(data as Motorizado);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const stub = (title: string) => Alert.alert(title, 'Esta sección todavía está en desarrollo.');

  const handleChangeRole = () => {
    Alert.alert(
      'Cambiar de rol',
      '¿Quieres volver a la pantalla donde eliges cómo usar KaifMarket?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, cambiar', onPress: resetToRoleSelection },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      // No hace falta navegar a mano: AppNavigator detecta
      // isAuthenticated=false y vuelve solo al login.
    ]);
  };

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={GREEN} size="large" />
      </View>
    );
  }

  const initials   = (moto?.full_name || user?.name || 'T').charAt(0).toUpperCase();
  const deliveries = moto?.total_deliveries ?? 0;

  const MENU = [
    {
      icon: Truck, title: 'Mis Entregas', color: GREEN,
      sub: `${deliveries} completada${deliveries === 1 ? '' : 's'}`,
      onPress: () => navigation.navigate('MotorizadoDeliveriesTab'),
    },
    {
      icon: DollarSign, title: 'Ganancias', color: COLORS.gold,
      // TODO Parte 2/3: el total real requiere orders.motorizado_id —
      // no se inventa un monto mientras tanto.
      sub: 'Historial de tus entregas',
      onPress: () => navigation.navigate('MotorizadoEarningsTab'),
    },
    {
      icon: Settings, title: 'Configuración', color: COLORS.gray400,
      sub: 'Idioma, preferencias',
      onPress: () => stub('Configuración'),
    },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        <Text style={s.headerTitle}>Mi Perfil</Text>

        {/* ── CARD PRINCIPAL ── */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{moto?.full_name || user?.name || 'Transportista'}</Text>
            <Text style={s.email}>{user?.email}</Text>
            <View style={s.ratingRow}>
              <Star size={12} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
              <Text style={s.ratingTxt}>{Number(moto?.rating ?? 5).toFixed(1)}</Text>
              <Text style={s.ratingSub}>({deliveries} viaje{deliveries === 1 ? '' : 's'})</Text>
            </View>
          </View>
        </View>

        {/* ── MENÚ ── */}
        <View style={s.menuCard}>
          {MENU.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={[s.menuRow, i === MENU.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.onPress}
                activeOpacity={0.7}>
                <View style={[s.menuIconWrap, { backgroundColor: item.color + '22' }]}>
                  <Icon size={17} color={item.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.menuTitle}>{item.title}</Text>
                  <Text style={s.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.gray800} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── CAMBIAR DE ROL — dorado, como en el mockup ── */}
        <TouchableOpacity style={s.changeRoleBtn} onPress={handleChangeRole} activeOpacity={0.85}>
          <Users size={16} color={COLORS.gold} strokeWidth={2} />
          <Text style={s.changeRoleBtnTxt}>Cambiar de rol</Text>
        </TouchableOpacity>

        {/* ── CERRAR SESIÓN ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={16} color={COLORS.red} strokeWidth={2} />
          <Text style={s.logoutBtnTxt}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  headerTitle:  { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.lg },

  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  avatar:       { width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 22, fontWeight: FONT.black, color: COLORS.white },
  name:         { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  email:        { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingTxt:    { fontSize: 12, color: COLORS.gold, fontWeight: FONT.black },
  ratingSub:    { fontSize: 11, color: COLORS.gray400 },

  menuCard:     { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, marginBottom: SPACING.lg, overflow: 'hidden' },
  menuRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  menuIconWrap: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  menuTitle:    { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  menuSub:      { fontSize: 11, color: COLORS.gray400, marginTop: 2 },

  changeRoleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.gold, borderRadius: RADIUS.lg, paddingVertical: 13, marginBottom: SPACING.md },
  changeRoleBtnTxt: { fontSize: 14, fontWeight: FONT.black, color: COLORS.gold },
  logoutBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.red, borderRadius: RADIUS.lg, paddingVertical: 13 },
  logoutBtnTxt:     { fontSize: 14, fontWeight: FONT.black, color: COLORS.red },
});