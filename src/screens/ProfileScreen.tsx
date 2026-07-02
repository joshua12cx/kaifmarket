// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Package, ShoppingBag, Undo2, Sparkles, Tag, Star,
  MessageCircle, Heart, RefreshCw, User, Clock,
  Store, MapPin, Settings, ChevronRight, Lock, Wallet,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { ORDERS, PRODUCTS } from '../data';
import { subscribePlus } from '../services';
import { useAuth } from '../context';

const MENU_GROUPS = [
  {
    label: 'Compras',
    items: [
      { icon: Package,    label: 'Mis pedidos',          sub: '',                              key: 'orders'  },
      { icon: ShoppingBag,label: 'Productos comprados',  sub: '',                              key: 'bought'  },
      { icon: Undo2,      label: 'Devoluciones',         sub: '',                              key: 'returns' },
    ],
  },
  {
    label: 'Beneficios',
    items: [
      { icon: Sparkles, label: 'Kaif Plus',          sub: 'Cashback y envío prioritario', key: 'plus'    },
      { icon: Tag,      label: 'Mis cupones',        sub: 'KAIF10 disponible',            key: 'coupons' },
      { icon: Star,     label: 'Categoría favorita', sub: 'Hasta −40%',                   key: 'fav_cat' },
    ],
  },
  {
    label: 'Mi Kaif Market',
    items: [
      { icon: MessageCircle, label: 'Reseñas y preguntas', sub: '', key: 'reviews' },
      { icon: Heart,         label: 'Favoritos',           sub: '', key: 'favs'   },
      { icon: RefreshCw,     label: 'Comparados',          sub: '', key: 'compare'},
      { icon: User,          label: 'Mi perfil',           sub: '', key: 'profile'},
      { icon: Clock,         label: 'Historial',           sub: '', key: 'history'},
    ],
  },
  {
    label: 'Otro',
    items: [
      { icon: MessageCircle, label: 'Chats',                 sub: 'Con soporte y vendedores', key: 'chats'   },
      { icon: Store,         label: 'Vender en Kaif Market', sub: 'Administra tu tienda',     key: 'sell'    },
      { icon: MapPin,        label: 'Puntos de recogida',    sub: '',                         key: 'pickup'  },
      { icon: Settings,      label: 'Configuración',         sub: '',                         key: 'settings'},
    ],
  },
];

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, isPlus, activatePlus, logout } = useAuth();

  const displayName   = user?.name   ?? 'Usuario Kaif';
  const displayEmail  = user?.email  ?? 'Inicia sesión para ver tu perfil';
  const displayAvatar = user?.avatar ?? 'KM';

  const cashbackTotal = 18000;
  const cashbackMax   = 53000;
  const cashbackPct   = Math.round((cashbackTotal / cashbackMax) * 100);

  const handleMenu = (key: string) => {
    if (!user && ['orders','bought','returns','reviews','favs','history','profile','sell'].includes(key)) {
      Alert.alert(
        'Inicia sesión',
        'Necesitas una cuenta para acceder a esta sección.',
        [
          { text: 'Cancelar' },
          { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
        ],
      );
      return;
    }
    switch (key) {
      case 'orders':
      case 'history':
      case 'bought':
        navigation.navigate('OrdersHistory');
        break;
      case 'sell':
        if (user?.is_seller) {
          navigation.navigate('SellerDashboard');
        } else {
          navigation.navigate('SellerRegister');
        }
        break;
      case 'coupons':
        Alert.alert('Mis cupones', '🏷️ KAIF10 — 10% OFF tu próxima compra\nVálido hasta el 31 de Mayo');
        break;
      case 'plus':
        if (!isPlus) {
          Alert.alert(
            'Kaif Plus',
            'Suscríbete por S/ 19.90/mes:\n\n• 2% cashback\n• Envío prioritario\n• Cuotas sin interés',
            [
              { text: 'Suscribirme', onPress: async () => { await subscribePlus(); activatePlus(); } },
              { text: 'Cancelar' },
            ],
          );
        } else {
          Alert.alert('Kaif Plus activo ✦', 'Estás disfrutando todos los beneficios.');
        }
        break;
      default:
        Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar' },
        { text: 'Salir', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  const recentOrder  = ORDERS[0];
  const firstProduct = recentOrder
    ? PRODUCTS.find(p => p.id === recentOrder.items[0]?.productId)
    : null;

  return (
    <View style={[ps.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={ps.header}>
          <View style={ps.avatarWrap}>
            <View style={ps.avatar}>
              <Text style={ps.avatarTxt}>{displayAvatar}</Text>
            </View>
            {isPlus && (
              <View style={ps.plusDot}>
                <Text style={{ color: COLORS.primary, fontSize: 8, fontWeight: FONT.black }}>+</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ps.userName}>{displayName}</Text>
            <Text style={ps.userSub}>{displayEmail}</Text>
            {user?.is_seller && (
              <View style={ps.sellerBadge}>
                <Store size={11} color={COLORS.amber} strokeWidth={2} />
                <Text style={ps.sellerBadgeTxt}>Vendedor</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={ps.chatBtn}>
            <MessageCircle size={20} color={COLORS.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── BOTÓN LOGIN / LOGOUT ── */}
        {!user ? (
          <TouchableOpacity
            style={ps.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}>
            <Lock size={16} color={COLORS.white} strokeWidth={2} />
            <Text style={ps.loginBtnTxt}>Iniciar sesión / Registrarse</Text>
          </TouchableOpacity>
        ) : (
          <View style={ps.logoutRow}>
            {user.is_seller && (
              <TouchableOpacity
                style={ps.sellerBtn}
                onPress={() => navigation.navigate('SellerDashboard')}
                activeOpacity={0.85}>
                <Store size={15} color={COLORS.amber} strokeWidth={2} />
                <Text style={ps.sellerBtnTxt}>Mi tienda</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={ps.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.85}>
              <Text style={ps.logoutBtnTxt}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── CASHBACK BANNER ── */}
        <TouchableOpacity
          style={ps.cashbackBanner}
          activeOpacity={0.85}
          onPress={() => handleMenu('plus')}>
          <View style={{ flex: 1 }}>
            <View style={ps.cashbackRow}>
              <Text style={ps.cashbackAmount}>
                S/ {(cashbackTotal / 100).toFixed(0)}
              </Text>
              <Text style={ps.cashbackOf}>
                {' '}/ S/ {(cashbackMax / 100).toFixed(0)}
              </Text>
            </View>
            <Text style={ps.cashbackLabel}>
              {isPlus ? 'Cashback acumulado este mes' : 'Activa Kaif Plus para ganar cashback'}
            </Text>
            <View style={ps.progressBg}>
              <View style={[ps.progressFill, { width: `${isPlus ? cashbackPct : 0}%` as any }]} />
            </View>
            <Text style={ps.cashbackSub}>
              {isPlus ? '¡Sigue comprando para aumentarlo!' : 'Suscríbete por S/ 19.90/mes ›'}
            </Text>
          </View>
          <View style={ps.cashbackIconWrap}>
            <Wallet size={28} color={COLORS.primary} strokeWidth={1.8} />
          </View>
        </TouchableOpacity>

        {/* ── PEDIDO RECIENTE ── */}
        {recentOrder && firstProduct && (
          <View style={ps.recentCard}>
            <View style={ps.recentHeader}>
              <Text style={ps.recentTitle}>Pedido reciente</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrdersHistory')}>
                <Text style={ps.recentLink}>Ver todos ›</Text>
              </TouchableOpacity>
            </View>
            <View style={ps.recentRow}>
              <View style={ps.recentImg}>
                <Package size={26} color={COLORS.gray400} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ps.recentName} numberOfLines={1}>
                  {firstProduct.shortName}
                </Text>
                <Text style={ps.recentDate}>{recentOrder.date}</Text>
                <View style={[ps.statusPill, { backgroundColor: recentOrder.statusBg }]}>
                  <Text style={[ps.statusTxt, { color: recentOrder.statusColor }]}>
                    {recentOrder.status}
                  </Text>
                </View>
              </View>
              <Text style={ps.recentTotal}>S/ {recentOrder.total}</Text>
            </View>
          </View>
        )}

        {/* ── STATS ── */}
        <View style={ps.statsWrap}>
          {[
            { label: 'Pedidos',   value: user ? String(ORDERS.length) : '0' },
            { label: 'Reseñas',   value: '0' },
            { label: 'Favoritos', value: '0' },
            { label: 'Siguiendo', value: '0' },
          ].map((stat, i) => (
            <View
              key={stat.label}
              style={[ps.stat, i < 3 && { borderRightWidth: 0.5, borderRightColor: COLORS.border }]}>
              <Text style={ps.statVal}>{stat.value}</Text>
              <Text style={ps.statLbl}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── MENÚ AGRUPADO ── */}
        {MENU_GROUPS.map(group => (
          <View key={group.label} style={ps.group}>
            <Text style={ps.groupLabel}>{group.label}</Text>
            <View style={ps.groupCard}>
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      ps.menuItem,
                      idx < group.items.length - 1 && ps.menuItemBorder,
                    ]}
                    onPress={() => handleMenu(item.key)}
                    activeOpacity={0.7}>
                    <View style={ps.menuIconWrap}>
                      <Icon size={20} color={COLORS.gray600} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ps.menuLabel}>{item.label}</Text>
                      {item.sub ? <Text style={ps.menuSub}>{item.sub}</Text> : null}
                    </View>
                    <ChevronRight size={18} color={COLORS.gray400} strokeWidth={2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.black },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 14, padding: SPACING.lg, backgroundColor: COLORS.primary },
  avatarWrap:      { position: 'relative' },
  avatar:          { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:       { fontSize: 22, fontWeight: FONT.black, color: COLORS.primary },
  plusDot:         { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, backgroundColor: COLORS.white, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary },
  userName:        { fontSize: 18, fontWeight: FONT.black, color: COLORS.white },
  userSub:         { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sellerBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  sellerBadgeTxt:  { fontSize: 11, color: COLORS.amber, fontWeight: FONT.bold },
  chatBtn:         { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  loginBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.md, paddingVertical: 14, ...SHADOW.strong },
  loginBtnTxt:     { color: COLORS.white, fontSize: 15, fontWeight: FONT.black },
  logoutRow:       { flexDirection: 'row', gap: 10, marginHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.md },
  sellerBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.amberLight, borderRadius: RADIUS.lg, paddingVertical: 12 },
  sellerBtnTxt:    { color: COLORS.amber, fontSize: 14, fontWeight: FONT.black },
  logoutBtn:       { flex: 1, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, paddingVertical: 12, alignItems: 'center' },
  logoutBtnTxt:    { color: COLORS.gray200, fontSize: 14, fontWeight: FONT.bold },
  cashbackBanner:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.primaryLight, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.xl, padding: SPACING.lg },
  cashbackRow:     { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  cashbackAmount:  { fontSize: 24, fontWeight: FONT.black, color: COLORS.primaryDark },
  cashbackOf:      { fontSize: 14, color: COLORS.primary, fontWeight: FONT.semibold },
  cashbackLabel:   { fontSize: 12, color: COLORS.primaryDark, fontWeight: FONT.bold, marginBottom: 8 },
  progressBg:      { height: 6, backgroundColor: 'rgba(154,28,28,0.15)', borderRadius: 3, marginBottom: 6 },
  progressFill:    { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  cashbackSub:     { fontSize: 11, color: COLORS.primary, fontWeight: FONT.semibold },
  cashbackIconWrap:{ width: 56, height: 56, borderRadius: RADIUS.full, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  recentCard:      { backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.card },
  recentHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  recentTitle:     { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  recentLink:      { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  recentRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentImg:       { width: 52, height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center' },
  recentName:      { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 3 },
  recentDate:      { fontSize: 12, color: COLORS.gray400, marginBottom: 6 },
  statusPill:      { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt:       { fontSize: 11, fontWeight: FONT.bold },
  recentTotal:     { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  statsWrap:       { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.lg, ...SHADOW.card },
  stat:            { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal:         { fontSize: 20, fontWeight: FONT.black, color: COLORS.primary },
  statLbl:         { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  group:           { marginBottom: SPACING.sm },
  groupLabel:      { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray400, paddingHorizontal: SPACING.lg, paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupCard:       { backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.card },
  menuItem:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  menuItemBorder:  { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  menuIconWrap:    { width: 32, alignItems: 'center' },
  menuLabel:       { fontSize: 15, color: COLORS.gray800, fontWeight: FONT.semibold },
  menuSub:         { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
});