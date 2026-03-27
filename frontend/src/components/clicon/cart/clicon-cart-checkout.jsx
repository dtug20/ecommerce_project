import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import useCartInfo from '@/hooks/use-cart-info';
import useCurrency from '@/hooks/use-currency';
import { ClButton } from '@/components/clicon/ui';

const CliconCartCheckout = () => {
  const { t } = useTranslation();
  const { total } = useCartInfo();
  const { formatPrice } = useCurrency();
  const [shipCost, setShipCost] = useState(0);

  const handleShippingCost = (value) => {
    setShipCost(value === 'free' ? 0 : value);
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
          <label className="cl-cart-summary__option">
            <input
              type="radio"
              name="shipping"
              onChange={() => handleShippingCost('free')}
              defaultChecked
            />
            <span>{t('checkout.free', 'Free Shipping')}</span>
          </label>
          <label className="cl-cart-summary__option">
            <input
              type="radio"
              name="shipping"
              onChange={() => handleShippingCost(20)}
            />
            <span>{t('cart.flatRate', 'Flat rate')}: {formatPrice(20)}</span>
          </label>
          <label className="cl-cart-summary__option">
            <input
              type="radio"
              name="shipping"
              onChange={() => handleShippingCost(25)}
            />
            <span>{t('cart.localPickup', 'Local pickup')}: {formatPrice(25)}</span>
          </label>
        </div>
      </div>

      {/* Total */}
      <div className="cl-cart-summary__total">
        <span>{t('checkout.total', 'Total')}</span>
        <span className="cl-cart-summary__total-value">{formatPrice(total + shipCost)}</span>
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
