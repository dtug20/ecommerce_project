import { useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Checkbox,
  Typography,
  Divider,
  Row,
  Col,
  Space,
  Spin,
  Tag,
} from 'antd';
import {
  SaveOutlined,
  CreditCardOutlined,
  DollarOutlined,
  BankOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { settingsApi } from '@/services/api';
import PageHeader from '@/components/commons/PageHeader';

const { Title, Text } = Typography;

const GATEWAYS = [
  {
    value: 'stripe',
    label: 'Stripe',
    icon: <CreditCardOutlined />,
    description: 'Credit/Debit cards via Stripe',
  },
  {
    value: 'cod',
    label: 'Cash on Delivery',
    icon: <DollarOutlined />,
    description: 'Pay when you receive your order',
  },
  {
    value: 'vnpay',
    label: 'VNPay',
    icon: <BankOutlined />,
    description: 'Vietnam domestic payment gateway',
  },
  {
    value: 'momo',
    label: 'MoMo',
    icon: <MobileOutlined />,
    description: 'MoMo e-wallet (Vietnam)',
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    icon: <BankOutlined />,
    description: 'Direct bank transfer',
  },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'VND', label: 'VND — Vietnamese Dong' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

export default function PaymentSettingsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      form.setFieldsValue({
        enabledGateways: s.payment?.enabledGateways ?? ['stripe', 'cod'],
        currency: s.payment?.currency ?? 'USD',
        currencySymbol: s.payment?.currencySymbol ?? '$',
      });
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return settingsApi.update({
        payment: {
          enabledGateways: values.enabledGateways ?? [],
          currency: values.currency,
          currencySymbol: values.currencySymbol,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Payment settings saved');
    },
    onError: () => toast.error('Failed to save payment settings'),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Payment Settings"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Changes
          </Button>
        }
      />

      <Form form={form} layout="vertical">
        {/* Gateways */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Payment Gateways</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="enabledGateways" style={{ marginBottom: 0 }}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {GATEWAYS.map((gw) => (
                  <Card
                    key={gw.value}
                    size="small"
                    style={{ background: '#fafafa' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Space>
                        <Checkbox value={gw.value} />
                        <Space>
                          {gw.icon}
                          <Text strong>{gw.label}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {gw.description}
                          </Text>
                        </Space>
                      </Space>
                      <Tag color="default">{gw.value}</Tag>
                    </div>
                  </Card>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Card>

        {/* Currency */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Currency</Title>}
          size="small"
        >
          <Divider />
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Currency is required' }]}
              >
                <Select options={CURRENCY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="currencySymbol"
                label="Currency Symbol"
                rules={[{ required: true, message: 'Symbol is required' }]}
              >
                <Input placeholder="$" style={{ width: 100 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
}
