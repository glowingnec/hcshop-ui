import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  History,
  Boxes,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, StockMovementType } from '../../types/domain';
import { formatVND, formatDateTime } from '../../utils/formatters';

type InventoryTab = 'STOCK_LIST' | 'HISTORY';

const MOVEMENT_META: Record<
  StockMovementType,
  { label: string; badgeClass: string; sign: '+' | '-' }
> = {
  IMPORT: {
    label: 'Nhập kho',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    sign: '+',
  },
  SALE: {
    label: 'Xuất bán',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    sign: '-',
  },
  ADJUST_DECREASE: {
    label: 'Điều chỉnh giảm',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    sign: '-',
  },
  CANCEL_RESTORE: {
    label: 'Hoàn kho đơn hủy',
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    sign: '+',
  },
};

const ADJUST_REASONS = [
  'Phát hiện lỗi ngoại quan / bao bì khi kiểm kê định kỳ',
  'Hư hỏng trong quá trình lưu kho bảo quản',
  'Xuất làm sản phẩm trưng bày tại quầy trải nghiệm',
  'Chênh lệch số liệu kiểm kê thực tế',
  'Lý do khác',
];

export const InventoryManagementPage: React.FC = () => {
  const {
    products,
    stockHistories,
    importStock,
    adjustStockDecrease,
    updateMinStockThreshold,
  } = useApp();

  const [activeTab, setActiveTab] = useState<InventoryTab>('STOCK_LIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | StockMovementType>('ALL');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProductId, setImportProductId] = useState('');
  const [importQty, setImportQty] = useState('10');
  const [importPrice, setImportPrice] = useState('1200000');
  const [importSupplier, setImportSupplier] = useState('Nhà phân phối chính hãng');
  const [importNote, setImportNote] = useState('');

  // Adjust Decrease Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustReasonPreset, setAdjustReasonPreset] = useState(ADJUST_REASONS[0]);
  const [adjustCustomReason, setAdjustCustomReason] = useState('');

  // Threshold Modal State
  const [thresholdProduct, setThresholdProduct] = useState<Product | null>(null);
  const [thresholdValue, setThresholdValue] = useState('5');

  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted),
    [products]
  );

  const stats = useMemo(() => {
    const totalSkus = activeProducts.length;
    const totalUnits = activeProducts.reduce((sum, p) => sum + p.stock, 0);
    const lowStock = activeProducts.filter(
      (p) => p.stock > 0 && p.stock <= p.minStockThreshold
    ).length;
    const outOfStock = activeProducts.filter((p) => p.stock === 0).length;
    return { totalSkus, totalUnits, lowStock, outOfStock };
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      if (onlyLowStock && p.stock > p.minStockThreshold) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeProducts, onlyLowStock, searchQuery]);

  const filteredHistories = useMemo(() => {
    return stockHistories.filter((h) => {
      if (historyTypeFilter !== 'ALL' && h.type !== historyTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const prd = products.find((p) => p.id === h.productId);
        const matchProduct =
          prd?.name.toLowerCase().includes(q) ||
          prd?.code.toLowerCase().includes(q);
        const matchNote = h.reasonOrNote.toLowerCase().includes(q);
        return Boolean(matchProduct || matchNote);
      }
      return true;
    });
  }, [stockHistories, historyTypeFilter, searchQuery, products]);

  const openImportModalFor = (productId?: string) => {
    const targetId = productId || activeProducts[0]?.id || '';
    const target = activeProducts.find((p) => p.id === targetId);
    setImportProductId(targetId);
    setImportQty('15');
    setImportPrice(target ? String(Math.round(target.price * 0.7)) : '1000000');
    setImportSupplier('Nhà phân phối chính hãng');
    setImportNote('Nhập hàng bổ sung định kỳ');
    setShowImportModal(true);
  };

  const openAdjustModalFor = (productId?: string) => {
    const targetId = productId || activeProducts[0]?.id || '';
    setAdjustProductId(targetId);
    setAdjustQty('1');
    setAdjustReasonPreset(ADJUST_REASONS[0]);
    setAdjustCustomReason('');
    setShowAdjustModal(true);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = importStock({
      productId: importProductId,
      quantity: Number(importQty),
      importPrice: Number(importPrice),
      supplier: importSupplier,
      note: importNote,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setShowImportModal(false);
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      adjustReasonPreset === 'Lý do khác'
        ? adjustCustomReason.trim()
        : adjustReasonPreset;
    const res = adjustStockDecrease({
      productId: adjustProductId,
      quantityToSubtract: Number(adjustQty),
      reason: finalReason,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setShowAdjustModal(false);
    }
  };

  const handleThresholdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdProduct) return;
    const res = updateMinStockThreshold(
      thresholdProduct.id,
      Number(thresholdValue)
    );
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setThresholdProduct(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Quản lý kho hàng
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Theo dõi tồn kho thực tế, lập phiếu nhập/xuất điều chỉnh và tra cứu sổ cái biến động
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAdjustModalFor()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 hover:border-zinc-900 text-zinc-800 text-xs font-semibold transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            <span>Điều chỉnh giảm</span>
          </button>

          <button
            type="button"
            onClick={() => openImportModalFor()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lập phiếu nhập kho</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Tổng mã hàng (SKU)</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1.5">{stats.totalSkus}</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Tổng lượng tồn kho</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1.5">
            {stats.totalUnits}{' '}
            <span className="text-xs font-normal text-zinc-400">đơn vị</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Sắp chạm ngưỡng</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-amber-600">
              {stats.lowStock}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              Cần nhập thêm
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Đã hết hàng</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-rose-600">
              {stats.outOfStock}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
              Tồn = 0
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

      {/* Mode Tabs & Filter Controls */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full">
          <button
            type="button"
            onClick={() => setActiveTab('STOCK_LIST')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'STOCK_LIST'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Tồn kho hiện tại ({activeProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sổ cái biến động ({stockHistories.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
          {activeTab === 'STOCK_LIST' ? (
            <button
              type="button"
              onClick={() => setOnlyLowStock((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                onlyLowStock
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-[#f4f4f5] border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Chỉ hiện cảnh báo sắp hết</span>
            </button>
          ) : (
            <select
              value={historyTypeFilter}
              onChange={(e) =>
                setHistoryTypeFilter(e.target.value as 'ALL' | StockMovementType)
              }
              className="h-9 px-3 rounded-full bg-[#f4f4f5] text-xs font-medium text-zinc-700 focus:outline-none"
            >
              <option value="ALL">Tất cả loại biến động</option>
              <option value="IMPORT">Nhập kho (+)</option>
              <option value="SALE">Xuất bán đơn hàng (-)</option>
              <option value="ADJUST_DECREASE">Điều chỉnh giảm (-)</option>
              <option value="CANCEL_RESTORE">Hoàn kho đơn hủy (+)</option>
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên SP, mã SKU hoặc lý do..."
              className="w-full h-9 pl-9 pr-3.5 rounded-full bg-[#f4f4f5] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: STOCK LIST */}
      {activeTab === 'STOCK_LIST' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-[#f8f9fa]/60">
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Tồn thực tế</th>
                  <th className="py-3 px-4">Ngưỡng tối thiểu</th>
                  <th className="py-3 px-4">Trạng thái tồn</th>
                  <th className="py-3 px-4 text-right">Thao tác kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredProducts.map((product) => {
                  const isOut = product.stock === 0;
                  const isLow =
                    !isOut && product.stock <= product.minStockThreshold;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover bg-zinc-100 border border-zinc-200/60 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-zinc-900">
                              {product.name}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400">
                              {product.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-zinc-900">
                          {product.stock}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setThresholdProduct(product);
                            setThresholdValue(String(product.minStockThreshold));
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f4f5] hover:bg-zinc-200/80 text-zinc-700 font-medium"
                        >
                          <span>≤ {product.minStockThreshold}</span>
                          <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            Hết hàng
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            Sắp hết hàng
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            An toàn
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openImportModalFor(product.id)}
                            className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold"
                          >
                            + Nhập kho
                          </button>
                          <button
                            type="button"
                            disabled={product.stock === 0}
                            onClick={() => openAdjustModalFor(product.id)}
                            className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-700 text-[11px] font-medium"
                          >
                            - Xuất giảm
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENT LEDGER */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-[#f8f9fa]/60">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Loại giao dịch</th>
                  <th className="py-3 px-4">Biến động tồn</th>
                  <th className="py-3 px-4">Chi tiết / Lý do</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredHistories.map((h) => {
                  const prd = products.find((p) => p.id === h.productId);
                  const meta = MOVEMENT_META[h.type];
                  const isPositive = h.quantityChange > 0;

                  return (
                    <tr key={h.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {formatDateTime(h.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">
                          {prd?.name || h.productId}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {prd?.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-zinc-400">{h.stockBefore}</span>
                        <span className="mx-1.5 text-zinc-300">→</span>
                        <span
                          className={`font-bold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${h.quantityChange}` : h.quantityChange}
                        </span>
                        <span className="mx-1.5 text-zinc-300">=</span>
                        <span className="font-bold text-zinc-900">
                          {h.stockAfter}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        <div>{h.reasonOrNote}</div>
                        {h.supplier && (
                          <div className="text-[11px] text-zinc-400">
                            NCC: {h.supplier}
                            {h.importPrice
                              ? ` · Giá nhập: ${formatVND(h.importPrice)}`
                              : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 font-medium">
                        {h.actorName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Stock-In Receipt */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleImportSubmit}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Lập phiếu nhập kho
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Sản phẩm nhập kho *
              </label>
              <select
                value={importProductId}
                onChange={(e) => setImportProductId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              >
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} (Tồn hiện tại: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Số lượng nhập *
                </label>
                <input
                  type="number"
                  min={1}
                  value={importQty}
                  onChange={(e) => setImportQty(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Đơn giá nhập (VNĐ) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={importPrice}
                  onChange={(e) => setImportPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Nhà cung cấp *
              </label>
              <input
                type="text"
                value={importSupplier}
                onChange={(e) => setImportSupplier(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Ghi chú phiếu nhập
              </label>
              <input
                type="text"
                value={importNote}
                onChange={(e) => setImportNote(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
              >
                Xác nhận nhập kho
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Stock-Out Adjustment */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Điều chỉnh giảm tồn kho
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Chọn sản phẩm *
              </label>
              <select
                value={adjustProductId}
                onChange={(e) => setAdjustProductId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              >
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} (Tồn hiện tại: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Số lượng xuất giảm *
              </label>
              <input
                type="number"
                min={1}
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700">
                Lý do điều chỉnh giảm *
              </label>
              <select
                value={adjustReasonPreset}
                onChange={(e) => setAdjustReasonPreset(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              >
                {ADJUST_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {adjustReasonPreset === 'Lý do khác' && (
                <textarea
                  rows={2}
                  value={adjustCustomReason}
                  onChange={(e) => setAdjustCustomReason(e.target.value)}
                  placeholder="Nhập lý do điều chỉnh cụ thể..."
                  className="w-full p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
              >
                Lưu điều chỉnh
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Min Threshold Config */}
      {thresholdProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleThresholdSubmit}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-sm w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Ngưỡng cảnh báo tồn kho
              </h3>
              <button
                type="button"
                onClick={() => setThresholdProduct(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Thiết lập định mức cảnh báo cho <strong>{thresholdProduct.name}</strong>. Khi tồn thực tế nhỏ hơn hoặc bằng mức này, hệ thống sẽ bật cảnh báo nhập hàng.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Số lượng tối thiểu
              </label>
              <input
                type="number"
                min={0}
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setThresholdProduct(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
              >
                Lưu cấu hình
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
