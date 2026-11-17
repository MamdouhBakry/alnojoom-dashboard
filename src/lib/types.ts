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

export type OrderStatus = "awaiting_payment" | "awaiting_transfer" | "transfer_review" | "paid" | "cancelled";
export type PaymentStatus = "initiated" | "paid" | "failed" | "awaiting_receipt" | "pending_review" | "rejected" | "cancelled";
export type PaymentMethod = "card" | "bank_transfer";
export type ErpStatus = "not_sent" | "pending" | "synced" | "failed";

export interface OrderContact {
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
}

export interface OrderListItem {
  id: number;
  number: string;
  status: OrderStatus;
  contact: OrderContact;
  total: number;
  payment: { method: PaymentMethod; status: PaymentStatus } | null;
  erpStatus: ErpStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface OrderList extends Paged<OrderListItem> {
  counts: Partial<Record<OrderStatus, number>>;
}

export interface OrderPayment {
  id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  providerRef: string | null;
  providerInfo: string | null;
  failureReason: string | null;
  hasReceipt: boolean;
  receiptMime: string | null;
  receiptUploadedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface OrderDetail {
  id: number;
  number: string;
  publicId: string;
  quoteNumber: string;
  status: OrderStatus;
  locale: "ar" | "en";
  contact: OrderContact;
  lines: { slug: string; name: Localized; quantity: number; unit: "kg" | "ton"; unitPrice: number; lineTotal: number; erpName: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  transferDueAt: string | null;
  erp: { status: ErpStatus; ref: string | null; attempts: number; lastError: string | null; syncedAt: string | null };
  payments: OrderPayment[];
}
