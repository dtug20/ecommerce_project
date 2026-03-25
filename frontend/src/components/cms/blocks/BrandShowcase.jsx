import React from 'react';
import Link from 'next/link';
import { useGetActiveBrandsQuery } from '@/redux/features/brandApi';

/**
 * Brand Showcase block — logo grid from live brand API.
 * CRM settings: { title, limit }
 */
const BrandShowcase = ({ settings = {}, title }) => {
  const heading = title || settings.title || 'Our Brands';
  const limit = settings.limit || 8;

  const { data } = useGetActiveBrandsQuery();
  const brands = (data?.brands || data?.result || []).slice(0, limit);

  if (brands.length === 0) return null;

  return (
    <section className="cl-brand-showcase pt-60 pb-60">
      <div className="container">
        {heading && (
          <div className="cl-section-header text-center mb-40">
            <h2 className="cl-section-header__title">{heading}</h2>
          </div>
        )}
        <div className="cl-brand-showcase__grid">
          {brands.map((brand) => (
            <Link
              key={brand._id}
              href={`/shop?brand=${brand._id}`}
              className="cl-brand-showcase__item"
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} width={120} height={60} />
              ) : (
                <span className="cl-brand-showcase__name">{brand.name}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcase;
