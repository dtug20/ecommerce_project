import { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Select,
  Card,
  Typography,
  Modal,
  Form,
  Input,
  Switch,
  Row,
  Col,
  Badge,
  Segmented,
  ColorPicker,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import { bannersApi } from '@/services/api';
import type { Banner } from '@/types';
import PageHeader from '@/components/commons/PageHeader';
import ImageUpload from '@/components/commons/ImageUpload';

const { Text } = Typography;

const BANNER_TYPE_OPTIONS = [
  { value: 'announcement-bar', label: 'Announcement Bar' },
  { value: 'popup', label: 'Popup' },
  { value: 'hero-slide', label: 'Hero Slide' },
  { value: 'promotional-banner', label: 'Promotional Banner' },
  { value: 'category-banner', label: 'Category Banner' },
];

const BANNER_TYPE_COLOR: Record<string, string> = {
  'announcement-bar': 'cyan',
  popup: 'orange',
  'hero-slide': 'blue',
  'promotional-banner': 'green',
  'category-banner': 'purple',
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'scheduled', label: 'Scheduled' },
];

// ---------------------------------------------------------------------------
// Banner Modal — simplified
// ---------------------------------------------------------------------------

interface BannerFormValues {
  title: string;
  type: Banner['type'];
  status: Banner['status'];
  content_text: string;
  content_textVi: string;
  content_buttonText: string;
  content_buttonUrl: string;
  content_image: string;
  content_backgroundColor: string;
  content_textColor: string;
  scheduling_isAlwaysActive: boolean;
  scheduling_startDate: string;
  scheduling_endDate: string;
  dismissible: boolean;
}

interface BannerModalProps {
  open: boolean;
  editing: Banner | null;
  onClose: () => void;
}

function BannerModal({ open, editing, onClose }: BannerModalProps) {
  const [form] = Form.useForm<BannerFormValues>();
  const queryClient = useQueryClient();
  const isEdit = editing !== null;
  const [scheduled, setScheduled] = useState(false);

  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible) return;
    if (editing) {
      const isAlways = editing.scheduling?.isAlwaysActive ?? true;
      setScheduled(!isAlways);
      form.setFieldsValue({
        title: editing.title,
        type: editing.type,
        status: editing.status,
        content_text: editing.content?.text ?? '',
        content_textVi: editing.content?.textVi ?? '',
        content_buttonText: editing.content?.buttonText ?? '',
        content_buttonUrl: editing.content?.buttonUrl ?? '',
        content_image: editing.content?.image ?? '',
        content_backgroundColor: editing.content?.backgroundColor ?? '#0989FF',
        content_textColor: editing.content?.textColor ?? '#ffffff',
        scheduling_isAlwaysActive: isAlways,
        scheduling_startDate: editing.scheduling?.startDate
          ? dayjs(editing.scheduling.startDate).format('YYYY-MM-DDTHH:mm')
          : '',
        scheduling_endDate: editing.scheduling?.endDate
          ? dayjs(editing.scheduling.endDate).format('YYYY-MM-DDTHH:mm')
          : '',
        dismissible: editing.dismissible ?? false,
      });
    } else {
      form.resetFields();
      setScheduled(false);
      form.setFieldsValue({
        status: 'active',
        type: 'announcement-bar',
        scheduling_isAlwaysActive: true,
        content_backgroundColor: '#0989FF',
        content_textColor: '#ffffff',
        dismissible: true,
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Banner>) => bannersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner created');
      onClose();
    },
    onError: () => toast.error('Failed to create banner'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Banner> }) =>
      bannersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner updated');
      onClose();
    },
    onError: () => toast.error('Failed to update banner'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Partial<Banner> = {
        title: values.title,
        type: values.type,
        status: values.status,
        priority: 0,
        dismissible: values.dismissible,
        content: {
          text: values.content_text,
          textVi: values.content_textVi,
          buttonText: values.content_buttonText,
          buttonUrl: values.content_buttonUrl,
          image: values.content_image,
          backgroundColor: values.content_backgroundColor,
          textColor: values.content_textColor,
        },
        scheduling: {
          isAlwaysActive: !scheduled,
          startDate: scheduled && values.scheduling_startDate
            ? new Date(values.scheduling_startDate).toISOString()
            : undefined,
          endDate: scheduled && values.scheduling_endDate
            ? new Date(values.scheduling_endDate).toISOString()
            : undefined,
        },
        targeting: { pages: ['*'], userSegments: [] },
      };
      if (isEdit && editing) {
        updateMutation.mutate({ id: editing._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch {
      // validation errors
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Banner' : 'New Banner'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Save' : 'Create'}
      confirmLoading={isLoading}
      width={560}
      afterOpenChange={handleAfterOpenChange}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {/* Name + Type */}
        <Form.Item
          name="title"
          label="Banner Name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. Summer Sale" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={14}>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select options={BANNER_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="status" label="Status">
              <Segmented
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Off', value: 'inactive' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Image */}
        <Form.Item name="content_image" label="Banner Image">
          <ImageUpload placeholder="Upload image" width={520} height={160} />
        </Form.Item>

        {/* Text */}
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="content_text" label="Text (EN)">
              <Input placeholder="Free shipping on orders over $50!" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="content_textVi" label="Text (VI)">
              <Input placeholder="Miễn phí vận chuyển cho đơn trên 1.200.000₫!" />
            </Form.Item>
          </Col>
        </Row>

        {/* Button */}
        <Row gutter={12}>
          <Col span={10}>
            <Form.Item name="content_buttonText" label="Button Label">
              <Input placeholder="Shop Now" />
            </Form.Item>
          </Col>
          <Col span={14}>
            <Form.Item name="content_buttonUrl" label="Button URL">
              <Input placeholder="/shop" />
            </Form.Item>
          </Col>
        </Row>

        {/* Colors + Dismissible */}
        <Row gutter={12} align="middle">
          <Col span={7}>
            <Form.Item
              name="content_backgroundColor"
              label="Background"
              getValueFromEvent={(color) => color.toHexString()}
              getValueProps={(hex) => ({ value: hex || '#0989FF' })}
            >
              <ColorPicker format="hex" showText />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item
              name="content_textColor"
              label="Text Color"
              getValueFromEvent={(color) => color.toHexString()}
              getValueProps={(hex) => ({ value: hex || '#ffffff' })}
            >
              <ColorPicker format="hex" showText />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="dismissible" label="Dismissible" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        {/* Schedule toggle */}
        <Row align="middle" style={{ marginBottom: 8 }}>
          <Col flex="auto">
            <Text type="secondary">
              <CalendarOutlined style={{ marginRight: 6 }} />
              Set active dates
            </Text>
          </Col>
          <Col>
            <Switch
              size="small"
              checked={scheduled}
              onChange={setScheduled}
            />
          </Col>
        </Row>
        {scheduled && (
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="scheduling_startDate" label="Start">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduling_endDate" label="End">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  const params = {
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['banners', params],
    queryFn: () => bannersApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner deleted');
    },
    onError: () => toast.error('Failed to delete banner'),
  });

  const columns: TableProps<Banner>['columns'] = [
    {
      title: 'Name',
      key: 'title',
      render: (_: unknown, record: Banner) => (
        <Text strong>{record.title}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 170,
      render: (type: string) => (
        <Tag color={BANNER_TYPE_COLOR[type] ?? 'default'}>
          {BANNER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => (
        <Badge
          status={s === 'active' ? 'success' : s === 'scheduled' ? 'warning' : 'default'}
          text={s}
        />
      ),
    },
    {
      title: 'Schedule',
      key: 'schedule',
      width: 180,
      render: (_: unknown, record: Banner) =>
        record.scheduling?.isAlwaysActive ? (
          <Tag color="green">Always Active</Tag>
        ) : (
          <div>
            <div style={{ fontSize: 12 }}>
              {record.scheduling?.startDate
                ? dayjs(record.scheduling.startDate).format('MMM D, YYYY')
                : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              {record.scheduling?.endDate
                ? `→ ${dayjs(record.scheduling.endDate).format('MMM D, YYYY')}`
                : ''}
            </div>
          </div>
        ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (p: number) => <Tag>{p}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      fixed: 'right' as const,
      render: (_: unknown, record: Banner) => (
        <Button.Group size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete banner?"
            onConfirm={() => deleteMutation.mutate(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Button.Group>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Banners"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Create Banner
          </Button>
        }
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="All Types"
            value={typeFilter || undefined}
            onChange={(v) => setTypeFilter(v ?? '')}
            allowClear
            options={BANNER_TYPE_OPTIONS}
            style={{ width: 180 }}
          />
          <Select
            placeholder="All Statuses"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v ?? '')}
            allowClear
            options={STATUS_OPTIONS}
            style={{ width: 150 }}
          />
        </Space>
      </Card>

      <Table<Banner>
        rowKey="_id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        expandable={{ childrenColumnName: '__children' }}
        pagination={false}
        scroll={{ x: 800 }}
      />

      <BannerModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
