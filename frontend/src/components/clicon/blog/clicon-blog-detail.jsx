import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import DOMPurify from "isomorphic-dompurify";
import dayjs from "dayjs";
import CliconBlogSidebar from "./clicon-blog-sidebar";

// ── Share helpers ────────────────────────────────────────────
const getShareUrls = (url, title) => ({
  whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
});

const openShare = (href) => {
  if (typeof window !== "undefined") {
    window.open(href, "_blank", "width=600,height=450,noopener,noreferrer");
  }
};

// ── Author Avatar ────────────────────────────────────────────
const AuthorAvatar = ({ name, image }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  if (image) {
    return (
      <div className="cl-blog-detail__avatar">
        <img src={image} alt={name} />
      </div>
    );
  }
  return <div className="cl-blog-detail__avatar">{initial}</div>;
};

// ── Comment Form ─────────────────────────────────────────────
const CommentForm = ({ onSubmit, t }) => {
  const [form, setForm] = useState({ name: "", email: "", desc: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.desc.trim()) return;
    onSubmit({ name: form.name.trim(), email: form.email.trim(), text: form.desc.trim() });
    setForm({ name: "", email: "", desc: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="cl-blog-comment-form">
      <h3 className="cl-blog-comment-form__title">{t("blog.leaveComment")}</h3>
      <form onSubmit={handleSubmit}>
        <div className="cl-blog-comment-form__grid">
          <div className="cl-blog-comment-form__field">
            <label htmlFor="comment-name">{t("blog.commentName")}</label>
            <input
              id="comment-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="cl-blog-comment-form__field">
            <label htmlFor="comment-email">{t("blog.commentEmail")}</label>
            <input
              id="comment-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="cl-blog-comment-form__field">
          <label htmlFor="comment-desc">{t("blog.commentDesc")}</label>
          <textarea
            id="comment-desc"
            name="desc"
            value={form.desc}
            onChange={handleChange}
            placeholder={t("blog.commentPlaceholder")}
            required
          />
        </div>
        <button type="submit" className="cl-blog-comment-form__submit">
          {t("blog.postComment")}
        </button>
        {submitted && (
          <div className="cl-blog-comment-form__success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {t("blog.commentSuccess")}
          </div>
        )}
      </form>
    </div>
  );
};

// ── Comments List ────────────────────────────────────────────
const AVATAR_COLORS = ["#2DA5F3", "#FA8232", "#2DB224", "#9C27B0", "#E91E63"];

const CommentsList = ({ comments, t }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  if (!comments.length) return null;
  const visible = comments.slice(0, visibleCount);

  return (
    <div className="cl-blog-comments">
      <h3 className="cl-blog-comments__title">{t("blog.comments")}</h3>
      <div className="cl-blog-comments__list">
        {visible.map((c, idx) => {
          const initial = c.name ? c.name.charAt(0).toUpperCase() : "?";
          const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          return (
            <div key={idx} className="cl-blog-comments__item">
              <div className="cl-blog-comments__avatar" style={{ backgroundColor: color }}>
                {initial}
              </div>
              <div className="cl-blog-comments__body">
                <div className="cl-blog-comments__header">
                  <span className="cl-blog-comments__name">{c.name}</span>
                  {c.date && (
                    <span className="cl-blog-comments__date">· {c.date}</span>
                  )}
                </div>
                <p className="cl-blog-comments__text">{c.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      {visibleCount < comments.length && (
        <button
          className="cl-blog-comments__load-more"
          onClick={() => setVisibleCount((v) => v + 5)}
        >
          {t("blog.loadMore")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
const CliconBlogDetail = ({ post, latestPosts = [] }) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [copied, setCopied] = useState(false);

  const publishedDate = post.publishedAt
    ? dayjs(post.publishedAt).format("DD MMM, YYYY")
    : null;

  const siteUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareUrls = getShareUrls(siteUrl, post.title || "");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  const handleAddComment = (comment) => {
    setComments((prev) => [
      { ...comment, date: dayjs().format("DD MMM, YYYY") },
      ...prev,
    ]);
  };

  const sanitizedContent = DOMPurify.sanitize(post.content || "");

  return (
    <section className="cl-blog-detail">
      <div className="container">
        {/* Hero Image */}
        {post.featuredImage && (
          <div className="cl-blog-detail__hero">
            <img src={post.featuredImage} alt={post.title} />
          </div>
        )}

        <div className="cl-blog-detail-layout">
          {/* ── Main Content ── */}
          <div>
            {/* Meta */}
            <div className="cl-blog-detail__meta">
              {post.category && (
                <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="cl-blog-detail__cat-badge">
                  {post.category}
                </Link>
              )}
              {post.author?.name && (
                <span className="cl-blog-detail__meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {post.author.name}
                </span>
              )}
              {publishedDate && (
                <span className="cl-blog-detail__meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {publishedDate}
                </span>
              )}
              {typeof post.views === "number" && (
                <span className="cl-blog-detail__meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {post.views}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="cl-blog-detail__title">{post.title}</h1>

            {/* Author + Share bar */}
            <div className="cl-blog-detail__author-bar">
              <div className="cl-blog-detail__author">
                <AuthorAvatar name={post.author?.name} image={post.author?.avatar} />
                <span className="cl-blog-detail__author-name">{post.author?.name}</span>
              </div>

              <div className="cl-blog-detail__share">
                <span className="cl-blog-detail__share-label">{t("blog.share")}</span>
                <button
                  className="cl-blog-detail__share-btn cl-blog-detail__share-btn--whatsapp"
                  onClick={() => openShare(shareUrls.whatsapp)}
                  aria-label="Share on WhatsApp"
                  title="WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                </button>
                <button
                  className="cl-blog-detail__share-btn cl-blog-detail__share-btn--facebook"
                  onClick={() => openShare(shareUrls.facebook)}
                  aria-label="Share on Facebook"
                  title="Facebook"
                >
                  <i className="fa-brands fa-facebook-f"></i>
                </button>
                <button
                  className="cl-blog-detail__share-btn cl-blog-detail__share-btn--twitter"
                  onClick={() => openShare(shareUrls.twitter)}
                  aria-label="Share on Twitter"
                  title="Twitter"
                >
                  <i className="fa-brands fa-x-twitter"></i>
                </button>
                <button
                  className="cl-blog-detail__share-btn cl-blog-detail__share-btn--linkedin"
                  onClick={() => openShare(shareUrls.linkedin)}
                  aria-label="Share on LinkedIn"
                  title="LinkedIn"
                >
                  <i className="fa-brands fa-linkedin-in"></i>
                </button>
                <button
                  className="cl-blog-detail__share-btn cl-blog-detail__share-btn--pinterest"
                  onClick={() => openShare(shareUrls.pinterest)}
                  aria-label="Share on Pinterest"
                  title="Pinterest"
                >
                  <i className="fa-brands fa-pinterest-p"></i>
                </button>
                <button
                  className="cl-blog-detail__share-btn cl-blog-detail__share-btn--copy"
                  onClick={handleCopyLink}
                  aria-label={t("blog.copyLink")}
                  title={copied ? t("blog.linkCopied") : t("blog.copyLink")}
                >
                  <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="cl-blog-detail__content"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="cl-blog-detail__tags">
                <span className="cl-blog-detail__tags-label">{t("blog.tags")}</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="cl-blog-detail__tag"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Comment Form */}
            <CommentForm onSubmit={handleAddComment} t={t} />

            {/* Comments */}
            <CommentsList comments={comments} t={t} />
          </div>

          {/* ── Sidebar ── */}
          <CliconBlogSidebar
            latestPosts={latestPosts}
            allPosts={[post]}
            currentCategory={post.category || ""}
            showSearch={true}
          />
        </div>
      </div>
    </section>
  );
};

export default CliconBlogDetail;
