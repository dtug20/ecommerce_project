import React, { useState, useEffect } from "react";
import DetailsThumbWrapper from "./details-thumb-wrapper";
import DetailsWrapper from "./details-wrapper";
import DetailsTabNav from "./details-tab-nav";
import RelatedProducts from "./related-products";

const ProductDetailsArea = ({ productItem, relatedProducts }) => {
  const { _id, img, imageURLs, videoId, status, variants } = productItem || {};
  const [activeImg, setActiveImg] = useState(img);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    setActiveImg(img);
  }, [img]);

  const handleVariantSelected = (variant) => {
    setSelectedVariant(variant);
    if (variant?.image) {
      setActiveImg(variant.image);
    } else if (!variant) {
      setActiveImg(img);
    }
  };

  const handleImageActive = (item) => {
    setActiveImg(item.img);
  };

  return (
    <section className="cl-pd">
      {/* Product top area */}
      <div className="container">
        <div className="row" style={{ paddingBottom: 'var(--cl-spacing-3xl)' }}>
          <div className="col-xl-6 col-lg-6">
            <DetailsThumbWrapper
              activeImg={activeImg}
              handleImageActive={handleImageActive}
              imageURLs={imageURLs}
              imgWidth={580}
              imgHeight={580}
              videoId={videoId}
              status={status}
            />
          </div>
          <div className="col-xl-6 col-lg-6">
            <DetailsWrapper
              productItem={productItem}
              handleImageActive={handleImageActive}
              activeImg={activeImg}
              detailsBottom={false}
              selectedVariant={selectedVariant}
              variants={variants || []}
              onVariantSelected={handleVariantSelected}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container">
        <DetailsTabNav product={productItem} />
      </div>

      {/* Related products */}
      <RelatedProducts id={_id} relatedProducts={relatedProducts} />
    </section>
  );
};

export default ProductDetailsArea;
