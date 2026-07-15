// src/screens/SellerApplicationStatusScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, Check, Circle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { useAppMode } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:        { label: 'PENDIENTE',      color: COLORS.gold },
  en_revision:    { label: 'EN REVISIÓN',    color: COLORS.blue },
  info_adicional: { label: 'INFO. ADICIONAL',color: '#F97316' },
  approved:       { label: 'APROBADO',       color: COLORS.green },
  rejected:       { label: 'RECHAZADO',      color: COLORS.red },
};

const SUBSTEPS = [
  'Solicitud enviada',
  'Documentos en revisión',
  'Verificación de identidad',
  'Información adicional (si aplica)',
  'Aprobación del administrador',
  'Cuenta de vendedor activada',
];

function doneIndexForStatus(status: string) {
  if (status === 'pending')        { return 1; }
  if (status === 'en_revision')    { return 2; }
  if (status === 'info_adicional') { return 3; }
  if (status === 'approved')       { return 5; }
  return -1;
}

export default function SellerApplicationStatusScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { resetToRoleSelection } = useAppMode();

  const [loading, setLoading] = useState(true);
  const [seller, setSeller]   = useState<any>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase.from('sellers').select('*').eq('user_id', user.id).single();
    setSeller(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading || !seller) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  const meta = STATUS_META[seller.status] || STATUS_META.pending;
  const doneIndex = doneIndexForStatus(seller.status);
  const isRejected = seller.status === 'rejected';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Estado de solicitud</Text>
        <View style={[s.headerBadge, { backgroundColor: meta.color + '22' }]}>
          <Text style={[s.headerBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        <View style={[s.statusCard, { borderColor: meta.color + '40' }]}>
          <View style={[s.statusIconWrap, { backgroundColor: meta.color + '22' }]}>
            <Clock size={18} color={meta.color} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.statusTitle}>
              {isRejected ? 'Solicitud rechazada' : seller.status === 'approved' ? '¡Ya eres vendedor!' : 'Pendiente de revisión'}
            </Text>
            <Text style={s.statusSub}>
              {isRejected
                ? (seller.rejection_reason || 'Puedes volver a intentarlo corrigiendo tu documentación.')
                : seller.status === 'approved'
                ? 'Tu tienda ya está activa.'
                : 'Tiempo estimado: 24-48 horas'}
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Estados posibles</Text>
        <View style={s.legendRow}>
          {Object.values(STATUS_META).map(m => (
            <View key={m.label} style={[s.legendPill, { backgroundColor: m.color + '22' }]}>
              <Text style={[s.legendTxt, { color: m.color }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Progreso de tu solicitud</Text>
        {isRejected ? (
          <View style={s.rejectedCard}>
            <Text style={s.rejectedTxt}>
              {seller.rejection_reason || 'Tu solicitud fue rechazada. Revisa tus documentos e inténtalo de nuevo desde Perfil → Mi Tienda.'}
            </Text>
          </View>
        ) : (
          <View style={s.timelineCard}>
            {SUBSTEPS.map((label, i) => {
              const done = i <= doneIndex;
              const isLast = i === SUBSTEPS.length - 1;
              let timeLabel = '';
              if (i === 0) {
                timeLabel = new Date(seller.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
              } else if (done && i === doneIndex) { timeLabel = 'En proceso ahora'; }
              else if (done) { timeLabel = 'Completado'; }
              else { timeLabel = 'Pendiente'; }

              return (
                <View key={label} style={s.stepRow}>
                  <View style={s.stepIconCol}>
                    <View style={[s.stepDot, done ? s.stepDotDone : s.stepDotPending]}>
                      {done
                        ? <Check size={12} color={COLORS.white} strokeWidth={3} />
                        : <Circle size={7} color={COLORS.gray600} fill={COLORS.gray600} />}
                    </View>
                    {!isLast && <View style={[s.stepConnector, i < doneIndex && s.stepConnectorDone]} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: isLast ? 0 : SPACING.md }}>
                    <Text style={[s.stepLabel, !done && s.stepLabelPending]}>{label}</Text>
                    <Text style={[s.stepTime, i === doneIndex && { color: COLORS.gold }]}>{timeLabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={s.backToBuyerBtn} onPress={resetToRoleSelection} activeOpacity={0.85}>
          <Text style={s.backToBuyerTxt}>Volver a modo Comprador</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  headerBadge:  { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  headerBadgeTxt: { fontSize: 10, fontWeight: FONT.black },

  statusCard:   { flexDirection: 'row', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1 },
  statusIconWrap: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  statusTitle:  { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
  statusSub:    { fontSize: 12, color: COLORS.gray400, marginTop: 4, lineHeight: 18 },

  sectionTitle: { fontSize: 14, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.sm },
  legendRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.lg },
  legendPill:   { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  legendTxt:    { fontSize: 9, fontWeight: FONT.black },

  rejectedCard: { backgroundColor: COLORS.red + '15', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  rejectedTxt:  { fontSize: 13, color: COLORS.red, lineHeight: 20 },

  timelineCard: { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  stepRow:      { flexDirection: 'row', gap: 12 },
  stepIconCol:  { alignItems: 'center' },
  stepDot:      { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepDotDone:  { backgroundColor: COLORS.green },
  stepDotPending: { backgroundColor: 'transparent' },
  stepConnector:{ width: 2, flex: 1, backgroundColor: COLORS.gray800, marginTop: 2 },
  stepConnectorDone: { backgroundColor: COLORS.green },
  stepLabel:    { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white },
  stepLabelPending: { color: COLORS.gray400 },
  stepTime:     { fontSize: 11, color: COLORS.gray600, marginTop: 3, fontWeight: FONT.semibold },

  backToBuyerBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center' },
  backToBuyerTxt: { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
});