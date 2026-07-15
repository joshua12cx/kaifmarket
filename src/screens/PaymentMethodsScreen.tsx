// src/screens/PaymentMethodsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Smartphone, Heart, CreditCard, Plus, Trash2,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useAuth } from '../context';
import { supabase } from '../lib/supabase';

const TYPE_META: Record<string, { label: string; icon: any; color: string; group: string; placeholder: string }> = {
  yape:       { label: 'Yape',       icon: Smartphone, color: '#7C3AED', group: 'Billeteras digitales · Perú', placeholder: '+51 999 999 999' },
  plin:       { label: 'Plin',       icon: Heart,       color: '#2563EB', group: 'Billeteras digitales · Perú', placeholder: '+51 999 999 999' },
  visa:       { label: 'Visa',       icon: CreditCard,  color: '#1E3A8A', group: 'Tarjetas',                     placeholder: 'Últimos 4 dígitos' },
  mastercard: { label: 'Mastercard', icon: CreditCard,  color: '#7C2D12', group: 'Tarjetas',                     placeholder: 'Últimos 4 dígitos' },
  paypal:     { label: 'PayPal',     icon: CreditCard,  color: '#2563EB', group: 'Internacional',                placeholder: 'Tu correo de PayPal' },
  google_pay: { label: 'Google Pay', icon: CreditCard,  color: '#2563EB', group: 'Internacional',                placeholder: 'Cuenta de Google' },
  apple_pay:  { label: 'Apple Pay',  icon: CreditCard,  color: '#111827', group: 'Internacional',                placeholder: 'Touch ID / Face ID' },
};
const GROUP_ORDER = ['Billeteras digitales · Perú', 'Tarjetas', 'Internacional'];

export default function PaymentMethodsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [newType, setNewType] = useState<string | null>(null);
  const [newDetail, setNewDetail] = useState('');
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from('payment_methods').select('*').eq('user_id', user.id).order('created_at');
    setMethods(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const setDefault = async (id: string) => {
    if (!user?.id) { return; }
    await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
    load();
  };

  const remove = (id: string) => {
    Alert.alert('Eliminar método de pago', '¿Seguro que quieres quitarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => { await supabase.from('payment_methods').delete().eq('id', id); load(); },
      },
    ]);
  };

  const saveNew = async () => {
    if (!newType || !newDetail.trim() || !user?.id) { return; }
    setSaving(true);
    const meta = TYPE_META[newType];
    const { error } = await supabase.from('payment_methods').insert({
      user_id: user.id,
      type: newType,
      label: meta.label,
      detail: newDetail.trim(),
      is_default: methods.length === 0,
    });
    setSaving(false);
    if (error) { Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.'); return; }
    setAdding(false); setNewType(null); setNewDetail('');
    load();
  };

  const grouped = GROUP_ORDER.map(group => ({
    group,
    items: methods.filter(m => TYPE_META[m.type]?.group === group),
  })).filter(g => g.items.length > 0);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Métodos de pago</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {grouped.length === 0 && !adding && (
            <View style={s.empty}>
              <CreditCard size={40} color={COLORS.gray600} strokeWidth={1.5} />
              <Text style={s.emptyTxt}>Todavía no tienes métodos de pago guardados</Text>
            </View>
          )}

          {grouped.map(({ group, items }) => (
            <View key={group} style={{ marginBottom: SPACING.lg }}>
              <Text style={s.groupTitle}>{group.toUpperCase()}</Text>
              {items.map(m => {
                const meta = TYPE_META[m.type];
                const Icon = meta?.icon || CreditCard;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.row, m.is_default && s.rowDefault]}
                    onLongPress={() => remove(m.id)}
                    onPress={() => !m.is_default && setDefault(m.id)}
                    activeOpacity={0.8}>
                    <View style={[s.iconWrap, { backgroundColor: (meta?.color || COLORS.gray600) + '33' }]}>
                      <Icon size={18} color={meta?.color || COLORS.gray400} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowLabel}>{meta?.label || m.type}</Text>
                      <Text style={s.rowDetail}>{m.detail}</Text>
                    </View>
                    {m.is_default ? (
                      <View style={s.defaultBadge}><Text style={s.defaultBadgeTxt}>POR DEFECTO</Text></View>
                    ) : (
                      <TouchableOpacity onPress={() => remove(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Trash2 size={16} color={COLORS.gray600} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* ── AGREGAR NUEVO ── */}
          {adding ? (
            <View style={s.addCard}>
              <Text style={s.addTitle}>Elige el tipo</Text>
              <View style={s.typeGrid}>
                {Object.entries(TYPE_META).map(([key, meta]) => (
                  <TouchableOpacity
                    key={key}
                    style={[s.typeBtn, newType === key && s.typeBtnActive]}
                    onPress={() => setNewType(key)}>
                    <Text style={[s.typeBtnTxt, newType === key && s.typeBtnTxtActive]}>{meta.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newType && (
                <>
                  <Text style={s.addLabel}>{TYPE_META[newType].placeholder}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={TYPE_META[newType].placeholder}
                    placeholderTextColor={COLORS.gray600}
                    value={newDetail}
                    onChangeText={setNewDetail}
                  />
                </>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: SPACING.md }}>
                <TouchableOpacity
                  style={s.cancelAddBtn}
                  onPress={() => { setAdding(false); setNewType(null); setNewDetail(''); }}>
                  <Text style={s.cancelAddTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, (!newType || !newDetail.trim()) && { opacity: 0.5 }]}
                  disabled={!newType || !newDetail.trim() || saving}
                  onPress={saveNew}>
                  {saving
                    ? <ActivityIndicator color={COLORS.black} size="small" />
                    : <Text style={s.saveBtnTxt}>Guardar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.addRow} onPress={() => setAdding(true)} activeOpacity={0.8}>
              <Plus size={16} color={COLORS.gray400} strokeWidth={2} />
              <Text style={s.addRowTxt}>Agregar método de pago</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.black },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: FONT.black, color: COLORS.white },

  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt:     { fontSize: 13, color: COLORS.gray400, textAlign: 'center', paddingHorizontal: 30 },

  groupTitle:   { fontSize: 11, fontWeight: FONT.bold, color: COLORS.gray600, letterSpacing: 0.5, marginBottom: SPACING.sm },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'transparent' },
  rowDefault:   { borderColor: COLORS.red },
  iconWrap:     { width: 40, height: 40, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  rowLabel:     { fontSize: 14, fontWeight: FONT.bold, color: COLORS.white },
  rowDetail:    { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  defaultBadge: { backgroundColor: COLORS.red + '22', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  defaultBadgeTxt: { fontSize: 9, fontWeight: FONT.black, color: COLORS.red },

  addRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.gray800, borderStyle: 'dashed', borderRadius: RADIUS.lg, paddingVertical: 16 },
  addRowTxt:    { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.semibold },

  addCard:      { backgroundColor: COLORS.blackSoft, borderRadius: RADIUS.xl, padding: SPACING.lg },
  addTitle:     { fontSize: 13, fontWeight: FONT.bold, color: COLORS.white, marginBottom: SPACING.sm },
  typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  typeBtn:      { borderWidth: 1.5, borderColor: COLORS.gray800, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  typeBtnActive:{ backgroundColor: COLORS.red, borderColor: COLORS.red },
  typeBtnTxt:   { fontSize: 12, color: COLORS.gray400, fontWeight: FONT.semibold },
  typeBtnTxtActive: { color: COLORS.white },
  addLabel:     { fontSize: 12, color: COLORS.gray400, marginBottom: 6 },
  input:        { backgroundColor: COLORS.black, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.gray800, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.white, fontSize: 14 },
  cancelAddBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.gray800 },
  cancelAddTxt: { fontSize: 13, color: COLORS.gray400, fontWeight: FONT.bold },
  saveBtn:      { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: RADIUS.lg, backgroundColor: COLORS.red },
  saveBtnTxt:   { fontSize: 13, color: COLORS.white, fontWeight: FONT.black },
});