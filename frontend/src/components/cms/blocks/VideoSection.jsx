import React from 'react';

/**
 * Video Section block — embeds a YouTube or Vimeo video.
 * CRM settings: { title, videoUrl, thumbnail }
 *
 * Supports:
 *   YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
 *   Vimeo:   https://vimeo.com/ID
 */
const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  // Known embed URL patterns only
  if (/^https:\/\/www\.youtube\.com\/embed\/[\w-]+/.test(url)) return url;
  if (/^https:\/\/player\.vimeo\.com\/video\/\d+/.test(url)) return url;
  return null;
};

const VideoSection = ({ settings = {}, title }) => {
  const heading = title || settings.title || '';
  const embedUrl = getEmbedUrl(settings.videoUrl);

  if (!embedUrl) return null;

  return (
    <section className="cl-video-section pt-60 pb-60">
      <div className="container">
        {heading && (
          <div className="cl-section-header text-center mb-40">
            <h2 className="cl-section-header__title">{heading}</h2>
          </div>
        )}
        <div className="cl-video-section__wrapper">
          <iframe
            src={embedUrl}
            title={heading || 'Video'}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
