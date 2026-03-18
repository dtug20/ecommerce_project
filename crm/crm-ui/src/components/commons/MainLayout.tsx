import { Breadcrumb, Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  LogoutOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAppStore from '@/stores/appStore';

const { Sider, Content, Header } = Layout;

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard', path: '/' },
  {
    key: '/products',
    icon: <ShoppingOutlined />,
    label: 'Products',
    path: '/products',
  },
  {
    key: '/categories',
    icon: <TagsOutlined />,
    label: 'Categories',
    path: '/categories',
  },
  {
    key: '/orders',
    icon: <ShoppingCartOutlined />,
    label: 'Orders',
    path: '/orders',
  },
  { key: '/users', icon: <TeamOutlined />, label: 'Users', path: '/users' },
];

function resolveSelectedKey(pathname: string): string {
  // Exact match first, then longest prefix
  const match = NAV_ITEMS.filter((item) =>
    pathname === '/' ? item.path === '/' : pathname.startsWith(item.path) && item.path !== '/',
  ).sort((a, b) => b.path.length - a.path.length)[0];

  return match?.key ?? '/';
}

function resolvePageTitle(pathname: string): string {
  const item = NAV_ITEMS.find((nav) =>
    pathname === '/' ? nav.path === '/' : pathname.startsWith(nav.path) && nav.path !== '/',
  );
  return item?.label ?? 'Dashboard';
}

export default function MainLayout() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = resolveSelectedKey(location.pathname);
  const pageTitle = resolvePageTitle(location.pathname);

  const menuItems = NAV_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  function handleMenuClick({ key }: { key: string }) {
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
          items={menuItems}
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
