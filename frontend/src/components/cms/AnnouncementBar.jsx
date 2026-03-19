import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const AnnouncementBar = ({ banner }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(`banner_dismissed_${banner?._id}`);
      if (isDismissed) setDismissed(true);
    }
  }, [banner]);

  if (!banner || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`banner_dismissed_${banner._id}`, 'true');
    }
  };

  const bgColor = banner.content?.backgroundColor || '#0989FF';
  const textColor = banner.content?.textColor || '#ffffff';
  const text = banner.content?.text || '';
  const buttonText = banner.content?.buttonText;
  const buttonUrl = banner.content?.buttonUrl;

  return (
    <div
      className="announcement-bar"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: '8px 16px',
        textAlign: 'center',
        position: 'relative',
        fontSize: '14px',
      }}
    >
      <span>{text}</span>
      {buttonText && buttonUrl && (
        <>
          {' '}
          <Link
            href={buttonUrl}
            style={{ color: textColor, textDecoration: 'underline', fontWeight: 600 }}
          >
            {buttonText}
          </Link>
        </>
      )}
      {banner.dismissible && (
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
          }}
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AnnouncementBar;
