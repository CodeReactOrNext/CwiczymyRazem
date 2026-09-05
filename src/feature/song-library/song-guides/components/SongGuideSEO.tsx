import { getAuthorProfile } from "lib/authors";
import Head from "next/head";

import type { GuideFaqEntry, GuideLiveData, SongGuide } from "../types";
import {
  composeGuideDescription,
  composeGuideTitle,
} from "../utils/composeGuideSeo";

/**
 * Guides whose title/description are generated from `lookup` data instead of
 * the hand-written `seo` block, retargeting them at "{song} bpm / key / tuning"
 * lookups. Staged rather than switched on everywhere at once so the change can
 * be attributed and rolled back; clearing the set moves every guide over.
 */
const LOOKUP_SEO_SLUGS = new Set([
  "master-of-puppets",
  "stairway-to-heaven",
  "hotel-california",
  "sweet-child-o-mine",
  "nothing-else-matters",
]);

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

  const useLookupSeo = LOOKUP_SEO_SLUGS.has(guide.slug);
  const metaTitle = useLookupSeo
    ? composeGuideTitle(guide, liveData)
    : guide.seo.metaTitle;
  const metaDescription = useLookupSeo
    ? composeGuideDescription(guide, liveData)
    : guide.seo.metaDescription;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.h1,
        description: metaDescription,
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
          // The community score is how hard the song is to play, not how good the
          // recording is. Expressed as aggregateRating it read as a review score
          // to Google — a structured-data policy problem, not a rich-result
          // opportunity (SEO audit 2026-09-05). It is a measured property now.
          ...(liveData.song && liveData.song.ratingsCount > 0
            ? {
                additionalProperty: [
                  {
                    "@type": "PropertyValue",
                    name: "Guitar difficulty",
                    value: liveData.song.avgDifficulty,
                    minValue: 1,
                    maxValue: 10,
                    description: `Average difficulty rating from ${liveData.song.ratingsCount} Riff Quest guitarists who have played it, on a 1-10 scale.`,
                  },
                  {
                    "@type": "PropertyValue",
                    name: "Difficulty ratings submitted",
                    value: liveData.song.ratingsCount,
                  },
                ],
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
      <title>{metaTitle}</title>
      <meta name='description' content={metaDescription} />
      <meta name='keywords' content={guide.seo.keywords.join(", ")} />
      <meta name='robots' content='index, follow' />

      <meta property='og:type' content='article' />
      <meta property='og:url' content={pageUrl} />
      <meta property='og:title' content={metaTitle} />
      <meta property='og:description' content={metaDescription} />
      <meta property='og:image' content={ogImageUrl} />
      <meta property='article:published_time' content={guide.publishedAt} />
      <meta property='article:modified_time' content={guide.updatedAt} />
      <meta property='article:author' content={guide.author || "Riff Quest"} />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={metaTitle} />
      <meta name='twitter:description' content={metaDescription} />
      <meta name='twitter:image' content={ogImageUrl} />

      <link rel='canonical' href={pageUrl} />

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
};
