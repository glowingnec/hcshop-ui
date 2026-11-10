import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  FileText,
  PanelLeft,
  RefreshCw,
  Send,
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
import { formatDateTime, formatVND } from '../../utils/formatters';

const CHART_DATA = [
  { day: 'Day 3', value: 4200000 },
  { day: 'Day 6', value: 3800000 },
  { day: 'Day 9', value: 4600000 },
  { day: 'Day 12', value: 4100000 },
  { day: 'Day 15', value: 5800000 },
  { day: 'Day 18', value: 5100000 },
  { day: 'Day 21', value: 6400000 },
  { day: 'Day 24', value: 5900000 },
  { day: 'Day 28', value: 6950000 },
];

export const Phase1PortalPreview: React.FC = () => {
  const { currentUser, orders, products, stockHistories } = useApp();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('1M');

  const totalRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Greeting Bar (Exact match to Reference Image 1) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PanelLeft className="w-4 h-4 text-zinc-400" />
          <h1 className="text-base font-semibold text-zinc-900">
            Xin chào, {currentUser?.fullName || 'Quản lý'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/portal/orders')}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-zinc-200/60 hover:bg-zinc-200 text-xs font-medium text-zinc-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đơn hàng</span>
          </button>
          <button
            onClick={() => navigate('/portal/inventory')}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-zinc-200/60 hover:bg-zinc-200 text-xs font-medium text-zinc-700 transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Nhập kho</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-600 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>HCShop</span>
          </button>
        </div>
      </div>

      {/* 4 Minimal KPI Cards (Exact match to Reference Image 1) */}
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
          <span className="text-xs text-zinc-500">Đơn hàng 24h</span>
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
          <span className="text-xs text-zinc-500">Bán chạy nhất · SKU-001</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-zinc-900">24</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              ↑ 4.72%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/70 p-5 flex flex-col justify-between h-28">
          <span className="text-xs text-zinc-500">Sản phẩm</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-zinc-900">
              {products.length}
            </span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              Mặt hàng
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart Card + Right List (Matching Reference Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Minimal Line Chart Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">Doanh thu</span>
            <div className="flex items-center gap-2 text-xs">
              {['1D', '1W', '1M', '3M', '1Y', 'All'].map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                    period === item
                      ? 'text-blue-600'
                      : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-zinc-400">Tổng doanh thu</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {formatVND(totalRevenue)}
            </p>
            <p className="text-xs text-emerald-600 font-medium">
              ↑ +8.16% <span className="text-zinc-400 ml-1">{period}</span>
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  tickFormatter={(v) => `${Math.round(v / 1000000)}M`}
                  width={36}
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

        {/* Right 5 Cols: Minimal Inventory List ("Holdings" style) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-sm font-semibold text-zinc-900">Tồn kho</h3>
            <span className="text-xs text-zinc-400">{products.length}</span>
          </div>

          <div className="space-y-3">
            {products.slice(0, 5).map((item, idx) => {
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
            onClick={() => navigate('/portal/inventory')}
            className="w-full h-9 rounded-full bg-zinc-200/70 hover:bg-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
          >
            Xem tất cả kho hàng
          </button>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Table (Matching Reference Image 1) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">Hoạt động gần đây</h3>
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
            {stockHistories.map((sh) => {
              const prod = products.find((p) => p.id === sh.productId);
              const isPositive = sh.quantityChange > 0;

              return (
                <div
                  key={sh.id}
                  className="grid grid-cols-12 items-center px-5 py-3.5 text-xs"
                >
                  <div className="col-span-3 font-mono text-zinc-600">
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
    </div>
  );
};
