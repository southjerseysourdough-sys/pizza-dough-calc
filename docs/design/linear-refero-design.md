# Linear — Refero design reference

Source: [Refero Styles — Linear](https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1)

Captured from the full extended `DESIGN.md` view on 2026-08-03. This file records only rules present in that source. Product-specific restrictions from the redesign brief (for example, reserving non-lime colors for semantic states) override the broader reference where they are stricter.

> **Style:** Linear  
> **Description:** midnight precision instrument  
> **Theme:** dark

Linear uses a near-black substrate, crisp light type, compact precision geometry, and one acid-lime primary action. Structure comes from surface steps, hairline edges, and restrained inset shadows rather than decorative panels or large ambient shadows.

## Color tokens

| Name        | Value     | Token                 | Reference role                                         |
| ----------- | --------- | --------------------- | ------------------------------------------------------ |
| Void        | `#08090a` | `--color-void`        | Page canvas and full-bleed background                  |
| Carbon      | `#0f1011` | `--color-carbon`      | Card and navigation surfaces                           |
| Obsidian    | `#161718` | `--color-obsidian`    | Elevated and nested surfaces                           |
| Graphite    | `#23252a` | `--color-graphite`    | Subtle borders, dividers, ghost outlines               |
| Smoke       | `#383b3f` | `--color-smoke`       | Stronger hairlines and section separators              |
| Ash         | `#62666d` | `--color-ash`         | Muted copy and inactive metadata                       |
| Fog         | `#8a8f98` | `--color-fog`         | Tertiary copy, placeholders, icon fills                |
| Mist        | `#d0d6e0` | `--color-mist`        | Secondary headings and dark-surface button text        |
| Bone        | `#e5e5e6` | `--color-bone`        | Near-white fills and high-contrast button text         |
| Paper       | `#ffffff` | `--color-paper`       | Primary headings and maximum-contrast emphasis         |
| Acid Lime   | `#e4f222` | `--color-acid-lime`   | The single primary action and active navigation signal |
| Pulse Green | `#27a644` | `--color-pulse-green` | Supporting accent in the source system                 |
| Coral Red   | `#eb5757` | `--color-coral-red`   | Supporting accent in the source system                 |
| Signal Teal | `#02b8cc` | `--color-signal-teal` | Informational/decorative accent in the source system   |
| Iris Violet | `#6366f1` | `--color-iris-violet` | Tag/category fill in the source system                 |
| Lavender    | `#8b5cf6` | `--color-lavender`    | Secondary tag/category fill in the source system       |

For this product, acid lime is the only functional action color. Amber is limited to baking advisories, red to errors, and green to valid success states. The other chromatic source tokens are documented for fidelity but are not introduced into the application chrome.

## Typography

Primary UI type is Inter Variable, with `system-ui` as an allowed fallback. The project’s existing Geist variable font is a suitable installed equivalent and requires no new font download. The reference uses weights `300`, `400`, `510`, and `590`, with no `700+` weights.

Enable:

```css
font-feature-settings:
  "cv01" 1,
  "ss03" 1,
  "zero" 1;
```

Use Berkeley Mono only for technical metadata, issue identifiers, and keyboard shortcuts; acceptable substitutes are JetBrains Mono, IBM Plex Mono, or `ui-monospace`.

| Role            | Size | Weight | Line height | Letter spacing |
| --------------- | ---: | -----: | ----------: | -------------: |
| Display         | 72px |    510 |           1 |       -0.022em |
| Hero            | 64px |    510 |           1 |       -0.022em |
| Section heading | 48px |    510 |           1 |       -0.022em |
| Subheading      | 32px |    400 |        1.13 |       -0.022em |
| Heading         | 24px |    400 |        1.33 |       -0.012em |
| Body emphasis   | 20px |    590 |        1.33 |       -0.012em |
| Body large      | 17px |    590 |         1.6 |        default |
| Body            | 16px |    400 |         1.5 |        default |
| Body small      | 15px |    400 |         1.6 |       -0.011em |
| Caption         | 13px |    400 |         1.2 |        default |
| Label           | 12px |    400 |         1.4 |        default |
| Micro           | 10px |    510 |         1.5 |        default |

Recipe numbers use tabular figures. Monospace is reserved for technical metadata, not headings or marketing copy.

## Spacing and shape

- Base unit: `4px`
- Density: compact
- Reference page max width: `1200px`
- Section gap: `96px`
- Card padding: `24px`
- Element gap: `8px`
- Spacing scale: `4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 80, 96, 128px`

Radius vocabulary:

| Use                   |   Radius |
| --------------------- | -------: |
| Small details         |    `2px` |
| Badges                |    `4px` |
| Inputs and buttons    |    `6px` |
| Cards and main panels |   `12px` |
| Pills                 | `9999px` |

## Surfaces and elevation

| Level | Surface  | Value     | Purpose                                   |
| ----: | -------- | --------- | ----------------------------------------- |
|     0 | Void     | `#08090a` | Full page canvas                          |
|     1 | Carbon   | `#0f1011` | Contained surfaces and navigation         |
|     2 | Obsidian | `#161718` | Raised/nested panels                      |
|     3 | Slate    | `#23252a` | Interactive tint and border-adjacent fill |

Elevation is primarily the progression `#08090a → #0f1011 → #161718 → #23252a`, with `0.5px` graphite/smoke borders or `1px` inset edges. Use small dark shadows only where needed; do not separate ordinary panels with layered ambient shadows. The source’s primary action is the one chrome element allowed a more noticeable inset shadow stack.

Recorded shadow vocabulary:

- `sm`: `rgba(0,0,0,0.4) 0 2px 4px`
- `md`: `rgba(0,0,0,0.2) 0 0 12px inset`
- `subtle`: `rgb(35,37,42) 0 0 0 1px inset`
- `subtle-2`: `rgba(0,0,0,0.2) 0 0 0 1px`
- `xl`: `rgba(8,9,10,0.6) 0 4px 32px`

## Component rules

- **Primary action:** acid lime background, void text, 6px radius, `10px 16px` padding, 14px/510 type. It is the sole filled chromatic action.
- **Nav text:** transparent, mist text, `8px 12px` padding, 13px/400, typographic hover treatment.
- **Pill:** 5% white fill, mist text, pill radius, `4px 12px`, 12–13px/400.
- **Ghost action:** transparent, graphite border, mist text, 6px radius, `8px 12px`, 13px/400.
- **Large card:** carbon background, 12px radius, 1px graphite inset edge, 24px padding, no outer glow.
- **Subtle card:** 2% white fill, 6px radius, small dark shadow, 8px padding.
- **Text input:** 2% white fill, 8% white border, mist text, 6px radius, `12px 14px`, 14px/400; focus brightens the edge.
- **Badge:** 5% white fill, fog text, 4px radius, `0 6px`, 12px/400.
- **Icons:** minimal single-color line art in the neutral scale.

## Interaction guidance

- Keep one primary signal per view.
- Use compact focusable controls with visible keyboard focus.
- Use hairline edges and small state changes for hover/focus.
- Active and selected states must remain legible without relying on color alone.
- Keep motion functional and restrained; product state changes are the visual event.

## Do

- Use the variable sans font with `cv01`, `ss03`, and `zero` features enabled.
- Keep body copy at 16px/400/1.5 by default.
- Tighten tracking at 48px and above.
- Use the 12px card, 6px control, and pill vocabulary.
- Use 0.5px graphite/smoke hairlines and subtle inset edges.
- Preserve the 8/12/24/96 rhythm where the application layout permits it.
- Treat real product UI as the visual texture.

## Do not

- Do not use 700+ weights.
- Do not use decorative gradients on buttons, cards, or text; the reference reserves gradients for a restrained atmospheric floor.
- Do not introduce extra chromatic action accents.
- Do not exceed 12px radii on cards or panels.
- Do not use shadows as the main separation between panels and canvas.
- Do not use chromatic body copy.
- Do not use the mono face for headings or marketing copy.
- Do not turn the layout into a three-column card grid or masonry surface.
