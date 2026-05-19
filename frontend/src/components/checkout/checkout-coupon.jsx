import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

const CheckoutCoupon = ({ handleCouponCode, couponRef, couponApplyMsg }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { coupon_info } = useSelector((state) => state.coupon);

  return (
    <div className="cl-checkout__coupon">
      <p className="cl-checkout__coupon-toggle">
        {t("checkout.haveCoupon")}{" "}
        <button onClick={() => setIsOpen(!isOpen)} type="button">
          {t("checkout.clickHereToEnterCode")}
        </button>
      </p>

      {isOpen && (
        <form onSubmit={handleCouponCode} className="cl-checkout__coupon-form">
          <input
            ref={couponRef}
            type="text"
            placeholder={t("checkout.couponPlaceholder")}
          />
          <button type="submit" className="cl-checkout__coupon-btn">
            {t("coupon.apply")}
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
