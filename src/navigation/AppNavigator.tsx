// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen            from '../screens/HomeScreen';
import ProductDetailScreen   from '../screens/ProductDetailScreen';
import CartScreen            from '../screens/CartScreen';
import SearchScreen          from '../screens/SearchScreen';
import ProfileScreen         from '../screens/ProfileScreen';
import NotificationsScreen   from '../screens/NotificationsScreen';
import SellerStoreScreen     from '../screens/SellerStoreScreen';
import FavoritesScreen       from '../screens/FavoritesScreen';

import { COLORS, RADIUS, FONT, SPACING } from '../theme';
import { useCart, useNotifs, useFavs } from '../context';

// ── TIPOS ─────────────────────────────────────────────────────────
export type RootStackParamList = {
  HomeMain:      undefined;
  ProductDetail: { productId: number };
  Cart:          undefined;
  Notifications: undefined;
  Profile:       undefined;
  SearchMain:    undefined;
  SellerStore:   { sellerId: string };
  Favorites:     undefined;
};

export type TabParamList = {
  HomeTab:      undefined;
  SearchTab:    undefined;
  OffersTab:    undefined;
  FavoritesTab: undefined;
  ProfileTab:   undefined;
};

const Tab   = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// ── STACKS ────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"      component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Cart"          component={CartScreen} />
      <Stack.Screen name="SellerStore"   component={SellerStoreScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain"    component={SearchScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="SellerStore"   component={SellerStoreScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Favorites"     component={FavoritesScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"       component={ProfileScreen} />
      <Stack.Screen name="Cart"          component={CartScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

// ── TAB BAR PERSONALIZADA — 5 tabs estilo Yandex ─────────────────
const TABS = [
  { name: 'HomeTab' as const,      icon: '🏠',  label: 'Inicio'     },
  { name: 'SearchTab' as const,    icon: '🔍',  label: 'Buscar'     },
  { name: 'OffersTab' as const,    icon: '🏷️',  label: 'Ofertas'    },
  { name: 'FavoritesTab' as const, icon: '❤️',  label: 'Favoritos'  },
  { name: 'ProfileTab' as const,   icon: '👤',  label: 'Perfil'     },
];

function KaifTabBar({ state, navigation }: BottomTabBarProps) {
  const { totalItems }  = useCart();
  const { unreadCount } = useNotifs();
  const { favCount }    = useFavs();

  const getBadge = (name: string) => {
    if (name === 'HomeTab')      return unreadCount;
    if (name === 'OffersTab')    return totalItems;
    if (name === 'FavoritesTab') return favCount;
    return 0;
  };

  return (
    <View style={tb.bar}>
      {state.routes.map((route, index) => {
        const tab     = TABS[index];
        const focused = state.index === index;
        const badge   = getBadge(route.name);

        return (
          <TouchableOpacity
            key={route.key}
            style={tb.item}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}>
            <View style={tb.iconWrap}>
              {/* Ícono con fondo cuando está activo */}
              <View style={[tb.iconBg, focused && tb.iconBgActive]}>
                <Text style={[tb.icon, focused && tb.iconActive]}>{tab.icon}</Text>
              </View>
              {badge > 0 && (
                <View style={tb.badge}>
                  <Text style={tb.badgeTxt}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[tb.label, focused && tb.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── ROOT NAVIGATOR ────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={props => <KaifTabBar {...props} />}
        screenOptions={{ headerShown: false }}>
        <Tab.Screen name="HomeTab"      component={HomeStack} />
        <Tab.Screen name="SearchTab"    component={SearchStack} />
        <Tab.Screen name="OffersTab"    component={CartScreen} />
        <Tab.Screen name="FavoritesTab" component={FavoritesStack} />
        <Tab.Screen name="ProfileTab"   component={ProfileStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const tb = StyleSheet.create({
  bar:          { flexDirection: 'row', backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingBottom: 20, paddingTop: 6, paddingHorizontal: 4 },
  item:         { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap:     { position: 'relative', alignItems: 'center' },
  iconBg:       { width: 40, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full },
  iconBgActive: { backgroundColor: COLORS.primaryLight },
  icon:         { fontSize: 20, opacity: 0.45 },
  iconActive:   { opacity: 1 },
  label:        { fontSize: 10, fontWeight: FONT.semibold, color: COLORS.gray400 },
  labelActive:  { color: COLORS.primary, fontWeight: FONT.black },
  badge:        { position: 'absolute', top: -4, right: -8, backgroundColor: COLORS.red, borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt:     { color: '#fff', fontSize: 9, fontWeight: FONT.black },
});
