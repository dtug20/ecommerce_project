import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Divider,
  Space,
  Tooltip,
  Spin,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
  ShoppingOutlined,
  TagsOutlined,
  GiftOutlined,
  MailOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  LayoutOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { pagesApi } from '@/services/api';
import type { Page, ContentBlock } from '@/types';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Block type catalogue
// ---------------------------------------------------------------------------

interface BlockTypeDef {
  type: string;
  label: string;
  icon: React.ReactNode;
  defaultSettings: Record<string, unknown>;
}

const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: 'hero-slider',
    label: 'Hero Slider',
    icon: <PictureOutlined />,
    defaultSettings: { slides: [] },
  },
  {
    type: 'featured-products',
    label: 'Featured Products',
    icon: <ShoppingOutlined />,
    defaultSettings: { title: 'Featured Products', productType: 'electronics', queryType: 'featured', limit: 8 },
  },
  {
    type: 'category-showcase',
    label: 'Category Showcase',
    icon: <TagsOutlined />,
    defaultSettings: { title: 'Shop by Category', limit: 6 },
  },
  {
    type: 'banner-grid',
    label: 'Banner Grid',
    icon: <LayoutOutlined />,
    defaultSettings: { title: '', banners: [] },
  },
  {
    type: 'promo-section',
    label: 'Promo Section',
    icon: <GiftOutlined />,
    defaultSettings: { title: '', subtitle: '', buttonText: '', buttonUrl: '', image: '' },
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    icon: <MessageOutlined />,
    defaultSettings: { title: 'What Our Customers Say', items: [] },
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    icon: <MailOutlined />,
    defaultSettings: { title: 'Subscribe to Our Newsletter', subtitle: '' },
  },
  {
    type: 'custom-html',
    label: 'Custom HTML',
    icon: <CodeOutlined />,
    defaultSettings: { html: '' },
  },
  {
    type: 'product-carousel',
    label: 'Product Carousel',
    icon: <ShoppingCartOutlined />,
    defaultSettings: { title: 'New Arrivals', productType: 'electronics', limit: 10 },
  },
  {
    type: 'brand-showcase',
    label: 'Brand Showcase',
    icon: <ShopOutlined />,
    defaultSettings: { title: 'Our Brands', limit: 8 },
  },
  {
    type: 'countdown-deal',
    label: 'Countdown Deal',
    icon: <ClockCircleOutlined />,
    defaultSettings: { title: 'Deal of the Day', endDate: '' },
  },
  {
    type: 'text-block',
    label: 'Text Block',
    icon: <FileTextOutlined />,
    defaultSettings: { content: '' },
  },
  {
    type: 'image-gallery',
    label: 'Image Gallery',
    icon: <PictureOutlined />,
    defaultSettings: { title: '', images: [] },
  },
  {
    type: 'video-section',
    label: 'Video Section',
    icon: <PlayCircleOutlined />,
    defaultSettings: { title: '', videoUrl: '', thumbnail: '' },
  },
];

// ---------------------------------------------------------------------------
// Block settings forms
// ---------------------------------------------------------------------------

interface BlockSettingsFormProps {
  block: ContentBlock;
  onChange: (updated: ContentBlock) => void;
}

function BlockSettingsForm({ block, onChange }: BlockSettingsFormProps) {
  const update = (key: string, value: unknown) => {
    onChange({ ...block, settings: { ...block.settings, [key]: value } });
  };

  const updateTitle = (value: string) => onChange({ ...block, title: value });

  switch (block.blockType) {
    case 'hero-slider':
      return (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hero slides configuration — add slide items with title, subtitle, button, and image.
          </Text>
          <Form.Item label="Title (optional)" style={{ marginTop: 12 }}>
            <Input value={block.title ?? ''} onChange={(e) => updateTitle(e.target.value)} />
          </Form.Item>
          <Form.Item label="Slides (JSON array)">
            <Input.TextArea
              rows={6}
              value={
                typeof block.settings.slides === 'string'
                  ? block.settings.slides
                  : JSON.stringify(block.settings.slides ?? [], null, 2)
              }
              onChange={(e) => {
                try {
                  update('slides', JSON.parse(e.target.value));
                } catch {
                  update('slides', e.target.value);
                }
              }}
              placeholder='[{"title":"","subtitle":"","buttonText":"","buttonUrl":"","image":""}]'
            />
          </Form.Item>
        </div>
      );

    case 'featured-products':
    case 'product-carousel':
      return (
        <div>
          <Form.Item label="Section Title">
            <Input value={block.title ?? ''} onChange={(e) => updateTitle(e.target.value)} />
          </Form.Item>
          <Form.Item label="Product Type">
            <Select
              value={block.settings.productType as string}
              onChange={(v) => update('productType', v)}
              options={[
                { value: 'electronics', label: 'Electronics' },
                { value: 'fashion', label: 'Fashion' },
                { value: 'beauty', label: 'Beauty' },
                { value: 'furniture', label: 'Furniture' },
                { value: 'foods', label: 'Foods' },
              ]}
            />
          </Form.Item>
          {block.blockType === 'featured-products' && (
            <Form.Item label="Query Type">
              <Select
                value={block.settings.queryType as string}
                onChange={(v) => update('queryType', v)}
                options={[
                  { value: 'featured', label: 'Featured' },
                  { value: 'new', label: 'New Arrivals' },
                  { value: 'topSellers', label: 'Top Sellers' },
                  { value: 'topRated', label: 'Top Rated' },
                ]}
              />
            </Form.Item>
          )}
          <Form.Item label="Limit">
            <InputNumber
              min={1}
              max={24}
              value={block.settings.limit as number}
              onChange={(v) => update('limit', v)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
      );

    case 'category-showcase':
      return (
        <div>
          <Form.Item label="Section Title">
            <Input value={block.title ?? ''} onChange={(e) => updateTitle(e.target.value)} />
          </Form.Item>
          <Form.Item label="Limit">
            <InputNumber
              min={1}
              max={20}
              value={block.settings.limit as number}
              onChange={(v) => update('limit', v)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
      );

    case 'banner-grid':
      return (
        <div>
          <Form.Item label="Section Title">
            <Input value={block.title ?? ''} onChange={(e) => updateTitle(e.target.value)} />
          </Form.Item>
          <Form.Item label="Banners (JSON array)">
            <Input.TextArea
              rows={6}
              value={
                typeof block.settings.banners === 'string'
                  ? block.settings.banners
                  : JSON.stringify(block.settings.banners ?? [], null, 2)
              }
              onChange={(e) => {
                try {
                  update('banners', JSON.parse(e.target.value));
                } catch {
                  update('banners', e.target.value);
                }
              }}
              placeholder='[{"image":"","title":"","url":""}]'
            />
          </Form.Item>
        </div>
      );

    case 'text-block':
      return (
        <Form.Item label="HTML Content">
          <Input.TextArea
            rows={10}
            value={block.settings.content as string}
            onChange={(e) => update('content', e.target.value)}
            placeholder="<p>Enter your HTML content here</p>"
          />
        </Form.Item>
      );

    default:
      return (
        <div
          style={{
            padding: 16,
            background: '#f5f6fa',
            borderRadius: 6,
            textAlign: 'center',
          }}
        >
          <Text type="secondary">
            Configuration for <strong>{block.blockType}</strong> will be available in a future update.
          </Text>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Page Settings panel
// ---------------------------------------------------------------------------

interface PageSettingsFormProps {
  page: Partial<Page>;
  onChange: (updated: Partial<Page>) => void;
}

function PageSettingsPanel({ page, onChange }: PageSettingsFormProps) {
  const update = (key: keyof Page, value: unknown) =>
    onChange({ ...page, [key]: value });

  const updateSeo = (key: string, value: string) =>
    onChange({ ...page, seo: { ...(page.seo ?? {}), [key]: value } });

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        Page Settings
      </Title>

      <Form layout="vertical">
        <Form.Item label="Page Title" required>
          <Input
            value={page.title ?? ''}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Home Page"
          />
        </Form.Item>

        <Form.Item label="Slug" required>
          <Input
            value={page.slug ?? ''}
            onChange={(e) => update('slug', e.target.value)}
            placeholder="home"
            addonBefore="/"
          />
        </Form.Item>

        <Form.Item label="Type">
          <Select
            value={page.type ?? 'custom'}
            onChange={(v) => update('type', v)}
            options={[
              { value: 'home', label: 'Home' },
              { value: 'landing', label: 'Landing' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Status">
          <Select
            value={page.status ?? 'draft'}
            onChange={(v) => update('status', v)}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </Form.Item>

        <Divider>SEO</Divider>

        <Form.Item label="Meta Title">
          <Input
            value={page.seo?.metaTitle ?? ''}
            onChange={(e) => updateSeo('metaTitle', e.target.value)}
          />
        </Form.Item>

        <Form.Item label="Meta Description">
          <Input.TextArea
            rows={3}
            value={page.seo?.metaDescription ?? ''}
            onChange={(e) => updateSeo('metaDescription', e.target.value)}
          />
        </Form.Item>

        <Form.Item label="OG Image URL">
          <Input
            value={page.seo?.ogImage ?? ''}
            onChange={(e) => updateSeo('ogImage', e.target.value)}
          />
        </Form.Item>
      </Form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Editor
// ---------------------------------------------------------------------------

export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [pageData, setPageData] = useState<Partial<Page>>({
    title: '',
    slug: '',
    type: 'custom',
    status: 'draft',
    blocks: [],
    seo: {},
  });
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Load existing page
  const { isLoading } = useQuery({
    queryKey: ['cms-page', id],
    queryFn: () => pagesApi.getById(id!),
    enabled: !isNew,
    staleTime: 0,
  });

  // Use separate effect to populate state after fetch
  const { data: fetchedPage } = useQuery({
    queryKey: ['cms-page', id],
    queryFn: () => pagesApi.getById(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (fetchedPage?.data) {
      const p = fetchedPage.data;
      setPageData({
        title: p.title,
        slug: p.slug,
        type: p.type,
        status: p.status,
        seo: p.seo ?? {},
      });
      const sorted = [...(p.blocks ?? [])].sort((a, b) => a.order - b.order);
      setBlocks(sorted);
    }
  }, [fetchedPage]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const blocksWithOrder = blocks.map((b, i) => ({ ...b, order: i }));
      if (isNew) {
        return pagesApi.create({ ...pageData, blocks: blocksWithOrder });
      }
      await pagesApi.update(id!, pageData);
      return pagesApi.updateBlocks(id!, blocksWithOrder);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      toast.success('Page saved successfully');
      if (isNew && result?.data?._id) {
        navigate(`/cms/pages/${result.data._id}`, { replace: true });
      }
    },
    onError: () => toast.error('Failed to save page'),
  });

  const addBlock = (typeDef: BlockTypeDef) => {
    const newBlock: ContentBlock = {
      blockType: typeDef.type,
      title: typeDef.label,
      order: blocks.length,
      settings: { ...typeDef.defaultSettings },
      isVisible: true,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockIndex(blocks.length);
  };

  const updateBlock = (index: number, updated: ContentBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= newBlocks.length) return;
    [newBlocks[index], newBlocks[swap]] = [newBlocks[swap], newBlocks[index]];
    setBlocks(newBlocks);
    setSelectedBlockIndex(swap);
  };

  const deleteBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setSelectedBlockIndex(null);
  };

  const toggleBlockVisibility = (index: number) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, isVisible: !b.isVisible } : b))
    );
  };

  if (!isNew && isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const selectedBlock = selectedBlockIndex !== null ? blocks[selectedBlockIndex] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 104px)' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cms/pages')}>
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {isNew ? 'New Page' : (pageData.title || 'Edit Page')}
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save Page
        </Button>
      </div>

      {/* Three-panel layout */}
      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
        {/* Left: Block palette */}
        <Card
          title="Add Block"
          size="small"
          style={{ width: 220, flexShrink: 0, overflow: 'auto' }}
          bodyStyle={{ padding: 8 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {BLOCK_TYPES.map((bt) => (
              <Button
                key={bt.type}
                icon={bt.icon}
                onClick={() => addBlock(bt)}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                size="small"
              >
                {bt.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Center: Block list */}
        <Card
          title={`Blocks (${blocks.length})`}
          size="small"
          style={{ flex: 1, overflow: 'auto' }}
          bodyStyle={{ padding: 8 }}
        >
          {blocks.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: '#aaa',
              }}
            >
              <PlusOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
              <Text type="secondary">Click a block type on the left to add it</Text>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {blocks.map((block, index) => {
              const isSelected = selectedBlockIndex === index;
              const def = BLOCK_TYPES.find((bt) => bt.type === block.blockType);
              return (
                <div
                  key={index}
                  onClick={() =>
                    setSelectedBlockIndex(isSelected ? null : index)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: `1px solid ${isSelected ? '#a42c48' : '#e8e8e8'}`,
                    background: isSelected ? '#fff0f3' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    opacity: block.isVisible ? 1 : 0.5,
                  }}
                >
                  <span style={{ color: '#666', flexShrink: 0 }}>{def?.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {block.title || def?.label || block.blockType}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {block.blockType}
                    </Text>
                  </div>
                  <Space size={2} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={block.isVisible ? 'Hide block' : 'Show block'}>
                      <Button
                        size="small"
                        type="text"
                        icon={block.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={() => toggleBlockVisibility(index)}
                      />
                    </Tooltip>
                    <Tooltip title="Move up">
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveBlock(index, 'up')}
                      />
                    </Tooltip>
                    <Tooltip title="Move down">
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowDownOutlined />}
                        disabled={index === blocks.length - 1}
                        onClick={() => moveBlock(index, 'down')}
                      />
                    </Tooltip>
                    <Tooltip title="Delete block">
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => deleteBlock(index)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: Settings panel */}
        <Card
          title={selectedBlock ? `Block Settings: ${selectedBlock.title || selectedBlock.blockType}` : 'Page Settings'}
          size="small"
          style={{ width: 360, flexShrink: 0, overflow: 'auto' }}
        >
          {selectedBlock && selectedBlockIndex !== null ? (
            <BlockSettingsForm
              block={selectedBlock}
              onChange={(updated) => updateBlock(selectedBlockIndex, updated)}
            />
          ) : (
            <PageSettingsPanel page={pageData} onChange={setPageData} />
          )}
        </Card>
      </div>
    </div>
  );
}
