import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { ShieldCheck, Package, Truck } from 'lucide-react-native';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    badge: '60,000+ productos disponibles',
    BadgeIcon: Package,
    title: 'Compra lo mejor\ndel Perú',
    desc: 'Miles de productos de vendedores verificados.\nCalidad garantizada en cada compra.',
    btn: 'Siguiente',
  },
  {
    key: '2',
    badge: '100% seguro y confiable',
    BadgeIcon: ShieldCheck,
    title: 'Vendedores\nverificados',
    desc: 'Cada vendedor pasa por verificación rigurosa.\nTu seguridad y dinero están protegidos.',
    btn: 'Siguiente',
  },
  {
    key: '3',
    badge: 'Entrega en 24-48 horas',
    BadgeIcon: Truck,
    title: 'Envíos rápidos a\ntodo el Perú',
    desc: 'Logística premium con seguimiento en tiempo\nreal directo en la app.',
    btn: 'Continuar',
  },
];

type Props = {
  onFinish: () => void;
};

export default function OnboardingScreen({ onFinish }: Props) {
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrent(next);
    } else {
      onFinish();
    }
  };

  const skip = () => onFinish();
  const slide = SLIDES[current];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Saltar */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={s.skipBtn} onPress={skip} activeOpacity={0.7}>
          <Text style={s.skipTxt}>Saltar</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const Icon = item.BadgeIcon;
          return (
            <View style={s.slide}>
              {/* Logo sin fondo */}
              <View style={s.logoWrap}>
                <Image
                  source={require('../assets/logo.png')}
                  style={s.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Badge */}
              <View style={s.badge}>
                <Icon size={14} color={COLORS.gold} strokeWidth={2} />
                <Text style={s.badgeTxt}>{item.badge}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom: dots + copy + CTA */}
      <View style={s.bottom}>
        {/* Dots centrados */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === current ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>

        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.desc}>{slide.desc}</Text>

        <TouchableOpacity style={s.btn} onPress={goNext} activeOpacity={0.85}>
          <Text style={s.btnTxt}>{slide.btn}  ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const LOGO_SIZE = W * 0.75; // responsive: 55% del ancho del cel

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: SPACING.lg,
    zIndex: 10,
  },
  skipTxt: {
    color: '#888',
    fontSize: 14,
    fontWeight: FONT.semibold,
  },

  // Slide
  slide: {
    width: W,
    alignItems: 'center',
    paddingTop: H * 0.13, // responsive: 9% de la altura del cel
  },

  // Logo — sin fondo, solo la imagen
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // sin fondo negro
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: H * 0.03,
  },
  badgeTxt: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: FONT.semibold,
  },

  // Bottom
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: H * 0.05,
  },

  // Dots centrados
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center', // <-- centrado
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#333',
  },

  // Copy
  title: {
    fontSize: W * 0.07, // responsive
    fontWeight: FONT.black,
    color: '#FFFFFF',
    lineHeight: W * 0.085,
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 21,
    marginBottom: 28,
  },

  // Botón
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: FONT.black,
    letterSpacing: 0.3,
  },
});