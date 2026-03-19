import { Typography, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import PageHeader from '@/components/commons/PageHeader';

const { Text } = Typography;

export default function EmailTemplatesPage() {
  return (
    <div>
      <PageHeader title="Email Templates" />
      <Result
        icon={<MailOutlined style={{ color: '#a42c48' }} />}
        title="Email Template Editor"
        subTitle={
          <Text type="secondary">
            The email template editor will be available in a future update. You will be able to
            customize transactional emails for order confirmations, password resets, shipping
            notifications, and more.
          </Text>
        }
      />
    </div>
  );
}
