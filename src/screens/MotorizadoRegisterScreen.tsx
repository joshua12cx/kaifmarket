// src/screens/MotorizadoRegisterScreen.tsx
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
  ChevronLeft, ChevronRight, Truck, User as UserIcon, Upload,
  FileText, Check, Plus, X, ShieldAlert, Camera,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { supabase } from '../lib/supabase';

const STEPS = ['Información Personal', 'Datos del Vehículo', 'Documentos Requeridos', 'Datos de Pago'];
const GREEN = COLORS.green;

const VEHICLE_TYPES = [
  { id: 'moto',      label: 'Moto' },
  { id: 'auto',      label: 'Auto' },
  { id: 'bicicleta', label: 'Bicicleta' },
  { id: 'a_pie',     label: 'A pie' },
];
const VEHICLE_COLORS = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Gris', 'Otro'];
const WITHDRAWAL_METHODS: { id: 'bank_transfer' | 'yape' | 'plin'; label: string }[] = [
  { id: 'bank_transfer', label: 'Transferencia bancaria' },
  { id: 'yape', label: 'Yape' },
  { id: 'plin', label: 'Plin' },
];

export default function MotorizadoRegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: user?.name || '',
    dni: '',
    phone: user?.phone || '',
    email: user?.email || '',
    profilePhotoUri: null as string | null,
    vehicleType: '' as string,
    vehiclePlate: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleColor: '',
    licenseFrontUri: null as string | null,
    licenseBackUri: null as string | null,
    soatUri: null as string | null,
    propertyCardUri: null as string | null,
    vehiclePhotos: [] as string[],
    selfieUri: null as string | null,
    backgroundCheckConsent: false,
    bankAccount: '',
    cci: '',
    yapeNumber: '',
    plinNumber: '',
    withdrawalMethod: '' as '' | 'bank_transfer' | 'yape' | 'plin',
    termsAccepted: false,
  });

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const pickProfilePhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 500, maxHeight: 500 });
    if (result.assets?.[0]?.uri) { setField('profilePhotoUri', result.assets[0].uri); }
  };

  // ── Modal propio de opciones — reutilizado por los 3 pickers ────
  const [optionModal, setOptionModal] = useState<null | 'vehicleType' | 'vehicleColor' | 'withdrawalMethod'>(null);
  const pickVehicleType = () => setOptionModal('vehicleType');
  const pickVehicleColor = () => setOptionModal('vehicleColor');
  const pickWithdrawalMethod = () => setOptionModal('withdrawalMethod');

  const selectVehicleType = (id: string) => {
    setField('vehicleType', id); setErrors(e => ({ ...e, vehicleType: '' })); setOptionModal(null);
  };
  const selectVehicleColor = (c: string) => { setField('vehicleColor', c); setOptionModal(null); };
  const selectWithdrawalMethod = (id: 'bank_transfer' | 'yape' | 'plin') => {
    setField('withdrawalMethod', id); setErrors(e => ({ ...e, withdrawalMethod: '' })); setOptionModal(null);
  };

  const pickPhoto = async (field: string) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (result.assets?.[0]?.uri) { setField(field, result.assets[0].uri); setErrors(e => ({ ...e, [field]: '' })); }
  };

  const addVehiclePhoto = async () => {
    if (form.vehiclePhotos.length >= 6) { Alert.alert('Máximo alcanzado', 'Puedes subir hasta 6 fotos.'); return; }
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (result.assets?.[0]?.uri) {
      setField('vehiclePhotos', [...form.vehiclePhotos, result.assets[0].uri]);
      setErrors(e => ({ ...e, vehiclePhotos: '' }));
    }
  };
  const removeVehiclePhoto = (uri: string) => setField('vehiclePhotos', form.vehiclePhotos.filter(p => p !== uri));

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
      const { error } = await supabase.storage.from('motorizados').upload(fileName, bytes, { contentType, upsert: true });
      if (error) { if (__DEV__) { console.log('[MOTO_WIZARD] upload error:', error); } return null; }
      const { data } = supabase.storage.from('motorizados').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      if (__DEV__) { console.log('[MOTO_WIZARD] upload exception:', e); }
      return null;
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim())             { errs.fullName = 'El nombre es requerido'; }
    if (!form.dni.trim())                  { errs.dni = 'El DNI es requerido'; }
    else if (form.dni.trim().length !== 8) { errs.dni = 'El DNI debe tener 8 dígitos'; }
    if (!form.phone.trim())                { errs.phone = 'El teléfono es requerido'; }
    if (!form.email.trim())                { errs.email = 'El correo es requerido'; }
    else if (!form.email.includes('@'))    { errs.email = 'Correo inválido'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.vehicleType) { errs.vehicleType = 'Selecciona el tipo de vehículo'; }
    if (form.vehicleType !== 'a_pie' && form.vehicleType !== 'bicicleta') {
      if (!form.vehiclePlate.trim()) { errs.vehiclePlate = 'La placa es requerida'; }
      if (!form.vehicleBrand.trim()) { errs.vehicleBrand = 'La marca es requerida'; }
      if (!form.vehicleModel.trim()) { errs.vehicleModel = 'El modelo es requerido'; }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!form.licenseFrontUri || !form.licenseBackUri) { errs.license = 'Sube ambos lados de tu licencia'; }
    if (form.vehicleType !== 'a_pie' && form.vehicleType !== 'bicicleta') {
      if (!form.soatUri)         { errs.soatUri = 'El SOAT es requerido'; }
      if (!form.propertyCardUri) { errs.propertyCardUri = 'La tarjeta de propiedad es requerida'; }
    }
    if (form.vehiclePhotos.length < 4) { errs.vehiclePhotos = 'Sube al menos 4 fotos del vehículo'; }
    if (!form.selfieUri) { errs.selfieUri = 'Falta tu selfie de verificación'; }
    if (!form.backgroundCheckConsent) { errs.backgroundCheckConsent = 'Debes autorizar la verificación de antecedentes'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs: Record<string, string> = {};
    if (!form.withdrawalMethod) { errs.withdrawalMethod = 'Selecciona cómo prefieres que te depositemos'; }
    else if (form.withdrawalMethod === 'bank_transfer') {
      if (!form.bankAccount.trim()) { errs.bankAccount = 'La cuenta bancaria es requerida'; }
      if (!form.cci.trim())         { errs.cci = 'El CCI es requerido'; }
    } else if (form.withdrawalMethod === 'yape' && !form.yapeNumber.trim()) {
      errs.yapeNumber = 'Tu número de Yape es requerido';
    } else if (form.withdrawalMethod === 'plin' && !form.plinNumber.trim()) {
      errs.plinNumber = 'Tu número de Plin es requerido';
    }
    if (!form.termsAccepted) { errs.terms = 'Debes aceptar los Términos y Condiciones para Transportistas'; }
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

  const submit = async () => {
    if (!validateStep4() || !user?.id) { return; }
    setSubmitting(true);
    try {
      const [
        profilePhotoUrl, licenseFrontUrl, licenseBackUrl,
        soatUrl, propertyCardUrl, selfieUrl,
      ] = await Promise.all([
        form.profilePhotoUri ? uploadFile(form.profilePhotoUri, 'profile', 'jpg', 'image/jpeg') : Promise.resolve(null),
        uploadFile(form.licenseFrontUri!, 'license_front', 'jpg', 'image/jpeg'),
        uploadFile(form.licenseBackUri!, 'license_back', 'jpg', 'image/jpeg'),
        form.soatUri ? uploadFile(form.soatUri, 'soat', 'jpg', 'image/jpeg') : Promise.resolve(null),
        form.propertyCardUri ? uploadFile(form.propertyCardUri, 'property_card', 'jpg', 'image/jpeg') : Promise.resolve(null),
        uploadFile(form.selfieUri!, 'selfie', 'jpg', 'image/jpeg'),
      ]);

      if (!licenseFrontUrl || !licenseBackUrl || !selfieUrl) {
        Alert.alert('Error', 'No se pudieron subir algunos documentos. Verifica tu conexión e intenta de nuevo.');
        setSubmitting(false);
        return;
      }

      const { data: motoRow, error } = await supabase.from('motorizados').insert({
        user_id: user.id,
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        dni: form.dni.trim(),
        profile_photo_url: profilePhotoUrl,
        vehicle_type: form.vehicleType,
        vehicle_plate: form.vehiclePlate.trim() || null,
        vehicle_brand: form.vehicleBrand.trim() || null,
        vehicle_model: form.vehicleModel.trim() || null,
        vehicle_color: form.vehicleColor || null,
        license_front_url: licenseFrontUrl,
        license_back_url: licenseBackUrl,
        license_url: licenseFrontUrl,
        soat_url: soatUrl,
        property_card_url: propertyCardUrl,
        selfie_url: selfieUrl,
        background_check_consent: form.backgroundCheckConsent,
        bank_account: form.bankAccount.trim() || null,
        cci: form.cci.trim() || null,
        yape_number: form.yapeNumber.trim() || null,
        plin_number: form.plinNumber.trim() || null,
        preferred_withdrawal_method: form.withdrawalMethod || null,
        terms_accepted_at: new Date().toISOString(),
        status: 'pending',
        rating: 5.0,
        total_deliveries: 0,
        is_online: false,
      }).select().single();

      if (error || !motoRow) {
        if (__DEV__) { console.log('[MOTO_WIZARD] insert error:', error); }
        Alert.alert('Error', 'No se pudo enviar tu solicitud. Intenta de nuevo.');
        setSubmitting(false);
        return;
      }

      await supabase.from('motorizado_vehicle_photos').insert(
        await Promise.all(form.vehiclePhotos.map(async uri => ({
          motorizado_id: motoRow.id,
          photo_url: await uploadFile(uri, 'vehicle', 'jpg', 'image/jpeg'),
        }))),
      );

      updateUser({});

      setSubmitting(false);
      navigation.replace('MotorizadoApplicationSuccess');
    } catch (e) {
      if (__DEV__) { console.log('[MOTO_WIZARD] submit error:', e); }
      setSubmitting(false);
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    }
  };

  const isVehicleNeeded = form.vehicleType && form.vehicleType !== 'a_pie' && form.vehicleType !== 'bicicleta';

  return (
    <View style={[w.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={w.header}>
        <TouchableOpacity style={w.backBtn} onPress={goBack}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={w.headerTitle}>Registro de Transportista</Text>
          <Text style={w.headerSub}>{STEPS[step - 1]}</Text>
        </View>
        <View style={w.truckIconWrap}>
          <Truck size={16} color={GREEN} strokeWidth={2} />
        </View>
      </View>

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
            <View style={w.photoWrap}>
              <TouchableOpacity style={w.photoCircle} onPress={pickProfilePhoto} activeOpacity={0.8}>
                {form.profilePhotoUri ? (
                  <Image source={{ uri: form.profilePhotoUri }} style={w.photoImg} />
                ) : (
                  <UserIcon size={32} color={COLORS.gray600} strokeWidth={1.5} />
                )}
                <View style={w.photoUploadBadge}><Upload size={12} color={COLORS.black} strokeWidth={2.5} /></View>
              </TouchableOpacity>
              <Text style={w.photoHint}>Foto reciente en fondo blanco</Text>
            </View>

            <Field label="Nombre completo" error={errors.fullName}>
              <TextInput style={w.input} placeholder="Luis Paredes" placeholderTextColor={COLORS.gray600}
                value={form.fullName} onChangeText={t => { setField('fullName', t); setErrors(e => ({ ...e, fullName: '' })); }} autoCapitalize="words" />
            </Field>
            <Field label="DNI" error={errors.dni}>
              <TextInput style={w.input} placeholder="12345678" placeholderTextColor={COLORS.gray600}
                value={form.dni} onChangeText={t => { setField('dni', t.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, dni: '' })); }} keyboardType="number-pad" maxLength={8} />
            </Field>
            <Field label="Teléfono" error={errors.phone}>
              <TextInput style={w.input} placeholder="+51 999 999 999" placeholderTextColor={COLORS.gray600}
                value={form.phone} onChangeText={t => { setField('phone', t); setErrors(e => ({ ...e, phone: '' })); }} keyboardType="phone-pad" />
            </Field>
            <Field label="Correo electrónico" error={errors.email}>
              <TextInput style={w.input} placeholder="correo@ejemplo.com" placeholderTextColor={COLORS.gray600}
                value={form.email} onChangeText={t => { setField('email', t); setErrors(e => ({ ...e, email: '' })); }} keyboardType="email-address" autoCapitalize="none" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={w.label}>Tipo de vehículo</Text>
            <TouchableOpacity style={[w.pickerRow, errors.vehicleType && w.inputWrapError]} onPress={pickVehicleType} activeOpacity={0.8}>
              <Truck size={16} color={COLORS.gray600} strokeWidth={2} />
              <Text style={[w.pickerTxt, form.vehicleType && { color: COLORS.white }]}>
                {form.vehicleType ? VEHICLE_TYPES.find(v => v.id === form.vehicleType)?.label : 'Selecciona un tipo'}
              </Text>
              <ChevronRight size={16} color={COLORS.gray600} strokeWidth={2} />
            </TouchableOpacity>
            {errors.vehicleType ? <Text style={w.errorTxt}>{errors.vehicleType}</Text> : null}

            {isVehicleNeeded && (
              <>
                <Field label="Número de placa" error={errors.vehiclePlate}>
                  <TextInput style={w.input} placeholder="ABC-123" placeholderTextColor={COLORS.gray600}
                    value={form.vehiclePlate} onChangeText={t => { setField('vehiclePlate', t.toUpperCase()); setErrors(e => ({ ...e, vehiclePlate: '' })); }} autoCapitalize="characters" />
                </Field>
                <Field label="Marca del vehículo" error={errors.vehicleBrand}>
                  <TextInput style={w.input} placeholder="Honda, Toyota, etc." placeholderTextColor={COLORS.gray600}
                    value={form.vehicleBrand} onChangeText={t => { setField('vehicleBrand', t); setErrors(e => ({ ...e, vehicleBrand: '' })); }} />
                </Field>
                <Field label="Modelo" error={errors.vehicleModel}>
                  <TextInput style={w.input} placeholder="CB125F, Yaris, etc." placeholderTextColor={COLORS.gray600}
                    value={form.vehicleModel} onChangeText={t => { setField('vehicleModel', t); setErrors(e => ({ ...e, vehicleModel: '' })); }} />
                </Field>

                <Text style={w.label}>Color del vehículo</Text>
                <TouchableOpacity style={w.pickerRow} onPress={pickVehicleColor} activeOpacity={0.8}>
                  <Text style={{ fontSize: 15 }}>🎨</Text>
                  <Text style={[w.pickerTxt, form.vehicleColor && { color: COLORS.white }]}>
                    {form.vehicleColor || 'Selecciona un color'}
                  </Text>
                  <ChevronRight size={16} color={COLORS.gray600} strokeWidth={2} />
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={w.label}>Licencia de conducir (ambos lados)</Text>
            <View style={w.dniRow}>
              <TouchableOpacity style={w.dniSlot} onPress={() => pickPhoto('licenseFrontUri')} activeOpacity={0.8}>
                {form.licenseFrontUri ? <Image source={{ uri: form.licenseFrontUri }} style={w.dniImg} /> : (
                  <><Upload size={20} color={COLORS.gray600} strokeWidth={2} /><Text style={w.dniSlotTxt}>Frente</Text></>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={w.dniSlot} onPress={() => pickPhoto('licenseBackUri')} activeOpacity={0.8}>
                {form.licenseBackUri ? <Image source={{ uri: form.licenseBackUri }} style={w.dniImg} /> : (
                  <><Upload size={20} color={COLORS.gray600} strokeWidth={2} /><Text style={w.dniSlotTxt}>Reverso</Text></>
                )}
              </TouchableOpacity>
            </View>
            {errors.license ? <Text style={w.errorTxt}>{errors.license}</Text> : null}

            {isVehicleNeeded && (
              <>
                <TouchableOpacity style={[w.docRow, { marginTop: SPACING.md }, errors.soatUri && w.inputWrapError]} onPress={() => pickPhoto('soatUri')} activeOpacity={0.8}>
                  <FileText size={18} color={form.soatUri ? COLORS.green : COLORS.gray600} strokeWidth={2} />
                  <Text style={w.docRowTxt}>{form.soatUri ? 'SOAT cargado ✓' : 'SOAT vigente'}</Text>
                  <Upload size={16} color={GREEN} strokeWidth={2} />
                </TouchableOpacity>
                {errors.soatUri ? <Text style={w.errorTxt}>{errors.soatUri}</Text> : null}

                <TouchableOpacity style={[w.docRow, errors.propertyCardUri && w.inputWrapError]} onPress={() => pickPhoto('propertyCardUri')} activeOpacity={0.8}>
                  <FileText size={18} color={form.propertyCardUri ? COLORS.green : COLORS.gray600} strokeWidth={2} />
                  <Text style={w.docRowTxt}>{form.propertyCardUri ? 'Tarjeta de propiedad cargada ✓' : 'Tarjeta de propiedad del vehículo'}</Text>
                  <Upload size={16} color={GREEN} strokeWidth={2} />
                </TouchableOpacity>
                {errors.propertyCardUri ? <Text style={w.errorTxt}>{errors.propertyCardUri}</Text> : null}
              </>
            )}

            <Text style={[w.label, { marginTop: SPACING.md }]}>
              Fotos del vehículo <Text style={w.optionalTxt}>(mínimo 4 ángulos)</Text>
            </Text>
            <View style={w.photosGrid}>
              {form.vehiclePhotos.map(uri => (
                <View key={uri} style={w.storePhotoWrap}>
                  <Image source={{ uri }} style={w.storePhotoImg} />
                  <TouchableOpacity style={w.storePhotoRemove} onPress={() => removeVehiclePhoto(uri)}>
                    <X size={12} color={COLORS.white} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              {form.vehiclePhotos.length < 6 && (
                <TouchableOpacity style={w.storePhotoAdd} onPress={addVehiclePhoto} activeOpacity={0.8}>
                  <Plus size={20} color={COLORS.gray600} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
            {errors.vehiclePhotos ? <Text style={w.errorTxt}>{errors.vehiclePhotos}</Text> : null}

            <TouchableOpacity style={[w.docRow, { marginTop: SPACING.md }, errors.selfieUri && w.inputWrapError]} onPress={() => pickPhoto('selfieUri')} activeOpacity={0.8}>
              <Camera size={18} color={form.selfieUri ? COLORS.green : COLORS.gray600} strokeWidth={2} />
              <Text style={w.docRowTxt}>{form.selfieUri ? 'Selfie cargada ✓' : 'Selfie de verificación — con tu DNI sostenido en mano'}</Text>
              <Upload size={16} color={GREEN} strokeWidth={2} />
            </TouchableOpacity>
            {errors.selfieUri ? <Text style={w.errorTxt}>{errors.selfieUri}</Text> : null}

            <TouchableOpacity
              style={w.termsRow}
              onPress={() => { setField('backgroundCheckConsent', !form.backgroundCheckConsent); setErrors(e => ({ ...e, backgroundCheckConsent: '' })); }}
              activeOpacity={0.8}>
              <View style={[w.checkbox, form.backgroundCheckConsent && w.checkboxActive]}>
                {form.backgroundCheckConsent && <Check size={12} color={COLORS.black} strokeWidth={3} />}
              </View>
              <Text style={w.termsTxt}>
                Autorizo la realización de una <Text style={w.termsLink}>verificación de antecedentes</Text> en
                cumplimiento de las políticas de seguridad de KaifMarket.
              </Text>
            </TouchableOpacity>
            {errors.backgroundCheckConsent ? <Text style={w.errorTxt}>{errors.backgroundCheckConsent}</Text> : null}
          </>
        )}

        {step === 4 && (
          <>
            <Field label="Número de cuenta bancaria" error={errors.bankAccount}>
              <TextInput style={w.input} placeholder="123-456-789012" placeholderTextColor={COLORS.gray600}
                value={form.bankAccount} onChangeText={t => { setField('bankAccount', t); setErrors(e => ({ ...e, bankAccount: '' })); }} keyboardType="number-pad" />
            </Field>
            <Field label="CCI (Código de Cuenta Interbancario)" error={errors.cci}>
              <TextInput style={w.input} placeholder="00212312345678901234" placeholderTextColor={COLORS.gray600}
                value={form.cci} onChangeText={t => { setField('cci', t.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, cci: '' })); }} keyboardType="number-pad" maxLength={20} />
            </Field>
            <Field label="Número de Yape" error={errors.yapeNumber}>
              <TextInput style={w.input} placeholder="+51 999 999 999" placeholderTextColor={COLORS.gray600}
                value={form.yapeNumber} onChangeText={t => { setField('yapeNumber', t); setErrors(e => ({ ...e, yapeNumber: '' })); }} keyboardType="phone-pad" />
            </Field>
            <Field label="Número de Plin" error={errors.plinNumber}>
              <TextInput style={w.input} placeholder="+51 999 999 999" placeholderTextColor={COLORS.gray600}
                value={form.plinNumber} onChangeText={t => { setField('plinNumber', t); setErrors(e => ({ ...e, plinNumber: '' })); }} keyboardType="phone-pad" />
            </Field>

            <Text style={w.label}>Método de retiro preferido</Text>
            <TouchableOpacity style={[w.pickerRow, errors.withdrawalMethod && w.inputWrapError]} onPress={pickWithdrawalMethod} activeOpacity={0.8}>
              <Text style={{ fontSize: 16 }}>💵</Text>
              <Text style={[w.pickerTxt, form.withdrawalMethod && { color: COLORS.white }]}>
                {form.withdrawalMethod ? WITHDRAWAL_METHODS.find(m => m.id === form.withdrawalMethod)?.label : 'Elige cómo prefieres retirar'}
              </Text>
              <ChevronRight size={16} color={COLORS.gray600} strokeWidth={2} />
            </TouchableOpacity>
            {errors.withdrawalMethod ? <Text style={w.errorTxt}>{errors.withdrawalMethod}</Text> : null}

            <TouchableOpacity
              style={w.termsRow}
              onPress={() => { setField('termsAccepted', !form.termsAccepted); setErrors(e => ({ ...e, terms: '' })); }}
              activeOpacity={0.8}>
              <View style={[w.checkbox, form.termsAccepted && w.checkboxActive]}>
                {form.termsAccepted && <Check size={12} color={COLORS.black} strokeWidth={3} />}
              </View>
              <Text style={w.termsTxt}>
                Acepto los <Text style={w.termsLink}>Términos y Condiciones para Transportistas</Text> de KaifMarket.
              </Text>
            </TouchableOpacity>
            {errors.terms ? <Text style={w.errorTxt}>{errors.terms}</Text> : null}

            <View style={w.warningCard}>
              <ShieldAlert size={16} color={GREEN} strokeWidth={2} />
              <Text style={w.warningTxt}>
                Al enviar tu solicitud, confirmas que toda la información y documentos proporcionados son auténticos.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── MODAL: opciones — tipo de vehículo / color / método de retiro ── */}
      <Modal visible={!!optionModal} transparent animationType="fade" onRequestClose={() => setOptionModal(null)}>
        <TouchableOpacity style={w.modalBackdrop} activeOpacity={1} onPress={() => setOptionModal(null)}>
          <View style={w.modalSheet}>
            <View style={w.modalHandle} />

            {optionModal === 'vehicleType' && (
              <>
                <Text style={w.modalTitle}>Tipo de vehículo</Text>
                {VEHICLE_TYPES.map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[w.modalOption, form.vehicleType === v.id && w.modalOptionActive]}
                    onPress={() => selectVehicleType(v.id)}
                    activeOpacity={0.8}>
                    <Text style={[w.modalOptionTxt, form.vehicleType === v.id && w.modalOptionTxtActive]}>{v.label}</Text>
                    {form.vehicleType === v.id && <Check size={16} color={GREEN} strokeWidth={2.5} />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {optionModal === 'vehicleColor' && (
              <>
                <Text style={w.modalTitle}>Color del vehículo</Text>
                {VEHICLE_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[w.modalOption, form.vehicleColor === c && w.modalOptionActive]}
                    onPress={() => selectVehicleColor(c)}
                    activeOpacity={0.8}>
                    <Text style={[w.modalOptionTxt, form.vehicleColor === c && w.modalOptionTxtActive]}>{c}</Text>
                    {form.vehicleColor === c && <Check size={16} color={GREEN} strokeWidth={2.5} />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {optionModal === 'withdrawalMethod' && (
              <>
                <Text style={w.modalTitle}>Método de retiro preferido</Text>
                <Text style={w.modalSubtitle}>Así te depositamos tus ganancias</Text>
                {WITHDRAWAL_METHODS.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[w.modalOption, form.withdrawalMethod === m.id && w.modalOptionActive]}
                    onPress={() => selectWithdrawalMethod(m.id)}
                    activeOpacity={0.8}>
                    <Text style={[w.modalOptionTxt, form.withdrawalMethod === m.id && w.modalOptionTxtActive]}>{m.label}</Text>
                    {form.withdrawalMethod === m.id && <Check size={16} color={GREEN} strokeWidth={2.5} />}
                  </TouchableOpacity>
                ))}
              </>
            )}
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
  truckIconWrap:{ marginLeft: 'auto', width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: GREEN + '22', alignItems: 'center', justifyContent: 'center' },

  progressRow:  { flexDirection: 'row', gap: 4, paddingHorizontal: SPACING.lg, marginBottom: 6 },
  progressBar:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.gray800 },
  progressBarDone: { backgroundColor: GREEN },
  stepLabel:    { fontSize: 11, color: COLORS.gray600, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },

  photoWrap:    { alignItems: 'center', marginBottom: SPACING.lg },
  photoCircle:  { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 2, borderColor: COLORS.gray800, overflow: 'hidden' },
  photoImg:     { width: '100%', height: '100%' },
  photoUploadBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  photoHint:    { fontSize: 11, color: COLORS.gray400, marginTop: 8 },

  field:        { marginBottom: SPACING.md },
  label:        { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.gray400, marginBottom: 6 },
  inputWrap:    { borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft },
  inputWrapError: { borderColor: COLORS.red },
  input:        { paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: COLORS.white },
  errorTxt:     { fontSize: 11, color: COLORS.red, marginTop: 4, marginBottom: 6, fontWeight: FONT.semibold },
  optionalTxt:  { fontSize: 10, color: COLORS.gray600 },

  pickerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 4 },
  pickerTxt:    { flex: 1, fontSize: 14, color: COLORS.gray600 },

  dniRow:       { flexDirection: 'row', gap: 10, marginBottom: 4 },
  dniSlot:      { flex: 1, height: 90, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.gray800, borderStyle: 'dashed', backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  dniImg:       { width: '100%', height: '100%' },
  dniSlotTxt:   { fontSize: 11, color: COLORS.gray600, fontWeight: FONT.semibold },

  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.gray800, borderRadius: RADIUS.lg, backgroundColor: COLORS.blackSoft, padding: 13, marginBottom: SPACING.sm },
  docRowTxt:    { flex: 1, fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },

  photosGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  storePhotoWrap: { width: 70, height: 70, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  storePhotoImg:  { width: '100%', height: '100%' },
  storePhotoRemove: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  storePhotoAdd:  { width: 70, height: 70, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray800, borderStyle: 'dashed', backgroundColor: COLORS.blackSoft, alignItems: 'center', justifyContent: 'center' },

  termsRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: SPACING.md, marginBottom: SPACING.sm },
  checkbox:     { width: 20, height: 20, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.gray600, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxActive: { backgroundColor: GREEN, borderColor: GREEN },
  termsTxt:     { flex: 1, fontSize: 12, color: COLORS.gray400, lineHeight: 18 },
  termsLink:    { color: GREEN, fontWeight: FONT.bold },

  warningCard:  { flexDirection: 'row', gap: 10, backgroundColor: GREEN + '15', borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.sm },
  warningTxt:   { flex: 1, fontSize: 11, color: GREEN, lineHeight: 17 },

  bottomBar:    { flexDirection: 'row', gap: 10, padding: SPACING.lg, backgroundColor: COLORS.black, borderTopWidth: 0.5, borderTopColor: COLORS.gray800 },
  prevBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.gray800, paddingVertical: 14 },
  prevBtnTxt:   { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray400 },
  nextBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, backgroundColor: GREEN, paddingVertical: 14 },
  nextBtnTxt:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.black },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: COLORS.blackSoft, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg, paddingBottom: SPACING.xl },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray800, alignSelf: 'center', marginBottom: SPACING.md },
  modalTitle:    { fontSize: 16, fontWeight: FONT.black, color: COLORS.white, marginBottom: SPACING.md },
  modalSubtitle: { fontSize: 12, color: COLORS.gray400, marginTop: -8, marginBottom: SPACING.md },
  modalOption:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalOptionActive: {},
  modalOptionTxt:    { fontSize: 15, color: COLORS.gray400, fontWeight: FONT.semibold },
  modalOptionTxtActive: { color: GREEN, fontWeight: FONT.black },
});