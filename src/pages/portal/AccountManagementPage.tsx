import React, { useState, useMemo } from 'react';
import {
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  Eye,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaginationBar } from '../../components/common/PaginationBar';
import { AccountStatus, User, UserRole } from '../../types/domain';
import {
  formatDate,
  formatDateTime,
  formatVND,
  ROLE_LABELS,
} from '../../utils/formatters';

const LOCK_REASONS = [
  'Phát hiện hành vi đặt đơn ảo / bom hàng nhiều lần',
  'Vi phạm quy chuẩn cộng đồng trong phần bình luận đánh giá',
  'Nghi ngờ truy cập trái phép — Tạm khóa bảo vệ tài khoản',
  'Yêu cầu tạm ngừng hoạt động từ chủ tài khoản',
  'Lý do khác',
];

type AccountSortKey = 'NEWEST' | 'OLDEST' | 'NAME_ASC';

export const AccountManagementPage: React.FC = () => {
  const {
    currentUser,
    users,
    orders,
    accountLockHistories,
    toggleAccountLock,
  } = useApp();

  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus>('ALL');
  const [sortBy, setSortBy] = useState<AccountSortKey>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const pageSize = 8;

  // Account Detail Modal State (UC-08, MAJ-05)
  const [detailUser, setDetailUser] = useState<User | null>(null);

  // Lock Modal State (UC-10, ISS-20)
  const [lockingUser, setLockingUser] = useState<User | null>(null);
  const [selectedReason, setSelectedReason] = useState(LOCK_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Lock History Modal State (UC-10, ISS-20)
  const [historyUser, setHistoryUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter === 'HoatDong' && u.isLocked) return false;
      if (statusFilter === 'BiKhoa' && !u.isLocked) return false;

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

    return [...list].sort((a, b) => {
      if (sortBy === 'NAME_ASC') {
        return a.fullName.localeCompare(b.fullName, 'vi');
      }
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortBy === 'NEWEST' ? -diff : diff;
    });
  }, [users, roleFilter, statusFilter, sortBy, searchQuery]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const lockingUserActiveOrders = useMemo(() => {
    if (!lockingUser) return 0;
    return orders.filter(
      (o) =>
        o.userId === lockingUser.id &&
        (o.status === 'ChoXacNhan' ||
          o.status === 'DaXacNhan' ||
          o.status === 'DangChuanBi' ||
          o.status === 'DangGiao')
    ).length;
  }, [lockingUser, orders]);

  const selectedUserLockLogs = useMemo(() => {
    if (!historyUser) return [];
    return accountLockHistories.filter((h) => h.userId === historyUser.id);
  }, [historyUser, accountLockHistories]);

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
            Quản lý tài khoản
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tra cứu danh sách thành viên, theo dõi lịch sử và kiểm soát trạng thái tài khoản khách hàng
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

      {/* Filter & Sort Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full">
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'KhachHang', label: 'Khách hàng' },
              { id: 'NhanVien', label: 'Nhân viên' },
              { id: 'QuanLy', label: 'Quản lý' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setRoleFilter(tab.id);
                setCurrentPage(1);
              }}
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
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ALL' | AccountStatus);
              setCurrentPage(1);
            }}
            aria-label="Lọc trạng thái tài khoản"
            className="h-9 px-3 rounded-full bg-[#f4f4f5] text-xs font-medium text-zinc-700 focus:outline-none"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="HoatDong">Đang hoạt động</option>
            <option value="BiKhoa">Đang bị khóa</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as AccountSortKey);
              setCurrentPage(1);
            }}
            aria-label="Sắp xếp tài khoản"
            className="h-9 px-3 rounded-full bg-[#f4f4f5] text-xs font-medium text-zinc-700 focus:outline-none"
          >
            <option value="NEWEST">Mới tạo nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="NAME_ASC">Tên A → Z</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4">Đơn đã mua</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {paginatedUsers.map((user) => {
                const isSelf = currentUser?.id === user.id;
                const isCustomer = user.role === 'KhachHang';
                const orderCount = orders.filter((o) => o.userId === user.id).length;
                const lockLogCount = accountLockHistories.filter(
                  (h) => h.userId === user.id
                ).length;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-200 via-indigo-300 to-purple-300 shrink-0" />
                        )}
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
                            {user.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-zinc-800">{user.email}</div>
                      <div className="text-[11px] text-zinc-400">{user.phone}</div>
                    </td>

                    <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-zinc-700">
                      {orderCount} đơn
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          user.role === 'QuanLy'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                            : user.role === 'NhanVien'
                              ? 'bg-purple-50 text-purple-700 border-purple-200/70'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200/70'
                        }`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {user.isLocked ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            Bị khóa
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
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setDetailUser(user)}
                          title="Xem chi tiết tài khoản (UC-08)"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>

                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 px-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Đang đăng nhập
                          </span>
                        ) : !isCustomer ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 px-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Nội bộ
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setHistoryUser(user)}
                              title="Xem lịch sử khóa / mở khóa"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Lịch sử{lockLogCount > 0 ? ` (${lockLogCount})` : ''}</span>
                            </button>

                            {user.isLocked ? (
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="tài khoản"
      />

      {/* Account Detail Modal (UC-08, MAJ-05) */}
      {detailUser && (() => {
        const userOrders = orders.filter((o) => o.userId === detailUser.id);
        const completedSpend = userOrders
          .filter((o) => o.status === 'HoanThanh')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const lockLogs = accountLockHistories.filter(
          (h) => h.userId === detailUser.id
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-zinc-200/80 max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Chi tiết tài khoản · {detailUser.code}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {ROLE_LABELS[detailUser.role]} · Tham gia {formatDate(detailUser.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60">
                <div>
                  <span className="text-zinc-400 block">Họ và tên</span>
                  <span className="font-semibold text-zinc-900">{detailUser.fullName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Trạng thái</span>
                  <span
                    className={`font-semibold ${
                      detailUser.isLocked ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {detailUser.isLocked ? 'Bị khóa' : 'Hoạt động'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Email</span>
                  <span className="font-medium text-zinc-800 break-all">{detailUser.email}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Số điện thoại</span>
                  <span className="font-medium text-zinc-800">{detailUser.phone}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Ngày sinh / Giới tính</span>
                  <span className="font-medium text-zinc-800">
                    {detailUser.dob ? formatDate(detailUser.dob) : 'Chưa cập nhật'} ·{' '}
                    {detailUser.gender || 'Chưa chọn'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Câu hỏi bảo mật</span>
                  <span className="font-medium text-zinc-800">
                    {detailUser.securityQuestion ? 'Đã thiết lập' : 'Chưa thiết lập'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl border border-zinc-200/70 text-center">
                  <span className="text-[11px] text-zinc-400 block">Tổng đơn hàng</span>
                  <span className="text-base font-bold text-zinc-900">{userOrders.length}</span>
                </div>
                <div className="p-3 rounded-2xl border border-zinc-200/70 text-center">
                  <span className="text-[11px] text-zinc-400 block">Chi tiêu hoàn tất</span>
                  <span className="text-sm font-bold text-zinc-900">
                    {formatVND(completedSpend)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl border border-zinc-200/70 text-center">
                  <span className="text-[11px] text-zinc-400 block">Lịch sử khóa</span>
                  <span className="text-base font-bold text-zinc-900">{lockLogs.length}</span>
                </div>
              </div>

              {detailUser.isLocked && detailUser.lockReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-xs text-rose-800">
                  <strong>Lý do đang khóa:</strong> {detailUser.lockReason}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lock User Modal (UC-10, ISS-20) */}
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

            {lockingUserActiveOrders > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cảnh báo đơn hàng đang xử lý:</strong> Khách hàng này hiện có{' '}
                  <strong>{lockingUserActiveOrders}</strong> đơn hàng chưa hoàn thành. Các đơn hiện tại vẫn tiếp tục xử lý bình thường.
                </div>
              </div>
            )}

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
                  maxLength={500}
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

      {/* Lock History Modal (UC-10, ISS-20, CRIT-04) */}
      {historyUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200/80 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Lịch sử khóa / mở khóa tài khoản
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {historyUser.fullName} ({historyUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryUser(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedUserLockLogs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60 text-center text-xs text-zinc-500">
                Tài khoản này chưa có lịch sử khóa hoặc mở khóa nào.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {selectedUserLockLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.newStatus === 'BiKhoa'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {log.newStatus === 'BiKhoa'
                          ? 'Khóa tài khoản (BiKhoa)'
                          : 'Mở khóa tài khoản (HoatDong)'}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-zinc-800 font-medium">{log.reason}</p>
                    <p className="text-[11px] text-zinc-500">
                      Thực hiện bởi: {log.actorName}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setHistoryUser(null)}
                className="px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
