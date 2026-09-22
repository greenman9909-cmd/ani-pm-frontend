# Normative Design Contract

AML is a streaming product before it is a dashboard. The first viewport must retain the extracted cinematic spotlight hierarchy: full-width artwork, strong title treatment, compact score/year/episode/format metadata, genres, synopsis and high-priority Play/Resume plus Library actions. Discovery content remains horizontal media rails rather than card grids wrapped in administrative panels. Anime details, player, Library, Profile, Settings, Community, Release Schedule and Watch Together must inherit the same dark media surface language.

Use the extracted CSS/component path as the normative implementation. Semantic surface, type, spacing, radius, shadow and motion values come from that code path. Do not introduce generic dashboard chrome, decorative gradient backgrounds, gradient text, random glass cards, arbitrary per-page spacing or a parallel design system.

Original AML synthetic vector artwork may replace captured key art without changing the component geometry. Record identity and artwork identity remain separate because the extracted hero has structural artwork mappings.

## Surface Invariance

Desktop and mobile must preserve information hierarchy even when navigation and rail density change. Hero presence, title readability, play/library actions, shelf continuity and player transition are invariant. Touch targets and coarse-pointer behavior use the reference responsive CSS. Reduced-motion users receive minimized/disabled transform animation through the existing `prefers-reduced-motion` rules. Keyboard focus remains visible and semantic controls retain button/link roles.

Loading, empty, error and offline states must not collapse route structure. Media data is normalized behind same-origin adapters; future licensed/user-provided media sources replace the adapter rather than the page layout. External network calls are blocked in this mock build.
