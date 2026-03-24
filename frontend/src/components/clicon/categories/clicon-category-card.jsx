import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * CliconCategoryCard
 * Props:
 *   category — object with shape { _id, parent (name), img, products[] }
 */
const CliconCategoryCard = ({ category }) => {
  if (!category) return null;

  const { parent, img, products } = category;

  const slug = parent
    ? parent.toLowerCase().replace(/&/g, '').trim().split(/\s+/).join('-')
    : '';

  const productCount = products?.length || 0;

  return (
    <Link
      href={`/shop?category=${slug}`}
      className="cl-category-card"
      data-testid={`clicon-category-card-${slug}`}
    >
      <div className="cl-category-card__image-wrap">
        {img ? (
          <Image
            src={img}
            alt={parent}
            width={120}
            height={120}
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            unoptimized
          />
        ) : (
          <div className="cl-category-card__no-img" aria-label="No category image" />
        )}
      </div>
      <div className="cl-category-card__body">
        <h3 className="cl-category-card__name">{parent}</h3>
        {productCount > 0 && (
          <p className="cl-category-card__count">
            {productCount} {productCount === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
    </Link>
  );
};

export default CliconCategoryCard;
