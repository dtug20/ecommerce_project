import React from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import keycloak from '@/lib/keycloak';
import WishlistItem from './wishlist-item';
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useClearWishlistMutation } from '@/redux/features/cmsApi';
import { remove_wishlist_product } from '@/redux/features/wishlist-slice';
import { add_cart_product } from '@/redux/features/cartSlice';
import { notifySuccess, notifyError } from '@/utils/toast';

// Server-side wishlist item for authenticated users
const ServerWishlistItem = ({ item, onRemove }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { cart_products } = useSelector((state) => state.cart);
  const product = item.product || item;
  const { _id, img, title, price, status } = product;
  const isAddedToCart = cart_products.some((p) => p._id === _id);

  const handleAddToCart = () => {
    dispatch(add_cart_product(product));
  };

  return (
    <tr>
      <td className="tp-cart-img">
        <Link href={`/product-details/${_id}`}>
          {img && (
            <img
              src={img}
              alt={title}
              width={70}
              height={100}
              style={{ objectFit: 'cover' }}
            />
          )}
        </Link>
      </td>
      <td className="tp-cart-title">
        <Link href={`/product-details/${_id}`}>{title}</Link>
      </td>
      <td className="tp-cart-price">
        <span>${typeof price === 'number' ? price.toFixed(2) : price}</span>
      </td>
      <td className="tp-cart-stock">
        <span className={`badge ${status === 'out-of-stock' ? 'bg-danger' : 'bg-success'}`}>
          {status === 'out-of-stock' ? t('product.outOfStock') : t('wishlist.inStock')}
        </span>
      </td>
      <td className="tp-cart-add-to-cart">
        {isAddedToCart ? (
          <Link href="/cart" className="tp-btn tp-btn-2 tp-btn-blue">
            {t('wishlist.viewCart')}
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            type="button"
            disabled={status === 'out-of-stock'}
            className="tp-btn tp-btn-2 tp-btn-blue"
          >
            {t('compare.addToCart')}
          </button>
        )}
      </td>
      <td className="tp-cart-action">
        <button
          onClick={() => onRemove(_id, title)}
          className="tp-cart-action-btn"
          type="button"
        >
          <span>&#10005;</span>
          <span> {t('compare.remove')}</span>
        </button>
      </td>
    </tr>
  );
};

const WishlistArea = () => {
  const { t } = useTranslation();
  const isAuthenticated = keycloak.authenticated;
  const { wishlist } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();

  // Server-side wishlist for authenticated users
  const {
    data: serverWishlistData,
    isLoading: serverLoading,
  } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });

  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [clearWishlist] = useClearWishlistMutation();

  const serverItems = serverWishlistData?.wishlist || serverWishlistData?.items || [];

  const handleServerRemove = async (productId, title) => {
    try {
      await removeFromWishlist(productId).unwrap();
      notifySuccess(`${title} removed from wishlist`);
    } catch {
      notifyError('Failed to remove item');
    }
  };

  const handleServerClear = async () => {
    try {
      await clearWishlist().unwrap();
      notifySuccess('Wishlist cleared');
    } catch {
      notifyError('Failed to clear wishlist');
    }
  };

  // Render server-side wishlist for authenticated users
  if (isAuthenticated) {
    if (serverLoading) {
      return (
        <section className="tp-cart-area pb-120">
          <div className="container">
            <div className="text-center pt-50">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="tp-cart-area pb-120">
        <div className="container">
          {serverItems.length === 0 && (
            <div className="text-center pt-50">
              <h3>{t('wishlist.noItems')}</h3>
              <Link href="/shop" className="tp-cart-checkout-btn mt-20">
                {t('cart.continueShopping')}
              </Link>
            </div>
          )}
          {serverItems.length > 0 && (
            <div className="row">
              <div className="col-xl-12">
                <div className="tp-cart-list mb-45 mr-30">
                  <table className="table">
                    <thead>
                      <tr>
                        <th colSpan="2" className="tp-cart-header-product">{t('compare.product')}</th>
                        <th className="tp-cart-header-price">{t('product.price')}</th>
                        <th>{t('wishlist.stock')}</th>
                        <th>{t('wishlist.action')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverItems.map((item, i) => (
                        <ServerWishlistItem
                          key={item._id || i}
                          item={item}
                          onRemove={handleServerRemove}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="tp-cart-bottom">
                  <div className="row align-items-end">
                    <div className="col-xl-6 col-md-4">
                      <div className="tp-cart-update d-flex gap-3">
                        <Link href="/cart" className="tp-cart-update-btn">
                          {t('wishlist.goToCart')}
                        </Link>
                        <button
                          type="button"
                          onClick={handleServerClear}
                          className="tp-cart-update-btn"
                          style={{ backgroundColor: '#f5f5f5', color: '#333' }}
                        >
                          {t('wishlist.clearWishlist')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Anonymous users: localStorage/Redux wishlist
  return (
    <>
      <section className="tp-cart-area pb-120">
        <div className="container">
          {wishlist.length === 0 && (
            <div className="text-center pt-50">
              <h3>{t('wishlist.noItems')}</h3>
              <Link href="/shop" className="tp-cart-checkout-btn mt-20">
                {t('cart.continueShopping')}
              </Link>
            </div>
          )}
          {wishlist.length > 0 && (
            <div className="row">
              <div className="col-xl-12">
                <div className="tp-cart-list mb-45 mr-30">
                  <table className="table">
                    <thead>
                      <tr>
                        <th colSpan="2" className="tp-cart-header-product">{t('compare.product')}</th>
                        <th className="tp-cart-header-price">{t('product.price')}</th>
                        <th className="tp-cart-header-quantity">{t('product.quantity')}</th>
                        <th>{t('wishlist.action')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlist.map((item, i) => (
                        <WishlistItem key={i} product={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="tp-cart-bottom">
                  <div className="row align-items-end">
                    <div className="col-xl-6 col-md-4">
                      <div className="tp-cart-update">
                        <Link href="/cart" className="tp-cart-update-btn">
                          {t('wishlist.goToCart')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default WishlistArea;
