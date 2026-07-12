# Third-Party Notices

This project incorporates algorithms derived from the following open-source projects.

## Instrumenta

- **Repository:** https://github.com/iappyx/Instrumenta
- **License:** MIT
- **Copyright:** iappyx (2021–2026)
- **Used for:** Rotation-aware visual bounds (`GetRealTop`, `GetRealLeft`, `GetRealWidth`, `GetRealHeight`) and alignment/distribution behavior references in `@deck-pack/presentation-formatting`.

## Instrumenta contributor o485

- **Contributor:** o485 (https://github.com/o485)
- **License:** MIT (via Instrumenta)
- **Used for:** Rotation-aware geometry helpers ported into `packages/presentation-formatting/src/geometry/bounds.ts`.

## ProDeck

- **Repository:** https://github.com/rodrigolourencofarinha/ProDeck
- **License:** MIT
- **Copyright:** Rodrigo Farinha (2025)
- **Used for:** Stack, spacing, swap, resize, and line-rectification behavior references in `@deck-pack/presentation-formatting`.

## Implementation note

Deck Pack reimplemented these utilities in TypeScript for Office.js. No VBA source, ribbon XML, forms, or platform-specific dialogs were copied directly.
