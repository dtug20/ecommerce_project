import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { closeCartMini } from '@/redux/features/cartSlice';
import useCartInfo from '@/hooks/use-cart-info';
import useCurrency from '@/hooks/use-currency';
import CliconCartItem from './cart-item';

/**
 * Mini cart sidebar — slides in from the right.
 * Uses Redux state for cart items and open/close.
 *
 * @param {string} [props.className]
 */
const CliconMiniCart = ({ className = '' }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const dispatch = useDispatch();
  const { cart_products, cartMiniOpen } = useSelector((state) => state.cart);
  const { total } = useCartInfo();

  const handleClose = () => dispatch(closeCartMini());

  return (
    <>
      <div className={`cl-minicart${cartMiniOpen ? ' cl-minicart--open' : ''}${className ? ` ${className}` : ''}`}>
        <div className="cl-minicart__inner">
          {/* Header */}
          <div className="cl-minicart__header">
            <h4 className="cl-minicart__title">{t('cart.shoppingCart', 'Shopping Cart')}</h4>
            <button
              type="button"
              className="cl-minicart__close"
              onClick={handleClose}
              aria-label={t('common.close', 'Close')}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>

          {/* Items */}
          {cart_products.length > 0 ? (
            <div className="cl-minicart__items">
              {cart_products.map((item) => (
                <CliconCartItem key={item._id} item={item} variant="compact" />
              ))}
            </div>
          ) : (
            <div className="cl-minicart__empty">
              <p>{t('cart.emptyCart', 'Your cart is empty')}</p>
              <Link href="/shop" onClick={handleClose} className="cl-btn cl-btn--primary cl-btn--md">
                {t('cart.goToShop', 'Go to Shop')}
              </Link>
            </div>
          )}

          {/* Footer */}
          {cart_products.length > 0 && (
            <div className="cl-minicart__footer">
              <div className="cl-minicart__subtotal">
                <span>{t('cart.subtotal', 'Subtotal')}:</span>
                <span className="cl-minicart__subtotal-amount">{formatPrice(total)}</span>
              </div>
              <div className="cl-minicart__actions">
                <Link href="/cart" onClick={handleClose} className="cl-btn cl-btn--outlined cl-btn--md cl-btn--full">
                  {t('cart.viewCart', 'View Cart')}
                </Link>
                <Link href="/checkout" onClick={handleClose} className="cl-btn cl-btn--primary cl-btn--md cl-btn--full">
                  {t('cart.checkout', 'Checkout')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Overlay */}
      <div
        className={`cl-minicart__overlay${cartMiniOpen ? ' cl-minicart__overlay--visible' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />
    </>
  );
};

export default CliconMiniCart;
