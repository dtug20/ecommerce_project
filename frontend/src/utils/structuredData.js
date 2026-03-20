/**
 * Structured data (JSON-LD) utilities for SEO.
 * All functions return plain objects ready to be serialised with JSON.stringify.
 */

export function productJsonLd(product, siteUrl = "") {
  if (!product) return null;

  const price =
    product.discount > 0
      ? (product.price - (product.price * product.discount) / 100).toFixed(2)
      : product.price?.toFixed(2);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description?.substring(0, 200),
    image: product.img,
    sku: product.sku || product._id,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "USD",
      availability:
        product.status === "in-stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/product-details/${product._id}`,
    },
  };

  if (product.brand?.name) {
    schema.brand = { "@type": "Brand", name: product.brand.name };
  }

  return schema;
}

export function articleJsonLd(post, siteUrl = "") {
  if (!post) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 200),
    image: post.featuredImage,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author?.name || "Shofy" },
    publisher: {
      "@type": "Organization",
      name: "Shofy",
      url: siteUrl,
    },
  };
}

export function breadcrumbJsonLd(items, siteUrl = "") {
  if (!items || !items.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url ? `${siteUrl}${item.url}` : undefined,
    })),
  };
}

export function organizationJsonLd(siteUrl = "") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Shofy",
    url: siteUrl,
  };
}
