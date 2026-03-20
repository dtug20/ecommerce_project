import { useState, useRef, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Avatar,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Tooltip,
  Drawer,
  Tabs,
  InputNumber,
  Descriptions,
  Divider,
  Dropdown,
  Empty,
} from 'antd';
import type { TableProps, MenuProps } from 'antd';
import {
  SearchOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  DollarOutlined,
  EyeOutlined,
  ShopOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { vendorsApi } from '@/services/api';
import type { Vendor, Payout, Product, Order } from '@/types';
import PageHeader from '@/components/commons/PageHeader';
import { formatCurrency, formatDate } from '@/hooks/useFormatters';

const { Text, Paragraph } = Typography;
const PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function verificationColor(status: string): string {
  switch (status) {
    case 'approved': return 'green';
    case 'pending': return 'orange';
    case 'rejected': return 'red';
    case 'suspended': return 'default';
    default: return 'default';
  }
}

function getStoreName(vendor: Vendor): string {
  return vendor.vendorProfile?.storeName ?? vendor.name ?? 'Unnamed Store';
}

function getVerificationStatus(vendor: Vendor): string {
  return vendor.vendorProfile?.verificationStatus ?? 'pending';
}

// ---------------------------------------------------------------------------
// Reject Modal
// ---------------------------------------------------------------------------

interface RejectModalProps {
  vendor: Vendor | null;
  open: boolean;
  onClose: () => void;
}

function RejectModal({ vendor, open, onClose }: RejectModalProps) {
  const [form] = Form.useForm<{ reason: string }>();
  const queryClient = useQueryClient();

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      vendorsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor rejected');
      onClose();
    },
    onError: () => toast.error('Failed to reject vendor'),
  });

  const handleSubmit = async () => {
    if (!vendor) return;
    try {
      const values = await form.validateFields();
      rejectMutation.mutate({ id: vendor._id, reason: values.reason });
    } catch {
      // validation errors shown on form
    }
  };

  return (
    <Modal
      title="Reject Vendor Application"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Reject"
      okButtonProps={{ danger: true }}
      confirmLoading={rejectMutation.isPending}
      width={480}
      afterOpenChange={(visible) => { if (!visible) form.resetFields(); }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="reason"
          label="Rejection Reason"
          rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Explain why this vendor application is being rejected..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Commission Modal
// ---------------------------------------------------------------------------

interface CommissionModalProps {
  vendor: Vendor | null;
  open: boolean;
  onClose: () => void;
}

function CommissionModal({ vendor, open, onClose }: CommissionModalProps) {
  const [form] = Form.useForm<{ commissionRate: number }>();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, commissionRate }: { id: string; commissionRate: number }) =>
      vendorsApi.updateCommission(id, commissionRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Commission rate updated');
      onClose();
    },
    onError: () => toast.error('Failed to update commission'),
  });

  const handleSubmit = async () => {
    if (!vendor) return;
    try {
      const values = await form.validateFields();
      updateMutation.mutate({ id: vendor._id, commissionRate: values.commissionRate });
    } catch {
      // validation errors shown on form
    }
  };

  return (
    <Modal
      title={`Update Commission — ${vendor ? getStoreName(vendor) : ''}`}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Update"
      confirmLoading={updateMutation.isPending}
      width={400}
      afterOpenChange={(visible) => {
        if (visible && vendor) {
          form.setFieldsValue({
            commissionRate: vendor.vendorProfile?.commissionRate ?? 10,
          });
        } else if (!visible) {
          form.resetFields();
        }
      }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="commissionRate"
          label="Commission Rate (%)"
          rules={[
            { required: true, message: 'Commission rate is required' },
            { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            step={0.5}
            precision={2}
            addonAfter="%"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Process Payout Modal
// ---------------------------------------------------------------------------

interface ProcessPayoutModalProps {
  vendorId: string;
  payout: Payout | null;
  open: boolean;
  onClose: () => void;
}

function ProcessPayoutModal({ vendorId, payout, open, onClose }: ProcessPayoutModalProps) {
  const [form] = Form.useForm<{ transactionRef: string; note?: string }>();
  const queryClient = useQueryClient();

  const processMutation = useMutation({
    mutationFn: (data: { transactionRef: string; note?: string }) =>
      vendorsApi.processPayout(vendorId, payout!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorPayouts', vendorId] });
      toast.success('Payout processed successfully');
      onClose();
    },
    onError: () => toast.error('Failed to process payout'),
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      processMutation.mutate(values);
    } catch {
      // validation errors shown on form
    }
  };

  return (
    <Modal
      title="Process Payout"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Process Payout"
      confirmLoading={processMutation.isPending}
      width={460}
      afterOpenChange={(visible) => { if (!visible) form.resetFields(); }}
      destroyOnHidden
    >
      {payout && (
        <div>
          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Amount">
                <Text strong style={{ color: '#52c41a' }}>
                  {formatCurrency(payout.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Currency">{payout.currency}</Descriptions.Item>
              <Descriptions.Item label="Requested">
                {dayjs(payout.requestedAt).format('MMM D, YYYY')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Form form={form} layout="vertical">
            <Form.Item
              name="transactionRef"
              label="Transaction Reference"
              rules={[{ required: true, message: 'Transaction reference is required' }]}
            >
              <Input placeholder="e.g., TXN-20240101-001" />
            </Form.Item>
            <Form.Item name="note" label="Note (optional)">
              <Input.TextArea rows={2} placeholder="Any additional notes about this payout..." />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Vendor Detail Drawer
// ---------------------------------------------------------------------------

interface VendorDrawerProps {
  vendor: Vendor | null;
  open: boolean;
  onClose: () => void;
}

function VendorDrawer({ vendor, open, onClose }: VendorDrawerProps) {
  const [payoutToProcess, setPayoutToProcess] = useState<Payout | null>(null);
  const [processOpen, setProcessOpen] = useState(false);

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['vendorProducts', vendor?._id],
    queryFn: () => vendorsApi.getProducts(vendor!._id, { limit: 10 }),
    enabled: open && vendor != null,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['vendorOrders', vendor?._id],
    queryFn: () => vendorsApi.getOrders(vendor!._id, { limit: 10 }),
    enabled: open && vendor != null,
  });

  const { data: payoutsData, isLoading: loadingPayouts } = useQuery({
    queryKey: ['vendorPayouts', vendor?._id],
    queryFn: () => vendorsApi.getPayouts(vendor!._id, { limit: 20 }),
    enabled: open && vendor != null,
  });

  const productColumns: ColumnsType<Product> = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Price',
      key: 'price',
      width: 90,
      render: (_: unknown, r: Product) => formatCurrency(r.price),
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 70,
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
  ];

  const orderColumns: ColumnsType<Order> = [
    {
      title: 'Order #',
      key: 'invoice',
      width: 90,
      render: (_: unknown, r: Order) => r.invoice != null ? `#${r.invoice}` : (r.orderNumber ?? '—'),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: unknown, r: Order) =>
        formatCurrency(r.finalAmount ?? r.totalAmount ?? r.subTotal ?? 0),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, r: Order) => (
        <Tag>{r.orderStatus ?? r.status ?? 'pending'}</Tag>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: unknown, r: Order) => dayjs(r.createdAt).format('MMM D, YYYY'),
      ellipsis: true,
    },
  ];

  const payoutColumns: ColumnsType<Payout> = [
    {
      title: 'Amount',
      key: 'amount',
      render: (_: unknown, r: Payout) => formatCurrency(r.amount),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, r: Payout) => {
        const colors: Record<string, string> = {
          pending: 'orange',
          processing: 'blue',
          paid: 'green',
          rejected: 'red',
        };
        return <Tag color={colors[r.status] ?? 'default'}>{r.status}</Tag>;
      },
    },
    {
      title: 'Requested',
      key: 'requestedAt',
      render: (_: unknown, r: Payout) => dayjs(r.requestedAt).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, r: Payout) =>
        r.status === 'pending' ? (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setPayoutToProcess(r);
              setProcessOpen(true);
            }}
          >
            Process
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.transactionRef ?? '—'}
          </Text>
        ),
    },
  ];

  if (!vendor) return null;

  const vStatus = getVerificationStatus(vendor);

  return (
    <>
      <Drawer
        title={
          <Space>
            <Avatar
              src={vendor.vendorProfile?.storeLogo}
              icon={<ShopOutlined />}
              size={36}
              style={{ background: '#f0f0f0', color: '#666' }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>{getStoreName(vendor)}</div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                {vendor.email}
              </Text>
            </div>
          </Space>
        }
        open={open}
        onClose={onClose}
        width={720}
        destroyOnHidden
      >
        {/* Store Banner */}
        {vendor.vendorProfile?.storeBanner && (
          <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', height: 120 }}>
            <img
              src={vendor.vendorProfile.storeBanner}
              alt="store banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Basic info */}
        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Owner">{vendor.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{vendor.email}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={verificationColor(vStatus)} style={{ textTransform: 'capitalize' }}>
              {vStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Commission Rate">
            {vendor.vendorProfile?.commissionRate ?? 0}%
          </Descriptions.Item>
          <Descriptions.Item label="Joined" span={2}>
            {formatDate(vendor.createdAt)}
          </Descriptions.Item>
          {vendor.vendorProfile?.storeDescription && (
            <Descriptions.Item label="Description" span={2}>
              <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                {vendor.vendorProfile.storeDescription}
              </Paragraph>
            </Descriptions.Item>
          )}
          {vStatus === 'rejected' && vendor.vendorProfile?.rejectionReason && (
            <Descriptions.Item label="Rejection Reason" span={2}>
              <Text type="danger">{vendor.vendorProfile.rejectionReason}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider style={{ margin: '12px 0' }} />

        {/* Tabs */}
        <Tabs
          defaultActiveKey="products"
          items={[
            {
              key: 'products',
              label: 'Products',
              children: (
                <Table<Product>
                  dataSource={productsData?.data ?? []}
                  columns={productColumns}
                  rowKey="_id"
                  loading={loadingProducts}
                  pagination={{ pageSize: 5, size: 'small' }}
                  size="small"
                  scroll={{ x: 500 }}
                  expandable={{ childrenColumnName: '__children' }}
                />
              ),
            },
            {
              key: 'orders',
              label: 'Orders',
              children: (
                <Table<Order>
                  dataSource={ordersData?.data ?? []}
                  columns={orderColumns}
                  rowKey="_id"
                  loading={loadingOrders}
                  pagination={{ pageSize: 5, size: 'small' }}
                  size="small"
                  scroll={{ x: 500 }}
                  expandable={{ childrenColumnName: '__children' }}
                />
              ),
            },
            {
              key: 'payouts',
              label: 'Payouts',
              children: (
                <Table<Payout>
                  dataSource={payoutsData?.data ?? []}
                  columns={payoutColumns}
                  rowKey="_id"
                  loading={loadingPayouts}
                  pagination={{ pageSize: 5, size: 'small' }}
                  size="small"
                  scroll={{ x: 500 }}
                  expandable={{ childrenColumnName: '__children' }}
                />
              ),
            },
          ]}
        />
      </Drawer>

      <ProcessPayoutModal
        vendorId={vendor._id}
        payout={payoutToProcess}
        open={processOpen}
        onClose={() => {
          setProcessOpen(false);
          setPayoutToProcess(null);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

interface Filters {
  search: string;
  status: string;
}

const EMPTY_FILTERS: Filters = { search: '', status: '' };

export default function VendorsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [committedSearch, setCommittedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [drawerVendor, setDrawerVendor] = useState<Vendor | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Vendor | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [commissionTarget, setCommissionTarget] = useState<Vendor | null>(null);
  const [commissionOpen, setCommissionOpen] = useState(false);

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(committedSearch ? { search: committedSearch } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['vendors', queryParams],
    queryFn: () => vendorsApi.getAll(queryParams),
  });

  const { data: statsData } = useQuery({
    queryKey: ['vendorStats'],
    queryFn: () => vendorsApi.getStats(),
    staleTime: 1000 * 60 * 2,
  });

  const stats = statsData?.data;

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const approveMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorStats'] });
      toast.success('Vendor approved');
    },
    onError: () => toast.error('Failed to approve vendor'),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorStats'] });
      toast.success('Vendor suspended');
    },
    onError: () => toast.error('Failed to suspend vendor'),
  });

  // ---------------------------------------------------------------------------
  // Search debounce
  // ---------------------------------------------------------------------------

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCommittedSearch(value);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: TableProps<Vendor>['columns'] = [
    {
      title: 'Store',
      key: 'store',
      width: 220,
      render: (_: unknown, record: Vendor) => (
        <Space>
          <Avatar
            src={record.vendorProfile?.storeLogo}
            icon={<ShopOutlined />}
            size={40}
            style={{ background: '#f5f5f5', color: '#999', flexShrink: 0 }}
          />
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {getStoreName(record)}
            </Text>
            {record.vendorProfile?.storeSlug && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  /{record.vendorProfile.storeSlug}
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      width: 180,
      render: (_: unknown, record: Vendor) => (
        <div>
          <Text style={{ fontSize: 13 }}>{record.name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: unknown, record: Vendor) => {
        const vs = getVerificationStatus(record);
        return (
          <Tag color={verificationColor(vs)} style={{ textTransform: 'capitalize' }}>
            {vs}
          </Tag>
        );
      },
    },
    {
      title: 'Commission',
      key: 'commission',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Vendor) => (
        <Text>{record.vendorProfile?.commissionRate ?? 0}%</Text>
      ),
    },
    {
      title: 'Joined',
      key: 'joined',
      width: 120,
      render: (_: unknown, record: Vendor) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(record.createdAt).format('MMM D, YYYY')}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: Vendor) => {
        const vs = getVerificationStatus(record);
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => {
              setDrawerVendor(record);
              setDrawerOpen(true);
            },
          },
          ...(vs === 'pending'
            ? [
                {
                  key: 'approve',
                  icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                  label: 'Approve',
                  onClick: () => {
                    Modal.confirm({
                      title: 'Approve vendor?',
                      content: `Approve "${getStoreName(record)}" as a seller on this platform?`,
                      okText: 'Approve',
                      okButtonProps: { style: { background: '#52c41a', borderColor: '#52c41a' } },
                      onOk: () => approveMutation.mutate(record._id),
                    });
                  },
                },
                {
                  key: 'reject',
                  icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                  label: 'Reject',
                  danger: true,
                  onClick: () => {
                    setRejectTarget(record);
                    setRejectOpen(true);
                  },
                },
              ]
            : []),
          ...(vs === 'approved'
            ? [
                {
                  key: 'suspend',
                  icon: <StopOutlined style={{ color: '#faad14' }} />,
                  label: 'Suspend',
                  onClick: () => {
                    Modal.confirm({
                      title: 'Suspend vendor?',
                      content: `Suspend "${getStoreName(record)}"? They will not be able to sell while suspended.`,
                      okText: 'Suspend',
                      okButtonProps: { danger: true },
                      onOk: () => suspendMutation.mutate(record._id),
                    });
                  },
                },
              ]
            : []),
          {
            key: 'commission',
            icon: <DollarOutlined />,
            label: 'Edit Commission',
            onClick: () => {
              setCommissionTarget(record);
              setCommissionOpen(true);
            },
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Tooltip title="Actions">
              <Button icon={<MoreOutlined />} size="small" />
            </Tooltip>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Vendor Management" />

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Vendors"
              value={stats?.total ?? 0}
              valueStyle={{ color: '#1677ff' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={stats?.pending ?? 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Active"
              value={stats?.approved ?? 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Suspended"
              value={stats?.suspended ?? 0}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search vendors..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            placeholder="All Statuses"
            value={filters.status || undefined}
            onChange={(val) => {
              setFilters((prev) => ({ ...prev, status: val ?? '' }));
              setPage(1);
            }}
            allowClear
            style={{ width: 160 }}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Table<Vendor>
        rowKey="_id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading || isFetching}
        scroll={{ x: 900 }}
        expandable={{ childrenColumnName: '__children' }}
        locale={{ emptyText: <Empty description="No vendors found" /> }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.pagination?.totalItems ?? 0,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} vendors`,
          onChange: (p) => setPage(p),
        }}
      />

      {/* Modals & Drawer */}
      <VendorDrawer
        vendor={drawerVendor}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerVendor(null);
        }}
      />
      <RejectModal
        vendor={rejectTarget}
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setRejectTarget(null);
        }}
      />
      <CommissionModal
        vendor={commissionTarget}
        open={commissionOpen}
        onClose={() => {
          setCommissionOpen(false);
          setCommissionTarget(null);
        }}
      />
    </div>
  );
}
