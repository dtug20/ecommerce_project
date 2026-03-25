import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import CliconBlogListingArea from "@/components/clicon/blog/clicon-blog-listing-area";

const BlogPage = ({ posts, pagination, currentPage, latestPosts, query }) => {
  const { t } = useTranslation();

  const breadcrumbLinks = [
    { label: t("breadcrumb.home"), href: "/" },
    { label: t("breadcrumb.pages") },
    { label: t("blog.title") },
  ];

  return (
    <Wrapper>
      <SEO
        pageTitle={t("blog.title")}
        description={t("blog.section_subtitle")}
        url="/blog"
      />
      <HeaderClicon />
      <ShopBreadcrumb links={breadcrumbLinks} />
      <CliconBlogListingArea
        posts={posts}
        pagination={pagination}
        currentPage={currentPage}
        latestPosts={latestPosts}
        initialQuery={query}
      />
      <FooterClicon />
    </Wrapper>
  );
};

export default BlogPage;

export async function getServerSideProps({ query }) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7001";
  const page = parseInt(query.page) || 1;
  const category = query.category || "";
  const search = query.search || "";
  const sort = query.sort || "newest";
  const tag = query.tag || "";

  const params = new URLSearchParams({ page, limit: 9 });
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  if (tag) params.set("tag", tag);
  if (sort === "oldest") params.set("sort", "publishedAt");
  else if (sort === "newest") params.set("sort", "-publishedAt");

  let posts = [];
  let pagination = null;
  let latestPosts = [];

  try {
    const [postsRes, latestRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/store/blog?${params}`),
      fetch(`${API_URL}/api/v1/store/blog?limit=6`),
    ]);

    if (postsRes.ok) {
      const data = await postsRes.json();
      posts = data.data || [];
      pagination = data.pagination || null;
    }

    if (latestRes.ok) {
      const data = await latestRes.json();
      latestPosts = data.data || [];
    }
  } catch (err) {
    console.error("[Blog SSR] Error:", err.message);
  }

  return {
    props: {
      posts,
      pagination,
      currentPage: page,
      latestPosts,
      query: { category, search, sort, tag },
    },
  };
}
