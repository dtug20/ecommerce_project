import { useTranslation } from 'react-i18next';
import { useGetSettingsQuery } from '@/redux/features/cmsApi';
import { resolveBankQrSrc } from '@/utils/vietqr';

const PAYMENT_ICONS = {
  cod: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  'bank-transfer': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  vnpay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7l10 10L22 7" />
    </svg>
  ),
  momo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
};

const PAYMENT_LABEL_KEYS = {
  cod: 'checkout.cashOnDelivery',
  'bank-transfer': 'checkout.bankTransfer',
  vnpay: 'VNPay',
  momo: 'MoMo',
  stripe: 'checkout.creditCard',
};

const CheckoutPaymentMethods = ({ selectedMethod, onMethodChange, bankDetails }) => {
  const { t } = useTranslation();
  const { data: settingsData } = useGetSettingsQuery();

  const effectiveBankDetails = bankDetails ?? settingsData?.data?.payment?.bankTransfer ?? null;

  const rawGateways = settingsData?.data?.payment?.enabledGateways;
  const enabledGatewaysRaw =
    Array.isArray(rawGateways) && rawGateways.length > 0
      ? rawGateways.map((g) => g.toLowerCase())
      : ['cod'];

  // Ensure 'vnpay' is always selectable alongside 'cod'
  const enabledGateways = enabledGatewaysRaw.includes('vnpay')
    ? enabledGatewaysRaw
    : [...enabledGatewaysRaw, 'vnpay'];

  const isComingSoon = (gateway) => gateway === 'momo';

  const getLabel = (gateway) => {
    const key = PAYMENT_LABEL_KEYS[gateway];
    if (!key) return gateway;
    // VNPay and MoMo are brand names, not translatable
    if (gateway === 'vnpay' || gateway === 'momo') return key;
    return t(key);
  };

  return (
    <div className="cl-checkout__card">
      <h3 className="cl-checkout__section-title">{t('checkout.paymentOption')}</h3>

      <div className="cl-checkout__payment-options">
        {enabledGateways.map((gateway) => {
          const icon = PAYMENT_ICONS[gateway];
          if (!icon) return null;

          const inputId = `payment-${gateway}`;
          const isActive = selectedMethod === gateway;

          return (
            <label
              key={gateway}
              htmlFor={inputId}
              className={`cl-checkout__payment-item${isActive ? ' cl-checkout__payment-item--active' : ''}`}
            >
              <div className="cl-checkout__payment-icon">
                {icon}
              </div>
              <span className="cl-checkout__payment-label">{getLabel(gateway)}</span>
              <input
                type="radio"
                name="paymentMethod"
                id={inputId}
                value={gateway}
                checked={isActive}
                onChange={() => onMethodChange(gateway)}
              />
            </label>
          );
        })}
      </div>

      {/* Card details for stripe/credit card */}
      {selectedMethod === 'stripe' && (
        <div className="cl-checkout__card-details">
          <div className="cl-checkout__form-row">
            <div className="cl-checkout__form-group">
              <label className="cl-checkout__label">{t('checkout.nameOnCard')}</label>
              <input
                type="text"
                className="cl-checkout__input"
                placeholder={t('checkout.nameOnCard')}
              />
            </div>
          </div>
          <div className="cl-checkout__form-row">
            <div className="cl-checkout__form-group">
              <label className="cl-checkout__label">{t('checkout.cardNumber')}</label>
              <input
                type="text"
                className="cl-checkout__input"
                placeholder={t('checkout.cardNumber')}
              />
            </div>
          </div>
          <div className="cl-checkout__form-row">
            <div className="cl-checkout__form-group">
              <label className="cl-checkout__label">{t('checkout.expireDate')}</label>
              <input
                type="text"
                className="cl-checkout__input"
                placeholder="DD/YY"
              />
            </div>
            <div className="cl-checkout__form-group">
              <label className="cl-checkout__label">{t('checkout.cvc')}</label>
              <input
                type="text"
                className="cl-checkout__input"
                placeholder={t('checkout.cvc')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bank transfer details */}
      {selectedMethod === 'bank-transfer' && (
        <div className="cl-checkout__bank-info">
          <h6>{t('checkout.bankTransferDetails')}</h6>
          {effectiveBankDetails?.bankName ? (
            <>
              <p><strong>{t('checkout.bankLabel')}</strong> {effectiveBankDetails.bankName}</p>
              {effectiveBankDetails.accountNumber && (
                <p><strong>{t('checkout.accountLabel')}</strong> {effectiveBankDetails.accountNumber}</p>
              )}
              {effectiveBankDetails.accountName && (
                <p><strong>{t('checkout.nameLabel')}</strong> {effectiveBankDetails.accountName}</p>
              )}
              {effectiveBankDetails.branch && (
                <p><strong>{t('checkout.branchLabel')}</strong> {effectiveBankDetails.branch}</p>
              )}
              {(() => {
                const qrSrc = resolveBankQrSrc(effectiveBankDetails);
                if (!qrSrc) return null;
                return (
                  <div className="cl-checkout__bank-qr">
                    <p><strong>{t('checkout.scanQrLabel')}</strong></p>
                    <img src={qrSrc} alt="VietQR" width={220} height={290} />
                  </div>
                );
              })()}
              {effectiveBankDetails.transferContentTemplate && (
                <p className="cl-checkout__bank-content">
                  <strong>{t('checkout.transferContentLabel')}</strong>{' '}
                  <code>{effectiveBankDetails.transferContentTemplate}</code>
                  <span className="cl-checkout__hint"> — {t('checkout.transferContentHint')}</span>
                </p>
              )}
            </>
          ) : (
            <p>{t('checkout.bankContactUs')}</p>
          )}
          <p className="cl-checkout__bank-note">
            {t('checkout.bankNote')}
          </p>
        </div>
      )}

      {/* Coming-soon notice for VNPay / MoMo */}
      {isComingSoon(selectedMethod) && (
        <div className="cl-checkout__coming-soon">
          <strong>{t('checkout.comingSoon')}</strong> {t('checkout.comingSoonMsg')}
        </div>
      )}
    </div>
  );
};

export default CheckoutPaymentMethods;
