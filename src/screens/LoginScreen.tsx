// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import AuthToggle from '../components/AuthToggle';

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
    }
    // Si fue exitoso no hace falta navegar a mano: AppNavigator detecta
    // isAuthenticated === true y cambia solo hacia RoleSelection → Main.
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── LOGO ── */}
        <View style={s.header}>
          <Image
            source={require('../assets/logo-horizontal.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={s.title}>Bienvenido de nuevo</Text>
        <Text style={s.subtitle}>Inicia sesión para continuar</Text>

        <AuthToggle
          active="login"
          onChange={tab => { if (tab === 'register') { navigation.replace('Register'); } }}
        />

        {/* ── FORM ── */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>Correo electrónico</Text>
          <View style={[s.inputWrap, errors.email && s.inputError]}>
            <Mail size={18} color={COLORS.gray400} />
            <TextInput
              style={s.input}
              placeholder="correo@ejemplo.com"
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

        <View style={s.fieldWrap}>
          <Text style={s.label}>Contraseña</Text>
          <View style={[s.inputWrap, errors.password && s.inputError]}>
            <Lock size={18} color={COLORS.gray400} />
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.gray400}
              value={password}
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)}>
              {showPass
                ? <EyeOff size={18} color={COLORS.gray400} />
                : <Eye size={18} color={COLORS.gray400} />}
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={s.errorTxt}>{errors.password}</Text> : null}
        </View>

        <TouchableOpacity
          style={s.forgotWrap}
          onPress={() => Alert.alert(
            'Recuperar contraseña',
            'Te enviaremos un email para restablecer tu contraseña.\n\nPróximamente disponible.',
          )}>
          <Text style={s.forgotTxt}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={s.loginBtnTxt}>Iniciar sesión</Text>}
        </TouchableOpacity>

        {/* ── DIVIDER ── */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerTxt}>o continúa con</Text>
          <View style={s.dividerLine} />
        </View>

        {/* ── GOOGLE — pendiente de implementar ── */}
        <TouchableOpacity
          style={s.googleBtn}
          onPress={() => Alert.alert('Muy pronto', 'El inicio de sesión con Google estará disponible próximamente.')}
          activeOpacity={0.8}>
          <Text style={s.googleG}>G</Text>
          <Text style={s.googleTxt}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* ── REGISTRO ── */}
        <View style={s.registerWrap}>
          <Text style={s.registerTxt}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Register')}>
            <Text style={s.registerLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  logo: { width: 220, height: 146 },
  title: { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, textAlign: 'center', marginTop: 4, marginBottom: SPACING.xl },
  fieldWrap: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray400, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.blackSoft, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 13, gap: 10, backgroundColor: COLORS.blackSoft },
  inputError: { borderColor: COLORS.red },
  input: { flex: 1, fontSize: 15, color: COLORS.white, padding: 0 },
  errorTxt: { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: SPACING.lg, marginTop: 2 },
  forgotTxt: { fontSize: 13, color: COLORS.primary, fontWeight: FONT.bold },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 6,
  },
  loginBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: FONT.black, letterSpacing: 0.2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: SPACING.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.blackSoft },
  dividerTxt: { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },
  googleBtn: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: COLORS.blackSoft, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  googleG: { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  googleTxt: { fontSize: 15, color: COLORS.white, fontWeight: FONT.bold },
  registerWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  registerTxt: { fontSize: 14, color: COLORS.gray400 },
  registerLink: { fontSize: 14, color: COLORS.primary, fontWeight: FONT.black },
});