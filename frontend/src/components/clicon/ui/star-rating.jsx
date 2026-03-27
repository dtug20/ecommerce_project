import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Reusable star rating display component.
 *
 * @param {Object} props
 * @param {number} [props.value] - Rating 0–5 (supports decimals, rounded to nearest int for display)
 * @param {number} [props.max=5] - Maximum stars
 * @param {'sm'|'md'} [props.size='sm'] - sm = 12px stars, md = 16px stars
 * @param {boolean} [props.interactive=false] - Clickable for submitting reviews
 * @param {number} [props.count] - Review count to display as "(N)"
 * @param {function} [props.onChange] - Callback when interactive star is clicked
 * @param {Array} [props.reviews] - Legacy: array of { rating } objects — computes value/count automatically
 * @param {string} [props.className] - Additional CSS class
 */
const StarRating = ({
  value: valueProp,
  max = 5,
  size = 'sm',
  interactive = false,
  count: countProp,
  onChange,
  reviews,
  className = '',
}) => {
  const { t } = useTranslation();

  // Support legacy `reviews` array prop
  let value = valueProp;
  let count = countProp;
  if (reviews && typeof valueProp === 'undefined') {
    count = reviews.length;
    value =
      count > 0
        ? Math.round(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count)
        : 0;
  }

  value = value || 0;
  const filledStars = Math.round(Math.min(value, max));

  const handleClick = (starIndex) => {
    if (interactive && onChange) {
      onChange(starIndex + 1);
    }
  };

  const ariaLabel = t('product.ratingLabel', '{{value}} out of {{max}} stars', {
    value: filledStars,
    max,
  });

  return (
    <div
      className={`cl-star-rating cl-star-rating--${size}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      role={interactive ? 'radiogroup' : undefined}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`cl-star${i < filledStars ? '' : ' cl-star--empty'}`}
          aria-hidden="true"
          onClick={interactive ? () => handleClick(i) : undefined}
          role={interactive ? 'radio' : undefined}
          aria-checked={interactive ? i < filledStars : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(i);
                  }
                }
              : undefined
          }
          style={interactive ? { cursor: 'pointer' } : undefined}
        >
          &#9733;
        </span>
      ))}
      {typeof count === 'number' && count > 0 && (
        <span className="cl-rating-count">({count})</span>
      )}
    </div>
  );
};

export default StarRating;
