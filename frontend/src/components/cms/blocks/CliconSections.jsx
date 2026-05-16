import CliconHeroArea from '@/components/clicon/hero/clicon-hero-area';
import CliconFeaturesBar from '@/components/clicon/features/clicon-features-bar';
import CliconBestDeals from '@/components/clicon/deals/clicon-best-deals';
import CliconCategoryShowcase from '@/components/clicon/categories/clicon-category-showcase';
import CliconFeaturedProducts from '@/components/clicon/products/clicon-featured-products';
import CliconDoubleBanner from '@/components/clicon/banners/clicon-double-banner';
import CliconProductSectionWithPromo from '@/components/clicon/products/clicon-product-section-with-promo';
import CliconFullWidthBanner from '@/components/clicon/banners/clicon-full-width-banner';
import CliconProductColumns from '@/components/clicon/products/clicon-product-columns';
import CliconBlogArea from '@/components/clicon/blog/clicon-blog-area';
import CliconNewsletter from '@/components/clicon/newsletter/clicon-newsletter';

export const CliconHeroBlock = () => <CliconHeroArea />;
export const CliconFeaturesBarBlock = () => <CliconFeaturesBar />;
export const CliconBestDealsBlock = () => <CliconBestDeals />;
export const CliconCategoryShowcaseBlock = () => <CliconCategoryShowcase />;
export const CliconFeaturedProductsBlock = () => <CliconFeaturedProducts />;
export const CliconDoubleBannerBlock = () => <CliconDoubleBanner />;
export const CliconFullBannerBlock = () => <CliconFullWidthBanner />;
export const CliconProductColumnsBlock = () => <CliconProductColumns />;
export const CliconBlogAreaBlock = () => <CliconBlogArea />;
export const CliconNewsletterBlock = () => <CliconNewsletter />;

export const CliconProductSectionPromoBlock = ({ settings = {}, title }) => (
  <CliconProductSectionWithPromo
    title={title || settings.title || 'Computer Accessories'}
    productType={settings.productType || 'electronics'}
    queryType={settings.queryType || 'new'}
  />
);
