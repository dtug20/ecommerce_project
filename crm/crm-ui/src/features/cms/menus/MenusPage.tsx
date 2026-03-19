import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Typography,
  Badge,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import { menusApi } from '@/services/api';
import type { CmsMenu } from '@/types';
import PageHeader from '@/components/commons/PageHeader';

const { Text } = Typography;

export default function MenusPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cms-menus'],
    queryFn: () => menusApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menusApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-menus'] });
      toast.success('Menu deleted');
    },
    onError: () => toast.error('Failed to delete menu'),
  });

  const columns: TableProps<CmsMenu>['columns'] = [
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, record: CmsMenu) => (
        <div>
          <Text strong>{record.name}</Text>
          {record.isDefault && (
            <Tag color="gold" style={{ marginLeft: 8 }}>
              Default
            </Tag>
          )}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              slug: {record.slug}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 160,
      render: (loc: string) => <Tag>{loc}</Tag>,
    },
    {
      title: 'Items',
      key: 'items',
      width: 90,
      render: (_: unknown, record: CmsMenu) => (
        <Text type="secondary">{record.items?.length ?? 0} items</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      title: 'Last Modified',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (v: string) => dayjs(v).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: CmsMenu) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/cms/menus/${record._id}`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete menu?"
            onConfirm={() => deleteMutation.mutate(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Menus"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/cms/menus/new')}
          >
            Create Menu
          </Button>
        }
      />

      <Table<CmsMenu>
        rowKey="_id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        expandable={{ childrenColumnName: '__children' }}
        pagination={false}
      />
    </div>
  );
}
