import { useState, useRef, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Rate,
  Avatar,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Tooltip,
  Checkbox,
  Descriptions,
  Divider,
  Image,
  DatePicker,
  Empty,
} from 'antd';
import type { TableProps } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  MessageOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarFilled,
  UserOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';

import { reviewsApi } from '@/services/api';
import type { Review } from '@/types';
import PageHeader from '@/components/commons/PageHeader';

const { Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: Review['status']): string {
  if (status === 'approved') return 'green';
  if (status === 'rejected') return 'red';
  return 'orange';
}

function getUserName(review: Review): string {
  if (typeof review.userId === 'object' && review.userId?.name) return review.userId.name;
  return 'Unknown User';
}

function getUserEmail(review: Review): string {
  if (typeof review.userId === 'object' && review.userId?.email) return review.userId.email;
  return '';
}

function getProductTitle(review: Review): string {
  if (typeof review.productId === 'object' && review.productId?.title) return review.productId.title;
  return 'Unknown Product';
}

function getProductImg(review: Review): string | undefined {
  if (typeof review.productId === 'object') return review.productId?.img;
  return undefined;
}

// ---------------------------------------------------------------------------
// Reply Modal
// ---------------------------------------------------------------------------

interface ReplyModalProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
}

function ReplyModal({ review, open, onClose }: ReplyModalProps) {
  const [form] = Form.useForm<{ text: string }>();
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => reviewsApi.reply(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Reply posted successfully');
      onClose();
    },
    onError: () => toast.error('Failed to post reply'),
  });

  const handleSubmit = async () => {
    if (!review) return;
    try {
      const values = await form.validateFields();
      replyMutation.mutate({ id: review._id, text: values.text });
    } catch {
      // validation errors surface on form
    }
  };

  return (
    <Modal
      title="Reply to Review"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Post Reply"
      confirmLoading={replyMutation.isPending}
      width={520}
      afterOpenChange={(visible) => { if (!visible) form.resetFields(); }}
      destroyOnHidden
    >
      {review && (
        <div style={{ marginBottom: 16 }}>
          <Card size="small" style={{ background: '#fafafa', marginBottom: 12 }}>
            <Space>
              <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>by {getUserName(review)}</Text>
            </Space>
            <Paragraph style={{ margin: '8px 0 0', fontSize: 13 }} ellipsis={{ rows: 3 }}>
              {review.comment}
            </Paragraph>
          </Card>
          <Form form={form} layout="vertical">
            <Form.Item
              name="text"
              label="Your Reply"
              rules={[{ required: true, message: 'Reply text is required' }]}
            >
              <Input.TextArea rows={4} placeholder="Write your reply to this review..." showCount maxLength={1000} />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Reject Modal
// ---------------------------------------------------------------------------

interface RejectModalProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
}

function RejectModal({ review, open, onClose }: RejectModalProps) {
  const [form] = Form.useForm<{ reason?: string }>();
  const queryClient = useQueryClient();

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => reviewsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review rejected');
      onClose();
    },
    onError: () => toast.error('Failed to reject review'),
  });

  const handleSubmit = async () => {
    if (!review) return;
    const values = form.getFieldsValue();
    rejectMutation.mutate({ id: review._id, reason: values.reason });
  };

  return (
    <Modal
      title="Reject Review"
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
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Text type="secondary">Optionally provide a reason for rejection:</Text>
        <Form.Item name="reason" style={{ marginTop: 8 }}>
          <Input.TextArea rows={3} placeholder="Reason (optional, not shown to user)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// View Detail Modal
// ---------------------------------------------------------------------------

interface ViewModalProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
}

function ViewModal({ review, open, onClose }: ViewModalProps) {
  if (!review) return null;
  const productImg = getProductImg(review);

  return (
    <Modal
      title="Review Details"
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      width={600}
      destroyOnHidden
    >
      <div style={{ marginTop: 8 }}>
        {/* Product */}
        <Space style={{ marginBottom: 16 }}>
          {productImg ? (
            <Image src={productImg} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />
          ) : (
            <Avatar shape="square" size={48} icon={<StarFilled />} style={{ background: '#f5f5f5', color: '#bbb' }} />
          )}
          <div>
            <Text strong>{getProductTitle(review)}</Text>
          </div>
        </Space>

        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Customer">
            <div>
              <Text strong>{getUserName(review)}</Text>
              <div><Text type="secondary" style={{ fontSize: 12 }}>{getUserEmail(review)}</Text></div>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Rating">
            <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColor(review.status)}>{review.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Verified Purchase">
            {review.isVerifiedPurchase
              ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
              : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          </Descriptions.Item>
          <Descriptions.Item label="Date" span={2}>
            {dayjs(review.createdAt).format('MMM D, YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Comment" span={2}>
            <Paragraph style={{ margin: 0 }}>{review.comment}</Paragraph>
          </Descriptions.Item>
        </Descriptions>

        {review.images && review.images.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Text strong>Review Images</Text>
            <Space style={{ marginTop: 8, flexWrap: 'wrap' }}>
              {review.images.map((img, i) => (
                <Image key={i} src={img} width={72} height={72} style={{ objectFit: 'cover', borderRadius: 4 }} />
              ))}
            </Space>
          </>
        )}

        {review.adminReply && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Card size="small" style={{ background: '#f0f5ff' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Admin Reply — {dayjs(review.adminReply.repliedAt).format('MMM D, YYYY')}</Text>
              <Paragraph style={{ margin: '6px 0 0' }}>{review.adminReply.text}</Paragraph>
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

interface Filters {
  search: string;
  status: string;
  rating: string;
}

const EMPTY_FILTERS: Filters = { search: '', status: '', rating: '' };

export default function ReviewsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [committedSearch, setCommittedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Modal states
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Review | null>(null);
  const [viewTarget, setViewTarget] = useState<Review | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(committedSearch ? { search: committedSearch } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.rating ? { rating: Number(filters.rating) } : {}),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['reviews', queryParams],
    queryFn: () => reviewsApi.getAll(queryParams),
  });

  // Stats derived from pagination/data (a dedicated stats endpoint would be ideal,
  // but we use the current page data as an approximation for the stat cards)
  const statsQuery = useQuery({
    queryKey: ['reviews', 'stats'],
    queryFn: () => reviewsApi.getAll({ limit: 1000 }),
    staleTime: 1000 * 60 * 5,
  });

  const allReviews = statsQuery.data?.data ?? [];
  const pendingCount = allReviews.filter((r) => r.status === 'pending').length;
  const approvedCount = allReviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = allReviews.filter((r) => r.status === 'rejected').length;
  const avgRating =
    allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '—';

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review approved');
    },
    onError: () => toast.error('Failed to approve review'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  // Bulk approve
  const handleBulkApprove = () => {
    const ids = selectedRowKeys as string[];
    Promise.all(ids.map((id) => reviewsApi.approve(id)))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        toast.success(`${ids.length} reviews approved`);
        setSelectedRowKeys([]);
      })
      .catch(() => toast.error('Some approvals failed'));
  };

  // Bulk reject
  const handleBulkReject = () => {
    const ids = selectedRowKeys as string[];
    Promise.all(ids.map((id) => reviewsApi.reject(id)))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        toast.success(`${ids.length} reviews rejected`);
        setSelectedRowKeys([]);
      })
      .catch(() => toast.error('Some rejections failed'));
  };

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
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleOpenReply = (review: Review) => {
    setReplyTarget(review);
    setReplyOpen(true);
  };

  const handleOpenReject = (review: Review) => {
    setRejectTarget(review);
    setRejectOpen(true);
  };

  const handleOpenView = (review: Review) => {
    setViewTarget(review);
    setViewOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: TableProps<Review>['columns'] = [
    {
      title: 'Product',
      key: 'product',
      width: 200,
      render: (_: unknown, record: Review) => {
        const img = getProductImg(record);
        return (
          <Space>
            {img ? (
              <Image
                src={img}
                width={48}
                height={48}
                style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                preview={false}
              />
            ) : (
              <Avatar shape="square" size={48} icon={<StarFilled />} style={{ background: '#f5f5f5', color: '#bbb', flexShrink: 0 }} />
            )}
            <Text
              style={{ maxWidth: 120, fontSize: 13 }}
              ellipsis={{ tooltip: getProductTitle(record) }}
            >
              {getProductTitle(record)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 170,
      render: (_: unknown, record: Review) => (
        <div>
          <Space size={6}>
            <Avatar size={28} icon={<UserOutlined />} src={typeof record.userId === 'object' ? record.userId?.imageURL : undefined} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{getUserName(record)}</div>
              <Text type="secondary" style={{ fontSize: 11 }}>{getUserEmail(record)}</Text>
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: 'Rating',
      key: 'rating',
      width: 140,
      render: (_: unknown, record: Review) => (
        <Rate disabled value={record.rating} style={{ fontSize: 13 }} />
      ),
    },
    {
      title: 'Comment',
      key: 'comment',
      render: (_: unknown, record: Review) => (
        <Text style={{ fontSize: 13 }} ellipsis={{ tooltip: record.comment }}>
          {record.comment.length > 100 ? `${record.comment.slice(0, 100)}…` : record.comment}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: Review) => (
        <Tag color={statusColor(record.status)} style={{ textTransform: 'capitalize' }}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: 'Verified',
      key: 'verified',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: Review) =>
        record.isVerifiedPurchase ? (
          <Tooltip title="Verified Purchase">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          </Tooltip>
        ) : (
          <Tooltip title="Not verified">
            <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
          </Tooltip>
        ),
    },
    {
      title: 'Date',
      key: 'date',
      width: 110,
      render: (_: unknown, record: Review) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(record.createdAt).format('MMM D, YYYY')}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Review) => (
        <Space size={2}>
          <Tooltip title="View">
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenView(record)} />
          </Tooltip>
          {record.status !== 'approved' && (
            <Tooltip title="Approve">
              <Button
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate(record._id)}
              />
            </Tooltip>
          )}
          {record.status !== 'rejected' && (
            <Tooltip title="Reject">
              <Button
                size="small"
                icon={<CloseOutlined />}
                danger
                onClick={() => handleOpenReject(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Reply">
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => handleOpenReply(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete review?"
            description="This action cannot be undone."
            onConfirm={() => deleteMutation.mutate(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button size="small" icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const hasActiveFilters = filters.search !== '' || filters.status !== '' || filters.rating !== '';

  return (
    <div>
      <PageHeader title="Review Moderation" />

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={pendingCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<StarFilled />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Approved"
              value={approvedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Rejected"
              value={rejectedCount}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Avg Rating"
              value={avgRating}
              prefix={<StarFilled style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Input
            placeholder="Search reviews..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Select
            placeholder="All Statuses"
            value={filters.status || undefined}
            onChange={(val) => {
              setFilters((prev) => ({ ...prev, status: val ?? '' }));
              setPage(1);
            }}
            allowClear
            style={{ width: 150 }}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Select
            placeholder="All Ratings"
            value={filters.rating || undefined}
            onChange={(val) => {
              setFilters((prev) => ({ ...prev, rating: val ?? '' }));
              setPage(1);
            }}
            allowClear
            style={{ width: 140 }}
            options={[
              { value: '5', label: '5 Stars' },
              { value: '4', label: '4 Stars' },
              { value: '3', label: '3 Stars' },
              { value: '2', label: '2 Stars' },
              { value: '1', label: '1 Star' },
            ]}
          />
          <RangePicker
            style={{ width: 240 }}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
              } else {
                setDateRange(null);
              }
              setPage(1);
            }}
          />
          {hasActiveFilters && (
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setCommittedSearch('');
                setDateRange(null);
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </Space>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card size="small" style={{ marginBottom: 12, background: '#e6f4ff', border: '1px solid #91caff' }}>
          <Space>
            <Text>{selectedRowKeys.length} selected</Text>
            <Button
              size="small"
              icon={<CheckOutlined />}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
              onClick={handleBulkApprove}
            >
              Bulk Approve
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={handleBulkReject}
            >
              Bulk Reject
            </Button>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              Clear Selection
            </Button>
          </Space>
        </Card>
      )}

      <Table<Review>
        rowKey="_id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading || isFetching}
        scroll={{ x: 1200 }}
        expandable={{ childrenColumnName: '__children' }}
        locale={{ emptyText: <Empty description="No reviews found" /> }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          columnWidth: 40,
        }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.pagination?.totalItems ?? 0,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} reviews`,
          onChange: (p) => setPage(p),
        }}
      />

      {/* Modals */}
      <ReplyModal review={replyTarget} open={replyOpen} onClose={() => setReplyOpen(false)} />
      <RejectModal review={rejectTarget} open={rejectOpen} onClose={() => setRejectOpen(false)} />
      <ViewModal review={viewTarget} open={viewOpen} onClose={() => setViewOpen(false)} />
    </div>
  );
}
