import React, { useState } from 'react';
import ReviewForm from '../forms/review-form';
import ReviewItem from './review-item';
import ReviewRatingBreakdown from './review-rating-breakdown';
import { useGetProductReviewsQuery } from '@/redux/features/cmsApi';

const TABS = [
  { id: 'desc', label: 'DESCRIPTION' },
  { id: 'additional', label: 'ADDITIONAL INFORMATION' },
  { id: 'specification', label: 'SPECIFICATION' },
  { id: 'review', label: 'REVIEW' },
];

const DetailsTabNav = ({ product }) => {
  const { _id, description, additionalInformation, reviews: embeddedReviews } = product || {};
  const [activeTab, setActiveTab] = useState('desc');
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
  } = useGetProductReviewsQuery(
    { productId: _id, page, limit: LIMIT },
    { skip: !_id }
  );

  const reviews = reviewsData?.reviews || embeddedReviews || [];
  const totalReviews = reviewsData?.total ?? (embeddedReviews?.length || 0);
  const totalPages = reviewsData?.pages ?? 1;

  return (
    <div className="cl-pd__tabs">
      {/* Tab navigation */}
      <div className="cl-pd__tabs-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`cl-pd__tab-btn${activeTab === tab.id ? ' cl-pd__tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.id === 'review' ? `${tab.label} (${totalReviews})` : tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="cl-pd__tab-content">
        {/* Description */}
        {activeTab === 'desc' && (
          <div className="cl-pd__desc-3col">
            <div className="cl-pd__desc-section">
              <h4>Description</h4>
              <p>{description}</p>
            </div>
            <div className="cl-pd__desc-section">
              <h4>Feature</h4>
              <ul>
                <li><i className="fa-solid fa-shield-halved" /> Free 1 Year Warranty</li>
                <li><i className="fa-solid fa-truck-fast" /> Free Shipping &amp; Fasted Delivery</li>
                <li><i className="fa-solid fa-money-bill-wave" /> 100% Money-back guarantee</li>
                <li><i className="fa-solid fa-headset" /> 24/7 Customer support</li>
                <li><i className="fa-solid fa-credit-card" /> Secure payment method</li>
              </ul>
            </div>
            <div className="cl-pd__shipping-info">
              <h4>Shipping Information</h4>
              <p><strong>Courier:</strong> 2-4 days, free shipping</p>
              <p><strong>Local Shipping:</strong> up to one week, $19.00</p>
              <p><strong>UPS Ground Shipping:</strong> 4-6 days, $29.00</p>
              <p><strong>Unishop Global Export:</strong> 3-4 days, $39.00</p>
            </div>
          </div>
        )}

        {/* Additional Information */}
        {activeTab === 'additional' && (
          <div>
            {additionalInformation && additionalInformation.length > 0 ? (
              <table className="table">
                <tbody>
                  {additionalInformation.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, width: '30%' }}>{item.key}</td>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--cl-text-secondary)' }}>No additional information available.</p>
            )}
          </div>
        )}

        {/* Specification */}
        {activeTab === 'specification' && (
          <div>
            {additionalInformation && additionalInformation.length > 0 ? (
              <table className="table table-bordered">
                <tbody>
                  {additionalInformation.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, width: '30%', backgroundColor: 'var(--cl-bg-gray)' }}>{item.key}</td>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--cl-text-secondary)' }}>No specifications available.</p>
            )}
          </div>
        )}

        {/* Review */}
        {activeTab === 'review' && (
          <div className="row">
            <div className="col-lg-6">
              <ReviewRatingBreakdown reviews={reviews} />
              <div className="mt-4">
                <h5 style={{ fontWeight: 600, marginBottom: 16 }}>Rating &amp; Review</h5>

                {reviewsLoading && (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}

                {!reviewsLoading && reviews.length === 0 && (
                  <p style={{ color: 'var(--cl-text-secondary)' }}>There are no reviews yet.</p>
                )}

                {!reviewsLoading && reviews.length > 0 && reviews.map((item) => (
                  <ReviewItem key={item._id} review={item} />
                ))}

                {totalPages > 1 && (
                  <div className="d-flex gap-2 mt-3">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="cl-shop__page-btn cl-shop__page-btn--arrow"
                    >
                      <i className="fa-solid fa-chevron-left" />
                    </button>
                    <span className="d-flex align-items-center px-2" style={{ fontSize: 13 }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="cl-shop__page-btn cl-shop__page-btn--arrow"
                    >
                      <i className="fa-solid fa-chevron-right" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-6">
              <h5 style={{ fontWeight: 600, marginBottom: 16 }}>Review this product</h5>
              <p style={{ color: 'var(--cl-text-secondary)', fontSize: 13 }}>
                Your email address will not be published. Required fields are marked *
              </p>
              <ReviewForm product_id={_id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsTabNav;
