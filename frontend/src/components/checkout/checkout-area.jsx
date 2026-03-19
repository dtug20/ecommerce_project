import React, { useRef } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
// internal
import CheckoutBillingArea from "./checkout-billing-area";
import CheckoutCoupon from "./checkout-coupon";
import CheckoutLogin from "./checkout-login";
import CheckoutOrderArea from "./checkout-order-area";
import CheckoutSavedAddresses from "./checkout-saved-addresses";
import CheckoutCouponSuggestions from "./checkout-coupon-suggestions";
import useCheckoutSubmit from "@/hooks/use-checkout-submit";

const CheckoutArea = () => {
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
  } = checkoutData;
  const { cart_products } = useSelector((state) => state.cart);

  // Allow coupon suggestions to auto-apply a coupon code
  const handleApplySuggestedCoupon = (code) => {
    if (couponRef?.current) {
      couponRef.current.value = code;
      // Trigger the coupon code handler programmatically
      handleCouponCode({ preventDefault: () => {} });
    }
  };

  return (
    <>
      <section
        className="tp-checkout-area pb-120"
        style={{ backgroundColor: "#EFF1F5" }}
      >
        <div className="container">
          {cart_products.length === 0 && (
            <div className="text-center pt-50">
              <h3 className="py-2">No items found in cart to checkout</h3>
              <Link href="/shop" className="tp-checkout-btn">
                Return to shop
              </Link>
            </div>
          )}
          {cart_products.length > 0 && (
            <div className="row">
              <div className="col-xl-7 col-lg-7">
                <div className="tp-checkout-verify">
                  <CheckoutLogin />
                  {/* Saved Addresses (authenticated users) */}
                  <CheckoutSavedAddresses setValue={setValue} />
                  <CheckoutCoupon
                    handleCouponCode={handleCouponCode}
                    couponRef={couponRef}
                    couponApplyMsg={couponApplyMsg}
                  />
                  {/* Available coupon suggestions */}
                  <CheckoutCouponSuggestions onApplyCoupon={handleApplySuggestedCoupon} />
                </div>
              </div>
              <form onSubmit={handleSubmit(submitHandler)}>
                <div className="row">
                  <div className="col-lg-7">
                    <CheckoutBillingArea register={register} errors={errors} />
                  </div>
                  <div className="col-lg-5">
                    <CheckoutOrderArea checkoutData={checkoutData} />
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CheckoutArea;
