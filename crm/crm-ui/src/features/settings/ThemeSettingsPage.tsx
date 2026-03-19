import { useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Radio,
  Typography,
  Divider,
  Row,
  Col,
  ColorPicker,
  Spin,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Color } from 'antd/es/color-picker';

import { settingsApi } from '@/services/api';
import PageHeader from '@/components/commons/PageHeader';

const { Title } = Typography;

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Montserrat', label: 'Montserrat' },
];

interface ThemeFormValues {
  logo: string;
  darkLogo: string;
  favicon: string;
  primaryColor: string | Color;
  secondaryColor: string | Color;
  accentColor: string | Color;
  bodyFont: string;
  headingFont: string;
  headerStyle: string;
  footerStyle: string;
}

export default function ThemeSettingsPage() {
  const [form] = Form.useForm<ThemeFormValues>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      form.setFieldsValue({
        logo: s.logo ?? '',
        favicon: s.favicon ?? '',
        primaryColor: s.theme?.primaryColor ?? '#a42c48',
        secondaryColor: s.theme?.secondaryColor ?? '#222',
        accentColor: s.theme?.accentColor ?? '#f5a623',
        bodyFont: s.theme?.fontFamily ?? 'Inter',
        headingFont: s.theme?.fontFamily ?? 'Inter',
        headerStyle: s.theme?.headerStyle ?? 'default',
        footerStyle: s.theme?.footerStyle ?? 'default',
      });
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      const toHex = (c: string | Color) =>
        typeof c === 'string' ? c : c.toHexString();
      return settingsApi.update({
        logo: values.logo,
        favicon: values.favicon,
        theme: {
          primaryColor: toHex(values.primaryColor),
          secondaryColor: toHex(values.secondaryColor),
          accentColor: toHex(values.accentColor),
          fontFamily: values.bodyFont,
          headerStyle: values.headerStyle,
          footerStyle: values.footerStyle,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Theme settings saved');
    },
    onError: () => toast.error('Failed to save theme settings'),
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
        title="Theme Settings"
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
        {/* Logo & Identity */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Logo &amp; Identity</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="logo" label="Logo URL">
                <Input placeholder="https://example.com/logo.png" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="darkLogo" label="Dark Logo URL">
                <Input placeholder="https://example.com/logo-dark.png" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="favicon" label="Favicon URL">
                <Input placeholder="https://example.com/favicon.ico" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Colors */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Brand Colors</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item name="primaryColor" label="Primary Color">
                <ColorPicker showText />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="secondaryColor" label="Secondary Color">
                <ColorPicker showText />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="accentColor" label="Accent Color">
                <ColorPicker showText />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Typography */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Typography</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="bodyFont" label="Body Font">
                <Select options={FONT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="headingFont" label="Heading Font">
                <Select options={FONT_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Layout */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Layout</Title>}
          size="small"
        >
          <Divider style={{ fontSize: 13 }}>
            Header Style
          </Divider>
          <Form.Item name="headerStyle">
            <Radio.Group>
              <Radio value="default">Default</Radio>
              <Radio value="centered">Centered</Radio>
              <Radio value="minimal">Minimal</Radio>
              <Radio value="transparent">Transparent</Radio>
            </Radio.Group>
          </Form.Item>

          <Divider style={{ fontSize: 13 }}>
            Footer Style
          </Divider>
          <Form.Item name="footerStyle" style={{ marginBottom: 0 }}>
            <Radio.Group>
              <Radio value="default">Default</Radio>
              <Radio value="minimal">Minimal</Radio>
              <Radio value="dark">Dark</Radio>
            </Radio.Group>
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
}
