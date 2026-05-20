import { useState } from 'react';
import {
  Button,
  Card,
  Image,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableProps } from 'antd';
import { DollarOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  currencyAuditApi,
  type AuditProduct,
  type AuditResponse,
} from '@/services/currencyAudit';
import PageHeader from '@/components/commons/PageHeader';

const { Text } = Typography;

export default function CurrencyAuditPage() {
  const [page, setPage] = useState(1);
  const [showReviewed, setShowReviewed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: ['currency-audit', { page, showReviewed }],
    queryFn: () => currencyAuditApi.list({ page, limit: 20, showReviewed }),
  });

  const normalizeOne = useMutation({
    mutationFn: ({ id, fromCurrency }: { id: string; fromCurrency: 'USD' | 'VND' }) =>
      currencyAuditApi.normalizeOne(id, fromCurrency),
    onSuccess: () => {
      message.success('Product reviewed');
      queryClient.invalidateQueries({ queryKey: ['currency-audit'] });
    },
    onError: () => message.error('Failed to update product'),
  });

  const normalizeBulk = useMutation({
    mutationFn: ({ ids, fromCurrency }: { ids: string[]; fromCurrency: 'USD' | 'VND' }) =>
      currencyAuditApi.normalizeBulk(ids, fromCurrency),
    onSuccess: (res) => {
      const skipped = (res.notFound?.length ?? 0) + (res.invalidIds?.length ?? 0);
      message.success(
        skipped > 0
          ? `${res.updated} products updated (${skipped} skipped)`
          : `${res.updated} products updated`,
      );
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['currency-audit'] });
    },
    onError: () => message.error('Bulk update failed'),
  });

  const columns: TableProps<AuditProduct>['columns'] = [
    {
      title: 'Image',
      dataIndex: 'img',
      key: 'img',
      width: 80,
      render: (img: string | undefined, record) => (
        <Image
          src={img || record.imageURLs?.[0]?.img}
          alt={record.title}
          width={48}
          height={48}
          fallback="https://placehold.co/48"
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (t: string, r) => (
        <Space direction="vertical" size={2}>
          <Text strong>{t}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            /{r.slug}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Current Price',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (p: number) => (
        <Text strong style={{ color: '#fa8c16' }}>
          {p.toLocaleString('vi-VN')} ₫
        </Text>
      ),
    },
    {
      title: 'If USD → VND',
      dataIndex: 'suggestedVndPrice',
      key: 'suggestedVndPrice',
      width: 160,
      align: 'right',
      render: (v: number) => (
        <Text type="secondary">{v?.toLocaleString('vi-VN') ?? '—'} ₫</Text>
      ),
    },
    {
      title: 'Reviewed',
      dataIndex: 'currencyReviewedAt',
      key: 'currencyReviewedAt',
      width: 130,
      render: (d: string | null) =>
        d ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Reviewed
          </Tag>
        ) : (
          <Tag color="orange" icon={<WarningOutlined />}>
            Pending
          </Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: AuditProduct) => (
        <Space>
          <Popconfirm
            title={`Convert ${record.title} from USD?`}
            description={`Price will become ${record.suggestedVndPrice?.toLocaleString('vi-VN')} ₫`}
            onConfirm={() => normalizeOne.mutate({ id: record._id, fromCurrency: 'USD' })}
          >
            <Button size="small" type="primary" danger>
              Convert from USD
            </Button>
          </Popconfirm>
          <Button
            size="small"
            onClick={() => normalizeOne.mutate({ id: record._id, fromCurrency: 'VND' })}
          >
            Mark as VND
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Currency Audit" />
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Review products with suspicious USD-magnitude prices and normalize them to VND base.
      </Text>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <Switch checked={showReviewed} onChange={setShowReviewed} />
            <Text>Show reviewed products</Text>
          </Space>
          {selectedIds.length > 0 && (
            <Space>
              <Text>{selectedIds.length} selected</Text>
              <Popconfirm
                title={`Convert ${selectedIds.length} products from USD?`}
                onConfirm={() =>
                  normalizeBulk.mutate({ ids: selectedIds, fromCurrency: 'USD' })
                }
              >
                <Button type="primary" danger icon={<DollarOutlined />}>
                  Bulk Convert from USD
                </Button>
              </Popconfirm>
              <Button
                onClick={() =>
                  normalizeBulk.mutate({ ids: selectedIds, fromCurrency: 'VND' })
                }
              >
                Bulk Mark as VND
              </Button>
            </Space>
          )}
          <Text type="secondary">
            Current USD→VND rate: {data?.currentRate?.toLocaleString('vi-VN') ?? '—'}
          </Text>
        </Space>
      </Card>

      <Table<AuditProduct>
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination.totalItems ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
