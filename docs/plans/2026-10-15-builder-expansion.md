# Guitar Builder expansion

Approved: extract five bodies (Junior Honey, Osprey Tobacco, Aurelis Walnut, Aurelis Pearl, Jazzcaster Coral), two necks (Junior dots and Aurelis blocks), and the Aurelis gold-tuner headstock from existing Arsenal artwork.

Reuse the existing extraction, painting, component-level and drop systems. Author finish, pickguard and pickup masks and validate mixed assemblies. Headless and resonator builds remain outside this expansion because their assembly requirements differ.

The extractor supports `--only` with comma-separated part keys, merging just those entries into the existing manifest. Pale pearl paint uses a neutral finish mask to preserve gold hardware and dark f-holes when recoloured.

Regenerate this set with:

```sh
node scripts/guitarBuilder/extractParts.mjs --only junior-honey,osprey-tobacco,aurelis-walnut,aurelis-pearl,jazzcaster-coral,junior-dots,aurelis-blocks,aurelis-gold
```

## Delivered and checked

The catalogue now has 112 components: 18 bodies, 10 necks and 8 headstocks, alongside the existing pickups, finishes, pickguards and stickers. The eight additions use the existing drop and level systems. Eighteen new WebP assets include the body painting and sticker/pickup maps.

Hand-authored pickup covers prevent bridges and tailpieces being recoloured as pickups. Tortoise pickguard artwork, walnut-body knobs, pearl-body gold hardware and the Jazzcaster vibrato hardware remain separate from the corresponding paint masks. Nut positions were calibrated for the two new necks and the gold headstock.

All existing manifest entries were compared with HEAD and are semantically unchanged. Visual checks include mixed assemblies and recoloured finishes, pickup covers and pickguard; see `2026-10-15-builder-preview.webp` (original colours on the left, custom paint on the right).

Validation: 60 Guitar Builder tests pass. Full `npm test -- --run`: 459 files passed, 19 skipped; 5071 tests passed, 20 skipped. Changed TypeScript files pass ESLint. No data-model, Firestore-rule or environment-variable changes.

Repository-wide `npm run lint` still reports existing issues outside the changed files: 490 errors and 412 warnings.
