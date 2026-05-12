import type { LibrarySong } from "feature/song-library/services/getSongsForStaticProps";
import Head from "next/head";

interface FaqQuestion {
  title: string;
  message: string;
}

interface LibrarySEOProps {
  songs: LibrarySong[];
  totalSongs: number;
  faqQuestions: FaqQuestion[];
}

export const LibrarySEO = ({ songs, totalSongs, faqQuestions }: LibrarySEOProps) => {
  const siteUrl = "https://riff.quest";
  const pageUrl = `${siteUrl}/song-library`;
  const ogImageUrl = `${siteUrl}/promo.png`;

  const title = `Guitar Song Library — ${totalSongs}+ Songs Ranked by Difficulty | Riff Quest`;
  const description = `Browse ${totalSongs}+ guitar songs ranked by real community difficulty ratings. Filter by tier (S through D), genre, and skill level. Find your next song to learn — free to explore.`;
  const keywords =
    "guitar song library, learn guitar songs, song difficulty guitar, guitar tier list, guitar practice songs, community rated guitar songs, guitar repertoire, song difficulty ratings";

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      <link rel="canonical" href={pageUrl} />

      {/* ItemList — top 10 songs as MusicRecording */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Guitar Song Library — Ranked by Difficulty",
            description:
              "Community-rated guitar songs ranked from beginner (D-tier) to legendary (S-tier)",
            url: pageUrl,
            numberOfItems: totalSongs,
            itemListElement: songs.slice(0, 10).map((song, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MusicRecording",
                name: song.title,
                byArtist: { "@type": "MusicGroup", name: song.artist },
                url: pageUrl,
              },
            })),
          }),
        }}
      />

      {/* FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqQuestions.map((q) => ({
              "@type": "Question",
              name: q.title,
              acceptedAnswer: { "@type": "Answer", text: q.message },
            })),
          }),
        }}
      />

      {/* WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Guitar Song Library",
            url: pageUrl,
            description,
            isPartOf: { "@type": "WebSite", url: siteUrl, name: "Riff Quest" },
          }),
        }}
      />
    </Head>
  );
};
