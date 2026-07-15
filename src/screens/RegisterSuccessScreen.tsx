// src/screens/RegisterSuccessScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ShoppingBag, Store, Truck } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';

// Se navega aquí desde RegisterScreen justo después de un registro
// exitoso (reemplaza el Alert.alert viejo). Al tocar "Elegir mi rol"
// se "hidrata" la sesión en AuthContext → AppNavigator detecta
// isAuthenticated=true y cambia solo hacia RoleSelectionScreen.

const PREVIEW = [
  { icon: ShoppingBag, label: 'Compra',  color: COLORS.primary },
  { icon: Store,       label: 'Vende',   color: COLORS.gold },
  { icon: Truck,       label: 'Reparte', color: COLORS.green },
];

export default function RegisterSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { hydrateSession } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    const ok = await hydrateSession();
    setLoading(false);
    if (!ok) {
      Alert.alert('Ups', 'No pudimos activar tu sesión. Intenta iniciar sesión manualmente.');
    }
    // Si ok === true, el AppNavigator cambia de pantalla solo.
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.center}>
        <View style={s.checkCircle}>
          <Check size={40} color={COLORS.green} strokeWidth={3} />
        </View>

        <Image
          source={require('../assets/logo-horizontal.png')}
          style={s.logo}
          resizeMode="contain"
        />

        <Text style={s.title}>¡Cuenta creada!</Text>
        <Text style={s.subtitle}>
          Tu cuenta ha sido creada exitosamente en KaifMarket. Ahora elige cómo quieres usar la plataforma.
        </Text>

        <View style={s.previewRow}>
          {PREVIEW.map(item => {
            const Icon = item.icon;
            return (
              <View key={item.label} style={s.previewItem}>
                <View style={[s.previewIconWrap, { backgroundColor: item.color + '22' }]}>
                  <Icon size={22} color={item.color} />
                </View>
                <Text style={s.previewLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View>
        <TouchableOpacity
          style={[s.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={s.ctaTxt}>Elegir mi rol →</Text>}
        </TouchableOpacity>
        <Text style={s.hint}>Siempre puedes cambiar tu rol más adelante</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black, paddingHorizontal: SPACING.xl, justifyContent: 'space-between' },
  center: { alignItems: 'center' },
  checkCircle: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
    shadowColor: COLORS.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  logo: { width: 200, height: 133, marginBottom: SPACING.md },
  title: { fontSize: 24, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: COLORS.gray400, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.xl, paddingHorizontal: SPACING.md },
  previewRow: { flexDirection: 'row', gap: SPACING.lg },
  previewItem: { alignItems: 'center', gap: 8 },
  previewIconWrap: { width: 52, height: 52, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
  previewLabel: { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray400 },
  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 6,
  },
  ctaTxt: { color: COLORS.white, fontSize: 16, fontWeight: FONT.black },
  hint: { fontSize: 12, color: COLORS.gray400, textAlign: 'center', marginTop: SPACING.sm },
});