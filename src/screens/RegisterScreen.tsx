// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User as UserIcon, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth, RegisterData } from '../context';
import AuthToggle from '../components/AuthToggle';

// NOTA: género, teléfono y el switch "¿quieres vender?" salen de este
// formulario — ahora la elección de rol (Comprador/Vendedor/Transportista)
// se hace en RoleSelectionScreen justo después de iniciar sesión.
// El registro solo pide lo esencial para crear la cuenta (imagen 3).

export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())                { errs.name     = 'El nombre es requerido'; }
    else if (name.trim().length < 3) { errs.name     = 'Mínimo 3 caracteres'; }
    if (!email.trim())               { errs.email    = 'El email es requerido'; }
    else if (!email.includes('@'))   { errs.email    = 'Email inválido'; }
    if (!password)                   { errs.password = 'La contraseña es requerida'; }
    else if (password.length < 8)    { errs.password = 'Mínimo 8 caracteres'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) { return; }
    setLoading(true);

    const data: RegisterData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    const result = await register(data);
    setLoading(false);

    if (result.error) {
      Alert.alert('Error al registrarse', result.error);
      return;
    }

    // Cuenta creada → pantalla de éxito (imagen 2), ya no Alert.
    navigation.replace('RegisterSuccess');
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

        <Text style={s.title}>Crear cuenta</Text>
        <Text style={s.subtitle}>Únete a KaifMarket hoy</Text>

        <AuthToggle
          active="register"
          onChange={tab => { if (tab === 'login') { navigation.replace('Login'); } }}
        />

        {/* ── FORM ── */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>Nombre completo</Text>
          <View style={[s.inputWrap, errors.name && s.inputError]}>
            <UserIcon size={18} color={COLORS.gray400} />
            <TextInput
              style={s.input}
              placeholder="Carlos Mendoza"
              placeholderTextColor={COLORS.gray400}
              value={name}
              onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
              autoCapitalize="words"
            />
          </View>
          {errors.name ? <Text style={s.errorTxt}>{errors.name}</Text> : null}
        </View>

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
              placeholder="Mínimo 8 caracteres"
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
          style={[s.registerBtn, loading && { opacity: 0.7 }, { marginTop: SPACING.sm }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={s.registerBtnTxt}>Crear mi cuenta</Text>}
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
          onPress={() => Alert.alert('Muy pronto', 'El registro con Google estará disponible próximamente.')}
          activeOpacity={0.8}>
          <Text style={s.googleG}>G</Text>
          <Text style={s.googleTxt}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* ── LOGIN ── */}
        <View style={s.loginWrap}>
          <Text style={s.loginTxt}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={s.loginLink}>Inicia sesión</Text>
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
  header: { alignItems: 'center', marginBottom: SPACING.md },
  logo: { width: 220, height: 146 },
  title: { fontSize: 22, fontWeight: FONT.black, color: COLORS.white, textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, textAlign: 'center', marginTop: 4, marginBottom: SPACING.xl },
  fieldWrap: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray400, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.blackSoft, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 13, gap: 10, backgroundColor: COLORS.blackSoft },
  inputError: { borderColor: COLORS.red },
  input: { flex: 1, fontSize: 15, color: COLORS.white, padding: 0 },
  errorTxt: { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 6,
  },
  registerBtnTxt: { color: COLORS.white, fontSize: 16, fontWeight: FONT.black, letterSpacing: 0.2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: SPACING.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.blackSoft },
  dividerTxt: { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },
  googleBtn: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: COLORS.blackSoft, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  googleG: { fontSize: 16, fontWeight: FONT.black, color: COLORS.white },
  googleTxt: { fontSize: 15, color: COLORS.white, fontWeight: FONT.bold },
  loginWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  loginTxt: { fontSize: 14, color: COLORS.gray400 },
  loginLink: { fontSize: 14, color: COLORS.primary, fontWeight: FONT.black },
});