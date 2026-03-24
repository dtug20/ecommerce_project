import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import blogData from '@/data/blog-data';
import CliconBlogCard from './clicon-blog-card';

const CliconBlogArea = () => {
  const { t } = useTranslation();
  // Use the first 3 electronics blog entries
  const blogs = blogData.filter((b) => b.blog === 'electronics').slice(0, 3);

  return (
    <section className="cl-blog-area" data-testid="cl-blog-area">
      <div className="container">
        <div className="cl-blog-area__header">
          <h2 className="cl-blog-area__title">
            {t('blog.section_title', 'Latest News & Articles')}
          </h2>
          <p className="cl-blog-area__subtitle">
            {t(
              'blog.section_subtitle',
              'Stay up to date with the latest in tech and electronics'
            )}
          </p>
        </div>

        <div className="row g-4">
          {blogs.map((blog) => (
            <div key={blog.id} className="col-xl-4 col-md-6">
              <CliconBlogCard blog={blog} />
            </div>
          ))}
        </div>

        <div className="cl-blog-area__footer">
          <Link
            href="/blog"
            className="cl-blog-area__view-all"
            data-testid="cl-blog-view-all"
          >
            {t('blog.view_all', 'View All Articles')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CliconBlogArea;
