# state-model

Catalogue state is normalized into synthetic Anime records with stable record IDs and a separate `anilistId` used only as a structural mapping key required by the extracted artwork/hero logic. Display artwork resolves to local AML-owned SVGs. This prevents the prior failure where arbitrary IDs caused the hero component to filter out valid data.

Library state covers watching, completed, plan-to-watch, on-hold and dropped; favorites are represented independently; collection IDs group titles into Late Night, Weekend, Rewatch and Comfort Queue. Progress/history endpoints expose episode, percentage/time and update timestamps. Player preferences include audio, captions, autoplay and intro-skip flags.

The browser runtime is mock-only: authentication returns a synthetic profile, writes remain local/in-memory where supported, and external `fetch()` is blocked. Loading, empty, error and offline states remain responsibilities of the extracted components. Future licensed media sources implement the media adapter without modifying route geometry or component composition.
