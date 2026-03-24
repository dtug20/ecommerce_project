import { useState } from "react";
import { useSelector } from "react-redux";

const CheckoutCoupon = ({ handleCouponCode, couponRef, couponApplyMsg }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { coupon_info } = useSelector((state) => state.coupon);

  return (
    <div className="cl-checkout__coupon">
      <p className="cl-checkout__coupon-toggle">
        Have a coupon?{" "}
        <button onClick={() => setIsOpen(!isOpen)} type="button">
          Click here to enter your code
        </button>
      </p>

      {isOpen && (
        <form onSubmit={handleCouponCode} className="cl-checkout__coupon-form">
          <input
            ref={couponRef}
            type="text"
            placeholder="Enter coupon code"
          />
          <button type="submit" className="cl-checkout__coupon-btn">
            Apply
          </button>
        </form>
      )}
      {couponApplyMsg && (
        <p className="cl-checkout__coupon-msg">{couponApplyMsg}</p>
      )}
    </div>
  );
};

export default CheckoutCoupon;
