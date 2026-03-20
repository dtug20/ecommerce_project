import Link from 'next/link';
import dayjs from 'dayjs';
// internal
import SEO from '@/components/seo';
import Wrapper from '@/layout/wrapper';
import Header from '@/layout/headers/header';
import Footer from '@/layout/footers/footer';

/**
 * Vendor store page — server-rendered storefront for a single vendor.
 * Route: /vendor/[slug]
 */
const VendorStorePage = ({ vendor, products, pagination }) => {
  const memberSince = vendor?.createdAt
    ? dayjs(vendor.createdAt).format('MMMM YYYY')
    : null;

  const storeName = vendor?.vendorProfile?.storeName || vendor?.name || 'Vendor Store';
  const storeBio = vendor?.vendorProfile?.storeBio || vendor?.vendorProfile?.storeDescription || '';
  const storeSlug = vendor?.vendorProfile?.storeSlug || '';
  const storeLogo = vendor?.vendorProfile?.storeLogo || null;
  const storeBanner = vendor?.vendorProfile?.storeBanner || null;
  const productCount = pagination?.total ?? products?.length ?? 0;

  return (
    <Wrapper>
      <SEO pageTitle={`${storeName} — Shofy Marketplace`} />
      <Header />

      <main>
        {/* Vendor banner */}
        <div
          className="tp-vendor-banner p-relative"
          style={{
            height: '200px',
            background: storeBanner
              ? `url(${storeBanner}) center/cover no-repeat`
              : 'linear-gradient(135deg, #821F40 0%, #3d0f1e 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Gradient overlay when there is a banner image */}
          {storeBanner && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)',
              }}
            />
          )}
        </div>

        {/* Vendor info row */}
        <div className="container">
          <div
            className="tp-vendor-info d-flex align-items-end gap-4 pb-30"
            style={{ marginTop: '-40px', position: 'relative', zIndex: 1 }}
          >
            {/* Store logo */}
            <div
              className="tp-vendor-logo flex-shrink-0"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #fff',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {storeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storeLogo}
                  alt={storeName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#821F40',
                    textTransform: 'uppercase',
                  }}
                >
                  {storeName.charAt(0)}
                </span>
              )}
            </div>

            {/* Store details */}
            <div className="tp-vendor-details pt-40">
              <h2 className="mb-0" style={{ fontSize: '24px', fontWeight: 700 }}>
                {storeName}
              </h2>
              {storeBio && (
                <p className="text-muted mb-0" style={{ fontSize: '14px', maxWidth: '600px' }}>
                  {storeBio}
                </p>
              )}
              <div className="d-flex gap-3 mt-1" style={{ fontSize: '13px', color: '#666' }}>
                <span>
                  <strong>{productCount}</strong> {productCount === 1 ? 'Product' : 'Products'}
                </span>
                {memberSince && (
                  <>
                    <span>|</span>
                    <span>Member since {memberSince}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products section */}
        <section className="tp-vendor-products pb-120">
          <div className="container">
            <h3
              className="mb-30"
              style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '10px' }}
            >
              Products by {storeName}
            </h3>

            {products && products.length > 0 ? (
              <div className="row">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="col-xl-3 col-lg-4 col-sm-6 col-12 mb-30"
                  >
                    <div className="tp-product-item transition-3">
                      <div className="tp-product-thumb p-relative fix">
                        <Link href={`/product-details/${product._id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.img}
                            alt={product.title}
                            style={{
                              width: '100%',
                              height: '220px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                            }}
                          />
                        </Link>
                        {product.status === 'out-of-stock' && (
                          <div className="tp-product-badge">
                            <span className="product-hot">out-stock</span>
                          </div>
                        )}
                      </div>
                      <div className="tp-product-content pt-15">
                        {product.category?.name && (
                          <div className="tp-product-category">
                            <span style={{ fontSize: '12px', color: '#821F40' }}>
                              {product.category.name}
                            </span>
                          </div>
                        )}
                        <h3 className="tp-product-title" style={{ fontSize: '14px' }}>
                          <Link href={`/product-details/${product._id}`}>
                            {product.title}
                          </Link>
                        </h3>
                        <div className="tp-product-price-wrapper">
                          {product.discount > 0 ? (
                            <>
                              <span className="tp-product-price old-price">
                                ${product.price}
                              </span>
                              <span className="tp-product-price new-price">
                                {' '}$
                                {(
                                  Number(product.price) -
                                  (Number(product.price) * Number(product.discount)) / 100
                                ).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="tp-product-price new-price">
                              ${parseFloat(product.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-60">
                <p className="text-muted">This vendor has no products listed yet.</p>
                <Link href="/shop" className="tp-btn mt-3">
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer primary_style={true} />
    </Wrapper>
  );
};

export async function getServerSideProps({ params }) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001';
  try {
    const [vendorRes, productsRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/store/vendors/${params.slug}`),
      fetch(`${API_URL}/api/v1/store/products?vendor=${params.slug}&page=1&limit=20`),
    ]);

    const vendorData = await vendorRes.json();
    const productsData = await productsRes.json();

    if (!vendorData.success) {
      return { notFound: true };
    }

    return {
      props: {
        vendor: vendorData.data,
        products: productsData.data || [],
        pagination: productsData.pagination || null,
      },
    };
  } catch (error) {
    return { notFound: true };
  }
}

export default VendorStorePage;
