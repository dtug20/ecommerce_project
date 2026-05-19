import React, { useState } from 'react';
import Image from 'next/image';

const PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f1f1f1"/>
      <text x="50%" y="50%" font-family="system-ui,Arial" font-size="14" fill="#9e9e9e" text-anchor="middle" dominant-baseline="middle">No Image</text>
    </svg>`
  );

const SafeImage = ({ src, alt = '', placeholder, onError, ...rest }) => {
  const fallback = placeholder || PLACEHOLDER_SVG;
  const initial = src && typeof src === 'string' && src.trim().length > 0 ? src : fallback;
  const [imgSrc, setImgSrc] = useState(initial);

  const handleError = (e) => {
    if (imgSrc !== fallback) setImgSrc(fallback);
    if (typeof onError === 'function') onError(e);
  };

  return <Image src={imgSrc} alt={alt} onError={handleError} {...rest} />;
};

export default SafeImage;
