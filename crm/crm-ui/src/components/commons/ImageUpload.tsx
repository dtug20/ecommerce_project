import { useState } from 'react';
import { Upload, Button, Space, Spin, Tabs, Input } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, LinkOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import api from '@/services/api';

const MAX_BYTES = 5 * 1024 * 1024;        // hard limit (matches backend multer)
const WARN_BYTES = 3 * 1024 * 1024;       // soft warning threshold
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + 'MB';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  /** Upload folder path in Cloudinary (e.g. "banners", "products") */
  folder?: string;
  /** Placeholder text for the upload area */
  placeholder?: string;
  /** Width of the preview area */
  width?: number | string;
  /** Height of the preview area */
  height?: number | string;
}

function UrlPasteTab({
  width,
  height,
  onConfirm,
}: {
  width: number | string;
  height: number | string;
  onConfirm: (url: string) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const isValidFormat = (() => {
    if (!urlInput) return false;
    try {
      new URL(urlInput);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <div>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="https://example.com/image.jpg"
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            setPreviewError(false);
          }}
          prefix={<LinkOutlined />}
        />
        <Button
          type="primary"
          disabled={!isValidFormat}
          onClick={() => {
            if (!isValidFormat) {
              toast.error('Invalid URL format');
              return;
            }
            onConfirm(urlInput);
          }}
        >
          Use
        </Button>
      </Space.Compact>

      {isValidFormat && (
        <div
          style={{
            marginTop: 12,
            width,
            height,
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            position: 'relative',
          }}
        >
          {previewError ? (
            <div style={{ color: '#ff4d4f', fontSize: 12, textAlign: 'center', padding: 12 }}>
              Image failed to load
              <br />
              <span style={{ color: '#8c8c8c' }}>The URL may be unreachable</span>
            </div>
          ) : (
            <img
              src={urlInput}
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={() => setPreviewError(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function UploadTab({
  placeholder,
  width,
  height,
  loading,
  handleUpload,
}: {
  placeholder: string;
  width: number | string;
  height: number | string;
  loading: boolean;
  handleUpload: (file: File) => void;
}) {
  return (
    <Upload
      showUploadList={false}
      beforeUpload={(file) => {
        if (!ALLOWED_MIME.includes(file.type)) {
          toast.error(`Unsupported type: ${file.type || 'unknown'}. Use JPG/PNG/WebP.`);
          return false;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`File too large (${formatMB(file.size)}). Max 5MB.`);
          return false;
        }
        if (file.size > WARN_BYTES) {
          toast(`Large file (${formatMB(file.size)}) — upload may be slow`, { icon: '⚠️' });
        }
        handleUpload(file);
        return false;
      }}
      accept="image/jpeg,image/png,image/webp"
    >
      <div
        style={{
          width,
          height,
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: '#fafafa',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1677ff')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
      >
        {loading ? (
          <Spin />
        ) : (
          <>
            <PictureOutlined style={{ fontSize: 28, color: '#bfbfbf' }} />
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13, textAlign: 'center' }}>
              {placeholder}
              <div style={{ fontSize: 11, marginTop: 4 }}>JPG / PNG / WebP, max 5MB</div>
            </div>
          </>
        )}
      </div>
    </Upload>
  );
}

/**
 * Reusable image upload component for the CRM.
 * Uploads to Cloudinary via the backend media endpoint.
 * Works as a controlled Ant Design form field (value/onChange).
 */
const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  placeholder = 'Upload Image',
  width = 200,
  height = 140,
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/api/v1/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        onChange?.(url);
        toast.success('Image uploaded');
      } else {
        throw new Error('No URL returned');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onChange?.('');
  };

  if (value) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          style={{
            width,
            height,
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
          }}
        >
          <img
            src={value}
            alt="preview"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
        <Space style={{ marginTop: 8 }}>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              if (!ALLOWED_MIME.includes(file.type)) {
                toast.error(`Unsupported type: ${file.type || 'unknown'}. Use JPG/PNG/WebP.`);
                return false;
              }
              if (file.size > MAX_BYTES) {
                toast.error(`File too large (${formatMB(file.size)}). Max 5MB.`);
                return false;
              }
              if (file.size > WARN_BYTES) {
                toast(`Large file (${formatMB(file.size)}) — upload may be slow`, { icon: '⚠️' });
              }
              handleUpload(file);
              return false;
            }}
            accept="image/jpeg,image/png,image/webp"
          >
            <Button size="small" icon={<UploadOutlined />} loading={loading}>
              Replace
            </Button>
          </Upload>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={handleRemove}>
            Remove
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <Tabs
      defaultActiveKey="upload"
      items={[
        {
          key: 'upload',
          label: (
            <span>
              <UploadOutlined /> Upload
            </span>
          ),
          children: (
            <UploadTab
              placeholder={placeholder}
              width={width}
              height={height}
              loading={loading}
              handleUpload={handleUpload}
            />
          ),
        },
        {
          key: 'url',
          label: (
            <span>
              <LinkOutlined /> Paste URL
            </span>
          ),
          children: (
            <UrlPasteTab
              width={width}
              height={height}
              onConfirm={(url) => onChange?.(url)}
            />
          ),
        },
      ]}
    />
  );
};

export default ImageUpload;
