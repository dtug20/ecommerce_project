import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
// internal
import ErrorMsg from '../common/error-msg';
import { useGetShowCategoryQuery } from '@/redux/features/categoryApi';
import HomeCateLoader from '../loader/home/home-cate-loader';

const ElectronicCategory = () => {
  const { data: categories, isLoading, isError } = useGetShowCategoryQuery();
  const router = useRouter()

  // handle category route
  const handleCategoryRoute = (title) => {
    router.push(`/shop?category=${title.toLowerCase().replace("&", "").split(" ").join("-")}`)
  }
  // decide what to render
  let content = null;

  if (isLoading) {
    content = (
      <HomeCateLoader loading={isLoading} />
    );
  }
  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }
  if (!isLoading && !isError && categories?.result?.length === 0) {
    content = <ErrorMsg msg="No Category found!" />;
  }
  if (!isLoading && !isError && categories?.result?.length > 0) {
    const category_items = categories.result;
    content = category_items.map((item) => {
      const categorySlug = item.parent.toLowerCase().replace("&", "").split(" ").join("-");
      return (
        <div className="col" key={item._id}>
          <div className="tp-product-category-item text-center mb-40">
            <div className="tp-product-category-thumb fix">
              <Link href={`/shop?category=${categorySlug}`}>
                {item.img ? (
                  <Image src={item.img} alt={item.parent} width={76} height={98} />
                ) : (
                  <div style={{ width: 76, height: 98, background: 'var(--tp-gray-100)', borderRadius: 'var(--tp-radius-md)' }} />
                )}
              </Link>
            </div>
            <div className="tp-product-category-content">
              <h3 className="tp-product-category-title">
                <Link href={`/shop?category=${categorySlug}`}>
                  {item.parent}
                </Link>
              </h3>
              <p>{item.products?.length || 0} {item.products?.length === 1 ? 'Product' : 'Products'}</p>
            </div>
          </div>
        </div>
      );
    })
  }
  return (
    <section className="tp-product-category pt-60 pb-15">
      <div className="container">
        <div className="row row-cols-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6">
          {content}
        </div>
      </div>
    </section>
  );
};

export default ElectronicCategory;