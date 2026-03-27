import React from 'react';
import Image from 'next/image';

/**
 * Avatar component — image or initials fallback.
 *
 * @param {Object} props
 * @param {string} [props.src] - Image URL
 * @param {string} [props.alt=''] - Alt text
 * @param {string} [props.name] - Full name (used for initials fallback)
 * @param {'sm'|'md'|'lg'} [props.size='md'] - sm=32px, md=40px, lg=56px
 * @param {string} [props.className]
 */
const ClAvatar = ({ src, alt = '', name, size = 'md', className = '' }) => {
  const sizeMap = { sm: 32, md: 40, lg: 56 };
  const px = sizeMap[size] || 40;

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  return (
    <div className={`cl-avatar cl-avatar--${size}${className ? ` ${className}` : ''}`}>
      {src ? (
        <Image
          src={src}
          alt={alt || name || ''}
          width={px}
          height={px}
          className="cl-avatar__img"
          unoptimized
        />
      ) : (
        <span className="cl-avatar__initials" aria-label={name || alt}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};

export default ClAvatar;
