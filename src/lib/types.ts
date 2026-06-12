export interface Role {
  id: number;
  name: string;
}

export interface Status {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role_id: number;
  role?: Role;
  status_id: number;
  status?: Status;
  phone_number?: string;
  pharmacy_id?: number | null;
  pharmacy?: Pharmacy | null;
  date_of_birth?: string | null;
  address?: string;
  description?: string;
  picture_url?: string;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  registration_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  phone_number: string;
  address?: string;
  start_day?: string;
  end_day?: string;
  start_time?: string;
  end_time?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  picture_url?: string;
  rating_avg?: number;
  rating_count?: number;
  status_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface PharmacyPharmacist {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  status_id: number;
  registration_completed?: boolean;
  created_at?: string;
}

export interface PharmacyDetail extends Pharmacy {
  pharmacists: PharmacyPharmacist[];
  stats: {
    pharmacist_count: number;
    transactions: number;
    revenue: number;
  };
}

export interface Transaction {
  id: number;
  transaction_code: string;
  pharmacy_id: number;
  pharmacy_name?: string;
  patient_name?: string;
  user_id: number;
  delivery_method_id?: number;
  payment_method: string;
  transaction_status: string;
  transaction_date: string;
  grand_total: number;
  delivery_fee?: number;
  status_id: number;
  details_count?: number;
  details?: TransactionDetail[];
  requires_prescription?: boolean;
  prescription?: {
    id: number;
    status: string;
    image_url: string;
    notes: string | null;
  } | null;
  review?: {
    id: number;
    rating: number;
    comment: string | null;
  } | null;
}

export interface TransactionDetail {
  id: number;
  medicine_id: number;
  medicine_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface DashboardStats {
  totals: {
    patients: number;
    pharmacists: number;
    pharmacies: number;
    transactions: number;
    completed_transactions: number;
    revenue: number;
    platform_revenue: number;
  };
  recent_transactions: {
    id: number;
    transaction_code: string;
    transaction_status: string;
    grand_total: number;
    transaction_date: string;
    pharmacy?: { id: number; name: string } | null;
    user?: { id: number; full_name: string } | null;
  }[];
}

export interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  created_at?: string;
  user?: { id: number; full_name: string } | null;
  pharmacy?: { id: number; name: string } | null;
}

export interface Prescription {
  id: number;
  transaction_id: number;
  image_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  notes?: string | null;
  reviewed_by_id?: number | null;
  reviewed_at?: string | null;
  created_at?: string;
  transaction?: {
    id: number;
    transaction_code: string;
    pharmacy_id: number;
    user?: { id: number; full_name: string } | null;
  } | null;
}

export const ROLE = { ADMIN: 1, PHARMACIST: 2, PATIENT: 3 } as const;
export const STATUS = { ACTIVE: 1, INACTIVE: 0 } as const;
