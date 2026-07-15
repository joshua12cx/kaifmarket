// src/components/AuthToggle.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT, SPACING } from '../theme';

type Props = {
  active: 'login' | 'register';
  onChange: (tab: 'login' | 'register') => void;
};

export default function AuthToggle({ active, onChange }: Props) {
  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={[s.tab, active === 'login' && s.tabActive]}
        onPress={() => onChange('login')}
        activeOpacity={0.85}>
        <Text style={[s.txt, active === 'login' && s.txtActive]}>Iniciar sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.tab, active === 'register' && s.tabActive]}
        onPress={() => onChange('register')}
        activeOpacity={0.85}>
        <Text style={[s.txt, active === 'register' && s.txtActive]}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.blackSoft,
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  txt: {
    fontSize: 14,
    fontWeight: FONT.bold,
    color: COLORS.gray400,
  },
  txtActive: {
    color: COLORS.white,
    fontWeight: FONT.black,
  },
});