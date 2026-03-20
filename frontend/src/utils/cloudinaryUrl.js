/**
 * Generates an optimised Cloudinary URL with width, height, quality and
 * format transformations applied.  Falls back to the original URL when it
 * is not a Cloudinary asset or is falsy.
 */
export function optimizedImage(url, options = {}) {
  if (!url || !url.includes("cloudinary.com")) return url;

  const {
    width = 400,
    height = 400,
    quality = "auto",
    format = "auto",
  } = options;

  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  return `${parts[0]}/upload/w_${width},h_${height},q_${quality},f_${format}/${parts[1]}`;
}
