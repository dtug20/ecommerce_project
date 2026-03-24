import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { add_cart_product } from '@/redux/features/cartSlice';
import { add_to_wishlist } from '@/redux/features/wishlist-slice';
import { handleProductModal } from '@/redux/features/productModalSlice';

// ---------------------------------------------------------------------------
// Star rating sub-component
// ---------------------------------------------------------------------------
function StarRating({ reviews = [] }) {
  const count = reviews.length;
  const avg =
    count > 0
      ? Math.round(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count)
      : 0;

  return (
    <div className="cl-deal-card__rating" aria-label={`${avg} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`cl-star${i < avg ? '' : ' cl-star--empty'}`}
          aria-hidden="true"
        >
          &#9733;
        </span>
      ))}
      {count > 0 && <span className="cl-rating-count">({count})</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge sub-component — picks the most relevant label
// ---------------------------------------------------------------------------
function ProductBadge({ discount, quantity, featured, tags }) {
  if (quantity === 0) {
    return <span className="cl-badge cl-badge--soldout">Sold Out</span>;
  }
  if (discount > 0) {
    return <span className="cl-badge cl-badge--sale">-{discount}%</span>;
  }
  if (featured) {
    return <span className="cl-badge cl-badge--hot">HOT</span>;
  }
  if (tags?.includes('new')) {
    return <span className="cl-badge cl-badge--deal">NEW</span>;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const CliconDealProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (!product) return null;

  const { _id, title, img, imageURLs, price = 0, discount = 0, quantity = 0, reviews = [], featured, tags } = product;

  const discountedPrice =
    discount > 0 ? (price - (price * discount) / 100).toFixed(2) : price.toFixed(2);

  const isOutOfStock = quantity === 0 || product.status === 'out-of-stock';
  const productImage = img || imageURLs?.[0]?.img || null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isOutOfStock) {
      dispatch(add_cart_product(product));
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    dispatch(add_to_wishlist(product));
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    dispatch(handleProductModal(product));
  };

  return (
    <div className="cl-deal-card" data-testid={`clicon-deal-card-${_id}`}>
      {/* Image area */}
      <div className="cl-deal-card__image-wrap">
        <Link href={`/product-details/${_id}`} aria-label={title} tabIndex={-1}>
          {productImage ? (
            <Image
              src={productImage}
              alt={title}
              width={220}
              height={180}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              unoptimized
            />
          ) : (
            <div className="cl-deal-card__no-img" aria-label="No image available" />
          )}
        </Link>

        {/* Badge — top-left */}
        <div className="cl-deal-card__badge-wrap">
          <ProductBadge discount={discount} quantity={quantity} featured={featured} tags={tags} />
        </div>

        {/* Hover action buttons — right side */}
        <div className="cl-deal-card__actions" role="group" aria-label="Product actions">
          <button
            type="button"
            className="cl-deal-card__action-btn"
            onClick={handleWishlist}
            aria-label={t('product.addToWishlist')}
            data-testid="deal-wishlist-btn"
          >
            <i className="fa-regular fa-heart" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="cl-deal-card__action-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={t('product.addToCart')}
            data-testid="deal-cart-btn"
          >
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="cl-deal-card__action-btn"
            onClick={handleQuickView}
            aria-label={t('product.quickView')}
            data-testid="deal-quickview-btn"
          >
            <i className="fa-regular fa-eye" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="cl-deal-card__body">
        <StarRating reviews={reviews} />
        <h3 className="cl-deal-card__title">
          <Link href={`/product-details/${_id}`}>{title}</Link>
        </h3>
        <div className="cl-deal-card__price-row">
          <span className="cl-price-current">${discountedPrice}</span>
          {discount > 0 && (
            <span className="cl-price-old">${price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CliconDealProductCard;
