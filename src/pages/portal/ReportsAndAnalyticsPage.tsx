import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  FileText,
  PanelLeft,
  Printer,
  RefreshCw,
  Send,
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
import { formatDate, formatDateTime, formatVND } from '../../utils/formatters';

type PeriodKey = '1D' | '1W' | '1M' | '3M' | '1Y';

const PERIOD_SERIES: Record<
  PeriodKey,
  { growth: string; data: { label: string; value: number }[] }
> = {
  '1D': {
    growth: '+3.42%',
    data: [
      { label: '08:00', value: 1200000 },
      { label: '10:00', value: 2100000 },
      { label: '12:00', value: 1850000 },
      { label: '15:00', value: 3400000 },
      { label: '18:00', value: 4200000 },
      { label: '21:00', value: 5100000 },
    ],
  },
  '1W': {
    growth: '+5.84%',
    data: [
      { label: 'T2', value: 3200000 },
      { label: 'T3', value: 4100000 },
      { label: 'T4', value: 3800000 },
      { label: 'T5', value: 5200000 },
      { label: 'T6', value: 4900000 },
      { label: 'T7', value: 6400000 },
      { label: 'CN', value: 6950000 },
    ],
  },
  '1M': {
    growth: '+8.16%',
    data: [
      { label: 'Day 3', value: 4200000 },
      { label: 'Day 6', value: 3800000 },
      { label: 'Day 9', value: 4600000 },
      { label: 'Day 12', value: 4100000 },
      { label: 'Day 15', value: 5800000 },
      { label: 'Day 18', value: 5100000 },
      { label: 'Day 21', value: 6400000 },
      { label: 'Day 24', value: 5900000 },
      { label: 'Day 28', value: 6950000 },
    ],
  },
  '3M': {
    growth: '+14.20%',
    data: [
      { label: 'T9/W1', value: 12500000 },
      { label: 'T9/W3', value: 14800000 },
      { label: 'T10/W1', value: 13900000 },
      { label: 'T10/W3', value: 18200000 },
      { label: 'T11/W1', value: 21400000 },
      { label: 'T11/W2', value: 24600000 },
    ],
  },
  '1Y': {
    growth: '+26.50%',
    data: [
      { label: 'Q1', value: 42000000 },
      { label: 'Q2', value: 54000000 },
      { label: 'Q3', value: 61000000 },
      { label: 'Q4', value: 78500000 },
    ],
  },
};

export const ReportsAndAnalyticsPage: React.FC = () => {
  const { currentUser, orders, products, stockHistories } = useApp();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<PeriodKey>('1M');
  const [rightPanelMode, setRightPanelMode] = useState<'BEST_SELLERS' | 'STOCK'>('BEST_SELLERS');
  const [deadStockDays, setDeadStockDays] = useState<30 | 60 | 90>(30);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted),
    [products]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'COMPLETED'),
    [orders]
  );

  const totalRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [completedOrders]
  );

  // Best-selling products calculation
  const bestSellers = useMemo(() => {
    const map = new Map<
      string,
      { productId: string; code: string; name: string; price: number; soldQty: number; revenue: number }
    >();

    activeProducts.forEach((p) => {
      map.set(p.id, {
        productId: p.id,
        code: p.code,
        name: p.name,
        price: p.price,
        soldQty: 0,
        revenue: 0,
      });
    });

    orders
      .filter((o) => o.status !== 'CANCELLED')
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
  }, [activeProducts, orders]);

  // Slow-moving / Dead-stock products calculation
  const deadStockItems = useMemo(() => {
    const refNow = new Date('2026-11-10T12:00:00Z').getTime();
    return activeProducts
      .filter((p) => p.stock > 0)
      .map((p) => {
        const lastDate = p.lastSoldAt ? new Date(p.lastSoldAt).getTime() : new Date(p.createdAt).getTime();
        const daysUnsold = Math.max(0, Math.floor((refNow - lastDate) / (1000 * 60 * 60 * 24)));
        return {
          ...p,
          daysUnsold,
          tiedCapital: p.stock * p.price,
        };
      })
      .filter((p) => p.daysUnsold >= deadStockDays || p.stock >= 18)
      .sort((a, b) => b.daysUnsold - a.daysUnsold);
  }, [activeProducts, deadStockDays]);

  const topSeller = bestSellers[0];
  const currentSeries = PERIOD_SERIES[period];

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

      {/* 4 Minimal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 flex flex-col justify-between h-28">
          <span className="text-xs text-zinc-500">Tổng doanh thu</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-zinc-900">
              {formatVND(totalRevenue)}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              ↑ 5.32%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 flex flex-col justify-between h-28">
          <span className="text-xs text-zinc-500">Tổng đơn hàng</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-zinc-900">
              {orders.length}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              ↑ 2.24%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 flex flex-col justify-between h-28">
          <span className="text-xs text-zinc-500">
            Bán chạy nhất · {topSeller?.code || 'SKU-01'}
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-zinc-900">
              {topSeller?.soldQty || 12}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              ↑ 4.72%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 flex flex-col justify-between h-28">
          <span className="text-xs text-zinc-500">Danh mục hàng hóa</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-zinc-900">
              {activeProducts.length}
            </span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              Mặt hàng
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Revenue Chart + Right Ranking List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Minimal Line Chart Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">
              Biểu đồ doanh thu
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              {(['1D', '1W', '1M', '3M', '1Y'] as PeriodKey[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriod(item)}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    period === item
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-zinc-400">Doanh thu lũy kế</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {formatVND(totalRevenue)}
            </p>
            <p className="text-xs text-emerald-600 font-medium">
              ↑ {currentSeries.growth}{' '}
              <span className="text-zinc-400 ml-1">kỳ {period}</span>
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentSeries.data}>
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
                  tickFormatter={(v) => `${Math.round(v / 1000000)}M`}
                  width={38}
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
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 Cols: Best Sellers / Stock Holdings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                {rightPanelMode === 'BEST_SELLERS'
                  ? 'Sản phẩm bán chạy'
                  : 'Tồn kho nhanh'}
              </h3>
              <span className="text-xs text-zinc-400">
                {activeProducts.length}
              </span>
            </div>

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

          <div className="space-y-3">
            {rightPanelMode === 'BEST_SELLERS'
              ? bestSellers.slice(0, 5).map((item, idx) => {
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
                          } shrink-0 flex items-center justify-center text-[11px] font-bold text-zinc-900/70`}
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

      {/* Slow-Moving / Dead-Stock Inventory Report */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Hàng tồn đọng chậm luân chuyển
            </h3>
            <span className="text-xs text-zinc-400">{deadStockItems.length}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
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
            {deadStockItems.map((item) => (
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
            ))}
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

      {/* Print / Export Executive Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200/80 max-w-2xl w-full p-6 sm:p-8 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  HCShop · Báo cáo Tổng hợp Kinh doanh & Tồn kho
                </span>
                <h2 className="text-lg font-bold text-zinc-900 mt-1">
                  Báo cáo Kết quả Vận hành ({period})
                </h2>
                <p className="text-xs text-zinc-500">
                  Ngày lập: {formatDateTime(new Date().toISOString())} · Người lập:{' '}
                  {currentUser?.fullName || 'Quản lý'}
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

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <p className="text-zinc-500">Doanh thu hoàn tất</p>
                <p className="text-base font-bold text-zinc-900 mt-1">
                  {formatVND(totalRevenue)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <p className="text-zinc-500">Đơn hoàn thành / Tổng đơn</p>
                <p className="text-base font-bold text-zinc-900 mt-1">
                  {completedOrders.length} / {orders.length} đơn
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <p className="text-zinc-500">Tổng mã SKU đang bán</p>
                <p className="text-base font-bold text-zinc-900 mt-1">
                  {activeProducts.length} sản phẩm
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Top sản phẩm dẫn đầu doanh số
              </h4>
              <table className="w-full text-xs border border-zinc-200/70 rounded-xl overflow-hidden">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="py-2 px-3 text-left">Mã SKU</th>
                    <th className="py-2 px-3 text-left">Sản phẩm</th>
                    <th className="py-2 px-3 text-right">SL bán</th>
                    <th className="py-2 px-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {bestSellers.slice(0, 5).map((b) => (
                    <tr key={b.productId}>
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
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
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
