// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Credenciales de Supabase ──────────────────────────────────────
// TODO: Mover a variables de entorno antes de publicar en producción
const SUPABASE_URL  = 'https://idqrqevylfqbqepxilej.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcXJxZXZ5bGZxYnFlcHhpbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDgxMzgsImV4cCI6MjA5NTAyNDEzOH0.CC7Tm0J3aDPHzhpp1m0_4sqZZEqwYjL3TUcQ1Qk6mpA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});

// ══════════════════════════════════════════════════════════════════
//  TIPOS — actualizados con TODAS las migraciones de esta sesión:
//  wizard de 4 pasos (vendedor/transportista), 5 estados reales,
//  payment_methods, complaints, fotos de tienda/vehículo.
// ══════════════════════════════════════════════════════════════════

export type AuthUser = {
  id:          string;
  email:       string;
  name?:       string;
  avatar?:     string;
  avatar_url?: string;
  gender?:     'male' | 'female' | 'other';
  is_plus:     boolean;
  is_seller:   boolean;
  location?:   string;
  phone?:      string;
};

// ── Roles ────────────────────────────────────────────────────────
// user_roles.status se quedó simple (solo controla "¿tiene acceso?").
// sellers.status / motorizados.status tienen 5 estados granulares
// para el proceso de revisión — son cosas DISTINTAS, no mezclar.
export type RoleName        = 'buyer' | 'seller' | 'motorizado' | 'admin';
export type UserRoleStatus  = 'pending' | 'approved' | 'rejected';
export type ApplicationStatus = 'pending' | 'en_revision' | 'info_adicional' | 'approved' | 'rejected';

export type Role = {
  id:                 RoleName;
  label:              string;
  description?:       string;
  icon?:              string;
  color?:             string;
  requires_approval:  boolean;
};

export type UserRole = {
  user_id:    string;
  role:       RoleName;
  status:     UserRoleStatus;
  created_at: string;
};

export type PreferredPaymentMethod = 'bank_transfer' | 'yape' | 'plin';

// ── Vendedor ─────────────────────────────────────────────────────
export type Seller = {
  id:                 string;
  user_id:            string;
  name:               string;
  description?:       string | null;
  location?:          string | null;
  phone?:             string | null;
  category?:          string | null;
  logo_url?:          string | null;
  status:             ApplicationStatus;
  rejection_reason?:  string | null;
  reviewed_at?:       string | null;
  reviewed_by?:       string | null;
  is_verified:        boolean;
  is_premium:         boolean;
  on_vacation:         boolean;
  rating:             number;
  total_sales:        number;
  followers:          number;
  created_at:         string;

  // Compat con el formulario viejo (siguen existiendo, ya no se
  // llenan desde el wizard nuevo salvo como espejo de otros campos)
  dni_ruc?:           string | null;
  document_url?:      string | null;

  // Paso 1 — Información Personal
  dni?:               string | null;
  personal_address?:  string | null;
  profile_photo_url?: string | null;

  // Paso 2 — Datos del Negocio
  ruc?:               string | null;
  business_hours?:    string | null;

  // Paso 3 — Datos de Pago
  bank_account?:               string | null;
  cci?:                        string | null;
  yape_number?:                string | null;
  plin_number?:                string | null;
  preferred_payment_method?:   PreferredPaymentMethod | null;

  // Paso 4 — Documentos
  dni_front_url?:        string | null;
  dni_back_url?:         string | null;
  ruc_document_url?:     string | null;
  business_license_url?: string | null;
  terms_accepted_at?:    string | null;
};

export type SellerStorePhoto = {
  id:         string;
  seller_id:  string;
  photo_url:  string;
  created_at: string;
};

// ── Transportista ────────────────────────────────────────────────
export type VehicleType = 'moto' | 'auto' | 'bicicleta' | 'a_pie';

export type Motorizado = {
  id:                string;
  user_id:           string;
  full_name:         string;
  phone:             string;
  dni:               string;
  status:            ApplicationStatus;
  rejection_reason?: string | null;
  reviewed_at?:      string | null;
  reviewed_by?:      string | null;
  rating:            number;
  total_deliveries:  number;
  is_online:         boolean;
  created_at:        string;

  // Compat con el modelo viejo
  license_url?:      string | null;
  document_url?:     string | null;

  // Paso 1 — Información Personal
  profile_photo_url?: string | null;

  // Paso 2 — Datos del Vehículo
  vehicle_type?:   VehicleType | null;
  vehicle_plate?:  string | null;
  vehicle_brand?:  string | null;
  vehicle_model?:  string | null;
  vehicle_color?:  string | null;

  // Paso 3 — Documentos
  license_front_url?:        string | null;
  license_back_url?:         string | null;
  soat_url?:                 string | null;
  property_card_url?:        string | null;
  selfie_url?:                string | null;
  background_check_consent:  boolean;

  // Paso 4 — Datos de Pago
  bank_account?:                string | null;
  cci?:                         string | null;
  yape_number?:                 string | null;
  plin_number?:                 string | null;
  preferred_withdrawal_method?: PreferredPaymentMethod | null;
  terms_accepted_at?:           string | null;
};

export type MotorizadoVehiclePhoto = {
  id:            string;
  motorizado_id: string;
  photo_url:     string;
  created_at:    string;
};

// ── Producto ─────────────────────────────────────────────────────
export type Product = {
  id:            string;
  seller_id:     string;
  category_id:   string;
  name:          string;
  short_name?:   string | null;
  description?:  string | null;
  price:         number;
  old_price?:    number | null;
  stock:         number;
  sold:          number;
  rating:        number;
  review_count:  number;
  is_active:     boolean;
  tag?:          string | null;
  tag_label?:    string | null;
  image_url?:    string | null;
  image_url_2?:  string | null;
  image_url_3?:  string | null;
  emoji?:        string | null;
  bg_color:      string;
  created_at:    string;
};

// ── Métodos de pago del comprador (nuevo, esta sesión) ────────────
export type PaymentMethodType = 'yape' | 'plin' | 'visa' | 'mastercard' | 'paypal' | 'google_pay' | 'apple_pay';

export type PaymentMethod = {
  id:         string;
  user_id:    string;
  type:       PaymentMethodType;
  label:      string;
  detail?:    string | null;
  is_default: boolean;
  created_at: string;
};

// ── Libro de Reclamaciones (nuevo, esta sesión) ───────────────────
export type ComplaintCategory =
  | 'no_recibido' | 'defectuoso' | 'cobro_incorrecto'
  | 'vendedor_irresponsable' | 'entrega_tardia' | 'otro';
export type ComplaintStatus = 'proceso' | 'resuelto' | 'rechazado';

export type Complaint = {
  id:              string;
  user_id:         string;
  category:        ComplaintCategory;
  description:     string;
  evidence_url?:   string | null;
  status:          ComplaintStatus;
  admin_response?: string | null;
  created_at:      string;
};

// ── Pedido ───────────────────────────────────────────────────────
export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type Order = {
  id:             string;
  buyer_id?:      string | null;
  status:         OrderStatus;
  total:          number;
  delivery_type:  string;
  delivery_cost:  number;
  address?:       string | null;
  payment_method: string;
  buyer_name?:    string | null;
  buyer_email?:   string | null;
  buyer_phone?:   string | null;
  notes?:         string | null;
  created_at:     string;
  updated_at:     string;
};

export type OrderItem = {
  id:         string;
  order_id:   string;
  product_id?: string | null;
  qty:        number;
  price:      number;
};