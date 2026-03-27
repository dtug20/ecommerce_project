import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { add_cart_product } from '@/redux/features/cartSlice';
import { add_to_wishlist } from '@/redux/features/wishlist-slice';
import { handleProductModal } from '@/redux/features/productModalSlice';

/**
 * Product action buttons (wishlist, cart, quick view, compare).
 * Renders as a vertical or horizontal button group with icon buttons.
 *
 * @param {Object} props
 * @param {Object} props.product - Full product object (passed to Redux actions)
 * @param {boolean} [props.showWishlist=true]
 * @param {boolean} [props.showCart=true]
 * @param {boolean} [props.showQuickView=true]
 * @param {boolean} [props.showCompare=false]
 * @param {'vertical'|'horizontal'} [props.layout='vertical']
 * @param {string} [props.className] - Additional CSS class
 */
const ActionButtons = ({
  product,
  showWishlist = true,
  showCart = true,
  showQuickView = true,
  showCompare = false,
  layout = 'vertical',
  className = '',
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (!product) return null;

  const isOutOfStock =
    product.quantity === 0 || product.status === 'out-of-stock';

  const handleWishlist = (e) => {
    e.preventDefault();
    dispatch(add_to_wishlist(product));
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isOutOfStock) {
      dispatch(add_cart_product(product));
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    dispatch(handleProductModal(product));
  };

  const handleCompare = (e) => {
    e.preventDefault();
    // Compare uses add_to_compare if available
    try {
      const { add_to_compare } = require('@/redux/features/compareSlice');
      dispatch(add_to_compare(product));
    } catch {
      // compareSlice not available
    }
  };

  return (
    <div
      className={`cl-action-buttons cl-action-buttons--${layout}${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={t('product.actions', 'Product actions')}
    >
      {showWishlist && (
        <button
          type="button"
          className="cl-action-buttons__btn"
          onClick={handleWishlist}
          aria-label={t('product.addToWishlist')}
          data-testid="action-wishlist-btn"
        >
          <i className="fa-regular fa-heart" aria-hidden="true" />
        </button>
      )}
      {showCart && (
        <button
          type="button"
          className="cl-action-buttons__btn"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={t('product.addToCart')}
          data-testid="action-cart-btn"
        >
          <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
        </button>
      )}
      {showQuickView && (
        <button
          type="button"
          className="cl-action-buttons__btn"
          onClick={handleQuickView}
          aria-label={t('product.quickView')}
          data-testid="action-quickview-btn"
        >
          <i className="fa-regular fa-eye" aria-hidden="true" />
        </button>
      )}
      {showCompare && (
        <button
          type="button"
          className="cl-action-buttons__btn"
          onClick={handleCompare}
          aria-label={t('product.addToCompare', 'Add to compare')}
          data-testid="action-compare-btn"
        >
          <i className="fa-solid fa-arrows-rotate" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
