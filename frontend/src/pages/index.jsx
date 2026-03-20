import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import Header from "@/layout/headers/header";
import Footer from "@/layout/footers/footer";
import BlockRenderer from "@/components/cms/BlockRenderer";
import JsonLd from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/utils/structuredData";
// Keep all existing imports as fallback
import ElectronicCategory from "@/components/categories/electronic-category";
import HomeHeroSlider from "@/components/hero-banner/home-hero-slider";
import FeatureArea from "@/components/features/feature-area";
import ProductArea from "@/components/products/electronics/product-area";
import BannerArea from "@/components/banner/banner-area";
import OfferProducts from "@/components/products/electronics/offer-products";
import ProductGadgetArea from "@/components/products/electronics/product-gadget-area";
import ProductBanner from "@/components/products/electronics/product-banner";
import ProductSmArea from "@/components/products/electronics/product-sm-area";
import NewArrivals from "@/components/products/electronics/new-arrivals";
import BlogArea from "@/components/blog/electronic/blog-area";
import InstagramArea from "@/components/instagram/instagram-area";
import CtaArea from "@/components/cta/cta-area";

// Fallback layout when CMS data is not available
function FallbackHome() {
  return (
    <>
      <HomeHeroSlider />
      <ElectronicCategory />
      <FeatureArea />
      <ProductArea />
      <BannerArea />
      <OfferProducts />
      <ProductGadgetArea />
      <ProductBanner />
      <NewArrivals />
      <ProductSmArea />
      <BlogArea />
      <InstagramArea />
      <CtaArea />
    </>
  );
}

export default function Home({ page, settings }) {
  const hasCmsContent = page && page.blocks && page.blocks.length > 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <Wrapper>
      <SEO
        pageTitle={page?.seo?.metaTitle || settings?.siteName || "Home"}
        description={
          page?.seo?.metaDescription ||
          settings?.siteDescription ||
          "Shop electronics, fashion, beauty and more at Shofy"
        }
        url="/"
      />
      <JsonLd data={organizationJsonLd(siteUrl)} />
      <Header />
      {hasCmsContent ? (
        <BlockRenderer blocks={page.blocks} />
      ) : (
        <FallbackHome />
      )}
      <Footer />
    </Wrapper>
  );
}

export async function getServerSideProps() {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001';
  let page = null;
  let settings = null;

  try {
    const [pageRes, settingsRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/store/pages/home`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/v1/store/settings`).then((r) => (r.ok ? r.json() : null)),
    ]);
    page = pageRes?.data || null;
    settings = settingsRes?.data || null;
  } catch (err) {
    console.error('[Home SSR] Error fetching CMS data:', err.message);
  }

  return { props: { page, settings } };
}
