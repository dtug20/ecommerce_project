import Image from "next/image";
import { useState, useRef } from "react";
import PopupVideo from "../common/popup-video";

const DetailsThumbWrapper = ({
  imageURLs,
  handleImageActive,
  activeImg,
  imgWidth = 580,
  imgHeight = 580,
  videoId = false,
  status
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const thumbsRef = useRef(null);

  const scrollThumbs = (direction) => {
    if (thumbsRef.current) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      thumbsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="cl-pd__gallery">
        {/* Main image */}
        <div className="cl-pd__gallery-main">
          <Image
            src={activeImg}
            alt="product img"
            width={imgWidth}
            height={imgHeight}
            style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
            unoptimized
          />
          {status === 'out-of-stock' && (
            <div className="cl-pd__gallery-badge">
              <span className="cl-badge cl-badge--soldout">Out of Stock</span>
            </div>
          )}
          {videoId && (
            <button
              type="button"
              className="cl-pd__gallery-video-btn"
              onClick={() => setIsVideoOpen(true)}
              aria-label="Play video"
            >
              <i className="fas fa-play" />
            </button>
          )}
        </div>

        {/* Horizontal thumbnail strip */}
        {imageURLs && imageURLs.length > 0 && (
          <div className="cl-pd__gallery-thumbs">
            <button
              type="button"
              className="cl-pd__gallery-arrow"
              onClick={() => scrollThumbs('left')}
              aria-label="Previous thumbnails"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <div className="cl-pd__gallery-thumbs-list" ref={thumbsRef}>
              {imageURLs.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className={`cl-pd__gallery-thumb${item.img === activeImg ? ' cl-pd__gallery-thumb--active' : ''}`}
                  onClick={() => handleImageActive(item)}
                >
                  <Image
                    src={item.img}
                    alt={`thumbnail ${i + 1}`}
                    width={80}
                    height={80}
                    style={{ objectFit: 'contain' }}
                    unoptimized
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              className="cl-pd__gallery-arrow"
              onClick={() => scrollThumbs('right')}
              aria-label="Next thumbnails"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        )}
      </div>

      {videoId && (
        <PopupVideo
          isVideoOpen={isVideoOpen}
          setIsVideoOpen={setIsVideoOpen}
          videoId={videoId}
        />
      )}
    </>
  );
};

export default DetailsThumbWrapper;
