import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
} from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
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
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import {
  productsApi,
  ordersApi,
  analyticsApi,
} from '@/services/api';
import { useFormatters } from '@/hooks/useFormatters';
import StatusBadge from '@/components/commons/StatusBadge';
import type { Order, Product, MonthlyStats, RevenueDataPoint, RevenueResponse, CustomerGrowthResponse } from '@/types/index';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Reusable KPI card — tinted icon badge + consistent typography & height
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  color: string;
  delta?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

function StatCard({ icon, title, value, color, delta, onClick, loading }: StatCardProps) {
  return (
    <Card
      loading={loading}
      hoverable
      onClick={onClick}
      style={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}1a`,
            color,
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>
            {title}
          </Text>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1.2 }}>{value}</span>
            {delta}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIE_COLORS: Record<string, string> = {
  pending: '#ffc107',
  confirmed: '#6f42c1',
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

// recentOrderColumns is defined inside Dashboard() via useMemo (uses formatCurrency/formatDate from useFormatters hook)

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
    width: 110,
    render: (_: unknown, record: Product) => {
      if (record.quantity === 0) {
        return <Tag color="error">Out of Stock</Tag>;
      }
      return <Tag color="warning">Low Stock</Tag>;
    },
  },
];

// ---------------------------------------------------------------------------
// Revenue period type
// ---------------------------------------------------------------------------

type RevenuePeriod = '7d' | '30d' | '12m';

interface PeriodConfig {
  label: string;
  groupBy: 'day' | 'month';
}

const PERIOD_CONFIG: Record<RevenuePeriod, PeriodConfig> = {
  '7d': { label: '7 Days', groupBy: 'day' },
  '30d': { label: '30 Days', groupBy: 'day' },
  '12m': { label: '12 Months', groupBy: 'month' },
};

// ---------------------------------------------------------------------------
// Main Dashboard component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('30d');
  const { formatCurrency, formatDate } = useFormatters();

  const recentOrderColumns = useMemo<ColumnsType<Order>>(() => [
    {
      title: 'Order #',
      key: 'orderNumber',
      width: 90,
      render: (_: unknown, record: Order) =>
        record.invoice != null ? `#${record.invoice}` : (record.orderNumber ?? '—'),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, record: Order) => record.user?.name ?? record.name ?? '—',
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
  ], [formatCurrency, formatDate]);

  // ----- Analytics query (new unified endpoint) -----

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 1000 * 60 * 2,
  });

  // ----- Revenue chart query -----

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['analyticsRevenue', revenuePeriod],
    queryFn: () =>
      analyticsApi.getRevenue({ groupBy: PERIOD_CONFIG[revenuePeriod].groupBy }),
    staleTime: 1000 * 60 * 5,
  });

  // ----- Top products query -----

  const { data: topProductsData } = useQuery({
    queryKey: ['analyticsTopProducts'],
    queryFn: () => analyticsApi.getTopProducts({ sortBy: 'revenue', period: '30d' }),
    staleTime: 1000 * 60 * 5,
  });

  // ----- Customer growth query -----

  const { data: customerGrowthData } = useQuery({
    queryKey: ['analyticsCustomerGrowth'],
    queryFn: () => analyticsApi.getCustomerGrowth({ groupBy: 'month', period: '6m' }),
    staleTime: 1000 * 60 * 5,
  });

  // ----- Recent orders from analytics -----

  const { data: recentOrdersAnalyticsData, isLoading: loadingRecentOrders } = useQuery({
    queryKey: ['analyticsRecentOrders'],
    queryFn: () => analyticsApi.getRecentOrders(),
    staleTime: 1000 * 60 * 2,
  });

  // ----- Fallback: order stats from legacy endpoint for pie chart -----

  const { data: orderStatsData } = useQuery({
    queryKey: ['orderStats'],
    queryFn: () => ordersApi.getStats(),
  });

  // ----- Low stock products -----

  const { data: lowStockData, isLoading: loadingLowStock } = useQuery({
    queryKey: ['lowStockProducts'],
    queryFn: () =>
      productsApi.getAll({
        'quantity[lte]': 10,
        limit: 5,
      } as Parameters<typeof productsApi.getAll>[0]),
  });

  // ----- Derived data -----

  const analytics = analyticsData?.data;
  const orderStats = orderStatsData?.data;

  // Revenue chart: backend returns { groupBy, rows } — unwrap rows
  const revenueWrapped = revenueData?.data as RevenueResponse | undefined;
  const rawRevenueRows: RevenueDataPoint[] = revenueWrapped?.rows ?? [];
  const revenueChartData: RevenueDataPoint[] = rawRevenueRows.length > 0
    ? rawRevenueRows
    : (orderStats?.monthlyStats ?? []).map((stat: MonthlyStats) => ({
        _id: monthLabel(stat),
        revenue: stat.totalRevenue ?? stat.totalOrders ?? 0,
        orders: stat.totalOrders ?? 0,
      }));

  const chartData = revenueChartData.map((pt) => ({
    // backend row shape: { date|week|month, orderCount, revenue } OR legacy { _id, revenue, orders }
    name: pt._id ?? pt.date ?? pt.week ?? pt.month ?? '',
    revenue: pt.revenue ?? 0,
    orders: pt.orderCount ?? pt.orders ?? 0,
  }));

  const topProducts = Array.isArray(topProductsData?.data) ? topProductsData.data : [];

  // Customer growth: backend returns { groupBy, rows } — unwrap rows
  const growthWrapped = customerGrowthData?.data as CustomerGrowthResponse | undefined;
  const growthRows = growthWrapped?.rows ?? [];
  const customerGrowth = growthRows.map((pt) => ({
    name: pt._id ?? pt.month ?? pt.week ?? '',
    count: pt.newUsers ?? pt.count ?? 0,
  }));

  const recentOrders: Order[] = Array.isArray(recentOrdersAnalyticsData?.data) ? recentOrdersAnalyticsData.data : [];
  const lowStockProducts: Product[] = Array.isArray(lowStockData?.data) ? lowStockData.data : [];

  // Pie chart data — prefer the analytics endpoint (status breakdown), fall back to legacy orderStats
  const pieData = [
    { name: 'Pending', value: analytics?.pendingOrders ?? orderStats?.pendingOrders ?? 0, color: PIE_COLORS.pending },
    { name: 'Confirmed', value: analytics?.confirmedOrders ?? 0, color: PIE_COLORS.confirmed },
    { name: 'Processing', value: analytics?.processingOrders ?? orderStats?.processingOrders ?? 0, color: PIE_COLORS.processing },
    { name: 'Shipped', value: analytics?.shippedOrders ?? orderStats?.shippedOrders ?? 0, color: PIE_COLORS.shipped },
    { name: 'Delivered', value: analytics?.deliveredOrders ?? orderStats?.deliveredOrders ?? 0, color: PIE_COLORS.delivered },
    { name: 'Cancelled', value: analytics?.cancelledOrders ?? orderStats?.cancelledOrders ?? 0, color: PIE_COLORS.cancelled },
  ].filter((entry) => entry.value > 0);

  const totalStatusOrders = pieData.reduce((sum, entry) => sum + entry.value, 0);

  // Revenue change indicator
  const revenueChange = analytics?.revenueChange ?? 0;
  const revenueUp = revenueChange >= 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ padding: '0 4px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Stats Cards Row (6 cards)                                         */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="stretch">
        {/* Total Products */}
        <Col xs={24} sm={12} lg={8} xxl={4}>
          <StatCard
            loading={loadingAnalytics}
            title="Total Products"
            value={analytics?.totalProducts ?? 0}
            icon={<ShoppingOutlined />}
            color="#a42c48"
          />
        </Col>

        {/* Total Orders */}
        <Col xs={24} sm={12} lg={8} xxl={4}>
          <StatCard
            loading={loadingAnalytics}
            title="Total Orders"
            value={analytics?.totalOrders ?? orderStats?.totalOrders ?? 0}
            icon={<ShoppingCartOutlined />}
            color="#007bff"
          />
        </Col>

        {/* Monthly Revenue */}
        <Col xs={24} sm={12} lg={8} xxl={4}>
          <StatCard
            loading={loadingAnalytics}
            title="Monthly Revenue"
            value={formatCurrency(analytics?.monthRevenue ?? 0)}
            icon={<DollarOutlined />}
            color="#28a745"
            delta={
              <Text style={{ fontSize: 12, color: revenueUp ? '#52c41a' : '#ff4d4f' }}>
                {revenueUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(revenueChange).toFixed(1)}%
              </Text>
            }
          />
        </Col>

        {/* Total Users */}
        <Col xs={24} sm={12} lg={8} xxl={4}>
          <StatCard
            loading={loadingAnalytics}
            title="Total Users"
            value={analytics?.totalUsers ?? 0}
            icon={<TeamOutlined />}
            color="#722ed1"
          />
        </Col>

        {/* Pending Orders */}
        <Col xs={24} sm={12} lg={8} xxl={4}>
          <StatCard
            loading={loadingAnalytics}
            title="Pending Orders"
            value={analytics?.pendingOrders ?? orderStats?.pendingOrders ?? 0}
            icon={<ClockCircleOutlined />}
            color="#fa8c16"
            onClick={() => navigate('/orders?status=pending')}
          />
        </Col>

        {/* Out of Stock */}
        <Col xs={24} sm={12} lg={8} xxl={4}>
          <StatCard
            loading={loadingAnalytics}
            title="Out of Stock"
            value={analytics?.outOfStockCount ?? 0}
            icon={<WarningOutlined />}
            color="#dc3545"
            onClick={() => navigate('/products?status=out-of-stock')}
          />
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Revenue Chart                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title="Revenue Overview"
            loading={loadingRevenue}
            extra={
              <Space size={4}>
                {(['7d', '30d', '12m'] as RevenuePeriod[]).map((period) => (
                  <Button
                    key={period}
                    size="small"
                    type={revenuePeriod === period ? 'primary' : 'default'}
                    onClick={() => setRevenuePeriod(period)}
                  >
                    {PERIOD_CONFIG[period].label}
                  </Button>
                ))}
              </Space>
            }
          >
            {chartData.length === 0 ? (
              <div
                style={{
                  height: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">No revenue data available</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis
                    yAxisId="revenue"
                    orientation="left"
                    tickFormatter={(v: number) => formatCurrency(v)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={88}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue'];
                      return [Number(value), 'Orders'];
                    }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a42c48"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#a42c48', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    name="revenue"
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    stroke="#007bff"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#007bff', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    strokeDasharray="4 2"
                    name="orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Pie + Top Products                                                */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Order Status Pie Chart */}
        <Col xs={24} lg={12}>
          <Card title="Order Status Distribution" loading={loadingAnalytics}>
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
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value)} (${totalStatusOrders ? Math.round((Number(value) / totalStatusOrders) * 100) : 0}%)`,
                        name,
                      ]}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend
                      formatter={(value: string, entry) => {
                        const count = (entry?.payload as { value?: number } | undefined)?.value ?? 0;
                        return (
                          <span style={{ fontSize: 12 }}>
                            {value} <Text strong>{count}</Text>
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut center total */}
                <div
                  style={{
                    position: 'absolute',
                    top: '42%',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#a42c48', lineHeight: 1.1 }}>
                    {totalStatusOrders}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Total Orders
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Top Selling Products */}
        <Col xs={24} lg={12}>
          <Card title="Top Selling Products (30 Days)">
            {topProducts.length === 0 ? (
              <div
                style={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">No product data available</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topProducts.map((p) => ({
                    name:
                      p.title.length > 20 ? `${p.title.slice(0, 20)}…` : p.title,
                    revenue: p.totalRevenue,
                    sold: p.totalSold,
                  }))}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => formatCurrency(v)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue'];
                      return [Number(value), 'Units Sold'];
                    }}
                  />
                  <Bar dataKey="revenue" fill="#a42c48" radius={[0, 4, 4, 0]} name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Recent Orders + Customer Growth                                   */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Recent Orders */}
        <Col xs={24} lg={12}>
          <Card
            title="Recent Orders"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last 10 orders
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

        {/* Customer Growth */}
        <Col xs={24} lg={12}>
          <Card title="Customer Growth (6 Months)">
            {customerGrowth.length === 0 ? (
              <div
                style={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">No customer data available</Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={customerGrowth}
                  margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28a745" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#28a745" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip formatter={(v) => [Number(v), 'New Users']} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#28a745"
                    strokeWidth={2.5}
                    fill="url(#colorGrowth)"
                    dot={{ r: 4, fill: '#28a745', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    name="count"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Low Stock Products                                                */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
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
    </div>
  );
}
