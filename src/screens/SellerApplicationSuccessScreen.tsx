// src/screens/SellerApplicationSuccessScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Check, Circle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAppMode } from '../navigation/AppNavigator';

// Checklist estático — la primera fila ("Solicitud enviada") es lo
// único 100% real en este momento; el resto son los pasos que le
// esperan, no datos que ya sepamos.
const CHECKLIST = [
  { label: 'Solicitud enviada',             sub: 'Ahora',    state: 'done' as const },
  { label: 'Documentos en revisión',        sub: '24-48h',   state: 'pending' as const },
  { label: 'Aprobación del administrador',  sub: 'Pendiente',state: 'pending' as const },
  { label: 'Cuenta de vendedor activada',   sub: '–',         state: 'pending' as const },
];

export default function SellerApplicationSuccessScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { resetToRoleSelection } = useAppMode();

  return (
    <View style={[s.container, { paddingTop: insets.top + 20 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.center}>
        <View style={s.clockCircle}>
          <Clock size={34} color={COLORS.gold} strokeWidth={2} />
        </View>
        <Text style={s.title}>¡Solicitud enviada!</Text>

        <View style={s.statusCard}>
          <Text style={s.statusTitle}>Estado: Pendiente de aprobación del administrador</Text>
          <Text style={s.statusSub}>
            Tu solicitud ha sido recibida. Nuestro equipo revisará tus documentos en un plazo de 24-48 horas hábiles.
          </Text>
        </View>

        <View style={s.checklist}>
          {CHECKLIST.map((item, i) => (
            <View key={item.label} style={[s.checkRow, i === CHECKLIST.length - 1 && { borderBottomWidth: 0 }]}>
              {item.state === 'done' ? (
                <View style={s.checkIconDone}><Check size={13} color={COLORS.white} strokeWidth={3} /></View>
              ) : (
                <View style={s.checkIconPending}><Circle size={8} color={COLORS.gray600} fill={COLORS.gray600} /></View>
              )}
              <Text style={[s.checkLabel, item.state === 'pending' && s.checkLabelPending]}>{item.label}</Text>
              <Text style={[s.checkSub, item.state === 'done' && { color: COLORS.green }]}>{item.sub}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 10, paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          style={s.statusBtn}
          onPress={() => navigation.navigate('SellerApplicationStatus')}
          activeOpacity={0.85}>
          <Text style={s.statusBtnTxt}>Ver estado de solicitud</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backBtn} onPress={resetToRoleSelection} activeOpacity={0.85}>
          <Text style={s.backBtnTxt}>Volver a modo Comprador</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black, paddingHorizontal: SPACING.lg, justifyContent: 'space-between' },
  center:       { alignItems: 'center' },
  clockCircle:  { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  title:        { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.lg },

  statusCard:   { backgroundColor: '#3A2E0A', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.gold + '30', width: '100%' },
  statusTitle:  { fontSize: 13, fontWeight: FONT.black, color: COLORS.gold, marginBottom: 6 },
  statusSub:    { fontSize: 12, color: COLORS.gray400, lineHeight: 18 },

  checklist:    { width: '100%', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, overflow: 'hidden' },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  checkIconDone:    { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  checkIconPending: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkLabel:   { flex: 1, fontSize: 13, fontWeight: FONT.semibold, color: COLORS.white },
  checkLabelPending: { color: COLORS.gray400 },
  checkSub:     { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },

  statusBtn:    { borderWidth: 1.5, borderColor: COLORS.gray800, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center' },
  statusBtnTxt: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  backBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center' },
  backBtnTxt:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
});