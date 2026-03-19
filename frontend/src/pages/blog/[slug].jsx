import React from "react";
import SEO from "@/components/seo";
import HeaderTwo from "@/layout/headers/header-2";
import Wrapper from "@/layout/wrapper";
import Footer from "@/layout/footers/footer";

export default function BlogPostPage({ post }) {
  if (!post) {
    return (
      <Wrapper>
        <SEO pageTitle="Blog Post Not Found" />
        <HeaderTwo style_2={true} />
        <div className="container pt-100 pb-100 text-center">
          <h3>Post not found</h3>
        </div>
        <Footer primary_style={true} />
      </Wrapper>
    );
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Wrapper>
      <SEO
        pageTitle={post.seo?.metaTitle || post.title}
        description={post.seo?.metaDescription || post.excerpt}
      />
      <HeaderTwo style_2={true} />
      <section className="tp-postbox-area pt-80 pb-80">
        <div className="container">
          <div className="row">
            <div className="col-xl-9 col-lg-8">
              <div className="tp-postbox-wrapper">
                {post.featuredImage && (
                  <div className="tp-postbox-thumb mb-30">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </div>
                )}
                <div className="tp-postbox-content">
                  <div className="tp-postbox-meta mb-15">
                    {post.author?.name && (
                      <span className="me-3">
                        <i className="fa-regular fa-user me-1"></i>
                        {post.author.name}
                      </span>
                    )}
                    {publishedDate && (
                      <span className="me-3">
                        <i className="fa-regular fa-calendar me-1"></i>
                        {publishedDate}
                      </span>
                    )}
                    {post.category && (
                      <span>
                        <i className="fa-regular fa-folder me-1"></i>
                        {post.category}
                      </span>
                    )}
                  </div>
                  <h3 className="tp-postbox-title mb-20">{post.title}</h3>
                  <div
                    className="tp-postbox-text"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                  {post.tags && post.tags.length > 0 && (
                    <div className="tp-postbox-tags mt-30">
                      <strong>Tags: </strong>
                      {post.tags.map((tag, i) => (
                        <span key={i} className="badge bg-light text-dark me-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer primary_style={true} />
    </Wrapper>
  );
}

export async function getServerSideProps({ params }) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001';
  let post = null;

  try {
    const res = await fetch(`${API_URL}/api/v1/store/blog/${params.slug}`);
    if (res.ok) {
      const data = await res.json();
      post = data.data || null;
    }
  } catch (err) {
    console.error('[BlogPost SSR] Error:', err.message);
  }

  if (!post) {
    return { notFound: true };
  }

  return { props: { post } };
}
