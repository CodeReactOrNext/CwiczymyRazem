# Pedalboard artwork calibration

Corrected the twenty expansion effects (IDs 35–54) using their shipped transparent WebP artwork.

- Each input and output has its own measured centre instead of the shared 0.45 height. Actual socket heights range from approximately 0.43 to 0.53 of the image.
- Signal plugs seat past the protruding socket nuts, against the enclosure wall. Nut depth is authored per image.
- The Desert Cry, Tidal Sweep and Astral Voice DC plugs reach the inlets drawn on their top faces.
- Board scales follow enclosure families: approximately 1.0 for standard single pedals, 0.8 for the Spark Lift mini, 1.05–1.1 for slightly larger boutique/digital boxes, and 1.55 for full-length treadles. The illustrated jack diameters are stylized and do not determine the enclosure scale. Source aspect ratios remain unchanged.

Both the editable rig and profile use the same existing resolvers. These corrections require no inventory migration or account writes; existing copies resolve the updated model geometry.

Validation: 98 tests pass across artwork geometry, pedalboard placement, signal cables, DC power layout and catalogue assets. Changed files pass ESLint and formatting. Visual inspection uses the actual SignalCable and PedalDcPlug components composited with the shipped artwork; see `2026-10-15-pedal-calibration-preview.webp`.

## Freely positioned Wah cable visibility

Two adjacent tall pedals can straddle the nearest-row boundary despite their sockets being next to each other. Signal routing now uses their actual enclosure and socket positions to recognize neighbours. Tight couplers covering protruding nuts are drawn in the foreground, seated against the enclosure walls, like the existing raised plugs.

Power routing now receives each pedal's actual top in both the editor and profile. It skips nominal row channels below that top, so the last leg approaches the DC inlet from above rather than disappearing underneath the pedal.

Read-only verification confirmed that the reported Wah instances already had power links; no account changes were needed. The reproduction preview uses the reported positions and the real cable renderers: `2026-10-15-wah-cables-preview.webp`.

Validation: 119 rig, placement and power tests pass, including regressions for cross-boundary neighbours, raised couplers and a channel below a tall pedal's inlet. ESLint reports no errors in the six changed code/test files (seven existing warnings in the board/profile views).

## Enclosure size review

Silk Press, Mercury Orbit and Contour Six now share the standard height; Polaris Tune is only 5% shorter. All three Wah models and Octave Drift share the same full-length treadle height. Socket coordinates, seating depths, artwork and cable routing are unchanged.

`2026-10-15-pedal-sizes-comparison.webp` shows the earlier socket-based scales on the left and the revised enclosure-based scales on the right, with each group aligned along its bottom edge.

Validation: 98 tests pass across artwork/size geometry, board layout, signal cables and power layout. Regression checks compare the actual resolver heights of the four reported standard pedals and verify consistent treadle footprints and a smaller mini pedal. Changed files pass ESLint and formatting.
