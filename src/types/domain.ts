export type UserRole = 'KhachHang' | 'NhanVien' | 'QuanLy';

export type AccountStatus = 'HoatDong' | 'BiKhoa';

export type Gender = 'Nam' | 'Nu' | 'Khac';

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
  failedRecoveryAttempts?: number;
  recoveryLockoutUntil?: string;
  avatar?: string;
  dob?: string;
  gender?: Gender;
  createdAt: string;
}

export interface AccountLockHistory {
  id: string;
  userId: string;
  newStatus: AccountStatus;
  reason: string;
  actorName: string;
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
  description: string;
  imageUrl: string;
  stock: number;
  minStockThreshold: number;
  isVisible: boolean;
  isDeleted: boolean;
  lastSoldAt?: string;
  createdAt: string;
}

export type StockMovementType =
  | 'NhapTang'
  | 'DieuChinhGiam'
  | 'XuatBan'
  | 'HoanDon';

export interface StockHistory {
  id: string;
  productId: string;
  orderId?: string;
  orderCode?: string;
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

export type DiscountType = 'PhanTram' | 'SoTien';

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
  isDeleted?: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'ChoXacNhan'   // Chờ xác nhận
  | 'DaXacNhan'    // Đã xác nhận
  | 'DangChuanBi'  // Đang chuẩn bị
  | 'DangGiao'     // Đang giao
  | 'HoanThanh'    // Hoàn thành
  | 'DaHuy';       // Đã hủy

export type PaymentMethod = 'KhiNhanHang' | 'ChuyenKhoan' | 'ViDienTu';

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
  voucherId?: string;
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
