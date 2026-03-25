import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

// ── Helpers ─────────────────────────────────────────────────
const extractCategories = (posts) => {
  const cats = new Set();
  posts.forEach((p) => { if (p.category) cats.add(p.category); });
  return Array.from(cats);
};

const extractTags = (posts) => {
  const tags = new Set();
  posts.forEach((p) => {
    if (Array.isArray(p.tags)) p.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).slice(0, 15);
};

// ── Sub-sections ─────────────────────────────────────────────

const SidebarSearch = ({ t }) => {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) router.push(`/blog?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="cl-blog-sidebar__section">
      <h3 className="cl-blog-sidebar__heading">{t("common.search", "SEARCH")}</h3>
      <form className="cl-blog-controls__search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder={t("blog.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("blog.searchPlaceholder")}
        />
        <button type="submit" aria-label={t("blog.search")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </form>
    </div>
  );
};

const SidebarCategory = ({ categories, currentCategory, t }) => {
  const router = useRouter();

  const handleSelect = (cat) => {
    router.push(cat ? `/blog?category=${encodeURIComponent(cat)}` : "/blog");
  };

  return (
    <div className="cl-blog-sidebar__section">
      <h3 className="cl-blog-sidebar__heading">{t("blog.category")}</h3>
      <ul className="cl-blog-sidebar__cat-list">
        <li className={`cl-blog-sidebar__cat-item${!currentCategory ? " cl-blog-sidebar__cat-item--active" : ""}`}>
          <input
            type="radio"
            id="sidebar-cat-all"
            name="sidebar-blog-category"
            checked={!currentCategory}
            onChange={() => handleSelect("")}
          />
          <label htmlFor="sidebar-cat-all">{t("blog.allCategories")}</label>
        </li>
        {categories.map((cat) => (
          <li
            key={cat}
            className={`cl-blog-sidebar__cat-item${currentCategory === cat ? " cl-blog-sidebar__cat-item--active" : ""}`}
          >
            <input
              type="radio"
              id={`sidebar-cat-${cat}`}
              name="sidebar-blog-category"
              checked={currentCategory === cat}
              onChange={() => handleSelect(cat)}
            />
            <label htmlFor={`sidebar-cat-${cat}`}>{cat}</label>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SidebarLatestBlog = ({ posts, t }) => {
  if (!posts.length) return null;
  return (
    <div className="cl-blog-sidebar__section">
      <h3 className="cl-blog-sidebar__heading">{t("blog.latestBlog")}</h3>
      <div className="cl-blog-sidebar__mini-list">
        {posts.slice(0, 3).map((post) => {
          const href = post.slug ? `/blog/${post.slug}` : `/blog-details/${post.id}`;
          const date = post.publishedAt
            ? dayjs(post.publishedAt).format("DD MMM, YYYY")
            : post.date || "";
          return (
            <Link key={post._id || post.slug} href={href} className="cl-blog-sidebar__mini-card">
              <div className="cl-blog-sidebar__mini-thumb">
                {(post.featuredImage || post.img) ? (
                  <img src={post.featuredImage || post.img} alt={post.title} loading="lazy" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--cl-bg-gray)" }} />
                )}
              </div>
              <div className="cl-blog-sidebar__mini-body">
                <p className="cl-blog-sidebar__mini-title">{post.title}</p>
                {date && (
                  <span className="cl-blog-sidebar__mini-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {date}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const SidebarGallery = ({ posts, t }) => {
  const images = posts
    .map((p) => ({ src: p.featuredImage || p.img, alt: p.title, href: p.slug ? `/blog/${p.slug}` : "#" }))
    .filter((i) => i.src)
    .slice(0, 8);

  if (!images.length) return null;

  return (
    <div className="cl-blog-sidebar__section">
      <h3 className="cl-blog-sidebar__heading">{t("blog.gallery")}</h3>
      <div className="cl-blog-sidebar__gallery">
        {images.map((img, idx) => (
          <Link key={idx} href={img.href} className="cl-blog-sidebar__gallery-item">
            <img src={img.src} alt={img.alt} loading="lazy" />
          </Link>
        ))}
      </div>
    </div>
  );
};

const SidebarTags = ({ tags, currentTag, t }) => {
  const router = useRouter();
  if (!tags.length) return null;

  const handleTag = (tag) => {
    router.push(tag ? `/blog?tag=${encodeURIComponent(tag)}` : "/blog");
  };

  return (
    <div className="cl-blog-sidebar__section">
      <h3 className="cl-blog-sidebar__heading">{t("blog.popularTag")}</h3>
      <div className="cl-blog-sidebar__tags">
        {tags.map((tag, idx) => (
          <button
            key={tag}
            className={`cl-blog-sidebar__tag${currentTag === tag ? " cl-blog-sidebar__tag--active" : ""}`}
            onClick={() => handleTag(currentTag === tag ? "" : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main Sidebar Component ───────────────────────────────────
const CliconBlogSidebar = ({
  latestPosts = [],
  allPosts = [],
  currentCategory = "",
  currentTag = "",
  showSearch = true,
}) => {
  const { t } = useTranslation();

  const categories = extractCategories([...allPosts, ...latestPosts]);
  const tags = extractTags([...allPosts, ...latestPosts]);
  const gallerySource = latestPosts.length ? latestPosts : allPosts;

  return (
    <aside className="cl-blog-sidebar">
      {showSearch && <SidebarSearch t={t} />}
      <SidebarCategory categories={categories} currentCategory={currentCategory} t={t} />
      <SidebarLatestBlog posts={latestPosts} t={t} />
      <SidebarGallery posts={gallerySource} t={t} />
      <SidebarTags tags={tags} currentTag={currentTag} t={t} />
    </aside>
  );
};

export default CliconBlogSidebar;
