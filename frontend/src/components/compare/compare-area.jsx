import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { Rating } from "react-simple-star-rating";
import { useTranslation } from "react-i18next";
// internal
import { add_cart_product } from "@/redux/features/cartSlice";
import { remove_compare_product } from "@/redux/features/compareSlice";

const CompareArea = () => {
  const { t } = useTranslation();
  const { compareItems } = useSelector((state) => state.compare);
  const dispatch = useDispatch();

  // handle add product
  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
  };
  // handle add product
  const handleRemoveComparePrd = (prd) => {
    dispatch(remove_compare_product(prd));
  };

  return (
    <>
      <section className="tp-compare-area pb-120">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              {compareItems.length === 0 && (
                <div className="text-center pt-50">
                  <h3>{t('compare.noItems')}</h3>
                  <Link href="/shop" className="tp-cart-checkout-btn mt-20">
                    {t('cart.continueShopping')}
                  </Link>
                </div>
              )}
              {compareItems.length > 0 && (
                <div className="tp-compare-table table-responsive text-center">
                  <table className="table">
                    <tbody>
                      <tr>
                        <th>{t('compare.product')}</th>
                        {compareItems.map(item => (
                          <td key={item._id} className="">
                            <div className="tp-compare-thumb">
                              {item.img ? (
                                <Image
                                  src={item.img}
                                  alt={item.title || "compare"}
                                  width={205}
                                  height={176}
                                />
                              ) : (
                                <div style={{ width: 205, height: 176, backgroundColor: '#f3f4f6' }} />
                              )}
                              <h4 className="tp-compare-product-title">
                                <Link href={`/product-details/${item._id}`}>
                                  {item.title}
                                </Link>
                              </h4>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* Description */}
                      <tr>
                        <th>{t('compare.description')}</th>
                        {compareItems.map(item => (
                          <td key={item._id}>
                            <div className="tp-compare-desc">
                              <p>
                                {(item.description || '').substring(0, 100) || 'No description available.'}
                              </p>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* Price */}
                      <tr>
                        <th>{t('compare.price')}</th>
                        {compareItems.map(item => (
                          <td key={item._id}>
                            <div className="tp-compare-price">
                              <span>${(item.price || 0).toFixed(2)}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* Add to cart*/}
                      <tr>
                        <th>{t('compare.addToCart')}</th>
                        {compareItems.map(item => (
                          <td key={item._id}>
                            <div className="tp-compare-add-to-cart">
                              <button onClick={() => handleAddProduct(item)} type="button" className="tp-btn">
                                {t('compare.addToCart')}
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* Rating */}
                      <tr>
                        <th>{t('compare.rating')}</th>
                        {compareItems.map(item => (
                          <td key={item._id}>
                            <div className="tp-compare-rating">
                              <Rating
                                allowFraction
                                size={16}
                                initialValue={item.reviews?.length > 0 ? item.reviews.reduce((acc, review) => acc + review.rating, 0) / item.reviews.length : 0}
                                readonly={true}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* Remove */}
                      <tr>
                        <th>{t('compare.remove')}</th>
                        {compareItems.map(item => (
                          <td key={item._id}>
                            <div className="tp-compare-remove">
                              <button onClick={()=>handleRemoveComparePrd({title:item.title,id:item._id })}>
                                <i className="fal fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CompareArea;
