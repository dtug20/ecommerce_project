import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

const FILTER_KEYS = ['category', 'brand', 'tag', 'minPrice', 'maxPrice', 'search', 'color'];

const ShopActiveFilters = ({ totalProducts = 0 }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const query = router.query;

  const FILTER_LABELS = {
    category: t('shop.filterCategory'),
    brand: t('shop.filterBrand'),
    tag: t('shop.filterTag'),
    minPrice: t('shop.filterMinPrice'),
    maxPrice: t('shop.filterMaxPrice'),
    search: t('shop.filterSearch'),
    color: t('shop.filterColor'),
  };

  // Collect active filters from query params
  const activeFilters = [];
  FILTER_KEYS.forEach((key) => {
    if (query[key]) {
      activeFilters.push({ key, label: `${query[key]}` });
    }
  });

  const handleRemoveFilter = (key) => {
    const newQuery = { ...query };
    delete newQuery[key];
    // Also remove related price params together
    if (key === 'minPrice') delete newQuery.maxPrice;
    if (key === 'maxPrice') delete newQuery.minPrice;
    newQuery.page = 1;
    router.push({ pathname: '/shop', query: newQuery }, undefined, { shallow: true });
  };

  if (activeFilters.length === 0 && totalProducts === 0) return null;

  return (
    <div className="cl-shop__active-filters">
      <div className="cl-shop__active-filters-left">
        {activeFilters.length > 0 && <span>{t('shop.activeFilters')}</span>}
        {activeFilters.map((f) => (
          <span key={f.key} className="cl-shop__active-filter-chip">
            {f.label}
            <button type="button" onClick={() => handleRemoveFilter(f.key)} aria-label={`${t('common.delete')} ${FILTER_LABELS[f.key]}`}>
              &times;
            </button>
          </span>
        ))}
      </div>
      {totalProducts > 0 && (
        <div className="cl-shop__result-count">
          {t('shop.resultsFound', { count: totalProducts.toLocaleString() })}
        </div>
      )}
    </div>
  );
};

export default ShopActiveFilters;
