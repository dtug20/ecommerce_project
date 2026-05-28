import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import useCartInfo from '@/hooks/use-cart-info';
import useCurrency from '@/hooks/use-currency';
import { useGetSettingsQuery } from '@/redux/features/cmsApi';
import { set_shipping_method_id } from '@/redux/features/order/orderSlice';
import { ClButton } from '@/components/clicon/ui';

const FALLBACK_METHODS = [
  { id: 'free', label: 'Free shipping', labelVi: 'Miễn phí', cost: 0, enabled: true },
  { id: 'flat', label: 'Flat rate', labelVi: 'Phí cố định', cost: 20000, enabled: true },
  { id: 'pickup', label: 'Local pickup', labelVi: 'Nhận tại cửa hàng', cost: 25000, enabled: true },
];

const CliconCartCheckout = () => {
  const { t, i18n } = useTranslation();
  const { total } = useCartInfo();
  const { formatPrice } = useCurrency();
  const { data: settingsData } = useGetSettingsQuery();
  const dispatch = useDispatch();
  const selectedId = useSelector((state) => state.order.shipping_method_id);

  const methods = useMemo(() => {
    const raw = settingsData?.data?.shipping?.methods;
    const list = Array.isArray(raw) && raw.length > 0 ? raw : FALLBACK_METHODS;
    return list.filter((m) => m && m.enabled !== false);
  }, [settingsData]);

  useEffect(() => {
    if (!methods.length) return;
    if (!methods.find((m) => m.id === selectedId)) {
      dispatch(set_shipping_method_id(methods[0].id));
    }
  }, [methods, selectedId, dispatch]);

  const selected = methods.find((m) => m.id === selectedId);
  const shipCost = selected?.cost ?? 0;

  // Tax — matches useCheckoutSubmit logic so cart and checkout agree.
  const taxConfig = settingsData?.data?.tax || {};
  const taxEnabled = !!taxConfig.enabled;
  const taxRate = Number(taxConfig.rate ?? 0);
  const taxApplyShipping = taxConfig.applyToShipping !== false;
  const taxLabel = i18n.language === 'vi'
    ? (taxConfig.labelVi || 'Thuế')
    : (taxConfig.label || 'VAT');
  const taxBase = taxApplyShipping ? total + shipCost : total;
  const taxAmount = taxEnabled && taxRate > 0
    ? Number((taxBase * (taxRate / 100)).toFixed(2))
    : 0;
  const grandTotal = total + shipCost + taxAmount;

  const getLabel = (m) => {
    if (i18n.language === 'vi' && m.labelVi) return m.labelVi;
    return m.label || m.id;
  };

  return (
    <div className="cl-cart-summary">
      <h6 className="cl-cart-summary__title">{t('cart.cartTotal', 'Cart Total')}</h6>

      {/* Subtotal */}
      <div className="cl-cart-summary__row">
        <span>{t('cart.subtotal', 'Sub-total')}</span>
        <span className="cl-cart-summary__value">{formatPrice(total)}</span>
      </div>

      {/* Shipping */}
      <div className="cl-cart-summary__shipping">
        <span className="cl-cart-summary__shipping-title">{t('checkout.shipping', 'Shipping')}</span>
        <div className="cl-cart-summary__shipping-options">
          {methods.map((m) => (
            <label key={m.id} className="cl-cart-summary__option">
              <input
                type="radio"
                name="shipping"
                checked={selectedId === m.id}
                onChange={() => dispatch(set_shipping_method_id(m.id))}
              />
              <span>
                {getLabel(m)}
                {m.cost > 0 ? `: ${formatPrice(m.cost)}` : ''}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tax */}
      {taxEnabled && (
        <div className="cl-cart-summary__row">
          <span>
            {taxLabel}
            {taxRate > 0 ? ` (${taxRate}%)` : ''}
          </span>
          <span className="cl-cart-summary__value">{formatPrice(taxAmount)}</span>
        </div>
      )}

      {/* Total */}
      <div className="cl-cart-summary__total">
        <span>{t('checkout.total', 'Total')}</span>
        <span className="cl-cart-summary__total-value">{formatPrice(grandTotal)}</span>
      </div>

      {/* Checkout button */}
      <Link href="/checkout" className="cl-cart-summary__checkout-link">
        <ClButton variant="primary" size="lg" fullWidth>
          {t('cart.proceedToCheckout', 'Proceed to Checkout')}
          <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
        </ClButton>
      </Link>
    </div>
  );
};

export default CliconCartCheckout;
