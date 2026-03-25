import React, { useState } from 'react';

/**
 * Image Gallery block — responsive grid of images with lightbox.
 * CRM settings: { title, images: [{ url, alt, caption }] }
 */
const ImageGallery = ({ settings = {}, title }) => {
  const heading = title || settings.title || '';
  const images = settings.images || [];
  const [lightbox, setLightbox] = useState(null); // index of open image

  if (images.length === 0) return null;

  return (
    <section className="cl-image-gallery pt-60 pb-60">
      <div className="container">
        {heading && (
          <div className="cl-section-header text-center mb-40">
            <h2 className="cl-section-header__title">{heading}</h2>
          </div>
        )}
        <div className="cl-image-gallery__grid">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="cl-image-gallery__item"
              onClick={() => setLightbox(idx)}
            >
              <img src={img.url || img} alt={img.alt || ''} loading="lazy" />
              {img.caption && (
                <span className="cl-image-gallery__caption">{img.caption}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="cl-image-gallery__lightbox"
          onClick={() => setLightbox(null)}
        >
          <button className="cl-image-gallery__close" aria-label="Close">
            &times;
          </button>
          <img
            src={images[lightbox]?.url || images[lightbox]}
            alt={images[lightbox]?.alt || ''}
          />
        </div>
      )}
    </section>
  );
};

export default ImageGallery;
