// src/navigation/AppNavigator.tsx
import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, ShoppingCart, Heart, User, LayoutDashboard, Package, ClipboardList, Store, Truck, MapPin, DollarSign } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen      from '../screens/SplashScreen';
import OnboardingScreen  from '../screens/OnboardingScreen';

import HomeScreen             from '../screens/HomeScreen';
import ProductDetailScreen    from '../screens/ProductDetailScreen';
import CartScreen             from '../screens/CartScreen';
import SearchScreen           from '../screens/SearchScreen';
import ProfileScreen          from '../screens/ProfileScreen';
import NotificationsScreen    from '../screens/NotificationsScreen';
import SellerStoreScreen      from '../screens/SellerStoreScreen';
import FavoritesScreen        from '../screens/FavoritesScreen';
import LoginScreen            from '../screens/LoginScreen';
import RegisterScreen         from '../screens/RegisterScreen';
import RegisterSuccessScreen  from '../screens/RegisterSuccessScreen';
import RoleSelectionScreen, { EntryIntent } from '../screens/RoleSelectionScreen';
import CheckoutScreen         from '../screens/CheckoutScreen';
import OrderSuccessScreen     from '../screens/OrderSuccessScreen';
import OrdersHistoryScreen    from '../screens/OrdersHistoryScreen';
import OrderTrackingScreen    from '../screens/OrderTrackingScreen';
import KaifPlusScreen         from '../screens/KaifPlusScreen';
import PaymentMethodsScreen   from '../screens/PaymentMethodsScreen';
import ComplaintsScreen       from '../screens/ComplaintsScreen';
import SellerDashboardScreen  from '../screens/SellerDashboardScreen';
import SellerRegisterScreen   from '../screens/SellerRegisterScreen';
import SellerApplicationSuccessScreen from '../screens/SellerApplicationSuccessScreen';
import SellerApplicationStatusScreen  from '../screens/SellerApplicationStatusScreen';
import MotorizadoRegisterScreen from '../screens/MotorizadoRegisterScreen';
import MotorizadoApplicationSuccessScreen from '../screens/MotorizadoApplicationSuccessScreen';
import MotorizadoApplicationStatusScreen  from '../screens/MotorizadoApplicationStatusScreen';
// ── Panel real de Transportista (NUEVO — Parte 1) ────────────────
import MotorizadoDashboardScreen  from '../screens/MotorizadoDashboardScreen';
import MotorizadoDeliveriesScreen from '../screens/MotorizadoDeliveriesScreen';
import MotorizadoMapScreen        from '../screens/MotorizadoMapScreen';
import MotorizadoEarningsScreen   from '../screens/MotorizadoEarningsScreen';
import MotorizadoProfileScreen    from '../screens/MotorizadoProfileScreen';
import SellerAddProductScreen from '../screens/SellerAddProductScreen';
import SellerProductsScreen   from '../screens/SellerProductsScreen';
import SellerReviewsScreen    from '../screens/SellerReviewsScreen';
import SellerOrdersScreen     from '../screens/SellerOrdersScreen';
import SellerEditStore        from '../screens/SellerEditStore';
import SellerTiendaScreen     from '../screens/SellerTiendaScreen';
import SellerProfileScreen    from '../screens/SellerProfileScreen';
import SellerPlusScreen       from '../screens/SellerPlusScreen';

import { COLORS, RADIUS, FONT } from '../theme';
import { useCart, useNotifs, useFavs, useAuth } from '../context';

export type RootStackParamList = {
  HomeMain:         undefined;
  ProductDetail:    { productId: number | string };
  Cart:             undefined;
  Notifications:    undefined;
  Profile:          undefined;
  SearchMain:       undefined;
  SellerStore:      { sellerId: string };
  Favorites:        undefined;
  Login:            undefined;
  Register:         undefined;
  RegisterSuccess:  undefined;
  Checkout:         undefined;
  OrderSuccess:     { orderId: string; total: number; email: string; delivery: string; payment: string };
  OrdersHistory:    undefined;
  OrderTracking:    { orderId: string };
  KaifPlus:         undefined;
  PaymentMethods:   undefined;
  Complaints:       undefined;
  SellerApplicationSuccess: undefined;
  SellerApplicationStatus:  undefined;
  MotorizadoRegister: undefined;
  MotorizadoApplicationSuccess: undefined;
  MotorizadoApplicationStatus:  undefined;
  SellerDashboard:  undefined;
  SellerRegister:   undefined;
  SellerAddProduct: { sellerId: string; product?: any };
  SellerProducts:   { sellerId: string };
  SellerReviews:    { sellerId: string };
  SellerOrders:     { sellerId: string };
  SellerEditStore:  { seller: any };
  SellerTienda:     undefined;
  SellerPlus:       undefined;
  SellerProfileMain: undefined;
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

// ── Tabs del modo VENDEDOR (barra dorada, aparte de la del comprador) ──
export type SellerTabParamList = {
  SellerPanelTab:   undefined;
  SellerProductsTab: undefined;
  SellerOrdersTab:  undefined;
  SellerStoreTab:   undefined;
  SellerProfileTab: undefined;
};
const SellerTab = createBottomTabNavigator<SellerTabParamList>();

// ── Tabs del modo TRANSPORTISTA (barra verde, NUEVO — Parte 1) ────
export type MotorizadoTabParamList = {
  MotorizadoHomeTab:       undefined;
  MotorizadoDeliveriesTab: undefined;
  MotorizadoMapTab:        undefined;
  MotorizadoEarningsTab:   undefined;
  MotorizadoProfileTab:    undefined;
};
const MotorizadoTab = createBottomTabNavigator<MotorizadoTabParamList>();

// Contexto chiquito para que cualquier pantalla dentro del modo
// Vendedor (o Comprador) pueda pedir "volver a elegir rol" sin
// necesitar pasar por props/navigation — usado por el botón
// "Cambiar de rol" en SellerProfileScreen.
type AppModeContextType = { resetToRoleSelection: () => void };
const AppModeContext = createContext<AppModeContextType | null>(null);
export const useAppMode = () => useContext(AppModeContext)!;

// ══════════════════════════════════════════════════════════════════
//  AUTH STACK — Login / Register (sin acceso a nada más)
// ══════════════════════════════════════════════════════════════════
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"           component={LoginScreen} />
      <Stack.Screen name="Register"        component={RegisterScreen} />
      <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} />
    </Stack.Navigator>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STACKS DE LA APP PRINCIPAL (solo se montan ya autenticado)
// ══════════════════════════════════════════════════════════════════
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"      component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Cart"          component={CartScreen} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess"  component={OrderSuccessScreen} />
      <Stack.Screen name="OrdersHistory" component={OrdersHistoryScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
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
      <Stack.Screen name="Cart"          component={CartScreen} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess"  component={OrderSuccessScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Favorites"     component={FavoritesScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart"          component={CartScreen} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess"  component={OrderSuccessScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack({ initialRouteName = 'Profile' }: { initialRouteName?: 'Profile' | 'SellerDashboard' | 'SellerRegister' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"          component={ProfileScreen} />
      <Stack.Screen name="Cart"             component={CartScreen} />
      <Stack.Screen name="Checkout"         component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess"     component={OrderSuccessScreen} />
      <Stack.Screen name="OrdersHistory"    component={OrdersHistoryScreen} />
      <Stack.Screen name="OrderTracking"    component={OrderTrackingScreen} />
      <Stack.Screen name="KaifPlus"         component={KaifPlusScreen} />
      <Stack.Screen name="PaymentMethods"   component={PaymentMethodsScreen} />
      <Stack.Screen name="Complaints"       component={ComplaintsScreen} />
      <Stack.Screen name="ProductDetail"    component={ProductDetailScreen} />
      <Stack.Screen name="SellerStore"      component={SellerStoreScreen} />
      <Stack.Screen name="SellerDashboard"  component={SellerDashboardScreen} />
      <Stack.Screen name="SellerRegister"   component={SellerRegisterScreen} />
      <Stack.Screen name="SellerAddProduct" component={SellerAddProductScreen} />
      <Stack.Screen name="SellerProducts"   component={SellerProductsScreen} />
      <Stack.Screen name="SellerReviews"    component={SellerReviewsScreen} />
      <Stack.Screen name="SellerOrders"     component={SellerOrdersScreen} />
      <Stack.Screen name="SellerEditStore"  component={SellerEditStore} />
    </Stack.Navigator>
  );
}

const TABS = [
  { name: 'HomeTab'      as const, Icon: Home,   label: 'Inicio'    },
  { name: 'SearchTab'    as const, Icon: Search, label: 'Buscar'    },
  { name: 'OffersTab'    as const, Icon: ShoppingCart, label: 'Carrito'   },
  { name: 'FavoritesTab' as const, Icon: Heart,  label: 'Favoritos' },
  { name: 'ProfileTab'   as const, Icon: User,   label: 'Perfil'    },
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
        const Icon    = tab.Icon;

        return (
          <TouchableOpacity
            key={route.key}
            style={tb.item}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}>
            <View style={tb.iconWrap}>
              <View style={[tb.iconBg, focused && tb.iconBgActive]}>
                <Icon
                  size={20}
                  color={focused ? COLORS.primary : COLORS.gray400}
                  strokeWidth={2}
                  fill={focused && tab.name === 'FavoritesTab' ? COLORS.primary : 'none'}
                />
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

// ══════════════════════════════════════════════════════════════════
//  MODO VENDEDOR — barra de tabs dorada, aparte de la del comprador
// ══════════════════════════════════════════════════════════════════
const SELLER_TABS = [
  { name: 'SellerPanelTab'    as const, Icon: LayoutDashboard, label: 'Panel'     },
  { name: 'SellerProductsTab' as const, Icon: Package,         label: 'Productos' },
  { name: 'SellerOrdersTab'   as const, Icon: ClipboardList,   label: 'Pedidos'   },
  { name: 'SellerStoreTab'    as const, Icon: Store,           label: 'Tienda'    },
  { name: 'SellerProfileTab'  as const, Icon: User,            label: 'Perfil'    },
];

function KaifSellerTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={sellerTb.bar}>
      {state.routes.map((route, index) => {
        const tab     = SELLER_TABS[index];
        const focused = state.index === index;
        const Icon    = tab.Icon;
        return (
          <TouchableOpacity
            key={route.key}
            style={tb.item}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}>
            <View style={tb.iconWrap}>
              <View style={[tb.iconBg, focused && sellerTb.iconBgActive]}>
                <Icon size={20} color={focused ? COLORS.gold : COLORS.gray400} strokeWidth={2} />
              </View>
            </View>
            <Text style={[tb.label, focused && sellerTb.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SellerProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerProducts"   component={SellerProductsScreen} />
      <Stack.Screen name="SellerAddProduct" component={SellerAddProductScreen} />
    </Stack.Navigator>
  );
}

function SellerStoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerTienda"    component={SellerTiendaScreen} />
      <Stack.Screen name="SellerEditStore" component={SellerEditStore} />
      <Stack.Screen name="SellerPlus"      component={SellerPlusScreen} />
    </Stack.Navigator>
  );
}

function SellerProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerProfileMain" component={SellerProfileScreen} />
      <Stack.Screen name="SellerPlus"         component={SellerPlusScreen} />
    </Stack.Navigator>
  );
}

function SellerTabs() {
  return (
    <SellerTab.Navigator
      tabBar={props => <KaifSellerTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <SellerTab.Screen name="SellerPanelTab"    component={SellerDashboardScreen} />
      <SellerTab.Screen name="SellerProductsTab" component={SellerProductsStack} />
      <SellerTab.Screen name="SellerOrdersTab"   component={SellerOrdersScreen} />
      <SellerTab.Screen name="SellerStoreTab"    component={SellerStoreStack} />
      <SellerTab.Screen name="SellerProfileTab"  component={SellerProfileStack} />
    </SellerTab.Navigator>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MODO TRANSPORTISTA — barra de tabs verde (NUEVO — Parte 1)
//  Mismo layout que las otras barras; solo cambia el color activo.
// ══════════════════════════════════════════════════════════════════
const MOTORIZADO_TABS = [
  { name: 'MotorizadoHomeTab'       as const, Icon: Home,       label: 'Inicio'    },
  { name: 'MotorizadoDeliveriesTab' as const, Icon: Truck,      label: 'Entregas'  },
  { name: 'MotorizadoMapTab'        as const, Icon: MapPin,     label: 'Mapa'      },
  { name: 'MotorizadoEarningsTab'   as const, Icon: DollarSign, label: 'Ganancias' },
  { name: 'MotorizadoProfileTab'    as const, Icon: User,       label: 'Perfil'    },
];

function KaifMotorizadoTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={motorizadoTb.bar}>
      {state.routes.map((route, index) => {
        const tab     = MOTORIZADO_TABS[index];
        const focused = state.index === index;
        const Icon    = tab.Icon;
        return (
          <TouchableOpacity
            key={route.key}
            style={tb.item}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}>
            <View style={tb.iconWrap}>
              <View style={[tb.iconBg, focused && motorizadoTb.iconBgActive]}>
                <Icon size={20} color={focused ? COLORS.green : COLORS.gray400} strokeWidth={2} />
              </View>
            </View>
            <Text style={[tb.label, focused && motorizadoTb.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MotorizadoTabs() {
  return (
    <MotorizadoTab.Navigator
      tabBar={props => <KaifMotorizadoTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <MotorizadoTab.Screen name="MotorizadoHomeTab"       component={MotorizadoDashboardScreen} />
      <MotorizadoTab.Screen name="MotorizadoDeliveriesTab" component={MotorizadoDeliveriesScreen} />
      <MotorizadoTab.Screen name="MotorizadoMapTab"        component={MotorizadoMapScreen} />
      <MotorizadoTab.Screen name="MotorizadoEarningsTab"   component={MotorizadoEarningsScreen} />
      <MotorizadoTab.Screen name="MotorizadoProfileTab"    component={MotorizadoProfileScreen} />
    </MotorizadoTab.Navigator>
  );
}

function SellerRegisterStack({ initialRouteName = 'SellerRegister' }: { initialRouteName?: 'SellerRegister' | 'SellerApplicationStatus' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerRegister"           component={SellerRegisterScreen} />
      <Stack.Screen name="SellerApplicationSuccess" component={SellerApplicationSuccessScreen} />
      <Stack.Screen name="SellerApplicationStatus"  component={SellerApplicationStatusScreen} />
      {/* Registrada acá también porque SellerRegisterScreen navega
          hacia acá al terminar de enviar la solicitud (queda "pending") */}
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
    </Stack.Navigator>
  );
}

function MotorizadoRegisterStack({ initialRouteName = 'MotorizadoRegister' }: { initialRouteName?: 'MotorizadoRegister' | 'MotorizadoApplicationStatus' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MotorizadoRegister"           component={MotorizadoRegisterScreen} />
      <Stack.Screen name="MotorizadoApplicationSuccess" component={MotorizadoApplicationSuccessScreen} />
      <Stack.Screen name="MotorizadoApplicationStatus"  component={MotorizadoApplicationStatusScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <KaifTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab"      component={HomeStack} />
      <Tab.Screen name="SearchTab"    component={SearchStack} />
      <Tab.Screen name="OffersTab"    component={CartScreen} />
      <Tab.Screen name="FavoritesTab" component={FavoritesStack} />
      <Tab.Screen name="ProfileTab"   component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ROOT — Splash → Onboarding → (Login/Register) → RoleSelection → App
// ══════════════════════════════════════════════════════════════════
type AppState = 'splash' | 'onboarding' | 'ready';

export default function AppNavigator() {
  const { loading, user, isAuthenticated } = useAuth();
  const { loadFavs, clearFavs } = useFavs();
  const [appState, setAppState] = useState<AppState>('splash');

  // El usuario tiene que volver a elegir su rol cada vez que hay
  // una sesión nueva (login). Se resetea automáticamente al cerrar sesión.
  // Ahora guarda TAMBIÉN dónde debe aterrizar dentro de la app
  // (ej: directo en SellerDashboard si ya es vendedor aprobado).
  const [entryIntent, setEntryIntent] = useState<EntryIntent | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadFavs(user.id);
    } else {
      clearFavs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) { setEntryIntent(null); }
  }, [isAuthenticated]);

  const handleSplashDone = async () => {
    const seen = await AsyncStorage.getItem('onboarding_done');
    setAppState(seen ? 'ready' : 'onboarding');
  };

  const handleOnboardingDone = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    setAppState('ready');
  };

  if (loading || appState === 'splash') {
    return <SplashScreen onFinish={handleSplashDone} />;
  }

  if (appState === 'onboarding') {
    return <OnboardingScreen onFinish={handleOnboardingDone} />;
  }

  // ── GATE DE AUTENTICACIÓN ──────────────────────────────────────
  // A partir de aquí YA NO se puede ver ni un producto sin haber
  // iniciado sesión o registrado una cuenta primero.
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // ── SELECCIÓN DE ROL ─────────────────────────────────────────
  if (!entryIntent) {
    return <RoleSelectionScreen onContinue={setEntryIntent} />;
  }

  // ── MODO VENDEDOR ────────────────────────────────────────────
  if (entryIntent.mode === 'seller') {
    return (
      <AppModeContext.Provider value={{ resetToRoleSelection: () => setEntryIntent(null) }}>
        <NavigationContainer>
          {entryIntent.sellerScreen === 'register'
            ? <SellerRegisterStack initialRouteName="SellerRegister" />
            : entryIntent.sellerScreen === 'status'
            ? <SellerRegisterStack initialRouteName="SellerApplicationStatus" />
            : <SellerTabs />}
        </NavigationContainer>
      </AppModeContext.Provider>
    );
  }

  // ── MODO TRANSPORTISTA ───────────────────────────────────────
  // Parte 1: el caso 'panel' (transportista APROBADO, viene de
  // RoleSelectionScreen) ahora sí abre el panel real con tabs
  // verdes — antes caía incorrectamente en la pantalla de estado.
  if (entryIntent.mode === 'motorizado') {
    return (
      <AppModeContext.Provider value={{ resetToRoleSelection: () => setEntryIntent(null) }}>
        <NavigationContainer>
          {entryIntent.motorizadoScreen === 'panel'
            ? <MotorizadoTabs />
            : <MotorizadoRegisterStack
                initialRouteName={entryIntent.motorizadoScreen === 'register' ? 'MotorizadoRegister' : 'MotorizadoApplicationStatus'}
              />}
        </NavigationContainer>
      </AppModeContext.Provider>
    );
  }

  // ── MODO COMPRADOR ───────────────────────────────────────────
  return (
    <AppModeContext.Provider value={{ resetToRoleSelection: () => setEntryIntent(null) }}>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </AppModeContext.Provider>
  );
}

const tb = StyleSheet.create({
  bar:          { flexDirection: 'row', backgroundColor: COLORS.black, borderTopWidth: 0.5, borderTopColor: COLORS.blackSoft, paddingBottom: 20, paddingTop: 6, paddingHorizontal: 4 },
  item:         { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap:     { position: 'relative', alignItems: 'center' },
  iconBg:       { width: 40, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full },
  iconBgActive: { backgroundColor: COLORS.primary + '22' },
  label:        { fontSize: 10, fontWeight: FONT.semibold, color: COLORS.gray400 },
  labelActive:  { color: COLORS.primary, fontWeight: FONT.black },
  badge:        { position: 'absolute', top: -4, right: -8, backgroundColor: COLORS.primary, borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.black },
  badgeTxt:     { color: '#fff', fontSize: 9, fontWeight: FONT.black },
});

// Barra del modo Vendedor: mismo layout que "tb", pero fondo oscuro
// y acentos dorados en vez de rojo/blanco.
const sellerTb = StyleSheet.create({
  bar:          { flexDirection: 'row', backgroundColor: COLORS.black, borderTopWidth: 0.5, borderTopColor: COLORS.blackSoft, paddingBottom: 20, paddingTop: 6, paddingHorizontal: 4 },
  iconBgActive: { backgroundColor: COLORS.gold + '22' },
  labelActive:  { color: COLORS.gold, fontWeight: FONT.black },
});

// Barra del modo Transportista: mismo layout, acentos verdes.
const motorizadoTb = StyleSheet.create({
  bar:          { flexDirection: 'row', backgroundColor: COLORS.black, borderTopWidth: 0.5, borderTopColor: COLORS.blackSoft, paddingBottom: 20, paddingTop: 6, paddingHorizontal: 4 },
  iconBgActive: { backgroundColor: COLORS.green + '22' },
  labelActive:  { color: COLORS.green, fontWeight: FONT.black },
});