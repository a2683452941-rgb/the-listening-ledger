# Third-party notices

## StPageFlip / page-flip 2.0.7

- Author: Nodlik
- License: MIT
- Official project: https://github.com/Nodlik/StPageFlip
- Documentation: https://nodlik.github.io/StPageFlip/
- Vendored distribution: `public/vendor/page-flip.js`
- License text: `public/vendor/page-flip.LICENSE`
- Source package: https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.module.js

The library provides continuous HTML page folds, shadows, and pointer gestures. The ledger logic, page compositions, amount calculations, and model workflows are part of this project. No remote package is loaded at runtime.

## Real-material art collection

The v0.4 pages include third-party digitized physical artworks from The Metropolitan Museum of Art's Open Access collection and photographic materials from ambientCG. The team did not create or photograph these source materials. Selected files have individually verified CC0 permissions; the project code's MIT license does not replace their source notices.

- Human-readable provenance and processing: [ASSET_SOURCES](docs/ASSET_SOURCES.md).
- Per-file original URLs, artists, medium, license, crop and hash: [asset manifest](public/assets/asset-manifest.json).
- CC0 notice: [LICENSE-CC0](public/assets/LICENSE-CC0.txt).
- Local in-product credit page: `public/credits.html`.

The 11 November 2026 update adds five clearly labelled AI illustrations generated with OpenAI's built-in image generation tool. They are distinct from the 18 retained CC0 physical-source assets and are not assigned those CC0 terms. Their creation notes and exact prompts are in [illustration-prompts.json](public/assets/illustration-prompts.json); file-level provenance and rights notes remain in the [asset manifest](public/assets/asset-manifest.json). Images were pre-generated for the five example spending days and are matched locally to confirmed content; page turns do not call an image model. Illustrations do not represent evidence of actual purchased items or locations. Conventional processing of physical assets, CSS layout and live SVG paths remain separately described above.
