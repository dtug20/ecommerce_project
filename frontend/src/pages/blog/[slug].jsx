import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import CliconBlogDetail from "@/components/clicon/blog/clicon-blog-detail";
import JsonLd from "@/components/seo/JsonLd";
import { articleJsonLd } from "@/utils/structuredData";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7001";

export default function BlogPostPage({ post, latestPosts = [] }) {
  const { t } = useTranslation();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  if (!post) {
    return (
      <Wrapper>
        <SEO pageTitle="Blog Post Not Found" noindex />
        <HeaderClicon />
        <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
          <h3>{t("error.message", "The page you are looking for does not exist.")}</h3>
        </div>
        <FooterClicon />
      </Wrapper>
    );
  }

  const breadcrumbLinks = [
    { label: t("breadcrumb.home"), href: "/" },
    { label: t("breadcrumb.pages") },
    { label: t("blog.title"), href: "/blog" },
    { label: post.title?.length > 40 ? post.title.substring(0, 40) + "…" : post.title },
  ];

  return (
    <Wrapper>
      <SEO
        pageTitle={post.seo?.metaTitle || post.title}
        description={post.seo?.metaDescription || post.excerpt}
        image={post.featuredImage}
        url={`/blog/${post.slug}`}
        type="article"
      />
      <JsonLd data={articleJsonLd(post, siteUrl)} />
      <HeaderClicon />
      <ShopBreadcrumb links={breadcrumbLinks} />
      <CliconBlogDetail post={post} latestPosts={latestPosts} />
      <FooterClicon />
    </Wrapper>
  );
}

export async function getStaticPaths() {
  try {
    const res = await fetch(`${API_URL}/api/v1/store/blog?limit=30`);
    const data = await res.json();
    const paths = (data.data || []).map((p) => ({ params: { slug: p.slug } }));
    return { paths, fallback: "blocking" };
  } catch {
    return { paths: [], fallback: "blocking" };
  }
}

export async function getStaticProps({ params }) {
  try {
    const [postRes, latestRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/store/blog/${params.slug}`),
      fetch(`${API_URL}/api/v1/store/blog?limit=6`),
    ]);

    if (!postRes.ok) return { notFound: true };

    const postData = await postRes.json();
    if (!postData.success || !postData.data) return { notFound: true };

    const latestData = latestRes.ok ? await latestRes.json() : { data: [] };

    return {
      props: {
        post: postData.data,
        latestPosts: latestData.data || [],
      },
      revalidate: 3600,
    };
  } catch (err) {
    console.error("[BlogPost ISR] Error:", err.message);
    return { notFound: true };
  }
}
