import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownToLine,
  FileText,
  PanelLeft,
  Printer,
  RefreshCw,
  Send,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { OrderStatus } from '../../types/domain';
import {
  formatDate,
  formatDateTime,
  formatVND,
  ORDER_STATUS_META,
} from '../../utils/formatters';

type GranularityKey = 'Ngay' | 'Tuan' | 'Thang' | 'Nam';

const GRANULARITY_LABELS: Record<GranularityKey, string> = {
  Ngay: 'Ngày',
  Tuan: 'Tuần',
  Thang: 'Tháng',
  Nam: 'Năm',
};

function getIsoWeekKey(date: Date): { key: string; label: string } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const yyyy = d.getUTCFullYear();
  const ww = String(weekNo).padStart(2, '0');
  return { key: `${yyyy}-W${ww}`, label: `W${ww}/${String(yyyy).slice(-2)}` };
}

const ALL_STATUSES: OrderStatus[] = [
  'ChoXacNhan',
  'DaXacNhan',
  'DangChuanBi',
  'DangGiao',
  'HoanThanh',
  'DaHuy',
];

function computeDefault30DayRange(orders: { createdAt: string }[]): {
  start: string;
  end: string;
} {
  const nowMs = Date.now();
  const twentyNineDaysMs = 29 * 24 * 60 * 60 * 1000;
  const hasOrderInRecent30Days = orders.some((o) => {
    const t = new Date(o.createdAt).getTime();
    return Number.isFinite(t) && t >= nowMs - twentyNineDaysMs && t <= nowMs;
  });

  let anchorMs = nowMs;
  if (!hasOrderInRecent30Days && orders.length > 0) {
    const latestMs = orders.reduce((max, o) => {
      const t = new Date(o.createdAt).getTime();
      return Number.isFinite(t) && t > max ? t : max;
    }, 0);
    if (latestMs > 0) anchorMs = latestMs;
  }

  return {
    start: new Date(anchorMs - twentyNineDaysMs).toISOString().slice(0, 10),
    end: new Date(anchorMs).toISOString().slice(0, 10),
  };
}

export const ReportsAndAnalyticsPage: React.FC = () => {
  const { currentUser, users, categories, orders, products, stockHistories } = useApp();
  const navigate = useNavigate();

  const initial30Days = useMemo(() => computeDefault30DayRange(orders), []);
  const [granularity, setGranularity] = useState<GranularityKey>('Ngay');
  const [reportStartDate, setReportStartDate] = useState(initial30Days.start);
  const [reportEndDate, setReportEndDate] = useState(initial30Days.end);
  const [bestSellerCategoryId, setBestSellerCategoryId] = useState('ALL');
  const [topN, setTopN] = useState<5 | 10 | 20>(5);
  const [deadStockCategoryId, setDeadStockCategoryId] = useState('ALL');
  const [rightPanelMode, setRightPanelMode] = useState<'BEST_SELLERS' | 'STOCK'>('BEST_SELLERS');
  const [deadStockDays, setDeadStockDays] = useState<30 | 60 | 90>(30);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const dateRangeError =
    reportStartDate && reportEndDate && reportStartDate > reportEndDate
      ? 'Ngày bắt đầu không được lớn hơn ngày kết thúc.'
      : null;

  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted),
    [products]
  );

  // UC-58: SoSanPhamSapHetHang (stock > 0 && stock <= minStockThreshold)
  const lowStockCount = useMemo(
    () =>
      activeProducts.filter(
        (p) => p.stock > 0 && p.stock <= p.minStockThreshold
      ).length,
    [activeProducts]
  );

  const ordersInRange = useMemo(() => {
    if (dateRangeError) return [];
    return orders.filter((o) => {
      const day = o.createdAt.slice(0, 10);
      if (reportStartDate && day < reportStartDate) return false;
      if (reportEndDate && day > reportEndDate) return false;
      return true;
    });
  }, [orders, reportStartDate, reportEndDate, dateRangeError]);

  const newCustomersCount = useMemo(() => {
    const customers = users.filter((u) => u.role === 'KhachHang');
    if (dateRangeError) return 0;
    if (!reportStartDate && !reportEndDate) {
      return customers.length;
    }
    return customers.filter((u) => {
      const day = u.createdAt.slice(0, 10);
      if (reportStartDate && day < reportStartDate) return false;
      if (reportEndDate && day > reportEndDate) return false;
      return true;
    }).length;
  }, [users, reportStartDate, reportEndDate, dateRangeError]);

  const completedOrders = useMemo(
    () => ordersInRange.filter((o) => o.status === 'HoanThanh'),
    [ordersInRange]
  );

  const totalRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [completedOrders]
  );

  const orderStatusBreakdown = useMemo(() => {
    return ALL_STATUSES.map((st) => ({
      status: st,
      meta: ORDER_STATUS_META[st],
      count: ordersInRange.filter((o) => o.status === st).length,
    }));
  }, [ordersInRange]);

  // Best-selling products calculation (UC-60)
  const bestSellers = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        categoryId: string;
        code: string;
        name: string;
        price: number;
        soldQty: number;
        revenue: number;
      }
    >();

    activeProducts
      .filter((p) => bestSellerCategoryId === 'ALL' || p.categoryId === bestSellerCategoryId)
      .forEach((p) => {
        map.set(p.id, {
          productId: p.id,
          categoryId: p.categoryId,
          code: p.code,
          name: p.name,
          price: p.price,
          soldQty: 0,
          revenue: 0,
        });
      });

    ordersInRange
      .filter((o) => o.status !== 'DaHuy')
      .forEach((order) => {
        order.items.forEach((item) => {
          const entry = map.get(item.productId);
          if (entry) {
            entry.soldQty += item.quantity;
            entry.revenue += item.priceAtOrder * item.quantity;
          }
        });
      });

    return Array.from(map.values()).sort((a, b) => b.soldQty - a.soldQty);
  }, [activeProducts, ordersInRange, bestSellerCategoryId]);

  // Slow-moving / Dead-stock products calculation (UC-61: strictly daysUnsold >= deadStockDays)
  const deadStockItems = useMemo(() => {
    const refNow = new Date('2026-11-10T12:00:00Z').getTime();
    return activeProducts
      .filter(
        (p) =>
          p.stock > 0 &&
          (deadStockCategoryId === 'ALL' || p.categoryId === deadStockCategoryId)
      )
      .map((p) => {
        const lastDate = p.lastSoldAt ? new Date(p.lastSoldAt).getTime() : new Date(p.createdAt).getTime();
        const daysUnsold = Math.max(0, Math.floor((refNow - lastDate) / (1000 * 60 * 60 * 24)));
        return {
          ...p,
          daysUnsold,
          tiedCapital: p.stock * p.price,
        };
      })
      .filter((p) => p.daysUnsold >= deadStockDays)
      .sort((a, b) => b.daysUnsold - a.daysUnsold);
  }, [activeProducts, deadStockDays, deadStockCategoryId]);

  const topSeller = bestSellers[0];

  // UC-59 (MAJ-01): Dynamic revenue chart series aggregated from completedOrders in selected date range
  const revenueSeries = useMemo(() => {
    const buckets = new Map<string, { key: string; label: string; value: number }>();

    completedOrders.forEach((order) => {
      const dt = new Date(order.createdAt);
      if (Number.isNaN(dt.getTime())) return;

      let key = '';
      let label = '';
      if (granularity === 'Ngay') {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        key = `${yyyy}-${mm}-${dd}`;
        label = `${dd}/${mm}`;
      } else if (granularity === 'Tuan') {
        const wk = getIsoWeekKey(dt);
        key = wk.key;
        label = wk.label;
      } else if (granularity === 'Thang') {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        key = `${yyyy}-${mm}`;
        label = `T${mm}/${String(yyyy).slice(-2)}`;
      } else {
        const yyyy = String(dt.getFullYear());
        key = yyyy;
        label = yyyy;
      }

      const existing = buckets.get(key);
      if (existing) {
        existing.value += order.totalAmount;
      } else {
        buckets.set(key, { key, label, value: order.totalAmount });
      }
    });

    return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [completedOrders, granularity]);

  // UC-59: Peak (Max) and Lowest (Min) revenue period callouts from real series
  const { maxRevenuePoint, minRevenuePoint } = useMemo(() => {
    if (revenueSeries.length === 0) {
      return { maxRevenuePoint: null, minRevenuePoint: null };
    }
    let maxPt = revenueSeries[0];
    let minPt = revenueSeries[0];
    for (const pt of revenueSeries) {
      if (pt.value > maxPt.value) maxPt = pt;
      if (pt.value < minPt.value) minPt = pt;
    }
    return { maxRevenuePoint: maxPt, minRevenuePoint: minPt };
  }, [revenueSeries]);

  // UC-62 1a: Block PDF print when selected range has no report data
  const hasNoReportData =
    Boolean(dateRangeError) ||
    (ordersInRange.length === 0 && deadStockItems.length === 0);

  const reportPeriodLabel =
    reportStartDate || reportEndDate
      ? `${reportStartDate || '...'} → ${reportEndDate || '...'}`
      : 'Toàn bộ thời gian';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Greeting & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PanelLeft className="w-4 h-4 text-zinc-400" />
          <h1 className="text-base font-semibold text-zinc-900">
            Xin chào, {currentUser?.fullName || 'Quản lý'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/portal/orders')}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-zinc-200/60 hover:bg-zinc-200 text-xs font-medium text-zinc-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đơn hàng</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/portal/inventory')}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-zinc-200/60 hover:bg-zinc-200 text-xs font-medium text-zinc-700 transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Nhập kho</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Xuất báo cáo</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-600 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>HCShop</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Filter (default 30 days per UC-58) & 6-Status Order Breakdown */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-700">Kỳ báo cáo:</span>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              aria-label="Từ ngày"
              className="h-8 px-3 rounded-full bg-[#f4f4f5] text-zinc-800 border border-transparent focus:border-zinc-300 focus:bg-white focus:outline-none"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              aria-label="Đến ngày"
              className="h-8 px-3 rounded-full bg-[#f4f4f5] text-zinc-800 border border-transparent focus:border-zinc-300 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const range = computeDefault30DayRange(orders);
                setReportStartDate(range.start);
                setReportEndDate(range.end);
              }}
              className="h-8 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium"
            >
              30 ngày gần nhất
            </button>
            {(reportStartDate || reportEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setReportStartDate('');
                  setReportEndDate('');
                }}
                className="h-8 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium"
              >
                Toàn bộ thời gian
              </button>
            )}
          </div>
          {dateRangeError && (
            <span className="text-xs text-rose-600 font-medium">{dateRangeError}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100">
          <span className="text-[11px] font-medium text-zinc-400 mr-1">
            Phân bổ trạng thái đơn:
          </span>
          {orderStatusBreakdown.map((item) => (
            <span
              key={item.status}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${item.meta.badgeClass}`}
            >
              {item.meta.label}: {item.count}
            </span>
          ))}
        </div>
      </div>

      {/* 6 KPI Cards (UC-58 incl. TongKhachHangMoi & SoSanPhamSapHetHang — 2-row layout prevents truncation per MAJ-02) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 flex flex-col justify-between min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Tổng doanh thu</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap shrink-0">
              Hoàn thành
            </span>
          </div>
          <div className="text-lg font-bold text-zinc-900 whitespace-nowrap">
            {formatVND(totalRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 flex flex-col justify-between min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Tổng đơn hàng</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 whitespace-nowrap shrink-0">
              {completedOrders.length} hoàn thành
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 whitespace-nowrap">
            {ordersInRange.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 flex flex-col justify-between min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Khách hàng mới</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 whitespace-nowrap shrink-0">
              Tài khoản KH
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 whitespace-nowrap">
            {newCustomersCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 flex flex-col justify-between min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Sắp hết hàng</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 whitespace-nowrap shrink-0">
              Cảnh báo tồn
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 whitespace-nowrap">
            {lowStockCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 flex flex-col justify-between min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500 truncate">
              Bán chạy · {topSeller?.code || 'N/A'}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap shrink-0">
              Đã bán
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 whitespace-nowrap">
            {topSeller?.soldQty || 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 flex flex-col justify-between min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Danh mục hàng</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 whitespace-nowrap shrink-0">
              Mặt hàng
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-900 whitespace-nowrap">
            {activeProducts.length}
          </div>
        </div>
      </div>

      {/* Middle Section: Revenue Chart (UC-59) + Right Ranking List (UC-60) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Dynamic Revenue Chart Card with Ngày/Tuần/Tháng/Năm & Max/Min callouts */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              Biểu đồ doanh thu
            </span>
            <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-full text-xs">
              {(['Ngay', 'Tuan', 'Thang', 'Nam'] as GranularityKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGranularity(key)}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    granularity === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {GRANULARITY_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">Doanh thu lũy kế kỳ chọn</p>
              <p className="text-2xl font-semibold text-zinc-900 whitespace-nowrap">
                {formatVND(totalRevenue)}
              </p>
              <p className="text-xs text-zinc-500 font-medium">
                {completedOrders.length} đơn hoàn thành · nhóm theo{' '}
                {GRANULARITY_LABELS[granularity].toLowerCase()}
              </p>
            </div>

            {maxRevenuePoint && minRevenuePoint && (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Cao nhất: <strong>{formatVND(maxRevenuePoint.value)}</strong> (
                    {maxRevenuePoint.label})
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-800 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Thấp nhất: <strong>{formatVND(minRevenuePoint.value)}</strong> (
                    {minRevenuePoint.label})
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="h-56 w-full pt-2">
            {revenueSeries.length === 0 ? (
              <div className="h-full rounded-xl bg-[#f8f9fa] border border-dashed border-zinc-200 flex items-center justify-center text-xs text-zinc-400 px-4 text-center">
                Chưa có đơn hàng hoàn thành trong kỳ báo cáo ({reportPeriodLabel}) để hiển thị biểu đồ.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickFormatter={(v) =>
                      v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
                    }
                    width={46}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatVND(val), 'Doanh thu']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#0284c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Best Sellers (Top 5/10/20 + Rank) / Stock Holdings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                {rightPanelMode === 'BEST_SELLERS'
                  ? 'Sản phẩm bán chạy'
                  : 'Tồn kho nhanh'}
              </h3>
              <span className="text-xs text-zinc-400">
                {rightPanelMode === 'BEST_SELLERS'
                  ? Math.min(topN, bestSellers.length)
                  : activeProducts.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {rightPanelMode === 'BEST_SELLERS' && (
                <>
                  <select
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value) as 5 | 10 | 20)}
                    aria-label="Số lượng Top sản phẩm"
                    className="h-7 px-2.5 rounded-full bg-white border border-zinc-200/80 text-[11px] font-medium text-zinc-700 focus:outline-none"
                  >
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                  <select
                    value={bestSellerCategoryId}
                    onChange={(e) => setBestSellerCategoryId(e.target.value)}
                    aria-label="Lọc danh mục bán chạy"
                    className="h-7 px-2.5 rounded-full bg-white border border-zinc-200/80 text-[11px] font-medium text-zinc-700 focus:outline-none"
                  >
                    <option value="ALL">Mọi danh mục</option>
                    {categories
                      .filter((c) => !c.isDeleted)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </>
              )}

              <div className="flex items-center gap-1 bg-zinc-200/60 p-0.5 rounded-full text-[11px]">
                <button
                  type="button"
                  onClick={() => setRightPanelMode('BEST_SELLERS')}
                  className={`px-2.5 py-0.5 rounded-full font-medium ${
                    rightPanelMode === 'BEST_SELLERS'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500'
                  }`}
                >
                  Bán chạy
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelMode('STOCK')}
                  className={`px-2.5 py-0.5 rounded-full font-medium ${
                    rightPanelMode === 'STOCK'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500'
                  }`}
                >
                  Tồn kho
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {rightPanelMode === 'BEST_SELLERS'
              ? bestSellers.slice(0, topN).map((item, idx) => {
                  const colors = [
                    'from-amber-200 to-orange-400',
                    'from-sky-200 to-blue-500',
                    'from-zinc-200 to-zinc-500',
                    'from-yellow-200 to-amber-500',
                    'from-purple-200 to-indigo-500',
                  ];
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between py-1.5 px-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                            colors[idx % colors.length]
                          } shrink-0 flex items-center justify-center text-[11px] font-bold text-zinc-900/80`}
                        >
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {item.code}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-zinc-900">
                          {formatVND(item.revenue || item.price)}
                        </p>
                        <p className="text-[11px] font-medium text-emerald-600">
                          Đã bán: {item.soldQty}
                        </p>
                      </div>
                    </div>
                  );
                })
              : activeProducts.slice(0, 5).map((item, idx) => {
                  const colors = [
                    'from-amber-200 to-orange-400',
                    'from-sky-200 to-blue-500',
                    'from-zinc-200 to-zinc-500',
                    'from-yellow-200 to-amber-500',
                    'from-purple-200 to-indigo-500',
                  ];
                  const isLow = item.stock <= item.minStockThreshold;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1.5 px-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                            colors[idx % colors.length]
                          } shrink-0`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {item.code}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-zinc-900">
                          {formatVND(item.price)}
                        </p>
                        <p
                          className={`text-[11px] font-medium ${
                            isLow ? 'text-rose-500' : 'text-emerald-600'
                          }`}
                        >
                          {isLow ? `↓ Tồn: ${item.stock}` : `↑ Tồn: ${item.stock}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
          </div>

          <button
            type="button"
            onClick={() => navigate('/portal/inventory')}
            className="w-full h-9 rounded-full bg-zinc-200/70 hover:bg-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
          >
            Xem chi tiết kho hàng
          </button>
        </div>
      </div>

      {/* Slow-Moving / Dead-Stock Inventory Report (UC-61) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Hàng tồn đọng chậm luân chuyển
            </h3>
            <span className="text-xs text-zinc-400">{deadStockItems.length}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={deadStockCategoryId}
              onChange={(e) => setDeadStockCategoryId(e.target.value)}
              className="h-7 px-3 rounded-full bg-white border border-zinc-200/80 text-xs font-medium text-zinc-700 focus:outline-none"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories
                .filter((c) => !c.isDeleted)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            {([30, 60, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDeadStockDays(days)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  deadStockDays === days
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-200/60 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                ≥ {days} ngày
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-zinc-100/70 text-[11px] font-medium text-zinc-500">
            <div className="col-span-4">Sản phẩm</div>
            <div className="col-span-2">Tồn hiện tại</div>
            <div className="col-span-2">Giá trị tồn</div>
            <div className="col-span-2">Lần bán cuối</div>
            <div className="col-span-2 text-right">Số ngày chưa bán</div>
          </div>

          <div className="divide-y divide-zinc-100">
            {deadStockItems.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-zinc-400">
                Không có sản phẩm nào tồn đọng từ {deadStockDays} ngày trở lên trong bộ lọc hiện tại.
              </div>
            ) : (
              deadStockItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center px-5 py-3.5 text-xs"
                >
                  <div className="col-span-4">
                    <p className="font-semibold text-zinc-900">{item.name}</p>
                    <p className="text-[11px] font-mono text-zinc-400">{item.code}</p>
                  </div>
                  <div className="col-span-2 font-semibold text-zinc-800">
                    {item.stock} đơn vị
                  </div>
                  <div className="col-span-2 font-medium text-zinc-800">
                    {formatVND(item.tiedCapital)}
                  </div>
                  <div className="col-span-2 text-zinc-500 text-[11px]">
                    {formatDate(item.lastSoldAt)}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium">
                      {item.daysUnsold} ngày
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Stock Activity Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Hoạt động kho gần đây
          </h3>
          <span className="text-xs text-zinc-400">{stockHistories.length}</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-zinc-100/70 text-[11px] font-medium text-zinc-500">
            <div className="col-span-3">Mã giao dịch</div>
            <div className="col-span-3">Loại</div>
            <div className="col-span-2">Sản phẩm</div>
            <div className="col-span-2">Số lượng</div>
            <div className="col-span-2 text-right">Thời gian</div>
          </div>

          <div className="divide-y divide-zinc-100">
            {stockHistories.slice(0, 6).map((sh) => {
              const prod = products.find((p) => p.id === sh.productId);
              const isPositive = sh.quantityChange > 0;

              return (
                <div
                  key={sh.id}
                  className="grid grid-cols-12 items-center px-5 py-3.5 text-xs"
                >
                  <div className="col-span-3 font-mono text-zinc-600 truncate pr-2">
                    {sh.id}
                  </div>
                  <div className="col-span-3">
                    {isPositive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-medium">
                        ↓ Nhập / Hoàn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-medium">
                        <FileText className="w-3 h-3" /> Xuất / Giảm
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 font-medium text-zinc-800">
                    {prod?.code || sh.productId}
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-zinc-900">
                      {isPositive ? `+${sh.quantityChange}` : sh.quantityChange} đơn vị
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Tồn sau: {sh.stockAfter}
                    </p>
                  </div>
                  <div className="col-span-2 text-right text-zinc-400 text-[11px]">
                    {formatDateTime(sh.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Print / Export Executive Report Modal (UC-62) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200/80 max-w-2xl w-full p-6 sm:p-8 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  HCShop · Báo cáo Tổng hợp Kinh doanh & Tồn kho
                </span>
                <h2 className="text-lg font-bold text-zinc-900 mt-1">
                  Báo cáo Kết quả Vận hành ({reportPeriodLabel})
                </h2>
                <p className="text-xs text-zinc-500">
                  Ngày lập: {formatDateTime(new Date().toISOString())} · Người lập:{' '}
                  {currentUser?.fullName || 'Quản lý'} · Kỳ biểu đồ:{' '}
                  {GRANULARITY_LABELS[granularity]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="no-print w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasNoReportData && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Không có dữ liệu để xuất báo cáo trong khoảng thời gian đã chọn.
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    Vui lòng điều chỉnh lại bộ lọc ngày trước khi in hoặc lưu PDF (UC-62).
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <p className="text-zinc-500">Doanh thu hoàn tất</p>
                <p className="text-sm font-bold text-zinc-900 mt-1">
                  {formatVND(totalRevenue)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <p className="text-zinc-500">Đơn hoàn thành / Tổng</p>
                <p className="text-sm font-bold text-zinc-900 mt-1">
                  {completedOrders.length} / {ordersInRange.length} đơn
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <p className="text-zinc-500">Sắp hết hàng</p>
                <p className="text-sm font-bold text-amber-700 mt-1">
                  {lowStockCount} sản phẩm
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <p className="text-zinc-500">SKU đang bán</p>
                <p className="text-sm font-bold text-zinc-900 mt-1">
                  {activeProducts.length} sản phẩm
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Top {topN} sản phẩm dẫn đầu doanh số
              </h4>
              <table className="w-full text-xs border border-zinc-200/70 rounded-xl overflow-hidden">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="py-2 px-3 text-left">Hạng</th>
                    <th className="py-2 px-3 text-left">Mã SKU</th>
                    <th className="py-2 px-3 text-left">Sản phẩm</th>
                    <th className="py-2 px-3 text-right">SL bán</th>
                    <th className="py-2 px-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {bestSellers.slice(0, topN).map((b, idx) => (
                    <tr key={b.productId}>
                      <td className="py-2 px-3 font-semibold text-zinc-700">
                        #{idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono">{b.code}</td>
                      <td className="py-2 px-3 font-medium text-zinc-900">
                        {b.name}
                      </td>
                      <td className="py-2 px-3 text-right">{b.soldQty}</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {formatVND(b.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="no-print flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={hasNoReportData}
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In báo cáo / Lưu PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
