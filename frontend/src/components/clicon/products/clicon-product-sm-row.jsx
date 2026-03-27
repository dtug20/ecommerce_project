import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PriceDisplay } from '@/components/clicon/ui';

const CliconProductSmRow = ({ product }) => {
  const { t } = useTranslation();
  const { _id, img, title, price, discount } = product || {};

  return (
    <Link
      href={`/product-details/${_id}`}
      className="cl-product-sm-row"
      data-testid="cl-product-sm-row"
    >
      <div className="cl-product-sm-row__image">
        {img ? (
          <Image
            src={img}
            alt={title || t('product.image_alt', 'Product image')}
            width={60}
            height={60}
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        ) : (
          <div className="cl-product-sm-row__placeholder" />
        )}
      </div>
      <div className="cl-product-sm-row__info">
        <p className="cl-product-sm-row__title">{title}</p>
        <PriceDisplay price={price} discount={discount} size="sm" />
      </div>
    </Link>
  );
};

export default CliconProductSmRow;
