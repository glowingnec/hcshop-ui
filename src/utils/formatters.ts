import { OrderStatus, PaymentMethod } from '../types/domain';

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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng (QR)',
  EWALLET: 'Ví điện tử (MoMo / ZaloPay)',
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
  PENDING: {
    label: 'Chờ xác nhận',
    color: 'warning',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    stepIndex: 1,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'primary',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/70',
    stepIndex: 2,
  },
  PREPARING: {
    label: 'Đang chuẩn bị',
    color: 'secondary',
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70',
    stepIndex: 3,
  },
  SHIPPING: {
    label: 'Đang giao hàng',
    color: 'primary',
    badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200/70',
    stepIndex: 4,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'success',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    stepIndex: 5,
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'danger',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/70',
    stepIndex: 0,
  },
};
