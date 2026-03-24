import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetOfferProductsQuery,
  useGetProductTypeQuery,
  useGetTopRatedProductsQuery,
} from '@/redux/features/productApi';
import CliconProductSmRow from './clicon-product-sm-row';
import ErrorMsg from '@/components/common/error-msg';

const ColumnSkeleton = () => (
  <div className="cl-product-columns__col">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="cl-product-columns__skeleton" />
    ))}
  </div>
);

const ProductColumn = ({ title, products, isLoading, isError, t }) => {
  let content = null;
  if (isLoading) {
    content = <ColumnSkeleton />;
  } else if (isError) {
    content = <ErrorMsg msg={t('error.products', 'Could not load products.')} />;
  } else if (!products || products.length === 0) {
    content = <p className="cl-product-columns__empty">{t('products.empty', 'No products.')}</p>;
  } else {
    content = products.map((p) => (
      <CliconProductSmRow key={p._id} product={p} />
    ));
  }

  return (
    <div className="col-xl-3 col-lg-6 col-md-6">
      <div className="cl-product-columns__col" data-testid={`cl-column-${title}`}>
        <h3 className="cl-product-columns__heading">{title}</h3>
        <div className="cl-product-columns__list">{content}</div>
      </div>
    </div>
  );
};

const CliconProductColumns = () => {
  const { t } = useTranslation();

  const {
    data: offerData,
    isLoading: offerLoading,
    isError: offerError,
  } = useGetOfferProductsQuery('electronics');

  const {
    data: bestData,
    isLoading: bestLoading,
    isError: bestError,
  } = useGetProductTypeQuery({
    type: 'electronics',
    query: 'topSellers=true&limit=3',
  });

  const {
    data: topRatedData,
    isLoading: topRatedLoading,
    isError: topRatedError,
  } = useGetTopRatedProductsQuery();

  const {
    data: newData,
    isLoading: newLoading,
    isError: newError,
  } = useGetProductTypeQuery({
    type: 'electronics',
    query: 'new=true&limit=3',
  });

  const flashSale = offerData?.data?.slice(0, 3) || [];
  const bestSellers = bestData?.data?.slice(0, 3) || [];
  const topRated = topRatedData?.data?.slice(0, 3) || [];
  const newArrivals = newData?.data?.slice(0, 3) || [];

  return (
    <section className="cl-product-columns" data-testid="cl-product-columns">
      <div className="container">
        <div className="row g-4">
          <ProductColumn
            title={t('columns.flash_sale', 'Flash Sale Today')}
            products={flashSale}
            isLoading={offerLoading}
            isError={offerError}
            t={t}
          />
          <ProductColumn
            title={t('columns.best_sellers', 'Best Sellers')}
            products={bestSellers}
            isLoading={bestLoading}
            isError={bestError}
            t={t}
          />
          <ProductColumn
            title={t('columns.top_rated', 'Top Rated')}
            products={topRated}
            isLoading={topRatedLoading}
            isError={topRatedError}
            t={t}
          />
          <ProductColumn
            title={t('columns.new_arrival', 'New Arrival')}
            products={newArrivals}
            isLoading={newLoading}
            isError={newError}
            t={t}
          />
        </div>
      </div>
    </section>
  );
};

export default CliconProductColumns;
