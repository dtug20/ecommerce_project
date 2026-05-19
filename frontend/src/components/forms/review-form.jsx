import React, { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Rating } from "react-simple-star-rating";
import * as Yup from "yup";
import Link from "next/link";
// internal
import ErrorMsg from "../common/error-msg";
import { useAddReviewMutation } from "@/redux/features/reviewApi";
import { notifyError } from "@/utils/toast";

// schema
const schema = Yup.object().shape({
  name: Yup.string().required().label("Name"),
  email: Yup.string().required().email().label("Email"),
  comment: Yup.string().required().label("Comment"),
});

const ReviewForm = ({ product_id }) => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [addReview, { isLoading }] = useAddReviewMutation();

  // Catch Rating value
  const handleRating = (rate) => {
    setRating(rate);
  };

  // react hook form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // If user is not logged in, show a prompt to sign in
  if (!user) {
    return (
      <div className="tp-product-details-review-form">
        <p className="text-muted">
          {t('review.loginPrompt')}{' '}
          <Link href="/login" style={{ color: '#821F40', textDecoration: 'underline' }}>
            {t('review.signInLink')}
          </Link>{' '}
          {t('review.loginPromptSuffix')}
        </p>
      </div>
    );
  }

  // Post-submit confirmation
  if (submitted) {
    return (
      <div
        className="p-3"
        style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px' }}
      >
        <p className="mb-0 fw-bold" style={{ color: '#15803d' }}>
          {t('review.pendingTitle')}
        </p>
        <p className="mb-0 mt-5" style={{ fontSize: '13px', color: '#555' }}>
          {t('review.moderationNotice')}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          style={{
            marginTop: '10px',
            background: 'none',
            border: 'none',
            color: '#821F40',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            fontSize: '13px',
          }}
        >
          {t('review.writeAnother')}
        </button>
      </div>
    );
  }

  // on submit
  const onSubmit = (data) => {
    addReview({
      userId: user?._id,
      productId: product_id,
      rating: rating,
      comment: data.comment,
    }).then((result) => {
      if (result?.error) {
        notifyError(result?.error?.data?.message);
      } else {
        setSubmitted(true);
        reset();
        setRating(0);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="tp-product-details-review-form-rating d-flex align-items-center">
        <p>{t('review.yourRating')}</p>
        <div className="tp-product-details-review-form-rating-icon d-flex align-items-center">
          <Rating onClick={handleRating} allowFraction size={16} initialValue={rating} />
        </div>
      </div>
      <div className="tp-product-details-review-input-wrapper">
        <div className="tp-product-details-review-input-box">
          <div className="tp-product-details-review-input">
            <textarea
              {...register("comment", { required: `Comment is required!` })}
              id="comment"
              name="comment"
              placeholder={t('review.writePlaceholder')}
            />
          </div>
          <div className="tp-product-details-review-input-title">
            <label htmlFor="comment">{t('review.yourReview')}</label>
          </div>
          <ErrorMsg msg={errors.comment?.message} />
        </div>
        <div className="tp-product-details-review-input-box">
          <div className="tp-product-details-review-input">
            <input
              {...register("name", { required: `Name is required!` })}
              name="name"
              id="name"
              type="text"
              placeholder={t('review.yourName')}
              defaultValue={user?.name || ''}
            />
          </div>
          <div className="tp-product-details-review-input-title">
            <label htmlFor="name">{t('review.yourName')}</label>
          </div>
          <ErrorMsg msg={errors.name?.message} />
        </div>
        <div className="tp-product-details-review-input-box">
          <div className="tp-product-details-review-input">
            <input
              {...register("email", { required: `Email is required!` })}
              name="email"
              id="email"
              type="email"
              placeholder="your@email.com"
              defaultValue={user?.email || ''}
            />
          </div>
          <div className="tp-product-details-review-input-title">
            <label htmlFor="email">{t('review.yourEmail')}</label>
          </div>
          <ErrorMsg msg={errors.email?.message} />
        </div>
      </div>
      <div className="tp-product-details-review-btn-wrapper">
        <button
          type="submit"
          disabled={isLoading}
          className="tp-product-details-review-btn"
        >
          {isLoading ? t('review.submitting') : t('review.submit')}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
