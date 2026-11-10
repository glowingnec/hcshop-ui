import React, { useState, useMemo } from 'react';
import {
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types/domain';
import { formatDate } from '../../utils/formatters';

const LOCK_REASONS = [
  'Phát hiện hành vi đặt đơn ảo / bom hàng nhiều lần',
  'Vi phạm quy chuẩn cộng đồng trong phần bình luận đánh giá',
  'Nghi ngờ truy cập trái phép — Tạm khóa bảo vệ tài khoản',
  'Yêu cầu tạm ngừng hoạt động từ chủ tài khoản',
  'Lý do khác',
];

export const AccountManagementPage: React.FC = () => {
  const {
    currentUser,
    users,
    orders,
    toggleAccountLock,
    updateAccountRole,
  } = useApp();

  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Lock Modal State
  const [lockingUser, setLockingUser] = useState<User | null>(null);
  const [selectedReason, setSelectedReason] = useState(LOCK_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && u.isLocked) return false;
      if (statusFilter === 'LOCKED' && !u.isLocked) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const handleConfirmLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockingUser) return;
    const reason =
      selectedReason === 'Lý do khác' ? customReason.trim() : selectedReason;
    const res = toggleAccountLock(lockingUser.id, reason);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setLockingUser(null);
      setCustomReason('');
    }
  };

  const handleUnlock = (user: User) => {
    const res = toggleAccountLock(user.id);
    setFeedback({ ok: res.ok, text: res.message });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Quản lý tài khoản & Phân quyền
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tra cứu danh sách thành viên, phân quyền nhân sự và kiểm soát trạng thái hoạt động
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-white border border-zinc-200/80 text-zinc-700 font-medium">
            Tổng: <strong>{users.length}</strong> tài khoản
          </span>
          <span className="px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200/70 text-rose-700 font-semibold">
            Đang khóa: {users.filter((u) => u.isLocked).length}
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
              { id: 'CUSTOMER', label: 'Khách hàng' },
              { id: 'STAFF', label: 'Nhân viên' },
              { id: 'ADMIN', label: 'Quản lý' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                roleFilter === tab.id
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
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'LOCKED')
            }
            className="h-9 px-3 rounded-full bg-[#f4f4f5] text-xs font-medium text-zinc-700 focus:outline-none"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đang bị khóa</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT, mã..."
              className="w-full h-9 pl-9 pr-3.5 rounded-full bg-[#f4f4f5] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-[#f8f9fa]/60">
                <th className="py-3 px-4">Thành viên</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Đơn đã mua</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filteredUsers.map((user) => {
                const isSelf = currentUser?.id === user.id;
                const orderCount = orders.filter((o) => o.userId === user.id).length;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-200 via-indigo-300 to-purple-300 shrink-0" />
                        <div>
                          <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                            <span>{user.fullName}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            {user.code} · Tham gia {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-zinc-800">{user.email}</div>
                      <div className="text-[11px] text-zinc-400">{user.phone}</div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-zinc-700">
                      {orderCount} đơn
                    </td>

                    <td className="py-3 px-4">
                      <select
                        disabled={isSelf}
                        value={user.role}
                        onChange={(e) => {
                          const res = updateAccountRole(
                            user.id,
                            e.target.value as UserRole
                          );
                          setFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="h-8 px-2.5 rounded-lg bg-[#f4f4f5] text-xs font-semibold text-zinc-800 disabled:opacity-60 focus:outline-none"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      {user.isLocked ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            Đã khóa
                          </span>
                          {user.lockReason && (
                            <div className="text-[11px] text-rose-500 mt-0.5 max-w-[180px] truncate">
                              {user.lockReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Hoạt động
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isSelf ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Đang đăng nhập
                        </span>
                      ) : user.isLocked ? (
                        <button
                          type="button"
                          onClick={() => handleUnlock(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mở khóa</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLockingUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Khóa TK</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lock User Modal */}
      {lockingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmLock}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Khóa tài khoản {lockingUser.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setLockingUser(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 bg-rose-50/70 border border-rose-200/70 p-3 rounded-xl">
              Tài khoản bị khóa sẽ không thể đăng nhập hoặc đặt hàng mới cho đến khi được Quản trị viên mở khóa.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700">
                Lý do khóa tài khoản *
              </label>
              {LOCK_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200/80 text-xs text-zinc-800 cursor-pointer hover:bg-zinc-50"
                >
                  <input
                    type="radio"
                    name="lockReason"
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}

              {selectedReason === 'Lý do khác' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLockingUser(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Xác nhận khóa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
