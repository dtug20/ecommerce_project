import React, { useEffect, useState } from 'react';
import { Rating } from 'react-simple-star-rating';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
// internal
import { AskQuestion, CompareTwo, WishlistTwo } from '@/svg';
import DetailsBottomInfo from './details-bottom-info';
import ProductDetailsCountdown from './product-details-countdown';
import ProductQuantity from './product-quantity';
import { add_cart_product } from '@/redux/features/cartSlice';
import { add_to_compare } from '@/redux/features/compareSlice';
import { handleModalClose } from '@/redux/features/productModalSlice';
import useWishlist from '@/hooks/use-wishlist';

const DetailsWrapper = ({ productItem, handleImageActive, activeImg, detailsBottom = false, selectedVariant = null }) => {
  const { sku, img, title, imageURLs, category, description, discount, price, status, reviews, tags, offerDate, vendor } = productItem || {};
  const [ratingVal, setRatingVal] = useState(0);
  const [textMore, setTextMore] = useState(false);
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const isAddedToWishlist = wishlist.some((item) => item._id === productItem?._id);
  const { handleWishlistProduct: handleWishlistHook } = useWishlist();

  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const rating =
        reviews.reduce((acc, review) => acc + review.rating, 0) /
        reviews.length;
      setRatingVal(rating);
    } else {
      setRatingVal(0);
    }
  }, [reviews]);

  // Resolve display values: use variant data when a variant is selected
  const displayPrice = selectedVariant?.price ?? price;
  const displayStatus = selectedVariant
    ? (selectedVariant.stock > 0 ? 'in-stock' : 'out-of-stock')
    : status;

  // handle add product — includes variant info when selected
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
          // Override price and img if variant provides them
          price: selectedVariant.price ?? price,
          img: selectedVariant.image || img,
        }
      : productItem;
    dispatch(add_cart_product(productToAdd));
  };

  // handle wishlist product (uses shared hook for auth-aware sync)
  const handleWishlistProduct = (prd) => {
    handleWishlistHook(prd, isAddedToWishlist);
  };

  // handle compare product
  const handleCompareProduct = (prd) => {
    dispatch(add_to_compare(prd));
  };

  return (
    <div className="tp-product-details-wrapper">
      <div className="tp-product-details-category">
        <span>{category.name}</span>
      </div>
      <h3 className="tp-product-details-title">{title}</h3>

      {/* inventory details */}
      <div className="tp-product-details-inventory d-flex align-items-center mb-10">
        <div className="tp-product-details-stock mb-10">
          <span>{displayStatus}</span>
        </div>
        <div className="tp-product-details-rating-wrapper d-flex align-items-center mb-10">
          <div className="tp-product-details-rating">
            <Rating allowFraction size={16} initialValue={ratingVal} readonly={true} />
          </div>
          <div className="tp-product-details-reviews">
            <span>({reviews && reviews.length > 0 ? reviews.length : 0} Review)</span>
          </div>
        </div>
      </div>
      <p>{textMore ? description : `${description.substring(0, 100)}...`}
        <span onClick={() => setTextMore(!textMore)}>{textMore ? 'See less' : 'See more'}</span>
      </p>

      {/* vendor badge */}
      {vendor?.vendorProfile?.storeName && vendor?.vendorProfile?.storeSlug && (
        <div className="tp-product-vendor mb-10">
          <span className="text-muted" style={{ fontSize: '13px' }}>Sold by: </span>
          <Link
            href={`/vendor/${vendor.vendorProfile.storeSlug}`}
            className="tp-product-vendor-link"
            style={{ fontSize: '13px', color: '#821F40', fontWeight: 500 }}
          >
            {vendor.vendorProfile.storeName}
          </Link>
        </div>
      )}

      {/* price — shows variant price when selected */}
      <div className="tp-product-details-price-wrapper mb-20">
        {selectedVariant ? (
          <span className="tp-product-details-price new-price">
            ${typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
          </span>
        ) : discount > 0 ? (
          <>
            <span className="tp-product-details-price old-price">${price}</span>
            <span className="tp-product-details-price new-price">
              {" "}${(Number(price) - (Number(price) * Number(discount)) / 100).toFixed(2)}
            </span>
          </>
        ) : (
          <span className="tp-product-details-price new-price">${price.toFixed(2)}</span>
        )}
      </div>

      {/* Legacy color variations (only shown when product has no variants array) */}
      {!selectedVariant && imageURLs.some(item => item?.color && item?.color?.name) && (
        <div className="tp-product-details-variation">
          <div className="tp-product-details-variation-item">
            <h4 className="tp-product-details-variation-title">Color :</h4>
            <div className="tp-product-details-variation-list">
              {imageURLs.map((item, i) => (
                <button onClick={() => handleImageActive(item)} key={i} type="button"
                  className={`color tp-color-variation-btn ${item.img === activeImg ? "active" : ""}`}>
                  <span
                    data-bg-color={`${item.color.clrCode}`}
                    style={{ backgroundColor: `${item.color.clrCode}` }}
                  ></span>
                  {item.color && item.color.name && (
                    <span className="tp-color-variation-tootltip">
                      {item.color.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* if ProductDetailsCountdown true start */}
      {offerDate?.endDate && <ProductDetailsCountdown offerExpiryTime={offerDate?.endDate} />}
      {/* if ProductDetailsCountdown true end */}

      {/* actions */}
      <div className="tp-product-details-action-wrapper">
        <h3 className="tp-product-details-action-title">Quantity</h3>
        <div className="tp-product-details-action-item-wrapper d-sm-flex align-items-center">
          {/* product quantity */}
          <ProductQuantity />
          {/* product quantity */}
          <div className="tp-product-details-add-to-cart mb-15 w-100">
            <button
              onClick={handleAddProduct}
              disabled={displayStatus === 'out-of-stock'}
              className="tp-product-details-add-to-cart-btn w-100"
            >
              Add To Cart
            </button>
          </div>
        </div>
        <Link href="/cart" onClick={() => dispatch(handleModalClose())}>
          <button className="tp-product-details-buy-now-btn w-100">Buy Now</button>
        </Link>
      </div>
      {/* product-details-action-sm start */}
      <div className="tp-product-details-action-sm">
        <button disabled={displayStatus === 'out-of-stock'} onClick={() => handleCompareProduct(productItem)} type="button" className="tp-product-details-action-sm-btn">
          <CompareTwo />
          Compare
        </button>
        <button disabled={displayStatus === 'out-of-stock'} onClick={() => handleWishlistProduct(productItem)} type="button" className="tp-product-details-action-sm-btn">
          <WishlistTwo />
          Add Wishlist
        </button>
        <button type="button" className="tp-product-details-action-sm-btn">
          <AskQuestion />
          Ask a question
        </button>
      </div>
      {/* product-details-action-sm end */}

      {detailsBottom && <DetailsBottomInfo category={category?.name} sku={selectedVariant?.sku || sku} tag={tags[0]} />}
    </div>
  );
};

export default DetailsWrapper;
