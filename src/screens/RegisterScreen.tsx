// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { useAuth, RegisterData } from '../context';

// ── Opciones de género ─────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'male',   label: 'Hombre', icon: '👨' },
  { value: 'female', label: 'Mujer',  icon: '👩' },
  { value: 'other',  label: 'Otro',   icon: '🧑' },
] as const;

export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [gender,    setGender]    = useState<'male' | 'female' | 'other'>('male');
  const [isSeller,  setIsSeller]  = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  // ── Validación ────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())                   { errs.name     = 'El nombre es requerido'; }
    else if (name.trim().length < 3)    { errs.name     = 'Mínimo 3 caracteres'; }
    if (!email.trim())                  { errs.email    = 'El email es requerido'; }
    else if (!email.includes('@'))      { errs.email    = 'Email inválido'; }
    if (!password)                      { errs.password = 'La contraseña es requerida'; }
    else if (password.length < 8)       { errs.password = 'Mínimo 8 caracteres'; }
    if (password !== password2)         { errs.password2 = 'Las contraseñas no coinciden'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Registro ──────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) { return; }
    setLoading(true);

    const data: RegisterData = {
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      password,
      gender,
      isSeller,
      phone:    phone.trim() || undefined,
    };

    const result = await register(data);
    setLoading(false);

    if (result.error) {
      Alert.alert('Error al registrarse', result.error);
    } else {
      Alert.alert(
        '¡Cuenta creada! 🎉',
        'Te enviamos un email de confirmación. Revisa tu bandeja de entrada y confirma tu cuenta para poder ingresar.',
        [{ text: 'Entendido', onPress: () => navigation.navigate('Login') }],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 10 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.title}>Crear cuenta</Text>
          <Text style={s.subtitle}>Únete a KaifMarket 🇵🇪</Text>
        </View>

        {/* ── SELECCIÓN DE GÉNERO ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>¿Cómo te identificas?</Text>
          <View style={s.genderRow}>
            {GENDER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.genderOpt, gender === opt.value && s.genderOptActive]}
                onPress={() => setGender(opt.value)}
                activeOpacity={0.8}>
                <Text style={s.genderIcon}>{opt.icon}</Text>
                <Text style={[s.genderLabel, gender === opt.value && s.genderLabelActive]}>
                  {opt.label}
                </Text>
                {gender === opt.value && (
                  <View style={s.genderCheck}>
                    <Text style={{ color: COLORS.white, fontSize: 10 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── DATOS PERSONALES ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Tus datos</Text>

          {/* Nombre */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Nombre completo *</Text>
            <View style={[s.inputWrap, errors.name && s.inputError]}>
              <Text style={s.inputIcon}>
                {gender === 'male' ? '👨' : gender === 'female' ? '👩' : '🧑'}
              </Text>
              <TextInput
                style={s.input}
                placeholder="Tu nombre completo"
                placeholderTextColor={COLORS.gray400}
                value={name}
                onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
                autoCapitalize="words"
              />
            </View>
            {errors.name ? <Text style={s.errorTxt}>{errors.name}</Text> : null}
          </View>

          {/* Email */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Email *</Text>
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

          {/* Teléfono (opcional) */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Teléfono <Text style={s.optional}>(opcional)</Text></Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>📱</Text>
              <TextInput
                style={s.input}
                placeholder="+51 999 999 999"
                placeholderTextColor={COLORS.gray400}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Contraseña *</Text>
            <View style={[s.inputWrap, errors.password && s.inputError]}>
              <Text style={s.inputIcon}>🔒</Text>
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
                <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errorTxt}>{errors.password}</Text> : null}

            {/* Indicador de seguridad */}
            {password.length > 0 && (
              <View style={s.strengthWrap}>
                <View style={[s.strengthBar, {
                  backgroundColor:
                    password.length < 6 ? COLORS.red :
                    password.length < 10 ? COLORS.amber : COLORS.green,
                  width: `${Math.min(password.length * 8, 100)}%` as any,
                }]} />
                <Text style={s.strengthTxt}>
                  {password.length < 6 ? 'Débil' :
                   password.length < 10 ? 'Media' : 'Fuerte ✓'}
                </Text>
              </View>
            )}
          </View>

          {/* Confirmar contraseña */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Confirmar contraseña *</Text>
            <View style={[s.inputWrap, errors.password2 && s.inputError]}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor={COLORS.gray400}
                value={password2}
                onChangeText={t => { setPassword2(t); setErrors(e => ({ ...e, password2: '' })); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              {password2.length > 0 && (
                <Text style={{ fontSize: 18 }}>
                  {password === password2 ? '✅' : '❌'}
                </Text>
              )}
            </View>
            {errors.password2 ? <Text style={s.errorTxt}>{errors.password2}</Text> : null}
          </View>
        </View>

        {/* ── ¿ERES VENDEDOR? ── */}
        <View style={s.card}>
          <View style={s.sellerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.sellerTitle}>🏪 ¿Quieres vender en KaifMarket?</Text>
              <Text style={s.sellerSub}>
                Activa esto si además de comprar quieres publicar tus productos
              </Text>
            </View>
            <Switch
              value={isSeller}
              onValueChange={setIsSeller}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          {isSeller && (
            <View style={s.sellerInfo}>
              <Text style={s.sellerInfoTxt}>
                ✓ Listado gratuito de productos{'\n'}
                ✓ Comisión solo cuando vendas{'\n'}
                ✓ Plan Premium disponible: S/ 55–80/mes
              </Text>
            </View>
          )}
        </View>

        {/* ── BOTÓN REGISTRO ── */}
        <TouchableOpacity
          style={[s.registerBtn, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={s.registerBtnTxt}>Crear mi cuenta →</Text>}
        </TouchableOpacity>

        {/* ── YA TENGO CUENTA ── */}
        <View style={s.loginWrap}>
          <Text style={s.loginTxt}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.gray50 },
  content:         { paddingHorizontal: SPACING.lg, paddingBottom: 20 },
  header:          { marginBottom: SPACING.lg },
  backBtn:         { width: 36, height: 36, backgroundColor: COLORS.white, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  backTxt:         { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  title:           { fontSize: 26, fontWeight: FONT.black, color: COLORS.gray800, letterSpacing: -0.5 },
  subtitle:        { fontSize: 14, color: COLORS.gray400, fontWeight: FONT.semibold, marginTop: 4 },
  card:            { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  sectionTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  genderRow:       { flexDirection: 'row', gap: 10 },
  genderOpt:       { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.gray50, position: 'relative' },
  genderOptActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  genderIcon:      { fontSize: 28, marginBottom: 4 },
  genderLabel:     { fontSize: 12, fontWeight: FONT.bold, color: COLORS.gray600 },
  genderLabelActive: { color: COLORS.primary },
  genderCheck:     { position: 'absolute', top: 6, right: 6, width: 18, height: 18, backgroundColor: COLORS.primary, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  fieldWrap:       { marginBottom: SPACING.md },
  label:           { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray600, marginBottom: 6 },
  optional:        { fontWeight: FONT.regular, color: COLORS.gray400 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, gap: 10, backgroundColor: COLORS.gray50 },
  inputError:      { borderColor: COLORS.red },
  input:           { flex: 1, fontSize: 15, color: COLORS.gray800, padding: 0 },
  inputIcon:       { fontSize: 18 },
  errorTxt:        { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  strengthWrap:    { marginTop: 6 },
  strengthBar:     { height: 4, borderRadius: 2, marginBottom: 4 },
  strengthTxt:     { fontSize: 11, color: COLORS.gray400 },
  sellerRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerTitle:     { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: 4 },
  sellerSub:       { fontSize: 12, color: COLORS.gray400, lineHeight: 17 },
  sellerInfo:      { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  sellerInfoTxt:   { fontSize: 13, color: COLORS.primaryDark, fontWeight: FONT.semibold, lineHeight: 22 },
  registerBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', marginBottom: SPACING.md, ...SHADOW.strong },
  registerBtnTxt:  { color: COLORS.white, fontSize: 16, fontWeight: FONT.black, letterSpacing: 0.3 },
  loginWrap:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginTxt:        { fontSize: 14, color: COLORS.gray400 },
  loginLink:       { fontSize: 14, color: COLORS.primary, fontWeight: FONT.black },
});
