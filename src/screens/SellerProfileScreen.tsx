// src/screens/SellerProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User as UserIcon, Store, Award, Bell, Shield, Settings,
  Users, LogOut, ChevronRight, BadgeCheck, Star,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { supabase, Seller } from '../lib/supabase';
import { useAuth } from '../context';
import { useAppMode } from '../navigation/AppNavigator';

export default function SellerProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { resetToRoleSelection } = useAppMode();

  const [loading, setLoading] = useState(true);
  const [seller, setSeller]   = useState<Seller | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase.from('sellers').select('*').eq('user_id', user.id).single();
    setSeller(data as Seller);
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
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  const initials = (user?.name || 'V').charAt(0).toUpperCase();

  const MENU = [
    { icon: UserIcon, title: 'Perfil personal',  sub: 'Nombre, email, teléfono',       color: COLORS.gray400, onPress: () => stub('Perfil personal') },
    { icon: Store,    title: 'Perfil de negocio', sub: 'RUC, razón social, dirección', color: COLORS.gold,    onPress: () => stub('Perfil de negocio') },
    { icon: Award,    title: 'Kaif Plus Seller',  sub: seller?.is_premium ? 'Activo · Gestionar membresía' : 'Mejora tu tienda', color: COLORS.gold, onPress: () => navigation.navigate('SellerPlus') },
    { icon: Bell,     title: 'Notificaciones',    sub: 'Pedidos, mensajes, pagos',      color: COLORS.gray400, onPress: () => stub('Notificaciones') },
    { icon: Shield,   title: 'Seguridad',         sub: 'Contraseña, 2FA, dispositivos', color: COLORS.red,     onPress: () => stub('Seguridad') },
    { icon: Settings, title: 'Configuración',     sub: 'Idioma, preferencias',          color: COLORS.gray400, onPress: () => stub('Configuración') },
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
            <Text style={s.name}>{user?.name || 'Vendedor'}</Text>
            <Text style={s.storeLine}>
              {seller?.name || 'Mi Tienda'} · {seller?.is_premium ? 'Vendedor Plus' : 'Vendedor'}
            </Text>
            <View style={s.verifiedRow}>
              {seller?.is_verified && (
                <>
                  <BadgeCheck size={13} color={COLORS.gold} strokeWidth={2} />
                  <Text style={s.verifiedTxt}>Verificado</Text>
                  <Text style={s.dotSep}>·</Text>
                </>
              )}
              <Star size={12} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
              <Text style={s.verifiedTxt}>{Number(seller?.rating || 5).toFixed(1)}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.gray400} />
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

        {/* ── CAMBIAR DE ROL ── */}
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
  avatar:       { width: 52, height: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 20, fontWeight: FONT.black, color: COLORS.black },
  name:         { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  storeLine:    { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  verifiedRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  verifiedTxt:  { fontSize: 11, color: COLORS.gold, fontWeight: FONT.bold },
  dotSep:       { fontSize: 11, color: COLORS.gray800, marginHorizontal: 2 },

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