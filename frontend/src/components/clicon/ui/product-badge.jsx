import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Explicit variant badge for products.
 *
 * @param {Object} props
 * @param {'hot'|'sale'|'sold-out'|'best-deal'|'discount'|'new'} props.variant
 * @param {number} [props.discountPercent] - Required when variant='discount'
 * @param {string} [props.label] - Custom label override
 * @param {string} [props.className] - Additional CSS class
 */
export const ProductBadge = ({ variant, discountPercent, label: labelProp, className = '' }) => {
  const { t } = useTranslation();

  const labelMap = {
    hot: t('badge.hot', 'HOT'),
    sale: t('badge.sale', 'SALE'),
    'sold-out': t('badge.soldOut', 'SOLD OUT'),
    'best-deal': t('badge.bestDeal', 'BEST DEAL'),
    new: t('badge.new', 'NEW'),
    discount: discountPercent
      ? t('badge.discount', '-{{percent}}%', { percent: discountPercent })
      : null,
  };

  const displayLabel = labelProp || labelMap[variant];
  if (!displayLabel) return null;

  return (
    <span className={`cl-badge cl-badge--${variant}${className ? ` ${className}` : ''}`}>
      {displayLabel}
    </span>
  );
};

/**
 * Auto-detect badge variant from product data.
 * Picks the most relevant badge using priority: sold-out > discount > hot > new.
 *
 * @param {Object} props
 * @param {number} [props.discount=0] - Discount percentage
 * @param {number} [props.quantity=1] - Stock quantity
 * @param {boolean} [props.featured=false] - Is product featured/hot
 * @param {string[]} [props.tags=[]] - Product tags
 * @param {string} [props.className] - Additional CSS class
 */
export const ProductBadgeAuto = ({ discount = 0, quantity = 1, featured = false, tags = [], className = '' }) => {
  if (quantity === 0) {
    return <ProductBadge variant="sold-out" className={className} />;
  }
  if (discount > 0) {
    return <ProductBadge variant="sale" discountPercent={discount} className={className} />;
  }
  if (featured) {
    return <ProductBadge variant="hot" className={className} />;
  }
  if (tags?.includes('new')) {
    return <ProductBadge variant="new" className={className} />;
  }
  return null;
};

export default ProductBadge;
