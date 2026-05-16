import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { chatbotApi } from '@/services/api';
import type { ChatbotSessionRow } from '@/services/api';
import PageHeader from '@/components/commons/PageHeader';

const { Title } = Typography;

export default function ChatbotAnalyticsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const analyticsQuery = useQuery({
    queryKey: ['chatbot-analytics'],
    queryFn: () => chatbotApi.getAnalytics(),
  });

  const sessionsQuery = useQuery({
    queryKey: ['chatbot-sessions', page, pageSize],
    queryFn: () => chatbotApi.listSessions({ page, limit: pageSize }),
  });

  const a = analyticsQuery.data?.data?.last30Days;
  const satisfaction =
    a?.satisfactionRate == null ? '—' : `${Math.round(a.satisfactionRate * 100)}%`;

  return (
    <div>
      <PageHeader title="AI Chatbot Analytics" />

      <Title level={5} style={{ margin: '8px 0 12px' }}>
        Last 30 days
      </Title>

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Sessions"
              value={a?.totalSessions ?? 0}
              loading={analyticsQuery.isLoading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Messages"
              value={a?.totalMessages ?? 0}
              loading={analyticsQuery.isLoading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="👍 Helpful"
              value={a?.thumbsUp ?? 0}
              loading={analyticsQuery.isLoading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="👎 / Satisfaction"
              value={a ? `${a.thumbsDown} / ${satisfaction}` : '—'}
              loading={analyticsQuery.isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Sessions" style={{ marginTop: 16 }}>
        <Table<ChatbotSessionRow>
          rowKey="sessionId"
          loading={sessionsQuery.isLoading}
          dataSource={sessionsQuery.data?.data?.sessions || []}
          columns={[
            {
              title: 'Session',
              dataIndex: 'sessionId',
              key: 'sessionId',
              render: (v: string) => <code>{v.slice(0, 8)}</code>,
            },
            {
              title: 'User',
              key: 'user',
              render: (_: unknown, row: ChatbotSessionRow) =>
                row.userId ? (
                  <Tag color="blue">{String(row.userId).slice(0, 8)}</Tag>
                ) : (
                  <Tag>anonymous</Tag>
                ),
            },
            {
              title: 'Locale',
              dataIndex: 'locale',
              key: 'locale',
              render: (v: string) => <Tag>{v.toUpperCase()}</Tag>,
            },
            {
              title: 'Messages',
              dataIndex: 'messageCount',
              key: 'messageCount',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (v: string) =>
                v ? <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> : '—',
            },
            {
              title: 'Updated',
              dataIndex: 'updatedAt',
              key: 'updatedAt',
              render: (v: string) => new Date(v).toLocaleString(),
            },
          ]}
          pagination={{
            current: page,
            pageSize,
            total: sessionsQuery.data?.data?.pagination?.total || 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}
