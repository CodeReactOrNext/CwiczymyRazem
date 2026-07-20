import Head from "next/head";

import type { GuideLiveData, SongGuide } from "../types";

interface SongGuideSEOProps {
  guide: SongGuide;
  liveData: GuideLiveData;
}

export const SongGuideSEO = ({ guide, liveData }: SongGuideSEOProps) => {
  const siteUrl = "https://riff.quest";
  const pageUrl = `${siteUrl}/song-library/${guide.slug}`;
  const ogImageUrl = liveData.song?.coverUrl ?? `${siteUrl}/promo.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.h1,
        description: guide.seo.metaDescription,
        image: ogImageUrl,
        author: {
          "@type": "Organization",
          name: "Riff Quest",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Riff Quest",
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/images/longlightlogo.svg`,
          },
        },
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        about: {
          "@type": "MusicRecording",
          name: guide.title,
          byArtist: { "@type": "MusicGroup", name: guide.artist },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Song Library",
            item: `${siteUrl}/song-library`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${guide.title} — Guitar Guide`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faq.map((entry) => ({
          "@type": "Question",
          name: entry.title,
          acceptedAnswer: { "@type": "Answer", text: entry.message },
        })),
      },
    ],
  };

  return (
    <Head>
      <title>{guide.seo.metaTitle}</title>
      <meta name='description' content={guide.seo.metaDescription} />
      <meta name='keywords' content={guide.seo.keywords.join(", ")} />
      <meta name='robots' content='index, follow' />

      <meta property='og:type' content='article' />
      <meta property='og:url' content={pageUrl} />
      <meta property='og:title' content={guide.seo.metaTitle} />
      <meta property='og:description' content={guide.seo.metaDescription} />
      <meta property='og:image' content={ogImageUrl} />
      <meta property='article:published_time' content={guide.publishedAt} />
      <meta property='article:modified_time' content={guide.updatedAt} />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={guide.seo.metaTitle} />
      <meta name='twitter:description' content={guide.seo.metaDescription} />
      <meta name='twitter:image' content={ogImageUrl} />

      <link rel='canonical' href={pageUrl} />

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
};
