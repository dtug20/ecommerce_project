import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import BlockRenderer from "@/components/cms/BlockRenderer";
import JsonLd from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/utils/structuredData";
// Clicon homepage sections
import CliconHeroArea from "@/components/clicon/hero/clicon-hero-area";
import CliconFeaturesBar from "@/components/clicon/features/clicon-features-bar";
import CliconBestDeals from "@/components/clicon/deals/clicon-best-deals";
import CliconCategoryShowcase from "@/components/clicon/categories/clicon-category-showcase";
import CliconFeaturedProducts from "@/components/clicon/products/clicon-featured-products";
import CliconDoubleBanner from "@/components/clicon/banners/clicon-double-banner";
import CliconProductSectionWithPromo from "@/components/clicon/products/clicon-product-section-with-promo";
import CliconFullWidthBanner from "@/components/clicon/banners/clicon-full-width-banner";
import CliconProductColumns from "@/components/clicon/products/clicon-product-columns";
import CliconBlogArea from "@/components/clicon/blog/clicon-blog-area";
import CliconNewsletter from "@/components/clicon/newsletter/clicon-newsletter";

// Clicon fallback layout
function FallbackHomeClicon() {
  return (
    <>
      <CliconHeroArea />
      <CliconFeaturesBar />
      <CliconBestDeals />
      <CliconCategoryShowcase />
      <CliconFeaturedProducts />
      <CliconDoubleBanner />
      <CliconProductSectionWithPromo title="Computer Accessories" productType="electronics" queryType="new" />
      <CliconFullWidthBanner />
      <CliconProductColumns />
      <CliconBlogArea />
      <CliconNewsletter />
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
      <HeaderClicon />
      {hasCmsContent ? (
        <BlockRenderer blocks={page.blocks} />
      ) : (
        <FallbackHomeClicon />
      )}
      <FooterClicon />
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
