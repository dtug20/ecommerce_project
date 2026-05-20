import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Switch,
  Typography,
  Divider,
  Row,
  Col,
  Space,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { settingsApi } from '@/services/api';
import PageHeader from '@/components/commons/PageHeader';

const { Title } = Typography;

interface SocialLink {
  platform: string;
  url: string;
}

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Vietnamese' },
];


export default function GeneralSettingsPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      form.setFieldsValue({
        siteName: s.siteName ?? '',
        siteDescription: s.siteDescription ?? '',
        contactPhone: s.contact?.phone ?? '',
        contactEmail: s.contact?.email ?? '',
        contactAddress: s.contact?.address ?? '',
        maintenanceMessage: s.maintenance?.message ?? '',
        defaultLanguage: s.i18n?.defaultLanguage ?? 'en',
        supportedLanguages: s.i18n?.supportedLanguages ?? ['en'],
        chatbotWelcomeEn: s.chatbot?.welcomeMessage?.en ?? '',
        chatbotWelcomeVi: s.chatbot?.welcomeMessage?.vi ?? '',
      });
      setSocialLinks(s.contact?.socialLinks ?? []);
      setMaintenanceEnabled(s.maintenance?.isEnabled ?? false);
      setChatbotEnabled(s.chatbot?.enabled ?? true);
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      const existingPayment = data?.data?.payment ?? {};
      return settingsApi.update({
        siteName: values.siteName,
        siteDescription: values.siteDescription,
        contact: {
          phone: values.contactPhone,
          email: values.contactEmail,
          address: values.contactAddress,
          socialLinks,
        },
        maintenance: {
          isEnabled: maintenanceEnabled,
          message: values.maintenanceMessage,
        },
        i18n: {
          defaultLanguage: values.defaultLanguage,
          supportedLanguages: values.supportedLanguages,
        },
        payment: {
          ...existingPayment,
        },
        chatbot: {
          enabled: chatbotEnabled,
          welcomeMessage: {
            en: values.chatbotWelcomeEn,
            vi: values.chatbotWelcomeVi,
          },
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'public'] });
      toast.success('General settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const addSocialLink = () =>
    setSocialLinks((prev) => [...prev, { platform: 'facebook', url: '' }]);

  const removeSocialLink = (index: number) =>
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));

  const updateSocialLink = (index: number, key: keyof SocialLink, value: string) =>
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [key]: value } : link))
    );

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
        title="General Settings"
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
        {/* Site Info */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Site Information</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="siteName"
                label="Site Name"
                rules={[{ required: true, message: 'Site name is required' }]}
              >
                <Input placeholder="Shofy" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="siteDescription" label="Site Description">
                <Input placeholder="Your one-stop e-commerce destination" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Contact */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Contact Information</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="contactPhone" label="Phone">
                <Input placeholder="+84 000 000 000" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="contactEmail" label="Email">
                <Input placeholder="info@shofy.com" type="email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="contactAddress" label="Address">
                <Input placeholder="123 Main Street, Ho Chi Minh City" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Social Media */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Social Media</Title>}
          size="small"
          style={{ marginBottom: 16 }}
          extra={
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={addSocialLink}
            >
              Add
            </Button>
          }
        >
          {socialLinks.length === 0 && (
            <Typography.Text type="secondary">
              No social links added yet.
            </Typography.Text>
          )}
          <Space direction="vertical" style={{ width: '100%' }}>
            {socialLinks.map((link, index) => (
              <Row key={index} gutter={8} align="middle">
                <Col xs={24} sm={8}>
                  <Select
                    value={link.platform}
                    onChange={(v) => updateSocialLink(index, 'platform', v)}
                    options={PLATFORM_OPTIONS}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Col>
                <Col xs={22} sm={14}>
                  <Input
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    size="small"
                  />
                </Col>
                <Col xs={2} sm={2}>
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeSocialLink(index)}
                  />
                </Col>
              </Row>
            ))}
          </Space>
        </Card>

        {/* Maintenance */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Maintenance Mode</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Space style={{ marginBottom: 12 }}>
            <Switch
              checked={maintenanceEnabled}
              onChange={setMaintenanceEnabled}
            />
            <Typography.Text>
              {maintenanceEnabled ? 'Maintenance mode is ON' : 'Maintenance mode is OFF'}
            </Typography.Text>
          </Space>
          {maintenanceEnabled && (
            <Form.Item name="maintenanceMessage" label="Maintenance Message">
              <Input.TextArea
                rows={3}
                placeholder="We are performing scheduled maintenance. We'll be back soon!"
              />
            </Form.Item>
          )}
        </Card>

        {/* AI Chatbot */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>AI Chatbot</Title>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Space style={{ marginBottom: 12 }}>
            <Switch
              checked={chatbotEnabled}
              onChange={setChatbotEnabled}
            />
            <Typography.Text>
              {chatbotEnabled
                ? 'Chatbot widget is visible on storefront'
                : 'Chatbot widget is hidden on storefront'}
            </Typography.Text>
          </Space>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="chatbotWelcomeEn"
                label="Welcome message (EN)"
              >
                <Input.TextArea
                  rows={2}
                  maxLength={300}
                  showCount
                  placeholder="Hi! I'm your shopping assistant..."
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="chatbotWelcomeVi"
                label="Welcome message (VI)"
              >
                <Input.TextArea
                  rows={2}
                  maxLength={300}
                  showCount
                  placeholder="Xin chào! Tôi là trợ lý mua sắm..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Localization */}
        <Card
          title={<Title level={5} style={{ margin: 0 }}>Localization</Title>}
          size="small"
        >
          <Divider />
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="defaultLanguage" label="Default Language">
                <Select options={LANGUAGE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="supportedLanguages" label="Supported Languages">
                <Select
                  mode="multiple"
                  options={LANGUAGE_OPTIONS}
                  placeholder="Select supported languages"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
}
