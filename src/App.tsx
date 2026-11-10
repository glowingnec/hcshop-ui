import React, { Suspense, lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { StorefrontLayout } from './components/layout/StorefrontLayout';
import { CatalogPage } from './pages/storefront/CatalogPage';
import { ProductDetailPage } from './pages/storefront/ProductDetailPage';
import { CartPage } from './pages/storefront/CartPage';
import { CheckoutPage } from './pages/storefront/CheckoutPage';
import { WishlistPage } from './pages/storefront/WishlistPage';
import { VoucherWalletPage } from './pages/storefront/VoucherWalletPage';
import { AuthPage } from './pages/storefront/AuthPage';
import { CustomerAccountPage } from './pages/storefront/CustomerAccountPage';
import { CustomerOrdersPage } from './pages/storefront/CustomerOrdersPage';

const PortalLayout = lazy(() =>
  import('./components/layout/PortalLayout').then((m) => ({ default: m.PortalLayout }))
);
const ReportsAndAnalyticsPage = lazy(() =>
  import('./pages/portal/ReportsAndAnalyticsPage').then((m) => ({
    default: m.ReportsAndAnalyticsPage,
  }))
);
const OrderManagementPage = lazy(() =>
  import('./pages/portal/OrderManagementPage').then((m) => ({
    default: m.OrderManagementPage,
  }))
);
const CatalogManagementPage = lazy(() =>
  import('./pages/portal/CatalogManagementPage').then((m) => ({
    default: m.CatalogManagementPage,
  }))
);
const InventoryManagementPage = lazy(() =>
  import('./pages/portal/InventoryManagementPage').then((m) => ({
    default: m.InventoryManagementPage,
  }))
);
const VoucherManagementPage = lazy(() =>
  import('./pages/portal/VoucherManagementPage').then((m) => ({
    default: m.VoucherManagementPage,
  }))
);
const ReviewModerationPage = lazy(() =>
  import('./pages/portal/ReviewModerationPage').then((m) => ({
    default: m.ReviewModerationPage,
  }))
);
const AccountManagementPage = lazy(() =>
  import('./pages/portal/AccountManagementPage').then((m) => ({
    default: m.AccountManagementPage,
  }))
);

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-zinc-900">
          <Suspense fallback={<div className="p-8 text-xs text-zinc-400">Đang tải...</div>}>
            <Routes>
              {/* Customer Storefront Routes */}
              <Route path="/" element={<StorefrontLayout />}>
                <Route index element={<CatalogPage />} />
                <Route path="product/:id" element={<ProductDetailPage />} />
                <Route path="products/:id" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="vouchers" element={<VoucherWalletPage />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="account" element={<CustomerAccountPage />} />
                <Route path="orders" element={<CustomerOrdersPage />} />
              </Route>

              {/* Staff & Admin Back-Office Portal Routes */}
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<ReportsAndAnalyticsPage />} />
                <Route path="orders" element={<OrderManagementPage />} />
                <Route path="inventory" element={<InventoryManagementPage />} />
                <Route path="products" element={<CatalogManagementPage />} />
                <Route path="vouchers" element={<VoucherManagementPage />} />
                <Route path="reviews" element={<ReviewModerationPage />} />
                <Route path="accounts" element={<AccountManagementPage />} />
              </Route>
            </Routes>
          </Suspense>
        </div>
      </AppProvider>
    </HashRouter>
  );
};
