import { useEffect, useState } from 'react';
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
  Table,
  Switch,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { settingsApi } from '@/services/api';
import PageHeader from '@/components/commons/PageHeader';

const { Title } = Typography;

type ShippingMethod = {
  id: string;
  label: string;
  labelVi: string;
  cost: number;
  enabled: boolean;
};

const DEFAULT_METHODS: ShippingMethod[] = [
  { id: 'free', label: 'Free shipping', labelVi: 'Miễn phí', cost: 0, enabled: true },
  { id: 'flat', label: 'Flat rate', labelVi: 'Phí cố định', cost: 20000, enabled: true },
  { id: 'pickup', label: 'Local pickup', labelVi: 'Nhận tại cửa hàng', cost: 25000, enabled: true },
];

export default function ShippingSettingsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [methods, setMethods] = useState<ShippingMethod[]>(DEFAULT_METHODS);

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      form.setFieldsValue({
        freeShippingThreshold: s.shipping?.freeShippingThreshold ?? 0,
        defaultShippingCost: s.shipping?.defaultShippingCost ?? 0,
      });
      const loaded = Array.isArray(s.shipping?.methods) ? s.shipping.methods : [];
      setMethods(loaded.length > 0 ? loaded : DEFAULT_METHODS);
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      const ids = methods.map((m) => m.id.trim());
      if (ids.some((id) => !id)) {
        throw new Error('Method id is required');
      }
      if (new Set(ids).size !== ids.length) {
        throw new Error('Method ids must be unique');
      }
      return settingsApi.update({
        shipping: {
          freeShippingThreshold: values.freeShippingThreshold,
          defaultShippingCost: values.defaultShippingCost,
          methods,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Đã lưu cài đặt vận chuyển');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Lưu thất bại';
      toast.error(msg);
    },
  });

  const updateMethod = (index: number, patch: Partial<ShippingMethod>) => {
    setMethods((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const addMethod = () => {
    setMethods((prev) => [
      ...prev,
      { id: `method-${prev.length + 1}`, label: '', labelVi: '', cost: 0, enabled: true },
    ]);
  };

  const removeMethod = (index: number) => {
    setMethods((prev) => prev.filter((_, i) => i !== index));
  };

  const columns: ColumnsType<ShippingMethod> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 140,
      render: (_, record, index) => (
        <Input
          value={record.id}
          onChange={(e) => updateMethod(index, { id: e.target.value })}
          placeholder="vd: flat"
          size="small"
        />
      ),
    },
    {
      title: 'Tên (EN)',
      dataIndex: 'label',
      render: (_, record, index) => (
        <Input
          value={record.label}
          onChange={(e) => updateMethod(index, { label: e.target.value })}
          placeholder="Flat rate"
          size="small"
        />
      ),
    },
    {
      title: 'Tên (VI)',
      dataIndex: 'labelVi',
      render: (_, record, index) => (
        <Input
          value={record.labelVi}
          onChange={(e) => updateMethod(index, { labelVi: e.target.value })}
          placeholder="Phí cố định"
          size="small"
        />
      ),
    },
    {
      title: 'Phí (₫)',
      dataIndex: 'cost',
      width: 160,
      render: (_, record, index) => (
        <InputNumber
          value={record.cost}
          onChange={(v) => updateMethod(index, { cost: Number(v ?? 0) })}
          min={0}
          step={1000}
          style={{ width: '100%' }}
          size="small"
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          parser={(v) => Number(`${v}`.replace(/\./g, '')) as unknown as 0}
        />
      ),
    },
    {
      title: 'Bật',
      dataIndex: 'enabled',
      width: 70,
      align: 'center',
      render: (_, record, index) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) => updateMethod(index, { enabled: checked })}
          size="small"
        />
      ),
    },
    {
      title: '',
      width: 60,
      align: 'center',
      render: (_, _record, index) => (
        <Popconfirm title="Xoá phương thức này?" onConfirm={() => removeMethod(index)}>
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

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
        title="Cài đặt vận chuyển"
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

      <Form form={form} layout="vertical">
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Phí vận chuyển chung</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="freeShippingThreshold"
                label="Ngưỡng miễn phí vận chuyển (₫)"
                tooltip="Đơn hàng từ mức này trở lên được miễn phí ship (0 = tắt)"
              >
                <InputNumber
                  min={0}
                  step={10000}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(v) => Number(`${v}`.replace(/\./g, '')) as unknown as 0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="defaultShippingCost"
                label="Phí ship mặc định (₫)"
                tooltip="Dùng khi không match phương thức nào"
              >
                <InputNumber
                  min={0}
                  step={1000}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(v) => Number(`${v}`.replace(/\./g, '')) as unknown as 0}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          title={<Title level={5} style={{ margin: 0 }}>Phương thức vận chuyển</Title>}
          size="small"
          extra={
            <Button size="small" icon={<PlusOutlined />} onClick={addMethod}>
              Thêm phương thức
            </Button>
          }
        >
          <Table
            rowKey={(_, idx) => String(idx)}
            dataSource={methods}
            columns={columns}
            pagination={false}
            size="small"
          />
        </Card>
      </Form>
    </div>
  );
}
