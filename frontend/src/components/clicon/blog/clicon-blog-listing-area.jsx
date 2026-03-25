import React, { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import CliconBlogCard from "./clicon-blog-card";
import CliconBlogSidebar from "./clicon-blog-sidebar";

// Pagination component
const BlogPagination = ({ pagination, currentPage, onPageChange, t }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { totalPages } = pagination;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="cl-blog-pagination">
      <button
        className="cl-blog-pagination__btn cl-blog-pagination__btn--arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={t("blog.prev")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={`cl-blog-pagination__btn${page === currentPage ? " cl-blog-pagination__btn--active" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {String(page).padStart(2, "0")}
        </button>
      ))}
      <button
        className="cl-blog-pagination__btn cl-blog-pagination__btn--arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={t("blog.next")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────
const CliconBlogListingArea = ({
  posts = [],
  pagination = null,
  currentPage = 1,
  latestPosts = [],
  initialQuery = {},
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [search, setSearch] = useState(initialQuery.search || "");
  const [sort, setSort] = useState(initialQuery.sort || "newest");

  const navigate = (overrides = {}) => {
    const query = {};
    const cat = overrides.category !== undefined ? overrides.category : (initialQuery.category || "");
    const srch = overrides.search !== undefined ? overrides.search : search;
    const srt = overrides.sort !== undefined ? overrides.sort : sort;
    const pg = overrides.page !== undefined ? overrides.page : 1;
    const tag = overrides.tag !== undefined ? overrides.tag : (initialQuery.tag || "");

    if (cat) query.category = cat;
    if (srch) query.search = srch;
    if (srt && srt !== "newest") query.sort = srt;
    if (tag) query.tag = tag;
    if (pg > 1) query.page = pg;

    router.push({ pathname: "/blog", query });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate({ search: search.trim(), page: 1 });
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSort(val);
    navigate({ sort: val, page: 1 });
  };

  const handlePageChange = (page) => {
    navigate({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="cl-blog-listing">
      <div className="container">
        <div className="cl-blog-layout">
          {/* ── Sidebar ── */}
          <CliconBlogSidebar
            latestPosts={latestPosts}
            allPosts={posts}
            currentCategory={initialQuery.category || ""}
            currentTag={initialQuery.tag || ""}
            showSearch={false}
          />

          {/* ── Main Content ── */}
          <div>
            {/* Controls */}
            <div className="cl-blog-controls">
              <form className="cl-blog-controls__search" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder={t("blog.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t("blog.searchPlaceholder")}
                />
                <button type="submit" aria-label="Search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </form>

              <div className="cl-blog-controls__sort">
                <label htmlFor="blog-sort">{t("blog.sortBy")}</label>
                <select id="blog-sort" value={sort} onChange={handleSortChange}>
                  <option value="newest">{t("blog.newest")}</option>
                  <option value="oldest">{t("blog.oldest")}</option>
                  <option value="popular">{t("blog.mostPopular")}</option>
                </select>
              </div>
            </div>

            {/* Blog Grid */}
            {posts.length === 0 ? (
              <div className="text-center py-5">
                <p style={{ color: "var(--cl-text-secondary)" }}>{t("blog.noPosts")}</p>
              </div>
            ) : (
              <div className="cl-blog-grid">
                <div className="row g-4">
                  {posts.map((post) => (
                    <div key={post._id || post.slug} className="col-xl-6 col-lg-6 col-md-6">
                      <CliconBlogCard blog={post} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            <BlogPagination
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              t={t}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CliconBlogListingArea;
