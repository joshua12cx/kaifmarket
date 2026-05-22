// src/data/index.ts

export interface Category {
  id: string;
  label: string;
  emoji: string;
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  premium: boolean;
  location: string;
}

export interface Product {
  id: number;
  name: string;
  shortName: string;
  price: number;
  oldPrice: number | null;
  emoji: string;
  bgColor: string;
  category: string;
  sellerId: string;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  tag: string | null;
  tagLabel: string | null;
  isPremiumSeller: boolean;
  description: string;
  specs: string[];
  images: string[];
  seller?: Seller;
}

export interface Notification {
  id: number;
  type: string;
  read: boolean;
  time: string;
  title: string;
  body: string;
  imageEmoji: string;
  imageBg: string;
}

export interface OrderItem {
  productId: number;
  qty: number;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  statusColor: string;
  statusBg: string;
  items: OrderItem[];
  total: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  memberSince: string;
  isPlus: boolean;
  avatar: string;
}

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id: 'todos',   label: 'Todos',       emoji: '🏠' },
  { id: 'electro', label: 'Electrónica', emoji: '📱' },
  { id: 'hogar',   label: 'Hogar',       emoji: '🛋️' },
  { id: 'belleza', label: 'Belleza',     emoji: '💄' },
  { id: 'moda',    label: 'Moda',        emoji: '👟' },
  { id: 'deporte', label: 'Deporte',     emoji: '⚽' },
];

// ─── VENDEDORES ───────────────────────────────────────────────────────────────
export const SELLERS: Seller[] = [
  { id: 's1', name: 'TechStore Lima',  rating: 4.9, verified: true,  premium: true,  location: 'Miraflores' },
  { id: 's2', name: 'HogarPro',        rating: 4.7, verified: true,  premium: true,  location: 'San Isidro' },
  { id: 's3', name: 'BellezaTotal',    rating: 4.6, verified: true,  premium: false, location: 'La Molina'  },
  { id: 's4', name: 'ModaUrban',       rating: 4.8, verified: true,  premium: true,  location: 'Miraflores' },
  { id: 's5', name: 'DeporteMax',      rating: 4.5, verified: false, premium: false, location: 'San Isidro' },
];

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: 1, name: 'Auriculares Bluetooth Pro X7', shortName: 'Auriculares BT Pro',
    price: 89, oldPrice: 120, emoji: '🎧', bgColor: '#EEEDFE',
    category: 'electro', sellerId: 's1', rating: 4.8, reviews: 234, sold: 1204, stock: 15,
    tag: 'hot', tagLabel: 'Más vendido', isPremiumSeller: true,
    description: 'Auriculares inalámbricos con cancelación activa de ruido, 30h de batería y sonido HD. Compatibles con iOS y Android.',
    specs: ['Batería: 30h', 'Bluetooth: 5.2', 'Cancelación ruido: Sí', 'Garantía: 1 año'],
    images: ['🎧', '🎶', '🔋'],
  },
  {
    id: 2, name: 'Licuadora Inox 1.5L 600W', shortName: 'Licuadora Inox',
    price: 65, oldPrice: 85, emoji: '🥤', bgColor: '#E6F1FB',
    category: 'hogar', sellerId: 's2', rating: 4.6, reviews: 189, sold: 876, stock: 30,
    tag: 'sale', tagLabel: '-24%', isPremiumSeller: true,
    description: 'Licuadora de acero inoxidable con 6 velocidades y función pulso. Jarra 1.5L libre de BPA.',
    specs: ['Potencia: 600W', 'Capacidad: 1.5L', 'Velocidades: 6+pulso', 'Material: Acero inox'],
    images: ['🥤', '🍓', '⚡'],
  },
  {
    id: 3, name: 'Zapatillas Running AirFlex X3', shortName: 'Zapatillas Running',
    price: 120, oldPrice: null, emoji: '👟', bgColor: '#EAF3DE',
    category: 'moda', sellerId: 's4', rating: 4.9, reviews: 412, sold: 2103, stock: 8,
    tag: 'new', tagLabel: 'Nuevo', isPremiumSeller: true,
    description: 'Zapatillas de running con tecnología AirFlex. Suela antideslizante y tejido transpirable.',
    specs: ['Suela: AirFlex EVA', 'Tallas: 38-44', 'Tejido: Mesh', 'Peso: 280g'],
    images: ['👟', '🏃', '✨'],
  },
  {
    id: 4, name: 'Set Maquillaje Profesional 12 pzas', shortName: 'Set Maquillaje Pro',
    price: 45, oldPrice: 60, emoji: '💄', bgColor: '#FCEBEB',
    category: 'belleza', sellerId: 's3', rating: 4.7, reviews: 301, sold: 1543, stock: 25,
    tag: 'sale', tagLabel: '-25%', isPremiumSeller: false,
    description: 'Set completo con 12 piezas. Fórmula hipoalergénica, larga duración 12h. Sin parabenos.',
    specs: ['Piezas: 12', 'Tipo: Hipoalergénico', 'Duración: 12h', 'Sin parabenos: Sí'],
    images: ['💄', '✨', '🎨'],
  },
  {
    id: 5, name: 'Tablet 10" HD 64GB 4G', shortName: 'Tablet 10" HD',
    price: 299, oldPrice: 380, emoji: '📱', bgColor: '#EEEDFE',
    category: 'electro', sellerId: 's1', rating: 4.5, reviews: 98, sold: 456, stock: 5,
    tag: 'hot', tagLabel: 'Top', isPremiumSeller: true,
    description: 'Tablet Full HD 10", procesador octa-core, 4GB RAM, 64GB expandible. Batería 6000mAh.',
    specs: ['Pantalla: 10" Full HD', 'RAM: 4GB', 'Almacenamiento: 64GB', 'Batería: 6000mAh'],
    images: ['📱', '💻', '🔋'],
  },
  {
    id: 6, name: 'Set Cojines Decorativos x2', shortName: 'Cojines Decorativos',
    price: 38, oldPrice: null, emoji: '🛋️', bgColor: '#FAEEDA',
    category: 'hogar', sellerId: 's2', rating: 4.4, reviews: 156, sold: 734, stock: 40,
    tag: null, tagLabel: null, isPremiumSeller: true,
    description: 'Par de cojines con relleno de fibra siliconada. Funda removible y lavable. 45x45cm.',
    specs: ['Tamaño: 45x45cm', 'Relleno: Fibra siliconada', 'Funda: Removible', 'Colores: 5'],
    images: ['🛋️', '🏠', '✨'],
  },
  {
    id: 7, name: 'Pelota Fútbol Pro Match', shortName: 'Pelota Fútbol Pro',
    price: 55, oldPrice: 70, emoji: '⚽', bgColor: '#EAF3DE',
    category: 'deporte', sellerId: 's5', rating: 4.6, reviews: 78, sold: 389, stock: 20,
    tag: 'sale', tagLabel: '-21%', isPremiumSeller: false,
    description: 'Pelota reglamentaria talla 5. Cuero sintético PU de alta resistencia.',
    specs: ['Talla: 5', 'Material: PU sintético', 'Costuras: Reforzadas', 'Superficie: Grass/sint.'],
    images: ['⚽', '🏆', '🌟'],
  },
  {
    id: 8, name: 'Smartwatch FitPlus GT2', shortName: 'Smartwatch FitPlus',
    price: 149, oldPrice: 199, emoji: '⌚', bgColor: '#E6F1FB',
    category: 'electro', sellerId: 's1', rating: 4.7, reviews: 167, sold: 892, stock: 12,
    tag: 'new', tagLabel: 'Nuevo', isPremiumSeller: true,
    description: 'Monitor de salud 24/7: ritmo cardíaco, SpO2, sueño. GPS integrado, 5ATM. Batería 7 días.',
    specs: ['Batería: 7 días', 'GPS: Integrado', 'Resistencia: 5ATM', 'Modos: 50+'],
    images: ['⌚', '❤️', '📍'],
  },
  {
    id: 9, name: 'Cafetera Espresso 15 Bar', shortName: 'Cafetera Espresso',
    price: 185, oldPrice: 220, emoji: '☕', bgColor: '#FAEEDA',
    category: 'hogar', sellerId: 's2', rating: 4.8, reviews: 203, sold: 541, stock: 7,
    tag: 'hot', tagLabel: 'Top', isPremiumSeller: true,
    description: 'Cafetera semi-automática 15 bares. Vaporizador de leche. Tanque 1.5L. Garantía 2 años.',
    specs: ['Presión: 15 bar', 'Tanque: 1.5L', 'Calentamiento: 25 seg', 'Garantía: 2 años'],
    images: ['☕', '🤍', '⚡'],
  },
  {
    id: 10, name: 'Crema Vitamina C 50ml', shortName: 'Crema Vitamina C',
    price: 29, oldPrice: 39, emoji: '🧴', bgColor: '#FAEEDA',
    category: 'belleza', sellerId: 's3', rating: 4.5, reviews: 445, sold: 2341, stock: 60,
    tag: 'sale', tagLabel: '-26%', isPremiumSeller: false,
    description: 'Crema hidratante vitamina C al 15%. Ilumina y reduce manchas. Para todo tipo de piel.',
    specs: ['Vitamina C: 15%', 'Volumen: 50ml', 'Tipo piel: Todas', 'Sin perfume: Sí'],
    images: ['🧴', '✨', '🌿'],
  },
  {
    id: 11, name: 'Mochila Urbana 25L Impermeable', shortName: 'Mochila Urbana 25L',
    price: 75, oldPrice: null, emoji: '🎒', bgColor: '#EEEDFE',
    category: 'moda', sellerId: 's4', rating: 4.6, reviews: 132, sold: 678, stock: 18,
    tag: 'new', tagLabel: 'Nuevo', isPremiumSeller: true,
    description: 'Mochila 25L con compartimento laptop 15.6", puerto USB externo, impermeable 100%.',
    specs: ['Capacidad: 25L', 'Laptop: hasta 15.6"', 'Puerto USB: Sí', 'Impermeable: 100%'],
    images: ['🎒', '💻', '🌧️'],
  },
  {
    id: 12, name: 'Pesas Ajustables 2-10kg x2', shortName: 'Pesas Ajustables',
    price: 95, oldPrice: 115, emoji: '🏋️', bgColor: '#E6F1FB',
    category: 'deporte', sellerId: 's5', rating: 4.7, reviews: 88, sold: 312, stock: 10,
    tag: 'sale', tagLabel: '-17%', isPremiumSeller: false,
    description: 'Par de pesas ajustables 2 a 10kg. Ajuste rápido en 5 niveles. Mango antideslizante.',
    specs: ['Peso: 2-10kg', 'Ajuste: 5 niveles', 'Mango: Antideslizante', 'Incluye: 2 unidades'],
    images: ['🏋️', '💪', '🔧'],
  },
];

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────
export const NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'delivery',     read: false, time: 'hace 5 min',   title: '¡Tu pedido ha llegado!',       body: 'Auriculares BT Pro entregado en Miraflores', imageEmoji: '🎧', imageBg: '#EEEDFE' },
  { id: 2, type: 'promo',        read: false, time: 'hace 1h',      title: '20% OFF en Electrónica hoy',   body: 'Más de 50 productos con descuento',          imageEmoji: '📱', imageBg: '#E6F1FB' },
  { id: 3, type: 'cashback',     read: true,  time: 'ayer',         title: 'Cashback acreditado: S/ 3.20', body: 'Por tu compra de Smartwatch FitPlus',        imageEmoji: '💰', imageBg: '#EAF3DE' },
  { id: 4, type: 'order_update', read: true,  time: 'ayer',         title: 'Pedido ORD-002 en camino',     body: 'Tu paquete salió del almacén en San Isidro', imageEmoji: '⌚', imageBg: '#E6F1FB' },
  { id: 5, type: 'plus',         read: false, time: 'hace 2 días',  title: 'Tu Kaif Plus vence en 3 días', body: 'Renueva y sigue disfrutando tus beneficios', imageEmoji: '✦', imageBg: '#EEEDFE' },
  { id: 6, type: 'promo',        read: true,  time: 'hace 3 días',  title: 'Nuevos productos Premium',     body: 'TechStore Lima añadió 12 nuevos artículos',  imageEmoji: '🛋️', imageBg: '#FAEEDA' },
  { id: 7, type: 'review',       read: false, time: 'hace 4 días',  title: 'Deja tu reseña',               body: 'Cuéntanos qué te pareció la Licuadora Inox', imageEmoji: '⭐', imageBg: '#FAEEDA' },
  { id: 8, type: 'cashback',     read: true,  time: 'hace 5 días',  title: 'Bienvenido a Kaif Plus',       body: 'Ya puedes disfrutar tus beneficios',         imageEmoji: '🎉', imageBg: '#EEEDFE' },
];

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────
export const ORDERS: Order[] = [
  { id: 'ORD-001', date: '24 Abr 2025', status: 'Entregado', statusColor: '#3B6D11', statusBg: '#EAF3DE', items: [{ productId: 1, qty: 1 }, { productId: 4, qty: 2 }], total: 179 },
  { id: 'ORD-002', date: '20 Abr 2025', status: 'En camino', statusColor: '#185FA5', statusBg: '#E6F1FB', items: [{ productId: 8, qty: 1 }], total: 149 },
  { id: 'ORD-003', date: '15 Abr 2025', status: 'Procesando', statusColor: '#BA7517', statusBg: '#FAEEDA', items: [{ productId: 2, qty: 1 }, { productId: 6, qty: 1 }], total: 103 },
];

// ─── USUARIO ──────────────────────────────────────────────────────────────────
export const CURRENT_USER: User = {
  id: 'u001', name: 'Usuario Kaif', email: 'usuario@kaifmarket.pe',
  location: 'Miraflores, Lima', memberSince: 'Abr 2025', isPlus: false, avatar: 'KM',
};
