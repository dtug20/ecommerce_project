import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
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

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7001";

async function safeFetch(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function getServerSideProps() {
  const [bannersRes, categoriesRes, featuredRes, blogRes, settingsRes] =
    await Promise.all([
      safeFetch(`${API}/api/v1/store/banners?location=hero&limit=5`),
      safeFetch(`${API}/api/v1/store/categories/tree`),
      safeFetch(`${API}/api/v1/store/products?featured=true&limit=8`),
      safeFetch(`${API}/api/v1/store/blog?limit=3`),
      safeFetch(`${API}/api/v1/store/settings`),
    ]);

  return {
    props: {
      banners: bannersRes?.data ?? [],
      categories: categoriesRes?.data ?? [],
      featured: featuredRes?.data ?? [],
      blog: blogRes?.data ?? [],
      settings: settingsRes?.data ?? null,
    },
  };
}

export default function Home({ settings }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <Wrapper>
      <SEO
        pageTitle={settings?.siteName || "Home"}
        description={
          settings?.siteDescription ||
          "Shop electronics, fashion, beauty and more at Shofy"
        }
        url="/"
      />
      <JsonLd data={organizationJsonLd(siteUrl)} />
      <HeaderClicon />
      <main>
        <CliconHeroArea />
        <CliconFeaturesBar />
        <CliconBestDeals />
        <CliconCategoryShowcase />
        <CliconFeaturedProducts />
        <CliconDoubleBanner />
        <CliconProductSectionWithPromo
          title="Computer Accessories"
          productType="electronics"
          queryType="new"
        />
        <CliconFullWidthBanner />
        <CliconProductColumns />
        <CliconBlogArea />
        <CliconNewsletter />
      </main>
      <FooterClicon />
    </Wrapper>
  );
}
