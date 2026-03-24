import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { add_cart_product } from '@/redux/features/cartSlice';
import { handleProductModal } from '@/redux/features/productModalSlice';

// ---------------------------------------------------------------------------
// Star rating row
// ---------------------------------------------------------------------------
function StarRating({ reviews = [] }) {
  const count = reviews.length;
  const avg =
    count > 0
      ? Math.round(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count)
      : 0;

  return (
    <div className="cl-deal-featured__rating" aria-label={`${avg} out of 5 stars`}>
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
// Main component
// ---------------------------------------------------------------------------
const CliconDealFeaturedCard = ({ product }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (!product) return null;

  const {
    _id,
    title,
    img,
    imageURLs,
    price = 0,
    discount = 0,
    quantity = 0,
    reviews = [],
    description,
  } = product;

  const discountedPrice =
    discount > 0 ? (price - (price * discount) / 100).toFixed(2) : price.toFixed(2);

  const isOutOfStock = quantity === 0 || product.status === 'out-of-stock';
  const productImage = img || imageURLs?.[0]?.img || null;

  // Truncate description to ~120 chars
  const shortDesc = description
    ? description.length > 120
      ? description.slice(0, 120).trimEnd() + '…'
      : description
    : null;

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

  return (
    <div className="cl-deal-featured" data-testid={`clicon-deal-featured-${_id}`}>
      {/* Product image */}
      <div className="cl-deal-featured__image-wrap">
        <Link href={`/product-details/${_id}`} aria-label={title}>
          {productImage ? (
            <Image
              src={productImage}
              alt={title}
              width={380}
              height={320}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              priority
              unoptimized
            />
          ) : (
            <div className="cl-deal-featured__no-img" aria-label="No image available" />
          )}
        </Link>
      </div>

      {/* Product info */}
      <div className="cl-deal-featured__body">
        <StarRating reviews={reviews} />

        <h2 className="cl-deal-featured__title">
          <Link href={`/product-details/${_id}`}>{title}</Link>
        </h2>

        <div className="cl-deal-featured__price-row">
          <span className="cl-deal-featured__price-current">${discountedPrice}</span>
          {discount > 0 && (
            <span className="cl-deal-featured__price-old">${price.toFixed(2)}</span>
          )}
        </div>

        {shortDesc && (
          <p className="cl-deal-featured__desc">{shortDesc}</p>
        )}

        <div className="cl-deal-featured__actions">
          <button
            type="button"
            className="cl-deal-featured__cart-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={t('product.addToCart')}
            data-testid="deal-featured-cart-btn"
          >
            <i className="fa-solid fa-cart-shopping me-2" aria-hidden="true" />
            {isOutOfStock ? t('product.outOfStock') : t('deals.addToCart')}
          </button>

          <button
            type="button"
            className="cl-deal-featured__quickview-btn"
            onClick={handleQuickView}
            aria-label={t('product.quickView')}
            data-testid="deal-featured-quickview-btn"
          >
            <i className="fa-regular fa-eye" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CliconDealFeaturedCard;
