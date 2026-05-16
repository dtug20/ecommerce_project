import React from 'react';

// Block component imports — implemented
import HeroSlider from './blocks/HeroSlider';
import FeaturedProducts from './blocks/FeaturedProducts';
import CategoryShowcase from './blocks/CategoryShowcase';
import BannerGrid from './blocks/BannerGrid';
import TextBlock from './blocks/TextBlock';
import ProductCarousel from './blocks/ProductCarousel';
import Newsletter from './blocks/Newsletter';

// Block component imports — Phase 2
import PromoSection from './blocks/PromoSection';
import Testimonials from './blocks/Testimonials';
import CustomHtml from './blocks/CustomHtml';
import BrandShowcase from './blocks/BrandShowcase';
import CountdownDeal from './blocks/CountdownDeal';
import ImageGallery from './blocks/ImageGallery';
import VideoSection from './blocks/VideoSection';

// Clicon hardcoded-section wrappers (pixel-parity with FallbackHomeClicon)
import {
  CliconHeroBlock,
  CliconFeaturesBarBlock,
  CliconBestDealsBlock,
  CliconCategoryShowcaseBlock,
  CliconFeaturedProductsBlock,
  CliconDoubleBannerBlock,
  CliconProductSectionPromoBlock,
  CliconFullBannerBlock,
  CliconProductColumnsBlock,
  CliconBlogAreaBlock,
  CliconNewsletterBlock,
} from './blocks/CliconSections';

const BLOCK_MAP = {
  'hero-slider': HeroSlider,
  'featured-products': FeaturedProducts,
  'category-showcase': CategoryShowcase,
  'banner-grid': BannerGrid,
  'text-block': TextBlock,
  'product-carousel': ProductCarousel,
  'newsletter': Newsletter,
  'promo-section': PromoSection,
  'testimonials': Testimonials,
  'custom-html': CustomHtml,
  'brand-showcase': BrandShowcase,
  'countdown-deal': CountdownDeal,
  'image-gallery': ImageGallery,
  'video-section': VideoSection,
  // Clicon section wrappers — render the existing hardcoded Clicon components 1:1
  'clicon-hero': CliconHeroBlock,
  'clicon-features-bar': CliconFeaturesBarBlock,
  'clicon-best-deals': CliconBestDealsBlock,
  'clicon-category-showcase': CliconCategoryShowcaseBlock,
  'clicon-featured-products': CliconFeaturedProductsBlock,
  'clicon-double-banner': CliconDoubleBannerBlock,
  'clicon-product-section-promo': CliconProductSectionPromoBlock,
  'clicon-full-banner': CliconFullBannerBlock,
  'clicon-product-columns': CliconProductColumnsBlock,
  'clicon-blog-area': CliconBlogAreaBlock,
  'clicon-newsletter': CliconNewsletterBlock,
};

const BlockRenderer = ({ blocks = [] }) => {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <>
      {sortedBlocks.map((block) => {
        if (!block.isVisible) return null;
        const Component = BLOCK_MAP[block.blockType];
        if (!Component) return null;
        return (
          <Component
            key={block._id || block.order}
            settings={block.settings || {}}
            title={block.title}
            subtitle={block.subtitle}
          />
        );
      })}
    </>
  );
};

export default BlockRenderer;
