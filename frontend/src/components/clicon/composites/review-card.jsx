import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { StarRating, ClAvatar, ClTag } from '@/components/clicon/ui';

/**
 * Review card — displays a user review with rating, comment, and optional admin reply.
 *
 * @param {Object} props
 * @param {Object} props.review - { comment, createdAt, rating, userId, adminReply, isVerifiedPurchase }
 * @param {string} [props.className]
 */
const ReviewCard = ({ review, className = '' }) => {
  const { t } = useTranslation();

  if (!review) return null;

  const { comment, createdAt, rating, userId, adminReply, isVerifiedPurchase } = review;

  return (
    <div className={`cl-review-card${className ? ` ${className}` : ''}`}>
      <div className="cl-review-card__header">
        <ClAvatar
          src={userId?.imageURL}
          name={userId?.name}
          size="md"
        />
        <div className="cl-review-card__meta">
          <div className="cl-review-card__top-row">
            <StarRating value={rating} size="sm" />
            {isVerifiedPurchase && (
              <ClTag
                label={t('product.verifiedPurchase', 'Verified Purchase')}
                variant="success"
              />
            )}
          </div>
          <h4 className="cl-review-card__author">{userId?.name}</h4>
          <span className="cl-review-card__date">
            {dayjs(createdAt).format('MMMM D, YYYY')}
          </span>
        </div>
      </div>

      <div className="cl-review-card__body">
        <p className="cl-review-card__comment">{comment}</p>
      </div>

      {/* Admin reply */}
      {adminReply?.text && (
        <div className="cl-review-card__reply">
          <p className="cl-review-card__reply-header">
            {t('product.storeTeam', 'Store Team')}
            {adminReply.repliedAt && (
              <span className="cl-review-card__reply-date">
                {t('product.repliedOn', 'replied on {{date}}', {
                  date: dayjs(adminReply.repliedAt).format('MMMM D, YYYY'),
                })}
              </span>
            )}
          </p>
          <p className="cl-review-card__reply-text">{adminReply.text}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
