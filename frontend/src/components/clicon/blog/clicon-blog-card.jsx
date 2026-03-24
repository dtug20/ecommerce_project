import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const CliconBlogCard = ({ blog }) => {
  const { t } = useTranslation();
  const { img, author, date, comments, title, sm_desc, id } = blog || {};

  return (
    <article className="cl-blog-card" data-testid="cl-blog-card">
      <div className="cl-blog-card__image">
        <Link href={`/blog-details/${id}`} tabIndex={-1} aria-hidden="true">
          {img ? (
            <Image
              src={img}
              alt={title || t('blog.image_alt', 'Blog image')}
              width={400}
              height={250}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <div className="cl-blog-card__no-img" />
          )}
        </Link>
      </div>

      <div className="cl-blog-card__body">
        <div className="cl-blog-card__meta">
          {author && (
            <span className="cl-blog-card__meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {author}
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
          {typeof comments === 'number' && (
            <span className="cl-blog-card__meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {comments} {t('blog.comments', 'Comments')}
            </span>
          )}
        </div>

        <h3 className="cl-blog-card__title">
          <Link href={`/blog-details/${id}`}>{title}</Link>
        </h3>

        {sm_desc && (
          <p className="cl-blog-card__excerpt">{sm_desc}</p>
        )}

        <Link
          href={`/blog-details/${id}`}
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
