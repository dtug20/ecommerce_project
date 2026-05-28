import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import MainLayout from '@/components/commons/MainLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

// Existing pages
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('@/features/products/ProductsPage'));
const CurrencyAuditPage = lazy(() => import('@/features/products/CurrencyAuditPage'));
const CategoriesPage = lazy(() => import('@/features/categories/CategoriesPage'));
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));

// Phase 4: Vendors
const VendorsPage = lazy(() => import('@/features/vendors/VendorsPage'));

// Phase 4: Activity Log
const ActivityLogPage = lazy(() => import('@/features/activity-log/ActivityLogPage'));

// New: Coupons
const CouponsPage = lazy(() => import('@/features/coupons/CouponsPage'));

// Phase 6: Chatbot Analytics
const ChatbotAnalyticsPage = lazy(() => import('@/features/chatbot/ChatbotAnalyticsPage'));

// New: CMS — Blog
const BlogListPage = lazy(() => import('@/features/cms/blog/BlogListPage'));
const BlogEditorPage = lazy(() => import('@/features/cms/blog/BlogEditorPage'));

// New: CMS — Banners
const BannersPage = lazy(() => import('@/features/cms/banners/BannersPage'));

// New: Settings
const GeneralSettingsPage = lazy(() => import('@/features/settings/GeneralSettingsPage'));
const PaymentSettingsPage = lazy(() => import('@/features/settings/PaymentSettingsPage'));
const ShippingSettingsPage = lazy(() => import('@/features/settings/ShippingSettingsPage'));
const TaxSettingsPage = lazy(() => import('@/features/settings/TaxSettingsPage'));

// No-access landing page (authenticated user without CRM role)
const NoAccessPage = lazy(() => import('@/features/no-access/NoAccessPage'));

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
      }}
    >
      <Spin size="large" />
    </div>
  );
}

function SuspenseRoute({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#a42c48',
        },
      }}
    >
      <Routes>
        {/* Standalone routes (no MainLayout shell) */}
        <Route path="/no-access" element={<SuspenseRoute><NoAccessPage /></SuspenseRoute>} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<SuspenseRoute><DashboardPage /></SuspenseRoute>} />
          <Route path="/products" element={<SuspenseRoute><ProductsPage /></SuspenseRoute>} />
          <Route path="/products/currency-audit" element={<SuspenseRoute><CurrencyAuditPage /></SuspenseRoute>} />
          <Route path="/categories" element={<SuspenseRoute><CategoriesPage /></SuspenseRoute>} />
          <Route path="/orders" element={<SuspenseRoute><OrdersPage /></SuspenseRoute>} />
          <Route path="/users" element={<SuspenseRoute><UsersPage /></SuspenseRoute>} />

          {/* Vendors */}
          <Route path="/vendors" element={<SuspenseRoute><VendorsPage /></SuspenseRoute>} />

          {/* Activity Log */}
          <Route path="/activity-log" element={<SuspenseRoute><ActivityLogPage /></SuspenseRoute>} />

          {/* Coupons */}
          <Route path="/coupons" element={<SuspenseRoute><CouponsPage /></SuspenseRoute>} />

          {/* Chatbot Analytics */}
          <Route path="/chatbot" element={<SuspenseRoute><ChatbotAnalyticsPage /></SuspenseRoute>} />

          {/* CMS — Blog */}
          <Route path="/cms/blog" element={<SuspenseRoute><BlogListPage /></SuspenseRoute>} />
          <Route path="/cms/blog/new" element={<SuspenseRoute><BlogEditorPage /></SuspenseRoute>} />
          <Route path="/cms/blog/:id" element={<SuspenseRoute><BlogEditorPage /></SuspenseRoute>} />

          {/* CMS — Banners */}
          <Route path="/cms/banners" element={<SuspenseRoute><BannersPage /></SuspenseRoute>} />

          {/* Settings */}
          <Route path="/settings/general" element={<SuspenseRoute><GeneralSettingsPage /></SuspenseRoute>} />
          <Route path="/settings/payment" element={<SuspenseRoute><PaymentSettingsPage /></SuspenseRoute>} />
          <Route path="/settings/shipping" element={<SuspenseRoute><ShippingSettingsPage /></SuspenseRoute>} />
          <Route path="/settings/tax" element={<SuspenseRoute><TaxSettingsPage /></SuspenseRoute>} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}
