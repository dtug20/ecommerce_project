import { useQuery } from '@tanstack/react-query';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import { productsApi, ordersApi, usersApi, categoriesApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/hooks/useFormatters';
import StatusBadge from '@/components/commons/StatusBadge';
import type { Order, Product, MonthlyStats } from '@/types/index';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIE_COLORS: Record<string, string> = {
  pending: '#ffc107',
  processing: '#007bff',
  shipped: '#17a2b8',
  delivered: '#28a745',
  cancelled: '#dc3545',
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ---------------------------------------------------------------------------
// Helper: format monthly stat label
// ---------------------------------------------------------------------------

function monthLabel(stat: MonthlyStats): string {
  return `${MONTH_NAMES[(stat._id.month ?? 1) - 1]} ${stat._id.year}`;
}

// ---------------------------------------------------------------------------
// Recent Orders columns
// ---------------------------------------------------------------------------

const recentOrderColumns: ColumnsType<Order> = [
  {
    title: 'Order #',
    key: 'orderNumber',
    render: (_: unknown, record: Order) =>
      record.invoice != null ? `#${record.invoice}` : (record.orderNumber ?? '—'),
  },
  {
    title: 'Customer',
    key: 'customer',
    render: (_: unknown, record: Order) =>
      record.user?.name ?? record.name ?? '—',
    ellipsis: true,
  },
  {
    title: 'Amount',
    key: 'amount',
    render: (_: unknown, record: Order) =>
      formatCurrency(record.finalAmount ?? record.totalAmount ?? record.subTotal ?? 0),
  },
  {
    title: 'Status',
    key: 'status',
    render: (_: unknown, record: Order) => (
      <StatusBadge
        status={record.orderStatus ?? record.status ?? 'pending'}
        type="order"
      />
    ),
  },
  {
    title: 'Date',
    key: 'date',
    render: (_: unknown, record: Order) => formatDate(record.createdAt),
    ellipsis: true,
  },
];

// ---------------------------------------------------------------------------
// Low Stock Products columns
// ---------------------------------------------------------------------------

const lowStockColumns: ColumnsType<Product> = [
  {
    title: 'Product',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: 'Qty',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 70,
    align: 'center',
  },
  {
    title: 'Status',
    key: 'stockStatus',
    render: (_: unknown, record: Product) => {
      if (record.quantity === 0) {
        return <Tag color="error">Out of Stock</Tag>;
      }
      return <Tag color="warning">Low Stock</Tag>;
    },
  },
];

// ---------------------------------------------------------------------------
// Main Dashboard component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  // ----- Stats queries -----

  const { data: productStatsData, isLoading: loadingProductStats } = useQuery({
    queryKey: ['productStats'],
    queryFn: () => productsApi.getStats(),
  });

  const { data: orderStatsData, isLoading: loadingOrderStats } = useQuery({
    queryKey: ['orderStats'],
    queryFn: () => ordersApi.getStats(),
  });

  const { data: userStatsData, isLoading: loadingUserStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => usersApi.getStats(),
  });

  const { data: categoryStatsData, isLoading: loadingCategoryStats } = useQuery({
    queryKey: ['categoryStats'],
    queryFn: () => categoriesApi.getStats(),
  });

  // ----- Recent orders query -----

  const { data: recentOrdersData, isLoading: loadingRecentOrders } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: () =>
      ordersApi.getAll({ limit: 5, sort: '-createdAt' }),
  });

  // ----- Low stock products query -----

  const { data: lowStockData, isLoading: loadingLowStock } = useQuery({
    queryKey: ['lowStockProducts'],
    queryFn: () =>
      productsApi.getAll({ 'quantity[lte]': 10, limit: 5 } as Parameters<typeof productsApi.getAll>[0]),
  });

  // ----- Derived data -----

  const productStats = productStatsData?.data;
  const orderStats = orderStatsData?.data;
  const userStats = userStatsData?.data;
  const categoryStats = categoryStatsData?.data;
  const recentOrders: Order[] = recentOrdersData?.data ?? [];
  const lowStockProducts: Product[] = lowStockData?.data ?? [];

  // Monthly sales chart data
  const monthlySalesData = (orderStats?.monthlyStats ?? []).map((stat: MonthlyStats) => ({
    name: monthLabel(stat),
    revenue: stat.totalRevenue,
    orders: stat.totalOrders,
  }));

  // Pie chart data
  const pieData = [
    { name: 'Pending', value: orderStats?.pendingOrders ?? 0, color: PIE_COLORS.pending },
    { name: 'Processing', value: orderStats?.processingOrders ?? 0, color: PIE_COLORS.processing },
    { name: 'Shipped', value: orderStats?.shippedOrders ?? 0, color: PIE_COLORS.shipped },
    { name: 'Delivered', value: orderStats?.deliveredOrders ?? 0, color: PIE_COLORS.delivered },
    { name: 'Cancelled', value: orderStats?.cancelledOrders ?? 0, color: PIE_COLORS.cancelled },
  ].filter((entry) => entry.value > 0);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ padding: '0 4px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Stats Cards Row                                                   */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loadingProductStats} hoverable>
            <Statistic
              title="Total Products"
              value={productStats?.totalProducts ?? 0}
              prefix={<ShoppingOutlined style={{ color: '#a42c48' }} />}
              valueStyle={{ color: '#a42c48' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card loading={loadingOrderStats} hoverable>
            <Statistic
              title="Total Orders"
              value={orderStats?.totalOrders ?? 0}
              prefix={<ShoppingCartOutlined style={{ color: '#007bff' }} />}
              valueStyle={{ color: '#007bff' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card loading={loadingUserStats} hoverable>
            <Statistic
              title="Total Users"
              value={userStats?.totalUsers ?? 0}
              prefix={<TeamOutlined style={{ color: '#28a745' }} />}
              valueStyle={{ color: '#28a745' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card loading={loadingCategoryStats} hoverable>
            <Statistic
              title="Total Categories"
              value={categoryStats?.totalCategories ?? 0}
              prefix={<TagsOutlined style={{ color: '#ffc107' }} />}
              valueStyle={{ color: '#ffc107' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Recent Orders + Low Stock Products                                */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Recent Orders */}
        <Col xs={24} lg={12}>
          <Card
            title="Recent Orders"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last 5 orders
              </Text>
            }
          >
            <Table<Order>
              dataSource={recentOrders}
              columns={recentOrderColumns}
              rowKey="_id"
              loading={loadingRecentOrders}
              expandable={{ childrenColumnName: '__children' }}
              pagination={false}
              size="small"
              scroll={{ x: 500 }}
            />
          </Card>
        </Col>

        {/* Low Stock Products */}
        <Col xs={24} lg={12}>
          <Card
            title="Low Stock Products"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Qty &le; 10
              </Text>
            }
          >
            <Table<Product>
              dataSource={lowStockProducts}
              columns={lowStockColumns}
              rowKey="_id"
              loading={loadingLowStock}
              expandable={{ childrenColumnName: '__children' }}
              pagination={false}
              size="small"
              scroll={{ x: 400 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Charts Row                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]}>
        {/* Monthly Sales Line Chart */}
        <Col xs={24} lg={12}>
          <Card title="Monthly Sales Revenue" loading={loadingOrderStats}>
            {monthlySalesData.length === 0 ? (
              <div
                style={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">No monthly data available</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={monthlySalesData}
                  margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value: number) => formatCurrency(value)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value) => {
                      return [formatCurrency(Number(value)), 'Revenue'];
                    }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a42c48"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#a42c48', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    name="revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Order Status Pie Chart */}
        <Col xs={24} lg={12}>
          <Card title="Order Status Distribution" loading={loadingOrderStats}>
            {pieData.length === 0 ? (
              <div
                style={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">No order data available</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [Number(value), '']}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span style={{ fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
