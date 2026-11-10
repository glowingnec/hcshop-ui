import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatVND } from '../../utils/formatters';

export const CartPage: React.FC = () => {
  const {
    currentUser,
    cart,
    products,
    categories,
    updateCartQuantity,
    removeFromCart,
  } = useApp();
  const navigate = useNavigate();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  // UC-29 1a: Chưa đăng nhập
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-zinc-200/70 p-8 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-zinc-900">
            Đăng nhập để xem giỏ hàng
          </h2>
          <p className="text-xs text-zinc-500">
            Vui lòng chọn tài khoản Khách hàng hoặc đăng nhập để quản lý giỏ hàng của bạn.
          </p>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="h-9 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white transition-colors"
        >
          Đến trang đăng nhập
        </button>
      </div>
    );
  }

  // Enrich cart items with product details
  const detailedCart = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const isAvailable = Boolean(
      product && product.isVisible && !product.isDeleted && product.stock > 0
    );
    const priceChanged = Boolean(product && product.price !== item.addedPrice);
    return {
      ...item,
      product,
      isAvailable,
      priceChanged,
    };
  });

  const availableItems = detailedCart.filter((i) => i.isAvailable && i.product);
  const subtotal = availableItems.reduce(
    (sum, i) => sum + (i.product?.price || 0) * i.quantity,
    0
  );
  const totalQuantity = availableItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleStepQuantity = (productId: string, nextQty: number) => {
    if (nextQty === 0) {
      // UC-31 2b: Số lượng bằng 0 -> Hỏi xác nhận xóa (UC-32)
      setConfirmRemoveId(productId);
      return;
    }
    const res = updateCartQuantity(productId, nextQty);
    if (!res.ok || res.message.includes('vượt tồn kho')) {
      showToast(res.message);
    }
  };

  const handleConfirmRemove = (productId: string) => {
    const res = removeFromCart(productId);
    setConfirmRemoveId(null);
    showToast(res.message);
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight leading-tight">
            Giỏ hàng
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {cart.length > 0
              ? `Bạn đang có ${cart.length} dòng sản phẩm trong giỏ`
              : 'Giỏ hàng của bạn đang trống'}
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tiếp tục mua sắm</span>
        </button>
      </div>

      {/* UC-29 3a: Giỏ hàng trống */}
      {detailedCart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">Giỏ hàng trống</p>
          <p className="text-xs text-zinc-500">
            Hãy khám phá danh mục sản phẩm và thêm mặt hàng yêu thích vào giỏ.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="h-9 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white transition-colors"
            >
              Khám phá sản phẩm
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Cart Items List */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200/70 divide-y divide-zinc-100 overflow-hidden">
            {detailedCart.map((item) => {
              const p = item.product;
              const category = categories.find((c) => c.id === p?.categoryId);
              const lineTotal = (p?.price || item.addedPrice) * item.quantity;

              return (
                <div
                  key={item.productId}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    !item.isAvailable ? 'bg-zinc-50/70 opacity-75' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      onClick={() => p && navigate(`/product/${p.id}`)}
                      className="w-20 h-16 rounded-xl bg-[#f1f5f9] overflow-hidden shrink-0 cursor-pointer border border-zinc-100"
                    >
                      {p && (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span>{category?.name || 'Danh mục'}</span>
                        <span>·</span>
                        <span>{p ? `Tồn: ${p.stock}` : 'Không tồn tại'}</span>
                      </div>

                      <h3
                        onClick={() => p && navigate(`/product/${p.id}`)}
                        className="text-sm font-bold text-zinc-900 truncate cursor-pointer hover:text-blue-600"
                      >
                        {p?.name || 'Sản phẩm không còn tồn tại'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-zinc-700">
                          {formatVND(p?.price || item.addedPrice)}
                        </span>

                        {/* UC-29 3c: Giá thay đổi từ lúc thêm */}
                        {item.priceChanged && p && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Giá đã cập nhật (lúc thêm: {formatVND(item.addedPrice)})
                          </span>
                        )}

                        {/* UC-29 3b: Sản phẩm hết hàng hoặc bị ẩn */}
                        {!item.isAvailable && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-medium">
                            Không còn khả dụng (đã loại khỏi tổng tiền)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Controls: Quantity Stepper + Line Total + Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    {item.isAvailable && p && (
                      <div className="inline-flex items-center rounded-full border border-zinc-200/80 bg-zinc-50/70 h-8 px-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleStepQuantity(item.productId, item.quantity - 1)
                          }
                          className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:bg-white transition-colors"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={p.stock}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!Number.isNaN(val)) {
                              handleStepQuantity(item.productId, val);
                            }
                          }}
                          className="w-8 text-center bg-transparent text-xs font-semibold text-zinc-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleStepQuantity(item.productId, item.quantity + 1)
                          }
                          className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:bg-white transition-colors"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="text-right min-w-[95px]">
                      <span className="text-sm font-bold text-zinc-900 block">
                        {formatVND(lineTotal)}
                      </span>
                    </div>

                    {/* UC-32: Xác nhận xóa dòng khỏi giỏ */}
                    {confirmRemoveId === item.productId ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleConfirmRemove(item.productId)}
                          className="h-7 px-2.5 rounded-full bg-rose-500 text-white text-[11px] font-medium"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="h-7 px-2 rounded-full bg-zinc-100 text-zinc-600 text-[11px]"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(item.productId)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 4 Cols: Summary Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-5">
            <h2 className="text-sm font-bold text-zinc-900">Tóm tắt đơn hàng</h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span>Số lượng khả dụng</span>
                <span className="font-medium text-zinc-800">
                  {totalQuantity} sản phẩm
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-emerald-600">Miễn phí</span>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-zinc-900">
                  Tổng tạm tính
                </span>
                <span className="text-lg font-bold text-zinc-900">
                  {formatVND(subtotal)}
                </span>
              </div>
            </div>

            <button
              disabled={availableItems.length === 0}
              onClick={() => navigate('/checkout')}
              className={`w-full h-10 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                availableItems.length === 0
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              <span>Tiến hành đặt hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
