import { useEffect, useState } from 'react';
import { Result, Button, Space, Typography, Tag } from 'antd';
import { LogoutOutlined, MailOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface Me {
  name: string;
  email: string;
  roles: string[];
}

export default function NoAccessPage() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  const handleLogout = () => {
    window.location.href = '/logout';
  };

  const adminEmail = 'admin@shofy.com';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '40px 32px',
          maxWidth: 560,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Result
          status="403"
          title="Bạn chưa có quyền truy cập CRM"
          subTitle="Tài khoản của bạn đã đăng nhập thành công nhưng chưa được cấp quyền quản trị. Vui lòng liên hệ admin để được phân quyền."
          extra={
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {me && (
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 16,
                    textAlign: 'left',
                  }}
                >
                  <Paragraph style={{ margin: 0, marginBottom: 4 }}>
                    <Text type="secondary">Tài khoản:</Text>{' '}
                    <Text strong>{me.name}</Text>
                  </Paragraph>
                  {me.email && (
                    <Paragraph style={{ margin: 0, marginBottom: 8 }}>
                      <Text type="secondary">Email:</Text> <Text>{me.email}</Text>
                    </Paragraph>
                  )}
                  <div>
                    <Text type="secondary">Vai trò hiện tại: </Text>
                    {me.roles.length === 0 ? (
                      <Text italic type="secondary">
                        (chưa có)
                      </Text>
                    ) : (
                      me.roles.map((r) => (
                        <Tag key={r} style={{ marginInlineEnd: 4 }}>
                          {r}
                        </Tag>
                      ))
                    )}
                  </div>
                </div>
              )}

              <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                Để truy cập CRM, tài khoản cần có một trong các vai trò:{' '}
                <Tag color="blue">admin</Tag>
                <Tag color="cyan">manager</Tag>
                <Tag color="green">staff</Tag>
                <Tag color="orange">shipper</Tag>
              </Paragraph>

              <Space>
                <Button
                  type="primary"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
                <Button
                  icon={<MailOutlined />}
                  href={`mailto:${adminEmail}?subject=Yêu cầu cấp quyền truy cập CRM`}
                >
                  Liên hệ admin
                </Button>
              </Space>
            </Space>
          }
        />
      </div>
    </div>
  );
}
