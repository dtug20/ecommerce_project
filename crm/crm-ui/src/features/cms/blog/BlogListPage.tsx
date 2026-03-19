import { useState, useRef, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Input,
  Select,
  Card,
  Typography,
  Badge,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import { blogApi } from '@/services/api';
import type { BlogPost } from '@/types';
import PageHeader from '@/components/commons/PageHeader';

const { Text } = Typography;

const PAGE_SIZE = 15;
const DEBOUNCE_MS = 300;

const STATUS_COLOR: Record<string, string> = {
  published: 'success',
  draft: 'processing',
  archived: 'default',
};

export default function BlogListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(committedSearch ? { search: committedSearch } : {}),
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts', params],
    queryFn: () => blogApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post deleted');
    },
    onError: () => toast.error('Failed to delete post'),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'unpublish' }) =>
      action === 'publish' ? blogApi.publish(id) : blogApi.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCommittedSearch(value);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const columns: TableProps<BlogPost>['columns'] = [
    {
      title: 'Title',
      key: 'title',
      render: (_: unknown, record: BlogPost) => (
        <div>
          <Text strong>{record.title}</Text>
          {record.featured && (
            <Tag color="gold" style={{ marginLeft: 6, fontSize: 11 }}>
              Featured
            </Tag>
          )}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              /{record.slug}
            </Text>
          </div>
          {record.excerpt && (
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 320,
              }}
            >
              {record.excerpt}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat: string) => cat ? <Tag>{cat}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 160,
      render: (tags: string[]) => (
        <Space size={2} wrap>
          {(tags ?? []).slice(0, 3).map((t) => (
            <Tag key={t} style={{ fontSize: 11 }}>
              {t}
            </Tag>
          ))}
          {(tags ?? []).length > 3 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{tags.length - 3}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => (
        <Badge status={STATUS_COLOR[s] as 'success' | 'processing' | 'default'} text={s} />
      ),
    },
    {
      title: 'Author',
      key: 'author',
      width: 130,
      render: (_: unknown, record: BlogPost) => (
        <Text>{record.author?.name ?? '—'}</Text>
      ),
    },
    {
      title: 'Published',
      key: 'publishedAt',
      width: 130,
      render: (_: unknown, record: BlogPost) =>
        record.publishedAt
          ? dayjs(record.publishedAt).format('MMM D, YYYY')
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      width: 80,
      render: (v: number) => v ?? 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: BlogPost) => (
        <Button.Group size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/cms/blog/${record._id}`)}
          />
          <Button
            icon={<EyeOutlined />}
            onClick={() =>
              publishMutation.mutate({
                id: record._id,
                action: record.status === 'published' ? 'unpublish' : 'publish',
              })
            }
            title={record.status === 'published' ? 'Unpublish' : 'Publish'}
          />
          <Popconfirm
            title="Delete post?"
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
        title="Blog Posts"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/cms/blog/new')}
          >
            New Post
          </Button>
        }
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search posts..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            placeholder="All Statuses"
            value={status || undefined}
            onChange={(v) => {
              setStatus(v ?? '');
              setPage(1);
            }}
            allowClear
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]}
            style={{ width: 150 }}
          />
          <Input
            placeholder="Filter by category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            allowClear
            style={{ width: 180 }}
          />
        </Space>
      </Card>

      <Table<BlogPost>
        rowKey="_id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        scroll={{ x: 1100 }}
        expandable={{ childrenColumnName: '__children' }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.pagination?.totalItems ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `${total} posts`,
          onChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
