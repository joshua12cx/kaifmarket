// src/context/index.tsx
import React, { createContext, useContext, useReducer, useMemo, useState } from 'react';
import { NOTIFICATIONS as NOTIF_DATA, CURRENT_USER, User, Notification } from '../data';

// ── CART ──────────────────────────────────────────────────────────────────────
interface CartState { items: Record<number, number>; }
type CartAction =
  | { type: 'ADD'; id: number }
  | { type: 'REMOVE'; id: number }
  | { type: 'INCREMENT'; id: number }
  | { type: 'DECREMENT'; id: number }
  | { type: 'CLEAR' };

interface CartContextType {
  items: Record<number, number>;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD':
      return { items: { ...state.items, [action.id]: (state.items[action.id] || 0) + 1 } };
    case 'REMOVE': {
      const next = { ...state.items };
      delete next[action.id];
      return { items: next };
    }
    case 'INCREMENT':
      return { items: { ...state.items, [action.id]: state.items[action.id] + 1 } };
    case 'DECREMENT': {
      const qty = state.items[action.id] - 1;
      if (qty <= 0) {
        const next = { ...state.items };
        delete next[action.id];
        return { items: next };
      }
      return { items: { ...state.items, [action.id]: qty } };
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

// ── AUTH ──────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User;
  isPlus: boolean;
  activatePlus: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User>(CURRENT_USER);
  const [isPlus, setIsPlus] = useState(false);
  return (
    <AuthContext.Provider value={{ user, isPlus, activatePlus: () => setIsPlus(true) }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext)!;

// ── FAVS ──────────────────────────────────────────────────────────────────────
interface FavContextType {
  favs: Record<number, boolean>;
  toggle: (id: number) => void;
  isFav: (id: number) => boolean;
  favCount: number;
}

const FavContext = createContext<FavContextType | null>(null);

export function FavProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<Record<number, boolean>>({});

  const toggle = (id: number) =>
    setFavs(prev => {
      const next = { ...prev };

      if (next[id]) delete next[id];
      else next[id] = true;

      return next;
    });

  return (
    <FavContext.Provider
      value={{
        favs,
        toggle,
        isFav: id => !!favs[id],
        favCount: Object.keys(favs).length,
      }}
    >
      {children}
    </FavContext.Provider>
  );
}

export const useFavs = () => useContext(FavContext)!;

// ── NOTIFS ────────────────────────────────────────────────────────────────────
interface NotifContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: number) => void;
  markAllRead: () => void;
  deleteNotif: (id: number) => void;
}

const NotifContext = createContext<NotifContextType | null>(null);

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(NOTIF_DATA);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead    = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotif = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));
  return (
    <NotifContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteNotif }}>
      {children}
    </NotifContext.Provider>
  );
}
export const useNotifs = () => useContext(NotifContext)!;
