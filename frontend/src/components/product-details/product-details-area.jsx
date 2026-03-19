import React, { useState, useEffect } from "react";
import DetailsThumbWrapper from "./details-thumb-wrapper";
import DetailsWrapper from "./details-wrapper";
import { useDispatch } from "react-redux";
import DetailsTabNav from "./details-tab-nav";
import RelatedProducts from "./related-products";
import ProductVariantSelector from "./product-variant-selector";

const ProductDetailsArea = ({ productItem }) => {
  const { _id, img, imageURLs, videoId, status, variants } = productItem || {};
  const [activeImg, setActiveImg] = useState(img);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const dispatch = useDispatch();

  // Active image change when img changes
  useEffect(() => {
    setActiveImg(img);
  }, [img]);

  // When a variant with an image is selected, update the displayed image
  const handleVariantSelected = (variant) => {
    setSelectedVariant(variant);
    if (variant?.image) {
      setActiveImg(variant.image);
    } else if (!variant) {
      setActiveImg(img);
    }
  };

  // Handle image active from thumbnail strip
  const handleImageActive = (item) => {
    setActiveImg(item.img);
  };

  const hasVariants = variants && variants.length > 0;

  return (
    <section className="tp-product-details-area">
      <div className="tp-product-details-top pb-115">
        <div className="container">
          <div className="row">
            <div className="col-xl-7 col-lg-6">
              {/* product-details-thumb-wrapper start */}
              <DetailsThumbWrapper
                activeImg={activeImg}
                handleImageActive={handleImageActive}
                imageURLs={imageURLs}
                imgWidth={580}
                imgHeight={670}
                videoId={videoId}
                status={status}
              />
              {/* product-details-thumb-wrapper end */}
            </div>
            <div className="col-xl-5 col-lg-6">
              {/* Variant selector (shown above DetailsWrapper when product has variants) */}
              {hasVariants && (
                <div className="mb-20">
                  <ProductVariantSelector
                    variants={variants}
                    onVariantSelected={handleVariantSelected}
                  />
                </div>
              )}
              {/* product-details-wrapper start */}
              <DetailsWrapper
                productItem={productItem}
                handleImageActive={handleImageActive}
                activeImg={activeImg}
                detailsBottom={true}
                selectedVariant={selectedVariant}
              />
              {/* product-details-wrapper end */}
            </div>
          </div>
        </div>
      </div>

      {/* product details description */}
      <div className="tp-product-details-bottom pb-140">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              <DetailsTabNav product={productItem} />
            </div>
          </div>
        </div>
      </div>
      {/* product details description */}

      {/* related products start */}
      <section className="tp-related-product pt-95 pb-50">
        <div className="container">
          <div className="row">
            <div className="tp-section-title-wrapper-6 text-center mb-40">
              <span className="tp-section-title-pre-6">Next day Products</span>
              <h3 className="tp-section-title-6">Related Products</h3>
            </div>
          </div>
          <div className="row">
            <RelatedProducts id={_id} />
          </div>
        </div>
      </section>
      {/* related products end */}
    </section>
  );
};

export default ProductDetailsArea;
