import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PaginationBar } from '../../components/common/PaginationBar';
import { DiscountType, Voucher } from '../../types/domain';
import { formatVND, formatDate } from '../../utils/formatters';

export const VoucherManagementPage: React.FC = () => {
  const {
    vouchers,
    createVoucher,
    updateVoucher,
    toggleVoucherActive,
    deleteVoucher,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE' | 'TOGGLE';
    voucher: Voucher;
  } | null>(null);

  const pageSize = 6;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PhanTram');
  const [discountValue, setDiscountValue] = useState('10');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('200000');
  const [minOrderValue, setMinOrderValue] = useState('500000');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2027-12-31');
  const [usageLimit, setUsageLimit] = useState('100');
  const [isActiveOnCreate, setIsActiveOnCreate] = useState(true);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (statusFilter === 'ACTIVE' && !v.isActive) return false;
      if (statusFilter === 'INACTIVE' && v.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          v.code.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vouchers, statusFilter, searchQuery]);

  const paginatedVouchers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVouchers.slice(start, start + pageSize);
  }, [filteredVouchers, currentPage]);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setCode('HCSHOP20');
    setDescription('');
    setDiscountType('PhanTram');
    setDiscountValue('20');
    setMaxDiscountAmount('300000');
    setMinOrderValue('1000000');
    setStartDate('2026-01-01');
    setEndDate('2027-12-31');
    setUsageLimit('50');
    setIsActiveOnCreate(true);
    setShowModal(true);
  };

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v);
    setCode(v.code);
    setDescription(v.description);
    setDiscountType(v.discountType);
    setDiscountValue(String(v.discountValue));
    setMaxDiscountAmount(v.maxDiscountAmount ? String(v.maxDiscountAmount) : '');
    setMinOrderValue(String(v.minOrderValue));
    setStartDate(v.startDate.slice(0, 10));
    setEndDate(v.endDate.slice(0, 10));
    setUsageLimit(String(v.usageLimit));
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      description,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      minOrderValue: Number(minOrderValue),
      startDate,
      endDate,
      usageLimit: Number(usageLimit),
      ...(editingVoucher ? {} : { isActive: isActiveOnCreate }),
    };

    const res = editingVoucher
      ? updateVoucher(editingVoucher.id, payload)
      : createVoucher(payload);

    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Chương trình Khuyến mãi
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Thiết lập mã giảm giá, cấu hình hạn mức áp dụng và theo dõi lượt sử dụng thực tế
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã giảm giá</span>
        </button>
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

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full">
          {(
            [
              { id: 'ALL', label: `Tất cả (${vouchers.length})` },
              {
                id: 'ACTIVE',
                label: `Đang bật (${vouchers.filter((v) => v.isActive).length})`,
              },
              {
                id: 'INACTIVE',
                label: `Ngừng áp dụng (${vouchers.filter((v) => !v.isActive).length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã code hoặc mô tả..."
            className="w-full h-9 pl-9 pr-3.5 rounded-full bg-[#f4f4f5] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
          />
        </div>
      </div>

      {/* Voucher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedVouchers.map((voucher) => {
          const remaining = Math.max(0, voucher.usageLimit - voucher.usedCount);
          const usagePercent = Math.min(
            100,
            Math.round((voucher.usedCount / voucher.usageLimit) * 100)
          );

          return (
            <div
              key={voucher.id}
              className="bg-white rounded-2xl border border-zinc-200/80 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-mono font-bold">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    {voucher.code}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      !voucher.isActive
                        ? 'bg-zinc-100 text-zinc-500'
                        : remaining === 0
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {!voucher.isActive
                      ? 'Ngừng áp dụng'
                      : remaining === 0
                      ? 'Hết lượt'
                      : 'Đang hoạt động'}
                  </span>
                </div>

                <div>
                  <div className="text-base font-bold text-zinc-900">
                    {voucher.discountType === 'PhanTram'
                      ? `Giảm ${voucher.discountValue}%`
                      : `Giảm ${formatVND(voucher.discountValue)}`}
                    {voucher.discountType === 'PhanTram' &&
                      voucher.maxDiscountAmount && (
                        <span className="text-xs font-normal text-zinc-500 ml-1.5">
                          (Tối đa {formatVND(voucher.maxDiscountAmount)})
                        </span>
                      )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {voucher.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                  <div>
                    Đơn tối thiểu:{' '}
                    <span className="font-semibold text-zinc-900">
                      {formatVND(voucher.minOrderValue)}
                    </span>
                  </div>
                  <div className="text-right">
                    Đã dùng:{' '}
                    <span className="font-semibold text-zinc-900">
                      {voucher.usedCount}/{voucher.usageLimit}
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 rounded-full"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {formatDate(voucher.startDate)} → {formatDate(voucher.endDate)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({ type: 'TOGGLE', voucher })
                    }
                    title={voucher.isActive ? 'Tạm ngừng áp dụng' : 'Kích hoạt lại'}
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(voucher)}
                    title="Chỉnh sửa"
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({ type: 'DELETE', voucher })
                    }
                    title="Xóa mã giảm giá"
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalItems={filteredVouchers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Create / Edit Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {editingVoucher ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingVoucher && editingVoucher.usedCount > 0 && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 p-2.5 rounded-xl">
                Mã này đã được áp dụng cho {editingVoucher.usedCount} đơn hàng. Mã code, loại giảm giá, mức giảm, giảm tối đa và đơn tối thiểu được cố định để bảo toàn dữ liệu đối soát.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mã giảm giá *
                </label>
                <input
                  type="text"
                  disabled={Boolean(editingVoucher && editingVoucher.usedCount > 0)}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: WELCOME10"
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Loại giảm giá *
                </label>
                <select
                  disabled={Boolean(editingVoucher && editingVoucher.usedCount > 0)}
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs disabled:opacity-60"
                >
                  <option value="PhanTram">Theo phần trăm (%)</option>
                  <option value="SoTien">Số tiền cố định (VNĐ)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {discountType === 'PhanTram' ? 'Mức giảm (%) *' : 'Số tiền giảm *'}
                </label>
                <input
                  type="number"
                  disabled={Boolean(editingVoucher && editingVoucher.usedCount > 0)}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs disabled:opacity-60"
                />
              </div>

              {discountType === 'PhanTram' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    disabled={Boolean(editingVoucher && editingVoucher.usedCount > 0)}
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs disabled:opacity-60"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Đơn tối thiểu (VNĐ) *
                </label>
                <input
                  type="number"
                  disabled={Boolean(editingVoucher && editingVoucher.usedCount > 0)}
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tổng lượt dùng *
                </label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Mô tả ưu đãi (tùy chọn)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Áp dụng cho khách hàng mới..."
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            {!editingVoucher && (
              <label className="flex items-center gap-2 text-xs text-zinc-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActiveOnCreate}
                  onChange={(e) => setIsActiveOnCreate(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <span>Kích hoạt ngay sau khi tạo</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
              >
                Lưu khuyến mãi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete / Toggle Modal */}
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'DELETE'
            ? `Xóa mã giảm giá ${confirmAction.voucher.code}?`
            : confirmAction?.voucher.isActive
            ? `Tạm ngừng áp dụng mã ${confirmAction.voucher.code}?`
            : `Kích hoạt lại mã ${confirmAction?.voucher.code}?`
        }
        description={
          confirmAction?.type === 'DELETE'
            ? `Bạn có chắc chắn muốn xóa mã giảm giá "${confirmAction.voucher.code}"? Hành động này không thể hoàn tác.`
            : confirmAction?.voucher.isActive
            ? `Khách hàng sẽ không thể áp dụng mã "${confirmAction.voucher.code}" cho các đơn hàng mới sau khi tạm ngừng.`
            : `Mã "${confirmAction?.voucher.code}" sẽ được mở lại để khách hàng sử dụng trong thời hạn hiệu lực.`
        }
        variant={confirmAction?.type === 'DELETE' ? 'danger' : 'warning'}
        confirmLabel={
          confirmAction?.type === 'DELETE'
            ? 'Xóa mã'
            : confirmAction?.voucher.isActive
            ? 'Tạm ngừng'
            : 'Kích hoạt'
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          const res =
            confirmAction.type === 'DELETE'
              ? deleteVoucher(confirmAction.voucher.id)
              : toggleVoucherActive(confirmAction.voucher.id);
          setFeedback({ ok: res.ok, text: res.message });
          setConfirmAction(null);
        }}
      />
    </div>
  );
};
