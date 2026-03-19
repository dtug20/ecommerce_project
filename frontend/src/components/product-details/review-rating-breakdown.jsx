import React from 'react';

/**
 * Shows a Bootstrap progress-bar breakdown of star ratings.
 * reviews: array of { rating: number }
 */
const ReviewRatingBreakdown = ({ reviews = [] }) => {
  if (reviews.length === 0) return null;

  const total = reviews.length;
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / total;

  // Count per star level (5 down to 1)
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <div className="tp-product-details-review-breakdown mb-30">
      <div className="d-flex align-items-center mb-15 gap-3">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: '700', lineHeight: 1, color: '#821F40' }}>
            {avgRating.toFixed(1)}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>out of 5</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{total} review{total !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ flex: 1 }}>
          {counts.map(({ star, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="d-flex align-items-center gap-2 mb-5">
                <span style={{ fontSize: '12px', minWidth: '14px', textAlign: 'right' }}>
                  {star}
                </span>
                <span style={{ fontSize: '11px', color: '#f5a623' }}>&#9733;</span>
                <div
                  className="progress flex-grow-1"
                  style={{ height: '8px', borderRadius: '4px' }}
                >
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: '#821F40',
                      borderRadius: '4px',
                    }}
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span style={{ fontSize: '12px', minWidth: '28px', color: '#888' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewRatingBreakdown;
