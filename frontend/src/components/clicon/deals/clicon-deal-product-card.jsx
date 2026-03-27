import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { StarRating, ProductBadgeAuto, PriceDisplay, ActionButtons } from '@/components/clicon/ui';

const CliconDealProductCard = ({ product }) => {
  const { t } = useTranslation();

  if (!product) return null;

  const { _id, title, img, imageURLs, price = 0, discount = 0, quantity = 0, reviews = [], featured, tags } = product;
  const productImage = img || imageURLs?.[0]?.img || null;

  return (
    <div className="cl-deal-card" data-testid={`clicon-deal-card-${_id}`}>
      {/* Image area */}
      <div className="cl-deal-card__image-wrap">
        <Link href={`/product-details/${_id}`} aria-label={title} tabIndex={-1}>
          {productImage ? (
            <Image
              src={productImage}
              alt={title}
              width={220}
              height={180}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              unoptimized
            />
          ) : (
            <div className="cl-deal-card__no-img" aria-label="No image available" />
          )}
        </Link>

        {/* Badge — top-left */}
        <div className="cl-deal-card__badge-wrap">
          <ProductBadgeAuto discount={discount} quantity={quantity} featured={featured} tags={tags} />
        </div>

        {/* Hover action buttons — right side */}
        <ActionButtons product={product} className="cl-deal-card__actions" />
      </div>

      {/* Body */}
      <div className="cl-deal-card__body">
        <StarRating reviews={reviews} />
        <h3 className="cl-deal-card__title">
          <Link href={`/product-details/${_id}`}>{title}</Link>
        </h3>
        <PriceDisplay price={price} discount={discount} size="sm" />
      </div>
    </div>
  );
};

export default CliconDealProductCard;
