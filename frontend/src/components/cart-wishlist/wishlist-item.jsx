import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { add_cart_product } from "@/redux/features/cartSlice";
import { remove_wishlist_product } from "@/redux/features/wishlist-slice";
import useCurrency from "@/hooks/use-currency";

const WishlistItem = ({ product }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { _id, img, title, price, discount, status, quantity } = product || {};
  const { cart_products } = useSelector((state) => state.cart);
  const isAddedToCart = cart_products.some((item) => item._id === _id);
  const dispatch = useDispatch();

  const isOutOfStock = status === 'out-of-stock' || quantity === 0;
  const hasDiscount = discount > 0;
  const displayPrice = hasDiscount ? price - (price * discount) / 100 : price;

  const handleAddProduct = () => {
    dispatch(add_cart_product(product));
  };

  const handleRemovePrd = () => {
    dispatch(remove_wishlist_product({ title, id: _id }));
  };

  return (
    <tr className="cl-wishlist__row">
      <td className="cl-wishlist__td">
        <div className="cl-wishlist__product">
          <Link href={`/product-details/${_id}`} className="cl-wishlist__img">
            {img && <img src={img} alt={title} />}
          </Link>
          <Link href={`/product-details/${_id}`} className="cl-wishlist__product-name">
            {title}
          </Link>
        </div>
      </td>
      <td className="cl-wishlist__td">
        <div className="cl-wishlist__price">
          {hasDiscount && (
            <span className="cl-wishlist__price-old">
              {formatPrice(price)}
            </span>
          )}
          <span className="cl-wishlist__price-current">
            {formatPrice(displayPrice)}
          </span>
        </div>
      </td>
      <td className="cl-wishlist__td">
        <span className={`cl-wishlist__stock ${isOutOfStock ? 'cl-wishlist__stock--out-of-stock' : 'cl-wishlist__stock--in-stock'}`}>
          {isOutOfStock ? t('product.outOfStock', 'OUT OF STOCK') : t('wishlist.inStock', 'IN STOCK')}
        </span>
      </td>
      <td className="cl-wishlist__td">
        <div className="cl-wishlist__actions">
          {isAddedToCart ? (
            <Link href="/cart" className="cl-wishlist__view-cart-btn">
              {t('wishlist.viewCart', 'View Cart')}
            </Link>
          ) : (
            <button
              onClick={handleAddProduct}
              type="button"
              disabled={isOutOfStock}
              className="cl-wishlist__add-btn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.33333 14.6667C5.7 14.6667 6 14.3667 6 14C6 13.6333 5.7 13.3333 5.33333 13.3333C4.96667 13.3333 4.66667 13.6333 4.66667 14C4.66667 14.3667 4.96667 14.6667 5.33333 14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.6667 14.6667C13.0333 14.6667 13.3333 14.3667 13.3333 14C13.3333 13.6333 13.0333 13.3333 12.6667 13.3333C12.3 13.3333 12 13.6333 12 14C12 14.3667 12.3 14.6667 12.6667 14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.33333 1.33334H2.66667L4.47333 9.59334C4.54222 9.90002 4.71251 10.1731 4.95587 10.3695C5.19922 10.566 5.50139 10.6733 5.81333 10.6733H12.3267C12.6386 10.6733 12.9408 10.566 13.1841 10.3695C13.4275 10.1731 13.5978 9.90002 13.6667 9.59334L14.7267 4.66668H3.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('compare.addToCart', 'ADD TO CART')}
            </button>
          )}
          <button
            onClick={handleRemovePrd}
            className="cl-wishlist__remove-btn"
            type="button"
            title={t('compare.remove', 'Remove')}
          >
            <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default WishlistItem;
