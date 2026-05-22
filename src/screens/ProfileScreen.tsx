// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { ORDERS, PRODUCTS } from '../data';
import { subscribePlus } from '../services';
import { useAuth } from '../context';

// ── Grupos del menú ───────────────────────────────────────────────
const MENU_GROUPS = [
  {
    label: 'Compras',
    items: [
      { icon: '📦', label: 'Mis pedidos',       sub: '',                           key: 'orders'  },
      { icon: '🛍️', label: 'Productos comprados', sub: '',                          key: 'bought'  },
      { icon: '↩️', label: 'Devoluciones',       sub: '',                           key: 'returns' },
    ],
  },
  {
    label: 'Beneficios',
    items: [
      { icon: '⚡', label: 'Kaif Plus',          sub: 'Cashback y envío prioritario', key: 'plus'    },
      { icon: '🏷️', label: 'Mis cupones',         sub: 'KAIF10 disponible',           key: 'coupons' },
      { icon: '⭐', label: 'Categoría favorita',  sub: 'Hasta −40%',                  key: 'fav_cat', badge: true },
    ],
  },
  {
    label: 'Mi Kaif Market',
    items: [
      { icon: '💬', label: 'Reseñas y preguntas', sub: '', key: 'reviews'  },
      { icon: '❤️', label: 'Favoritos',            sub: '', key: 'favs'    },
      { icon: '🔄', label: 'Comparados',           sub: '', key: 'compare' },
      { icon: '👤', label: 'Mi perfil',            sub: '', key: 'profile' },
      { icon: '🕐', label: 'Historial',            sub: '', key: 'history' },
    ],
  },
  {
    label: 'Otro',
    items: [
      { icon: '💬', label: 'Chats',                   sub: 'Con soporte y vendedores', key: 'chats'   },
      { icon: '🏪', label: 'Vender en Kaif Market',   sub: '',                         key: 'sell'    },
      { icon: '📍', label: 'Puntos de recogida',      sub: '',                         key: 'pickup'  },
      { icon: '⚙️', label: 'Configuración',           sub: '',                         key: 'settings'},
    ],
  },
];

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, isPlus, activatePlus } = useAuth();

  const cashbackTotal = 18000;
  const cashbackMax   = 53000;
  const cashbackPct   = Math.round((cashbackTotal / cashbackMax) * 100);

  const handleMenu = (key: string) => {
    if (key === 'sell') {
      Alert.alert(
        '🏪 Vender en Kaif Market',
        '• Listado gratuito de productos\n• Comisión solo cuando vendas\n• Plan Premium S/ 55–80/mes\n  Badge PREMIUM + mayor visibilidad',
        [{ text: 'Registrarme' }, { text: 'Cancelar' }],
      );
    } else if (key === 'coupons') {
      Alert.alert('Mis cupones', '🏷️ KAIF10 — 10% OFF tu próxima compra\n\nVálido hasta el 31 de Mayo');
    } else if (key === 'plus') {
      if (!isPlus) {
        Alert.alert('Kaif Plus', 'Suscríbete por S/ 19.90/mes y obtén:\n\n• 2% cashback en todo\n• Envío prioritario\n• Cuotas sin interés\n• Ofertas exclusivas',
          [{ text: 'Suscribirme', onPress: async () => { await subscribePlus(); activatePlus(); } }, { text: 'Cancelar' }]);
      } else {
        Alert.alert('Kaif Plus activo ✦', 'Estás disfrutando todos los beneficios.');
      }
    } else {
      Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
    }
  };

  const recentOrder = ORDERS[0];
  const firstProduct = PRODUCTS.find(p => p.id === recentOrder?.items[0]?.productId);

  return (
    <View style={[ps.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HEADER USUARIO ── */}
        <View style={ps.header}>
          <View style={ps.avatarWrap}>
            <View style={ps.avatar}>
              <Text style={ps.avatarTxt}>{user.avatar}</Text>
            </View>
            {isPlus && (
              <View style={ps.plusDot}><Text style={{ color: '#fff', fontSize: 8, fontWeight: FONT.black }}>+</Text></View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ps.userName}>{user.name}</Text>
            <Text style={ps.userSub}>{user.email}</Text>
          </View>
          <TouchableOpacity style={ps.chatBtn}>
            <Text style={{ fontSize: 20 }}>💬</Text>
          </TouchableOpacity>
        </View>

        {/* ── BANNER CASHBACK ── */}
        <TouchableOpacity style={ps.cashbackBanner} activeOpacity={0.85} onPress={() => handleMenu('plus')}>
          <View style={{ flex: 1 }}>
            <View style={ps.cashbackRow}>
              <Text style={ps.cashbackAmount}>S/ {(cashbackTotal / 100).toFixed(0)}</Text>
              <Text style={ps.cashbackOf}> / S/ {(cashbackMax / 100).toFixed(0)}</Text>
            </View>
            <Text style={ps.cashbackLabel}>
              {isPlus ? '✦ Cashback acumulado este mes' : 'Activa Kaif Plus para ganar cashback'}
            </Text>
            {/* Progress bar */}
            <View style={ps.progressBg}>
              <View style={[ps.progressFill, { width: `${isPlus ? cashbackPct : 0}%` as any }]} />
            </View>
            <Text style={ps.cashbackSub}>
              {isPlus ? '¡Sigue comprando para aumentarlo!' : 'Suscríbete por S/ 19.90/mes ›'}
            </Text>
          </View>
          <Text style={{ fontSize: 40 }}>💰</Text>
        </TouchableOpacity>

        {/* ── PEDIDO RECIENTE ── */}
        {recentOrder && firstProduct && (
          <View style={ps.recentCard}>
            <View style={ps.recentHeader}>
              <Text style={ps.recentTitle}>Pedido reciente</Text>
              <TouchableOpacity><Text style={ps.recentLink}>Ver todos ›</Text></TouchableOpacity>
            </View>
            <View style={ps.recentRow}>
              <View style={[ps.recentImg, { backgroundColor: firstProduct.bgColor }]}>
                <Text style={{ fontSize: 28 }}>{firstProduct.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ps.recentName} numberOfLines={1}>{firstProduct.shortName}</Text>
                <Text style={ps.recentDate}>{recentOrder.date}</Text>
                <View style={[ps.statusPill, { backgroundColor: recentOrder.statusBg }]}>
                  <Text style={[ps.statusTxt, { color: recentOrder.statusColor }]}>{recentOrder.status}</Text>
                </View>
              </View>
              <Text style={ps.recentTotal}>S/ {recentOrder.total}</Text>
            </View>
          </View>
        )}

        {/* ── MENÚ AGRUPADO ── */}
        {MENU_GROUPS.map(group => (
          <View key={group.label} style={ps.group}>
            <Text style={ps.groupLabel}>{group.label}</Text>
            <View style={ps.groupCard}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[ps.menuItem, idx < group.items.length - 1 && ps.menuItemBorder]}
                  onPress={() => handleMenu(item.key)}
                  activeOpacity={0.7}>
                  <View style={ps.menuIconWrap}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ps.menuLabel}>{item.label}</Text>
                    {item.sub ? <Text style={ps.menuSub}>{item.sub}</Text> : null}
                  </View>
                  {item.badge && <View style={ps.menuBadge} />}
                  <Text style={ps.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── STATS ── */}
        <View style={ps.statsWrap}>
          {[
            { label: 'Pedidos',   value: String(ORDERS.length) },
            { label: 'Reseñas',   value: '0'  },
            { label: 'Favoritos', value: '0'  },
            { label: 'Siguiendo', value: '2'  },
          ].map((stat, i) => (
            <View key={stat.label} style={[ps.stat, i < 3 && { borderRightWidth: 1, borderRightColor: COLORS.border }]}>
              <Text style={ps.statVal}>{stat.value}</Text>
              <Text style={ps.statLbl}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.gray50 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 14, padding: SPACING.lg, backgroundColor: COLORS.white },
  avatarWrap:     { position: 'relative' },
  avatar:         { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontSize: 22, fontWeight: FONT.black, color: '#fff' },
  plusDot:        { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, backgroundColor: COLORS.primary, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  userName:       { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800 },
  userSub:        { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  chatBtn:        { width: 40, height: 40, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  cashbackBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.primaryLight, margin: SPACING.lg, marginTop: SPACING.sm, borderRadius: RADIUS.xl, padding: SPACING.lg },
  cashbackRow:    { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  cashbackAmount: { fontSize: 24, fontWeight: FONT.black, color: COLORS.primaryDark },
  cashbackOf:     { fontSize: 14, color: COLORS.primary, fontWeight: FONT.semibold },
  cashbackLabel:  { fontSize: 12, color: COLORS.primaryDark, fontWeight: FONT.bold, marginBottom: 8 },
  progressBg:     { height: 6, backgroundColor: 'rgba(83,74,183,0.2)', borderRadius: 3, marginBottom: 6 },
  progressFill:   { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  cashbackSub:    { fontSize: 11, color: COLORS.primary, fontWeight: FONT.semibold },
  recentCard:     { backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.xl, padding: SPACING.lg },
  recentHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  recentTitle:    { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800 },
  recentLink:     { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  recentRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentImg:      { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  recentName:     { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 3 },
  recentDate:     { fontSize: 12, color: COLORS.gray400, marginBottom: 6 },
  statusPill:     { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt:      { fontSize: 11, fontWeight: FONT.bold },
  recentTotal:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  group:          { marginBottom: 4 },
  groupLabel:     { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray400, paddingHorizontal: SPACING.lg, paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupCard:      { backgroundColor: COLORS.white, marginHorizontal: 0 },
  menuItem:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  menuIconWrap:   { width: 32, alignItems: 'center' },
  menuLabel:      { fontSize: 15, color: COLORS.gray800, fontWeight: FONT.semibold },
  menuSub:        { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  menuBadge:      { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  menuArrow:      { fontSize: 18, color: COLORS.gray400 },
  statsWrap:      { flexDirection: 'row', backgroundColor: COLORS.white, marginTop: 4 },
  stat:           { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal:        { fontSize: 20, fontWeight: FONT.black, color: COLORS.primary },
  statLbl:        { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
});
