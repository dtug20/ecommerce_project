import React from 'react';
import { useGetCheckoutCouponsQuery } from '@/redux/features/cmsApi';
import dayjs from 'dayjs';

/**
 * Shows available coupons with "Apply" buttons in the checkout page.
 * onApplyCoupon(code) is called when the user clicks Apply on a coupon card.
 */
const CheckoutCouponSuggestions = ({ onApplyCoupon }) => {
  const { data, isLoading, isError } = useGetCheckoutCouponsQuery();

  const coupons = data?.coupons || data || [];
  const now = dayjs();

  // Filter to active, non-expired coupons only
  const activeCoupons = coupons.filter((c) => {
    const notExpired = !c.endTime || now.isBefore(dayjs(c.endTime));
    const started = !c.startTime || now.isAfter(dayjs(c.startTime));
    return notExpired && started && c.status !== 'inactive';
  });

  if (isLoading || isError || activeCoupons.length === 0) return null;

  return (
    <div className="tp-checkout-verify-item mb-20">
      <p className="tp-checkout-verify-reveal-btn">
        <span>Available Coupons</span>
      </p>
      <div className="tp-checkout-coupon">
        <div className="row g-2">
          {activeCoupons.map((coupon) => (
            <div key={coupon._id || coupon.couponCode} className="col-md-6">
              <div
                style={{
                  padding: '10px 14px',
                  border: '1px dashed #821F40',
                  borderRadius: '6px',
                  backgroundColor: '#fff5f7',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p className="mb-0 fw-bold" style={{ fontSize: '13px', color: '#821F40' }}>
                    {coupon.couponCode}
                  </p>
                  <p className="mb-0" style={{ fontSize: '12px', color: '#555' }}>
                    {coupon.discountPercentage}% off
                    {coupon.minimumAmount > 0 ? ` on orders over $${coupon.minimumAmount}` : ''}
                  </p>
                  {coupon.productType && (
                    <p className="mb-0" style={{ fontSize: '11px', color: '#888' }}>
                      On: {coupon.productType}
                    </p>
                  )}
                  {coupon.endTime && (
                    <p className="mb-0" style={{ fontSize: '11px', color: '#888' }}>
                      Expires: {dayjs(coupon.endTime).format('MMM D, YYYY')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onApplyCoupon(coupon.couponCode)}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: '#821F40',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckoutCouponSuggestions;
