import Head from "next/head";
import { useTranslation } from "hooks/useTranslation";

interface LandingSEOProps {
  faqQuestions: {
    title: string;
    message: string;
  }[];
}

export const LandingSEO = ({ faqQuestions }: LandingSEOProps) => {
  const { t } = useTranslation(["common"]);
  const siteUrl = "https://riff.quest";
  const ogImageUrl = `${siteUrl}/promo.png`;

  const title = t("common:seo.title") as string;
  const description = t("common:seo.description") as string;
  const keywords = t("common:seo.keywords") as string;

  return (
    <Head>
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content='website' />
      <meta property='og:url' content={siteUrl} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={ogImageUrl} />

      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:url' content={siteUrl} />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={ogImageUrl} />

      <link rel='canonical' href={siteUrl} />

      {/* Structured Data */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Riff Quest",
            "url": siteUrl,
            "description": description,
          }),
        }}
      />

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Riff Quest",
            "url": siteUrl,
            "logo": `${siteUrl}/favicon/apple-touch-icon.png`,
          }),
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqQuestions.map((q) => ({
              "@type": "Question",
              "name": q.title,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": q.message,
              },
            })),
          }),
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "Riff Quest Demo",
            "description": "See how Riff Quest turns guitar practice into visible progress.",
            "thumbnailUrl": "/images/video-poster.png",
            "uploadDate": "2024-01-27T12:00:00Z",
            "contentUrl": `${siteUrl}/demo.webm`,
            "embedUrl": `${siteUrl}/`,
          }),
        }}
      />
    </Head>
  );
};
