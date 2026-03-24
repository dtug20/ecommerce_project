import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

/**
 * ClichonHeroPromoCard — reusable promo card for the hero sidebar area.
 * Props:
 *   title     {string}  — product name
 *   subtitle  {string}  — product subtitle/category line
 *   price     {number}  — display price
 *   link      {string}  — href destination
 *   bgColor   {string}  — card background color (CSS color)
 *   textColor {string}  — text color override (CSS color, defaults to heading var)
 *   image     {string}  — absolute URL or local import for product image
 */
const CliconHeroPromoCard = ({
  title,
  subtitle,
  price,
  link = '/shop',
  bgColor = '#EAF4FB',
  textColor,
  image,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="cl-hero-promo-card"
      style={{ backgroundColor: bgColor }}
      data-testid="clicon-hero-promo-card"
    >
      <div className="cl-hero-promo-card__body">
        <p className="cl-hero-promo-card__subtitle" style={textColor ? { color: textColor } : undefined}>
          {subtitle}
        </p>
        <h3 className="cl-hero-promo-card__title" style={textColor ? { color: textColor } : undefined}>
          {title}
        </h3>
        {price != null && (
          <p className="cl-hero-promo-card__price">
            <span className="cl-hero-promo-card__price-label">From </span>
            <span className="cl-hero-promo-card__price-value">${price}</span>
          </p>
        )}
        <Link
          href={link}
          className="cl-hero-promo-card__link"
          data-testid="clicon-hero-promo-card-link"
        >
          {t('hero.shopNow')} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </Link>
      </div>
      {image && (
        <div className="cl-hero-promo-card__image">
          <Image
            src={image}
            alt={title}
            width={140}
            height={130}
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default CliconHeroPromoCard;
