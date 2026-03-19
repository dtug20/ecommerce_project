import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Switch,
  Typography,
  Space,
  Tag,
  Tree,
  Divider,
  Spin,
  Row,
  Col,
} from 'antd';
import type { TreeDataNode } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { menusApi } from '@/services/api';
import type { CmsMenu, MenuItem } from '@/types';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempId(): string {
  return `tmp-${Math.random().toString(36).slice(2)}`;
}

function buildTreeData(items: MenuItem[], parentKey = ''): TreeDataNode[] {
  return items.map((item, index) => {
    const key = item._id ?? `${parentKey}-${index}`;
    return {
      key,
      title: (
        <span>
          <Text strong style={{ fontSize: 13 }}>
            {item.label}
          </Text>
          {' '}
          <Tag color="blue" style={{ fontSize: 11 }}>
            {item.type}
          </Tag>
          {!item.isVisible && (
            <Tag color="default" style={{ fontSize: 11 }}>
              hidden
            </Tag>
          )}
        </span>
      ),
      children:
        item.children && item.children.length > 0
          ? buildTreeData(item.children, key)
          : undefined,
      // Attach raw data for editing
      _item: item,
    } as TreeDataNode & { _item: MenuItem };
  });
}

function findItemByTempId(items: MenuItem[], targetId: string): MenuItem | null {
  for (const item of items) {
    if ((item._id ?? '') === targetId) return item;
    if (item.children?.length) {
      const found = findItemByTempId(item.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function replaceItemByTempId(items: MenuItem[], targetId: string, updated: MenuItem): MenuItem[] {
  return items.map((item) => {
    if ((item._id ?? '') === targetId) return updated;
    if (item.children?.length) {
      return { ...item, children: replaceItemByTempId(item.children, targetId, updated) };
    }
    return item;
  });
}

function removeItemByTempId(items: MenuItem[], targetId: string): MenuItem[] {
  return items
    .filter((item) => (item._id ?? '') !== targetId)
    .map((item) => ({
      ...item,
      children: item.children?.length
        ? removeItemByTempId(item.children, targetId)
        : item.children,
    }));
}

// ---------------------------------------------------------------------------
// Item Settings Form
// ---------------------------------------------------------------------------

interface ItemFormProps {
  item: MenuItem;
  onChange: (updated: MenuItem) => void;
  onApply: () => void;
}

function ItemSettingsForm({ item, onChange, onApply }: ItemFormProps) {
  const update = (key: keyof MenuItem, value: unknown) =>
    onChange({ ...item, [key]: value });

  return (
    <Form layout="vertical">
      <Form.Item label="Label (EN)" required>
        <Input
          value={item.label}
          onChange={(e) => update('label', e.target.value)}
          placeholder="Menu Item"
        />
      </Form.Item>

      <Form.Item label="Label (VI)">
        <Input
          value={item.labelVi ?? ''}
          onChange={(e) => update('labelVi', e.target.value)}
          placeholder="Menu Item (Vietnamese)"
        />
      </Form.Item>

      <Form.Item label="Type">
        <Select
          value={item.type}
          onChange={(v) => update('type', v)}
          options={[
            { value: 'link', label: 'External Link' },
            { value: 'page', label: 'CMS Page' },
            { value: 'category', label: 'Category' },
            { value: 'product', label: 'Product' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
      </Form.Item>

      {(item.type === 'link' || item.type === 'custom') && (
        <Form.Item label="URL">
          <Input
            value={item.url ?? ''}
            onChange={(e) => update('url', e.target.value)}
            placeholder="https://example.com"
          />
        </Form.Item>
      )}

      {(item.type === 'page' || item.type === 'category' || item.type === 'product') && (
        <Row gutter={8}>
          <Col span={12}>
            <Form.Item label="Model">
              <Select
                value={item.reference?.model ?? ''}
                onChange={(v) =>
                  update('reference', { ...item.reference, model: v })
                }
                options={[
                  { value: 'Page', label: 'Page' },
                  { value: 'Category', label: 'Category' },
                  { value: 'Product', label: 'Product' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Reference ID">
              <Input
                value={item.reference?.id ?? ''}
                onChange={(e) =>
                  update('reference', { ...item.reference, id: e.target.value })
                }
                placeholder="MongoDB ObjectId"
              />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Form.Item label="Open in">
        <Select
          value={item.target ?? '_self'}
          onChange={(v) => update('target', v)}
          options={[
            { value: '_self', label: 'Same Tab' },
            { value: '_blank', label: 'New Tab' },
          ]}
        />
      </Form.Item>

      <Form.Item label="Icon (class name or emoji)">
        <Input
          value={item.icon ?? ''}
          onChange={(e) => update('icon', e.target.value)}
          placeholder="e.g. home or emoji"
        />
      </Form.Item>

      <Form.Item label="Visible" valuePropName="checked">
        <Switch
          checked={item.isVisible}
          onChange={(v) => update('isVisible', v)}
        />
      </Form.Item>

      <Button type="primary" block onClick={onApply}>
        Apply Changes
      </Button>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Main Menu Editor
// ---------------------------------------------------------------------------

export default function MenuEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [menuMeta, setMenuMeta] = useState<Partial<CmsMenu>>({
    name: '',
    slug: '',
    location: 'primary',
    status: 'active',
    isDefault: false,
  });
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['cms-menu', id],
    queryFn: () => menusApi.getById(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (menuData?.data) {
      const m = menuData.data;
      setMenuMeta({
        name: m.name,
        slug: m.slug,
        location: m.location,
        status: m.status,
        isDefault: m.isDefault,
      });
      setItems(m.items ?? []);
    }
  }, [menuData]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<CmsMenu> = { ...menuMeta, items };
      if (isNew) return menusApi.create(payload);
      return menusApi.update(id!, payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['cms-menus'] });
      toast.success('Menu saved');
      if (isNew && result?.data?._id) {
        navigate(`/cms/menus/${result.data._id}`, { replace: true });
      }
    },
    onError: () => toast.error('Failed to save menu'),
  });

  const addTopLevelItem = () => {
    const newItem: MenuItem = {
      _id: generateTempId(),
      label: 'New Item',
      type: 'link',
      url: '#',
      children: [],
      order: items.length,
      isVisible: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleSelect = (keys: React.Key[]) => {
    const key = keys[0] as string;
    if (!key) {
      setSelectedKey(null);
      setEditingItem(null);
      return;
    }
    setSelectedKey(key);
    const found = findItemByTempId(items, key);
    setEditingItem(found ? { ...found } : null);
  };

  const handleApply = () => {
    if (!selectedKey || !editingItem) return;
    setItems((prev) => replaceItemByTempId(prev, selectedKey, editingItem));
    toast.success('Item updated');
  };

  const handleDeleteSelected = () => {
    if (!selectedKey) return;
    setItems((prev) => removeItemByTempId(prev, selectedKey));
    setSelectedKey(null);
    setEditingItem(null);
  };

  const treeData = buildTreeData(items);

  if (!isNew && isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cms/menus')}>
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {isNew ? 'New Menu' : (menuMeta.name || 'Edit Menu')}
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save Menu
        </Button>
      </div>

      {/* Meta settings */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Menu Name" style={{ marginBottom: 0 }}>
              <Input
                value={menuMeta.name ?? ''}
                onChange={(e) =>
                  setMenuMeta((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Primary Navigation"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item label="Slug" style={{ marginBottom: 0 }}>
              <Input
                value={menuMeta.slug ?? ''}
                onChange={(e) =>
                  setMenuMeta((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="primary-nav"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item label="Location" style={{ marginBottom: 0 }}>
              <Select
                value={menuMeta.location}
                onChange={(v) => setMenuMeta((prev) => ({ ...prev, location: v }))}
                options={[
                  { value: 'primary', label: 'Primary' },
                  { value: 'footer', label: 'Footer' },
                  { value: 'mobile', label: 'Mobile' },
                  { value: 'sidebar', label: 'Sidebar' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item label="Status" style={{ marginBottom: 0 }}>
              <Select
                value={menuMeta.status}
                onChange={(v) => setMenuMeta((prev) => ({ ...prev, status: v as 'active' | 'inactive' }))}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* Left: Tree */}
        <Col xs={24} md={12}>
          <Card
            title="Menu Items"
            size="small"
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addTopLevelItem}
                >
                  Add Item
                </Button>
                {selectedKey && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteSelected}
                  >
                    Delete
                  </Button>
                )}
              </Space>
            }
            style={{ minHeight: 400 }}
          >
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>
                <Text type="secondary">No menu items yet. Click "Add Item" to start.</Text>
              </div>
            ) : (
              <Tree
                treeData={treeData}
                selectedKeys={selectedKey ? [selectedKey] : []}
                onSelect={handleSelect}
                defaultExpandAll
              />
            )}
          </Card>
        </Col>

        {/* Right: Item settings */}
        <Col xs={24} md={12}>
          <Card title="Item Settings" size="small" style={{ minHeight: 400 }}>
            {editingItem ? (
              <ItemSettingsForm
                item={editingItem}
                onChange={setEditingItem}
                onApply={handleApply}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>
                <Divider />
                <Text type="secondary">Select a menu item to edit its settings.</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
