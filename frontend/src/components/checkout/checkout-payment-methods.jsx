import { useGetSettingsQuery } from '@/redux/features/cmsApi';

/**
 * Map of known payment gateway keys to display metadata.
 * Keys are lower-cased to normalise comparison.
 */
const PAYMENT_METHODS = {
  cod: {
    label: 'Cash on Delivery',
    description: 'Pay when you receive your order',
  },
  'bank-transfer': {
    label: 'Bank Transfer',
    description: 'Transfer to our bank account',
  },
  vnpay: {
    label: 'VNPay',
    description: "You'll be redirected to VNPay to complete payment",
  },
  momo: {
    label: 'MoMo',
    description: "You'll be redirected to MoMo to complete payment",
  },
  stripe: {
    label: 'Credit / Debit Card',
    description: 'Pay securely with your card via Stripe',
  },
};

/**
 * CheckoutPaymentMethods
 *
 * Reads enabled payment gateways from site settings (CMS) and renders
 * a radio list. Falls back to COD-only when settings are unavailable.
 *
 * @param {object}   props
 * @param {string}   props.selectedMethod   - Currently selected gateway key
 * @param {Function} props.onMethodChange   - Called with new gateway key on change
 * @param {object}   [props.bankDetails]    - Bank info shown when bank-transfer is selected
 */
const CheckoutPaymentMethods = ({ selectedMethod, onMethodChange, bankDetails }) => {
  const { data: settingsData } = useGetSettingsQuery();

  // Normalise keys to lower-case for consistent lookup
  const rawGateways = settingsData?.data?.payment?.enabledGateways;
  const enabledGateways =
    Array.isArray(rawGateways) && rawGateways.length > 0
      ? rawGateways.map((g) => g.toLowerCase())
      : ['cod'];

  const isComingSoon = (gateway) => gateway === 'vnpay' || gateway === 'momo';

  return (
    <div className="tp-checkout-payment">
      <h3 className="tp-checkout-place-title">Payment Method</h3>

      <div className="tp-checkout-payment-options">
        {enabledGateways.map((gateway) => {
          const method = PAYMENT_METHODS[gateway];
          if (!method) return null;

          const inputId = `payment-${gateway}`;

          return (
            <div key={gateway} className="tp-checkout-payment-item mb-15">
              <input
                type="radio"
                name="paymentMethod"
                id={inputId}
                value={gateway}
                checked={selectedMethod === gateway}
                onChange={() => onMethodChange(gateway)}
                className="form-check-input"
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <label
                htmlFor={inputId}
                className="form-check-label"
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <strong>{method.label}</strong>
                <small className="d-block text-muted" style={{ fontSize: '12px' }}>
                  {method.description}
                </small>
              </label>
            </div>
          );
        })}
      </div>

      {/* Bank transfer details */}
      {selectedMethod === 'bank-transfer' && (
        <div className="alert alert-info mt-15" style={{ fontSize: '13px' }}>
          <h6 className="mb-10" style={{ fontWeight: 600 }}>Bank Transfer Details</h6>
          {bankDetails?.bankName ? (
            <>
              <p className="mb-5">
                <strong>Bank:</strong> {bankDetails.bankName}
              </p>
              {bankDetails.accountNumber && (
                <p className="mb-5">
                  <strong>Account:</strong> {bankDetails.accountNumber}
                </p>
              )}
              {bankDetails.accountName && (
                <p className="mb-5">
                  <strong>Name:</strong> {bankDetails.accountName}
                </p>
              )}
            </>
          ) : (
            <p className="mb-5">
              Please contact us for bank transfer details.
            </p>
          )}
          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
            Please transfer the exact order amount and use your order number as the payment
            reference. Your order will be confirmed once payment is received.
          </p>
        </div>
      )}

      {/* Coming-soon notice for VNPay / MoMo */}
      {isComingSoon(selectedMethod) && (
        <div className="alert alert-warning mt-15" style={{ fontSize: '13px' }}>
          <strong>Coming soon.</strong> This payment method is not yet available. Please select
          Cash on Delivery or Bank Transfer instead.
        </div>
      )}
    </div>
  );
};

export default CheckoutPaymentMethods;
