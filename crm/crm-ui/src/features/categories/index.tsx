import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Switch,
  InputNumber,
  Descriptions,
  Tag,
  Avatar,
  Badge,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tooltip,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ClearOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import type { TableProps } from 'antd';
import type { Category, CategoryStats } from '@/types';
import { categoriesApi } from '@/services/api';
import api from '@/services/api';
import { formatDate } from '@/hooks/useFormatters';
import StatusBadge from '@/components/commons/StatusBadge';
import PageHeader from '@/components/commons/PageHeader';

const { TextArea } = Input;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryFormValues {
  parent: string;
  productType: string;
  description?: string;
  img?: string;
  children?: string[];
  status: 'Show' | 'Hide';
  sortOrder?: number;
  featured?: boolean;
}

// ---------------------------------------------------------------------------
// Hook: debounced state
// Returns [inputValue, debouncedValue, setter]
// ---------------------------------------------------------------------------

function useDebouncedState(
  initialValue: string,
  delay: number,
): [string, string, (value: string) => void] {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const setValue = useCallback(
    (value: string) => {
      setInputValue(value);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
    },
    [delay],
  );

  return [inputValue, debouncedValue, setValue];
}

// ---------------------------------------------------------------------------
// Sub-component: Category thumbnail
// ---------------------------------------------------------------------------

function CategoryImage({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return (
      <Avatar
        shape="square"
        size={48}
        src={src}
        alt={alt}
        style={{ objectFit: 'cover', borderRadius: 6 }}
      />
    );
  }
  return (
    <Avatar
      shape="square"
      size={48}
      icon={<PictureOutlined />}
      style={{ backgroundColor: '#f5f5f5', color: '#bfbfbf' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters — debounce only the search input
  const [searchInput, debouncedSearch, setSearch] = useDebouncedState('', 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form] = Form.useForm<CategoryFormValues>();

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const categoriesQuery = useQuery({
    queryKey: ['categories', page, limit, debouncedSearch, statusFilter, productTypeFilter],
    queryFn: () =>
      categoriesApi.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        productType: productTypeFilter || undefined,
      }),
  });

  const statsQuery = useQuery({
    queryKey: ['categories', 'stats'],
    queryFn: () => categoriesApi.getStats(),
    staleTime: 1000 * 60 * 10,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoriesApi.create(data),
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      setDeletingId(null);
      toast.error(error.message || 'Failed to delete category');
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ status: 'Show', featured: false, sortOrder: 0 });
    setModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      parent: category.parent,
      productType: category.productType,
      description: category.description,
      img: category.img,
      children: category.children ?? [],
      status: category.status,
      sortOrder: category.sortOrder ?? 0,
      featured: category.featured ?? false,
    });
    setModalOpen(true);
  };

  const handleViewCategory = (category: Category) => {
    setViewingCategory(category);
    setViewModalOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: Partial<Category> = {
        parent: values.parent,
        productType: values.productType,
        description: values.description,
        img: values.img,
        children: Array.isArray(values.children)
          ? values.children.map((c) => c?.trim()).filter(Boolean)
          : [],
        status: values.status,
        sortOrder: values.sortOrder,
        featured: values.featured,
      };

      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch {
      // Ant Design validation errors are shown inline — no further action needed
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProductTypeFilter('');
    setPage(1);
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const productTypeStats: { _id: string; count: number }[] =
    (statsQuery.data?.data as CategoryStats | undefined)?.productTypeStats ?? [];

  const categories: Category[] = categoriesQuery.data?.data ?? [];
  const pagination = categoriesQuery.data?.pagination;
  const hasActiveFilters = Boolean(debouncedSearch || statusFilter || productTypeFilter);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: TableProps<Category>['columns'] = [
    {
      title: 'Image',
      key: 'image',
      width: 72,
      render: (_: unknown, record: Category) => (
        <CategoryImage src={record.img} alt={record.parent} />
      ),
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, record: Category) => (
        <div>
          <Typography.Text strong>{record.parent}</Typography.Text>
          {record.children && record.children.length > 0 && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.children.join(', ')}
              </Typography.Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Product Type',
      dataIndex: 'productType',
      key: 'productType',
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: 'Products',
      key: 'products',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Category) => (
        <Badge
          count={record.products?.length ?? 0}
          showZero
          style={{ backgroundColor: '#1677ff' }}
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: Category) => (
        <StatusBadge status={record.status} type="general" />
      ),
    },
    {
      title: 'Created',
      key: 'createdAt',
      width: 170,
      render: (_: unknown, record: Category) => (
        <Typography.Text style={{ fontSize: 12 }} type="secondary">
          {formatDate(record.createdAt)}
        </Typography.Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Category) => (
        <Space size={2}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditCategory(record)}
            />
          </Tooltip>
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewCategory(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Category"
              description="Are you sure you want to delete this category? This action cannot be undone."
              onConfirm={() => handleDeleteCategory(record._id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record._id && deleteMutation.isPending}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <PageHeader
        title="Category Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>
            Add Category
          </Button>
        }
      />

      {/* Filters row */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={7}>
          <Input
            placeholder="Search categories..."
            value={searchInput}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={5} lg={5}>
          <Select
            style={{ width: '100%' }}
            placeholder="All Statuses"
            value={statusFilter || undefined}
            onChange={(val?: string) => {
              setStatusFilter(val ?? '');
              setPage(1);
            }}
            allowClear
            options={[
              { label: 'Show', value: 'Show' },
              { label: 'Hide', value: 'Hide' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={7} lg={7}>
          <Select
            style={{ width: '100%' }}
            placeholder="All Product Types"
            value={productTypeFilter || undefined}
            onChange={(val?: string) => {
              setProductTypeFilter(val ?? '');
              setPage(1);
            }}
            allowClear
            loading={statsQuery.isLoading}
            options={productTypeStats.map((pt) => ({
              label: `${pt._id} (${pt.count})`,
              value: pt._id,
            }))}
          />
        </Col>

        {hasActiveFilters && (
          <Col xs={24} sm={12} md={4} lg={3}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              style={{ width: '100%' }}
            >
              Clear
            </Button>
          </Col>
        )}
      </Row>

      {/* Categories table */}
      <Table<Category>
        rowKey="_id"
        columns={columns}
        dataSource={categories}
        loading={categoriesQuery.isLoading || categoriesQuery.isFetching}
        expandable={{ childrenColumnName: '__children' }}
        pagination={{
          current: page,
          pageSize: limit,
          total: pagination?.totalItems ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} categories`,
          onChange: (p) => setPage(p),
        }}
        scroll={{ x: 820 }}
        size="middle"
        locale={{ emptyText: 'No categories found' }}
      />

      {/* Add / Edit Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalOpen}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okText={editingCategory ? 'Update' : 'Create'}
        confirmLoading={isSubmitting}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'Show', featured: false, sortOrder: 0 }}
          style={{ marginTop: 8 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="parent"
                label="Category Name"
                rules={[{ required: true, message: 'Category name is required' }]}
              >
                <Input placeholder="e.g. Electronics" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productType"
                label="Product Type"
                rules={[{ required: true, message: 'Product type is required' }]}
              >
                <Select
                  options={[
                    { value: 'fashion', label: 'Fashion' },
                    { value: 'electronics', label: 'Electronics' },
                    { value: 'beauty', label: 'Beauty' },
                    { value: 'jewelry', label: 'Jewelry' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder="Select product type"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Brief description of the category" />
          </Form.Item>

          <Form.Item name="img" hidden>
             <Input />
          </Form.Item>
          <Form.Item label="Category Image">
            <Upload
              name="image"
              listType="picture-card"
              showUploadList={false}
              customRequest={async (options) => {
                const { file, onSuccess, onError } = options;
                const formData = new FormData();
                formData.append('image', file as Blob);
                try {
                  const res = await api.post('/api/cloudinary/add-img', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  const url = res.data?.data?.url;
                  if (url) {
                    form.setFieldsValue({ img: url });
                    if (onSuccess) onSuccess('ok');
                    toast.success('Image uploaded successfully');
                  } else {
                    throw new Error('No URL returned');
                  }
                } catch (err: any) {
                  if (onError) onError(err);
                  toast.error('Upload failed');
                }
              }}
            >
              <Form.Item dependencies={['img']} noStyle>
                {() => {
                  const imgUrl = form.getFieldValue('img');
                  return imgUrl ? (
                    <img src={imgUrl} alt="category" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  );
                }}
              </Form.Item>
            </Upload>
          </Form.Item>

          <Form.List name="children">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 8 }}>Sub-categories</div>
                {fields.map((field) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      rules={[{ required: true, message: 'Missing sub-category name' }]}
                      style={{ margin: 0, width: 300 }}
                    >
                      <Input placeholder="Sub-category name" />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} size="small" onClick={() => remove(field.name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Sub-category
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select
                  options={[
                    { label: 'Show', value: 'Show' },
                    { label: 'Hide', value: 'Hide' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="Sort Order">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="featured" label="Featured" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Category Modal */}
      <Modal
        title="Category Details"
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setViewingCategory(null);
        }}
        footer={
          <Button
            onClick={() => {
              setViewModalOpen(false);
              setViewingCategory(null);
            }}
          >
            Close
          </Button>
        }
        width={600}
        destroyOnHidden
      >
        {viewingCategory && (
          <div style={{ marginTop: 8 }}>
            {viewingCategory.img && (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={viewingCategory.img}
                  alt={viewingCategory.parent}
                  style={{
                    maxWidth: 120,
                    maxHeight: 120,
                    borderRadius: 8,
                    objectFit: 'cover',
                    border: '1px solid #f0f0f0',
                  }}
                />
              </div>
            )}

            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Name" span={2}>
                <Typography.Text strong>{viewingCategory.parent}</Typography.Text>
              </Descriptions.Item>

              <Descriptions.Item label="Product Type">
                <Tag color="blue">{viewingCategory.productType}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <StatusBadge status={viewingCategory.status} type="general" />
              </Descriptions.Item>

              <Descriptions.Item label="Products">
                <Badge
                  count={viewingCategory.products?.length ?? 0}
                  showZero
                  style={{ backgroundColor: '#1677ff' }}
                />
              </Descriptions.Item>

              <Descriptions.Item label="Sort Order">
                {viewingCategory.sortOrder ?? 0}
              </Descriptions.Item>

              <Descriptions.Item label="Featured" span={2}>
                {viewingCategory.featured ? (
                  <Tag color="gold">Yes</Tag>
                ) : (
                  <Tag color="default">No</Tag>
                )}
              </Descriptions.Item>

              {viewingCategory.children && viewingCategory.children.length > 0 && (
                <Descriptions.Item label="Sub-categories" span={2}>
                  <Space wrap>
                    {viewingCategory.children.map((child) => (
                      <Tag key={child}>{child}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}

              {viewingCategory.description && (
                <Descriptions.Item label="Description" span={2}>
                  {viewingCategory.description}
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Created" span={2}>
                {formatDate(viewingCategory.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Last Updated" span={2}>
                {formatDate(viewingCategory.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
