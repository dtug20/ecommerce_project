const mongoose = require("mongoose");

const blogSeoSchema = new mongoose.Schema(
  {
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    ogImage: {
      type: String,
    },
  },
  { _id: false }
);

const blogI18nSchema = new mongoose.Schema(
  {
    titleVi: {
      type: String,
    },
    excerptVi: {
      type: String,
    },
    contentVi: {
      type: String,
    },
  },
  { _id: false }
);

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a blog post title"],
    },
    slug: {
      type: String,
      required: [true, "Please provide a blog post slug"],
      unique: true,
    },
    excerpt: {
      type: String,
      maxLength: [300, "Excerpt cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Please provide blog post content"],
    },
    featuredImage: {
      type: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Please provide an author"],
    },
    category: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
    seo: {
      type: blogSeoSchema,
      default: () => ({}),
    },
    i18n: {
      type: blogI18nSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

blogPostSchema.index(
  { title: "text", excerpt: "text", content: "text", tags: "text" }
);
blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ featured: 1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ publishedAt: -1 });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = BlogPost;
