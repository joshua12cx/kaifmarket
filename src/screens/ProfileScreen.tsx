// src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Package, Heart, CreditCard, MapPin, Tag, Award,
  Globe, MessageSquare, ChevronRight, LogOut, Users,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth, useFavs } from '../context';
import { supabase } from '../lib/supabase';
import { useAppMode } from '../navigation/AppNavigator';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { resetToRoleSelection } = useAppMode();
  const { favCount } = useFavs();

  const [loading, setLoading]       = useState(true);
  const [activeOrders, setActiveOrders] = useState(0);
  const [isPlus, setIsPlus]         = useState(false);
  const [plusPts, setPlusPts]       = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .in('status', ['processing', 'shipped']);
      setActiveOrders(count || 0);

      setIsPlus(!!user.is_plus);
      // TODO en BD: no existe todavía una columna de puntos Kaif Plus
      // (`users.plus_points` o similar) — por ahora en 0 hasta que
      // se defina cómo se acumulan.
      setPlusPts(0);
    } catch (e) {
      if (__DEV__) { console.log('[PROFILE] load error:', e); }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.is_plus]);

  useEffect(() => { load(); }, [load]);

  const stub = (title: string) => Alert.alert(title, 'Esta sección todavía está en desarrollo.');

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const initials = (user?.name || 'U').charAt(0).toUpperCase();

  const MENU = [
    { icon: Package,       title: 'Mis Pedidos',   sub: `${activeOrders} activo${activeOrders === 1 ? '' : 's'}`, color: COLORS.red,    onPress: () => navigation.navigate('OrdersHistory') },
    { icon: Heart,         title: 'Favoritos',     sub: `${favCount} guardado${favCount === 1 ? '' : 's'}`,        color: COLORS.gold,   onPress: () => navigation.getParent()?.navigate('FavoritesTab') },
    { icon: CreditCard,    title: 'Métodos de pago', sub: 'Yape, Visa, PayPal',                                    color: COLORS.green,  onPress: () => navigation.navigate('PaymentMethods') },
    { icon: MapPin,        title: 'Direcciones',   sub: 'Gestiona tus direcciones',                                 color: COLORS.blue,   onPress: () => stub('Direcciones') },
    { icon: Tag,           title: 'Cupones',       sub: 'Tus cupones disponibles',                                  color: '#8B5CF6',     onPress: () => stub('Cupones') },
    { icon: Award,         title: 'Kaif Plus',     sub: isPlus ? `Activo · ${plusPts} pts` : 'Únete y ahorra',      color: COLORS.gold,   onPress: () => navigation.navigate('KaifPlus') },
    { icon: Globe,         title: 'Categorías',    sub: 'Explora por categoría',                                    color: COLORS.green,  onPress: () => navigation.getParent()?.navigate('SearchTab') },
    { icon: MessageSquare, title: 'Libro de Reclamaciones', sub: 'Quejas y resoluciones',                           color: '#F97316',     onPress: () => navigation.navigate('Complaints') },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        <Text style={s.headerTitle}>Mi Perfil</Text>

        {/* ── CARD PRINCIPAL ── */}
        <TouchableOpacity style={s.profileCard} activeOpacity={0.85} onPress={() => stub('Perfil personal')}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{user?.name || 'Usuario'}</Text>
            <Text style={s.email}>{user?.email}</Text>
            {isPlus && (
              <View style={s.plusRow}>
                <Award size={12} color={COLORS.gold} strokeWidth={2} />
                <Text style={s.plusTxt}>Kaif Plus · {plusPts} pts</Text>
              </View>
            )}
          </View>
          <ChevronRight size={18} color={COLORS.gray400} />
        </TouchableOpacity>

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

        <TouchableOpacity
          style={s.changeRoleBtn}
          onPress={() => Alert.alert(
            'Cambiar de rol',
            '¿Quieres volver a la pantalla donde eliges cómo usar KaifMarket?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sí, cambiar', onPress: resetToRoleSelection },
            ],
          )}
          activeOpacity={0.85}>
          <Users size={16} color={COLORS.primary} strokeWidth={2} />
          <Text style={s.changeRoleBtnTxt}>Cambiar de rol</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
          ])}
          activeOpacity={0.8}>
          <LogOut size={15} color={COLORS.gray400} strokeWidth={2} />
          <Text style={s.logoutTxt}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  headerTitle:  { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.lg },

  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  avatar:       { width: 52, height: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 20, fontWeight: FONT.black, color: COLORS.white },
  name:         { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  email:        { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  plusRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  plusTxt:      { fontSize: 11, color: COLORS.gold, fontWeight: FONT.bold },

  menuCard:     { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, overflow: 'hidden' },
  menuRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  menuIconWrap: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  menuTitle:    { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  menuSub:      { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: SPACING.lg },
  logoutTxt:    { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },
  changeRoleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, marginTop: SPACING.lg },
  changeRoleBtnTxt: { fontSize: 14, fontWeight: FONT.black, color: COLORS.primary },
});