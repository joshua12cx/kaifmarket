// src/services/index.ts
// ══════════════════════════════════════════════════════════════════
//  KAIF MARKET — SERVICIOS
//  Fase 1: data estática activa. fetch() COMENTADO.
//  Fase 2: descomentar TODO BACKEND, borrar línea estática.
// ══════════════════════════════════════════════════════════════════

import { PRODUCTS, SELLERS, ORDERS, NOTIFICATIONS, CURRENT_USER } from '../data';

// const API_URL = 'https://api.kaifmarket.pe/v1';
// const getHeaders = (token?: string) => ({
//   'Content-Type': 'application/json',
//   ...(token && { Authorization: `Bearer ${token}` }),
// });

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
// ── PRODUCTS ─────────────────────────────────────────────────────
export async function getProducts(filters: {
  category?: string;
  query?: string;
  onlyPremium?: boolean;
  onlySale?: boolean;
} = {}) {
  // TODO BACKEND:
  // const params = new URLSearchParams(filters as any).toString();
  // const res = await fetch(`${API_URL}/products?${params}`);
  // if (!res.ok) throw new Error('Error al obtener productos');
  // return await res.json();

  await delay(300);
  let result = [...PRODUCTS];
  if (filters.category && filters.category !== 'todos') {
    result = result.filter(p => p.category === filters.category);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q));
  }
  if (filters.onlyPremium) { result = result.filter(p => p.isPremiumSeller); }
  if (filters.onlySale)    { result = result.filter(p => p.oldPrice !== null); }
  return result;
}

export async function getProductById(id: number) {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/products/${id}`);
  // return await res.json();

  await delay(200);
  const product = PRODUCTS.find(p => p.id === id);
  const seller  = SELLERS.find(s => s.id === product?.sellerId);
  return { ...product!, seller };
}

export async function createProduct(data: unknown) {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/products`, {
  //   method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
  // });
  // return await res.json();

  if (__DEV__) { console.log('[MOCK] createProduct:', data); }
  return { success: true, id: Date.now() };
}

export async function updateProduct(id: number, data: unknown) {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/products/${id}`, {
  //   method: 'PUT', headers: getHeaders(token), body: JSON.stringify(data),
  // });
  // return await res.json();

  if (__DEV__) { console.log('[MOCK] updateProduct:', id, data); }
  return { success: true };
}

export async function deleteProduct(id: number) {
  // TODO BACKEND:
  // await fetch(`${API_URL}/products/${id}`, {
  //   method: 'DELETE', headers: getHeaders(token),
  // });

  if (__DEV__) { console.log('[MOCK] deleteProduct:', id); }
  return { success: true };
}

// ── ORDERS ───────────────────────────────────────────────────────
export async function getOrders() {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/orders`, { headers: getHeaders(token) });
  // return await res.json();

  await delay(300);
  return ORDERS;
}

export async function createOrder(cartItems: unknown) {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/orders`, {
  //   method: 'POST', headers: getHeaders(token),
  //   body: JSON.stringify({ items: cartItems }),
  // });
  // return await res.json();

  await delay(500);
  if (__DEV__) { console.log('[MOCK] createOrder:', cartItems); }
  return { success: true, orderId: `ORD-${Date.now()}` };
}

export async function cancelOrder(orderId: string) {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
  //   method: 'PUT', headers: getHeaders(token),
  // });
  // return await res.json();

  if (__DEV__) { console.log('[MOCK] cancelOrder:', orderId); }
  return { success: true };
}

// ── USERS ────────────────────────────────────────────────────────
export async function getProfile() {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders(token) });
  // return await res.json();

  await delay(200);
  return CURRENT_USER;
}

export async function login(email: string, password: string) {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // return await res.json();

  await delay(600);
  console.log('login mock:', email, password);
  return { success: true, user: CURRENT_USER, token: 'mock-token-123' };
}

export async function register(data: unknown) {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/auth/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // return await res.json();

  await delay(800);
  return { success: true, user: { ...CURRENT_USER, ...(data as object) } };
}

export async function subscribePlus() {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/subscriptions/plus`, {
  //   method: 'POST', headers: getHeaders(token),
  //   body: JSON.stringify({ plan: 'monthly', price: 19.90 }),
  // });
  // return await res.json();

  await delay(500);
  return { success: true, isPlus: true };
}

// ── NOTIFICATIONS ────────────────────────────────────────────────
export async function getNotifications() {
  // TODO BACKEND:
  // const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders(token) });
  // return await res.json();

  await delay(250);
  return NOTIFICATIONS;
}

export async function markAsRead(notifId: number) {
  // TODO BACKEND:
  // await fetch(`${API_URL}/notifications/${notifId}/read`, {
  //   method: 'PUT', headers: getHeaders(token),
  // });

  if (__DEV__) { console.log('[MOCK] markAsRead:', notifId); }
  return { success: true };
}

export async function markAllAsRead() {
  // TODO BACKEND:
  // await fetch(`${API_URL}/notifications/read-all`, {
  //   method: 'PUT', headers: getHeaders(token),
  // });

  return { success: true };
}

export async function deleteNotification(id: number) {
  // TODO BACKEND:
  // await fetch(`${API_URL}/notifications/${id}`, {
  //   method: 'DELETE', headers: getHeaders(token),
  // });

  if (__DEV__) { console.log('[MOCK] deleteNotification:', id); }
  return { success: true };
}

export async function registerPushToken(token: string) {
  // TODO BACKEND:
  // await fetch(`${API_URL}/push/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ token, platform: 'android' }),
  // });

  if (__DEV__) { console.log('[MOCK] registerPushToken:', token); }
  return { success: true };
}
