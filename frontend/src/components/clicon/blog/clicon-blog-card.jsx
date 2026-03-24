import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const CliconBlogCard = ({ blog }) => {
  const { t } = useTranslation();

  // Support both API shape (BlogPost model) and legacy blog-data.js shape
  const title = blog?.title;
  const slug = blog?.slug;
  const image = blog?.featuredImage || blog?.img;
  const authorName = blog?.author?.name || blog?.author;
  const date = blog?.publishedAt
    ? dayjs(blog.publishedAt).format('DD MMMM, YYYY')
    : blog?.date;
  const excerpt = blog?.excerpt || blog?.sm_desc;
  const views = blog?.views;

  const href = slug ? `/blog/${slug}` : `/blog-details/${blog?.id}`;

  return (
    <article className="cl-blog-card" data-testid="cl-blog-card">
      <div className="cl-blog-card__image">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          {image ? (
            <Image
              src={image}
              alt={title || t('blog.image_alt', 'Blog image')}
              width={400}
              height={250}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              unoptimized
            />
          ) : (
            <div className="cl-blog-card__no-img" />
          )}
        </Link>
      </div>

      <div className="cl-blog-card__body">
        <div className="cl-blog-card__meta">
          {authorName && (
            <span className="cl-blog-card__meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {authorName}
            </span>
          )}
          {date && (
            <span className="cl-blog-card__meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {date}
            </span>
          )}
          {typeof views === 'number' && (
            <span className="cl-blog-card__meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {views}
            </span>
          )}
        </div>

        <h3 className="cl-blog-card__title">
          <Link href={href}>{title}</Link>
        </h3>

        {excerpt && (
          <p className="cl-blog-card__excerpt">{excerpt}</p>
        )}

        <Link
          href={href}
          className="cl-blog-card__readmore"
          data-testid="cl-blog-card-readmore"
        >
          {t('blog.read_more', 'READ MORE')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
};

export default CliconBlogCard;
