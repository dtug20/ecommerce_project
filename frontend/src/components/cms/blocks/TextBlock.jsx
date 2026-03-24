import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

const TextBlock = ({ settings = {}, title, subtitle }) => {
  const content = settings.content ? DOMPurify.sanitize(settings.content) : '';

  if (!content && !title) {
    return null;
  }

  return (
    <section className="tp-text-block-area pt-60 pb-60">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-10 col-lg-10">
            {title && (
              <div className="tp-section-title-wrapper mb-30 text-center">
                <h3 className="tp-section-title">{title}</h3>
                {subtitle && <p>{subtitle}</p>}
              </div>
            )}
            {content && (
              <div
                className="tp-postbox-text"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TextBlock;
