import React from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { clearCart } from '@/redux/features/cartSlice';
import { CliconCartItem } from '@/components/clicon/composites';
import { ClButton, ClProgressBar } from '@/components/clicon/ui';
import useCartInfo from '@/hooks/use-cart-info';
import useCurrency from '@/hooks/use-currency';
import CliconCartCheckout from './clicon-cart-checkout';

const FREE_SHIPPING_THRESHOLD = 200;

const CliconCartArea = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { cart_products } = useSelector((state) => state.cart);
  const { total } = useCartInfo();
  const dispatch = useDispatch();

  const shippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);
  const remaining = FREE_SHIPPING_THRESHOLD - total;

  return (
    <section className="cl-cart" data-testid="cl-cart-area">
      <div className="container">
        {/* Empty state */}
        {cart_products.length === 0 && (
          <div className="cl-cart__empty">
            <i className="fa-solid fa-cart-shopping cl-cart__empty-icon" aria-hidden="true" />
            <h3 className="cl-cart__empty-title">{t('cart.empty', 'Your cart is empty')}</h3>
            <Link href="/shop">
              <ClButton variant="primary" size="lg">
                {t('cart.continueShopping', 'Continue Shopping')}
              </ClButton>
            </Link>
          </div>
        )}

        {/* Cart content */}
        {cart_products.length > 0 && (
          <div className="row">
            {/* Left: Product table */}
            <div className="col-lg-8">
              <div className="cl-cart__wrapper">
                <h6 className="cl-cart__title">{t('cart.shoppingCart', 'Shopping Cart')}</h6>

                {/* Shipping progress */}
                <div className="cl-cart__shipping-progress">
                  {remaining > 0 ? (
                    <p className="cl-cart__shipping-text">
                      {t('cart.addMore', 'Add {{amount}} more for free shipping', {
                        amount: formatPrice(remaining),
                      })}
                    </p>
                  ) : (
                    <p className="cl-cart__shipping-text cl-cart__shipping-text--success">
                      <i className="fa-solid fa-circle-check me-1" aria-hidden="true" />
                      {t('cart.freeShipping', 'You qualify for free shipping!')}
                    </p>
                  )}
                  <ClProgressBar
                    value={shippingProgress}
                    variant={remaining > 0 ? 'primary' : 'success'}
                    size="sm"
                  />
                </div>

                {/* Product table */}
                <div className="cl-cart__table-wrap">
                  <table className="cl-cart__table">
                    <thead>
                      <tr>
                        <th colSpan="2">{t('cart.products', 'Products')}</th>
                        <th>{t('product.price', 'Price')}</th>
                        <th>{t('cart.quantity', 'Quantity')}</th>
                        <th>{t('cart.subtotal', 'Sub-Total')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart_products.map((item) => (
                        <CliconCartItem key={item._id} item={item} variant="row" />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom actions */}
                <div className="cl-cart__bottom">
                  <Link href="/shop">
                    <ClButton variant="outlined" size="md">
                      {t('cart.returnToShop', 'Return to Shop')}
                    </ClButton>
                  </Link>
                  <ClButton
                    variant="danger"
                    size="md"
                    onClick={() => dispatch(clearCart())}
                  >
                    {t('cart.clearCart', 'Clear Cart')}
                  </ClButton>
                </div>
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="col-lg-4">
              <CliconCartCheckout />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CliconCartArea;
