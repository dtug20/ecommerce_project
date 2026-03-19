import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Typography,
  Space,
  Spin,
  Tag,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { settingsApi } from '@/services/api';
import PageHeader from '@/components/commons/PageHeader';

const { Title, Text } = Typography;

export default function ShippingSettingsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [methods, setMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      form.setFieldsValue({
        freeShippingThreshold: s.shipping?.freeShippingThreshold ?? 0,
        defaultShippingCost: s.shipping?.defaultShippingCost ?? 5,
      });
      setMethods(s.shipping?.enabledMethods ?? ['standard', 'express']);
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return settingsApi.update({
        shipping: {
          freeShippingThreshold: values.freeShippingThreshold,
          defaultShippingCost: values.defaultShippingCost,
          enabledMethods: methods,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Shipping settings saved');
    },
    onError: () => toast.error('Failed to save shipping settings'),
  });

  const addMethod = () => {
    const trimmed = newMethod.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed || methods.includes(trimmed)) return;
    setMethods((prev) => [...prev, trimmed]);
    setNewMethod('');
  };

  const removeMethod = (method: string) =>
    setMethods((prev) => prev.filter((m) => m !== method));

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
        title="Shipping Settings"
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
        {/* Costs */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Shipping Costs</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="freeShippingThreshold"
                label="Free Shipping Threshold"
                tooltip="Orders above this amount qualify for free shipping (0 to disable)"
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  prefix="$"
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="defaultShippingCost"
                label="Default Shipping Cost"
                tooltip="Applied when no specific shipping rule matches"
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  prefix="$"
                  placeholder="5.00"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Shipping Methods */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Enabled Shipping Methods</Title>}
          size="small"
        >
          <Divider />
          <Space wrap style={{ marginBottom: 16 }}>
            {methods.map((method) => (
              <Tag
                key={method}
                closable
                onClose={() => removeMethod(method)}
                color="blue"
                style={{ fontSize: 13, padding: '4px 10px' }}
              >
                {method}
              </Tag>
            ))}
            {methods.length === 0 && (
              <Text type="secondary">No shipping methods configured.</Text>
            )}
          </Space>
          <Space>
            <Input
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              placeholder="e.g. express, standard, overnight"
              onPressEnter={addMethod}
              style={{ width: 240 }}
              size="small"
            />
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={addMethod}
              disabled={!newMethod.trim()}
            >
              Add Method
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
}
