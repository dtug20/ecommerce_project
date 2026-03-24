import { useState, useCallback, useRef } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Form,
  InputNumber,
  Switch,
  Tooltip,
  Popconfirm,
  Image,
  Typography,
  Row,
  Col,
  Divider,
  Tag,
  Cascader,
  Tabs,
  Space,
  Empty,
  Card,
  Statistic,
  Drawer,
  Flex,
  Progress,
  Avatar,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  WarningOutlined,
  PictureOutlined,
  ShoppingOutlined,
  InboxOutlined,
  StarOutlined,
  StopOutlined,
  TagOutlined,
  CalendarOutlined,
  BarcodeOutlined,
  InfoCircleOutlined,
  ColumnWidthOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { productsApi, categoriesApi } from '@/services/api';
import ImageUpload from '@/components/commons/ImageUpload';
import type { Product, Category, ProductVariant, ProductSeo, ProductStats } from '@/types';
import { formatCurrency, formatDate } from '@/hooks/useFormatters';
import StatusBadge from '@/components/commons/StatusBadge';
import PageHeader from '@/components/commons/PageHeader';

const { Text, Title, Paragraph } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Filters {
  search: string;
  category: string;
  status: string;
}

interface ProductFormValues {
  title: string;
  description?: string;
  price: number;
  discount?: number;
  quantity: number;
  shipping?: number;
  category?: string[];
  status: 'Show' | 'Hide';
  img?: string;
  featured?: boolean;
  colors?: string;
  sizes?: string;
  tags?: string;
  weight?: number;
  dimLength?: number;
  dimWidth?: number;
  dimHeight?: number;
  barcode?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
}

interface VariantFormState {
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  price: number;
  stock: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FILTERS: Filters = { search: '', category: '', status: '' };
const PAGE_SIZE = 10;
const PLACEHOLDER_IMG = 'https://placehold.co/64x64?text=No+Img';
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitComma(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function joinArray(arr: string[] | undefined): string {
  return arr ? arr.join(', ') : '';
}

function getStockStatus(qty: number): { color: string; text: string; bg: string } {
  if (qty === 0) return { color: '#ff4d4f', text: 'Out of stock', bg: '#fff2f0' };
  if (qty <= 5) return { color: '#fa8c16', text: 'Critical', bg: '#fff7e6' };
  if (qty <= 10) return { color: '#faad14', text: 'Low stock', bg: '#fffbe6' };
  return { color: '#52c41a', text: 'In stock', bg: '#f6ffed' };
}

// ---------------------------------------------------------------------------
// Product image component
// ---------------------------------------------------------------------------

function ProductImage({ src, alt, size = 56 }: { src?: string; alt: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0' }}
        fallback={PLACEHOLDER_IMG}
        preview={{ mask: <EyeOutlined /> }}
      />
    );
  }
  return (
    <Avatar
      shape="square"
      size={size}
      icon={<PictureOutlined />}
      style={{ backgroundColor: '#fafafa', color: '#d9d9d9', borderRadius: 8, border: '1px solid #f0f0f0' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Stats cards
// ---------------------------------------------------------------------------

function StatsCards({ stats, loading }: { stats: ProductStats | null; loading: boolean }) {
  const total = stats?.totalProducts ?? 0;
  const active = stats?.activeProducts ?? 0;
  const lowStock = stats?.lowStockProducts ?? 0;
  const outOfStock = stats?.outOfStockProducts ?? 0;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={12} md={6}>
        <Card style={{ borderRadius: 12, height: '100%' }} loading={loading} size="small">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 13 }}>Total Products</Text>}
            value={total}
            prefix={<ShoppingOutlined style={{ color: '#1677ff', fontSize: 20 }} />}
            valueStyle={{ color: '#1677ff', fontWeight: 600 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Card style={{ borderRadius: 12, height: '100%' }} loading={loading} size="small">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 13 }}>Active</Text>}
            value={active}
            prefix={<StarOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
            valueStyle={{ color: '#52c41a', fontWeight: 600 }}
          />
          {total > 0 && (
            <Progress
              percent={Math.round((active / total) * 100)}
              showInfo={false}
              strokeColor="#52c41a"
              size="small"
              style={{ marginTop: 4 }}
            />
          )}
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Card style={{ borderRadius: 12, height: '100%' }} loading={loading} size="small">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 13 }}>Low Stock</Text>}
            value={lowStock}
            prefix={<WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />}
            valueStyle={{ color: '#faad14', fontWeight: 600 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Card style={{ borderRadius: 12, height: '100%' }} loading={loading} size="small">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 13 }}>Out of Stock</Text>}
            value={outOfStock}
            prefix={<StopOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />}
            valueStyle={{ color: '#ff4d4f', fontWeight: 600 }}
          />
        </Card>
      </Col>
    </Row>
  );
}

// ---------------------------------------------------------------------------
// VariantsTab
// ---------------------------------------------------------------------------

interface VariantsTabProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

function VariantsTab({ variants, onChange }: VariantsTabProps) {
  const [addingVariant, setAddingVariant] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [variantForm] = Form.useForm<VariantFormState>();

  const handleAddOrUpdate = async () => {
    try {
      const values = await variantForm.validateFields();
      const isDuplicate = variants.some(
        (v, i) => v.sku === values.sku && i !== editingIndex,
      );
      if (isDuplicate) {
        toast.error('SKU must be unique within this product');
        return;
      }
      const newVariant: ProductVariant = {
        sku: values.sku,
        color: { name: values.colorName, clrCode: values.colorHex },
        size: values.size,
        price: values.price,
        stock: values.stock,
      };
      if (editingIndex !== null) {
        const updated = [...variants];
        updated[editingIndex] = { ...updated[editingIndex], ...newVariant };
        onChange(updated);
        setEditingIndex(null);
      } else {
        onChange([...variants, newVariant]);
      }
      variantForm.resetFields();
      setAddingVariant(false);
    } catch {
      // validation errors surface on form
    }
  };

  const handleEditVariant = (index: number) => {
    const v = variants[index];
    variantForm.setFieldsValue({
      sku: v.sku,
      colorName: v.color.name,
      colorHex: v.color.clrCode,
      size: v.size,
      price: v.price,
      stock: v.stock,
    });
    setEditingIndex(index);
    setAddingVariant(true);
  };

  const handleDeleteVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const variantColumns: TableProps<ProductVariant>['columns'] = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (sku: string) => (
        <Tag style={{ fontFamily: 'monospace', borderRadius: 4 }}>{sku}</Tag>
      ),
    },
    {
      title: 'Color',
      key: 'color',
      width: 120,
      render: (_: unknown, record: ProductVariant) => (
        <Flex align="center" gap={6}>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: record.color.clrCode,
              border: '1px solid #d9d9d9',
              flexShrink: 0,
            }}
          />
          <Text style={{ fontSize: 12 }}>{record.color.name}</Text>
        </Flex>
      ),
    },
    { title: 'Size', dataIndex: 'size', key: 'size', width: 70 },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 70,
      render: (v: number) => {
        const status = getStockStatus(v);
        return <Text style={{ color: status.color, fontWeight: 600 }}>{v}</Text>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, _record: ProductVariant, index: number) => (
        <Space size={2}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEditVariant(index)} />
          <Popconfirm
            title="Remove this variant?"
            onConfirm={() => handleDeleteVariant(index)}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table<ProductVariant>
        rowKey={(_, idx) => String(idx)}
        columns={variantColumns}
        dataSource={variants}
        pagination={false}
        size="small"
        style={{ marginBottom: 12 }}
        expandable={{ childrenColumnName: '__children' }}
        locale={{
          emptyText: (
            <div style={{ padding: '16px 0' }}>
              <InboxOutlined style={{ fontSize: 28, color: '#d9d9d9' }} />
              <div style={{ color: '#8c8c8c', marginTop: 4, fontSize: 13 }}>No variants yet</div>
            </div>
          ),
        }}
      />

      {addingVariant ? (
        <Card size="small" style={{ borderRadius: 8, background: '#fafafa' }}>
          <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            {editingIndex !== null ? 'Edit Variant' : 'New Variant'}
          </Text>
          <Form form={variantForm} layout="vertical" size="small">
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="SKU-001" style={{ fontFamily: 'monospace' }} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="colorName" label="Color" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Red" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="colorHex" label="Hex" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="#FF0000" />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="size" label="Size" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="M" />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="stock" label="Stock" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" size="small" onClick={handleAddOrUpdate}>
                {editingIndex !== null ? 'Update' : 'Add'}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setAddingVariant(false);
                  setEditingIndex(null);
                  variantForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form>
        </Card>
      ) : (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => {
            setAddingVariant(true);
            setEditingIndex(null);
            variantForm.resetFields();
          }}
          block
        >
          Add Variant
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SeoTab
// ---------------------------------------------------------------------------

interface SeoTabProps {
  form: ReturnType<typeof Form.useForm<ProductFormValues>>[0];
  slug?: string;
}

function SeoTab({ form, slug }: SeoTabProps) {
  const metaTitle = Form.useWatch('metaTitle', form) ?? '';
  const metaDescription = Form.useWatch('metaDescription', form) ?? '';
  const titleLen = metaTitle.length;
  const descLen = metaDescription.length;

  return (
    <div>
      {/* Google preview */}
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa' }}
        styles={{ body: { padding: 12 } }}
      >
        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Search Preview
        </Text>
        <div style={{ marginTop: 8 }}>
          <Text style={{ color: '#1a0dab', fontSize: 16 }}>
            {metaTitle || 'Page Title'}
          </Text>
          <div style={{ color: '#006621', fontSize: 12, fontFamily: 'monospace' }}>
            example.com/products/{slug || 'product-slug'}
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {metaDescription || 'Meta description will appear here...'}
          </Text>
        </div>
      </Card>

      <Form.Item
        name="metaTitle"
        label={
          <Flex justify="space-between" style={{ width: '100%' }}>
            <span>Meta Title</span>
            <Text type={titleLen > 70 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              {titleLen}/70
            </Text>
          </Flex>
        }
      >
        <Input placeholder="SEO page title (recommended: 50-70 chars)" maxLength={120} />
      </Form.Item>

      <Form.Item
        name="metaDescription"
        label={
          <Flex justify="space-between" style={{ width: '100%' }}>
            <span>Meta Description</span>
            <Text type={descLen > 160 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              {descLen}/160
            </Text>
          </Flex>
        }
      >
        <Input.TextArea rows={3} placeholder="SEO description (recommended: under 160 chars)" maxLength={320} />
      </Form.Item>

      <Form.Item name="metaKeywords" label="Meta Keywords">
        <Select
          mode="tags"
          placeholder="Add keywords and press Enter"
          tokenSeparators={[',']}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item name="ogImage" label="OG Image URL">
        <Input placeholder="https://example.com/og-image.jpg" />
      </Form.Item>

      {slug && (
        <Form.Item label="Canonical URL">
          <Input
            readOnly
            value={`/products/${slug}`}
            style={{ background: '#fafafa', color: '#8c8c8c', fontFamily: 'monospace', fontSize: 12 }}
          />
        </Form.Item>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product detail drawer
// ---------------------------------------------------------------------------

function ProductDetail({
  product,
}: {
  product: Product;
}) {
  const stockStatus = getStockStatus(product.quantity ?? 0);
  const hasDiscount = (product.discount ?? 0) > 0;
  const finalPrice = hasDiscount
    ? product.price * (1 - (product.discount ?? 0) / 100)
    : product.price;

  return (
    <div>
      {/* Hero */}
      <Flex gap={16} style={{ marginBottom: 24 }}>
        <ProductImage src={product.img} alt={product.title} size={100} />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: 0 }}>{product.title}</Title>
          {product.slug && (
            <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
              /{product.slug}
            </Text>
          )}
          <Flex gap={6} style={{ marginTop: 8 }} wrap="wrap">
            <StatusBadge status={product.status} />
            {product.featured && <Tag color="gold">Featured</Tag>}
            {product.productType && (
              <Tag color="blue">{product.productType}</Tag>
            )}
          </Flex>
        </div>
      </Flex>

      {/* Price section */}
      <Card
        size="small"
        style={{ borderRadius: 8, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Flex justify="space-between" align="center">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Price</Text>
            <div>
              <Text strong style={{ fontSize: 22 }}>{formatCurrency(finalPrice)}</Text>
              {hasDiscount && (
                <>
                  <Text
                    delete
                    type="secondary"
                    style={{ marginLeft: 8, fontSize: 14 }}
                  >
                    {formatCurrency(product.price)}
                  </Text>
                  <Tag color="red" style={{ marginLeft: 6, borderRadius: 4 }}>
                    -{product.discount}%
                  </Tag>
                </>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Stock</Text>
            <div>
              <Tag
                color={stockStatus.color === '#52c41a' ? 'success' : stockStatus.color === '#ff4d4f' ? 'error' : 'warning'}
                style={{ fontSize: 14, padding: '2px 10px', borderRadius: 4 }}
              >
                {product.quantity ?? 0} units
              </Tag>
            </div>
          </div>
        </Flex>
      </Card>

      {/* Metrics row */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11 }}>Sold</Text>}
              value={product.sellCount ?? 0}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11 }}>Reviews</Text>}
              value={product.reviews?.length ?? 0}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11 }}>Variants</Text>}
              value={product.variants?.length ?? 0}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Description */}
      {product.description && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Description
          </Text>
          <Paragraph style={{ marginTop: 4, marginBottom: 0, color: '#595959' }}>
            {product.description}
          </Paragraph>
        </div>
      )}

      {/* Category & Brand */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Classification
        </Text>
        <Flex gap={8} style={{ marginTop: 6 }} wrap="wrap">
          {(product as any).parent && (
            <Tag icon={<TagOutlined />} style={{ borderRadius: 4, padding: '2px 8px' }}>
              {(product as any).parent}
              {(product as any).children ? ` > ${(product as any).children}` : ''}
            </Tag>
          )}
          {product.brand?.name && (
            <Tag color="purple" style={{ borderRadius: 4, padding: '2px 8px' }}>
              {product.brand.name}
            </Tag>
          )}
        </Flex>
      </div>

      {/* Colors, sizes, tags */}
      {((product.colors?.length ?? 0) > 0 || (product.sizes?.length ?? 0) > 0 || (product.tags?.length ?? 0) > 0) && (
        <div style={{ marginBottom: 16 }}>
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Colors
              </Text>
              <div style={{ marginTop: 4 }}>
                {product.colors.map((c) => (
                  <Tag key={c} style={{ borderRadius: 4, marginBottom: 4 }}>{c}</Tag>
                ))}
              </div>
            </div>
          )}
          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Sizes
              </Text>
              <div style={{ marginTop: 4 }}>
                {product.sizes.map((s) => (
                  <Tag key={s} style={{ borderRadius: 4, marginBottom: 4 }}>{s}</Tag>
                ))}
              </div>
            </div>
          )}
          {product.tags && product.tags.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Tags
              </Text>
              <div style={{ marginTop: 4 }}>
                {product.tags.map((t) => (
                  <Tag key={t} color="blue" style={{ borderRadius: 4, marginBottom: 4 }}>{t}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Variants ({product.variants.length})
          </Text>
          <div style={{ marginTop: 8 }}>
            {product.variants.map((v, idx) => (
              <Card
                key={v.sku || idx}
                size="small"
                style={{ marginBottom: 6, borderRadius: 6 }}
                styles={{ body: { padding: '8px 12px' } }}
              >
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: v.color.clrCode,
                        border: '1px solid #d9d9d9',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <Text style={{ fontSize: 13 }}>
                      {v.color.name} / {v.size}
                    </Text>
                    <Tag style={{ fontFamily: 'monospace', fontSize: 11, borderRadius: 4 }}>
                      {v.sku}
                    </Tag>
                  </Flex>
                  <Flex gap={12}>
                    <Text strong style={{ fontSize: 13 }}>{formatCurrency(v.price)}</Text>
                    <Text type={v.stock <= 5 ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
                      {v.stock} pcs
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Physical properties */}
      {(product.weight || product.barcode || product.dimensions?.length) && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Physical Properties
          </Text>
          <Flex gap={16} style={{ marginTop: 6 }} wrap="wrap">
            {product.weight && (
              <Flex align="center" gap={4}>
                <ColumnWidthOutlined style={{ color: '#8c8c8c' }} />
                <Text style={{ fontSize: 13 }}>{product.weight}g</Text>
              </Flex>
            )}
            {product.dimensions?.length && (
              <Flex align="center" gap={4}>
                <InboxOutlined style={{ color: '#8c8c8c' }} />
                <Text style={{ fontSize: 13 }}>
                  {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm
                </Text>
              </Flex>
            )}
            {product.barcode && (
              <Flex align="center" gap={4}>
                <BarcodeOutlined style={{ color: '#8c8c8c' }} />
                <Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{product.barcode}</Text>
              </Flex>
            )}
          </Flex>
        </div>
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/* Timestamps */}
      <Flex vertical gap={6}>
        <Flex align="center" gap={6}>
          <CalendarOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Created: {formatDate(product.createdAt)}
          </Text>
        </Flex>
        <Flex align="center" gap={6}>
          <CalendarOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Updated: {formatDate(product.updatedAt)}
          </Text>
        </Flex>
      </Flex>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product edit drawer
// ---------------------------------------------------------------------------

interface ProductDrawerProps {
  open: boolean;
  editingProduct: Product | null;
  categories: Category[];
  onClose: () => void;
}

function ProductDrawer({ open, editingProduct, categories, onClose }: ProductDrawerProps) {
  const [form] = Form.useForm<ProductFormValues>();
  const queryClient = useQueryClient();
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const isEdit = editingProduct !== null;

  const handleAfterOpenChange = (visible: boolean) => {
    if (visible) {
      if (editingProduct) {
        form.setFieldsValue({
          title: editingProduct.title,
          description: editingProduct.description ?? '',
          price: editingProduct.price,
          discount: editingProduct.discount ?? 0,
          quantity: editingProduct.quantity,
          shipping: editingProduct.shipping ?? 0,
          category: editingProduct.productType && (editingProduct as any).parent
            ? [editingProduct.productType, (editingProduct as any).parent, (editingProduct as any).children].filter(Boolean)
            : undefined,
          status: editingProduct.status as 'Show' | 'Hide',
          img: editingProduct.img ?? '',
          featured: editingProduct.featured ?? false,
          colors: joinArray(editingProduct.colors),
          sizes: joinArray(editingProduct.sizes),
          tags: joinArray(editingProduct.tags),
          weight: editingProduct.weight,
          dimLength: editingProduct.dimensions?.length,
          dimWidth: editingProduct.dimensions?.width,
          dimHeight: editingProduct.dimensions?.height,
          barcode: editingProduct.barcode ?? '',
          metaTitle: editingProduct.seo?.metaTitle ?? '',
          metaDescription: editingProduct.seo?.metaDescription ?? '',
          metaKeywords: editingProduct.seo?.metaKeywords ?? [],
          ogImage: editingProduct.seo?.ogImage ?? '',
        });
        setVariants(editingProduct.variants ?? []);
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'Show', featured: false, discount: 0, shipping: 0 });
        setVariants([]);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update product');
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const seo: ProductSeo = {
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        metaKeywords: values.metaKeywords ?? [],
        ogImage: values.ogImage,
      };
      const payload: Partial<Product> = {
        title: values.title,
        description: values.description,
        price: values.price,
        discount: values.discount ?? 0,
        quantity: values.quantity,
        shipping: values.shipping ?? 0,
        status: values.status,
        img: values.img,
        featured: values.featured ?? false,
        colors: splitComma(values.colors),
        sizes: splitComma(values.sizes),
        tags: splitComma(values.tags),
        variants,
        seo,
        weight: values.weight,
        dimensions: {
          length: values.dimLength,
          width: values.dimWidth,
          height: values.dimHeight,
        },
        barcode: values.barcode,
      };
      const categoryVal = values.category;
      if (categoryVal && categoryVal.length > 0) {
        const prodType = categoryVal[0];
        const parentName = categoryVal[1] || '';
        const childName = categoryVal[2] || '';
        const catObj = categories.find(c => c.parent === parentName && c.productType === prodType);
        if (catObj) {
          (payload as any).productType = prodType;
          (payload as any).parent = parentName;
          (payload as any).children = childName;
          (payload as any).category = { id: catObj._id, name: parentName };
        }
      }

      if (isEdit && editingProduct) {
        updateMutation.mutate({ id: editingProduct._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch {
      // Ant Design validation error
    }
  };

  const tabItems = [
    {
      key: 'general',
      label: 'General',
      children: (
        <>
          {/* Image upload */}
          <Form.Item name="img" label="Product Image">
            <ImageUpload placeholder="Upload Product Image" />
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Product title is required' }]}
          >
            <Input placeholder="Enter product title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter product description" showCount maxLength={2000} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price (USD)"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" prefix="$" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discount" label="Discount (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Cascader
                  placeholder="Select category"
                  allowClear
                  showSearch
                  options={Object.entries(
                    categories.reduce((acc, cat) => {
                      const pt = cat.productType || 'other';
                      if (!acc[pt]) acc[pt] = [];
                      acc[pt].push(cat);
                      return acc;
                    }, {} as Record<string, Category[]>)
                  ).map(([pt, cats]) => ({
                    value: pt,
                    label: pt.charAt(0).toUpperCase() + pt.slice(1),
                    children: cats.map(c => ({
                      value: c.parent,
                      label: c.parent,
                      children: c.children?.map(child => ({ value: child, label: child })) || [],
                    })),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Status">
                <Select
                  options={[
                    { value: 'Show', label: 'Visible' },
                    { value: 'Hide', label: 'Hidden' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="shipping" label="Shipping ($)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="featured" label="Featured" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13, color: '#8c8c8c' }}>
            Attributes
          </Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="colors" label="Colors" tooltip="Comma-separated">
                <Input placeholder="red, blue" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sizes" label="Sizes" tooltip="Comma-separated">
                <Input placeholder="S, M, L, XL" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tags" label="Tags" tooltip="Comma-separated">
                <Input placeholder="sale, new" />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13, color: '#8c8c8c' }}>
            Shipping & Physical
          </Divider>

          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="weight" label="Weight (g)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dimLength" label="L (cm)">
                <InputNumber min={0} precision={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dimWidth" label="W (cm)">
                <InputNumber min={0} precision={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dimHeight" label="H (cm)">
                <InputNumber min={0} precision={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="barcode" label="Barcode / GTIN">
            <Input placeholder="e.g. 012345678905" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'variants',
      label: `Variants${variants.length > 0 ? ` (${variants.length})` : ''}`,
      children: <VariantsTab variants={variants} onChange={setVariants} />,
    },
    {
      key: 'seo',
      label: 'SEO',
      children: <SeoTab form={form} slug={editingProduct?.slug} />,
    },
  ];

  return (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          {isEdit ? <EditOutlined /> : <PlusOutlined />}
          <span>{isEdit ? 'Edit Product' : 'New Product'}</span>
        </Flex>
      }
      open={open}
      onClose={onClose}
      width={640}
      destroyOnClose
      afterOpenChange={handleAfterOpenChange}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={isLoading}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ status: 'Show', featured: false, discount: 0, shipping: 0 }}
      >
        <Tabs items={tabItems} size="small" />
      </Form>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// ProductsPage — main component
// ---------------------------------------------------------------------------

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [committedSearch, setCommittedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(committedSearch ? { search: committedSearch } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching,
  } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsApi.getAll(queryParams),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', { status: 'Show' }],
    queryFn: () => categoriesApi.getAll({ status: 'Show' }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsApi.getStats(),
    staleTime: 1000 * 60 * 5,
  });

  const categories: Category[] = categoriesData?.data ?? [];
  const products: Product[] = productsData?.data ?? [];
  const pagination = productsData?.pagination;
  const stats: ProductStats | null = statsData?.data ?? null;

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
      setDeletingId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete product');
      setDeletingId(null);
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCommittedSearch(value);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof Omit<Filters, 'search'>, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setCommittedSearch('');
    setPage(1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  const handleOpenAdd = useCallback(() => {
    setEditingProduct(null);
    setDrawerOpen(true);
  }, []);

  const handleOpenEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingProduct(null);
  }, []);

  const handleView = useCallback((product: Product) => {
    setViewingProduct(product);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewingProduct(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const hasActiveFilters =
    filters.search !== '' || filters.category !== '' || filters.status !== '';

  const columns: TableProps<Product>['columns'] = [
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, record: Product) => (
        <Flex align="center" gap={12}>
          <ProductImage src={record.img} alt={record.title} />
          <div style={{ minWidth: 0 }}>
            <Flex align="center" gap={6}>
              <Text strong style={{ fontSize: 14 }} ellipsis>
                {record.title}
              </Text>
              {record.featured && <StarOutlined style={{ color: '#eb2f96', fontSize: 12, flexShrink: 0 }} />}
            </Flex>
            {record.slug && (
              <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                /{record.slug}
              </Text>
            )}
            <div style={{ marginTop: 2 }}>
              {(record as any).parent && (
                <Tag style={{ fontSize: 11, borderRadius: 4, marginRight: 4 }}>
                  {(record as any).parent}
                </Tag>
              )}
              {record.brand?.name && (
                <Tag color="purple" style={{ fontSize: 11, borderRadius: 4 }}>
                  {record.brand.name}
                </Tag>
              )}
            </div>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 130,
      sorter: (a: Product, b: Product) => a.price - b.price,
      render: (_: unknown, record: Product) => {
        const hasDiscount = (record.discount ?? 0) > 0;
        const final = hasDiscount
          ? record.price * (1 - (record.discount ?? 0) / 100)
          : record.price;
        return (
          <div>
            <Text strong>{formatCurrency(final)}</Text>
            {hasDiscount && (
              <div>
                <Text delete type="secondary" style={{ fontSize: 11 }}>
                  {formatCurrency(record.price)}
                </Text>
                <Tag color="red" style={{ fontSize: 10, marginLeft: 4, borderRadius: 4, padding: '0 4px' }}>
                  -{record.discount}%
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Stock',
      key: 'quantity',
      width: 100,
      sorter: (a: Product, b: Product) => (a.quantity ?? 0) - (b.quantity ?? 0),
      render: (_: unknown, record: Product) => {
        const qty = record.quantity ?? 0;
        const status = getStockStatus(qty);
        return (
          <Tooltip title={status.text}>
            <Tag
              style={{
                borderRadius: 4,
                fontWeight: 600,
                borderColor: status.color,
                color: status.color,
                background: status.bg,
              }}
            >
              {qty === 0 && <StopOutlined style={{ marginRight: 4 }} />}
              {qty <= 10 && qty > 0 && <WarningOutlined style={{ marginRight: 4 }} />}
              {qty}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Sold',
      key: 'sellCount',
      width: 70,
      align: 'center',
      sorter: (a: Product, b: Product) => (a.sellCount ?? 0) - (b.sellCount ?? 0),
      render: (_: unknown, record: Product) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {record.sellCount ?? 0}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 85,
      filters: [
        { text: 'Visible', value: 'Show' },
        { text: 'Hidden', value: 'Hide' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (_: unknown, record: Product) => <StatusBadge status={record.status} />,
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_: unknown, record: Product) => (
        <Space size={0}>
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete product"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === record._id && deleteMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="Product Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
            Add Product
          </Button>
        }
      />

      {/* Stats cards */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Filter bar */}
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 12 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Flex gap={12} wrap="wrap" align="center">
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            onClear={() => handleSearchChange('')}
            style={{ width: 260 }}
          />

          <Select
            placeholder="Category"
            style={{ width: 180 }}
            value={filters.category || undefined}
            onChange={(val) => handleFilterChange('category', val ?? '')}
            allowClear
            showSearch
            optionFilterProp="label"
            options={categories.map((c) => ({ value: c._id, label: c.parent }))}
          />

          <Select
            placeholder="Status"
            style={{ width: 130 }}
            value={filters.status || undefined}
            onChange={(val) => handleFilterChange('status', val ?? '')}
            allowClear
            options={[
              { value: 'Show', label: 'Visible' },
              { value: 'Hide', label: 'Hidden' },
            ]}
          />

          {hasActiveFilters && (
            <Button type="link" onClick={handleClearFilters} style={{ padding: 0 }}>
              Clear filters
            </Button>
          )}

          <div style={{ flex: 1 }} />

          <Text type="secondary" style={{ fontSize: 13 }}>
            {pagination?.totalItems ?? 0} products
          </Text>
        </Flex>
      </Card>

      {/* Products table */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table<Product>
          rowKey="_id"
          columns={columns}
          dataSource={products}
          loading={productsLoading || isFetching}
          expandable={{ childrenColumnName: '__children' }}
          scroll={{ x: 820 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={hasActiveFilters ? 'No products match your filters' : 'No products yet'}
              >
                {!hasActiveFilters && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
                    Add First Product
                  </Button>
                )}
              </Empty>
            ),
          }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: pagination?.totalItems ?? 0,
            showSizeChanger: false,
            showTotal: (total, range) => (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {range[0]}-{range[1]} of {total}
              </Text>
            ),
            onChange: (newPage) => setPage(newPage),
            style: { padding: '0 16px' },
          }}
        />
      </Card>

      {/* Add / Edit Drawer */}
      <ProductDrawer
        open={drawerOpen}
        editingProduct={editingProduct}
        categories={categories}
        onClose={handleCloseDrawer}
      />

      {/* View Detail Drawer */}
      <Drawer
        title={
          <Flex align="center" gap={8}>
            <InfoCircleOutlined />
            <span>Product Details</span>
          </Flex>
        }
        open={viewingProduct !== null}
        onClose={handleCloseView}
        width={480}
        destroyOnClose
        extra={
          viewingProduct && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                const product = viewingProduct;
                handleCloseView();
                handleOpenEdit(product);
              }}
            >
              Edit
            </Button>
          )
        }
      >
        {viewingProduct && (
          <ProductDetail
            product={viewingProduct}
          />
        )}
      </Drawer>
    </div>
  );
}
