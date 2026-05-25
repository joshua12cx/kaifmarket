// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { useAuth } from '../context';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validación ────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) { errs.email = 'El email es requerido'; }
    else if (!email.includes('@')) { errs.email = 'Email inválido'; }
    if (!password) { errs.password = 'La contraseña es requerida'; }
    else if (password.length < 6) { errs.password = 'Mínimo 6 caracteres'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Login ─────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) { return; }
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.error) {
      Alert.alert('Error al ingresar', result.error);
    } else {
      // Login exitoso → ir al Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTab' }],
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.logoWrap}>
            <View style={s.logoIcon}>
              <Text style={{ fontSize: 36 }}>🐦</Text>
            </View>
          </View>
          <Text style={s.title}>KaifMarket</Text>
          <Text style={s.subtitle}>Tu marketplace peruano 🇵🇪</Text>
        </View>

        {/* ── FORM ── */}
        <View style={s.form}>
          <Text style={s.formTitle}>Iniciar sesión</Text>

          {/* Email */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Email</Text>
            <View style={[s.inputWrap, errors.email && s.inputError]}>
              <Text style={s.inputIcon}>📧</Text>
              <TextInput
                style={s.input}
                placeholder="tu@email.com"
                placeholderTextColor={COLORS.gray400}
                value={email}
                onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email ? <Text style={s.errorTxt}>{errors.email}</Text> : null}
          </View>

          {/* Contraseña */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Contraseña</Text>
            <View style={[s.inputWrap, errors.password && s.inputError]}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.input}
                placeholder="Tu contraseña"
                placeholderTextColor={COLORS.gray400}
                value={password}
                onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errorTxt}>{errors.password}</Text> : null}
          </View>

          {/* Olvidé contraseña */}
          <TouchableOpacity
            style={s.forgotWrap}
            onPress={() => Alert.alert('Recuperar contraseña', 'Te enviaremos un email para restablecer tu contraseña.\n\nPróximamente disponible.')}>
            <Text style={s.forgotTxt}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón login */}
          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={s.loginBtnTxt}>Ingresar →</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerTxt}>o</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Continuar sin cuenta */}
          <TouchableOpacity
            style={s.guestBtn}
            onPress={() => navigation.navigate('HomeTab')}
            activeOpacity={0.8}>
            <Text style={s.guestBtnTxt}>Continuar sin cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* ── REGISTRO ── */}
        <View style={s.registerWrap}>
          <Text style={s.registerTxt}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.registerLink}>Regístrate gratis</Text>
          </TouchableOpacity>
        </View>

        {/* ── INFO ── */}
        <View style={s.infoWrap}>
          <Text style={s.infoTxt}>
            Al ingresar aceptas nuestros{' '}
            <Text style={{ color: COLORS.primary }}>Términos de uso</Text>
            {' '}y{' '}
            <Text style={{ color: COLORS.primary }}>Política de privacidad</Text>
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { marginBottom: 12 },
  logoIcon: { width: 80, height: 80, backgroundColor: COLORS.primaryLight, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary },
  title: { fontSize: 28, fontWeight: FONT.black, color: COLORS.gray800, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, marginTop: 4 },
  form: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  formTitle: { fontSize: 20, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.lg },
  fieldWrap: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray600, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, gap: 10, backgroundColor: COLORS.gray50 },
  inputError: { borderColor: COLORS.red },
  input: { flex: 1, fontSize: 15, color: COLORS.gray800, padding: 0 },
  inputIcon: { fontSize: 18 },
  errorTxt: { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: SPACING.lg },
  forgotTxt: { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', ...SHADOW.strong },
  loginBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: FONT.black, letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerTxt: { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },
  guestBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingVertical: 13, alignItems: 'center' },
  guestBtnTxt: { fontSize: 15, color: COLORS.gray600, fontWeight: FONT.bold },
  registerWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  registerTxt: { fontSize: 14, color: COLORS.gray400 },
  registerLink: { fontSize: 14, color: COLORS.primary, fontWeight: FONT.black },
  infoWrap: { paddingHorizontal: SPACING.lg },
  infoTxt: { fontSize: 12, color: COLORS.gray400, textAlign: 'center', lineHeight: 18 },
});
