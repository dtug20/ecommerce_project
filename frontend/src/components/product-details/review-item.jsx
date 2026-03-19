import dayjs from "dayjs";
import Image from "next/image";
import React from "react";
import { Rating } from "react-simple-star-rating";

const ReviewItem = ({ review }) => {
  const { comment, createdAt, rating, userId, adminReply, isVerifiedPurchase } = review || {};
  return (
    <div className="tp-product-details-review-avater d-flex align-items-start mb-20">
      <div className="tp-product-details-review-avater-thumb">
        {!userId?.imageURL && <h5 className="review-name">{userId?.name?.[0]}</h5>}
        <a href="#">
          {userId?.imageURL && (
            <Image src={userId.imageURL} alt="user img" width={60} height={60} />
          )}
        </a>
      </div>
      <div className="tp-product-details-review-avater-content">
        <div className="tp-product-details-review-avater-rating d-flex align-items-center gap-2">
          <Rating allowFraction size={16} initialValue={rating} readonly={true} />
          {/* Verified Purchase badge */}
          {isVerifiedPurchase && (
            <span
              className="badge bg-success"
              style={{ fontSize: '10px', padding: '3px 7px', verticalAlign: 'middle' }}
            >
              Verified Purchase
            </span>
          )}
        </div>
        <h3 className="tp-product-details-review-avater-title">{userId?.name}</h3>
        <span className="tp-product-details-review-avater-meta">
          {dayjs(createdAt).format("MMMM D, YYYY")}
        </span>

        <div className="tp-product-details-review-avater-comment">
          <p>{comment}</p>
        </div>

        {/* Admin reply */}
        {adminReply?.text && (
          <div
            className="mt-10 p-3"
            style={{
              backgroundColor: '#f8f8f8',
              borderLeft: '3px solid #821F40',
              borderRadius: '0 4px 4px 0',
            }}
          >
            <p className="mb-5 fw-bold" style={{ fontSize: '13px', color: '#821F40' }}>
              Shofy Team
              {adminReply.repliedAt && (
                <span className="ms-2 fw-normal text-muted" style={{ fontSize: '12px' }}>
                  replied on {dayjs(adminReply.repliedAt).format("MMMM D, YYYY")}
                </span>
              )}
            </p>
            <p className="mb-0" style={{ fontSize: '13px' }}>{adminReply.text}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewItem;
