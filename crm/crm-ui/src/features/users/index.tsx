import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Avatar,
  Tag,
  Badge,
  Modal,
  Form,
  Switch,
  DatePicker,
  Dropdown,
  Descriptions,
  Divider,
  Typography,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Card,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined,
  ClearOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

import { usersApi } from '@/services/api';
import type { User, Order } from '@/types';
import { formatCurrency, formatDate } from '@/hooks/useFormatters';
import StatusBadge from '@/components/commons/StatusBadge';
import PageHeader from '@/components/commons/PageHeader';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIMARY_COLOR = '#a42c48';
const PAGE_SIZE = 10;

const ROLE_TAG_COLORS: Record<string, string> = {
  admin: 'red',
  staff: 'orange',
  user: 'default',
};

const ROLE_OPTIONS = [
  { label: 'All Roles', value: '' },
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
  { label: 'Staff', value: 'staff' },
];

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Blocked', value: 'blocked' },
];

const VERIFIED_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Verified', value: 'true' },
  { label: 'Not Verified', value: 'false' },
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() ?? '?';
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// ---------------------------------------------------------------------------
// UserAvatar
// ---------------------------------------------------------------------------

interface UserAvatarProps {
  user: User;
  size?: number;
}

function UserAvatar({ user, size = 40 }: UserAvatarProps) {
  if (user.avatar) {
    return (
      <Avatar
        src={user.avatar}
        size={size}
        alt={user.name}
        style={{ flexShrink: 0 }}
      />
    );
  }
  return (
    <Avatar
      size={size}
      style={{ backgroundColor: PRIMARY_COLOR, flexShrink: 0, fontWeight: 600 }}
    >
      {getInitial(user.name)}
    </Avatar>
  );
}

// ---------------------------------------------------------------------------
// User Form Modal (Add / Edit)
// ---------------------------------------------------------------------------

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  status: string;
  gender?: string;
  avatar?: string;
  dateOfBirth?: dayjs.Dayjs;
  emailVerified?: boolean;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface UserFormModalProps {
  open: boolean;
  editingUser: User | null;
  onClose: () => void;
}

function UserFormModal({ open, editingUser, onClose }: UserFormModalProps) {
  const [form] = Form.useForm<UserFormData>();
  const queryClient = useQueryClient();
  const isEditing = editingUser !== null;

  const createMutation = useMutation({
    mutationFn: (data: Partial<User> & { password?: string }) =>
      usersApi.create(data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
      form.resetFields();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<User> & { password?: string };
    }) => usersApi.update(id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
      form.resetFields();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to update user');
    },
  });

  // Populate / reset the form whenever the modal opens
  function handleAfterOpenChange(visible: boolean) {
    if (!visible) return;
    if (editingUser) {
      form.setFieldsValue({
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone ?? '',
        role: editingUser.role,
        status: editingUser.status,
        gender: editingUser.gender ?? undefined,
        avatar: editingUser.avatar ?? '',
        dateOfBirth: editingUser.dateOfBirth
          ? dayjs(editingUser.dateOfBirth)
          : undefined,
        emailVerified: editingUser.emailVerified ?? false,
        street: editingUser.address?.street ?? '',
        city: editingUser.address?.city ?? '',
        state: editingUser.address?.state ?? '',
        zipCode: editingUser.address?.zipCode ?? '',
        country: editingUser.address?.country ?? '',
      });
    } else {
      form.resetFields();
    }
  }

  function handleSubmit(values: UserFormData) {
    const payload: Partial<User> & { password?: string } = {
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      role: values.role,
      status: values.status,
      gender: values.gender || undefined,
      avatar: values.avatar || undefined,
      dateOfBirth: values.dateOfBirth
        ? values.dateOfBirth.toISOString()
        : undefined,
      emailVerified: values.emailVerified ?? false,
      address: {
        street: values.street || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        zipCode: values.zipCode || undefined,
        country: values.country || undefined,
      },
    };

    if (values.password) {
      payload.password = values.password;
    }

    if (isEditing && editingUser) {
      updateMutation.mutate({ id: editingUser._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isEditing ? 'Edit User' : 'Add User'}
      open={open}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      afterOpenChange={handleAfterOpenChange}
      onOk={() => form.submit()}
      okText={isEditing ? 'Save Changes' : 'Create User'}
      okButtonProps={{
        loading: isPending,
        style: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
      }}
      width={720}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'user', status: 'active', emailVerified: false }}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="password"
              label="Password"
              rules={
                isEditing
                  ? []
                  : [{ required: true, message: 'Password is required' }]
              }
            >
              <Input.Password
                placeholder={
                  isEditing
                    ? 'Leave blank to keep current'
                    : 'Enter password'
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone">
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="role" label="Role">
              <Select
                options={[
                  { label: 'User', value: 'user' },
                  { label: 'Admin', value: 'admin' },
                  { label: 'Staff', value: 'staff' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Blocked', value: 'blocked' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="gender" label="Gender">
              <Select
                placeholder="Select gender"
                allowClear
                options={GENDER_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="avatar" label="Avatar URL">
              <Input placeholder="https://example.com/avatar.jpg" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dateOfBirth" label="Date of Birth">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="emailVerified"
          label="Email Verified"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider plain style={{ marginBottom: 16 }}>
          Address
        </Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="street" label="Street">
              <Input placeholder="Street address" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="city" label="City">
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="state" label="State">
              <Input placeholder="State" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="zipCode" label="Zip Code">
              <Input placeholder="Zip code" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="country" label="Country">
              <Input placeholder="Country" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// User Detail Modal
// ---------------------------------------------------------------------------

interface UserDetailModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

function UserDetailModal({ user, open, onClose }: UserDetailModalProps) {
  const ordersQuery = useQuery({
    queryKey: ['user-orders', user?._id],
    queryFn: () => usersApi.getUserOrders(user!._id, { limit: 5 }),
    enabled: open && user !== null,
  });

  if (!user) return null;

  const orderColumns: ColumnsType<Order> = [
    {
      title: 'Order #',
      key: 'invoice',
      render: (_: unknown, record: Order) => (
        <Text style={{ fontFamily: 'monospace' }}>
          #{record.invoice ?? record.orderNumber ?? record._id.slice(-6).toUpperCase()}
        </Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => formatDate(val),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: unknown, record: Order) =>
        formatCurrency(
          record.finalAmount ?? record.totalAmount ?? record.subTotal ?? 0,
        ),
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
  ];

  const hasAddress =
    user.address &&
    Object.values(user.address).some((v) => typeof v === 'string' && v.trim() !== '');

  return (
    <Modal
      title="User Details"
      open={open}
      onCancel={onClose}
      footer={
        <Button onClick={onClose}>
          Close
        </Button>
      }
      width={800}
      destroyOnHidden
    >
      <Row gutter={24} style={{ marginBottom: 24, marginTop: 8 }}>
        {/* Left: Avatar block */}
        <Col
          span={8}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            paddingTop: 16,
          }}
        >
          <UserAvatar user={user} size={120} />
          <Typography.Title
            level={5}
            style={{ margin: 0, textAlign: 'center' }}
          >
            {user.name}
          </Typography.Title>
          <Text
            type="secondary"
            style={{ textAlign: 'center', fontSize: 13 }}
          >
            {user.email}
          </Text>
          <Space size={6}>
            <StatusBadge status={user.status} />
            <Tag
              color={ROLE_TAG_COLORS[user.role] ?? 'default'}
              style={{ margin: 0 }}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Tag>
          </Space>
        </Col>

        {/* Right: User info table */}
        <Col span={16}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">
              {user.phone ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              {user.gender
                ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Date of Birth">
              {user.dateOfBirth
                ? dayjs(user.dateOfBirth).format('MMM D, YYYY')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Email Verified">
              {user.emailVerified ? (
                <CheckCircleFilled style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleFilled style={{ color: '#ff4d4f' }} />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Joined">
              {formatDate(user.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Login">
              {user.lastLogin ? formatDate(user.lastLogin) : '—'}
            </Descriptions.Item>
          </Descriptions>

          {hasAddress && (
            <>
              <Divider plain style={{ margin: '12px 0' }}>
                Address
              </Divider>
              <Descriptions column={1} size="small" bordered>
                {user.address?.street && (
                  <Descriptions.Item label="Street">
                    {user.address.street}
                  </Descriptions.Item>
                )}
                {user.address?.city && (
                  <Descriptions.Item label="City">
                    {user.address.city}
                  </Descriptions.Item>
                )}
                {user.address?.state && (
                  <Descriptions.Item label="State">
                    {user.address.state}
                  </Descriptions.Item>
                )}
                {user.address?.zipCode && (
                  <Descriptions.Item label="Zip Code">
                    {user.address.zipCode}
                  </Descriptions.Item>
                )}
                {user.address?.country && (
                  <Descriptions.Item label="Country">
                    {user.address.country}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}
        </Col>
      </Row>

      {/* Order history */}
      <Divider plain>
        Recent Orders
      </Divider>
      <Table<Order>
        dataSource={ordersQuery.data?.data ?? []}
        columns={orderColumns}
        rowKey="_id"
        loading={ordersQuery.isLoading}
        expandable={{ childrenColumnName: '__children' }}
        pagination={false}
        size="small"
        locale={{ emptyText: 'No orders found' }}
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

interface Filters {
  role: string;
  status: string;
  emailVerified: string;
}

const DEFAULT_FILTERS: Filters = {
  role: '',
  status: '',
  emailVerified: '',
};

export default function UsersPage() {
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);

  // Search (raw) + debounced
  const [rawSearch, setRawSearch] = useState('');
  const debouncedSearch = useDebounce(rawSearch, 400);

  // Select filters
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Track the ID being deleted to show per-row loading
  const deletingIdRef = useRef<string | null>(null);

  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Build query params — rebuild whenever deps change
  const queryParams = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: filters.role || undefined,
    status: filters.status || undefined,
    emailVerified:
      filters.emailVerified !== ''
        ? filters.emailVerified === 'true'
        : undefined,
  };

  const usersQuery = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => usersApi.getAll(queryParams),
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      usersApi.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      const label =
        variables.status.charAt(0).toUpperCase() + variables.status.slice(1);
      toast.success(`User ${label.toLowerCase()}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to update status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      deletingIdRef.current = id;
      return usersApi.delete(id);
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      deletingIdRef.current = null;
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      deletingIdRef.current = null;
      toast.error(err.message ?? 'Failed to delete user');
    },
  });

  const handleOpenAdd = useCallback(() => {
    setEditingUser(null);
    setFormModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((user: User) => {
    setEditingUser(user);
    setFormModalOpen(true);
  }, []);

  const handleOpenView = useCallback((user: User) => {
    setViewingUser(user);
    setDetailModalOpen(true);
  }, []);

  function handleClearFilters() {
    setRawSearch('');
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleFilterChange<K extends keyof Filters>(
    key: K,
    value: Filters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function buildStatusMenuItems(user: User): MenuProps['items'] {
    return (
      [
        { label: 'Activate', value: 'active' },
        { label: 'Deactivate', value: 'inactive' },
        { label: 'Block', value: 'blocked' },
      ] as const
    )
      .filter((a) => a.value !== user.status)
      .map((action) => ({
        key: action.value,
        label: action.label,
        onClick: () =>
          statusMutation.mutate({ id: user._id, status: action.value }),
      }));
  }

  const columns: ColumnsType<User> = [
    {
      title: 'Avatar',
      key: 'avatar',
      width: 60,
      render: (_: unknown, record: User) => <UserAvatar user={record} />,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, record: User) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {record.name}
          </Text>
          {record.phone && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Email',
      key: 'email',
      render: (_: unknown, record: User) => (
        <div>
          <Text style={{ display: 'block' }}>{record.email}</Text>
          {record.lastLogin && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last login: {formatDate(record.lastLogin)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (role: string) => (
        <Tag color={ROLE_TAG_COLORS[role] ?? 'default'}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Orders',
      key: 'orders',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: User) => (
        <Badge
          count={record.orders?.length ?? 0}
          showZero
          style={{
            backgroundColor:
              (record.orders?.length ?? 0) > 0 ? PRIMARY_COLOR : '#d9d9d9',
          }}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Verified',
      dataIndex: 'emailVerified',
      key: 'emailVerified',
      width: 80,
      align: 'center' as const,
      render: (verified: boolean) =>
        verified ? (
          <Tooltip title="Email verified">
            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
          </Tooltip>
        ) : (
          <Tooltip title="Email not verified">
            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
          </Tooltip>
        ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (val: string) => formatDate(val),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 190,
      fixed: 'right' as const,
      render: (_: unknown, record: User) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleOpenView(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{ items: buildStatusMenuItems(record) }}
            trigger={['click']}
          >
            <Button size="small" icon={<DownOutlined />}>
              Status
            </Button>
          </Dropdown>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete User"
              description="Are you sure you want to delete this user? This action cannot be undone."
              onConfirm={() => deleteMutation.mutate(record._id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                loading={
                  deleteMutation.isPending &&
                  deletingIdRef.current === record._id
                }
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const users = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination;

  const hasActiveFilters =
    rawSearch !== '' ||
    filters.role !== '' ||
    filters.status !== '' ||
    filters.emailVerified !== '';

  return (
    <>
      {/* Header */}
      <PageHeader
        title="User Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
            style={{
              backgroundColor: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
            }}
          >
            Add User
          </Button>
        }
      />

      {/* Filters */}
      <Card
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={7} lg={6}>
            <Input
              placeholder="Search by name, email..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={rawSearch}
              onChange={(e) => {
                setRawSearch(e.target.value);
                setPage(1);
              }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={4}>
            <Select
              style={{ width: '100%' }}
              value={filters.role}
              onChange={(val) => handleFilterChange('role', val)}
              options={ROLE_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={4}>
            <Select
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(val) => handleFilterChange('status', val)}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={6} md={5} lg={4}>
            <Select
              style={{ width: '100%' }}
              value={filters.emailVerified}
              onChange={(val) => handleFilterChange('emailVerified', val)}
              options={VERIFIED_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              style={{ width: '100%' }}
            >
              Clear
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card styles={{ body: { padding: 0 } }}>
        <Table<User>
          dataSource={users}
          columns={columns}
          rowKey="_id"
          loading={usersQuery.isFetching}
          expandable={{ childrenColumnName: '__children' }}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: pagination?.totalItems ?? 0,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} of ${total} users`,
            onChange: (newPage) => setPage(newPage),
          }}
          locale={{
            emptyText: (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <UserOutlined
                  style={{
                    fontSize: 32,
                    color: '#bfbfbf',
                    display: 'block',
                    marginBottom: 8,
                  }}
                />
                <Text type="secondary">No users found</Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* Add / Edit Modal */}
      <UserFormModal
        open={formModalOpen}
        editingUser={editingUser}
        onClose={() => {
          setFormModalOpen(false);
          setEditingUser(null);
        }}
      />

      {/* Detail Modal */}
      <UserDetailModal
        user={viewingUser}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setViewingUser(null);
        }}
      />
    </>
  );
}
