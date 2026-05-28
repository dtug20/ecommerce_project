import { useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Typography,
  Spin,
  Row,
  Col,
  Switch,
  Alert,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { settingsApi } from '@/services/api';
import PageHeader from '@/components/commons/PageHeader';

const { Title, Text } = Typography;

type TaxSettings = {
  enabled: boolean;
  rate: number;
  label: string;
  labelVi: string;
  applyToShipping: boolean;
};

const DEFAULT_TAX: TaxSettings = {
  enabled: false,
  rate: 0,
  label: 'VAT',
  labelVi: 'Thuế',
  applyToShipping: true,
};

export default function TaxSettingsPage() {
  const [form] = Form.useForm<TaxSettings>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (data?.data?.tax) {
      const t = data.data.tax;
      form.setFieldsValue({
        enabled: !!t.enabled,
        rate: Number(t.rate ?? 0),
        label: t.label ?? DEFAULT_TAX.label,
        labelVi: t.labelVi ?? DEFAULT_TAX.labelVi,
        applyToShipping: t.applyToShipping !== false,
      });
    } else {
      form.setFieldsValue(DEFAULT_TAX);
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return settingsApi.update({
        tax: {
          enabled: !!values.enabled,
          rate: Number(values.rate ?? 0),
          label: values.label || 'VAT',
          labelVi: values.labelVi || 'Thuế',
          applyToShipping: values.applyToShipping !== false,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Đã lưu cài đặt thuế');
    },
    onError: () => toast.error('Lưu thất bại'),
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
        title="Cài đặt thuế"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Lưu thay đổi
          </Button>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Giá hiển thị trên storefront là giá CHƯA bao gồm thuế. Thuế được cộng thêm vào tổng đơn ở bước checkout."
      />

      <Form form={form} layout="vertical" initialValues={DEFAULT_TAX}>
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Thuế giá trị gia tăng</Title>}
          size="small"
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="enabled"
                label="Bật tính thuế"
                valuePropName="checked"
                tooltip="Tắt = không cộng thuế vào đơn hàng"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="rate"
                label="Thuế suất (%)"
                rules={[{ required: true, message: 'Bắt buộc' }]}
              >
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="applyToShipping"
                label="Tính thuế cả phí ship"
                valuePropName="checked"
                tooltip="Bật = thuế tính trên (subtotal − discount + shipping). Tắt = chỉ tính trên (subtotal − discount)."
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="label" label="Nhãn hiển thị (EN)">
                <Input placeholder="VAT" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="labelVi" label="Nhãn hiển thị (VI)">
                <Input placeholder="Thuế" />
              </Form.Item>
            </Col>
          </Row>

          <Text type="secondary">
            Ví dụ với thuế suất 10%: nếu subtotal = 500.000 ₫, shipping = 25.000 ₫, discount = 0
            → Thuế = (500.000 + 25.000) × 10% = 52.500 ₫. Tổng = 577.500 ₫.
          </Text>
        </Card>
      </Form>
    </div>
  );
}
