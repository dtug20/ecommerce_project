import React from 'react';
import Link from 'next/link';

// Map banner size setting to Bootstrap column class
const sizeToColClass = {
  full: 'col-12',
  half: 'col-md-6',
  third: 'col-md-4',
  'two-thirds': 'col-md-8',
};

const BannerGrid = ({ settings = {}, title, subtitle }) => {
  const banners = settings.banners || [];

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="tp-banner-area pb-55">
      <div className="container">
        {title && (
          <div className="row mb-30">
            <div className="col-12 text-center">
              <h3 className="tp-section-title">{title}</h3>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
        )}
        <div className="row g-3">
          {banners.map((banner, i) => {
            const colClass = sizeToColClass[banner.size] || 'col-md-6';
            const inner = (
              <div
                className="w-100 h-100 d-flex align-items-center justify-content-center overflow-hidden"
                style={{
                  backgroundImage: banner.image ? `url(${banner.image})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: banner.size === 'full' ? '300px' : '200px',
                  borderRadius: '8px',
                  position: 'relative',
                }}
              >
                {banner.title && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                    }}
                  >
                    <h4 style={{ margin: 0 }}>{banner.title}</h4>
                  </div>
                )}
              </div>
            );

            return (
              <div key={i} className={colClass}>
                {banner.url ? (
                  <Link href={banner.url} className="d-block" style={{ textDecoration: 'none' }}>
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BannerGrid;
