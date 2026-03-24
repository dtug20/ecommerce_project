import Image from "next/image";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import useCartInfo from "@/hooks/use-cart-info";
import useCurrency from "@/hooks/use-currency";

const CheckoutOrderArea = ({ checkoutData }) => {
  const { t } = useTranslation();
  const { formatPrice, currency } = useCurrency();
  const {
    cartTotal = 0,
    isCheckoutSubmit,
    shippingCost,
    discountAmount,
  } = checkoutData;
  const { cart_products } = useSelector((state) => state.cart);
  const { total } = useCartInfo();

  // Helper to get product thumbnail
  const getThumb = (item) => {
    if (item.img) return item.img;
    if (item.image) return item.image;
    if (item.imageURLs?.[0]?.img) return item.imageURLs[0].img;
    if (item.imageURLs?.[0]?.color_img) return item.imageURLs[0].color_img;
    return '/assets/img/product/placeholder.png';
  };

  return (
    <div className="cl-checkout__summary-wrap">
      <div className="cl-checkout__summary">
        <h3 className="cl-checkout__summary-title">{t('checkout.orderSummary')}</h3>

        {/* Product list */}
        <div className="cl-checkout__summary-items">
          {cart_products.map((item) => (
            <div key={item._id} className="cl-checkout__summary-item">
              <div className="cl-checkout__summary-thumb">
                <Image
                  src={getThumb(item)}
                  alt={item.title}
                  width={60}
                  height={60}
                  style={{ objectFit: 'contain' }}
                  unoptimized
                />
              </div>
              <div className="cl-checkout__summary-item-info">
                <p className="item-title">{item.title}</p>
                <p className="item-qty">
                  {item.orderQuantity} x{" "}
                  <span>{formatPrice(item.price)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Cost breakdown */}
        <div className="cl-checkout__summary-row">
          <span className="label">{t('checkout.subTotal')}</span>
          <span className="value">{formatPrice(total)}</span>
        </div>

        <div className="cl-checkout__summary-row">
          <span className="label">{t('checkout.shipping')}</span>
          <span className={shippingCost === 0 ? "value--free" : "value"}>
            {shippingCost === 0 ? t('checkout.free') : formatPrice(shippingCost)}
          </span>
        </div>

        <div className="cl-checkout__summary-row">
          <span className="label">{t('checkout.discount')}</span>
          <span className="value">{formatPrice(discountAmount)}</span>
        </div>

        <div className="cl-checkout__summary-row">
          <span className="label">{t('checkout.tax')}</span>
          <span className="value">{formatPrice(0)}</span>
        </div>

        {/* Total */}
        <div className="cl-checkout__summary-total">
          <span>{t('checkout.total')}</span>
          <span>
            {formatPrice(cartTotal)}
            <span className="total-currency">{currency}</span>
          </span>
        </div>

        {/* Place Order button */}
        <button
          type="submit"
          disabled={isCheckoutSubmit}
          className="cl-checkout__place-order-btn"
        >
          {isCheckoutSubmit ? t('checkout.processing') : t('checkout.placeOrder').toUpperCase()}
          {!isCheckoutSubmit && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default CheckoutOrderArea;
