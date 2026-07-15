// src/screens/MotorizadoApplicationSuccessScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Check, Circle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAppMode } from '../navigation/AppNavigator';

const GREEN = COLORS.green;

const CHECKLIST = [
  { label: 'Solicitud enviada',            sub: 'Ahora',     state: 'done' as const },
  { label: 'Documentos en revisión',       sub: '24-48h',    state: 'pending' as const },
  { label: 'Verificación de vehículo',     sub: 'Pendiente', state: 'pending' as const },
  { label: 'Cuenta de transportista activada', sub: '–',      state: 'pending' as const },
];

export default function MotorizadoApplicationSuccessScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { resetToRoleSelection } = useAppMode();

  return (
    <View style={[s.container, { paddingTop: insets.top + 20 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.center}>
        <View style={s.clockCircle}>
          <Clock size={34} color={GREEN} strokeWidth={2} />
        </View>
        <Text style={s.title}>¡Solicitud enviada!</Text>

        <View style={s.statusCard}>
          <Text style={s.statusTitle}>Estado: Pendiente de revisión</Text>
          <Text style={s.statusSub}>
            Nuestros administradores están verificando tus documentos. Tiempo estimado de aprobación: 24-48 horas.
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
              <Text style={[s.checkSub, item.state === 'done' && { color: GREEN }]}>{item.sub}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 10, paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          style={s.statusBtn}
          onPress={() => navigation.navigate('MotorizadoApplicationStatus')}
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
  clockCircle:  { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  title:        { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.lg },

  statusCard:   { backgroundColor: '#0F2A18', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: GREEN + '30', width: '100%' },
  statusTitle:  { fontSize: 13, fontWeight: FONT.black, color: GREEN, marginBottom: 6 },
  statusSub:    { fontSize: 12, color: COLORS.gray400, lineHeight: 18 },

  checklist:    { width: '100%', backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, overflow: 'hidden' },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  checkIconDone:    { width: 22, height: 22, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  checkIconPending: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkLabel:   { flex: 1, fontSize: 13, fontWeight: FONT.semibold, color: COLORS.white },
  checkLabelPending: { color: COLORS.gray400 },
  checkSub:     { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },

  statusBtn:    { borderWidth: 1.5, borderColor: COLORS.gray800, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center' },
  statusBtnTxt: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  backBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 15, alignItems: 'center' },
  backBtnTxt:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.white },
});