import { useState } from 'react';
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
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import { pagesApi } from '@/services/api';
import type { Page } from '@/types';
import PageHeader from '@/components/commons/PageHeader';
import StatusBadge from '@/components/commons/StatusBadge';

const { Text } = Typography;

const PAGE_TYPE_COLORS: Record<string, string> = {
  home: 'gold',
  landing: 'geekblue',
  custom: 'purple',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function PagesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['cms-pages', { page, search: committedSearch, status }],
    queryFn: () =>
      pagesApi.getAll({
        page,
        limit: 15,
        search: committedSearch || undefined,
        status: status || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      toast.success('Page deleted');
    },
    onError: () => toast.error('Failed to delete page'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => pagesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      toast.success('Page duplicated');
    },
    onError: () => toast.error('Failed to duplicate page'),
  });

  const handleSearchCommit = (value: string) => {
    setCommittedSearch(value);
    setPage(1);
  };

  const columns: TableProps<Page>['columns'] = [
    {
      title: 'Title',
      key: 'title',
      render: (_: unknown, record: Page) => (
        <div>
          <Text strong>{record.title}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              /{record.slug}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => (
        <Tag color={PAGE_TYPE_COLORS[type] ?? 'default'}>{type}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Blocks',
      key: 'blocks',
      width: 80,
      render: (_: unknown, record: Page) => (
        <Text type="secondary">{record.blocks?.length ?? 0}</Text>
      ),
    },
    {
      title: 'Last Modified',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (v: string) => dayjs(v).format('MMM D, YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      fixed: 'right' as const,
      render: (_: unknown, record: Page) => (
        <Button.Group size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/cms/pages/${record._id}`)}
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => duplicateMutation.mutate(record._id)}
            loading={duplicateMutation.isPending}
          />
          <Popconfirm
            title="Delete page?"
            description="This will permanently delete the page and all its blocks."
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
        title="Pages"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/cms/pages/new')}
          >
            Create Page
          </Button>
        }
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search pages..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => handleSearchCommit(search)}
            onClear={() => handleSearchCommit('')}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            value={status || undefined}
            placeholder="All Statuses"
            onChange={(val) => {
              setStatus(val ?? '');
              setPage(1);
            }}
            allowClear
            options={STATUS_OPTIONS}
            style={{ width: 160 }}
          />
        </Space>
      </Card>

      <Table<Page>
        rowKey="_id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        expandable={{ childrenColumnName: '__children' }}
        pagination={{
          current: page,
          pageSize: 15,
          total: data?.pagination?.totalItems ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `${total} pages`,
          onChange: (p) => setPage(p),
        }}
        onRow={(_record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('.ant-popconfirm')) return;
          },
        })}
      />
    </div>
  );
}
