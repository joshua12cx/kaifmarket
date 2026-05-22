// src/screens/NotificationsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { useNotifs } from '../context';

// ── Tipo de ícono por notificación ────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  order_update: { icon: '🛍️', color: COLORS.primary,  bg: COLORS.primaryLight },
  delivery:     { icon: '📦', color: COLORS.green,    bg: COLORS.greenLight   },
  promo:        { icon: '🏷️', color: COLORS.amber,    bg: COLORS.amberLight   },
  review:       { icon: '⭐', color: '#F5A623',       bg: '#FFF8E1'           },
  cashback:     { icon: '💰', color: COLORS.green,    bg: COLORS.greenLight   },
  plus:         { icon: '✦',  color: COLORS.primary,  bg: COLORS.primaryLight },
};

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifs();

  // ════════════════════════════════════════════════════
  // TODO BACKEND — descomentar cuando el backend esté listo
  // ════════════════════════════════════════════════════
  // useEffect(() => {
  //   const fetchNotifs = async () => {
  //     const token = await AsyncStorage.getItem('token');
  //     const res = await fetch(`${API_URL}/notifications`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     const data = await res.json();
  //     // Actualizar contexto con data real
  //   };
  //   fetchNotifs();
  // }, []);
  // ════════════════════════════════════════════════════

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  return (
    <View style={[ns.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={ns.header}>
        <TouchableOpacity style={ns.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ns.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={ns.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={ns.markAllTxt}>Leer todo</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        /* ── VACÍO ── */
        <View style={ns.empty}>
          <Text style={ns.emptyEmoji}>🔔</Text>
          <Text style={ns.emptyTitle}>Sin notificaciones</Text>
          <Text style={ns.emptySub}>Te avisaremos sobre pedidos, ofertas y novedades</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── NO LEÍDAS ── */}
          {unread.length > 0 && (
            <View style={ns.group}>
              <View style={ns.groupHeader}>
                <View style={ns.unreadDot} />
                <Text style={ns.groupLabel}>Nuevas · {unread.length}</Text>
              </View>
              {unread.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.promo;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[ns.notifCard, ns.notifCardUnread]}
                    onPress={() => markRead(notif.id)}
                    activeOpacity={0.8}>

                    {/* Ícono tipo */}
                    <View style={[ns.notifIcon, { backgroundColor: cfg.bg }]}>
                      <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>
                    </View>

                    {/* Texto */}
                    <View style={ns.notifBody}>
                      <Text style={ns.notifTitle}>{notif.title}</Text>
                      <Text style={ns.notifText} numberOfLines={2}>{notif.body}</Text>
                      <Text style={ns.notifTime}>{notif.time}</Text>
                    </View>

                    {/* IMAGEN A LA DERECHA */}
                    <View style={[ns.notifThumb, { backgroundColor: notif.imageBg }]}>
                      <Text style={{ fontSize: 28 }}>{notif.imageEmoji}</Text>
                    </View>

                    {/* Punto azul */}
                    <View style={ns.unreadBall} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── LEÍDAS ── */}
          {read.length > 0 && (
            <View style={ns.group}>
              <Text style={[ns.groupLabel, { marginLeft: SPACING.lg }]}>Anteriores</Text>
              {read.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.promo;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={ns.notifCard}
                    onPress={() => {}}
                    onLongPress={() => deleteNotif(notif.id)}
                    activeOpacity={0.8}>

                    <View style={[ns.notifIcon, { backgroundColor: cfg.bg, opacity: 0.7 }]}>
                      <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>
                    </View>

                    <View style={ns.notifBody}>
                      <Text style={[ns.notifTitle, { color: COLORS.gray600 }]}>{notif.title}</Text>
                      <Text style={ns.notifText} numberOfLines={2}>{notif.body}</Text>
                      <Text style={ns.notifTime}>{notif.time}</Text>
                    </View>

                    {/* IMAGEN A LA DERECHA */}
                    <View style={[ns.notifThumb, { backgroundColor: notif.imageBg, opacity: 0.7 }]}>
                      <Text style={{ fontSize: 28 }}>{notif.imageEmoji}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={ns.longPressHint}>Mantén presionado para eliminar</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const ns = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.gray50 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:         { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:         { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:     { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800 },
  markAllTxt:      { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji:      { fontSize: 64, marginBottom: 16 },
  emptyTitle:      { fontSize: 18, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 8 },
  emptySub:        { fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  group:           { marginBottom: SPACING.sm },
  groupHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.lg, paddingVertical: 12 },
  groupLabel:      { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.5, paddingVertical: 12 },
  unreadDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  notifCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, position: 'relative' },
  notifCardUnread: { backgroundColor: '#F8F7FF' },
  notifIcon:       { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody:       { flex: 1 },
  notifTitle:      { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, marginBottom: 3 },
  notifText:       { fontSize: 13, color: COLORS.gray400, lineHeight: 18, marginBottom: 4 },
  notifTime:       { fontSize: 11, color: COLORS.gray400 },
  notifThumb:      { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  unreadBall:      { position: 'absolute', top: 14, right: SPACING.lg, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  longPressHint:   { textAlign: 'center', fontSize: 11, color: COLORS.gray400, paddingVertical: 8 },
});
