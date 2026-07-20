import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { SerializedExercise } from "feature/exercises/lib/serializeExercise";
import { serializeExercise } from "feature/exercises/lib/serializeExercise";
import { songGuides } from "feature/song-library/song-guides/content";
import { getAllBlogs } from "lib/blog";

import type { SeoLandingPageProps } from "../components/SeoLandingPage";
import { seoLandingConfigs } from "../content";
import type { SeoLandingConfig } from "../types/seoLanding.types";
import { collectExerciseIds } from "./collectExerciseIds";

/**
 * Resolves a landing-page config into SSG props. Server-side only (reads blog
 * frontmatter from disk) — call exclusively from getStaticProps.
 * Throws on unknown exercise ids so a content typo fails the build instead of
 * silently dropping an embed.
 */
export function buildSeoLandingProps(
  config: SeoLandingConfig
): SeoLandingPageProps {
  const exercisesById: Record<string, SerializedExercise> = {};
  for (const id of collectExerciseIds(config)) {
    const raw = exercisesAgregat.find((exercise) => exercise.id === id);
    if (!raw) {
      throw new Error(
        `SEO landing "${config.slug}" references unknown exercise id "${id}"`
      );
    }
    exercisesById[id] = serializeExercise(raw);
  }

  const relatedGuides = config.relatedGuideSlugs.map((slug) => {
    const guide = seoLandingConfigs.find((c) => c.slug === slug);
    if (!guide) {
      throw new Error(
        `SEO landing "${config.slug}" references unknown guide slug "${slug}"`
      );
    }
    return {
      slug: guide.slug,
      title: guide.title,
      description: guide.metaDescription,
    };
  });

  const allBlogs = getAllBlogs();
  const relatedBlogs = config.relatedBlogSlugs.flatMap((slug) =>
    allBlogs.filter((blog) => blog.slug === slug)
  );

  const relatedSongGuides = config.relatedSongGuideSlugs.map((slug) => {
    const guide = songGuides.find((g) => g.slug === slug);
    if (!guide) {
      throw new Error(
        `SEO landing "${config.slug}" references unknown song guide "${slug}"`
      );
    }
    return {
      slug: guide.slug,
      title: guide.title,
      artist: guide.artist,
      description: guide.editorial.oneLiner,
    };
  });

  return { config, exercisesById, relatedGuides, relatedBlogs, relatedSongGuides };
}
