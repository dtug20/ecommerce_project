import React, { useRef, useEffect, useState } from 'react';
import ReviewForm from '../forms/review-form';
import ReviewItem from './review-item';
import ReviewRatingBreakdown from './review-rating-breakdown';
import { useGetProductReviewsQuery } from '@/redux/features/cmsApi';

const DetailsTabNav = ({ product }) => {
  const { _id, description, additionalInformation, reviews: embeddedReviews } = product || {};
  const activeRef = useRef(null);
  const marker = useRef(null);

  // Pagination state for server-side reviews
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // Try to load reviews from the server-side endpoint (Task 16.1)
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
  } = useGetProductReviewsQuery(
    { productId: _id, page, limit: LIMIT },
    { skip: !_id }
  );

  // Use server reviews if available, fall back to embedded reviews array
  const reviews = reviewsData?.reviews || embeddedReviews || [];
  const totalReviews = reviewsData?.total ?? (embeddedReviews?.length || 0);
  const totalPages = reviewsData?.pages ?? 1;

  // handleActive
  const handleActive = (e) => {
    if (e.target.classList.contains('active')) {
      marker.current.style.left = e.target.offsetLeft + "px";
      marker.current.style.width = e.target.offsetWidth + "px";
    }
  };

  useEffect(() => {
    if (activeRef.current?.classList.contains('active')) {
      marker.current.style.left = activeRef.current.offsetLeft + 'px';
      marker.current.style.width = activeRef.current.offsetWidth + 'px';
    }
  }, []);

  // nav item
  function NavItem({ active = false, id, title, linkRef }) {
    return (
      <button
        ref={linkRef}
        className={`nav-link ${active ? "active" : ""}`}
        id={`nav-${id}-tab`}
        data-bs-toggle="tab"
        data-bs-target={`#nav-${id}`}
        type="button"
        role="tab"
        aria-controls={`nav-${id}`}
        aria-selected={active ? "true" : "false"}
        tabIndex="-1"
        onClick={e => handleActive(e)}
      >
        {title}
      </button>
    );
  }

  return (
    <>
      <div className="tp-product-details-tab-nav tp-tab">
        <nav>
          <div className="nav nav-tabs justify-content-center p-relative tp-product-tab" id="navPresentationTab" role="tablist">
            <NavItem active={true} linkRef={activeRef} id="desc" title="Description" />
            <NavItem id="additional" title="Additional information" />
            <NavItem id="review" title={`Reviews (${totalReviews})`} />

            <span ref={marker} id="productTabMarker" className="tp-product-details-tab-line"></span>
          </div>
        </nav>
        <div className="tab-content" id="navPresentationTabContent">
          {/* nav-desc */}
          <div className="tab-pane fade show active" id="nav-desc" role="tabpanel" aria-labelledby="nav-desc-tab" tabIndex="-1">
            <div className="tp-product-details-desc-wrapper pt-60">
              <div className="row">
                <div className="col-xl-12">
                  <div className="tp-product-details-desc-item">
                    <div className="row align-items-center">
                      <div className="col-lg-12">
                        <div className="tp-product-details-desc-content">
                          <p>{description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* addInfo */}
          <div className="tab-pane fade" id="nav-additional" role="tabpanel" aria-labelledby="nav-additional-tab" tabIndex="-1">
            <div className="tp-product-details-additional-info">
              <div className="row justify-content-center">
                <div className="col-xl-10">
                  <table>
                    <tbody>
                      {additionalInformation?.map((item, i) => (
                        <tr key={i}>
                          <td>{item.key}</td>
                          <td>{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          {/* review */}
          <div className="tab-pane fade" id="nav-review" role="tabpanel" aria-labelledby="nav-review-tab" tabIndex="-1">
            <div className="tp-product-details-review-wrapper pt-60">
              <div className="row">
                <div className="col-lg-6">
                  <div className="tp-product-details-review-statics">
                    {/* Rating breakdown bar chart */}
                    <ReviewRatingBreakdown reviews={reviews} />

                    {/* reviews list */}
                    <div className="tp-product-details-review-list pr-110">
                      <h3 className="tp-product-details-review-title">Rating & Review</h3>

                      {reviewsLoading && (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}

                      {!reviewsLoading && reviews.length === 0 && (
                        <p className="text-muted">There are no reviews yet.</p>
                      )}

                      {!reviewsLoading && reviews.length > 0 && reviews.map((item) => (
                        <ReviewItem key={item._id} review={item} />
                      ))}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex gap-2 mt-20">
                          <button
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="tp-btn tp-btn-2"
                            style={{ fontSize: '13px', padding: '6px 14px' }}
                          >
                            Previous
                          </button>
                          <span className="d-flex align-items-center px-2" style={{ fontSize: '13px' }}>
                            Page {page} of {totalPages}
                          </span>
                          <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="tp-btn tp-btn-2"
                            style={{ fontSize: '13px', padding: '6px 14px' }}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="tp-product-details-review-form">
                    <h3 className="tp-product-details-review-form-title">Review this product</h3>
                    <p>Your email address will not be published. Required fields are marked *</p>
                    {/* form start */}
                    <ReviewForm product_id={_id} />
                    {/* form end */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailsTabNav;
