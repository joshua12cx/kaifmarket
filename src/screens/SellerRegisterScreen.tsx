// src/screens/SellerRegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, StatusBar, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {
  ChevronLeft, ChevronRight, Store, User as UserIcon, Upload, Tag,
  FileText, Clock, Check, Plus, X, ShieldAlert,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { id: 'electro', label: 'Electrónica' },
  { id: 'hogar',   label: 'Hogar'       },
  { id: 'moda',    label: 'Moda'        },
  { id: 'belleza', label: 'Belleza'     },
  { id: 'deporte', label: 'Deporte'     },
  { id: 'otros',   label: 'Otros'       },
];

// ══════════════════════════════════════════════════════════════════
//  WIZARD DE 4 PASOS — Personal → Negocio → Pago → Documentos
//  Cada paso guarda en un solo objeto `form` compartido; recién al
//  final (paso 4) se sube todo a Storage y se hace el INSERT real.
// ══════════════════════════════════════════════════════════════════

const STEPS = ['Información Personal', 'Datos del Negocio', 'Datos de Pago', 'Documentos'];

export default function SellerRegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // ── Formulario compartido entre los 4 pasos ────────────────────
  const [form, setForm] = useState({
    // Paso 1
    fullName: user?.name || '',
    dni: '',
    phone: user?.phone || '',
    email: user?.email || '',
    personalAddress: '',
    profilePhotoUri: null as string | null,
    // Paso 2
    storeName: '',
    category: '',
    businessDescription: '',
    ruc: '',
    businessAddress: '',
    businessHours: '',
    logoUri: null as string | null,
    // Paso 3
    bankAccount: '',
    cci: '',
    yapeNumber: '',
    plinNumber: '',
    preferredPaymentMethod: '' as '' | 'bank_transfer' | 'yape' | 'plin',
    // Paso 4
    dniFrontUri: null as string | null,
    dniBackUri:  null as string | null,
    rucDocUri:   null as string | null,
    rucDocType:  null as 'image' | 'pdf' | null,
    storePhotos: [] as string[],
    licenseUri:  null as string | null,
    termsAccepted: false,
  });

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const pickProfilePhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 500, maxHeight: 500 });
    if (result.assets?.[0]?.uri) { setField('profilePhotoUri', result.assets[0].uri); }
  };

  const pickLogo = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 500, maxHeight: 500 });
    if (result.assets?.[0]?.uri) { setField('logoUri', result.assets[0].uri); }
  };

  const PAYMENT_METHODS: { id: 'bank_transfer' | 'yape' | 'plin'; label: string }[] = [
    { id: 'bank_transfer', label: 'Transferencia bancaria' },
    { id: 'yape',           label: 'Yape' },
    { id: 'plin',           label: 'Plin' },
  ];
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const selectPaymentMethod = (id: 'bank_transfer' | 'yape' | 'plin') => {
    setField('preferredPaymentMethod', id);
    setErrors(e => ({ ...e, preferredPaymentMethod: '' }));
    setPaymentModalOpen(false);
  };

  // ── DNI (ambos lados) — solo foto ──────────────────────────────
  const pickDniSide = async (side: 'dniFrontUri' | 'dniBackUri') => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (result.assets?.[0]?.uri) { setField(side, result.assets[0].uri); }
  };

  // ── Ficha RUC — foto o PDF ──────────────────────────────────────
  // ── Modal propio "Foto o PDF" — reutilizado por RUC y Licencia ──
  const [fileTypeModal, setFileTypeModal] = useState<null | 'ruc' | 'license'>(null);
  const pickRucDoc = () => setFileTypeModal('ruc');
  const pickLicense = () => setFileTypeModal('license');

  const handlePickPhotoFor = async (target: 'ruc' | 'license') => {
    setFileTypeModal(null);
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (!result.assets?.[0]?.uri) { return; }
    if (target === 'ruc') { setField('rucDocUri', result.assets[0].uri); setField('rucDocType', 'image'); setErrors(e => ({ ...e, rucDocUri: '' })); }
    else { setField('licenseUri', result.assets[0].uri); }
  };

  const handlePickPdfFor = async (target: 'ruc' | 'license') => {
    setFileTypeModal(null);
    try {
      const [result] = await pick({ type: [types.pdf], copyTo: 'cachesDirectory' });
      if (target === 'ruc') { setField('rucDocUri', result.uri); setField('rucDocType', 'pdf'); setErrors(e => ({ ...e, rucDocUri: '' })); }
      else { setField('licenseUri', result.uri); }
    } catch (e: any) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) { return; }
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  // ── Fotos de la tienda — mínimo 3, se van agregando ────────────
  const addStorePhoto = async () => {
    if (form.storePhotos.length >= 6) {
      Alert.alert('Máximo alcanzado', 'Puedes subir hasta 6 fotos de tu tienda.');
      return;
    }
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (result.assets?.[0]?.uri) {
      setField('storePhotos', [...form.storePhotos, result.assets[0].uri]);
      setErrors(e => ({ ...e, storePhotos: '' }));
    }
  };
  const removeStorePhoto = (uri: string) => {
    setField('storePhotos', form.storePhotos.filter(p => p !== uri));
  };

  // ── Subir cualquier archivo (imagen o pdf) a Storage ───────────
  const uploadFile = async (uri: string, prefix: string, ext: string, contentType: string): Promise<string | null> => {
    try {
      const cleanUri = uri.replace('file://', '');
      const base64 = await RNFS.readFile(cleanUri, 'base64');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) { lookup[chars.charCodeAt(i)] = i; }
      const b64 = base64.replace(/=/g, '');
      const len = b64.length;
      const bytes = new Uint8Array(Math.floor((len * 3) / 4));
      let j = 0;
      for (let i = 0; i < len; i += 4) {
        const a = lookup[b64.charCodeAt(i)], b = lookup[b64.charCodeAt(i + 1)];
        const c = lookup[b64.charCodeAt(i + 2)], d = lookup[b64.charCodeAt(i + 3)];
        bytes[j++] = (a << 2) | (b >> 4);
        if (i + 2 < len) { bytes[j++] = ((b & 15) << 4) | (c >> 2); }
        if (i + 3 < len) { bytes[j++] = ((c & 3) << 6) | d; }
      }
      const fileName = `${prefix}_${user?.id}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('sellers').upload(fileName, bytes, { contentType, upsert: true });
      if (error) { if (__DEV__) { console.log('[SELLER_WIZARD] upload error:', error); } return null; }
      const { data } = supabase.storage.from('sellers').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      if (__DEV__) { console.log('[SELLER_WIZARD] upload exception:', e); }
      return null;
    }
  };

  const validateStep4 = () => {
    const errs: Record<string, string> = {};
    if (!form.dniFrontUri) { errs.dniFrontUri = 'Falta la foto del DNI (frente)'; }
    if (!form.dniBackUri)  { errs.dniBackUri  = 'Falta la foto del DNI (reverso)'; }
    if (!form.rucDocUri)   { errs.rucDocUri   = 'Falta la Ficha RUC'; }
    if (form.storePhotos.length < 3) { errs.storePhotos = 'Sube al menos 3 fotos de tu tienda'; }
    if (!form.termsAccepted) { errs.terms = 'Debes aceptar los Términos y la Política de Vendedores'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Enviar solicitud — sube todo y hace el INSERT real ─────────
  const submit = async () => {
    if (!validateStep4() || !user?.id) { return; }
    setSubmitting(true);
    try {
      const [profilePhotoUrl, logoUrl, dniFrontUrl, dniBackUrl, licenseUrl] = await Promise.all([
        form.profilePhotoUri ? uploadFile(form.profilePhotoUri, 'profile', 'jpg', 'image/jpeg') : Promise.resolve(null),
        form.logoUri          ? uploadFile(form.logoUri, 'logo', 'jpg', 'image/jpeg')            : Promise.resolve(null),
        uploadFile(form.dniFrontUri!, 'dni_front', 'jpg', 'image/jpeg'),
        uploadFile(form.dniBackUri!, 'dni_back', 'jpg', 'image/jpeg'),
        form.licenseUri        ? uploadFile(form.licenseUri, 'license', 'jpg', 'image/jpeg')      : Promise.resolve(null),
      ]);

      const rucUrl = form.rucDocType === 'pdf'
        ? await uploadFile(form.rucDocUri!, 'ruc', 'pdf', 'application/pdf')
        : await uploadFile(form.rucDocUri!, 'ruc', 'jpg', 'image/jpeg');

      if (!dniFrontUrl || !dniBackUrl || !rucUrl) {
        Alert.alert('Error', 'No se pudieron subir algunos documentos. Verifica tu conexión e intenta de nuevo.');
        setSubmitting(false);
        return;
      }

      const { data: sellerRow, error } = await supabase.from('sellers').insert({
        user_id: user.id,
        name: form.storeName.trim(),
        description: form.businessDescription.trim(),
        category: form.category,
        location: form.businessAddress.trim(),
        phone: form.phone.trim() || null,
        logo_url: logoUrl,
        dni_ruc: form.dni.trim(), // compat con el campo viejo
        document_url: rucUrl,     // compat con el campo viejo
        dni: form.dni.trim(),
        personal_address: form.personalAddress.trim(),
        profile_photo_url: profilePhotoUrl,
        ruc: form.ruc.trim(),
        business_hours: form.businessHours.trim() || null,
        bank_account: form.bankAccount.trim() || null,
        cci: form.cci.trim() || null,
        yape_number: form.yapeNumber.trim() || null,
        plin_number: form.plinNumber.trim() || null,
        preferred_payment_method: form.preferredPaymentMethod || null,
        dni_front_url: dniFrontUrl,
        dni_back_url: dniBackUrl,
        ruc_document_url: rucUrl,
        business_license_url: licenseUrl,
        terms_accepted_at: new Date().toISOString(),
        status: 'pending',
        is_premium: false,
        is_verified: false,
        rating: 5.0,
        total_sales: 0,
        followers: 0,
      }).select().single();

      if (error || !sellerRow) {
        if (__DEV__) { console.log('[SELLER_WIZARD] insert error:', error); }
        Alert.alert('Error', 'No se pudo enviar tu solicitud. Intenta de nuevo.');
        setSubmitting(false);
        return;
      }

      // Fotos de la tienda (tabla aparte, ya con el seller.id real)
      await supabase.from('seller_store_photos').insert(
        await Promise.all(form.storePhotos.map(async uri => ({
          seller_id: sellerRow.id,
          photo_url: await uploadFile(uri, 'store', 'jpg', 'image/jpeg'),
        }))),
      );

      await supabase.from('users').update({ is_seller: true }).eq('id', user.id);
      updateUser({ is_seller: true });
      // NOTA: ya no hace falta el upsert manual a user_roles — el
      // trigger trg_sync_seller_role lo hace solo al insertar en sellers.

      setSubmitting(false);
      navigation.replace('SellerApplicationSuccess');
    } catch (e) {
      if (__DEV__) { console.log('[SELLER_WIZARD] submit error:', e); }
      setSubmitting(false);
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    }
  };

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const selectCategory = (id: string) => {
    setField('category', id);
    setErrors(e => ({ ...e, category: '' }));
    setCategoryModalOpen(false);
  };

  // ── Validación del paso 1 ───────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim())            { errs.fullName = 'El nombre es requerido'; }
    if (!form.dni.trim())                 { errs.dni      = 'El DNI es requerido'; }
    else if (form.dni.trim().length !== 8) { errs.dni     = 'El DNI debe tener 8 dígitos'; }
    if (!form.phone.trim())               { errs.phone    = 'El teléfono es requerido'; }
    if (!form.email.trim())               { errs.email    = 'El correo es requerido'; }
    else if (!form.email.includes('@'))   { errs.email    = 'Correo inválido'; }
    if (!form.personalAddress.trim())     { errs.personalAddress = 'La dirección es requerida'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.storeName.trim())    { errs.storeName    = 'El nombre de la tienda es requerido'; }
    if (!form.category)            { errs.category     = 'Selecciona una categoría'; }
    if (!form.businessDescription.trim()) { errs.businessDescription = 'La descripción es requerida'; }
    if (!form.ruc.trim())          { errs.ruc          = 'El RUC es requerido'; }
    else if (form.ruc.trim().length !== 11) { errs.ruc = 'El RUC debe tener 11 dígitos'; }
    if (!form.businessAddress.trim()) { errs.businessAddress = 'La dirección comercial es requerida'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!form.preferredPaymentMethod) {
      errs.preferredPaymentMethod = 'Selecciona cómo prefieres que te depositemos';
    } else if (form.preferredPaymentMethod === 'bank_transfer') {
      if (!form.bankAccount.trim()) { errs.bankAccount = 'La cuenta bancaria es requerida'; }
      if (!form.cci.trim())         { errs.cci         = 'El CCI es requerido'; }
    } else if (form.preferredPaymentMethod === 'yape' && !form.yapeNumber.trim()) {
      errs.yapeNumber = 'Tu número de Yape es requerido';
    } else if (form.preferredPaymentMethod === 'plin' && !form.plinNumber.trim()) {
      errs.plinNumber = 'Tu número de Plin es requerido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) { return; }
    if (step === 2 && !validateStep2()) { return; }
    if (step === 3 && !validateStep3()) { return; }
    if (step < 4) { setStep(step + 1); }
  };
  const goBack = () => {
    if (step > 1) { setStep(step - 1); }
    else { navigation.goBack(); }
  };

  return (
    <View style={[w.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* ── HEADER ── */}
      <View style={w.header}>
        <TouchableOpacity style={w.backBtn} onPress={goBack}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={w.headerTitle}>Registro de Vendedor</Text>
          <Text style={w.headerSub}>{STEPS[step - 1]}</Text>
        </View>
        <View style={w.storeIconWrap}>
          <Store size={16} color={COLORS.gold} strokeWidth={2} />
        </View>
      </View>

      {/* ── BARRA DE PROGRESO ── */}
      <View style={w.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[w.progressBar, i < step && w.progressBarDone]} />
        ))}
      </View>
      <Text style={w.stepLabel}>Paso {step} de 4</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled">

        {step === 1 && (
          <>
            {/* ── FOTO DE PERFIL ── */}
            <View style={w.photoWrap}>
              <TouchableOpacity style={w.photoCircle} onPress={pickProfilePhoto} activeOpacity={0.8}>
                {form.profilePhotoUri ? (
                  <Image source={{ uri: form.profilePhotoUri }} style={w.photoImg} />
                ) : (
                  <UserIcon size={32} color={COLORS.gray600} strokeWidth={1.5} />
                )}
                <View style={w.photoUploadBadge}>
                  <Upload size={12} color={COLORS.black} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
              <Text style={w.photoHint}>Foto de perfil (opcional)</Text>
            </View>

            <Field label="Nombre completo" error={errors.fullName}>
              <TextInput
                style={w.input}
                placeholder="Carlos Mendoza"
                placeholderTextColor={COLORS.gray600}
                value={form.fullName}
                onChangeText={t => { setField('fullName', t); setErrors(e => ({ ...e, fullName: '' })); }}
                autoCapitalize="words"
              />
            </Field>

            <Field label="DNI" error={errors.dni}>
              <TextInput
                style={w.input}
                placeholder="12345678"
                placeholderTextColor={COLORS.gray600}
                value={form.dni}
                onChangeText={t => { setField('dni', t.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, dni: '' })); }}
                keyboardType="number-pad"
                maxLength={8}
              />
            </Field>

            <Field label="Teléfono" error={errors.phone}>
              <TextInput
                style={w.input}
                placeholder="+51 999 999 999"
                placeholderTextColor={COLORS.gray600}
                value={form.phone}
                onChangeText={t => { setField('phone', t); setErrors(e => ({ ...e, phone: '' })); }}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Correo electrónico" error={errors.email}>
              <TextInput
                style={w.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={COLORS.gray600}
                value={form.email}
                onChangeText={t => { setField('email', t); setErrors(e => ({ ...e, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Field>

            <Field label="Dirección" error={errors.personalAddress}>
              <TextInput
                style={w.input}
                placeholder="Av. Principal 123, Lima"
                placeholderTextColor={COLORS.gray600}
                value={form.personalAddress}
                onChangeText={t => { setField('personalAddress', t); setErrors(e => ({ ...e, personalAddress: '' })); }}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Nombre de la tienda" error={errors.storeName}>
              <TextInput
                style={w.input}
                placeholder="Mi Tienda Online"
                placeholderTextColor={COLORS.gray600}
                value={form.storeName}
                onChangeText={t => { setField('storeName', t); setErrors(e => ({ ...e, storeName: '' })); }}
                autoCapitalize="words"
              />
            </Field>

            <Text style={w.label}>Categoría del negocio</Text>
            <TouchableOpacity
              style={[w.pickerRow, errors.category && w.inputWrapError]}
              onPress={() => setCategoryModalOpen(true)}
              activeOpacity={0.8}>
              <Tag size={16} color={COLORS.gray600} strokeWidth={2} />
              <Text style={[w.pickerTxt, form.category && { color: COLORS.white }]}>
                {form.category ? CATEGORIES.find(c => c.id === form.category)?.label : 'Selecciona una categoría'}
              </Text>
              <ChevronRight size={16} color={COLORS.gray600} strokeWidth={2} />
            </TouchableOpacity>
            {errors.category ? <Text style={w.errorTxt}>{errors.category}</Text> : null}

            <Field label="Descripción del negocio" error={errors.businessDescription}>
              <TextInput
                style={[w.input, w.textarea]}
                placeholder="Describe tu tienda y los productos que ofreces..."
                placeholderTextColor={COLORS.gray600}
                value={form.businessDescription}
                onChangeText={t => { setField('businessDescription', t); setErrors(e => ({ ...e, businessDescription: '' })); }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Field>

            <Field label="RUC" error={errors.ruc}>
              <TextInput
                style={w.input}
                placeholder="20123456789"
                placeholderTextColor={COLORS.gray600}
                value={form.ruc}
                onChangeText={t => { setField('ruc', t.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, ruc: '' })); }}
                keyboardType="number-pad"
                maxLength={11}
              />
            </Field>

            <Field label="Dirección comercial" error={errors.businessAddress}>
              <TextInput
                style={w.input}
                placeholder="Jr. Comercio 456, Lima"
                placeholderTextColor={COLORS.gray600}
                value={form.businessAddress}
                onChangeText={t => { setField('businessAddress', t); setErrors(e => ({ ...e, businessAddress: '' })); }}
              />
            </Field>

            <Field label="Horario de atención">
              <View style={w.hoursRow}>
                <Clock size={16} color={COLORS.gray600} strokeWidth={2} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[w.input, { flex: 1 }]}
                  placeholder="Lun–Sáb 9:00–18:00"
                  placeholderTextColor={COLORS.gray600}
                  value={form.businessHours}
                  onChangeText={t => setField('businessHours', t)}
                />
              </View>
            </Field>

            <Text style={w.label}>Logo de la tienda</Text>
            <TouchableOpacity style={w.logoRow} onPress={pickLogo} activeOpacity={0.8}>
              {form.logoUri ? (
                <Image source={{ uri: form.logoUri }} style={w.logoPreview} />
              ) : (
                <View style={w.logoPlaceholder}>
                  <Store size={20} color={COLORS.gray600} strokeWidth={1.8} />
                </View>
              )}
              <Text style={w.logoRowTxt}>
                {form.logoUri ? 'Toca para cambiar el logo' : 'Toca para subir el logo (opcional)'}
              </Text>
              <Upload size={16} color={COLORS.gold} strokeWidth={2} />
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Número de cuenta bancaria" error={errors.bankAccount}>
              <TextInput
                style={w.input}
                placeholder="123-456-789012"
                placeholderTextColor={COLORS.gray600}
                value={form.bankAccount}
                onChangeText={t => { setField('bankAccount', t); setErrors(e => ({ ...e, bankAccount: '' })); }}
                keyboardType="number-pad"
              />
            </Field>

            <Field label="CCI (Código de Cuenta Interbancario)" error={errors.cci}>
              <TextInput
                style={w.input}
                placeholder="00212312345678901234"
                placeholderTextColor={COLORS.gray600}
                value={form.cci}
                onChangeText={t => { setField('cci', t.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, cci: '' })); }}
                keyboardType="number-pad"
                maxLength={20}
              />
            </Field>

            <Field label="Número de Yape" error={errors.yapeNumber}>
              <TextInput
                style={w.input}
                placeholder="+51 999 999 999"
                placeholderTextColor={COLORS.gray600}
                value={form.yapeNumber}
                onChangeText={t => { setField('yapeNumber', t); setErrors(e => ({ ...e, yapeNumber: '' })); }}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Número de Plin" error={errors.plinNumber}>
              <TextInput
                style={w.input}
                placeholder="+51 999 999 999"
                placeholderTextColor={COLORS.gray600}
                value={form.plinNumber}
                onChangeText={t => { setField('plinNumber', t); setErrors(e => ({ ...e, plinNumber: '' })); }}
                keyboardType="phone-pad"
              />
            </Field>

            <Text style={w.label}>Método de pago preferido</Text>
            <TouchableOpacity
              style={[w.pickerRow, errors.preferredPaymentMethod && w.inputWrapError]}
              onPress={() => setPaymentModalOpen(true)}
              activeOpacity={0.8}>
              <Text style={{ fontSize: 16 }}>💵</Text>
              <Text style={[w.pickerTxt, form.preferredPaymentMethod && { color: COLORS.white }]}>
                {form.preferredPaymentMethod
                  ? PAYMENT_METHODS.find(m => m.id === form.preferredPaymentMethod)?.label
                  : 'Elige cómo prefieres que te depositemos'}
              </Text>
              <ChevronRight size={16} color={COLORS.gray600} strokeWidth={2} />
            </TouchableOpacity>
            {errors.preferredPaymentMethod ? <Text style={w.errorTxt}>{errors.preferredPaymentMethod}</Text> : null}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={w.label}>DNI (ambos lados)</Text>
            <View style={w.dniRow}>
              <TouchableOpacity style={w.dniSlot} onPress={() => pickDniSide('dniFrontUri')} activeOpacity={0.8}>
                {form.dniFrontUri ? (
                  <Image source={{ uri: form.dniFrontUri }} style={w.dniImg} />
                ) : (
                  <>
                    <Upload size={20} color={COLORS.gray600} strokeWidth={2} />
                    <Text style={w.dniSlotTxt}>Frente</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={w.dniSlot} onPress={() => pickDniSide('dniBackUri')} activeOpacity={0.8}>
                {form.dniBackUri ? (
                  <Image source={{ uri: form.dniBackUri }} style={w.dniImg} />
                ) : (
                  <>
                    <Upload size={20} color={COLORS.gray600} strokeWidth={2} />
                    <Text style={w.dniSlotTxt}>Reverso</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {(errors.dniFrontUri || errors.dniBackUri) ? <Text style={w.errorTxt}>Imagen clara y legible de ambos lados</Text> : null}

            <TouchableOpacity style={[w.docRow, errors.rucDocUri && w.inputWrapError]} onPress={pickRucDoc} activeOpacity={0.8}>
              <FileText size={18} color={form.rucDocUri ? COLORS.green : COLORS.gray600} strokeWidth={2} />
              <Text style={w.docRowTxt}>
                {form.rucDocUri ? 'Ficha RUC cargada ✓ — toca para cambiar' : 'Ficha RUC de SUNAT'}
              </Text>
              <Upload size={16} color={COLORS.gold} strokeWidth={2} />
            </TouchableOpacity>
            {errors.rucDocUri ? <Text style={w.errorTxt}>{errors.rucDocUri}</Text> : null}

            <Text style={[w.label, { marginTop: SPACING.md }]}>
              Fotos de la tienda <Text style={w.optionalTxt}>(mínimo 3)</Text>
            </Text>
            <View style={w.photosGrid}>
              {form.storePhotos.map(uri => (
                <View key={uri} style={w.storePhotoWrap}>
                  <Image source={{ uri }} style={w.storePhotoImg} />
                  <TouchableOpacity style={w.storePhotoRemove} onPress={() => removeStorePhoto(uri)}>
                    <X size={12} color={COLORS.white} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              {form.storePhotos.length < 6 && (
                <TouchableOpacity style={w.storePhotoAdd} onPress={addStorePhoto} activeOpacity={0.8}>
                  <Plus size={20} color={COLORS.gray600} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
            {errors.storePhotos ? <Text style={w.errorTxt}>{errors.storePhotos}</Text> : null}

            <TouchableOpacity style={[w.docRow, { marginTop: SPACING.md }]} onPress={pickLicense} activeOpacity={0.8}>
              <FileText size={18} color={form.licenseUri ? COLORS.green : COLORS.gray600} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={w.docRowTxt}>
                  {form.licenseUri ? 'Licencia cargada ✓' : 'Licencia de funcionamiento'}
                </Text>
                <Text style={w.optionalTxt}>Opcional</Text>
              </View>
              <Upload size={16} color={COLORS.gold} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={w.termsRow}
              onPress={() => { setField('termsAccepted', !form.termsAccepted); setErrors(e => ({ ...e, terms: '' })); }}
              activeOpacity={0.8}>
              <View style={[w.checkbox, form.termsAccepted && w.checkboxActive]}>
                {form.termsAccepted && <Check size={12} color={COLORS.black} strokeWidth={3} />}
              </View>
              <Text style={w.termsTxt}>
                Acepto los <Text style={w.termsLink}>Términos y Condiciones</Text> del Marketplace y la{' '}
                <Text style={w.termsLink}>Política de Vendedores</Text> de KaifMarket.
              </Text>
            </TouchableOpacity>
            {errors.terms ? <Text style={w.errorTxt}>{errors.terms}</Text> : null}

            <View style={w.warningCard}>
              <ShieldAlert size={16} color={COLORS.gold} strokeWidth={2} />
              <Text style={w.warningTxt}>
                Asegúrate de que toda la información sea verídica. La aprobación depende de la
                autenticidad de los documentos enviados.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── BOTONES ── */}
      {/* ── MODAL: Foto o PDF — reutilizado por RUC y Licencia ── */}
      <Modal visible={!!fileTypeModal} transparent animationType="fade" onRequestClose={() => setFileTypeModal(null)}>
        <TouchableOpacity style={w.modalBackdrop} activeOpacity={1} onPress={() => setFileTypeModal(null)}>
          <View style={w.modalSheet}>
            <View style={w.modalHandle} />
            <Text style={w.modalTitle}>
              {fileTypeModal === 'ruc' ? 'Ficha RUC de SUNAT' : 'Licencia de funcionamiento'}
            </Text>
            <Text style={w.modalSubtitle}>¿Qué tipo de archivo quieres subir?</Text>
            <TouchableOpacity style={w.modalOption} onPress={() => fileTypeModal && handlePickPhotoFor(fileTypeModal)} activeOpacity={0.8}>
              <Text style={w.modalOptionTxt}>📷 Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[w.modalOption, { borderBottomWidth: 0 }]} onPress={() => fileTypeModal && handlePickPdfFor(fileTypeModal)} activeOpacity={0.8}>
              <Text style={w.modalOptionTxt}>📄 PDF</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL: Método de pago preferido ── */}
      <Modal visible={paymentModalOpen} transparent animationType="fade" onRequestClose={() => setPaymentModalOpen(false)}>
        <TouchableOpacity style={w.modalBackdrop} activeOpacity={1} onPress={() => setPaymentModalOpen(false)}>
          <View style={w.modalSheet}>
            <View style={w.modalHandle} />
            <Text style={w.modalTitle}>Método de pago preferido</Text>
            <Text style={w.modalSubtitle}>Así te depositamos cuando vendas</Text>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[w.modalOption, form.preferredPaymentMethod === m.id && w.modalOptionActive]}
                onPress={() => selectPaymentMethod(m.id)}
                activeOpacity={0.8}>
                <Text style={[w.modalOptionTxt, form.preferredPaymentMethod === m.id && w.modalOptionTxtActive]}>{m.label}</Text>
                {form.preferredPaymentMethod === m.id && <Check size={16} color={COLORS.gold} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL: Categoría del negocio ── */}
      <Modal visible={categoryModalOpen} transparent animationType="fade" onRequestClose={() => setCategoryModalOpen(false)}>
        <TouchableOpacity style={w.modalBackdrop} activeOpacity={1} onPress={() => setCategoryModalOpen(false)}>
          <View style={w.modalSheet}>
            <View style={w.modalHandle} />
            <Text style={w.modalTitle}>Categoría del negocio</Text>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[w.modalOption, form.category === cat.id && w.modalOptionActive]}
                onPress={() => selectCategory(cat.id)}
                activeOpacity={0.8}>
                <Text style={[w.modalOptionTxt, form.category === cat.id && w.modalOptionTxtActive]}>{cat.label}</Text>
                {form.category === cat.id && <Check size={16} color={COLORS.gold} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={[w.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={w.prevBtn} onPress={goBack} disabled={submitting}>
          <Text style={w.prevBtnTxt}>{step === 1 ? 'Cancelar' : 'Anterior'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[w.nextBtn, submitting && { opacity: 0.7 }]}
          onPress={step === 4 ? submit : goNext}
          disabled={submitting}
          activeOpacity={0.85}>
          {submitting
            ? <ActivityIndicator color={COLORS.black} size="small" />
            : <Text style={w.nextBtnTxt}>{step === 4 ? 'Enviar solicitud' : 'Siguiente'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={w.field}>
      <Text style={w.label}>{label}</Text>
      <View style={[w.inputWrap, error && w.inputWrapError]}>{children}</View>
      {error ? <Text style={w.errorTxt}>{error}</Text> : null}
    </View>
  );
}

const w = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: FONT.black, color: COLORS.white },
  headerSub:    { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
  storeIconWrap:{ marginLeft: 'auto', width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: COLORS.gold + '22', alignItems: 'center', justifyContent: 'center' },

  progressRow:  { flexDirection: 'row', gap: 4, paddingHorizontal: SPACING.lg, marginBottom: 6 },
  progressBar:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.gray800 },
  progressBarDone: { backgroundColor: COLORS.gold },
  stepLabel:    { fontSize: 11, color: COLORS.gray600, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },

  photoWrap:    { alignItems: 'center', marginBottom: SPACING.lg },
  photoCircle:  { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 2, borderColor: COLORS.gray800, overflow: 'hidden' },
  photoImg:     { width: '100%', height: '100%' },
  photoUploadBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  photoHint:    { fontSize: 11, color: COLORS.gray400, marginTop: 8 },

  field:        { marginBottom: SPACING.md },
  label:        { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray400, marginBottom: 6 },
  inputWrap:    { borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft },
  inputWrapError: { borderColor: COLORS.red },
  input:        { paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: COLORS.white },
  errorTxt:     { fontSize: 11, color: COLORS.red, marginTop: 4, fontWeight: FONT.semibold },

  pickerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 4 },
  pickerTxt:    { flex: 1, fontSize: 14, color: COLORS.gray600 },
  textarea:     { minHeight: 90, paddingTop: 13 },
  hoursRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft, padding: 10, marginBottom: SPACING.md },
  logoPreview:  { width: 40, height: 40, borderRadius: RADIUS.md },
  logoPlaceholder: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.gray800, alignItems: 'center', justifyContent: 'center' },
  logoRowTxt:   { flex: 1, fontSize: 13, color: COLORS.gray400 },

  dniRow:       { flexDirection: 'row', gap: 10, marginBottom: 4 },
  dniSlot:      { flex: 1, height: 90, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.gray800, borderStyle: 'dashed', backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  dniImg:       { width: '100%', height: '100%' },
  dniSlotTxt:   { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },
  optionalTxt:  { fontSize: 10, color: COLORS.gray600 },

  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft, padding: 13, marginBottom: SPACING.sm },
  docRowTxt:    { flex: 1, fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },

  photosGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  storePhotoWrap: { width: 70, height: 70, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  storePhotoImg:  { width: '100%', height: '100%' },
  storePhotoRemove: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  storePhotoAdd:  { width: 70, height: 70, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray800, borderStyle: 'dashed', backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center' },

  termsRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: SPACING.md, marginBottom: SPACING.sm },
  checkbox:     { width: 20, height: 20, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.gray600, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  termsTxt:     { flex: 1, fontSize: 12, color: COLORS.gray400, lineHeight: 18 },
  termsLink:    { color: COLORS.gold, fontWeight: FONT.bold },

  warningCard:  { flexDirection: 'row', gap: 10, backgroundColor: COLORS.gold + '15', borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.sm },
  warningTxt:   { flex: 1, fontSize: 11, color: COLORS.gold, lineHeight: 17 },

  placeholderCard: { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center' },
  placeholderTxt:  { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },

  bottomBar:    { flexDirection: 'row', gap: 10, padding: SPACING.lg, backgroundColor: COLORS.black, borderTopWidth: 0.5, borderTopColor: COLORS.gray800 },
  prevBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.gray800, paddingVertical: 14 },
  prevBtnTxt:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray400 },
  nextBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, backgroundColor: COLORS.gold, paddingVertical: 14 },
  nextBtnTxt:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.black },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: COLORS.blackSoft, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg, paddingBottom: SPACING.xl },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray800, alignSelf: 'center', marginBottom: SPACING.md },
  modalTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.md },
  modalSubtitle: { fontSize: 12, color: COLORS.gray400, marginTop: -8, marginBottom: SPACING.md },
  modalOption:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalOptionActive: {},
  modalOptionTxt:    { fontSize: 15, color: COLORS.gray400, fontWeight: FONT.semibold },
  modalOptionTxtActive: { color: COLORS.gold, fontWeight: FONT.black },
});