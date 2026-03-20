import { useState, useRef, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Radio,
  Tag,
  Space,
  Popconfirm,
  Row,
  Col,
  Card,
  Typography,
  Empty,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClearOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import { couponsApi } from '@/services/api';
import type { Coupon } from '@/types';
import PageHeader from '@/components/commons/PageHeader';
import StatusBadge from '@/components/commons/StatusBadge';

const { Text } = Typography;

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

const PRODUCT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'foods', label: 'Foods' },
  { value: 'sports', label: 'Sports' },
];

interface Filters {
  search: string;
  productType: string;
  status: string;
}

const EMPTY_FILTERS: Filters = { search: '', productType: '', status: '' };

// ---------------------------------------------------------------------------
// Coupon Form Modal
// ---------------------------------------------------------------------------

interface CouponModalProps {
  open: boolean;
  editing: Coupon | null;
  onClose: () => void;
}

interface CouponFormValues {
  title: string;
  couponCode: string;
  discountPercentage: number;
  minimumAmount: number;
  productType: string;
  startTime: string;
  endTime: string;
  usageLimit?: number;
  perUserLimit?: number;
  status: 'active' | 'inactive';
}

function CouponModal({ open, editing, onClose }: CouponModalProps) {
  const [form] = Form.useForm<CouponFormValues>();
  const queryClient = useQueryClient();
  const isEdit = editing !== null;

  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible) return;
    if (editing) {
      form.setFieldsValue({
        title: editing.title,
        couponCode: editing.couponCode,
        discountPercentage: editing.discountPercentage,
        minimumAmount: editing.minimumAmount,
        productType: editing.productType,
        startTime: editing.startTime ? dayjs(editing.startTime).format('YYYY-MM-DDTHH:mm') : '',
        endTime: editing.endTime ? dayjs(editing.endTime).format('YYYY-MM-DDTHH:mm') : '',
        usageLimit: editing.usageLimit,
        perUserLimit: editing.perUserLimit,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'active', discountPercentage: 10, minimumAmount: 0 });
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Coupon>) => couponsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created successfully');
      onClose();
    },
    onError: () => toast.error('Failed to create coupon'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) =>
      couponsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon updated successfully');
      onClose();
    },
    onError: () => toast.error('Failed to update coupon'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Partial<Coupon> = {
        ...values,
        couponCode: values.couponCode.toUpperCase(),
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      };
      if (isEdit && editing) {
        updateMutation.mutate({ id: editing._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch {
      // validation errors surface on the form
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Coupon' : 'Create Coupon'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Update' : 'Create'}
      confirmLoading={isLoading}
      width={640}
      afterOpenChange={handleAfterOpenChange}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Title is required' }]}
            >
              <Input placeholder="Summer Sale 20% Off" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="couponCode"
              label="Coupon Code"
              rules={[{ required: true, message: 'Coupon code is required' }]}
              normalize={(v: string) => v?.toUpperCase()}
            >
              <Input placeholder="SUMMER20" style={{ fontFamily: 'monospace', fontWeight: 600 }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="productType"
              label="Product Type"
              rules={[{ required: true, message: 'Product type is required' }]}
            >
              <Select
                options={PRODUCT_TYPE_OPTIONS.filter((o) => o.value !== '')}
                placeholder="Select product type"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="discountPercentage"
              label="Discount (%)"
              rules={[{ required: true, message: 'Discount is required' }]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} suffix="%" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="minimumAmount"
              label="Minimum Order Amount"
              rules={[{ required: true, message: 'Minimum amount is required' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="$" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="startTime"
              label="Start Date & Time"
              rules={[{ required: true, message: 'Start time is required' }]}
            >
              <Input type="datetime-local" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="endTime"
              label="End Date & Time"
              rules={[{ required: true, message: 'End time is required' }]}
            >
              <Input type="datetime-local" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="usageLimit" label="Total Usage Limit">
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Unlimited" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="perUserLimit" label="Per User Limit">
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Unlimited" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="status" label="Status">
          <Radio.Group>
            <Radio value="active">Active</Radio>
            <Radio value="inactive">Inactive</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [committedSearch, setCommittedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(committedSearch ? { search: committedSearch } : {}),
    ...(filters.productType ? { productType: filters.productType } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['coupons', queryParams],
    queryFn: () => couponsApi.getAll(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
    onError: () => toast.error('Failed to delete coupon'),
  });

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCommittedSearch(value);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setModalOpen(true);
  };

  const columns: TableProps<Coupon>['columns'] = [
    {
      title: 'Code',
      dataIndex: 'couponCode',
      key: 'code',
      width: 150,
      render: (code: string) => (
        <Tag
          icon={<GiftOutlined />}
          color="blue"
          style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}
        >
          {code}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: 'Discount',
      dataIndex: 'discountPercentage',
      key: 'discount',
      width: 100,
      render: (v: number) => <Tag color="volcano">{v}%</Tag>,
    },
    {
      title: 'Min Amount',
      dataIndex: 'minimumAmount',
      key: 'minAmount',
      width: 130,
      render: (v: number) => `$${v.toFixed(2)}`,
    },
    {
      title: 'Product Type',
      dataIndex: 'productType',
      key: 'productType',
      width: 130,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Start',
      dataIndex: 'startTime',
      key: 'start',
      width: 140,
      render: (v: string) => dayjs(v).format('MMM D, YYYY'),
    },
    {
      title: 'End',
      dataIndex: 'endTime',
      key: 'end',
      width: 140,
      render: (v: string) => dayjs(v).format('MMM D, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Usage',
      key: 'usage',
      width: 90,
      render: (_: unknown, record: Coupon) =>
        record.usageLimit
          ? `${record.usageCount ?? 0} / ${record.usageLimit}`
          : `${record.usageCount ?? 0}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      fixed: 'right' as const,
      render: (_: unknown, record: Coupon) => (
        <Button.Group size="small">
          <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
          <Popconfirm
            title="Delete coupon?"
            description="This action cannot be undone."
            onConfirm={() => deleteMutation.mutate(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
          </Popconfirm>
        </Button.Group>
      ),
    },
  ];

  const hasActiveFilters =
    filters.search !== '' || filters.productType !== '' || filters.status !== '';

  return (
    <div>
      <PageHeader
        title="Coupons"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Create Coupon
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder="Search coupons..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Select
            placeholder="All Types"
            value={filters.productType || undefined}
            onChange={(val) => {
              setFilters((prev) => ({ ...prev, productType: val ?? '' }));
              setPage(1);
            }}
            allowClear
            options={PRODUCT_TYPE_OPTIONS}
            style={{ width: 160 }}
          />
          <Select
            placeholder="All Statuses"
            value={filters.status || undefined}
            onChange={(val) => {
              setFilters((prev) => ({ ...prev, status: val ?? '' }));
              setPage(1);
            }}
            allowClear
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            style={{ width: 140 }}
          />
          {hasActiveFilters && (
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setCommittedSearch('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </Space>
      </Card>

      <Table<Coupon>
        rowKey="_id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading || isFetching}
        scroll={{ x: 1100 }}
        expandable={{ childrenColumnName: '__children' }}
        locale={{ emptyText: <Empty description="No coupons found" /> }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.pagination?.totalItems ?? 0,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} coupons`,
          onChange: (p) => setPage(p),
        }}
      />

      <CouponModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
    </div>
  );
}
