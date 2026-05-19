import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Link from "next/link";
// internal
import CheckoutBillingArea from "./checkout-billing-area";
import CheckoutCoupon from "./checkout-coupon";
import CheckoutLogin from "./checkout-login";
import CheckoutOrderArea from "./checkout-order-area";
import CheckoutSavedAddresses from "./checkout-saved-addresses";
import CheckoutCouponSuggestions from "./checkout-coupon-suggestions";
import CheckoutPaymentMethods from "./checkout-payment-methods";
import useCheckoutSubmit from "@/hooks/use-checkout-submit";

const CheckoutArea = () => {
  const { t } = useTranslation();
  const checkoutData = useCheckoutSubmit();
  const {
    handleSubmit,
    submitHandler,
    register,
    errors,
    handleCouponCode,
    couponRef,
    couponApplyMsg,
    setValue,
    paymentMethod,
    setPaymentMethod,
    bankDetails,
  } = checkoutData;
  const { cart_products } = useSelector((state) => state.cart);

  // Allow coupon suggestions to auto-apply a coupon code
  const handleApplySuggestedCoupon = (code) => {
    if (couponRef?.current) {
      couponRef.current.value = code;
      handleCouponCode({ preventDefault: () => {} });
    }
  };

  return (
    <section className="cl-checkout">
      <div className="container">
        {cart_products.length === 0 && (
          <div className="cl-checkout__empty">
            <h3>{t("checkout.noItemsInCart")}</h3>
            <Link href="/shop">{t("checkout.returnToShop")}</Link>
          </div>
        )}
        {cart_products.length > 0 && (
          <form onSubmit={handleSubmit(submitHandler)}>
            {/* Hidden default for shippingOption since we default to Free */}
            <input type="hidden" {...register("shippingOption")} value="free_shipping" />

            <div className="row">
              {/* Left column: billing + payment + notes + coupons */}
              <div className="col-lg-8">
                <CheckoutLogin />
                <CheckoutSavedAddresses setValue={setValue} />
                <CheckoutBillingArea register={register} errors={errors} />

                <CheckoutPaymentMethods
                  selectedMethod={paymentMethod || 'cod'}
                  onMethodChange={setPaymentMethod}
                  bankDetails={bankDetails}
                />

                {/* Additional Information */}
                <div className="cl-checkout__card">
                  <h3 className="cl-checkout__section-title">{t("checkout.additionalInfo")}</h3>
                  <div className="cl-checkout__form-group">
                    <label className="cl-checkout__label">
                      {t("checkout.orderNotes")} <span className="optional">{t("checkout.optionalSuffix")}</span>
                    </label>
                    <textarea
                      {...register("orderNote", { required: false })}
                      name="orderNote"
                      id="orderNote"
                      className="cl-checkout__textarea"
                      placeholder={t("checkout.orderNotesPlaceholder")}
                    />
                  </div>
                </div>

                <CheckoutCoupon
                  handleCouponCode={handleCouponCode}
                  couponRef={couponRef}
                  couponApplyMsg={couponApplyMsg}
                />
                <CheckoutCouponSuggestions onApplyCoupon={handleApplySuggestedCoupon} />
              </div>

              {/* Right column: order summary (sticky sidebar) */}
              <div className="col-lg-4">
                <CheckoutOrderArea checkoutData={checkoutData} />
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default CheckoutArea;
