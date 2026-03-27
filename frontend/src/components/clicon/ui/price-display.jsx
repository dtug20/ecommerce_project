import React from 'react';
import useCurrency from '@/hooks/use-currency';

/**
 * Reusable price display with discount calculation and multi-currency support.
 *
 * @param {Object} props
 * @param {number} props.price - Original price (before discount)
 * @param {number} [props.discount=0] - Discount percentage (0–100)
 * @param {'sm'|'md'|'lg'} [props.size='sm'] - Display size variant
 * @param {string} [props.className] - Additional CSS class
 */
const PriceDisplay = ({ price, discount = 0, size = 'sm', className = '' }) => {
  const { formatPrice } = useCurrency();

  if (typeof price !== 'number' || isNaN(price)) return null;

  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? Number((price - (price * discount) / 100).toFixed(2))
    : price;

  return (
    <div className={`cl-price cl-price--${size}${className ? ` ${className}` : ''}`}>
      <span className="cl-price__current">{formatPrice(discountedPrice)}</span>
      {hasDiscount && (
        <span className="cl-price__old">{formatPrice(price)}</span>
      )}
    </div>
  );
};

export default PriceDisplay;
