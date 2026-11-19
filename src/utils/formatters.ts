import {
  AccountStatus,
  DiscountType,
  Gender,
  OrderStatus,
  PaymentMethod,
  StockMovementType,
  UserRole,
} from '../types/domain';

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ROLE_LABELS: Record<UserRole, string> = {
  KhachHang: 'Khách hàng',
  NhanVien: 'Nhân viên',
  QuanLy: 'Quản lý',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  HoatDong: 'Hoạt động',
  BiKhoa: 'Bị khóa',
};

export const GENDER_LABELS: Record<Gender, string> = {
  Nam: 'Nam',
  Nu: 'Nữ',
  Khac: 'Khác',
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PhanTram: 'Phần trăm (%)',
  SoTien: 'Số tiền cố định (VNĐ)',
};

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  NhapTang: 'Nhập tăng',
  DieuChinhGiam: 'Điều chỉnh giảm',
  XuatBan: 'Xuất bán',
  HoanDon: 'Hoàn đơn',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  KhiNhanHang: 'Thanh toán khi nhận hàng (COD)',
  ChuyenKhoan: 'Chuyển khoản ngân hàng (QR)',
  ViDienTu: 'Ví điện tử (MoMo / ZaloPay)',
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    color: 'warning' | 'primary' | 'secondary' | 'success' | 'danger' | 'default';
    badgeClass: string;
    stepIndex: number;
  }
> = {
  ChoXacNhan: {
    label: 'Chờ xác nhận',
    color: 'warning',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    stepIndex: 1,
  },
  DaXacNhan: {
    label: 'Đã xác nhận',
    color: 'primary',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/70',
    stepIndex: 2,
  },
  DangChuanBi: {
    label: 'Đang chuẩn bị',
    color: 'secondary',
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70',
    stepIndex: 3,
  },
  DangGiao: {
    label: 'Đang giao',
    color: 'primary',
    badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200/70',
    stepIndex: 4,
  },
  HoanThanh: {
    label: 'Hoàn thành',
    color: 'success',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    stepIndex: 5,
  },
  DaHuy: {
    label: 'Đã hủy',
    color: 'danger',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/70',
    stepIndex: 0,
  },
};
