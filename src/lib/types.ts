/** Shapes returned by alnojoom-backend admin endpoints. Keep in sync with the API. */

export interface Localized {
  ar: string;
  en: string;
}

export type Permission =
  | "products.manage"
  | "offers.manage"
  | "orders.view"
  | "payments.confirm"
  | "erp.resend"
  | "reports.export"
  | "customers.view"
  | "staff.manage";

export interface CurrentStaff {
  id: number;
  email: string;
  name: string;
  role: { id: number; key: string; name: Localized };
  permissions: Permission[];
  mustChangePassword: boolean;
}

export interface Lookups {
  categories: { id: number; key: string; name: Localized }[];
  groups: { id: number; key: string; categoryId: number; name: Localized }[];
  origins: { id: number; key: string; flagCode: string | null; name: Localized }[];
}

export interface ProductImage {
  id: number;
  url: string;
  alt: Localized;
  sortOrder: number;
}

export interface AdminProduct {
  id: number;
  slug: string;
  name: Localized;
  description: Localized;
  categoryId: number;
  categoryKey: string;
  groupId: number | null;
  originId: number | null;
  erpName: string | null;
  erpId: string | null;
  erpNameConflict: boolean;
  baseUnit: "kg" | "ton";
  isActive: boolean;
  isNew: boolean;
  sortOrder: number;
  deletedAt: string | null;
  updatedAt: string;
  images: ProductImage[];
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ErpConflict {
  erpName: string;
  products: { id: number; slug: string; nameAr: string; erpName: string }[];
}

export interface Offer {
  slot: number;
  image: Localized;
  mobileImage: { ar: string | null; en: string | null } | null;
  alt: Localized;
  href: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface OfferSlot {
  slot: number;
  offer: Offer | null;
}

export interface StaffMember {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: number; key: string; nameAr: string; nameEn: string };
}

export interface Role {
  id: number;
  key: string;
  name: Localized;
  isSystem: boolean;
  permissions: Permission[];
  staffCount: number;
}
