import React from 'react';
import Link from 'next/link';

/**
 * Promo Section block — full-width banner with image, text, and CTA button.
 * CRM settings: { title, subtitle, buttonText, buttonUrl, image }
 */
const PromoSection = ({ settings = {}, title, subtitle }) => {
  const heading = title || settings.title || '';
  const desc = subtitle || settings.subtitle || '';
  const { buttonText, buttonUrl, image } = settings;

  return (
    <section className="cl-promo-section">
      <div
        className="cl-promo-section__inner"
        style={image ? { backgroundImage: `url(${image})` } : {}}
      >
        <div className="container">
          <div className="cl-promo-section__content">
            {heading && <h2 className="cl-promo-section__title">{heading}</h2>}
            {desc && <p className="cl-promo-section__desc">{desc}</p>}
            {buttonText && buttonUrl && (
              <Link href={buttonUrl} className="cl-btn-primary cl-promo-section__btn">
                {buttonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
