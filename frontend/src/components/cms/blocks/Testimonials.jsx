import React from 'react';

/**
 * Testimonials block — customer quote cards.
 * CRM settings: { title, items: [{ name, role, text, avatar }] }
 */
const Testimonials = ({ settings = {}, title }) => {
  const heading = title || settings.title || 'What Our Customers Say';
  const items = settings.items || [];

  if (items.length === 0) return null;

  return (
    <section className="cl-testimonials pt-60 pb-60">
      <div className="container">
        {heading && (
          <div className="cl-section-header text-center mb-40">
            <h2 className="cl-section-header__title">{heading}</h2>
          </div>
        )}
        <div className="row g-4">
          {items.map((item, idx) => (
            <div key={idx} className="col-md-4">
              <div className="cl-testimonials__card">
                <div className="cl-testimonials__stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <i key={s} className="fas fa-star" style={{ color: 'var(--cl-primary)' }}></i>
                  ))}
                </div>
                {item.text && <p className="cl-testimonials__text">&ldquo;{item.text}&rdquo;</p>}
                <div className="cl-testimonials__author">
                  {item.avatar && (
                    <img
                      src={item.avatar}
                      alt={item.name || ''}
                      className="cl-testimonials__avatar"
                      width={48}
                      height={48}
                    />
                  )}
                  <div>
                    {item.name && <strong className="cl-testimonials__name">{item.name}</strong>}
                    {item.role && <span className="cl-testimonials__role">{item.role}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
