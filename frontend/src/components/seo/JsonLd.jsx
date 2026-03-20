import Head from "next/head";

/**
 * Renders a JSON-LD structured data script tag inside <Head>.
 * Accepts a single schema object or an array of schema objects.
 */
export default function JsonLd({ data }) {
  if (!data) return null;

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    </Head>
  );
}
