import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { Rating } from "react-simple-star-rating";
import { useTranslation } from "react-i18next";
import { add_cart_product } from "@/redux/features/cartSlice";
import { add_to_wishlist } from "@/redux/features/wishlist-slice";
import { remove_compare_product } from "@/redux/features/compareSlice";
import useCurrency from "@/hooks/use-currency";

// Heart SVG icon
const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.63 3.4575C15.2469 3.07425 14.7921 2.77023 14.2915 2.56281C13.7909 2.35539 13.2544 2.24878 12.7125 2.24878C12.1706 2.24878 11.6341 2.35539 11.1335 2.56281C10.6329 2.77023 10.1781 3.07425 9.795 3.4575L9 4.2525L8.205 3.4575C7.43125 2.68375 6.38312 2.24919 5.2875 2.24919C4.19188 2.24919 3.14375 2.68375 2.37 3.4575C1.59625 4.23125 1.16169 5.27938 1.16169 6.375C1.16169 7.47063 1.59625 8.51875 2.37 9.2925L3.165 10.0875L9 15.9225L14.835 10.0875L15.63 9.2925C16.0132 8.90943 16.3173 8.45461 16.5247 7.95401C16.7321 7.45342 16.8387 6.91686 16.8387 6.375C16.8387 5.83314 16.7321 5.29658 16.5247 4.79599C16.3173 4.29539 16.0132 3.84057 15.63 3.4575Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Cart SVG icon
const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.33333 14.6667C5.7 14.6667 6 14.3667 6 14C6 13.6333 5.7 13.3333 5.33333 13.3333C4.96667 13.3333 4.66667 13.6333 4.66667 14C4.66667 14.3667 4.96667 14.6667 5.33333 14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.6667 14.6667C13.0333 14.6667 13.3333 14.3667 13.3333 14C13.3333 13.6333 13.0333 13.3333 12.6667 13.3333C12.3 13.3333 12 13.6333 12 14C12 14.3667 12.3 14.6667 12.6667 14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.33333 1.33334H2.66667L4.47333 9.59334C4.54222 9.90002 4.71251 10.1731 4.95587 10.3695C5.19922 10.566 5.50139 10.6733 5.81333 10.6733H12.3267C12.6386 10.6733 12.9408 10.566 13.1841 10.3695C13.4275 10.1731 13.5978 9.90002 13.6667 9.59334L14.7267 4.66668H3.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Close SVG icon
const CloseIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CompareArea = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { compareItems } = useSelector((state) => state.compare);
  const { wishlist } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();

  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
  };

  const handleRemoveComparePrd = (prd) => {
    dispatch(remove_compare_product(prd));
  };

  const handleToggleWishlist = (prd) => {
    dispatch(add_to_wishlist(prd));
  };

  const isInWishlist = (id) => wishlist.some((item) => item._id === id);

  // Compute average rating
  const getAvgRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length;
  };

  const getReviewCount = (reviews) => {
    if (!reviews) return 0;
    return reviews.length;
  };

  // Empty state
  if (compareItems.length === 0) {
    return (
      <section className="cl-compare__section">
        <div className="container">
          <div className="cl-compare__card">
            <div className="cl-compare__empty">
              <h3 className="cl-compare__empty-title">{t('compare.noItems', 'No items to compare')}</h3>
              <Link href="/shop" className="cl-compare__empty-link">
                {t('cart.continueShopping', 'Continue Shopping')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Comparison attribute rows
  const attributes = [
    {
      label: t('compare.customerFeedback', 'Customer feedback:'),
      render: (item) => (
        <div className="cl-compare__rating">
          <Rating
            allowFraction
            size={16}
            initialValue={getAvgRating(item.reviews)}
            readonly={true}
          />
          <span className="cl-compare__rating-count">
            ({getReviewCount(item.reviews).toLocaleString()})
          </span>
        </div>
      ),
    },
    {
      label: t('compare.price', 'Price:'),
      render: (item) => {
        const hasDiscount = item.discount > 0;
        const displayPrice = hasDiscount
          ? item.price - (item.price * item.discount) / 100
          : item.price;
        return (
          <span className="cl-compare__price">
            {formatPrice(displayPrice || 0)}
          </span>
        );
      },
    },
    {
      label: t('compare.soldBy', 'Sold by:'),
      render: (item) => item.vendor?.storeName || 'Clicon',
    },
    {
      label: t('compare.brand', 'Brand:'),
      render: (item) => {
        if (typeof item.brand === 'object') return item.brand?.name || '-';
        return item.brand || '-';
      },
    },
    {
      label: t('compare.model', 'Model:'),
      render: (item) => item.model || item.title?.split(' ').slice(0, 3).join(' ') || '-',
    },
    {
      label: t('compare.stockStatus', 'Stock status:'),
      render: (item) => {
        const isOutOfStock = item.status === 'out-of-stock' || item.quantity === 0;
        return (
          <span className={`cl-compare__stock ${isOutOfStock ? 'cl-compare__stock--out-of-stock' : 'cl-compare__stock--in-stock'}`}>
            {isOutOfStock ? t('product.outOfStock', 'OUT OF STOCK') : t('wishlist.inStock', 'IN STOCK')}
          </span>
        );
      },
    },
    {
      label: t('compare.size', 'Size:'),
      render: (item) => {
        if (item.dimensions) {
          const d = item.dimensions;
          return `${d.length || '-'} x ${d.width || '-'} x ${d.height || '-'} cm`;
        }
        if (item.sizes && item.sizes.length > 0) {
          return item.sizes.join(', ');
        }
        return '-';
      },
    },
    {
      label: t('compare.weight', 'Weight:'),
      render: (item) => {
        if (item.weight) return `${item.weight} g`;
        return '-';
      },
    },
  ];

  return (
    <section className="cl-compare__section">
      <div className="container">
        <div className="cl-compare__card">
          {/* Product Columns */}
          <div className="cl-compare__products-grid">
            {compareItems.map((item) => (
              <div key={item._id} className="cl-compare__product-col">
                <button
                  className="cl-compare__remove-btn"
                  onClick={() => handleRemoveComparePrd({ title: item.title, id: item._id })}
                  title={t('compare.remove', 'Remove')}
                >
                  <CloseIcon />
                </button>

                <div className="cl-compare__product-img">
                  {item.img ? (
                    <Image
                      src={item.img}
                      alt={item.title || "compare"}
                      width={180}
                      height={180}
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: 180, height: 180, backgroundColor: 'var(--cl-bg-gray)' }} />
                  )}
                </div>

                <div className="cl-compare__product-title">
                  <Link href={`/product-details/${item._id}`}>
                    {item.title}
                  </Link>
                </div>

                <div className="cl-compare__product-actions">
                  <button
                    className="cl-compare__add-btn"
                    onClick={() => handleAddProduct(item)}
                    type="button"
                  >
                    <CartIcon />
                    {t('compare.addToCart', 'ADD TO CART')}
                  </button>
                  <button
                    className={`cl-compare__wishlist-btn ${isInWishlist(item._id) ? 'cl-compare__wishlist-btn--active' : ''}`}
                    onClick={() => handleToggleWishlist(item)}
                    type="button"
                    title={t('wishlist.title', 'Wishlist')}
                  >
                    <HeartIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Attribute Comparison Table */}
          <table className="cl-compare__table">
            <tbody>
              {attributes.map((attr, idx) => (
                <tr key={idx} className="cl-compare__table-row">
                  <td className="cl-compare__table-label">{attr.label}</td>
                  {compareItems.map((item) => (
                    <td key={item._id} className="cl-compare__table-value">
                      {attr.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default CompareArea;
