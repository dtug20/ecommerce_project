import React,{useState} from "react";
import ErrorMsg from "../common/error-msg";
import { useGetOfferCouponsQuery } from "@/redux/features/coupon/couponApi";

const CouponArea = () => {
  const [copiedCode, setCopiedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopied = (code) => {
    setCopiedCode(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const { data: offerCoupons, isError, isLoading } = useGetOfferCouponsQuery();
  // decide what to render
  let content = null;

  if (isLoading) {
    content = <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }

  if (!isLoading && !isError && offerCoupons?.length === 0) {
    content = <ErrorMsg msg="No Coupons found!" />;
  }

  if (!isLoading && !isError && offerCoupons?.length > 0) {
    const coupon_items = offerCoupons;
    // const coupon_items = offerCoupons.slice(0, 2);
    content = coupon_items.map((coupon) => (
      <div key={coupon._id} className="col-xl-6 col-md-6 mb-30">
        <div className="tp-coupon-item d-flex align-items-center justify-content-between p-20 border rounded">
          <div>
            <h4 className="tp-coupon-title mb-5">{coupon.title || coupon.productType}</h4>
            <p className="mb-5">{coupon.discountPercentage}% off — min. ${coupon.minimumAmount}</p>
            <span className="tp-coupon-code fw-bold">{coupon.couponCode}</span>
          </div>
          <button
            type="button"
            className="tp-btn tp-btn-sm"
            onClick={() => handleCopied(coupon.couponCode)}
          >
            {copied && copiedCode === coupon.couponCode ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    ));
  }
  return (
    <>
      <div className="tp-coupon-area pb-120">
        <div className="container">
          <div className="row">{content}</div>
        </div>
      </div>
    </>
  );
};

export default CouponArea;
