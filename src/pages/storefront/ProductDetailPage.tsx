import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Heart,
  MessageSquare,
  Minus,
  Pencil,
  Plus,
  ShoppingBag,
  Star,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatVND } from '../../utils/formatters';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    products,
    categories,
    orders,
    reviews,
    wishlistProductIds,
    addToCart,
    toggleWishlist,
    submitReview,
    deleteReview,
    toggleReviewLike,
  } = useApp();

  const product = products.find((p) => p.id === id && p.isVisible && !p.isDeleted);

  const [quantity, setQuantity] = useState(1);
  const [starFilter, setStarFilter] = useState<number | 'ALL' | 'REPLIED'>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Review Form State (UC-53 & UC-54)
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === id),
    [reviews, id]
  );

  const filteredReviews = useMemo(() => {
    return productReviews.filter((r) => {
      if (starFilter === 'ALL') return true;
      if (starFilter === 'REPLIED') return Boolean(r.storeReply);
      return r.rating === starFilter;
    });
  }, [productReviews, starFilter]);

  const averageRating = useMemo(() => {
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / productReviews.length).toFixed(1));
  }, [productReviews]);

  // Check if currentUser can review or already reviewed (UC-53, UC-54)
  const myExistingReview = useMemo(
    () =>
      currentUser
        ? productReviews.find((r) => r.userId === currentUser.id)
        : undefined,
    [productReviews, currentUser]
  );

  const hasCompletedPurchase = useMemo(() => {
    if (!currentUser || !id) return false;
    return orders.some(
      (o) =>
        o.userId === currentUser.id &&
        o.status === 'COMPLETED' &&
        o.items.some((item) => item.productId === id)
    );
  }, [orders, currentUser, id]);

  // UC-18 2a: Sản phẩm không tồn tại hoặc đang ẩn
  if (!product) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl border border-zinc-200/70 p-10 text-center space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">
          Sản phẩm không khả dụng
        </h2>
        <p className="text-xs text-zinc-500">
          Sản phẩm này không tồn tại hoặc hiện đã ngừng hiển thị.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="h-8 px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-800"
          >
            Quay về danh sách sản phẩm
          </button>
        </div>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const isLiked = wishlistProductIds.includes(product.id);
  const isOutOfStock = product.stock <= 0;
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.isVisible && !p.isDeleted)
    .slice(0, 4);

  const handleOpenReviewForm = () => {
    setReviewError(null);
    if (myExistingReview) {
      setRatingInput(myExistingReview.rating);
      setCommentInput(myExistingReview.comment);
    } else {
      setRatingInput(5);
      setCommentInput('');
    }
    setIsWritingReview(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitReview(product.id, ratingInput, commentInput);
    if (!res.ok) {
      setReviewError(res.message);
      return;
    }
    setIsWritingReview(false);
    showToast(res.message);
  };

  const handleConfirmDelete = (reviewId: string) => {
    const res = deleteReview(reviewId);
    setConfirmDeleteReviewId(null);
    showToast(res.message);
  };

  return (
    <div className="space-y-8">
      {/* Subtle Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Back Link */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Danh sách sản phẩm</span>
      </button>

      {/* Main Product Detail Card (UC-18) */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left 6 Cols: Placeholder Image */}
        <div className="md:col-span-6">
          <div className="relative aspect-[5/4] rounded-2xl bg-[#f1f5f9] overflow-hidden border border-zinc-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => {
                const res = toggleWishlist(product.id);
                showToast(res.message);
              }}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                isLiked
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
              aria-label="Yêu thích"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right 6 Cols: Info & Add to Cart */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{category?.name || 'Danh mục'} · {product.code}</span>
              {isOutOfStock ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium text-[11px]">
                  Hết hàng
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium text-[11px]">
                  Còn hàng ({product.stock})
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {averageRating > 0 ? averageRating : 'Mới'}
                </span>
                <span>·</span>
                <span>{productReviews.length} đánh giá</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2.5 pt-1">
              <span className="text-2xl font-bold text-zinc-900">
                {formatVND(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-zinc-400 line-through">
                  {formatVND(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {product.description}
            </p>

            {/* Specifications Table */}
            {product.specs && (
              <div className="pt-2 border-t border-zinc-100 space-y-2">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{k}</span>
                    <span className="font-medium text-zinc-800">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity Selector & Add to Cart (UC-30) */}
          <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-zinc-200/80 bg-zinc-50/60 h-10 px-1.5">
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-9 text-center text-xs font-semibold text-zinc-900">
                {isOutOfStock ? 0 : quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= product.stock}
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              disabled={isOutOfStock}
              onClick={() => {
                const res = addToCart(product.id, quantity);
                showToast(res.message);
              }}
              className={`flex-1 h-10 px-5 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                isOutOfStock
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Reviews Section (UC-51..56) */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">
                Đánh giá sản phẩm
              </h2>
              <span className="text-xs text-zinc-400">
                ({productReviews.length})
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {averageRating > 0
                ? `Điểm trung bình ${averageRating} / 5.0 sao`
                : 'Chưa có đánh giá nào cho sản phẩm này'}
            </p>
          </div>

          {/* Write or Edit Review Button (UC-53 & UC-54) */}
          {hasCompletedPurchase || myExistingReview ? (
            <button
              onClick={handleOpenReviewForm}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-blue-50 hover:bg-blue-100/80 text-blue-600 text-xs font-medium transition-colors self-start sm:self-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>
                {myExistingReview ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá'}
              </span>
            </button>
          ) : (
            <span className="text-[11px] text-zinc-400">
              Mua và hoàn thành đơn hàng để đánh giá sản phẩm
            </span>
          )}
        </div>

        {/* Filter Pills (UC-52) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL' as const, label: 'Tất cả' },
            { key: 5 as const, label: '5 sao' },
            { key: 4 as const, label: '4 sao' },
            { key: 3 as const, label: '3 sao' },
            { key: 2 as const, label: '2 sao' },
            { key: 1 as const, label: '1 sao' },
            { key: 'REPLIED' as const, label: 'Có phản hồi' },
          ].map((item) => {
            const active = starFilter === item.key;
            return (
              <button
                key={String(item.key)}
                onClick={() => setStarFilter(item.key)}
                className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Inline Write/Edit Review Form (UC-53 & UC-54) */}
        {isWritingReview && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">
                {myExistingReview ? 'Chỉnh sửa đánh giá' : 'Gửi đánh giá mới'}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingInput(star)}
                    className="p-0.5 focus:outline-none"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= ratingInput
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Nhập nhận xét của bạn về sản phẩm..."
              className="w-full rounded-xl bg-white border border-zinc-200/80 p-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
            />

            {reviewError && (
              <p className="text-xs text-rose-500">{reviewError}</p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWritingReview(false)}
                className="h-8 px-3.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu đánh giá</span>
              </button>
            </div>
          </form>
        )}

        {/* Review Items List */}
        {filteredReviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Không có đánh giá phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredReviews.map((rev) => {
              const isOwner = currentUser?.id === rev.userId;
              const canDelete = isOwner || currentUser?.role === 'ADMIN';
              const hasLiked = currentUser
                ? rev.likedByUserIds.includes(currentUser.id)
                : false;

              return (
                <div key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-200 via-indigo-300 to-purple-300 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-900">
                            {rev.userName}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {formatDate(rev.createdAt)}
                          </span>
                          {rev.isEdited && (
                            <span className="text-[10px] text-zinc-400 italic">
                              (đã chỉnh sửa)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-zinc-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Like / Edit / Delete Actions (UC-54, UC-55, UC-56) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const res = toggleReviewLike(rev.id);
                          showToast(res.message);
                        }}
                        className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
                          hasLiked
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Hữu ích ({rev.likedByUserIds.length})</span>
                      </button>

                      {isOwner && (
                        <button
                          onClick={handleOpenReviewForm}
                          className="h-7 px-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200/70 text-[11px] font-medium text-zinc-600"
                        >
                          Sửa
                        </button>
                      )}

                      {canDelete && (
                        <>
                          {confirmDeleteReviewId === rev.id ? (
                            <button
                              onClick={() => handleConfirmDelete(rev.id)}
                              className="h-7 px-2.5 rounded-full bg-rose-500 text-white text-[11px] font-medium"
                            >
                              Xác nhận xóa
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteReviewId(rev.id)}
                              className="h-7 px-2 rounded-full bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 text-zinc-500 transition-colors"
                              aria-label="Xóa đánh giá"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 leading-relaxed pl-9">
                    {rev.comment}
                  </p>

                  {/* Store Reply Box (UC-51 & UC-57) */}
                  {rev.storeReply && (
                    <div className="ml-9 p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-800">
                        <MessageSquare className="w-3 h-3 text-blue-500" />
                        <span>Phản hồi từ HCShop</span>
                        {rev.storeReplyAt && (
                          <span className="font-normal text-zinc-400">
                            · {formatDate(rev.storeReplyAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {rev.storeReply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Related Products Row */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-900">Sản phẩm khác</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {relatedProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setQuantity(1);
                navigate(`/product/${item.id}`);
              }}
              className="bg-white rounded-2xl border border-zinc-200/70 overflow-hidden cursor-pointer hover:border-zinc-300 transition-colors"
            >
              <div className="aspect-[5/4] bg-[#f1f5f9]">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3.5 space-y-1">
                <h3 className="text-xs font-bold text-zinc-900">{item.name}</h3>
                <p className="text-xs font-semibold text-zinc-700">
                  {formatVND(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
