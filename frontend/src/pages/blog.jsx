import React, { useState } from "react";
import SEO from "@/components/seo";
import HeaderTwo from "@/layout/headers/header-2";
import Wrapper from "@/layout/wrapper";
import Footer from "@/layout/footers/footer";
import BlogBreadcrumb from "@/components/breadcrumb/blog-breadcrumb";
import BlogPostboxArea from "@/components/blog/blog-postox/blog-postbox-area";
import Link from "next/link";
import { useRouter } from "next/router";

// CMS-driven blog post item
const CmsBlogItem = ({ post }) => {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="tp-postbox-item format-image mb-50 transition-3">
      {post.featuredImage && (
        <div className="tp-postbox-thumb w-img">
          <Link href={`/blog/${post.slug}`}>
            <img
              src={post.featuredImage}
              alt={post.title}
              style={{ width: '100%', borderRadius: '4px' }}
            />
          </Link>
        </div>
      )}
      <div className="tp-postbox-content">
        <div className="tp-postbox-meta">
          {publishedDate && (
            <span>
              <i className="far fa-calendar-check"></i> {publishedDate}
            </span>
          )}
          {post.author?.name && (
            <span>
              <i className="far fa-user"></i> {post.author.name}
            </span>
          )}
          {post.category && (
            <span>
              <i className="fal fa-folder"></i> {post.category}
            </span>
          )}
        </div>
        <h3 className="tp-postbox-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && (
          <div className="tp-postbox-text">
            <p>{post.excerpt}</p>
          </div>
        )}
        <div className="tp-postbox-read-more">
          <Link href={`/blog/${post.slug}`} className="tp-btn">
            Read More
          </Link>
        </div>
      </div>
    </article>
  );
};

// Pagination component for CMS blog
const CmsPagination = ({ pagination, currentPage }) => {
  const router = useRouter();
  if (!pagination || pagination.totalPages <= 1) return null;

  const goToPage = (page) => {
    router.push({ pathname: '/blog', query: { page } });
  };

  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  return (
    <div className="tp-blog-pagination mt-50">
      <div className="tp-pagination">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Prev
              </button>
            </li>
            {pages.map((page) => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button className="page-link" onClick={() => goToPage(page)}>
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

const BlogPostBoxPage = ({ posts, pagination, currentPage }) => {
  const hasCmsPosts = Array.isArray(posts) && posts.length > 0;

  return (
    <Wrapper>
      <SEO pageTitle="Blog" />
      <HeaderTwo style_2={true} />
      <BlogBreadcrumb />
      {hasCmsPosts ? (
        <section className="tp-postbox-area pt-120 pb-120">
          <div className="container">
            <div className="row">
              <div className="col-xl-9 col-lg-8">
                <div className="tp-postbox-wrapper pr-50">
                  {posts.map((post) => (
                    <CmsBlogItem key={post._id || post.slug} post={post} />
                  ))}
                  <CmsPagination pagination={pagination} currentPage={currentPage} />
                </div>
              </div>
              <div className="col-xl-3 col-lg-4">
                {/* Sidebar placeholder — can be hydrated with CMS sidebar data */}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <BlogPostboxArea />
      )}
      <Footer primary_style={true} />
    </Wrapper>
  );
};

export default BlogPostBoxPage;

export async function getServerSideProps({ query }) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001';
  const page = parseInt(query.page) || 1;
  let posts = [];
  let pagination = null;

  try {
    const res = await fetch(`${API_URL}/api/v1/store/blog?page=${page}&limit=9`);
    if (res.ok) {
      const data = await res.json();
      posts = data.data || [];
      pagination = data.pagination || null;
    }
  } catch (err) {
    console.error('[Blog SSR] Error:', err.message);
  }

  return { props: { posts, pagination, currentPage: page } };
}
