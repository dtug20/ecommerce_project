import React from "react";
// internal
import SEO from "@/components/seo";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import Wrapper from "@/layout/wrapper";
import ErrorMsg from "@/components/common/error-msg";
import ProductDetailsBreadcrumb from "@/components/breadcrumb/product-details-breadcrumb";
import ProductDetailsArea from "@/components/product-details/product-details-area";
import JsonLd from "@/components/seo/JsonLd";
import { productJsonLd, breadcrumbJsonLd } from "@/utils/structuredData";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7001";

const ProductDetailsPage = ({ product, relatedProducts, error }) => {
  if (error || !product) {
    return (
      <Wrapper>
        <SEO pageTitle="Product Not Found" noindex />
        <HeaderTwo style_2={true} />
        <ErrorMsg msg="Product not found or could not be loaded." />
        <Footer primary_style={true} />
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
      <HeaderTwo style_2={true} />
      <ProductDetailsBreadcrumb
        category={product.category?.name || ""}
        title={product.title}
      />
      <ProductDetailsArea
        productItem={product}
        relatedProducts={relatedProducts}
      />
      <Footer primary_style={true} />
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
