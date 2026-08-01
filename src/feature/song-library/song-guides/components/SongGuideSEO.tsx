import { getAuthorProfile } from "lib/authors";
import Head from "next/head";

import type { GuideFaqEntry, GuideLiveData, SongGuide } from "../types";

interface SongGuideSEOProps {
  guide: SongGuide;
  liveData: GuideLiveData;
  resolvedFaq: GuideFaqEntry[];
}

export const SongGuideSEO = ({
  guide,
  liveData,
  resolvedFaq,
}: SongGuideSEOProps) => {
  const siteUrl = "https://riff.quest";
  const pageUrl = `${siteUrl}/song-library/${guide.slug}`;
  const ogImageUrl = liveData.song?.coverUrl ?? `${siteUrl}/promo.png`;
  const authorProfile = getAuthorProfile(guide.author);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.h1,
        description: guide.seo.metaDescription,
        image: ogImageUrl,
        author: authorProfile
          ? {
              "@type": "Person",
              name: authorProfile.name,
              description: authorProfile.bio,
              image: `${siteUrl}${authorProfile.image}`,
            }
          : {
              "@type": "Organization",
              name: guide.author || "Riff Quest",
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
        ...(guide.sources && guide.sources.length > 0
          ? {
              citation: guide.sources.map((source) => ({
                "@type": "CreativeWork",
                name: source.label,
                url: source.url,
              })),
            }
          : {}),
        about: {
          "@type": "MusicRecording",
          name: guide.title,
          byArtist: { "@type": "MusicGroup", name: guide.artist },
          recordingOf: { "@id": `${pageUrl}#composition` },
          ...(liveData.song && liveData.song.ratingsCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: liveData.song.avgDifficulty,
                  ratingCount: liveData.song.ratingsCount,
                  bestRating: 10,
                  worstRating: 1,
                },
              }
            : {}),
        },
      },
      {
        "@type": "MusicComposition",
        "@id": `${pageUrl}#composition`,
        name: guide.title,
        composer: { "@type": "MusicGroup", name: guide.artist },
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
        mainEntity: resolvedFaq.map((entry) => ({
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
      <meta property='article:author' content={guide.author || "Riff Quest"} />

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
