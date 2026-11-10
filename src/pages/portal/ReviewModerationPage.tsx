import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Review } from '../../types/domain';
import { formatDateTime } from '../../utils/formatters';

const QUICK_REPLIES = [
  'Cảm ơn bạn đã tin tưởng lựa chọn sản phẩm tại HCShop! Rất mong tiếp tục được phục vụ bạn.',
  'Cảm ơn đánh giá chi tiết của bạn. Đội ngũ HCShop đã ghi nhận góp ý để nâng cấp chất lượng dịch vụ.',
  'HCShop rất tiếc về trải nghiệm chưa trọn vẹn của bạn. Bộ phận CSKH sẽ liên hệ hỗ trợ bảo hành ngay hôm nay.',
];

export const ReviewModerationPage: React.FC = () => {
  const {
    currentUser,
    reviews,
    products,
    replyToReview,
    adminDeleteReview,
  } = useApp();

  const [replyFilter, setReplyFilter] = useState<'ALL' | 'UNANSWERED' | 'ANSWERED'>('ALL');
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Admin delete modal
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deleteReason, setDeleteReason] = useState('Ngôn từ không phù hợp / Spam quảng cáo');

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (replyFilter === 'UNANSWERED' && r.storeReply) return false;
      if (replyFilter === 'ANSWERED' && !r.storeReply) return false;
      if (starFilter !== 'ALL' && r.rating !== starFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const prd = products.find((p) => p.id === r.productId);
        return (
          r.userName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          Boolean(prd?.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [reviews, replyFilter, starFilter, searchQuery, products]);

  const activeReview = useMemo(() => {
    if (selectedReviewId) {
      const found = reviews.find((r) => r.id === selectedReviewId);
      if (found) return found;
    }
    return filteredReviews[0] || null;
  }, [reviews, filteredReviews, selectedReviewId]);

  useEffect(() => {
    if (activeReview) {
      setReplyDraft(activeReview.storeReply || '');
    } else {
      setReplyDraft('');
    }
  }, [activeReview]);

  const getProduct = (productId: string) =>
    products.find((p) => p.id === productId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview) return;
    const res = replyToReview(activeReview.id, replyDraft);
    setFeedback({ ok: res.ok, text: res.message });
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingReview) return;
    const res = adminDeleteReview(deletingReview.id, deleteReason);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setDeletingReview(null);
    }
  };

  const unansweredCount = reviews.filter((r) => !r.storeReply).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Đánh giá khách hàng
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tiếp nhận ý kiến, phản hồi khách hàng và kiểm duyệt nội dung nhận xét
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-white border border-zinc-200/80 text-zinc-700 font-medium">
            Tổng: <strong>{reviews.length}</strong> đánh giá
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 font-semibold">
            Chưa phản hồi: {unansweredCount}
          </span>
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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full">
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'UNANSWERED', label: `Chưa phản hồi (${unansweredCount})` },
              {
                id: 'ANSWERED',
                label: `Đã phản hồi (${reviews.length - unansweredCount})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReplyFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                replyFilter === tab.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
          <select
            value={starFilter}
            onChange={(e) =>
              setStarFilter(
                e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
              )
            }
            className="h-9 px-3 rounded-full bg-[#f4f4f5] text-xs font-medium text-zinc-700 focus:outline-none"
          >
            <option value="ALL">Mọi mức sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên KH, sản phẩm, nội dung..."
              className="w-full h-9 pl-9 pr-3.5 rounded-full bg-[#f4f4f5] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* Inbox Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Feed */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/80 divide-y divide-zinc-100 overflow-hidden">
          {filteredReviews.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-400">
              Không có đánh giá nào khớp bộ lọc.
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const prd = getProduct(rev.productId);
              const isSelected = activeReview?.id === rev.id;

              return (
                <button
                  key={rev.id}
                  type="button"
                  onClick={() => setSelectedReviewId(rev.id)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-[#f1f5f9]/90' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-200 via-blue-400 to-indigo-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-900 truncate">
                        {rev.userName}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {!rev.storeReply && (
                          <span
                            title="Chưa phản hồi"
                            className="w-2 h-2 rounded-full bg-blue-500"
                          />
                        )}
                        <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-0.5">
                          {rev.rating}
                          <Star className="w-3 h-3 fill-current" />
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-medium text-zinc-500 truncate">
                      {prd?.name || rev.productId}
                    </div>

                    <p className="text-xs text-zinc-600 line-clamp-2">
                      {rev.comment}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Detail & Reply Box */}
        <div className="lg:col-span-7">
          {!activeReview ? (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center text-xs text-zinc-400">
              Chọn một đánh giá bên trái để xem chi tiết và phản hồi.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6">
              {/* Top Customer & Product Info */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-200 via-blue-400 to-indigo-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-900">
                        {activeReview.userName}
                      </h2>
                      {activeReview.isEdited && (
                        <span className="text-[11px] text-zinc-400">
                          (đã chỉnh sửa)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {formatDateTime(activeReview.createdAt)}
                    </div>
                  </div>
                </div>

                {currentUser?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setDeletingReview(activeReview)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Gỡ đánh giá</span>
                  </button>
                )}
              </div>

              {/* Product Context */}
              {(() => {
                const prd = getProduct(activeReview.productId);
                return prd ? (
                  <div className="p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={prd.imageUrl}
                        alt={prd.name}
                        className="w-10 h-10 rounded-lg object-cover bg-white border border-zinc-200/60"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">
                          {prd.name}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {prd.code}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < activeReview.rating
                              ? 'fill-current text-amber-400'
                              : 'text-zinc-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Customer Comment Content */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Nội dung nhận xét
                </div>
                <p className="text-sm text-zinc-800 leading-relaxed bg-[#f8f9fa] p-4 rounded-2xl border border-zinc-200/60">
                  {activeReview.comment}
                </p>
              </div>

              {/* Store Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Phản hồi từ cửa hàng</span>
                  </label>
                  {activeReview.storeReplyAt && (
                    <span className="text-[11px] text-zinc-400">
                      Cập nhật: {formatDateTime(activeReview.storeReplyAt)}
                    </span>
                  )}
                </div>

                {/* Quick Reply Templates */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyDraft(tpl)}
                      className="px-2.5 py-1 rounded-full bg-[#f4f4f5] hover:bg-zinc-200/80 text-[11px] text-zinc-600 transition-colors"
                    >
                      Mẫu phản hồi #{idx + 1}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Nhập nội dung phản hồi tới khách hàng..."
                  className="w-full p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {activeReview.storeReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Admin Delete Review Modal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmDelete}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Gỡ bỏ đánh giá vi phạm
              </h3>
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Bạn đang gỡ bỏ đánh giá của <strong>{deletingReview.userName}</strong>. Vui lòng ghi nhận lý do kiểm duyệt:
            </p>

            <input
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Xác nhận gỡ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
