import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { add_cart_product, quantityDecrement, remove_product, setCartItemQuantity } from '@/redux/features/cartSlice';
import { PriceDisplay, QuantitySelector } from '@/components/clicon/ui';
import useCurrency from '@/hooks/use-currency';

/**
 * Cart item row — used in cart page table and mini cart.
 *
 * @param {Object} props
 * @param {Object} props.item - Cart item { _id, img, title, price, discount, orderQuantity, quantity }
 * @param {'row'|'compact'} [props.variant='row'] - row=full table row, compact=mini cart item
 * @param {string} [props.className]
 */
const CliconCartItem = ({ item, variant = 'row', className = '' }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  if (!item) return null;

  const { _id, img, title, price = 0, discount = 0, orderQuantity = 1, quantity: maxStock } = item;
  const unitPrice = discount > 0 ? Number((price - (price * discount) / 100).toFixed(2)) : price;
  const lineTotal = unitPrice * orderQuantity;

  const handleRemove = () => {
    dispatch(remove_product({ title, id: _id }));
  };

  // --- Compact variant (mini cart) ---
  if (variant === 'compact') {
    return (
      <div className={`cl-cart-item cl-cart-item--compact${className ? ` ${className}` : ''}`}>
        <div className="cl-cart-item__thumb">
          <Link href={`/product-details/${_id}`}>
            {img ? (
              <Image src={img} width={70} height={60} alt={title || 'product'} unoptimized />
            ) : (
              <div className="cl-cart-item__no-img" />
            )}
          </Link>
        </div>
        <div className="cl-cart-item__info">
          <h5 className="cl-cart-item__title">
            <Link href={`/product-details/${_id}`}>{title}</Link>
          </h5>
          <div className="cl-cart-item__price-qty">
            <span className="cl-cart-item__unit-price">{formatPrice(unitPrice)}</span>
            <span className="cl-cart-item__qty-label"> x{orderQuantity}</span>
          </div>
        </div>
        <button
          type="button"
          className="cl-cart-item__remove"
          onClick={handleRemove}
          aria-label={t('cart.removeItem', 'Remove {{title}}', { title })}
        >
          <i className="fa-regular fa-xmark" aria-hidden="true" />
        </button>
      </div>
    );
  }

  // --- Row variant (full cart page) ---
  return (
    <tr className={`cl-cart-item${className ? ` ${className}` : ''}`}>
      <td className="cl-cart-item__img-cell">
        <Link href={`/product-details/${_id}`}>
          {img ? (
            <Image src={img} alt={title || 'product'} width={80} height={80} style={{ objectFit: 'contain' }} unoptimized />
          ) : (
            <div className="cl-cart-item__no-img" style={{ width: 80, height: 80 }} />
          )}
        </Link>
      </td>
      <td className="cl-cart-item__title-cell">
        <Link href={`/product-details/${_id}`}>{title}</Link>
        {item.selectedVariant && (
          <span className="cl-cart-item__variant">{item.selectedVariant}</span>
        )}
      </td>
      <td className="cl-cart-item__price-cell">
        <span>{formatPrice(unitPrice)}</span>
      </td>
      <td className="cl-cart-item__qty-cell">
        <QuantitySelector
          value={orderQuantity}
          min={1}
          max={maxStock || 99}
          onChange={(qty) => dispatch(setCartItemQuantity({ _id, quantity: qty, maxStock: maxStock || 99 }))}
        />
      </td>
      <td className="cl-cart-item__total-cell">
        <span className="cl-cart-item__line-total">{formatPrice(lineTotal)}</span>
      </td>
      <td className="cl-cart-item__action-cell">
        <button
          type="button"
          className="cl-cart-item__remove-btn"
          onClick={handleRemove}
          aria-label={t('cart.removeItem', 'Remove {{title}}', { title })}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
};

export default CliconCartItem;
