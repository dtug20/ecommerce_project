import { useState } from 'react';
import {
  Row,
  Col,
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Typography,
  Divider,
  Tooltip,
  Spin,
  Select,
  Alert,
} from 'antd';
import {
  EditOutlined,
  DesktopOutlined,
  MobileOutlined,
  SendOutlined,
  EyeOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { emailTemplatesApi } from '@/services/api';
import type { EmailTemplate } from '@/types';
import PageHeader from '@/components/commons/PageHeader';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ---------------------------------------------------------------------------
// Template categories
// ---------------------------------------------------------------------------

interface TemplateCategory {
  label: string;
  slugPrefixes: string[];
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    label: 'Order Templates',
    slugPrefixes: ['order-confirmation', 'order-shipped', 'order-delivered', 'order-cancelled'],
  },
  {
    label: 'Account Templates',
    slugPrefixes: ['welcome', 'password-reset'],
  },
  {
    label: 'Vendor Templates',
    slugPrefixes: ['vendor-application', 'vendor-approved'],
  },
  {
    label: 'Admin Templates',
    slugPrefixes: ['low-stock-alert'],
  },
];

function categorizeTpls(
  templates: EmailTemplate[]
): Array<{ category: string; items: EmailTemplate[] }> {
  const result: Array<{ category: string; items: EmailTemplate[] }> = [];

  for (const cat of TEMPLATE_CATEGORIES) {
    const items = templates.filter((t) =>
      cat.slugPrefixes.some((prefix) => t.slug.startsWith(prefix))
    );
    if (items.length > 0) {
      result.push({ category: cat.label, items });
    }
  }

  // Uncategorized
  const categorized = new Set(result.flatMap((r) => r.items.map((i) => i._id)));
  const others = templates.filter((t) => !categorized.has(t._id));
  if (others.length > 0) {
    result.push({ category: 'Other Templates', items: others });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Variable Insert Dropdown
// ---------------------------------------------------------------------------

interface InsertVariableButtonProps {
  variables: string[];
  onInsert: (variable: string) => void;
}

function InsertVariableButton({ variables, onInsert }: InsertVariableButtonProps) {
  const [open, setOpen] = useState(false);

  if (variables.length === 0) return null;

  return (
    <Select
      open={open}
      onDropdownVisibleChange={setOpen}
      placeholder="Insert Variable"
      style={{ width: 160 }}
      value={undefined}
      onChange={(val: string) => {
        onInsert(`{{${val}}}`);
        setOpen(false);
      }}
      options={variables.map((v) => ({ value: v, label: `{{${v}}}` }))}
      dropdownStyle={{ minWidth: 180 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Test Email Modal
// ---------------------------------------------------------------------------

interface TestEmailModalProps {
  templateId: string;
  open: boolean;
  onClose: () => void;
}

function TestEmailModal({ templateId, open, onClose }: TestEmailModalProps) {
  const [form] = Form.useForm<{ recipient: string }>();

  const sendMutation = useMutation({
    mutationFn: (recipient: string) => emailTemplatesApi.sendTest(templateId, recipient),
    onSuccess: () => {
      toast.success('Test email sent successfully');
      onClose();
    },
    onError: () => toast.error('Failed to send test email'),
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      sendMutation.mutate(values.recipient);
    } catch {
      // validation errors shown on form
    }
  };

  return (
    <Modal
      title="Send Test Email"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Send Test"
      confirmLoading={sendMutation.isPending}
      width={400}
      afterOpenChange={(visible) => { if (!visible) form.resetFields(); }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="recipient"
          label="Recipient Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email address' },
          ]}
        >
          <Input placeholder="test@example.com" prefix={<MailOutlined />} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Template Editor Modal
// ---------------------------------------------------------------------------

interface EditorModalProps {
  template: EmailTemplate | null;
  open: boolean;
  onClose: () => void;
}

function EditorModal({ template, open, onClose }: EditorModalProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testOpen, setTestOpen] = useState(false);
  const [viExpanded, setViExpanded] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<EmailTemplate>) =>
      emailTemplatesApi.update(template!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('Template saved');
      onClose();
    },
    onError: () => toast.error('Failed to save template'),
  });

  const previewMutation = useMutation({
    mutationFn: () => emailTemplatesApi.preview(template!._id),
    onSuccess: (data) => {
      setPreviewHtml(data.data.html);
      setPreviewSubject(data.data.subject);
    },
    onError: () => toast.error('Failed to generate preview'),
  });

  const handleSave = async () => {
    if (!template) return;
    try {
      const values = await form.validateFields();
      saveMutation.mutate(values);
    } catch {
      // validation errors shown on form
    }
  };

  // Append variable to the end of a field's current value
  const appendVariable = (fieldName: string, variableText: string) => {
    const current = (form.getFieldValue(fieldName) as string) ?? '';
    form.setFieldValue(fieldName, current + variableText);
  };

  const variables = template?.variables ?? [];

  return (
    <>
      <Modal
        title={template ? `Edit: ${template.name}` : 'Edit Template'}
        open={open}
        onCancel={onClose}
        width={960}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              icon={<SendOutlined />}
              onClick={() => setTestOpen(true)}
              disabled={!template}
            >
              Send Test Email
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saveMutation.isPending}
            >
              Save
            </Button>
          </Space>
        }
        afterOpenChange={(visible) => {
          if (visible && template) {
            form.setFieldsValue({
              subject: template.subject,
              subjectVi: template.subjectVi ?? '',
              body: template.body,
              bodyVi: template.bodyVi ?? '',
            });
            setPreviewHtml(null);
          } else if (!visible) {
            form.resetFields();
            setPreviewHtml(null);
          }
        }}
      >
        {template && (
          <Row gutter={16} style={{ minHeight: 480 }}>
            {/* Left: Editor */}
            <Col span={14}>
              <Form form={form} layout="vertical">
                {/* Subject EN */}
                <Form.Item
                  name="subject"
                  label={
                    <Space>
                      <Text>Subject (EN)</Text>
                      <InsertVariableButton
                        variables={variables}
                        onInsert={(v) => appendVariable('subject', v)}
                      />
                    </Space>
                  }
                  rules={[{ required: true, message: 'Subject is required' }]}
                >
                  <Input placeholder="Email subject..." />
                </Form.Item>

                {/* Subject VI (collapsible) */}
                <div style={{ marginBottom: 8 }}>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, fontSize: 12 }}
                    onClick={() => setViExpanded((prev) => !prev)}
                  >
                    {viExpanded ? '- Hide Vietnamese' : '+ Vietnamese Translation'}
                  </Button>
                </div>

                {viExpanded && (
                  <>
                    <Form.Item name="subjectVi" label="Subject (VI)">
                      <Input placeholder="Tiêu đề email (tiếng Việt)..." />
                    </Form.Item>
                    <Form.Item name="bodyVi" label="Body (VI)">
                      <TextArea
                        rows={8}
                        placeholder="Nội dung email (tiếng Việt)..."
                      />
                    </Form.Item>
                  </>
                )}

                {/* Body EN */}
                <Form.Item
                  name="body"
                  label={
                    <Space>
                      <Text>Body (EN)</Text>
                      <InsertVariableButton
                        variables={variables}
                        onInsert={(v) => appendVariable('body', v)}
                      />
                    </Space>
                  }
                  rules={[{ required: true, message: 'Body is required' }]}
                >
                  <TextArea
                    rows={14}
                    placeholder="Email body HTML..."
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Form.Item>

                {/* Available Variables */}
                {variables.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                      Available Variables:
                    </Text>
                    <Space wrap size={4}>
                      {variables.map((v) => (
                        <Tag
                          key={v}
                          style={{ cursor: 'pointer', fontSize: 11 }}
                          onClick={() => appendVariable('body', `{{${v}}}`)}
                        >
                          {`{{${v}}}`}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Form>
            </Col>

            {/* Right: Preview */}
            <Col span={10}>
              <div style={{ position: 'sticky', top: 0 }}>
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>Preview</Text>
                  <Tooltip title="Desktop">
                    <Button
                      size="small"
                      icon={<DesktopOutlined />}
                      type={previewMode === 'desktop' ? 'primary' : 'default'}
                      onClick={() => setPreviewMode('desktop')}
                    />
                  </Tooltip>
                  <Tooltip title="Mobile">
                    <Button
                      size="small"
                      icon={<MobileOutlined />}
                      type={previewMode === 'mobile' ? 'primary' : 'default'}
                      onClick={() => setPreviewMode('mobile')}
                    />
                  </Tooltip>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    loading={previewMutation.isPending}
                    onClick={() => previewMutation.mutate()}
                  >
                    Preview
                  </Button>
                </Space>

                {previewSubject && (
                  <Alert
                    message={<Text style={{ fontSize: 12 }}><strong>Subject:</strong> {previewSubject}</Text>}
                    type="info"
                    style={{ marginBottom: 8 }}
                  />
                )}

                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: '#fff',
                    minHeight: 360,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: 8,
                  }}
                >
                  {previewMutation.isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360, width: '100%' }}>
                      <Spin />
                    </div>
                  ) : previewHtml ? (
                    <div
                      style={{
                        width: previewMode === 'mobile' ? 375 : '100%',
                        overflowX: 'auto',
                        transition: 'width 0.2s',
                      }}
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 360,
                        width: '100%',
                        gap: 8,
                      }}
                    >
                      <EyeOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Click "Preview" to render the template
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Modal>

      {template && (
        <TestEmailModal
          templateId={template._id}
          open={testOpen}
          onClose={() => setTestOpen(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EmailTemplatesPage() {
  const [editorTemplate, setEditorTemplate] = useState<EmailTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => emailTemplatesApi.getAll(),
    staleTime: 1000 * 60 * 5,
  });

  const templates = data?.data ?? [];
  const categorized = categorizeTpls(templates);

  const handleEdit = (template: EmailTemplate) => {
    setEditorTemplate(template);
    setEditorOpen(true);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Email Templates" />
        <Card loading />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Email Templates" />

      {templates.length === 0 ? (
        <Card>
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
            }}
          >
            <MailOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={5} style={{ color: '#8c8c8c' }}>
              No email templates found
            </Title>
            <Text type="secondary">
              Email templates are automatically created when the backend runs migrations.
            </Text>
          </div>
        </Card>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {categorized.map(({ category, items }) => (
            <Card
              key={category}
              title={<Text strong>{category}</Text>}
              size="small"
              styles={{ body: { padding: 0 } }}
            >
              <List
                dataSource={items}
                renderItem={(template) => (
                  <List.Item
                    style={{ padding: '12px 16px' }}
                    actions={[
                      <Button
                        key="edit"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(template)}
                      >
                        Edit
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space size={8}>
                          <Text style={{ fontSize: 14 }}>{template.name}</Text>
                          <Tag color={template.status === 'active' ? 'green' : 'default'} style={{ fontSize: 11 }}>
                            {template.status}
                          </Tag>
                          {template.isDefault && (
                            <Tag color="blue" style={{ fontSize: 11 }}>
                              Default
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Subject: {template.subject}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Last modified: {dayjs(template.updatedAt).format('MMM D, YYYY HH:mm')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          ))}
        </Space>
      )}

      <Divider />

      <EditorModal
        template={editorTemplate}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditorTemplate(null);
        }}
      />
    </div>
  );
}
