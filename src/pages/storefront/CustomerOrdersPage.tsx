import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Star,
  MapPin,
  CreditCard,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types/domain';
import { formatVND, formatDateTime, ORDER_STATUS_META, PAYMENT_METHOD_LABELS } from '../../utils/formatters';

const STATUS_TABS: { id: 'ALL' | OrderStatus; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ xác nhận' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'PREPARING', label: 'Đang chuẩn bị' },
  { id: 'SHIPPING', label: 'Đang giao' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

const JOURNEY_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Đặt đơn' },
  { status: 'CONFIRMED', label: 'Đã xác nhận' },
  { status: 'PREPARING', label: 'Chuẩn bị hàng' },
  { status: 'SHIPPING', label: 'Đang giao' },
  { status: 'COMPLETED', label: 'Hoàn thành' },
];

const CANCEL_REASONS = [
  'Tôi muốn thay đổi địa chỉ hoặc số điện thoại nhận hàng',
  'Tôi muốn áp dụng hoặc đổi mã giảm giá khác',
  'Tôi muốn thay đổi sản phẩm hoặc số lượng trong đơn',
  'Đặt nhầm sản phẩm / Tìm thấy lựa chọn phù hợp hơn',
  'Lý do khác',
];

export const CustomerOrdersPage: React.FC = () => {
  const {
    currentUser,
    orders,
    reviews,
    cancelCustomerOrder,
    submitReview,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Cancel Order Modal state (UC-41)
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Quick Review Modal state (UC-53 / UC-54)
  const [reviewingItem, setReviewingItem] = useState<{
    productId: string;
    productName: string;
    productImage: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter((o) => o.userId === currentUser.id);
  }, [orders, currentUser]);

  const filteredOrders = useMemo(() => {
    return myOrders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = order.code.toLowerCase().includes(q);
        const matchProduct = order.items.some((item) =>
          item.productName.toLowerCase().includes(q)
        );
        return matchCode || matchProduct;
      }
      return true;
    });
  }, [myOrders, statusFilter, searchQuery]);

  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = myOrders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return filteredOrders[0] || null;
  }, [myOrders, filteredOrders, selectedOrderId]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-zinc-200/80 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">
          Vui lòng đăng nhập để xem đơn hàng
        </h2>
        <p className="text-[13px] text-zinc-500">
          Theo dõi tiến trình vận chuyển, hủy đơn hoàn kho hoặc đánh giá sản phẩm sau khi mua.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    const finalReason =
      selectedReason === 'Lý do khác' ? customReason.trim() : selectedReason;
    const res = cancelCustomerOrder(cancellingOrder.id, finalReason);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setCancellingOrder(null);
      setCustomReason('');
    }
  };

  const openReviewModal = (item: {
    productId: string;
    productName: string;
    productImage: string;
  }) => {
    const existing = reviews.find(
      (r) => r.productId === item.productId && r.userId === currentUser.id
    );
    setReviewingItem(item);
    setReviewRating(existing ? existing.rating : 5);
    setReviewComment(existing ? existing.comment : '');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    const res = submitReview(reviewingItem.productId, reviewRating, reviewComment);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setReviewingItem(null);
    }
  };

  const getStepIndex = (status: OrderStatus) =>
    JOURNEY_STEPS.findIndex((s) => s.status === status);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Đơn hàng của tôi ({myOrders.length})
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Theo dõi tiến trình vận chuyển và quản lý lịch sử mua hàng
          </p>
        </div>

        <Link
          to="/account"
          className="px-4 py-2 rounded-full bg-white border border-zinc-200/80 text-[13px] font-medium text-zinc-800 hover:border-zinc-900 transition-colors"
        >
          Hồ sơ & Sổ địa chỉ
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-[13px] flex items-center justify-between gap-3 ${
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

      {/* Search & Status Filter Bar (UC-38) */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn (VD: DH2026...) hoặc tên sản phẩm..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f4f4f5] text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.id === 'ALL'
                ? myOrders.length
                : myOrders.filter((o) => o.status === tab.id).length;
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
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

      {/* Main Master-Detail View */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto">
          <Package className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-zinc-900">
            Không có đơn hàng nào trong mục này
          </h3>
          <p className="text-[13px] text-zinc-500 mt-1 mb-5">
            Bạn có thể chọn tab &ldquo;Tất cả&rdquo; hoặc đặt mua thêm sản phẩm mới tại cửa hàng.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-semibold"
          >
            Khám phá cửa hàng
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Orders List (UC-38) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredOrders.map((order) => {
              const meta = ORDER_STATUS_META[order.status];
              const isSelected = activeOrder?.id === order.id;

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left bg-white rounded-3xl border p-4 transition-all space-y-3 ${
                    isSelected
                      ? 'border-zinc-900 shadow-sm ring-1 ring-zinc-900/5'
                      : 'border-zinc-200/80 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[13px] font-bold text-zinc-900">
                      #{order.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* First item preview */}
                  <div className="flex items-center gap-3">
                    <img
                      src={order.items[0]?.productImage}
                      alt={order.items[0]?.productName}
                      className="w-12 h-12 rounded-xl object-cover bg-zinc-100 border border-zinc-200/60 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-zinc-900 truncate">
                        {order.items[0]?.productName}
                      </div>
                      <div className="text-[12px] text-zinc-500">
                        {order.items.length > 1
                          ? `Cùng ${order.items.length - 1} sản phẩm khác`
                          : `Số lượng: x${order.items[0]?.quantity}`}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                  </div>

                  <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[12px]">
                    <span className="text-zinc-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                    <span className="font-bold text-zinc-900">
                      {formatVND(order.totalAmount)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Order Detail & Visual Journey Timeline (UC-39, UC-41, UC-42, UC-53) */}
          {activeOrder && (
            <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-7 space-y-6">
              {/* Top bar */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Chi tiết đơn hàng
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <h2 className="text-xl font-bold font-mono text-zinc-900">
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
                  <div className="text-[12px] text-zinc-500 mt-1">
                    Đặt lúc: {formatDateTime(activeOrder.createdAt)}
                  </div>
                </div>

                {/* Cancel Order Action */}
                {(activeOrder.status === 'PENDING' ||
                  activeOrder.status === 'CONFIRMED') && (
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(activeOrder)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[12px] font-semibold transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Hủy đơn hàng
                  </button>
                )}

                {(activeOrder.status === 'PREPARING' ||
                  activeOrder.status === 'SHIPPING') && (
                  <span
                    title="Đơn hàng đã chuyển sang khâu chuẩn bị/vận chuyển nên không thể hủy trực tuyến"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-400 text-[11px] font-medium cursor-not-allowed"
                  >
                    Đang xử lý giao hàng
                  </span>
                )}
              </div>

              {/* Visual Order Journey Stepper & Timeline */}
              <div className="space-y-4">
                <div className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">
                  Tiến trình đơn hàng
                </div>

                {activeOrder.status === 'CANCELLED' ? (
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-3">
                    <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-[13px]">
                      <div className="font-bold text-rose-900">
                        Đơn hàng đã bị hủy — Đã hoàn trả tồn kho & lượt mã giảm giá
                      </div>
                      {activeOrder.cancelReason && (
                        <div className="text-rose-700 mt-0.5">
                          Lý do hủy: <strong>{activeOrder.cancelReason}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {JOURNEY_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(activeOrder.status);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={step.status} className="text-center space-y-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-colors ${
                              isDone ? 'bg-zinc-900' : 'bg-zinc-200'
                            }`}
                          />
                          <div
                            className={`text-[11px] font-medium ${
                              isCurrent
                                ? 'text-zinc-900 font-bold'
                                : isDone
                                ? 'text-zinc-700'
                                : 'text-zinc-400'
                            }`}
                          >
                            {step.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Detailed Timeline Logs */}
                <div className="bg-[#f8f9fa] rounded-2xl border border-zinc-200/60 p-4 space-y-3">
                  {[...activeOrder.timeline].reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-[12px]">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          idx === 0 ? 'bg-zinc-900 ring-4 ring-zinc-900/10' : 'bg-zinc-300'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-zinc-900">{entry.note}</div>
                        <div className="text-zinc-500 text-[11px] mt-0.5">
                          {formatDateTime(entry.timestamp)}
                          {entry.actorName ? ` • Thực hiện bởi: ${entry.actorName}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items + Review Trigger (UC-53) */}
              <div className="space-y-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">
                  Sản phẩm trong đơn ({activeOrder.items.length})
                </div>

                <div className="divide-y divide-zinc-100 border border-zinc-200/70 rounded-2xl overflow-hidden">
                  {activeOrder.items.map((item) => {
                    const existingReview = reviews.find(
                      (r) =>
                        r.productId === item.productId &&
                        r.userId === currentUser.id
                    );

                    return (
                      <div
                        key={item.productId}
                        className="p-3.5 bg-white flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-14 h-14 rounded-xl object-cover bg-zinc-100 border border-zinc-200/60 shrink-0"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/product/${item.productId}`}
                              className="text-[13px] font-bold text-zinc-900 hover:text-blue-600 line-clamp-1"
                            >
                              {item.productName}
                            </Link>
                            <div className="text-[12px] text-zinc-500 mt-0.5">
                              Đơn giá lúc đặt: {formatVND(item.priceAtOrder)} × {item.quantity}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                          <div className="text-right">
                            <div className="text-[13px] font-bold text-zinc-900">
                              {formatVND(item.priceAtOrder * item.quantity)}
                            </div>
                          </div>

                          {activeOrder.status === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => openReviewModal(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f4f4f5] hover:bg-zinc-900 hover:text-white text-zinc-800 text-[12px] font-medium transition-colors"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>
                                {existingReview ? 'Sửa đánh giá' : 'Đánh giá'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping & Payment Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60 space-y-1.5 text-[12px]">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Địa chỉ nhận hàng</span>
                  </div>
                  <div className="font-semibold text-zinc-800">
                    {activeOrder.shippingAddress.recipientName} •{' '}
                    {activeOrder.shippingAddress.phone}
                  </div>
                  <div className="text-zinc-600 leading-relaxed">
                    {activeOrder.shippingAddress.detailAddress},{' '}
                    {activeOrder.shippingAddress.ward},{' '}
                    {activeOrder.shippingAddress.district},{' '}
                    {activeOrder.shippingAddress.province}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60 space-y-1.5 text-[12px]">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Thanh toán & Tổng kết</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Phương thức:</span>
                    <span className="font-semibold text-zinc-900">
                      {PAYMENT_METHOD_LABELS[activeOrder.paymentMethod]}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Tạm tính:</span>
                    <span>{formatVND(activeOrder.subtotal)}</span>
                  </div>
                  {activeOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Voucher ({activeOrder.voucherCode}):</span>
                      <span>-{formatVND(activeOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-zinc-200/80 text-[13px] font-bold text-zinc-900">
                    <span>Tổng thanh toán:</span>
                    <span>{formatVND(activeOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Order Modal (UC-41) */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Hủy đơn hàng #{cancellingOrder.code}
              </h3>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-zinc-600 bg-amber-50/80 border border-amber-200/70 p-3 rounded-2xl">
              Khi hủy đơn, hệ thống sẽ <strong>tự động hoàn lại số lượng tồn kho</strong> của các sản phẩm và <strong>hoàn lại lượt sử dụng mã giảm giá</strong> (nếu có).
            </p>

            <div className="space-y-2">
              <label className="block text-[12px] font-semibold text-zinc-700">
                Chọn lý do hủy đơn hàng *
              </label>
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200/80 text-[12px] text-zinc-800 cursor-pointer hover:bg-zinc-50"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {selectedReason === 'Lý do khác' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể của bạn..."
                  className="w-full p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-[12px] focus:outline-none focus:bg-white"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-[12px] font-medium text-zinc-700"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold"
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Product Review Modal from Completed Order (UC-53 / UC-54) */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleReviewSubmit}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Đánh giá sản phẩm
              </h3>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
              <img
                src={reviewingItem.productImage}
                alt={reviewingItem.productName}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="text-[13px] font-bold text-zinc-900">
                {reviewingItem.productName}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-700 mb-2">
                Mức độ hài lòng của bạn *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`p-2 rounded-xl border transition-colors ${
                      star <= reviewRating
                        ? 'bg-amber-50 border-amber-300 text-amber-500'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-300'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
                <span className="text-[12px] font-semibold text-zinc-700 ml-2">
                  {reviewRating} / 5 sao
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                Nhận xét chi tiết (tối đa 500 ký tự) *
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm thực tế của bạn về sản phẩm..."
                className="w-full p-3 rounded-2xl bg-[#f8f9fa] border border-zinc-200 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-[12px] font-medium text-zinc-700"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-semibold"
              >
                Gửi đánh giá
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
