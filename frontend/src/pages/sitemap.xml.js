const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7001";

function generateSiteMap(baseUrl, products, blogs) {
  const productEntries = (products || [])
    .map(
      (p) =>
        `  <url>
    <loc>${baseUrl}/product-details/${p._id}</loc>
    ${p.updatedAt ? `<lastmod>${p.updatedAt.split("T")[0]}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("\n");

  const blogEntries = (blogs || [])
    .map(
      (b) =>
        `  <url>
    <loc>${baseUrl}/blog/${b.slug}</loc>
    ${b.updatedAt ? `<lastmod>${b.updatedAt.split("T")[0]}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${productEntries}
${blogEntries}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let products = [];
  let blogs = [];

  try {
    const [prodRes, blogRes] = await Promise.all([
      fetch(
        `${API_URL}/api/v1/store/products?limit=5000&status=in-stock`
      ).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/v1/store/blog?limit=500`).then((r) =>
        r.ok ? r.json() : null
      ),
    ]);
    products = prodRes?.data || [];
    blogs = blogRes?.data || [];
  } catch (err) {
    console.error("[Sitemap] Error fetching data:", err.message);
  }

  const sitemap = generateSiteMap(baseUrl, products, blogs);

  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function SiteMap() {
  return null;
}
