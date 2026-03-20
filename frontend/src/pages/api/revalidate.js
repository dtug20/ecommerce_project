/**
 * On-demand ISR revalidation endpoint.
 *
 * POST /api/revalidate
 * Body: { "secret": "<REVALIDATION_SECRET>", "path": "/product-details/abc123" }
 *
 * Set REVALIDATION_SECRET in .env.local and also in the backend so it can
 * call this endpoint after a product or blog post is updated.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { secret, path } = req.body || {};

  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    return res.status(401).json({ message: "Invalid or missing secret" });
  }

  if (!path || typeof path !== "string") {
    return res.status(400).json({ message: "A valid path is required" });
  }

  try {
    await res.revalidate(path);
    return res.json({ revalidated: true, path });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error revalidating", error: err.message });
  }
}
