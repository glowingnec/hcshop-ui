import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Package,
  MapPin,
  CreditCard,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types/domain';
import {
  formatVND,
  formatDateTime,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from '../../utils/formatters';

const STATUS_TABS: { id: 'ALL' | OrderStatus; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'PREPARING', label: 'Chuẩn bị hàng' },
  { id: 'SHIPPING', label: 'Đang giao' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

const NEXT_STEP_CONFIG: Partial<
  Record<
    OrderStatus,
    { nextStatus: OrderStatus; buttonLabel: string; defaultNote: string }
  >
> = {
  CONFIRMED: {
    nextStatus: 'PREPARING',
    buttonLabel: 'Bắt đầu đóng gói',
    defaultNote: 'Kho đang đóng gói sản phẩm và chuẩn bị bàn giao vận chuyển',
  },
  PREPARING: {
    nextStatus: 'SHIPPING',
    buttonLabel: 'Bàn giao vận chuyển',
    defaultNote: 'Đã bàn giao cho đơn vị vận chuyển, đang trên đường giao',
  },
  SHIPPING: {
    nextStatus: 'COMPLETED',
    buttonLabel: 'Xác nhận giao thành công',
    defaultNote: 'Khách hàng đã nhận hàng và thanh toán đầy đủ',
  },
};

const REJECT_PRESETS = [
  'Không liên hệ được với người nhận qua số điện thoại',
  'Địa chỉ giao hàng nằm ngoài phạm vi phục vụ',
  'Sản phẩm phát sinh lỗi kỹ thuật khi kiểm tra trước đóng gói',
  'Nghi ngờ đơn hàng bất thường / thông tin chưa hợp lệ',
  'Lý do khác',
];

export const OrderManagementPage: React.FC = () => {
  const {
    orders,
    staffConfirmOrRejectOrder,
    staffAdvanceOrderStatus,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Reject Modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectPreset, setRejectPreset] = useState(REJECT_PRESETS[0]);
  const [rejectCustom, setRejectCustom] = useState('');

  const kpis = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const processing = orders.filter(
      (o) =>
        o.status === 'CONFIRMED' ||
        o.status === 'PREPARING' ||
        o.status === 'SHIPPING'
    ).length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const revenue = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return { pending, processing, completed, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          order.code.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.shippingAddress.phone.includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = orders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return filteredOrders[0] || null;
  }, [orders, filteredOrders, selectedOrderId]);

  const handleConfirmOrder = (orderId: string) => {
    const res = staffConfirmOrRejectOrder(
      orderId,
      'CONFIRM',
      statusNote.trim() || undefined
    );
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setStatusNote('');
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;
    const reason =
      rejectPreset === 'Lý do khác' ? rejectCustom.trim() : rejectPreset;
    const res = staffConfirmOrRejectOrder(rejectingOrder.id, 'REJECT', reason);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setRejectingOrder(null);
      setRejectCustom('');
    }
  };

  const handleAdvanceStatus = (orderId: string, nextStatus: OrderStatus) => {
    const res = staffAdvanceOrderStatus(
      orderId,
      nextStatus,
      statusNote.trim() || undefined
    );
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setStatusNote('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Quản lý đơn hàng
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Xác nhận đơn mới, điều phối đóng gói và cập nhật lộ trình giao hàng
          </p>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Chờ xác nhận</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-zinc-900">{kpis.pending}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              Cần xử lý
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Đang vận hành</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-zinc-900">{kpis.processing}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Đóng gói & Giao
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Đơn hoàn tất</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-zinc-900">{kpis.completed}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Thành công
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Doanh thu thực thu</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-lg font-bold text-zinc-900">
              {formatVND(kpis.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách hàng hoặc SĐT..."
            className="w-full h-9 pl-9 pr-4 rounded-full bg-[#f4f4f5] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.id === 'ALL'
                ? orders.length
                : orders.filter((o) => o.status === tab.id).length;
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'bg-[#f4f4f5] text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Split View: Order List (Left) & Order Detail Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/80 divide-y divide-zinc-100 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-400">
              Không tìm thấy đơn hàng nào khớp bộ lọc.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const meta = ORDER_STATUS_META[order.status];
              const isSelected = activeOrder?.id === order.id;

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left p-4 transition-colors flex flex-col gap-2 ${
                    isSelected ? 'bg-[#f1f5f9]/90' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-900">
                        #{order.code}
                      </span>
                      <span className="text-xs font-medium text-zinc-600">
                        · {order.customerName}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="truncate max-w-[200px]">
                      {order.items[0]?.productName}
                      {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatVND(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{formatDateTime(order.createdAt)}</span>
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Detail Workspace */}
        <div className="lg:col-span-7">
          {!activeOrder ? (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center text-xs text-zinc-400">
              Chọn một đơn hàng bên trái để xem chi tiết và xử lý.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold font-mono text-zinc-900">
                      #{activeOrder.code}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        ORDER_STATUS_META[activeOrder.status].badgeClass
                      }`}
                    >
                      {ORDER_STATUS_META[activeOrder.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Khách hàng: <strong>{activeOrder.customerName}</strong> · Đặt lúc{' '}
                    {formatDateTime(activeOrder.createdAt)}
                  </p>
                </div>

                {/* Action Controls by Status */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeOrder.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectingOrder(activeOrder)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Từ chối đơn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmOrder(activeOrder.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Xác nhận đơn
                      </button>
                    </>
                  )}

                  {NEXT_STEP_CONFIG[activeOrder.status] && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAdvanceStatus(
                          activeOrder.id,
                          NEXT_STEP_CONFIG[activeOrder.status]!.nextStatus
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                    >
                      <span>{NEXT_STEP_CONFIG[activeOrder.status]!.buttonLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Optional note input when order is active */}
              {(activeOrder.status === 'PENDING' ||
                NEXT_STEP_CONFIG[activeOrder.status]) && (
                <div className="bg-[#f8f9fa] rounded-xl p-3 border border-zinc-200/60 flex items-center gap-2">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Ghi chú vận hành khi chuyển trạng thái (tùy chọn)..."
                    className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>
              )}

              {activeOrder.status === 'CANCELLED' && (
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-900">
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      Đơn đã hủy — Đã tự động hoàn kho và lượt sử dụng mã giảm giá
                    </div>
                    {activeOrder.cancelReason && (
                      <div className="text-rose-700 mt-0.5">
                        Lý do: {activeOrder.cancelReason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Danh sách sản phẩm ({activeOrder.items.length})</span>
                </div>
                <div className="divide-y divide-zinc-100 border border-zinc-200/70 rounded-xl overflow-hidden">
                  {activeOrder.items.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-100 border border-zinc-200/60 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900 truncate">
                            {item.productName}
                          </div>
                          <div className="text-zinc-500">
                            {formatVND(item.priceAtOrder)} × {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-zinc-900 shrink-0">
                        {formatVND(item.priceAtOrder * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Shipping & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-zinc-200/60 space-y-1">
                  <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Thông tin nhận hàng</span>
                  </div>
                  <div className="font-medium text-zinc-800">
                    {activeOrder.shippingAddress.recipientName} ·{' '}
                    {activeOrder.shippingAddress.phone}
                  </div>
                  <div className="text-zinc-500 leading-relaxed">
                    {activeOrder.shippingAddress.detailAddress},{' '}
                    {activeOrder.shippingAddress.ward},{' '}
                    {activeOrder.shippingAddress.district},{' '}
                    {activeOrder.shippingAddress.province}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-zinc-200/60 space-y-1">
                  <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Thanh toán</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Hình thức:</span>
                    <span className="font-medium text-zinc-900">
                      {PAYMENT_METHOD_LABELS[activeOrder.paymentMethod]}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Tạm tính:</span>
                    <span>{formatVND(activeOrder.subtotal)}</span>
                  </div>
                  {activeOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm giá ({activeOrder.voucherCode}):</span>
                      <span>-{formatVND(activeOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-zinc-200/80 font-bold text-zinc-900">
                    <span>Tổng thu:</span>
                    <span>{formatVND(activeOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Timeline History */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Nhật ký xử lý đơn hàng
                </div>
                <div className="bg-[#f8f9fa] rounded-xl border border-zinc-200/60 p-3.5 space-y-2.5">
                  {[...activeOrder.timeline].reverse().map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          idx === 0 ? 'bg-blue-600' : 'bg-zinc-300'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-zinc-900">{log.note}</div>
                        <div className="text-[11px] text-zinc-400">
                          {formatDateTime(log.timestamp)}
                          {log.actorName ? ` · ${log.actorName}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Từ chối đơn hàng #{rejectingOrder.code}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 bg-amber-50 border border-amber-200/70 p-3 rounded-xl">
              Tồn kho của các sản phẩm trong đơn và lượt sử dụng mã giảm giá sẽ được hoàn trả tự động.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700">
                Lý do từ chối *
              </label>
              {REJECT_PRESETS.map((preset) => (
                <label
                  key={preset}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200/80 text-xs text-zinc-800 cursor-pointer hover:bg-zinc-50"
                >
                  <input
                    type="radio"
                    name="rejectPreset"
                    checked={rejectPreset === preset}
                    onChange={() => setRejectPreset(preset)}
                  />
                  <span>{preset}</span>
                </label>
              ))}

              {rejectPreset === 'Lý do khác' && (
                <textarea
                  rows={2}
                  value={rejectCustom}
                  onChange={(e) => setRejectCustom(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs focus:outline-none focus:bg-white"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Xác nhận từ chối
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
