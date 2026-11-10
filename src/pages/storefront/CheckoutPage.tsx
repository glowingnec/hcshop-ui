import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  Plus,
  TicketPercent,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, PaymentMethod } from '../../types/domain';
import { formatVND } from '../../utils/formatters';

export const CheckoutPage: React.FC = () => {
  const {
    currentUser,
    cart,
    products,
    addresses,
    vouchers,
    addShippingAddress,
    validateVoucherCode,
    placeOrder,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVoucher = searchParams.get('voucher') || '';

  const userAddresses = useMemo(
    () => (currentUser ? addresses.filter((a) => a.userId === currentUser.id) : []),
    [addresses, currentUser]
  );

  const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddr?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  // Voucher state (UC-35)
  const [voucherInput, setVoucherInput] = useState(initialVoucher);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | undefined>(
    initialVoucher || undefined
  );
  const [voucherFeedback, setVoucherFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Add New Address inline modal/form state (UC-34 3a)
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [recipientName, setRecipientName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [province, setProvince] = useState('Hà Nội');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Checkout Error & Placed Order Success State (UC-37)
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const availableCartItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return { ...item, product };
      })
      .filter(
        (item) =>
          item.product &&
          item.product.isVisible &&
          !item.product.isDeleted &&
          item.product.stock > 0
      );
  }, [cart, products]);

  const subtotal = useMemo(() => {
    return availableCartItems.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
  }, [availableCartItems]);

  const discountResult = useMemo(() => {
    if (!appliedVoucherCode) return { ok: false, discountAmount: 0, message: '' };
    return validateVoucherCode(appliedVoucherCode, subtotal);
  }, [appliedVoucherCode, subtotal, validateVoucherCode]);

  const discountAmount = discountResult.ok ? discountResult.discountAmount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const isCodDisabled = subtotal > 20000000; // UC-36 1a

  const selectedAddressObj = userAddresses.find((a) => a.id === selectedAddressId);

  // Success View after Atomic Checkout (UC-37 f)
  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto my-8 bg-white rounded-2xl border border-zinc-200/70 p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-emerald-600">
            Giao dịch nguyên tử hoàn tất
          </span>
          <h1 className="text-xl font-bold text-zinc-900">
            Đặt hàng thành công!
          </h1>
          <p className="text-xs text-zinc-500">
            Mã đơn hàng của bạn là{' '}
            <strong className="text-zinc-900">#{placedOrder.code}</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#f8f9fa] border border-zinc-200/60 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Người nhận</span>
            <span className="font-semibold text-zinc-900">
              {placedOrder.shippingAddress.recipientName} ({placedOrder.shippingAddress.phone})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Địa chỉ giao</span>
            <span className="font-medium text-zinc-800 text-right max-w-[240px]">
              {placedOrder.shippingAddress.detailAddress}, {placedOrder.shippingAddress.ward},{' '}
              {placedOrder.shippingAddress.district}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Phương thức</span>
            <span className="font-medium text-zinc-800">
              {placedOrder.paymentMethod === 'COD'
                ? 'Thanh toán khi nhận hàng (COD)'
                : placedOrder.paymentMethod === 'BANK_TRANSFER'
                ? 'Chuyển khoản ngân hàng'
                : 'Ví điện tử'}
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-200/60 flex justify-between text-sm font-bold text-zinc-900">
            <span>Tổng thanh toán</span>
            <span>{formatVND(placedOrder.totalAmount)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => navigate('/orders')}
            className="h-9 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition-colors"
          >
            Theo dõi đơn hàng
          </button>
          <button
            onClick={() => navigate('/')}
            className="h-9 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // UC-40 1a: Giỏ hàng trống
  if (availableCartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-zinc-200/70 p-8 text-center space-y-3">
        <h2 className="text-base font-bold text-zinc-900">
          Không có sản phẩm để thanh toán
        </h2>
        <p className="text-xs text-zinc-500">
          Giỏ hàng của bạn hiện đang trống hoặc các sản phẩm đã hết hàng.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="h-9 px-5 rounded-full bg-zinc-900 text-white text-xs font-medium"
          >
            Quay về danh sách sản phẩm
          </button>
        </div>
      </div>
    );
  }

  const handleApplyVoucher = (codeToApply?: string) => {
    const targetCode = codeToApply ?? voucherInput;
    const res = validateVoucherCode(targetCode, subtotal);
    if (res.ok && res.voucher) {
      setAppliedVoucherCode(res.voucher.code);
      setVoucherInput(res.voucher.code);
      setVoucherFeedback({ ok: true, text: res.message });
    } else {
      setAppliedVoucherCode(undefined);
      setVoucherFeedback({ ok: false, text: res.message });
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucherCode(undefined);
    setVoucherInput('');
    setVoucherFeedback(null);
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    const res = addShippingAddress({
      recipientName,
      phone,
      province,
      district,
      ward,
      detailAddress,
      isDefault: userAddresses.length === 0,
      isOutOfDeliveryZone: false,
    });
    if (!res.ok || !res.address) {
      setAddressError(res.message);
      return;
    }
    setSelectedAddressId(res.address.id);
    setShowAddAddress(false);
    setDistrict('');
    setWard('');
    setDetailAddress('');
  };

  const handleConfirmOrder = () => {
    setCheckoutError(null);
    const res = placeOrder({
      addressId: selectedAddressId,
      paymentMethod: isCodDisabled && paymentMethod === 'COD' ? 'BANK_TRANSFER' : paymentMethod,
      voucherCode: appliedVoucherCode,
    });

    if (!res.ok || !res.order) {
      setCheckoutError(res.message);
      return;
    }
    setPlacedOrder(res.order);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight leading-tight">
            Thanh toán đơn hàng
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Hoàn tất thông tin nhận hàng, ưu đãi và xác nhận đặt hàng
          </p>
        </div>

        <button
          onClick={() => navigate('/cart')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại giỏ hàng</span>
        </button>
      </div>

      {checkoutError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Step 1 (Address), Step 2 (Voucher), Step 3 (Payment) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Chọn địa chỉ nhận hàng (UC-34) */}
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-700" />
                <h2 className="text-sm font-bold text-zinc-900">
                  1. Địa chỉ nhận hàng
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm địa chỉ mới</span>
              </button>
            </div>

            {/* Inline New Address Form (UC-34 3a) */}
            {showAddAddress && (
              <form
                onSubmit={handleSaveNewAddress}
                className="p-4 rounded-xl bg-[#f8f9fa] border border-zinc-200/80 space-y-3 text-xs"
              >
                <p className="font-semibold text-zinc-900">Thêm địa chỉ giao hàng</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Họ tên người nhận *"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Tỉnh / Thành phố *"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Quận / Huyện *"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Phường / Xã *"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường *"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                </div>
                {addressError && (
                  <p className="text-rose-500 text-[11px]">{addressError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="h-8 px-3 rounded-full bg-white border border-zinc-200 text-zinc-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-full bg-zinc-900 text-white font-medium"
                  >
                    Lưu địa chỉ
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {userAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50/60'
                        : 'border-zinc-200/70 hover:border-zinc-300'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">
                          {addr.recipientName}
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-zinc-600">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 text-[10px] font-medium">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500">
                        {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.province}
                      </p>
                      {addr.isOutOfDeliveryZone && (
                        <p className="text-[11px] text-rose-500 font-medium pt-0.5">
                          Địa chỉ này nằm ngoài khu vực hỗ trợ giao hàng.
                        </p>
                      )}
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Áp dụng mã giảm giá (UC-35) */}
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TicketPercent className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-900">
                2. Mã giảm giá (Voucher)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá (VD: WELCOME10)..."
                className="flex-1 h-9 px-3.5 rounded-full bg-[#f8f9fa] border border-zinc-200/80 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
              />
              {appliedVoucherCode ? (
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="h-9 px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-700 inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Gỡ mã</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApplyVoucher()}
                  className="h-9 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white transition-colors"
                >
                  Áp dụng
                </button>
              )}
            </div>

            {voucherFeedback && (
              <p
                className={`text-xs font-medium ${
                  voucherFeedback.ok ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {voucherFeedback.text}
              </p>
            )}

            {/* Quick Pick Available Vouchers */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-zinc-400">
                Chọn nhanh mã ưu đãi có sẵn:
              </p>
              <div className="flex flex-wrap gap-2">
                {vouchers.map((v) => {
                  const isApplied = appliedVoucherCode === v.code;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleApplyVoucher(v.code)}
                      className={`px-3 py-1.5 rounded-xl border text-left transition-colors ${
                        isApplied
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                          : 'border-zinc-200/80 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{v.code}</span>
                      <span className="text-[10px] text-zinc-400 block">
                        Đơn tối thiểu {formatVND(v.minOrderValue)} · Còn{' '}
                        {v.usageLimit - v.usedCount} lượt
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Chọn phương thức thanh toán (UC-36) */}
          <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-900">
                3. Phương thức thanh toán
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Option 1: COD */}
              <div
                onClick={() => !isCodDisabled && setPaymentMethod('COD')}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isCodDisabled
                    ? 'border-zinc-200/50 bg-zinc-50 opacity-60 cursor-not-allowed'
                    : paymentMethod === 'COD'
                    ? 'border-zinc-900 bg-zinc-50/60 cursor-pointer'
                    : 'border-zinc-200/70 hover:border-zinc-300 cursor-pointer'
                }`}
              >
                <div>
                  <p className="font-bold text-zinc-900">
                    Thanh toán khi nhận hàng (COD)
                  </p>
                  <p className="text-zinc-500 mt-0.5">
                    {isCodDisabled
                      ? 'Không áp dụng cho đơn hàng trên 20.000.000đ'
                      : 'Thanh toán tiền mặt trực tiếp khi nhận hàng'}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'COD' && !isCodDisabled
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300'
                  }`}
                >
                  {paymentMethod === 'COD' && !isCodDisabled && (
                    <Check className="w-2.5 h-2.5" />
                  )}
                </div>
              </div>

              {/* Option 2: Bank Transfer */}
              <div
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors space-y-2 ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-zinc-900 bg-zinc-50/60'
                    : 'border-zinc-200/70 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-900">
                      Chuyển khoản Ngân hàng (VietQR)
                    </p>
                    <p className="text-zinc-500 mt-0.5">
                      Xác nhận thanh toán tự động 24/7
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-300'
                    }`}
                  >
                    {paymentMethod === 'BANK_TRANSFER' && (
                      <Check className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="p-3 rounded-lg bg-white border border-zinc-200/70 text-[11px] text-zinc-600 space-y-1">
                    <p>
                      Ngân hàng: <strong className="text-zinc-900">Vietcombank</strong> · STK:{' '}
                      <strong className="text-zinc-900">0011009988776</strong>
                    </p>
                    <p>
                      Chủ TK: <strong className="text-zinc-900">HCSHOP RETAIL</strong> · Nội dung:{' '}
                      <strong className="text-zinc-900">HCSHOP {currentUser?.phone}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Option 3: E-Wallet */}
              <div
                onClick={() => setPaymentMethod('EWALLET')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                  paymentMethod === 'EWALLET'
                    ? 'border-zinc-900 bg-zinc-50/60'
                    : 'border-zinc-200/70 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="font-bold text-zinc-900">
                      Ví điện tử (MoMo / VNPay)
                    </p>
                    <p className="text-zinc-500 mt-0.5">
                      Thanh toán nhanh qua cổng ví điện tử liên kết
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'EWALLET'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300'
                  }`}
                >
                  {paymentMethod === 'EWALLET' && <Check className="w-2.5 h-2.5" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Order Summary & Atomic Confirmation (UC-37) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-5 sticky top-24">
          <h2 className="text-sm font-bold text-zinc-900">
            Chi tiết đơn đặt hàng ({availableCartItems.length})
          </h2>

          <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto pr-1">
            {availableCartItems.map((item) => {
              const p = item.product!;
              return (
                <div
                  key={item.productId}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-11 h-9 rounded-lg object-cover bg-[#f1f5f9] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-zinc-400">SL: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-zinc-900 shrink-0">
                    {formatVND(p.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Tạm tính</span>
              <span className="font-medium text-zinc-800">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Giảm giá Voucher</span>
              <span className="font-medium text-emerald-600">
                {discountAmount > 0 ? `-${formatVND(discountAmount)}` : '0 ₫'}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Phí giao hàng</span>
              <span className="font-medium text-emerald-600">Miễn phí</span>
            </div>
            <div className="pt-3 border-t border-zinc-100 flex items-baseline justify-between">
              <span className="text-xs font-bold text-zinc-900">
                Tổng thanh toán
              </span>
              <span className="text-xl font-bold text-zinc-900">
                {formatVND(totalAmount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={Boolean(selectedAddressObj?.isOutOfDeliveryZone)}
            onClick={handleConfirmOrder}
            className={`w-full h-10 rounded-full text-xs font-semibold transition-colors ${
              selectedAddressObj?.isOutOfDeliveryZone
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            Xác nhận đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
};
