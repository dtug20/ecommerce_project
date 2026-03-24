import React from 'react';
import { useGetCheckoutCouponsQuery } from '@/redux/features/cmsApi';
import dayjs from 'dayjs';

const CheckoutCouponSuggestions = ({ onApplyCoupon }) => {
  const { data, isLoading, isError } = useGetCheckoutCouponsQuery();

  const raw = data?.data ?? data?.coupons ?? data;
  const coupons = Array.isArray(raw) ? raw : [];
  const now = dayjs();

  const activeCoupons = coupons.filter((c) => {
    const notExpired = !c.endTime || now.isBefore(dayjs(c.endTime));
    const started = !c.startTime || now.isAfter(dayjs(c.startTime));
    return notExpired && started && c.status !== 'inactive';
  });

  if (isLoading || isError || activeCoupons.length === 0) return null;

  return (
    <div className="cl-checkout__coupon-suggestions">
      <p className="cl-checkout__coupon-suggestions-title">Available Coupons</p>
      <div className="row g-2">
        {activeCoupons.map((coupon) => (
          <div key={coupon._id || coupon.couponCode} className="col-md-6">
            <div className="cl-checkout__coupon-card">
              <div className="coupon-info">
                <p className="coupon-code">{coupon.couponCode}</p>
                <p className="coupon-desc">
                  {coupon.discountPercentage}% off
                  {coupon.minimumAmount > 0
                    ? ` on orders over $${coupon.minimumAmount}`
                    : ''}
                </p>
                {coupon.productType && (
                  <p className="coupon-meta">On: {coupon.productType}</p>
                )}
                {coupon.endTime && (
                  <p className="coupon-meta">
                    Expires: {dayjs(coupon.endTime).format('MMM D, YYYY')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onApplyCoupon(coupon.couponCode)}
                className="coupon-apply-btn"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutCouponSuggestions;
