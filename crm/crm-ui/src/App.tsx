import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import MainLayout from '@/components/commons/MainLayout';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('@/features/products/ProductsPage'));
const CategoriesPage = lazy(() => import('@/features/categories/CategoriesPage'));
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));

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
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/products"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductsPage />
              </Suspense>
            }
          />
          <Route
            path="/categories"
            element={
              <Suspense fallback={<PageLoader />}>
                <CategoriesPage />
              </Suspense>
            }
          />
          <Route
            path="/orders"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrdersPage />
              </Suspense>
            }
          />
          <Route
            path="/users"
            element={
              <Suspense fallback={<PageLoader />}>
                <UsersPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}
