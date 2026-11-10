import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Search,
  Copy,
  Check,
  Info,
  ArrowLeft,
  Calendar,
  Tag,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Voucher } from '../../types/domain';
import { formatVND, formatDate } from '../../utils/formatters';

export const VoucherWalletPage: React.FC = () => {
  const { vouchers, cart, products, validateVoucherCode } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'AVAILABLE' | 'ALL'>('AVAILABLE');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Calculate current active cart subtotal so user can immediately see if their cart qualifies
  const currentCartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      if (!p || !p.isVisible || p.isDeleted || p.stock === 0) return sum;
      return sum + p.price * Math.min(item.quantity, p.stock);
    }, 0);
  }, [cart, products]);

  const now = new Date();

  const getVoucherState = (v: Voucher) => {
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    const remaining = Math.max(0, v.usageLimit - v.usedCount);

    if (!v.isActive) {
      return { status: 'INACTIVE', label: 'Ngừng áp dụng', canUse: false, remaining };
    }
    if (now < start) {
      return { status: 'UPCOMING', label: 'Sắp diễn ra', canUse: false, remaining };
    }
    if (now > end) {
      return { status: 'EXPIRED', label: 'Đã hết hạn', canUse: false, remaining };
    }
    if (remaining === 0) {
      return { status: 'OUT_OF_QUOTA', label: 'Hết lượt dùng', canUse: false, remaining };
    }
    return { status: 'ACTIVE', label: 'Đang có hiệu lực', canUse: true, remaining };
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const state = getVoucherState(v);
      if (filterTab === 'AVAILABLE' && !state.canUse) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          v.code.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vouchers, filterTab, searchQuery]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2000);
  };

  const handleUseAtCheckout = (code: string) => {
    handleCopyCode(code);
    navigate(`/checkout?voucher=${encodeURIComponent(code)}`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại cửa hàng
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Kho mã giảm giá
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Tra cứu và áp dụng ưu đãi dành riêng cho đơn hàng của bạn
          </p>
        </div>

        {currentCartSubtotal > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200/70 px-4 py-2.5 flex items-center gap-3">
            <div className="text-[12px] text-zinc-500">
              Tạm tính giỏ hàng hiện tại:{' '}
              <span className="font-bold text-zinc-900">
                {formatVND(currentCartSubtotal)}
              </span>
            </div>
            <Link
              to="/checkout"
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Thanh toán
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Search & Filter Controls (UC-46) */}
      <div className="bg-white rounded-3xl border border-zinc-200/70 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã code (VD: HCSHOP10) hoặc mô tả ưu đãi..."
            className="w-full h-10 pl-10 pr-8 rounded-full bg-[#f4f4f5] text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:bg-white border border-transparent focus:border-zinc-300 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterTab('AVAILABLE')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              filterTab === 'AVAILABLE'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Đang dùng được
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              filterTab === 'ALL'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Tất cả mã ({vouchers.length})
          </button>
        </div>
      </div>

      {/* Voucher Grid (UC-45) */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/70 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className="text-[15px] font-semibold text-zinc-900">
            Không tìm thấy mã giảm giá phù hợp
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1">
            Thử đổi từ khóa tìm kiếm hoặc chuyển sang tab &ldquo;Tất cả mã&rdquo; để xem các mã đã hết hạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVouchers.map((voucher) => {
            const state = getVoucherState(voucher);
            const usagePercent = Math.min(
              100,
              Math.round((voucher.usedCount / voucher.usageLimit) * 100)
            );
            const checkWithCurrentCart =
              currentCartSubtotal > 0
                ? validateVoucherCode(voucher.code, currentCartSubtotal)
                : null;

            return (
              <div
                key={voucher.id}
                className={`bg-white rounded-[22px] border p-5 flex flex-col justify-between transition-all ${
                  state.canUse
                    ? 'border-zinc-200/80 hover:border-zinc-300'
                    : 'border-zinc-200/50 opacity-70 bg-zinc-50/50'
                }`}
              >
                <div>
                  {/* Top row: Code pill + Status badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-white text-[12px] font-mono font-bold tracking-wider">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      {voucher.code}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        state.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : state.status === 'UPCOMING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {state.label}
                    </span>
                  </div>

                  {/* Discount headline */}
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-bold text-zinc-900">
                      {voucher.discountType === 'PERCENT'
                        ? `Giảm ${voucher.discountValue}%`
                        : `Giảm ${formatVND(voucher.discountValue)}`}
                    </h3>
                    {voucher.discountType === 'PERCENT' &&
                      voucher.maxDiscountAmount && (
                        <span className="text-[12px] text-zinc-500">
                          (Tối đa {formatVND(voucher.maxDiscountAmount)})
                        </span>
                      )}
                  </div>

                  <p className="text-[13px] text-zinc-600 mt-1">
                    {voucher.description}
                  </p>

                  {/* Min order & Dates */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-[12px] text-zinc-500">
                    <div>
                      Đơn tối thiểu:{' '}
                      <span className="font-semibold text-zinc-800">
                        {formatVND(voucher.minOrderValue)}
                      </span>
                    </div>
                    <div className="text-right">
                      Còn lại:{' '}
                      <span className="font-semibold text-zinc-800">
                        {state.remaining}/{voucher.usageLimit} lượt
                      </span>
                    </div>
                  </div>

                  {/* Usage progress bar */}
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        state.canUse ? 'bg-zinc-900' : 'bg-zinc-400'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>

                  {/* Live compatibility indicator with current cart */}
                  {checkWithCurrentCart && state.canUse && (
                    <div
                      className={`mt-3 px-3 py-1.5 rounded-xl text-[12px] flex items-center gap-1.5 ${
                        checkWithCurrentCart.ok
                          ? 'bg-emerald-50/70 text-emerald-800'
                          : 'bg-amber-50/70 text-amber-800'
                      }`}
                    >
                      {checkWithCurrentCart.ok ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Giỏ hàng đủ điều kiện — Giảm ngay{' '}
                            <strong>{formatVND(checkWithCurrentCart.discountAmount)}</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{checkWithCurrentCart.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>HSD: {formatDate(voucher.endDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVoucher(voucher)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#f4f4f5] text-zinc-700 hover:bg-zinc-200/80 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Chi tiết
                    </button>

                    <button
                      type="button"
                      disabled={!state.canUse}
                      onClick={() => handleCopyCode(voucher.code)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                        !state.canUse
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : copiedCode === voucher.code
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      {copiedCode === voucher.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal (UC-47: Xem chi tiết mã giảm giá) */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Chi tiết mã giảm giá
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-zinc-900">
                    {selectedVoucher.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700">
                    {getVoucherState(selectedVoucher).label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[13px] text-zinc-600 bg-[#f8f9fa] p-3.5 rounded-2xl border border-zinc-200/60">
              {selectedVoucher.description}
            </p>

            {/* 5 Validation Conditions Breakdown */}
            <div className="space-y-2.5 text-[13px]">
              <div className="font-semibold text-zinc-900 text-[12px] uppercase tracking-wider">
                Điều kiện áp dụng
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">1. Loại giảm giá</span>
                <span className="font-semibold text-zinc-900">
                  {selectedVoucher.discountType === 'PERCENT'
                    ? `Theo phần trăm (${selectedVoucher.discountValue}%)`
                    : `Số tiền cố định (${formatVND(selectedVoucher.discountValue)})`}
                </span>
              </div>

              {selectedVoucher.maxDiscountAmount && (
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">2. Mức giảm tối đa</span>
                  <span className="font-semibold text-zinc-900">
                    {formatVND(selectedVoucher.maxDiscountAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">3. Giá trị đơn hàng tối thiểu</span>
                <span className="font-semibold text-zinc-900">
                  {formatVND(selectedVoucher.minOrderValue)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">4. Thời gian hiệu lực</span>
                <span className="font-semibold text-zinc-900">
                  {formatDate(selectedVoucher.startDate)} → {formatDate(selectedVoucher.endDate)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500">5. Lượt sử dụng khả dụng</span>
                <span className="font-semibold text-zinc-900">
                  Đã dùng {selectedVoucher.usedCount} / {selectedVoucher.usageLimit} lượt
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCopyCode(selectedVoucher.code)}
                className="flex-1 py-2.5 rounded-full border border-zinc-200 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                Sao chép mã
              </button>
              {getVoucherState(selectedVoucher).canUse && (
                <button
                  type="button"
                  onClick={() => handleUseAtCheckout(selectedVoucher.code)}
                  className="flex-1 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Dùng ngay ở Thanh toán
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
