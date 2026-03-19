import { useState, useCallback, useRef } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Switch,
  Tooltip,
  Popconfirm,
  Image,
  Typography,
  Badge,
  Row,
  Col,
  Descriptions,
  Divider,
  Tag,
  Cascader,
  Tabs,
  Space,
  ColorPicker,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClearOutlined,
  SearchOutlined,
  WarningOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { productsApi, categoriesApi } from '@/services/api';
import type { Product, Category, ProductVariant, ProductSeo } from '@/types';
import { formatCurrency } from '@/hooks/useFormatters';
import StatusBadge from '@/components/commons/StatusBadge';
import PageHeader from '@/components/commons/PageHeader';

const { Text } = Typography;

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
  // Shipping/physical
  weight?: number;
  dimLength?: number;
  dimWidth?: number;
  dimHeight?: number;
  barcode?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
}

// Variant editing state (kept in component state, not in the Form directly)
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
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinArray(arr: string[] | undefined): string {
  return arr ? arr.join(', ') : '';
}

// ---------------------------------------------------------------------------
// ProductModal — Add / Edit
// ---------------------------------------------------------------------------

interface ProductModalProps {
  open: boolean;
  editingProduct: Product | null;
  categories: Category[];
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// VariantsTab — inline variant management
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
      // Validate SKU unique within product
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
        <Tag style={{ fontFamily: 'monospace' }}>{sku}</Tag>
      ),
    },
    {
      title: 'Color',
      key: 'color',
      width: 120,
      render: (_: unknown, record: ProductVariant) => (
        <Space size={6}>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: record.color.clrCode,
              border: '1px solid #d9d9d9',
            }}
          />
          <Text style={{ fontSize: 12 }}>{record.color.name}</Text>
        </Space>
      ),
    },
    { title: 'Size', dataIndex: 'size', key: 'size', width: 70 },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      render: (v: number) => `$${v.toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 70,
      render: (v: number) => (
        <span style={{ color: v <= 5 ? '#ff4d4f' : undefined }}>{v}</span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, _record: ProductVariant, index: number) => (
        <Space size={2}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditVariant(index)} />
          <Popconfirm
            title="Remove this variant?"
            onConfirm={() => handleDeleteVariant(index)}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
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
        locale={{ emptyText: 'No variants added yet' }}
      />

      {addingVariant ? (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12, background: '#fafafa' }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {editingIndex !== null ? 'Edit Variant' : 'Add Variant'}
          </Text>
          <Form form={variantForm} layout="vertical">
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="SKU-001" style={{ fontFamily: 'monospace' }} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="colorName" label="Color Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Red" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="colorHex" label="Hex Code" rules={[{ required: true, message: 'Required' }]}>
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
        </div>
      ) : (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => {
            setAddingVariant(true);
            setEditingIndex(null);
            variantForm.resetFields();
          }}
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
      <Form.Item
        name="metaTitle"
        label={
          <Space>
            <span>Meta Title</span>
            <Text
              type={titleLen > 70 ? 'danger' : 'secondary'}
              style={{ fontSize: 12 }}
            >
              {titleLen}/70
            </Text>
          </Space>
        }
      >
        <Input placeholder="SEO page title (recommended: 50–70 chars)" maxLength={120} showCount />
      </Form.Item>

      <Form.Item
        name="metaDescription"
        label={
          <Space>
            <span>Meta Description</span>
            <Text
              type={descLen > 160 ? 'danger' : 'secondary'}
              style={{ fontSize: 12 }}
            >
              {descLen}/160
            </Text>
          </Space>
        }
      >
        <Input.TextArea
          rows={3}
          placeholder="SEO description (recommended: under 160 chars)"
          maxLength={320}
          showCount
        />
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
        <Form.Item label="Canonical URL (preview)">
          <Input
            readOnly
            value={`/products/${slug}`}
            style={{ background: '#f5f5f5', color: '#888', fontFamily: 'monospace', fontSize: 12 }}
          />
        </Form.Item>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductModal — Add / Edit (with Variants + SEO tabs)
// ---------------------------------------------------------------------------

function ProductModal({ open, editingProduct, categories, onClose }: ProductModalProps) {
  const [form] = Form.useForm<ProductFormValues>();
  const queryClient = useQueryClient();
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const isEdit = editingProduct !== null;

  // Reset form whenever the modal opens
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
      toast.success('Product created successfully');
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
      toast.success('Product updated successfully');
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
           (payload as any).category = {
             id: catObj._id,
             name: parentName,
           };
        }
      }

      if (isEdit && editingProduct) {
        updateMutation.mutate({ id: editingProduct._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch {
      // Ant Design validation error — swallow so form highlights fields
    }
  };

  const tabItems = [
    {
      key: 'general',
      label: 'General',
      children: (
        <>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Product title is required' }]}
              >
                <Input placeholder="Enter product title" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter product description" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="price"
                label="Price (USD)"
                rules={[{ required: true, message: 'Price is required' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" prefix="$" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="discount" label="Discount (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Quantity is required' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="shipping" label="Shipping Cost (USD)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" prefix="$" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
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
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="Status">
                <Select
                  options={[
                    { value: 'Show', label: 'Show' },
                    { value: 'Hide', label: 'Hide' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="img" label="Image URL">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item name="featured" label="Featured" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="colors" label="Colors" tooltip="Comma-separated values">
                <Input placeholder="red, blue, green" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="sizes" label="Sizes" tooltip="Comma-separated values">
                <Input placeholder="S, M, L, XL" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="tags" label="Tags" tooltip="Comma-separated values">
                <Input placeholder="sale, new, hot" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ fontSize: 13 }}>Shipping & Physical</Divider>
          <Row gutter={12}>
            <Col xs={24} sm={6}>
              <Form.Item name="weight" label="Weight (g)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="dimLength" label="Length (cm)">
                <InputNumber min={0} precision={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="dimWidth" label="Width (cm)">
                <InputNumber min={0} precision={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="dimHeight" label="Height (cm)">
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
    <Modal
      title={isEdit ? 'Edit Product' : 'Add Product'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Update' : 'Create'}
      confirmLoading={isLoading}
      width={800}
      afterOpenChange={handleAfterOpenChange}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Tabs items={tabItems} size="small" />
      </Form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ViewProductModal — read-only detail modal
// ---------------------------------------------------------------------------

interface ViewProductModalProps {
  product: Product | null;
  onClose: () => void;
}

function ViewProductModal({ product, onClose }: ViewProductModalProps) {
  if (!product) return null;

  return (
    <Modal
      title="Product Details"
      open={product !== null}
      onCancel={onClose}
      footer={
        <Button onClick={onClose}>Close</Button>
      }
      width={680}
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
        {product.img ? (
          <Image
            src={product.img}
            alt={product.title}
            width={120}
            height={120}
            style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0' }}
            fallback={PLACEHOLDER_IMG}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              background: '#f5f5f5',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bbb',
              flexShrink: 0,
            }}
          >
            <PictureOutlined style={{ fontSize: 32 }} />
          </div>
        )}
        <div>
          <Typography.Title level={5} style={{ margin: 0, marginBottom: 4 }}>
            {product.title}
          </Typography.Title>
          {product.slug && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              /{product.slug}
            </Text>
          )}
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={product.status} />
            {product.featured && <Tag color="gold" style={{ marginLeft: 4 }}>Featured</Tag>}
          </div>
        </div>
      </div>

      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="Price">
          {formatCurrency(product.price)}
          {product.discount ? (
            <Badge
              count={`-${product.discount}%`}
              style={{ backgroundColor: '#f50', marginLeft: 6 }}
            />
          ) : null}
        </Descriptions.Item>
        <Descriptions.Item label="Quantity">
          <span style={{ color: (product.quantity ?? 0) <= 10 ? '#ff4d4f' : undefined }}>
            {product.quantity ?? 0}
            {(product.quantity ?? 0) <= 10 && (
              <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
            )}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          {(product as any).parent ? `${(product as any).parent} > ${(product as any).children || ''}` : (product.category?.parent ?? '—')}
        </Descriptions.Item>
        <Descriptions.Item label="Brand">
          {product.brand?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Shipping Cost">
          {product.shipping ? formatCurrency(product.shipping) : 'Free'}
        </Descriptions.Item>
        <Descriptions.Item label="Sell Count">
          {product.sellCount ?? 0}
        </Descriptions.Item>
        {product.colors && product.colors.length > 0 && (
          <Descriptions.Item label="Colors" span={2}>
            {product.colors.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </Descriptions.Item>
        )}
        {product.sizes && product.sizes.length > 0 && (
          <Descriptions.Item label="Sizes" span={2}>
            {product.sizes.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </Descriptions.Item>
        )}
        {product.tags && product.tags.length > 0 && (
          <Descriptions.Item label="Tags" span={2}>
            {product.tags.map((t) => (
              <Tag key={t} color="blue">{t}</Tag>
            ))}
          </Descriptions.Item>
        )}
      </Descriptions>

      {product.description && (
        <>
          <Divider />
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {product.description}
          </Typography.Paragraph>
        </>
      )}
    </Modal>
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
  // Committed search (debounced)
  const [committedSearch, setCommittedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

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

  const categories: Category[] = categoriesData?.data ?? [];
  const products: Product[] = productsData?.data ?? [];
  const pagination = productsData?.pagination;

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete product');
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
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
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
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: TableProps<Product>['columns'] = [
    {
      title: 'Image',
      dataIndex: 'img',
      key: 'img',
      width: 80,
      render: (img: string | undefined, record: Product) =>
        img ? (
          <Image
            src={img}
            alt={record.title}
            width={56}
            height={56}
            style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }}
            fallback={PLACEHOLDER_IMG}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              background: '#f5f5f5',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bbb',
            }}
          >
            <PictureOutlined style={{ fontSize: 20 }} />
          </div>
        ),
    },
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, record: Product) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {record.title}
          </Text>
          {record.slug && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.slug}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      width: 160,
      render: (_: unknown, record: Product) => (
        <Text>{(record as any).parent ? `${(record as any).parent} > ${(record as any).children || ''}` : (record.category?.parent ?? '—')}</Text>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 140,
      render: (_: unknown, record: Product) => (
        <div>
          <Text strong>{formatCurrency(record.price)}</Text>
          {record.discount && record.discount > 0 ? (
            <Badge
              count={`-${record.discount}%`}
              style={{ backgroundColor: '#f50', marginLeft: 6, fontSize: 10 }}
            />
          ) : null}
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      render: (qty: number) => {
        const isLow = qty <= 10;
        return (
          <span style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 600 : undefined }}>
            {qty}
            {isLow && (
              <Tooltip title="Low stock">
                <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      fixed: 'right' as const,
      render: (_: unknown, record: Product) => (
        <Button.Group size="small">
          <Tooltip title="View">
            <Button icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete product"
              description="Are you sure you want to delete this product? This action cannot be undone."
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              placement="topRight"
            >
              <Button icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
            </Popconfirm>
          </Tooltip>
        </Button.Group>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasActiveFilters =
    filters.search !== '' || filters.category !== '' || filters.status !== '';

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

      {/* Filters Row */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={7}>
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            onClear={() => handleSearchChange('')}
          />
        </Col>

        <Col xs={24} sm={12} md={6} lg={5}>
          <Select
            placeholder="All Categories"
            style={{ width: '100%' }}
            value={filters.category || undefined}
            onChange={(val) => handleFilterChange('category', val ?? '')}
            allowClear
            showSearch
            optionFilterProp="label"
            options={categories.map((c) => ({ value: c._id, label: c.parent }))}
          />
        </Col>

        <Col xs={24} sm={12} md={5} lg={4}>
          <Select
            placeholder="All Statuses"
            style={{ width: '100%' }}
            value={filters.status || undefined}
            onChange={(val) => handleFilterChange('status', val ?? '')}
            allowClear
            options={[
              { value: 'Show', label: 'Show' },
              { value: 'Hide', label: 'Hide' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={5} lg={4}>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </Button>
        </Col>
      </Row>

      {/* Products Table */}
      <Table<Product>
        rowKey="_id"
        columns={columns}
        dataSource={products}
        loading={productsLoading || isFetching}
        expandable={{ childrenColumnName: '__children' }}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: pagination?.totalItems ?? 0,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} products`,
          onChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Add / Edit Modal */}
      <ProductModal
        open={modalOpen}
        editingProduct={editingProduct}
        categories={categories}
        onClose={handleCloseModal}
      />

      {/* View Modal */}
      <ViewProductModal product={viewingProduct} onClose={handleCloseView} />
    </div>
  );
}
