import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  Check,
  ClipboardList,
  HelpCircle,
  LogOut,
  MessageSquare,
  Package,
  RotateCcw,
  ShieldCheck,
  Store,
  TicketPercent,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types/domain';
import { IS_DEMO_MODE } from '../../utils/formatters';

export const PortalLayout: React.FC = () => {
  const {
    currentUser,
    orders,
    products,
    reviews,
    switchDemoRole,
    logoutUser,
    resetDemoData,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pendingOrdersCount = orders.filter((o) => o.status === 'ChoXacNhan').length;
  const lowStockCount = products.filter(
    (p) => !p.isDeleted && p.stock <= p.minStockThreshold
  ).length;
  const unansweredReviewsCount = reviews.filter((r) => !r.storeReply).length;

  const isStaffOrAdmin =
    currentUser?.role === 'NhanVien' || currentUser?.role === 'QuanLy';

  // ISS-05: Redirect NhanVien away from Admin-only routes (/portal, inventory, products, vouchers, accounts)
  useEffect(() => {
    if (currentUser?.role === 'NhanVien') {
      const path = location.pathname.replace(/\/+$/, '');
      const allowedStaffPaths = ['/portal/orders', '/portal/reviews'];
      if (!allowedStaffPaths.includes(path)) {
        navigate('/portal/orders', { replace: true });
      }
    }
  }, [currentUser?.role, location.pathname, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = (role: UserRole | 'GUEST') => {
    setMenuOpen(false);
    switchDemoRole(role);
    if (role === 'KhachHang' || role === 'GUEST') {
      navigate('/');
    } else if (role === 'NhanVien') {
      navigate('/portal/orders');
    } else {
      navigate('/portal');
    }
  };

  const navItems: {
    to: string;
    end?: boolean;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isNew?: boolean;
    roles: UserRole[];
  }[] = [
    {
      to: '/portal',
      end: true,
      label: 'Tổng quan',
      icon: BarChart3,
      roles: ['QuanLy'],
    },
    {
      to: '/portal/orders',
      label: 'Đơn hàng',
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
      roles: ['QuanLy', 'NhanVien'],
    },
    {
      to: '/portal/inventory',
      label: 'Kho hàng',
      icon: Boxes,
      badge: lowStockCount > 0 ? String(lowStockCount) : undefined,
      roles: ['QuanLy'],
    },
    {
      to: '/portal/products',
      label: 'Sản phẩm',
      icon: Package,
      roles: ['QuanLy'],
    },
    {
      to: '/portal/vouchers',
      label: 'Khuyến mãi',
      icon: TicketPercent,
      isNew: true,
      roles: ['QuanLy'],
    },
    {
      to: '/portal/reviews',
      label: 'Đánh giá',
      icon: MessageSquare,
      badge: unansweredReviewsCount > 0 ? String(unansweredReviewsCount) : undefined,
      roles: ['QuanLy', 'NhanVien'],
    },
    {
      to: '/portal/accounts',
      label: 'Tài khoản',
      icon: Users,
      roles: ['QuanLy'],
    },
  ];

  if (!isStaffOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f9fa]">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-zinc-200/80 p-6 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-200 via-blue-400 to-indigo-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-900">
              Cổng quản trị HCShop
            </h2>
            <p className="text-xs text-zinc-500">
              Vui lòng đăng nhập bằng tài khoản Nhân viên hoặc Quản lý để tiếp tục.
            </p>
          </div>
          {IS_DEMO_MODE ? (
            <div className="flex gap-2 justify-center pt-1">
              <button
                onClick={() => handleRoleSwitch('NhanVien')}
                className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
              >
                Nhân viên
              </button>
              <button
                onClick={() => handleRoleSwitch('QuanLy')}
                className="px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-600 transition-colors"
              >
                Quản lý
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition-colors"
            >
              Đến trang đăng nhập
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-zinc-900">
      {/* Minimal Left Sidebar */}
      <aside className="no-print w-56 shrink-0 flex flex-col justify-between p-4 select-none">
        <div className="space-y-6">
          {/* Top-Left User Profile Trigger with Role Switcher Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-zinc-200/50 transition-colors text-left focus:outline-none"
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-200 via-indigo-300 to-purple-300 shrink-0" />
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs font-semibold text-zinc-900 truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute left-0 mt-2 w-60 rounded-2xl bg-white border border-zinc-200/80 shadow-xl py-2 z-50 text-xs">
                {IS_DEMO_MODE && (
                  <>
                    <div className="px-3.5 py-1.5 text-[11px] font-medium text-zinc-400">
                      Chuyển vai trò Demo
                    </div>
                    <button
                      onClick={() => handleRoleSwitch('GUEST')}
                      className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-zinc-100 text-zinc-700 text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <UserX className="w-4 h-4 text-zinc-400" />
                        <span>Khách vãng lai</span>
                      </span>
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('KhachHang')}
                      className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-zinc-100 text-zinc-700 text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-blue-500" />
                        <span>Khách hàng (User)</span>
                      </span>
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('NhanVien')}
                      className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-zinc-100 text-zinc-700 text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <UserCog className="w-4 h-4 text-purple-500" />
                        <span>Nhân viên (Staff)</span>
                      </span>
                      {currentUser.role === 'NhanVien' && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('QuanLy')}
                      className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-zinc-100 text-zinc-700 text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Quản lý (Admin)</span>
                      </span>
                      {currentUser.role === 'QuanLy' && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>

                    <div className="my-1.5 border-t border-zinc-100" />
                  </>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-zinc-100 text-zinc-700 text-left"
                >
                  <Store className="w-4 h-4 text-zinc-400" />
                  <span>Về trang Cửa hàng (/)</span>
                </button>
                {IS_DEMO_MODE && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      resetDemoData();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-zinc-100 text-zinc-700 text-left"
                  >
                    <RotateCcw className="w-4 h-4 text-zinc-400" />
                    <span>Khôi phục dữ liệu mẫu</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.roles.includes(currentUser.role))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2 rounded-full text-xs transition-colors ${
                        isActive
                          ? 'bg-zinc-200/75 text-zinc-900 font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900 font-medium'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-zinc-600 stroke-[1.75]" />
                      <span>{item.label}</span>
                    </div>
                    {item.isNew ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700">
                        New
                      </span>
                    ) : item.badge ? (
                      <span className="text-[11px] font-medium text-zinc-500">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* Bottom Links */}
        <div className="space-y-1 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-medium text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-zinc-500 stroke-[1.75]" />
            <span>Trang bán hàng</span>
          </button>
          <button
            onClick={() => {
              logoutUser();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-medium text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900 transition-colors"
          >
            <LogOut className="w-4 h-4 text-zinc-500 stroke-[1.75]" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
};
