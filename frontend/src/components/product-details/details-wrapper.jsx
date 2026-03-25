import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { add_cart_product, decrement, increment, setOrderQuantity } from "@/redux/features/cartSlice";
import { add_to_compare } from '@/redux/features/compareSlice';
import { handleModalClose } from '@/redux/features/productModalSlice';
import useWishlist from '@/hooks/use-wishlist';
import useCurrency from '@/hooks/use-currency';
import ProductVariantSelector from './product-variant-selector';

const DetailsWrapper = ({
  productItem,
  handleImageActive,
  activeImg,
  detailsBottom = false,
  selectedVariant = null,
  variants = [],
  onVariantSelected,
}) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const {
    sku, img, title, imageURLs, category, description, discount, price,
    status, reviews, tags, offerDate, vendor, brand, quantity
  } = productItem || {};
  const [ratingVal, setRatingVal] = useState(0);
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { orderQuantity } = useSelector((state) => state.cart);
  const isAddedToWishlist = wishlist.some((item) => item._id === productItem?._id);
  const { handleWishlistProduct: handleWishlistHook } = useWishlist();

  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const rating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
      setRatingVal(rating);
    } else {
      setRatingVal(0);
    }
  }, [reviews]);

  const displayPrice = selectedVariant?.price ?? price;
  const displayStatus = selectedVariant
    ? (selectedVariant.stock > 0 ? 'in-stock' : 'out-of-stock')
    : status;
  const isOutOfStock = displayStatus === 'out-of-stock';
  const displayStock = selectedVariant?.stock ?? quantity ?? '';

  const discountedPrice = discount > 0
    ? (Number(price) - (Number(price) * Number(discount)) / 100).toFixed(2)
    : null;

  const handleAddProduct = () => {
    const productToAdd = selectedVariant
      ? {
          ...productItem,
          selectedVariant: {
            sku: selectedVariant.sku,
            color: selectedVariant.color,
            size: selectedVariant.size,
            price: selectedVariant.price,
            stock: selectedVariant.stock,
          },
          price: selectedVariant.price ?? price,
          img: selectedVariant.image || img,
          quantity: displayStock // strictly set quantity to current active stock
        }
      : { ...productItem, quantity: displayStock }; // ensure even non-variants cast current stock limit
    dispatch(add_cart_product(productToAdd));
  };

  const handleWishlistProduct = (prd) => {
    handleWishlistHook(prd, isAddedToWishlist);
  };

  const handleCompareProduct = (prd) => {
    dispatch(add_to_compare(prd));
  };

  const reviewCount = reviews?.length || 0;

  return (
    <div className="cl-pd__info">
      {/* 1. Rating */}
      <div className="cl-pd__rating">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < Math.round(ratingVal) ? 'cl-star' : 'cl-star cl-star--empty'}>
            &#9733;
          </span>
        ))}
        <span className="cl-pd__rating-text">
          <strong>{ratingVal.toFixed(1)} Star Rating</strong> ({reviewCount.toLocaleString()} User feedback)
        </span>
      </div>

      {/* 2. Title */}
      <h2 className="cl-pd__title">{title}</h2>

      {/* 3. Meta row */}
      <div className="cl-pd__meta">
        <div className="cl-pd__meta-item">
          Sku: <span>{selectedVariant?.sku || sku || 'N/A'}</span>
        </div>
        <div className="cl-pd__meta-item">
          Availability:{' '}
          <span className={`cl-pd__meta-badge cl-pd__meta-badge--${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
            {isOutOfStock ? 'Out of Stock' : `${displayStock} In Stock`}
          </span>
        </div>
        {brand && (
          <div className="cl-pd__meta-item">
            Brand: <span>{typeof brand === 'object' ? brand.name : brand}</span>
          </div>
        )}
        {category?.name && (
          <div className="cl-pd__meta-item">
            Category: <span>{category.name}</span>
          </div>
        )}
      </div>

      {/* 4. Price */}
      <div className="cl-pd__price">
        {selectedVariant ? (
          <span className="cl-pd__price-current">
            {formatPrice(displayPrice)}
          </span>
        ) : discountedPrice ? (
          <>
            <span className="cl-pd__price-current">{formatPrice(discountedPrice)}</span>
            <span className="cl-pd__price-old">{formatPrice(price)}</span>
            <span className="cl-pd__price-discount">{discount}% OFF</span>
          </>
        ) : (
          <span className="cl-pd__price-current">{formatPrice(price)}</span>
        )}
      </div>

      {/* 5. Vendor badge */}
      {vendor?.vendorProfile?.storeName && vendor?.vendorProfile?.storeSlug && (
        <div className="cl-pd__vendor">
          {t('product.soldBy')}{' '}
          <Link href={`/vendor/${vendor.vendorProfile.storeSlug}`}>
            {vendor.vendorProfile.storeName}
          </Link>
        </div>
      )}

      {/* 6. Variant selectors */}
      {variants && variants.length > 0 && (
        <ProductVariantSelector
          variants={variants}
          onVariantSelected={onVariantSelected}
        />
      )}

      {/* Legacy color variations (when no variants array) */}
      {!selectedVariant && !variants?.length && imageURLs?.some(item => item?.color?.name) && (
        <div className="cl-pd__color-swatches">
          <span className="cl-pd__color-swatches-label">Color</span>
          <div className="cl-pd__color-swatches-list">
            {imageURLs.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`cl-pd__color-swatch${item.img === activeImg ? ' cl-pd__color-swatch--active' : ''}`}
                onClick={() => handleImageActive(item)}
                title={item.color?.name}
              >
                <span style={{ backgroundColor: item.color?.clrCode }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. Quantity + Buttons */}
      <div className="cl-pd__actions">
        <div className="cl-pd__quantity">
          <button type="button" onClick={() => dispatch(decrement())}>&#8722;</button>
          <input 
            type="text" 
            value={orderQuantity} 
            onChange={(e) => dispatch(setOrderQuantity({ quantity: e.target.value, maxStock: displayStock }))}
          />
          <button type="button" onClick={() => dispatch(increment(displayStock))}>+</button>
        </div>
        <button
          type="button"
          className="cl-pd__add-to-cart-btn"
          onClick={handleAddProduct}
          disabled={isOutOfStock}
        >
          <i className="fa-solid fa-cart-shopping" /> ADD TO CART
        </button>
        <Link href="/cart" onClick={() => dispatch(handleModalClose())}>
          <button type="button" className="cl-pd__buy-now-btn">
            BUY NOW
          </button>
        </Link>
      </div>

      {/* 8. Secondary actions */}
      <div className="cl-pd__secondary-actions">
        <button
          type="button"
          className="cl-pd__secondary-action"
          disabled={isOutOfStock}
          onClick={() => handleWishlistProduct(productItem)}
        >
          <i className={`fa-${isAddedToWishlist ? 'solid' : 'regular'} fa-heart`} />
          {t('product.addToWishlist')}
        </button>
        <button
          type="button"
          className="cl-pd__secondary-action"
          disabled={isOutOfStock}
          onClick={() => handleCompareProduct(productItem)}
        >
          <i className="fa-solid fa-arrows-rotate" />
          {t('product.addToCompare')}
        </button>
        <div className="cl-pd__secondary-action">
          Share product:
          <div className="cl-pd__share-icons">
            <a href="#" aria-label="Copy link"><i className="fa-regular fa-copy" /></a>
            <a href="#" aria-label="Share on Facebook"><i className="fa-brands fa-facebook-f" /></a>
            <a href="#" aria-label="Share on Twitter"><i className="fa-brands fa-twitter" /></a>
            <a href="#" aria-label="Share on Pinterest"><i className="fa-brands fa-pinterest-p" /></a>
          </div>
        </div>
      </div>

      {/* 9. Safe checkout bar */}
      <div className="cl-pd__safe-checkout">
        <p className="cl-pd__safe-checkout-title">100% Guarantee Safe Checkout</p>
        <div className="cl-pd__safe-checkout-icons">
          <img src="/assets/img/product/icons/payment-option.png" alt="Payment methods" />
        </div>
      </div>
    </div>
  );
};

export default DetailsWrapper;
