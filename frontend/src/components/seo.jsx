import Head from "next/head";

const SEO = ({
  pageTitle,
  description,
  image,
  url,
  noindex = false,
  type = "website",
}) => {
  const siteName = "Shofy";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const title = pageTitle ? `${pageTitle} — ${siteName}` : siteName;
  const desc =
    description ||
    "Shop the latest products at Shofy — your one-stop online marketplace";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Head>
      <title>{title}</title>
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <meta name="description" content={desc} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <link rel="icon" href="/favicon.png" />
      {fullUrl && <link rel="canonical" href={fullUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      {fullUrl && <meta property="og:url" content={fullUrl} />}
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </Head>
  );
};

export default SEO;
