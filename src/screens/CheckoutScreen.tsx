// src/screens/CheckoutScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../theme';
import { PRODUCTS } from '../data';
import { useCart, useAuth } from '../context';
import { supabase } from '../lib/supabase';

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Estándar', detail: 'Mañana, 9:00–18:00', price: 0, icon: '📦' },
  { id: 'express',  label: 'Exprés',   detail: 'Hoy, 14:00–18:00',   price: 8, icon: '⚡' },
  { id: 'pickup',   label: 'Recojo',   detail: 'Hoy desde las 10:00', price: 0, icon: '🏪' },
];

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Efectivo al entregar',   icon: '💵' },
  { id: 'yape', label: 'Yape',                   icon: '📱' },
  { id: 'plin', label: 'Plin',                   icon: '💜' },
  { id: 'card', label: 'Tarjeta (próximamente)', icon: '💳', disabled: true },
];

export default function CheckoutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, dispatch } = useCart();
  const { user } = useAuth();

  const [name,          setName]          = useState(user?.name  || '');
  const [email,         setEmail]         = useState(user?.email || '');
  const [phone,         setPhone]         = useState(user?.phone || '');
  const [address,       setAddress]       = useState('');
  const [district,      setDistrict]      = useState('');
  const [notes,         setNotes]         = useState('');
  const [delivery,      setDelivery]      = useState('standard');
  const [payment,       setPayment]       = useState('cash');
  const [loading,       setLoading]       = useState(false);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [supabaseProds, setSupabaseProds] = useState<Record<string, any>>({});
  const [prodsLoading,  setProdsLoading]  = useState(false);

  // ── Cargar productos de Supabase si hay IDs string ────────────
  useEffect(() => {
    const stringIds = Object.keys(items).filter(id =>
      isNaN(Number(id)) && items[id] > 0
    );
    if (stringIds.length === 0) { return; }
    setProdsLoading(true);
    supabase
      .from('products')
      .select('*')
      .in('id', stringIds)
      .then(({ data }: { data: any[] | null }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((p: any) => { map[p.id] = p; });
          setSupabaseProds(map);
        }
        setProdsLoading(false);
      });
  }, [items]);

  // ── Construir entries mezclando estáticos y Supabase ──────────
  const cartEntries = Object.entries(items)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const isString = isNaN(Number(id));
      const raw      = isString
        ? supabaseProds[id]
        : PRODUCTS.find(p => p.id === Number(id));
      if (!raw) { return null; }
      return {
        product: {
          ...raw,
          bgColor:  raw.bgColor  || raw.bg_color  || '#F5F5F5',
          oldPrice: raw.oldPrice || raw.old_price  || null,
          imageUrl: raw.image_url || null,
          emoji:    raw.emoji    || '📦',
        },
        qty,
        id,
      };
    })
    .filter(Boolean) as { product: any; qty: number; id: string }[];

  const subtotal     = cartEntries.reduce((s, e) => s + e.product.price * e.qty, 0);
  const deliveryCost = DELIVERY_OPTIONS.find(d => d.id === delivery)?.price || 0;
  const total        = subtotal + deliveryCost;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())  { errs.name  = 'El nombre es requerido'; }
    if (!email.trim()) { errs.email = 'El email es requerido'; }
    else if (!email.includes('@')) { errs.email = 'Email inválido'; }
    if (!phone.trim()) { errs.phone = 'El teléfono es requerido'; }
    if (delivery !== 'pickup') {
      if (!address.trim())  { errs.address  = 'La dirección es requerida'; }
      if (!district.trim()) { errs.district = 'El distrito es requerido'; }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) { return; }
    setLoading(true);

    try {
      const orderData = {
        buyer_id:       user?.id || null,
        status:         'processing',
        total,
        delivery_type:  delivery,
        delivery_cost:  deliveryCost,
        address:        delivery !== 'pickup'
                          ? `${address}, ${district}, Lima`
                          : 'Recojo en tienda',
        buyer_name:     name,
        buyer_email:    email,
        buyer_phone:    phone,
        notes:          notes || null,
        payment_method: payment,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders').insert(orderData).select().single();

      if (__DEV__) { console.log('[CHECKOUT] Order:', { order, orderError }); }

      if (order?.id) {
        const orderItems = cartEntries.map(e => ({
          order_id:        order.id,
          product_id:      typeof e.product.id === 'string' ? null      : e.product.id,
          product_id_int:  typeof e.product.id === 'number' ? e.product.id : null,
          qty:             e.qty,
          price:           e.product.price,
        }));
        await supabase.from('order_items').insert(orderItems);
      }

      setLoading(false);
      dispatch({ type: 'CLEAR' });

      navigation.replace('OrderSuccess', {
        orderId:  order?.id || `ORD-${Date.now()}`,
        total,
        email,
        delivery,
        payment,
      });

    } catch (e) {
      if (__DEV__) { console.log('[CHECKOUT] Error:', e); }
      setLoading(false);
      dispatch({ type: 'CLEAR' });
      navigation.replace('OrderSuccess', {
        orderId: `ORD-${Date.now()}`,
        total,
        email,
        delivery,
        payment,
      });
    }
  };

  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.id === delivery)!;

  if (prodsLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[cs.container, { paddingTop: insets.top }]}>

        {/* ── HEADER ── */}
        <View style={cs.header}>
          <TouchableOpacity style={cs.backBtn} onPress={() => navigation.goBack()}>
            <Text style={cs.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={cs.headerTitle}>Finalizar compra</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled">

          {/* ── RESUMEN DEL PEDIDO ── */}
          <View style={cs.card}>
            <Text style={cs.cardTitle}>🛒 Tu pedido</Text>
            {cartEntries.map(({ product, qty }) => (
              <View key={product.id} style={cs.orderItem}>
                <View style={[cs.orderImg, { backgroundColor: product.bgColor }]}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={cs.orderImgReal}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 22 }}>{product.emoji}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cs.orderName} numberOfLines={1}>{product.name}</Text>
                  <Text style={cs.orderQty}>x{qty}</Text>
                </View>
                <Text style={cs.orderPrice}>S/ {product.price * qty}</Text>
              </View>
            ))}
          </View>

          {/* ── DATOS PERSONALES ── */}
          <View style={cs.card}>
            <View style={cs.cardTitleRow}>
              <Text style={cs.cardTitle}>👤 Datos de contacto</Text>
              {!user && (
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={cs.loginLink}>¿Tienes cuenta? Inicia sesión</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={cs.field}>
              <Text style={cs.label}>Nombre completo *</Text>
              <View style={[cs.inputWrap, errors.name && cs.inputError]}>
                <TextInput
                  style={cs.input}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={COLORS.gray400}
                  value={name}
                  onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
                  autoCapitalize="words"
                />
              </View>
              {errors.name ? <Text style={cs.errorTxt}>{errors.name}</Text> : null}
            </View>

            <View style={cs.field}>
              <Text style={cs.label}>Email * <Text style={cs.hint}>(recibirás tu recibo aquí)</Text></Text>
              <View style={[cs.inputWrap, errors.email && cs.inputError]}>
                <TextInput
                  style={cs.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={COLORS.gray400}
                  value={email}
                  onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email ? <Text style={cs.errorTxt}>{errors.email}</Text> : null}
            </View>

            <View style={cs.field}>
              <Text style={cs.label}>Teléfono *</Text>
              <View style={[cs.inputWrap, errors.phone && cs.inputError]}>
                <TextInput
                  style={cs.input}
                  placeholder="+51 999 999 999"
                  placeholderTextColor={COLORS.gray400}
                  value={phone}
                  onChangeText={t => { setPhone(t); setErrors(e => ({ ...e, phone: '' })); }}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone ? <Text style={cs.errorTxt}>{errors.phone}</Text> : null}
            </View>
          </View>

          {/* ── TIPO DE ENTREGA ── */}
          <View style={cs.card}>
            <Text style={cs.cardTitle}>📦 Tipo de entrega</Text>
            {DELIVERY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[cs.optRow, delivery === opt.id && cs.optRowActive]}
                onPress={() => setDelivery(opt.id)}
                activeOpacity={0.8}>
                <View style={[cs.radio, delivery === opt.id && cs.radioActive]} />
                <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={cs.optLabel}>{opt.label}</Text>
                  <Text style={cs.optDetail}>{opt.detail}</Text>
                </View>
                <Text style={[cs.optPrice, opt.price === 0 && { color: COLORS.green }]}>
                  {opt.price === 0 ? 'Gratis' : `S/ ${opt.price}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── DIRECCIÓN ── */}
          {delivery !== 'pickup' && (
            <View style={cs.card}>
              <Text style={cs.cardTitle}>📍 Dirección de entrega</Text>

              <View style={cs.field}>
                <Text style={cs.label}>Dirección *</Text>
                <View style={[cs.inputWrap, errors.address && cs.inputError]}>
                  <TextInput
                    style={cs.input}
                    placeholder="Calle, número, referencia"
                    placeholderTextColor={COLORS.gray400}
                    value={address}
                    onChangeText={t => { setAddress(t); setErrors(e => ({ ...e, address: '' })); }}
                  />
                </View>
                {errors.address ? <Text style={cs.errorTxt}>{errors.address}</Text> : null}
              </View>

              <View style={cs.field}>
                <Text style={cs.label}>Distrito *</Text>
                <View style={[cs.inputWrap, errors.district && cs.inputError]}>
                  <TextInput
                    style={cs.input}
                    placeholder="Ej: Miraflores, San Isidro..."
                    placeholderTextColor={COLORS.gray400}
                    value={district}
                    onChangeText={t => { setDistrict(t); setErrors(e => ({ ...e, district: '' })); }}
                  />
                </View>
                {errors.district ? <Text style={cs.errorTxt}>{errors.district}</Text> : null}
              </View>

              <View style={cs.field}>
                <Text style={cs.label}>Notas <Text style={cs.hint}>(opcional)</Text></Text>
                <View style={cs.inputWrap}>
                  <TextInput
                    style={[cs.input, { height: 60 }]}
                    placeholder="Ej: Timbre roto, llamar al llegar..."
                    placeholderTextColor={COLORS.gray400}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>
              </View>
            </View>
          )}

          {/* ── MÉTODO DE PAGO ── */}
          <View style={cs.card}>
            <Text style={cs.cardTitle}>💳 Método de pago</Text>
            {PAYMENT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  cs.optRow,
                  payment === opt.id && cs.optRowActive,
                  (opt as any).disabled && { opacity: 0.5 },
                ]}
                onPress={() => !(opt as any).disabled && setPayment(opt.id)}
                activeOpacity={0.8}>
                <View style={[cs.radio, payment === opt.id && cs.radioActive]} />
                <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                <Text style={cs.optLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── RESUMEN DE PRECIOS ── */}
          <View style={cs.card}>
            <Text style={cs.cardTitle}>💰 Resumen</Text>
            <View style={cs.sumRow}>
              <Text style={cs.sumLabel}>Subtotal</Text>
              <Text style={cs.sumVal}>S/ {subtotal}</Text>
            </View>
            <View style={cs.sumRow}>
              <Text style={cs.sumLabel}>Envío ({selectedDelivery.label})</Text>
              <Text style={[cs.sumVal, deliveryCost === 0 && { color: COLORS.green }]}>
                {deliveryCost === 0 ? 'Gratis' : `S/ ${deliveryCost}`}
              </Text>
            </View>
            <View style={[cs.sumRow, cs.totalRow]}>
              <Text style={cs.totalLabel}>Total a pagar</Text>
              <Text style={cs.totalVal}>S/ {total}</Text>
            </View>
          </View>

          {/* ── AVISO INVITADO ── */}
          {!user && (
            <View style={cs.guestNotice}>
              <Text style={cs.guestIcon}>ℹ️</Text>
              <Text style={cs.guestTxt}>
                Comprando como invitado recibirás tu recibo en el email indicado, pero no tendrás historial de compras.{' '}
                <Text
                  style={{ color: COLORS.primary, fontWeight: FONT.bold }}
                  onPress={() => navigation.navigate('Login')}>
                  Inicia sesión
                </Text>
                {' '}para guardar tu historial.
              </Text>
            </View>
          )}

        </ScrollView>

        {/* ── BOTTOM BAR ── */}
        <View style={[cs.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View>
            <Text style={cs.bottomLabel}>Total</Text>
            <Text style={cs.bottomTotal}>S/ {total}</Text>
          </View>
          <TouchableOpacity
            style={[cs.confirmBtn, loading && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={cs.confirmBtnTxt}>Confirmar pedido →</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const cs = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.gray50 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  backTxt:      { fontSize: 24, color: COLORS.gray800, fontWeight: FONT.bold, lineHeight: 28 },
  headerTitle:  { fontSize: 17, fontWeight: FONT.black, color: COLORS.gray800 },
  card:         { backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.card },
  cardTitle:    { fontSize: 15, fontWeight: FONT.black, color: COLORS.gray800, marginBottom: SPACING.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  loginLink:    { fontSize: 12, color: COLORS.primary, fontWeight: FONT.bold },
  orderItem:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm },
  orderImg:     { width: 44, height: 44, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  orderImgReal: { width: 44, height: 44 },
  orderName:    { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray800 },
  orderQty:     { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  orderPrice:   { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800 },
  field:        { marginBottom: SPACING.md },
  label:        { fontSize: 13, fontWeight: FONT.bold, color: COLORS.gray600, marginBottom: 6 },
  hint:         { fontWeight: FONT.regular, color: COLORS.gray400, fontSize: 12 },
  inputWrap:    { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, backgroundColor: COLORS.gray50 },
  inputError:   { borderColor: COLORS.red },
  input:        { fontSize: 14, color: COLORS.gray800, padding: 0 },
  errorTxt:     { fontSize: 12, color: COLORS.red, fontWeight: FONT.semibold, marginTop: 4 },
  optRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8 },
  optRowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  radio:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.border },
  radioActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  optLabel:     { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800, flex: 1 },
  optDetail:    { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  optPrice:     { fontSize: 14, fontWeight: FONT.black, color: COLORS.gray800 },
  sumRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sumLabel:     { fontSize: 14, color: COLORS.gray400 },
  sumVal:       { fontSize: 14, fontWeight: FONT.bold, color: COLORS.gray800 },
  totalRow:     { borderTopWidth: 0.5, borderTopColor: COLORS.border, marginTop: 6, paddingTop: 10 },
  totalLabel:   { fontSize: 16, fontWeight: FONT.black, color: COLORS.gray800 },
  totalVal:     { fontSize: 20, fontWeight: FONT.black, color: COLORS.primary },
  guestNotice:  { flexDirection: 'row', gap: 10, backgroundColor: COLORS.blueLight, marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md },
  guestIcon:    { fontSize: 18 },
  guestTxt:     { flex: 1, fontSize: 13, color: COLORS.blue, lineHeight: 19 },
  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 16, padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, ...SHADOW.strong },
  bottomLabel:  { fontSize: 12, color: COLORS.gray400 },
  bottomTotal:  { fontSize: 20, fontWeight: FONT.black, color: COLORS.gray800 },
  confirmBtn:   { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', ...SHADOW.strong },
  confirmBtnTxt:{ color: COLORS.white, fontSize: 15, fontWeight: FONT.black },
});