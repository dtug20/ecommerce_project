import React from 'react';

// Block component imports
import HeroSlider from './blocks/HeroSlider';
import FeaturedProducts from './blocks/FeaturedProducts';
import CategoryShowcase from './blocks/CategoryShowcase';
import BannerGrid from './blocks/BannerGrid';
import TextBlock from './blocks/TextBlock';
import ProductCarousel from './blocks/ProductCarousel';
import Newsletter from './blocks/Newsletter';

const BLOCK_MAP = {
  'hero-slider': HeroSlider,
  'featured-products': FeaturedProducts,
  'category-showcase': CategoryShowcase,
  'banner-grid': BannerGrid,
  'text-block': TextBlock,
  'product-carousel': ProductCarousel,
  'newsletter': Newsletter,
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
