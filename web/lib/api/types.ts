// Types TypeScript alignés avec les serializers Django

export type UUID = string;

export type Role =
  | "super_admin" | "admin" | "support"
  | "printer" | "printer_agent" | "quality_controller"
  | "customer" | "customer_corporate"
  | "accountant" | "courier";

export interface User {
  id: UUID;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  primary_role: Role;
  avatar?: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  kyc_level: 0 | 1 | 2 | 3 | 4;
  country: string;
  locale: string;
  timezone?: string;
  preferred_currency: string;
  is_active?: boolean;
  is_suspended?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  last_login_user_agent?: string | null;
  suspension_reason?: string;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: {
    id: UUID;
    email: string;
    full_name: string;
    primary_role: Role;
    kyc_level: number;
    two_factor_enabled: boolean;
  };
}

export type OrderStatus =
  | "draft" | "quote_pending" | "quoted" | "bat_uploaded" | "bat_validated"
  | "payment_pending" | "paid" | "assigned" | "accepted" | "in_production"
  | "quality_check" | "ready_for_pickup" | "in_delivery" | "delivered"
  | "completed" | "cancelled" | "disputed" | "refunded";

export interface Order {
  id: UUID;
  reference: string;
  customer: UUID;
  customer_email?: string;
  printer?: UUID;
  printer_detail?: PrinterPublic;
  product: UUID;
  product_detail?: { name: string; slug: string; primary_image?: string };
  quantity: number;
  total_excl_tax: string;
  total_incl_tax: string;
  currency: string;
  status: OrderStatus;
  delivery_address: Record<string, string>;
  expected_delivery_at?: string;
  delivered_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PrinterPublic {
  id: UUID;
  trade_name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  country: string;
  city: string;
  quality_score: string;
  on_time_rate: string;
  is_featured: boolean;
}

export interface PrinterProfile extends PrinterPublic {
  legal_name: string;
  rccm_number?: string;
  tax_id?: string;
  address?: string;
  delivery_radius_km: string;
  daily_capacity_units: number;
  current_load_pct: string;
  response_time_minutes: number;
  status: string;
  kyc_status: string;
  business_hours?: Record<string, unknown>;
}

export interface Category {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  cover?: string;
  parent?: UUID;
  position: number;
}

export interface ProductOptionValue {
  id: UUID;
  code: string;
  label: string;
  extra_cost_pct: string;
  extra_cost_amount: string;
  metadata: Record<string, unknown>;
  position: number;
}

export interface ProductOption {
  id: UUID;
  kind: string;
  name: string;
  required: boolean;
  position: number;
  values: ProductOptionValue[];
}

export interface Product {
  id: UUID;
  slug: string;
  name: string;
  short_description: string;
  description?: string;
  category: Category | UUID;
  category_name?: string;
  specifications?: Record<string, unknown>;
  min_quantity: number;
  max_quantity?: number;
  lead_time_days: number;
  is_featured: boolean;
  tags?: string[];
  cover_image?: string;
  primary_image?: string;
  options?: ProductOption[];
  images?: { id: UUID; image: string; alt: string }[];
}

export interface QuoteRequest {
  id: UUID;
  reference: string;
  product: UUID;
  product_detail?: Product;
  quantity: number;
  option_values: UUID[];
  budget_min?: string;
  budget_max?: string;
  currency: string;
  desired_delivery_at?: string;
  delivery_country: string;
  delivery_city: string;
  delivery_address: string;
  customer_notes: string;
  status: "draft" | "open" | "matched" | "selected" | "converted" | "expired" | "cancelled";
  matched_at?: string;
  offers?: QuoteOffer[];
  created_at: string;
}

export interface QuoteOffer {
  id: UUID;
  printer: PrinterPublic;
  total_excl_tax: string;
  total_incl_tax: string;
  unit_price: string;
  currency: string;
  delivery_fee: string;
  expected_delivery_at?: string;
  estimated_lead_time_days: number;
  tag: "recommended" | "best_price" | "fastest" | "premium" | "nearest" | "standard";
  score: string;
  is_ai_recommended: boolean;
  quality_score_snapshot: string;
  breakdown: { label: string; amount: string }[];
  created_at: string;
}

export interface ProductionJob {
  id: UUID;
  reference: string;
  order: UUID;
  order_reference?: string;
  printer: UUID;
  status: "queued" | "in_progress" | "on_hold" | "blocked" | "done" | "cancelled";
  priority: number;
  estimated_duration?: string;
  actual_duration?: string;
  queued_at?: string;
  started_at?: string;
  completed_at?: string;
  qr_code?: string;
  notes?: string;
  steps?: ProductionStep[];
  incidents?: ProductionIncident[];
  photos?: { id: UUID; image: string; caption: string }[];
}

export interface ProductionStep {
  id: UUID;
  kind: string;
  name: string;
  position: number;
  operator?: UUID;
  operator_email?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  comment?: string;
}

export interface ProductionIncident {
  id: UUID;
  cause: string;
  severity: string;
  description: string;
  resolved_at?: string;
  created_at: string;
}

export interface Notification {
  id: UUID;
  channel: "in_app" | "email" | "sms" | "push" | "whatsapp";
  subject: string;
  body: string;
  payload?: Record<string, unknown>;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface DashboardCustomer {
  total_orders: number;
  in_progress: number;
  delivered: number;
  lifetime_spend: number | string;
  last_5: Array<{ id: UUID; reference: string; status: OrderStatus; total_incl_tax: string; currency: string; created_at: string }>;
}

export interface DashboardPrinter {
  ca_30d: number | string;
  orders_30d: number;
  in_production: number;
  to_accept: number;
  wallet_balance: string;
  quality_score: string;
  on_time_rate: string;
  current_load_pct: string;
}

export interface DashboardAdmin {
  gmv_30d: number | string;
  orders_30d: number;
  orders_paid_30d: number;
  active_printers: number;
  pending_kyc: number;
  avg_basket_30d: number | string;
  status_breakdown: Array<{ status: OrderStatus; count: number }>;
}

export interface ApiError {
  type?: string;
  title: string;
  status: number;
  code: string;
  detail: unknown;
  request_id?: string;
}
