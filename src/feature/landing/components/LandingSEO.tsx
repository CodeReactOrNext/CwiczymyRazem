import { useTranslation } from "hooks/useTranslation";
import Head from "next/head";

interface LandingSEOProps {
  faqQuestions: {
    title: string;
    message: string;
  }[];
}

export const LandingSEO = ({ faqQuestions }: LandingSEOProps) => {
  const { t } = useTranslation(["common"]);
  const siteUrl = "https://riff.quest";
  const ogImageUrl = `${siteUrl}/images/og-image.png`;

  const title = t("common:seo.title") as string;
  const description = t("common:seo.description") as string;

  return (
    <Head>
      <title>{title}</title>
      <meta name='description' content={description} />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content='website' />
      <meta property='og:site_name' content='Riff Quest' />
      <meta property='og:locale' content='en_US' />
      <meta property='og:url' content={siteUrl} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={ogImageUrl} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta property='og:image:alt' content='Riff Quest guitar practice tracker dashboard' />

      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:url' content={siteUrl} />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={ogImageUrl} />

      <link rel='canonical' href={siteUrl} />
      {/* Hero's `priority` image changed with the redesign — see HeroSection.tsx (tabs.webp preview panel). */}
      <link rel='preload' as='image' href='/images/feature/tabs.webp' fetchPriority='high' />

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
            "thumbnailUrl": `${siteUrl}/images/video-poster.png`,
            "uploadDate": "2024-01-27T12:00:00Z",
            "contentUrl": `${siteUrl}/demo.webm`,
            "embedUrl": `${siteUrl}/`,
          }),
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Riff Quest",
            "url": siteUrl,
            "description": description,
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
            },
          }),
        }}
      />
    </Head>
  );
};
