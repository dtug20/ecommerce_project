import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import Wrapper from "@/layout/wrapper";
import ErrorMsg from "@/components/common/error-msg";
import ProductDetailsBreadcrumb from "@/components/breadcrumb/product-details-breadcrumb";
import ProductDetailsArea from "@/components/product-details/product-details-area";
import JsonLd from "@/components/seo/JsonLd";
import { productJsonLd, breadcrumbJsonLd } from "@/utils/structuredData";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7001";

const ProductDetailsPage = ({ product, relatedProducts, error }) => {
  const { t } = useTranslation();
  if (error || !product) {
    return (
      <Wrapper>
        <SEO pageTitle="Product Not Found" noindex />
        <HeaderClicon />
        <ErrorMsg msg="Product not found or could not be loaded." />
        <FooterClicon />
      </Wrapper>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    ...(product.category?.name
      ? [{ name: product.category.name, url: `/shop?category=${product.category.name}` }]
      : []),
    { name: product.title },
  ];

  return (
    <Wrapper>
      <SEO
        pageTitle={product.title}
        description={product.description?.substring(0, 160)}
        image={product.img}
        url={`/product-details/${product._id}`}
        type="product"
      />
      <JsonLd data={productJsonLd(product, siteUrl)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <HeaderClicon />
      <ProductDetailsBreadcrumb
        links={[
          { label: t('breadcrumb.home'), href: '/' },
          { label: t('breadcrumb.shopGrid'), href: '/shop' },
          ...(product.category?.name
            ? [{ label: product.category.name, href: `/shop?category=${product.category.name}` }]
            : []),
          { label: product.title },
        ]}
      />
      <ProductDetailsArea
        productItem={product}
        relatedProducts={relatedProducts}
      />
      <FooterClicon />
    </Wrapper>
  );
};

export default ProductDetailsPage;

export async function getStaticPaths() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/store/products?limit=50&sortBy=sellCount&sortOrder=desc`
    );
    const data = await res.json();
    const paths = (data.data || []).map((p) => ({
      params: { id: p._id },
    }));
    return { paths, fallback: "blocking" };
  } catch {
    return { paths: [], fallback: "blocking" };
  }
}

export async function getStaticProps({ params }) {
  try {
    const [productRes, relatedRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/store/products/${params.id}`),
      fetch(`${API_URL}/api/v1/store/products/${params.id}/related`).catch(
        () => null
      ),
    ]);

    if (!productRes.ok) return { notFound: true };

    const productData = await productRes.json();
    if (!productData.success || !productData.data) return { notFound: true };

    let relatedProducts = [];
    if (relatedRes && relatedRes.ok) {
      const relatedData = await relatedRes.json();
      relatedProducts = relatedData.data || [];
    }

    return {
      props: {
        product: productData.data,
        reviewStats: productData.reviewStats || {
          avgRating: 0,
          totalReviews: 0,
        },
        relatedProducts,
        error: null,
      },
      revalidate: 60,
    };
  } catch (err) {
    console.error("[ProductDetail ISR] Error:", err.message);
    return { notFound: true };
  }
}
