import { useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Checkbox,
  Typography,
  Space,
  Spin,
  Tag,
  Input,
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
import ImageUpload from '@/components/commons/ImageUpload';

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
    value: 'bank-transfer',
    label: 'Bank Transfer',
    icon: <BankOutlined />,
    description: 'Direct bank transfer',
  },
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
        bankTransfer: s.payment?.bankTransfer ?? {
          bankName: '',
          accountNumber: '',
          accountName: '',
          branch: '',
          qrImageUrl: '',
          transferContentTemplate: '',
        },
      });
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return settingsApi.update({
        payment: {
          enabledGateways: values.enabledGateways ?? [],
          bankTransfer: values.bankTransfer ?? {},
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'public'] });
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

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.enabledGateways !== curr.enabledGateways
          }
        >
          {({ getFieldValue }) => {
            const gateways: string[] = getFieldValue('enabledGateways') ?? [];
            if (!gateways.includes('bank-transfer')) return null;
            return (
              <Card
                title="Bank Transfer Details"
                style={{ marginTop: 16 }}
              >
                <Form.Item
                  label="Bank Name"
                  name={['bankTransfer', 'bankName']}
                  rules={[{ required: true, message: 'Bank name is required' }]}
                >
                  <Input placeholder="e.g. Vietcombank" />
                </Form.Item>

                <Form.Item
                  label="Account Number"
                  name={['bankTransfer', 'accountNumber']}
                  rules={[{ required: true, message: 'Account number is required' }]}
                >
                  <Input placeholder="e.g. 0123456789" />
                </Form.Item>

                <Form.Item
                  label="Account Holder"
                  name={['bankTransfer', 'accountName']}
                  rules={[{ required: true, message: 'Account holder is required' }]}
                >
                  <Input placeholder="e.g. SHOFY CO., LTD" />
                </Form.Item>

                <Form.Item
                  label="Branch (optional)"
                  name={['bankTransfer', 'branch']}
                >
                  <Input placeholder="e.g. Hanoi Branch" />
                </Form.Item>

                <Form.Item
                  label="QR Code (optional)"
                  name={['bankTransfer', 'qrImageUrl']}
                >
                  <ImageUpload />
                </Form.Item>

                <Form.Item
                  label="Transfer Content Template (optional)"
                  name={['bankTransfer', 'transferContentTemplate']}
                  extra="Use {orderId} as a placeholder. e.g. SHOFY-{orderId}"
                >
                  <Input placeholder="SHOFY-{orderId}" />
                </Form.Item>
              </Card>
            );
          }}
        </Form.Item>

      </Form>
    </div>
  );
}
