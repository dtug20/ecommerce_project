import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifySuccess, notifyError } from '@/utils/toast';

const BRAND_LOGOS = ['Google', 'Amazon', 'Philips', 'Toshiba', 'Samsung'];

const CliconNewsletter = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notifyError(t('newsletter.invalid_email', 'Please enter a valid email address.'));
      return;
    }
    setSubmitting(true);
    // Fire-and-forget: no backend endpoint yet; show success toast
    setTimeout(() => {
      notifySuccess(t('newsletter.success', 'Thank you for subscribing!'));
      setEmail('');
      setSubmitting(false);
    }, 600);
  };

  return (
    <section className="cl-newsletter" data-testid="cl-newsletter">
      <div className="container">
        <div className="cl-newsletter__inner">
          <h2 className="cl-newsletter__title">
            {t('newsletter.title', 'Subscribe to our Newsletter')}
          </h2>
          <p className="cl-newsletter__subtitle">
            {t(
              'newsletter.subtitle',
              'Get the latest deals, product news and exclusive offers straight to your inbox.'
            )}
          </p>

          <form
            className="cl-newsletter__form"
            onSubmit={handleSubmit}
            noValidate
            data-testid="cl-newsletter-form"
          >
            <div className="cl-newsletter__input-wrap">
              <input
                type="email"
                className="cl-newsletter__input"
                placeholder={t('newsletter.placeholder', 'Enter your email address...')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label={t('newsletter.email_label', 'Email address')}
                data-testid="cl-newsletter-email"
              />
              <button
                type="submit"
                className="cl-newsletter__btn"
                disabled={submitting}
                data-testid="cl-newsletter-submit"
              >
                {submitting
                  ? t('newsletter.submitting', 'Subscribing...')
                  : t('newsletter.cta', 'SUBSCRIBE')}
              </button>
            </div>
          </form>

          <div className="cl-newsletter__brands" aria-label={t('newsletter.brands_label', 'Our brand partners')}>
            {BRAND_LOGOS.map((brand) => (
              <span key={brand} className="cl-newsletter__brand-logo">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CliconNewsletter;
