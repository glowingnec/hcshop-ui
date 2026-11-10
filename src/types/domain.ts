export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isLocked: boolean;
  lockReason?: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
  failedLoginAttempts: number;
  lockoutUntil?: string;
  avatar?: string;
  dob?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  createdAt: string;
}

export interface ShippingAddress {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  isDefault: boolean;
  isOutOfDeliveryZone?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  iconName: string;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  description: string;
  specs?: Record<string, string>;
  imageUrl: string;
  stock: number;
  minStockThreshold: number;
  isVisible: boolean;
  isDeleted: boolean;
  lastSoldAt?: string;
  createdAt: string;
}

export type StockMovementType =
  | 'IMPORT'
  | 'ADJUST_DECREASE'
  | 'SALE'
  | 'CANCEL_RESTORE';

export interface StockHistory {
  id: string;
  productId: string;
  type: StockMovementType;
  quantityChange: number; // + for import/restore, - for sale/adjust
  stockBefore: number;
  stockAfter: number;
  reasonOrNote: string;
  supplier?: string;
  importPrice?: number;
  actorName: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedPrice: number;
}

export type DiscountType = 'PERCENT' | 'FIXED';

export interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDING'     // Chờ xác nhận
  | 'CONFIRMED'   // Đã xác nhận
  | 'PREPARING'   // Đang chuẩn bị
  | 'SHIPPING'    // Đang giao
  | 'COMPLETED'   // Hoàn thành
  | 'CANCELLED';  // Đã hủy

export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'EWALLET';

export interface OrderTimelineEntry {
  status: OrderStatus;
  timestamp: string;
  note: string;
  actorName?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  id: string;
  code: string;
  userId: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
  discountAmount: number;
  subtotal: number;
  totalAmount: number;
  timeline: OrderTimelineEntry[];
  cancelReason?: string;
  isPaid: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1..5
  comment: string;
  images?: string[];
  isEdited: boolean;
  likedByUserIds: string[];
  storeReply?: string;
  storeReplyAt?: string;
  storeReplyBy?: string;
  createdAt: string;
}
