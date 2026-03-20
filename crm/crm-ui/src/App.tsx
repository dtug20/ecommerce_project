import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import MainLayout from '@/components/commons/MainLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

// Existing pages
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('@/features/products/ProductsPage'));
const CategoriesPage = lazy(() => import('@/features/categories/CategoriesPage'));
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));

// New: Reviews
const ReviewsPage = lazy(() => import('@/features/reviews/ReviewsPage'));

// Phase 4: Vendors
const VendorsPage = lazy(() => import('@/features/vendors/VendorsPage'));

// Phase 4: Activity Log
const ActivityLogPage = lazy(() => import('@/features/activity-log/ActivityLogPage'));

// New: Coupons
const CouponsPage = lazy(() => import('@/features/coupons/CouponsPage'));

// New: CMS — Pages
const PagesListPage = lazy(() => import('@/features/cms/pages/PagesListPage'));
const PageEditorPage = lazy(() => import('@/features/cms/pages/PageEditorPage'));

// New: CMS — Menus
const MenusPage = lazy(() => import('@/features/cms/menus/MenusPage'));
const MenuEditorPage = lazy(() => import('@/features/cms/menus/MenuEditorPage'));

// New: CMS — Blog
const BlogListPage = lazy(() => import('@/features/cms/blog/BlogListPage'));
const BlogEditorPage = lazy(() => import('@/features/cms/blog/BlogEditorPage'));

// New: CMS — Banners
const BannersPage = lazy(() => import('@/features/cms/banners/BannersPage'));

// New: Settings
const ThemeSettingsPage = lazy(() => import('@/features/settings/ThemeSettingsPage'));
const GeneralSettingsPage = lazy(() => import('@/features/settings/GeneralSettingsPage'));
const PaymentSettingsPage = lazy(() => import('@/features/settings/PaymentSettingsPage'));
const ShippingSettingsPage = lazy(() => import('@/features/settings/ShippingSettingsPage'));
const EmailTemplatesPage = lazy(() => import('@/features/settings/EmailTemplatesPage'));

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
        <Route element={<MainLayout />}>
          <Route path="/" element={<SuspenseRoute><DashboardPage /></SuspenseRoute>} />
          <Route path="/products" element={<SuspenseRoute><ProductsPage /></SuspenseRoute>} />
          <Route path="/categories" element={<SuspenseRoute><CategoriesPage /></SuspenseRoute>} />
          <Route path="/orders" element={<SuspenseRoute><OrdersPage /></SuspenseRoute>} />
          <Route path="/users" element={<SuspenseRoute><UsersPage /></SuspenseRoute>} />

          {/* Reviews */}
          <Route path="/reviews" element={<SuspenseRoute><ReviewsPage /></SuspenseRoute>} />

          {/* Vendors */}
          <Route path="/vendors" element={<SuspenseRoute><VendorsPage /></SuspenseRoute>} />

          {/* Activity Log */}
          <Route path="/activity-log" element={<SuspenseRoute><ActivityLogPage /></SuspenseRoute>} />

          {/* Coupons */}
          <Route path="/coupons" element={<SuspenseRoute><CouponsPage /></SuspenseRoute>} />

          {/* CMS — Pages */}
          <Route path="/cms/pages" element={<SuspenseRoute><PagesListPage /></SuspenseRoute>} />
          <Route path="/cms/pages/new" element={<SuspenseRoute><PageEditorPage /></SuspenseRoute>} />
          <Route path="/cms/pages/:id" element={<SuspenseRoute><PageEditorPage /></SuspenseRoute>} />

          {/* CMS — Menus */}
          <Route path="/cms/menus" element={<SuspenseRoute><MenusPage /></SuspenseRoute>} />
          <Route path="/cms/menus/new" element={<SuspenseRoute><MenuEditorPage /></SuspenseRoute>} />
          <Route path="/cms/menus/:id" element={<SuspenseRoute><MenuEditorPage /></SuspenseRoute>} />

          {/* CMS — Blog */}
          <Route path="/cms/blog" element={<SuspenseRoute><BlogListPage /></SuspenseRoute>} />
          <Route path="/cms/blog/new" element={<SuspenseRoute><BlogEditorPage /></SuspenseRoute>} />
          <Route path="/cms/blog/:id" element={<SuspenseRoute><BlogEditorPage /></SuspenseRoute>} />

          {/* CMS — Banners */}
          <Route path="/cms/banners" element={<SuspenseRoute><BannersPage /></SuspenseRoute>} />

          {/* Settings */}
          <Route path="/settings/theme" element={<SuspenseRoute><ThemeSettingsPage /></SuspenseRoute>} />
          <Route path="/settings/general" element={<SuspenseRoute><GeneralSettingsPage /></SuspenseRoute>} />
          <Route path="/settings/payment" element={<SuspenseRoute><PaymentSettingsPage /></SuspenseRoute>} />
          <Route path="/settings/shipping" element={<SuspenseRoute><ShippingSettingsPage /></SuspenseRoute>} />
          <Route path="/settings/email-templates" element={<SuspenseRoute><EmailTemplatesPage /></SuspenseRoute>} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}
