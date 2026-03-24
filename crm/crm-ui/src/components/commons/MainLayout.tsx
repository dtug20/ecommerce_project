import { Breadcrumb, Layout, Menu } from 'antd';
import type { ItemType } from 'antd/es/menu/interface';
import {
  DashboardOutlined,
  LogoutOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TagsOutlined,
  TeamOutlined,
  FileTextOutlined,
  MenuOutlined,
  NotificationOutlined,
  EditOutlined,
  SettingOutlined,
  BgColorsOutlined,
  InfoCircleOutlined,
  CreditCardOutlined,
  CarOutlined,
  MailOutlined,
  GiftOutlined,
  PictureOutlined,
  StarOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAppStore from '@/stores/appStore';

const { Sider, Content, Header } = Layout;

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

interface FlatNavItem {
  key: string;
  label: string;
  path: string;
}

// Flat list used for selected-key and title resolution
const FLAT_NAV: FlatNavItem[] = [
  { key: '/', label: 'Dashboard', path: '/' },
  { key: '/products', label: 'Products', path: '/products' },
  { key: '/categories', label: 'Categories', path: '/categories' },
  { key: '/orders', label: 'Orders', path: '/orders' },
  { key: '/users', label: 'Users', path: '/users' },
  { key: '/vendors', label: 'Vendors', path: '/vendors' },
  { key: '/reviews', label: 'Reviews', path: '/reviews' },
  { key: '/coupons', label: 'Coupons', path: '/coupons' },
  { key: '/cms/pages', label: 'Pages', path: '/cms/pages' },
  { key: '/cms/menus', label: 'Menus', path: '/cms/menus' },
  { key: '/cms/blog', label: 'Blog', path: '/cms/blog' },
  { key: '/cms/banners', label: 'Banners', path: '/cms/banners' },
  { key: '/settings/theme', label: 'Theme', path: '/settings/theme' },
  { key: '/settings/general', label: 'General', path: '/settings/general' },
  { key: '/settings/payment', label: 'Payment', path: '/settings/payment' },
  { key: '/settings/shipping', label: 'Shipping', path: '/settings/shipping' },
  { key: '/settings/email-templates', label: 'Email Templates', path: '/settings/email-templates' },
  { key: '/activity-log', label: 'Activity Log', path: '/activity-log' },
];

function resolveSelectedKey(pathname: string): string {
  if (pathname === '/') return '/';
  const match = FLAT_NAV
    .filter((item) => item.path !== '/' && pathname.startsWith(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.key ?? '/';
}

function resolvePageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  const match = FLAT_NAV
    .filter((item) => item.path !== '/' && pathname.startsWith(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.label ?? 'Dashboard';
}

// Keys that should be open when a child is selected
function resolveOpenKeys(pathname: string): string[] {
  const open: string[] = [];
  if (pathname.startsWith('/cms')) open.push('sub-cms');
  if (pathname.startsWith('/settings')) open.push('sub-settings');
  return open;
}

// ---------------------------------------------------------------------------
// Menu item tree
// ---------------------------------------------------------------------------

const MENU_ITEMS: ItemType[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/products',
    icon: <ShoppingOutlined />,
    label: 'Products',
  },
  {
    key: '/categories',
    icon: <TagsOutlined />,
    label: 'Categories',
  },
  {
    key: '/orders',
    icon: <ShoppingCartOutlined />,
    label: 'Orders',
  },
  {
    key: '/users',
    icon: <TeamOutlined />,
    label: 'Users',
  },
  {
    key: '/vendors',
    icon: <ShopOutlined />,
    label: 'Vendors',
  },
  {
    key: '/reviews',
    icon: <StarOutlined />,
    label: 'Reviews',
  },
  {
    key: '/coupons',
    icon: <GiftOutlined />,
    label: 'Coupons',
  },
  {
    key: 'sub-cms',
    icon: <EditOutlined />,
    label: 'CMS',
    children: [
      { key: '/cms/pages', icon: <FileTextOutlined />, label: 'Pages' },
      { key: '/cms/menus', icon: <MenuOutlined />, label: 'Menus' },
      { key: '/cms/blog', icon: <EditOutlined />, label: 'Blog' },
      { key: '/cms/banners', icon: <PictureOutlined />, label: 'Banners' },
    ],
  },
  {
    key: 'sub-settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    children: [
      { key: '/settings/theme', icon: <BgColorsOutlined />, label: 'Theme' },
      { key: '/settings/general', icon: <InfoCircleOutlined />, label: 'General' },
      { key: '/settings/payment', icon: <CreditCardOutlined />, label: 'Payment' },
      { key: '/settings/shipping', icon: <CarOutlined />, label: 'Shipping' },
      { key: '/settings/email-templates', icon: <MailOutlined />, label: 'Email Templates' },
    ],
  },
  {
    key: '/activity-log',
    icon: <AuditOutlined />,
    label: 'Activity Log',
  },
];

// Suppress unused import warnings for icons only used in labels
void NotificationOutlined;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { authApi } from '@/services/api';

export default function MainLayout() {
  const { sidebarCollapsed, toggleSidebar, user, setUser } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Hydrate user session from CRM backend on mount
  useEffect(() => {
    if (!user) {
      authApi.getMe()
        .then(data => {
          console.log('[MainLayout] /api/me response:', data);
          if (data && data.roles) {
            setUser(data);
          } else {
            console.warn('[MainLayout] /api/me returned unexpected format:', data);
          }
        })
        .catch((err) => {
          console.error('[MainLayout] /api/me failed:', err);
        });
    }
  }, [user, setUser]);

  // Detect shipper-only role
  const roles = user?.roles || [];
  const isShipper = roles.some(r => r.toLowerCase() === 'shipper') &&
                    !roles.some(r => ['admin', 'manager', 'staff'].includes(r.toLowerCase()));

  // Filter sidebar: shippers can only see Orders
  const displayMenuItems = isShipper
    ? MENU_ITEMS.filter(item => (item as any)?.key === '/orders')
    : MENU_ITEMS;

  // Redirect shippers away from non-order pages
  useEffect(() => {
    if (user && isShipper && !location.pathname.startsWith('/orders') && location.pathname !== '/logout') {
      navigate('/orders', { replace: true });
    }
  }, [user, isShipper, location.pathname, navigate]);

  const selectedKey = resolveSelectedKey(location.pathname);
  const pageTitle = resolvePageTitle(location.pathname);
  const defaultOpenKeys = resolveOpenKeys(location.pathname);

  function handleMenuClick({ key }: { key: string }) {
    // Ignore sub-menu group keys (they don't map to routes)
    if (key.startsWith('sub-')) return;
    navigate(key);
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        theme="dark"
        width={220}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: sidebarCollapsed ? '18px 0' : '18px 20px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            transition: 'padding 0.2s',
          }}
        >
          <ShopOutlined style={{ fontSize: 22, color: '#1677ff', flexShrink: 0 }} />
          {!sidebarCollapsed && (
            <span
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 0.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              Shofy CRM
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={defaultOpenKeys}
          items={displayMenuItems as any}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 48,
            width: '100%',
            padding: sidebarCollapsed ? '8px' : '8px 12px',
          }}
        >
          <a
            href="/logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 10,
              padding: '8px 12px',
              color: 'rgba(255,255,255,0.65)',
              borderRadius: 6,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          >
            <LogoutOutlined />
            {!sidebarCollapsed && <span>Logout</span>}
          </a>
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: sidebarCollapsed ? 80 : 220,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 56,
            lineHeight: '56px',
          }}
        >
          <Breadcrumb
            items={[
              { title: 'Shofy CRM' },
              { title: pageTitle },
            ]}
          />
        </Header>

        <Content
          style={{
            padding: 24,
            minHeight: 'calc(100vh - 56px)',
            background: '#f5f6fa',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
