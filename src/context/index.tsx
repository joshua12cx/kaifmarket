// src/context/index.tsx
import React, {
  createContext, useContext, useReducer,
  useMemo, useState, useEffect,
} from 'react';
import { supabase, AuthUser } from '../lib/supabase';
import { NOTIFICATIONS as NOTIF_DATA } from '../data';

// ══════════════════════════════════════════════════════════════════
//  CART CONTEXT — soporta id numérico (estático) y string (Supabase)
// ══════════════════════════════════════════════════════════════════
interface CartState { items: Record<string, number>; }
type CartAction =
  | { type: 'ADD';       id: string | number }
  | { type: 'REMOVE';    id: string | number }
  | { type: 'INCREMENT'; id: string | number }
  | { type: 'DECREMENT'; id: string | number }
  | { type: 'CLEAR' };

interface CartContextType {
  items:      Record<string, number>;
  dispatch:   React.Dispatch<CartAction>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  const key = String(action.type === 'CLEAR' ? '' : (action as any).id);
  switch (action.type) {
    case 'ADD':
      return { items: { ...state.items, [key]: (state.items[key] || 0) + 1 } };
    case 'REMOVE': {
      const next = { ...state.items };
      delete next[key];
      return { items: next };
    }
    case 'INCREMENT':
      return { items: { ...state.items, [key]: (state.items[key] || 0) + 1 } };
    case 'DECREMENT': {
      const qty = (state.items[key] || 0) - 1;
      if (qty <= 0) {
        const next = { ...state.items };
        delete next[key];
        return { items: next };
      }
      return { items: { ...state.items, [key]: qty } };
    }
    case 'CLEAR':
      return { items: {} };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: {} });
  const totalItems = useMemo(
    () => Object.values(state.items).reduce((a, b) => a + b, 0),
    [state.items],
  );
  return (
    <CartContext.Provider value={{ items: state.items, dispatch, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext)!;

// ══════════════════════════════════════════════════════════════════
//  AUTH CONTEXT
// ══════════════════════════════════════════════════════════════════
interface AuthContextType {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isPlus:          boolean;
  isSeller:        boolean;
  loading:         boolean;
  login:           (email: string, password: string) => Promise<{ error?: string }>;
  register:        (data: RegisterData) => Promise<{ error?: string }>;
  logout:          () => Promise<void>;
  activatePlus:    () => void;
  updateUser:      (data: Partial<AuthUser>) => void;
}

export interface RegisterData {
  name:     string;
  email:    string;
  password: string;
  gender:   'male' | 'female' | 'other';
  isSeller: boolean;
  phone?:   string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlus,  setIsPlus]  = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (e) {
        if (__DEV__) { console.log('[AUTH] Session check error:', e); }
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users').select('*').eq('id', userId).single();

      if (__DEV__) { console.log('[AUTH] fetchProfile:', { data, error }); }

      if (data && !error) {
        setUser(data as AuthUser);
        setIsPlus(data.is_plus || false);
      }
    } catch (e) {
      if (__DEV__) { console.log('[AUTH] fetchProfile error:', e); }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (__DEV__) { console.log('[AUTH] Login start:', email); }

      const { data, error } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });

      if (__DEV__) { console.log('[AUTH] Login done:', { userId: data?.user?.id, error }); }

      if (error) {
        if (error.message.includes('Invalid login')) {
          return { error: 'Email o contraseña incorrectos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Confirma tu email antes de entrar' };
        }
        return { error: `Error: ${error.message}` };
      }

      if (data?.user) {
        await fetchUserProfile(data.user.id);
      }

      return {};

    } catch (e: any) {
      if (__DEV__) { console.log('[AUTH] Login error:', e?.message); }
      return { error: 'Error de conexión. Verifica tu internet.' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      if (__DEV__) { console.log('[AUTH] Register start:', data.email); }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    data.email.trim().toLowerCase(),
        password: data.password,
        options:  { data: { name: data.name } },
      });

      if (__DEV__) { console.log('[AUTH] signUp:', { userId: authData?.user?.id, authError }); }

      if (authError) {
        if (authError.message.includes('already registered')) {
          return { error: 'Este email ya está registrado' };
        }
        return { error: 'Error al crear la cuenta. Intenta de nuevo.' };
      }

      if (!authData.user) {
        return { error: 'Error inesperado. Intenta de nuevo.' };
      }

      const initials = data.name
        ? data.name.trim().split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
        : 'KM';

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id:        authData.user.id,
          email:     data.email.trim().toLowerCase(),
          name:      data.name      || null,
          avatar:    initials,
          gender:    data.gender    || null,
          phone:     data.phone     || null,
          is_plus:   false,
          is_seller: data.isSeller  || false,
          location:  'Lima, Perú',
        });

      if (__DEV__) { console.log('[AUTH] Profile insert:', { profileError }); }

      // Vincular pedidos de invitado
      const { data: guestOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_email', data.email.trim().toLowerCase())
        .is('buyer_id', null);

      if (guestOrders && guestOrders.length > 0) {
        await supabase
          .from('orders')
          .update({ buyer_id: authData.user.id })
          .eq('buyer_email', data.email.trim().toLowerCase())
          .is('buyer_id', null);
        if (__DEV__) { console.log('[AUTH] Linked', guestOrders.length, 'guest orders'); }
      }

      if (data.isSeller) {
        await supabase.from('sellers').insert({
          user_id:     authData.user.id,
          name:        data.name || 'Mi Tienda',
          is_premium:  false,
          is_verified: false,
          rating:      5.0,
          total_sales: 0,
          followers:   0,
          location:    'Lima, Perú',
        });
      }

      return {};

    } catch (e) {
      if (__DEV__) { console.log('[AUTH] Register error:', e); }
      return { error: 'Error de conexión. Verifica tu internet.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      if (__DEV__) { console.log('[AUTH] Logout error:', e); }
    } finally {
      setUser(null);
      setIsPlus(false);
    }
  };

  const activatePlus = () => {
    setIsPlus(true);
    if (user) {
      supabase.from('users').update({ is_plus: true }).eq('id', user.id);
    }
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isPlus,
      isSeller:  user?.is_seller || false,
      loading,
      login,
      register,
      logout,
      activatePlus,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext)!;

// ══════════════════════════════════════════════════════════════════
//  FAVS CONTEXT — también soporta string IDs
// ══════════════════════════════════════════════════════════════════
interface FavContextType {
  favs:     Record<string, boolean>;
  toggle:   (id: string | number) => void;
  isFav:    (id: string | number) => boolean;
  favCount: number;
}

const FavContext = createContext<FavContextType | null>(null);

export function FavProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const toggle = (id: string | number) =>
    setFavs(prev => {
      const key  = String(id);
      const next = { ...prev };
      if (next[key]) { delete next[key]; }
      else { next[key] = true; }
      return next;
    });
  return (
    <FavContext.Provider value={{
      favs,
      toggle,
      isFav:    id => !!favs[String(id)],
      favCount: Object.keys(favs).length,
    }}>
      {children}
    </FavContext.Provider>
  );
}
export const useFavs = () => useContext(FavContext)!;

// ══════════════════════════════════════════════════════════════════
//  NOTIF CONTEXT
// ══════════════════════════════════════════════════════════════════
interface NotifContextType {
  notifications: any[];
  unreadCount:   number;
  markRead:      (id: number) => void;
  markAllRead:   () => void;
  deleteNotif:   (id: number) => void;
}

const NotifContext = createContext<NotifContextType | null>(null);

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState(NOTIF_DATA);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead    = (id: number) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotif = (id: number) =>
    setNotifications(prev => prev.filter(n => n.id !== id));
  return (
    <NotifContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteNotif }}>
      {children}
    </NotifContext.Provider>
  );
}
export const useNotifs = () => useContext(NotifContext)!;