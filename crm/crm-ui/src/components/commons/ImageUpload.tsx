import { useState } from 'react';
import { Upload, Button, Space, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import api from '@/services/api';

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
              handleUpload(file);
              return false;
            }}
            accept="image/*"
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
    <Upload
      showUploadList={false}
      beforeUpload={(file) => {
        handleUpload(file);
        return false;
      }}
      accept="image/*"
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
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13 }}>{placeholder}</div>
          </>
        )}
      </div>
    </Upload>
  );
};

export default ImageUpload;
