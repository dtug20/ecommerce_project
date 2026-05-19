import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGetCheckoutCouponsQuery } from '@/redux/features/cmsApi';
import useCurrency from '@/hooks/use-currency';
import dayjs from 'dayjs';

const CheckoutCouponSuggestions = ({ onApplyCoupon }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
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
      <p className="cl-checkout__coupon-suggestions-title">{t('coupon.availableCoupons')}</p>
      <div className="row g-2">
        {activeCoupons.map((coupon) => (
          <div key={coupon._id || coupon.couponCode} className="col-md-6">
            <div className="cl-checkout__coupon-card">
              <div className="coupon-info">
                <p className="coupon-code">{coupon.couponCode}</p>
                <p className="coupon-desc">
                  {coupon.discountPercentage}% {t('coupon.off')}
                  {coupon.minimumAmount > 0
                    ? ` ${t('coupon.onOrdersOver', { amount: formatPrice(coupon.minimumAmount) })}`
                    : ''}
                </p>
                {coupon.productType && (
                  <p className="coupon-meta">{t('coupon.appliesTo')}: {coupon.productType}</p>
                )}
                {coupon.endTime && (
                  <p className="coupon-meta">
                    {t('coupon.expires')}: {dayjs(coupon.endTime).format('MMM D, YYYY')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onApplyCoupon(coupon.couponCode)}
                className="coupon-apply-btn"
              >
                {t('coupon.apply')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutCouponSuggestions;
