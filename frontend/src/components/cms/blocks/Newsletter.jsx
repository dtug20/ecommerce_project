import React, { useState } from 'react';

const Newsletter = ({ settings = {}, title, subtitle }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const sectionTitle = title || settings.title || 'Subscribe to our Newsletter';
  const sectionSubtitle =
    subtitle || settings.subtitle || 'Get the latest updates, offers, and news delivered to your inbox.';
  const buttonText = settings.buttonText || 'Subscribe';
  const placeholder = settings.placeholder || 'Enter your email address';
  const bgColor = settings.backgroundColor || '#0989FF';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Submission is decorative for now — actual signup requires backend integration
      setSubmitted(true);
    }
  };

  return (
    <section
      className="tp-subscribe-area pt-75 pb-75"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-xl-6 col-lg-6">
            <div className="tp-subscribe-content mb-30 mb-lg-0">
              <h3
                className="tp-subscribe-title"
                style={{ color: '#ffffff' }}
              >
                {sectionTitle}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 0 }}>
                {sectionSubtitle}
              </p>
            </div>
          </div>
          <div className="col-xl-6 col-lg-6">
            {submitted ? (
              <div
                className="tp-subscribe-form d-flex align-items-center justify-content-lg-end"
              >
                <p
                  style={{
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '16px',
                    marginBottom: 0,
                  }}
                >
                  Thank you for subscribing!
                </p>
              </div>
            ) : (
              <form
                className="tp-subscribe-form d-flex align-items-center justify-content-lg-end"
                onSubmit={handleSubmit}
              >
                <div
                  className="tp-subscribe-input"
                  style={{ flex: 1, maxWidth: '400px' }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholder}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: '4px 0 0 4px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="tp-btn"
                  style={{
                    borderRadius: '0 4px 4px 0',
                    whiteSpace: 'nowrap',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {buttonText}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
