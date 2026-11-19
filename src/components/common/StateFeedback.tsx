import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  compact?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Đang tải dữ liệu...',
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center text-zinc-500 ${
      compact ? 'py-8' : 'py-16'
    }`}
  >
    <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mb-2" />
    <span className="text-xs font-medium">{message}</span>
  </div>
);

interface SkeletonListProps {
  rows?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ rows = 4 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        className="h-14 rounded-2xl bg-zinc-200/70 border border-zinc-200/40"
      />
    ))}
  </div>
);

interface ErrorStateCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorStateCard: React.FC<ErrorStateCardProps> = ({
  title = 'Không thể tải dữ liệu',
  message = 'Đã xảy ra lỗi truy vấn hệ thống. Vui lòng kiểm tra kết nối và thử lại.',
  onRetry,
}) => (
  <div className="bg-white rounded-2xl border border-rose-200/80 p-8 text-center space-y-3">
    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-md mx-auto">{message}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Thử lại</span>
      </button>
    )}
  </div>
);
