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
import {
  VN_LOCATIONS,
  getDistrictsByProvince,
  getWardsByDistrict,
  isAddressInDeliveryZone,
} from '../../data/vnLocations';
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('KhiNhanHang');

  // Voucher state (UC-35)
  const [voucherInput, setVoucherInput] = useState(initialVoucher);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | undefined>(
    initialVoucher || undefined
  );
  const [voucherFeedback, setVoucherFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Add New Address inline modal/form state (UC-34 3a, ISS-18)
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [recipientName, setRecipientName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [province, setProvince] = useState('Hà Nội');
  const [district, setDistrict] = useState('Quận Hoàn Kiếm');
  const [ward, setWard] = useState('Phường Tràng Tiền');
  const [detailAddress, setDetailAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  const availableDistricts = useMemo(
    () => getDistrictsByProvince(province),
    [province]
  );
  const availableWards = useMemo(
    () => getWardsByDistrict(province, district),
    [province, district]
  );

  const handleProvinceChange = (nextProvince: string) => {
    setProvince(nextProvince);
    const districts = getDistrictsByProvince(nextProvince);
    const firstDist = districts[0]?.name || '';
    setDistrict(firstDist);
    setWard(districts[0]?.wards[0] || '');
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    const wards = getWardsByDistrict(province, nextDistrict);
    setWard(wards[0] || '');
  };

  // Checkout Error, Price-Change (UC-37 2b), Online Payment Retry (UC-37 6a) & Success State
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [showPriceChangeModal, setShowPriceChangeModal] = useState(false);
  const [priceChangeConfirmed, setPriceChangeConfirmed] = useState(false);
  const [paymentGatewayState, setPaymentGatewayState] = useState<
    'IDLE' | 'AWAITING' | 'FAILED'
  >('IDLE');

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

  // UC-37 2b: Phát hiện sản phẩm thay đổi giá so với lúc thêm vào giỏ
  const priceChangedItems = useMemo(
    () =>
      availableCartItems.filter(
        (item) => item.product && item.addedPrice !== item.product.price
      ),
    [availableCartItems]
  );

  const visibleQuickVouchers = useMemo(
    () => vouchers.filter((v) => !v.isDeleted && v.isActive),
    [vouchers]
  );

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
              {placedOrder.paymentMethod === 'KhiNhanHang'
                ? 'Thanh toán khi nhận hàng (COD)'
                : placedOrder.paymentMethod === 'ChuyenKhoan'
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

  const effectivePaymentMethod: PaymentMethod =
    isCodDisabled && paymentMethod === 'KhiNhanHang' ? 'ChuyenKhoan' : paymentMethod;

  const executePlaceOrder = (overrideMethod?: PaymentMethod) => {
    setCheckoutError(null);
    const res = placeOrder({
      addressId: selectedAddressId,
      paymentMethod: overrideMethod || effectivePaymentMethod,
      voucherCode: appliedVoucherCode,
    });

    if (!res.ok || !res.order) {
      setCheckoutError(res.message);
      setPaymentGatewayState('IDLE');
      return;
    }
    setPaymentGatewayState('IDLE');
    setPlacedOrder(res.order);
  };

  const handleConfirmOrder = () => {
    setCheckoutError(null);
    // UC-37 2b: Yêu cầu xác nhận lại tổng tiền nếu giá sản phẩm đã thay đổi
    if (priceChangedItems.length > 0 && !priceChangeConfirmed) {
      setShowPriceChangeModal(true);
      return;
    }
    // UC-37 6a: Mở bước xác nhận cổng thanh toán trực tuyến (hỗ trợ thử lại / chuyển COD khi lỗi)
    if (effectivePaymentMethod !== 'KhiNhanHang') {
      setPaymentGatewayState('AWAITING');
      return;
    }
    executePlaceOrder();
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

      {priceChangedItems.length > 0 && !priceChangeConfirmed && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Có <strong>{priceChangedItems.length} sản phẩm</strong> vừa cập nhật giá bán kể từ lúc bạn thêm vào giỏ. Vui lòng kiểm tra lại tổng thanh toán trước khi đặt hàng.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowPriceChangeModal(true)}
            className="px-3 py-1 rounded-full bg-amber-600 text-white font-semibold shrink-0 hover:bg-amber-700"
          >
            Xem chi tiết
          </button>
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
                    maxLength={100}
                    placeholder="Họ tên người nhận *"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Số điện thoại *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                  <select
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  >
                    {VN_LOCATIONS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                        {!d.inDeliveryZone ? ' (Ngoài vùng giao)' : ''}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  >
                    {availableWards.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    maxLength={300}
                    placeholder="Số nhà, tên đường *"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400"
                  />
                </div>
                {!isAddressInDeliveryZone(province, district) && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/70 px-3 py-1.5 rounded-lg">
                    Lưu ý: Khu vực này hiện nằm ngoài vùng giao hàng hỗ trợ của HCShop.
                  </p>
                )}
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

            {userAddresses.length === 0 && !showAddAddress ? (
              <div className="p-5 rounded-xl bg-[#f8f9fa] border border-dashed border-zinc-300 text-center space-y-2.5">
                <p className="text-xs font-medium text-zinc-700">
                  Bạn chưa có địa chỉ nhận hàng nào.
                </p>
                <p className="text-[11px] text-zinc-500">
                  Vui lòng thêm địa chỉ giao hàng để tiếp tục hoàn tất đơn hàng (UC-34).
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm địa chỉ mới</span>
                </button>
              </div>
            ) : (
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
                      {!isAddressInDeliveryZone(addr.province, addr.district) && (
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
            )}
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
                maxLength={50}
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
                {visibleQuickVouchers.map((v) => {
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
                        {Math.max(0, v.usageLimit - v.usedCount)} lượt
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
                onClick={() => !isCodDisabled && setPaymentMethod('KhiNhanHang')}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isCodDisabled
                    ? 'border-zinc-200/50 bg-zinc-50 opacity-60 cursor-not-allowed'
                    : paymentMethod === 'KhiNhanHang'
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
                    paymentMethod === 'KhiNhanHang' && !isCodDisabled
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300'
                  }`}
                >
                  {paymentMethod === 'KhiNhanHang' && !isCodDisabled && (
                    <Check className="w-2.5 h-2.5" />
                  )}
                </div>
              </div>

              {/* Option 2: Bank Transfer */}
              <div
                onClick={() => setPaymentMethod('ChuyenKhoan')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors space-y-2 ${
                  paymentMethod === 'ChuyenKhoan'
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
                      paymentMethod === 'ChuyenKhoan'
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-300'
                    }`}
                  >
                    {paymentMethod === 'ChuyenKhoan' && (
                      <Check className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>

                {paymentMethod === 'ChuyenKhoan' && (
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
                onClick={() => setPaymentMethod('ViDienTu')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                  paymentMethod === 'ViDienTu'
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
                    paymentMethod === 'ViDienTu'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300'
                  }`}
                >
                  {paymentMethod === 'ViDienTu' && <Check className="w-2.5 h-2.5" />}
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
              const priceChanged = item.addedPrice !== p.price;
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
                      <p className="text-zinc-400">
                        SL: {item.quantity}
                        {priceChanged && (
                          <span className="ml-1.5 text-amber-600 font-medium">
                            (Giá đổi từ {formatVND(item.addedPrice)})
                          </span>
                        )}
                      </p>
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
            disabled={
              selectedAddressObj
                ? !isAddressInDeliveryZone(
                    selectedAddressObj.province,
                    selectedAddressObj.district
                  )
                : false
            }
            onClick={handleConfirmOrder}
            className={`w-full h-10 rounded-full text-xs font-semibold transition-colors ${
              selectedAddressObj &&
              !isAddressInDeliveryZone(
                selectedAddressObj.province,
                selectedAddressObj.district
              )
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            Xác nhận đặt hàng
          </button>
        </div>
      </div>

      {/* UC-37 2b: Modal xác nhận thay đổi giá sản phẩm */}
      {showPriceChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Giá sản phẩm vừa thay đổi
              </h3>
              <button
                type="button"
                onClick={() => setShowPriceChangeModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Một số sản phẩm trong giỏ đã được cập nhật giá mới. Vui lòng xác nhận lại tổng tiền <strong>{formatVND(totalAmount)}</strong> trước khi tiếp tục đặt hàng:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {priceChangedItems.map((item) => (
                <div
                  key={item.productId}
                  className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs flex items-center justify-between gap-2"
                >
                  <span className="font-semibold text-zinc-900 truncate">
                    {item.product?.name}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="line-through text-zinc-400 mr-1.5">
                      {formatVND(item.addedPrice)}
                    </span>
                    <span className="font-bold text-amber-800">
                      {formatVND(item.product?.price || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPriceChangeModal(false)}
                className="h-9 px-4 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Xem lại giỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriceChangeConfirmed(true);
                  setShowPriceChangeModal(false);
                  if (effectivePaymentMethod !== 'KhiNhanHang') {
                    setPaymentGatewayState('AWAITING');
                  } else {
                    executePlaceOrder();
                  }
                }}
                className="h-9 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
              >
                Đồng ý giá mới &amp; Đặt hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-37 6a: Modal cổng thanh toán trực tuyến + luồng thất bại / thử lại / đổi COD */}
      {paymentGatewayState !== 'IDLE' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {paymentGatewayState === 'FAILED'
                  ? 'Thanh toán trực tuyến thất bại'
                  : effectivePaymentMethod === 'ChuyenKhoan'
                  ? 'Xác nhận chuyển khoản VietQR'
                  : 'Xác nhận thanh toán Ví điện tử'}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentGatewayState('IDLE')}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentGatewayState === 'AWAITING' ? (
              <>
                <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/70 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Số tiền cần thanh toán</span>
                    <span className="text-base font-bold text-zinc-900">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Phương thức</span>
                    <span className="font-semibold text-zinc-800">
                      {effectivePaymentMethod === 'ChuyenKhoan'
                        ? 'Vietcombank · 0011009988776'
                        : 'Ví điện tử (MoMo / VNPay)'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => executePlaceOrder()}
                    className="w-full h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
                  >
                    Xác nhận đã thanh toán thành công
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentGatewayState('FAILED')}
                    className="w-full h-9 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium"
                  >
                    Giả lập lỗi cổng thanh toán (UC-37 6a)
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Giao dịch không thành công</p>
                    <p className="mt-0.5 text-rose-700">
                      Cổng thanh toán từ chối hoặc hết thời gian chờ. Giỏ hàng và tồn kho của bạn vẫn được giữ nguyên (chưa tạo đơn).
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentGatewayState('AWAITING')}
                    className="w-full h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
                  >
                    Thử thanh toán lại
                  </button>
                  {!isCodDisabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('KhiNhanHang');
                        executePlaceOrder('KhiNhanHang');
                      }}
                      className="w-full h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold"
                    >
                      Chuyển sang Thanh toán khi nhận hàng (COD)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentGatewayState('IDLE')}
                    className="w-full h-8 text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Chọn phương thức khác
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
