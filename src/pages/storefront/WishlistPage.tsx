import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, ArrowLeft, Trash2, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatVND } from '../../utils/formatters';

export const WishlistPage: React.FC = () => {
  const {
    products,
    categories,
    wishlistProductIds,
    toggleWishlist,
    addToCart,
  } = useApp();

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const wishlistProducts = products.filter((p) =>
    wishlistProductIds.includes(p.id)
  );

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name ?? 'Danh mục';

  const handleMoveAllToCart = () => {
    let addedCount = 0;
    wishlistProducts.forEach((p) => {
      if (p.isVisible && !p.isDeleted && p.stock > 0) {
        addToCart(p.id, 1);
        addedCount += 1;
      }
    });
    if (addedCount > 0) {
      setBannerMessage(`Đã thêm ${addedCount} sản phẩm sẵn hàng vào giỏ hàng!`);
    } else {
      setBannerMessage('Không có sản phẩm nào đủ điều kiện thêm vào giỏ.');
    }
    setTimeout(() => setBannerMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại cửa hàng
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Danh sách yêu thích ({wishlistProducts.length})
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Lưu trữ các sản phẩm bạn quan tâm để mua sắm nhanh chóng
          </p>
        </div>

        {wishlistProducts.length > 0 && (
          <button
            type="button"
            onClick={handleMoveAllToCart}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Thêm tất cả vào giỏ
          </button>
        )}
      </div>

      {bannerMessage && (
        <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-4 py-3 rounded-2xl text-[13px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {wishlistProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200/70 p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">
            Danh sách yêu thích đang trống
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1 mb-6">
            Nhấn vào biểu tượng trái tim trên sản phẩm bất kỳ để lưu vào danh sách yêu thích của bạn.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 transition-colors"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlistProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isUnavailable = !product.isVisible || product.isDeleted;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-[22px] border border-zinc-200/70 p-3 flex flex-col transition-all duration-200 hover:border-zinc-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
              >
                {/* Top visual box */}
                <div className="relative aspect-[4/3] rounded-[16px] bg-[#f1f5f9] overflow-hidden mb-3">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </Link>

                  {/* Remove from wishlist button */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label="Xóa khỏi yêu thích"
                    title="Bỏ yêu thích"
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center border border-zinc-200/60 shadow-sm text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {(isOutOfStock || isUnavailable) && (
                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-900/80 text-white">
                      {isUnavailable ? 'Ngừng kinh doanh' : 'Hết hàng'}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="px-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>{getCategoryName(product.categoryId)}</span>
                      <span>Tồn: {product.stock}</span>
                    </div>

                    <Link
                      to={`/product/${product.id}`}
                      className="block text-[14px] font-bold text-zinc-900 hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>

                    <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-3.5 mt-2 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-bold text-zinc-900 leading-tight">
                        {formatVND(product.price)}
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-[11px] text-zinc-400 line-through mt-0.5">
                          {formatVND(product.originalPrice)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock || isUnavailable}
                      onClick={() => {
                        const res = addToCart(product.id, 1);
                        setBannerMessage(res.message);
                        setTimeout(() => setBannerMessage(null), 2500);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                        isOutOfStock || isUnavailable
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : 'bg-[#f4f4f5] hover:bg-zinc-900 hover:text-white text-zinc-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Hết hàng' : 'Thêm'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
