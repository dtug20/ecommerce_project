import { useState, useCallback } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Modal,
  Dropdown,
  Space,
  Typography,
  Descriptions,
  Divider,
  Image,
  Row,
  Col,
  Card,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MenuProps } from 'antd';

import { ordersApi } from '@/services/api';
import type { Order, OrderItem } from '@/types';
import { formatCurrency, formatDate } from '@/hooks/useFormatters';
import StatusBadge from '@/components/commons/StatusBadge';
import PageHeader from '@/components/commons/PageHeader';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 10;

const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payment Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'COD', label: 'COD' },
  { value: 'Card', label: 'Card' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrderNumber(order: Order): string {
  if (order.invoice) return `#${order.invoice}`;
  if (order.orderNumber) return order.orderNumber;
  return order._id;
}

function getCustomerName(order: Order): string {
  return order.name ?? order.user?.name ?? 'N/A';
}

function getCustomerEmail(order: Order): string {
  return order.email ?? order.user?.email ?? '';
}

function getEffectiveStatus(order: Order): string {
  return order.orderStatus ?? order.status ?? 'pending';
}

function getCartItems(order: Order): OrderItem[] {
  return order.cart ?? order.products ?? [];
}

// ---------------------------------------------------------------------------
// Order Detail Modal
// ---------------------------------------------------------------------------

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => void;
  isUpdating: boolean;
}

function OrderDetailModal({
  order,
  open,
  onClose,
  onStatusChange,
  isUpdating,
}: OrderDetailModalProps) {
  if (!order) return null;

  const items = getCartItems(order);
  const customerName = getCustomerName(order);
  const customerEmail = getCustomerEmail(order);
  const effectiveStatus = getEffectiveStatus(order);

  const subtotal = order.subTotal ?? order.totalAmount ?? 0;
  const total = order.totalAmount ?? order.finalAmount ?? 0;

  const statusMenuItems: MenuProps['items'] = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { type: 'divider' },
    {
      key: 'cancelled',
      label: <span style={{ color: '#ff4d4f' }}>Cancel</span>,
      danger: true,
    },
  ];

  const itemColumns: ColumnsType<OrderItem> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, item) => (
        <Space>
          {(item.img ?? item.image) && (
            <Image
              src={item.img ?? item.image}
              width={40}
              height={40}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
          )}
          <div>
            <div>{item.title}</div>
            {(item.color ?? item.size) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {[item.color, item.size].filter(Boolean).join(', ')}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 60,
      render: (_, item) => item.orderQuantity ?? item.quantity ?? 1,
    },
    {
      title: 'Price',
      key: 'price',
      width: 100,
      render: (_, item) => formatCurrency(item.price),
    },
    {
      title: 'Total',
      key: 'total',
      width: 100,
      render: (_, item) =>
        formatCurrency(item.price * (item.orderQuantity ?? item.quantity ?? 1)),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Order ${getOrderNumber(order)}`}
      width={860}
      footer={
        <Space>
          <Dropdown
            menu={{
              items: statusMenuItems,
              onClick: ({ key }) => onStatusChange(order._id, key),
            }}
            disabled={isUpdating}
          >
            <Button type="primary" loading={isUpdating}>
              Update Status <DownOutlined />
            </Button>
          </Dropdown>
          <Button onClick={onClose}>Close</Button>
        </Space>
      }
    >
      <Row gutter={24} style={{ marginBottom: 24 }}>
        {/* Left: Order Info */}
        <Col xs={24} md={12}>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
            Order Information
          </Typography.Title>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Order Number">{getOrderNumber(order)}</Descriptions.Item>
            <Descriptions.Item label="Order Status">
              <StatusBadge status={effectiveStatus} type="order" />
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <StatusBadge status={order.paymentStatus ?? 'pending'} type="payment" />
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">{order.paymentMethod}</Descriptions.Item>
            <Descriptions.Item label="Order Date">{formatDate(order.createdAt)}</Descriptions.Item>
            {order.trackingNumber && (
              <Descriptions.Item label="Tracking">{order.trackingNumber}</Descriptions.Item>
            )}
            {order.estimatedDelivery && (
              <Descriptions.Item label="Est. Delivery">
                {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Col>

        {/* Right: Customer + Shipping */}
        <Col xs={24} md={12}>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
            Customer Information
          </Typography.Title>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Name">{customerName}</Descriptions.Item>
            <Descriptions.Item label="Email">{customerEmail}</Descriptions.Item>
            <Descriptions.Item label="Phone">
              {order.contact ?? order.user?.email ?? 'N/A'}
            </Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
            Shipping Address
          </Typography.Title>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Address">{order.address ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="City">{order.city ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="ZIP">{order.zipCode ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Country">{order.country ?? 'N/A'}</Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>

      <Divider style={{ marginTop: 0 }} />

      {/* Order Items */}
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        Order Items
      </Typography.Title>
      <Table<OrderItem>
        columns={itemColumns}
        dataSource={items}
        rowKey={(item, idx) => item._id ?? String(idx)}
        expandable={{ childrenColumnName: '__children' }}
        pagination={false}
        size="small"
        style={{ marginBottom: 16 }}
      />

      {/* Totals */}
      <Row justify="end">
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ background: '#fafafa' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text>Subtotal:</Text>
                <Text>{formatCurrency(subtotal)}</Text>
              </Row>
              {(order.discount ?? 0) > 0 && (
                <Row justify="space-between">
                  <Text>Discount:</Text>
                  <Text type="success">-{formatCurrency(order.discount!)}</Text>
                </Row>
              )}
              {(order.shippingCost ?? 0) > 0 && (
                <Row justify="space-between">
                  <Text>Shipping:</Text>
                  <Text>{formatCurrency(order.shippingCost!)}</Text>
                </Row>
              )}
              {(order.tax ?? 0) > 0 && (
                <Row justify="space-between">
                  <Text>Tax:</Text>
                  <Text>{formatCurrency(order.tax!)}</Text>
                </Row>
              )}
              <Divider style={{ margin: '4px 0' }} />
              <Row justify="space-between">
                <Text strong>Total:</Text>
                <Text strong>{formatCurrency(total)}</Text>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      {order.notes && (
        <>
          <Divider />
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            Notes
          </Typography.Title>
          <Text type="secondary">{order.notes}</Text>
        </>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Orders Page
// ---------------------------------------------------------------------------

interface Filters {
  search: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
}

const INITIAL_FILTERS: Filters = {
  search: '',
  status: '',
  paymentStatus: '',
  paymentMethod: '',
};

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [pendingSearch, setPendingSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Debounce for search input
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setPendingSearch(value);
      if (searchTimer) clearTimeout(searchTimer);
      const timer = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: value }));
        setPage(1);
      }, 400);
      setSearchTimer(timer);
    },
    [searchTimer],
  );

  const handleFilterChange = (key: keyof Omit<Filters, 'search'>) => (value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setPendingSearch('');
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const queryKey = ['orders', filters, page];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      ordersApi.getAll({
        page,
        limit: PAGE_LIMIT,
        search: filters.search || undefined,
        status: filters.status || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        paymentMethod: filters.paymentMethod || undefined,
      }),
  });

  // Fetch single order for modal
  const { data: orderDetailData, isFetching: isFetchingDetail } = useQuery({
    queryKey: ['order', selectedOrder?._id],
    queryFn: () => ordersApi.getById(selectedOrder!._id),
    enabled: detailModalOpen && selectedOrder !== null,
  });

  // ---------------------------------------------------------------------------
  // Mutation — update status
  // ---------------------------------------------------------------------------

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(`Order status updated to ${variables.status}`);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  const handleStatusChange = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ id: orderId, status });
  };

  // ---------------------------------------------------------------------------
  // View order detail
  // ---------------------------------------------------------------------------

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedOrder(null);
  };

  // Prefer the freshly-fetched detail over the list-row snapshot
  const modalOrder = orderDetailData?.data ?? selectedOrder;

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: ColumnsType<Order> = [
    {
      title: 'Order #',
      key: 'orderNumber',
      width: 160,
      render: (_, order) => (
        <div>
          <Text strong>{getOrderNumber(order)}</Text>
          {order.trackingNumber && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tracking: {order.trackingNumber}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 180,
      render: (_, order) => (
        <div>
          <div>{getCustomerName(order)}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getCustomerEmail(order)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 200,
      render: (_, order) => {
        const items = getCartItems(order);
        const preview = items.slice(0, 2);
        const extra = items.length - 2;
        return (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </Text>
            {preview.map((item, idx) => (
              <div
                key={item._id ?? idx}
                style={{
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                }}
              >
                {item.title}
              </div>
            ))}
            {extra > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{extra} more
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 130,
      render: (_, order) => (
        <div>
          <Text strong>{formatCurrency(order.totalAmount ?? order.finalAmount ?? 0)}</Text>
          {(order.shippingCost ?? 0) > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                +{formatCurrency(order.shippingCost!)} shipping
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Payment',
      key: 'payment',
      width: 130,
      render: (_, order) => (
        <div>
          <StatusBadge status={order.paymentStatus ?? 'pending'} type="payment" />
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {order.paymentMethod}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, order) => <StatusBadge status={getEffectiveStatus(order)} type="order" />,
    },
    {
      title: 'Date',
      key: 'date',
      width: 160,
      render: (_, order) => (
        <div>
          <div style={{ fontSize: 12 }}>{formatDate(order.createdAt)}</div>
          {order.estimatedDelivery && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Est:{' '}
              {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, order) => {
        const statusMenuItems: MenuProps['items'] = [
          { key: 'pending', label: 'Pending' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'processing', label: 'Processing' },
          { key: 'shipped', label: 'Shipped' },
          { key: 'delivered', label: 'Delivered' },
          { type: 'divider' },
          {
            key: 'cancelled',
            label: <span style={{ color: '#ff4d4f' }}>Cancel</span>,
            danger: true,
          },
        ];

        return (
          <Space size="small">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(order)}
            >
              View
            </Button>
            <Dropdown
              menu={{
                items: statusMenuItems,
                onClick: ({ key }) => handleStatusChange(order._id, key),
              }}
              disabled={updateStatusMutation.isPending}
            >
              <Button size="small">
                Status <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Pagination config
  // ---------------------------------------------------------------------------

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize: PAGE_LIMIT,
    total: data?.pagination?.totalItems ?? 0,
    showSizeChanger: false,
    showTotal: (total) => `${total} orders`,
    onChange: (p) => setPage(p),
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== '' ||
    filters.paymentStatus !== '' ||
    filters.paymentMethod !== '';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <PageHeader title="Order Management" />

      {/* Filters */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap style={{ width: '100%' }}>
          <Input
            placeholder="Search orders..."
            prefix={<SearchOutlined />}
            value={pendingSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Select
            value={filters.status}
            onChange={handleFilterChange('status')}
            options={ORDER_STATUS_OPTIONS}
            style={{ width: 180 }}
          />
          <Select
            value={filters.paymentStatus}
            onChange={handleFilterChange('paymentStatus')}
            options={PAYMENT_STATUS_OPTIONS}
            style={{ width: 190 }}
          />
          <Select
            value={filters.paymentMethod}
            onChange={handleFilterChange('paymentMethod')}
            options={PAYMENT_METHOD_OPTIONS}
            style={{ width: 140 }}
          />
          {hasActiveFilters && (
            <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </Space>
      </Card>

      {/* Table */}
      <Card size="small">
        <Table<Order>
          columns={columns}
          dataSource={data?.data ?? []}
          rowKey="_id"
          loading={isLoading}
          expandable={{ childrenColumnName: '__children' }}
          pagination={pagination}
          scroll={{ x: 1100 }}
          size="small"
        />
      </Card>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={isFetchingDetail ? selectedOrder : (modalOrder ?? null)}
        open={detailModalOpen}
        onClose={handleCloseDetail}
        onStatusChange={handleStatusChange}
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
}
