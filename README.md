# Hanumant Kulkarni — Interaction Design Portfolio

A minimal, editorial portfolio. Its layout, typography, spacing, hover
interactions and animations recreate the design language of the reference
(cyze.dev), with entirely my own content.

## Run it

No build step, no dependencies. Either:

**Option A — open directly**
Double-click `index.html`.

**Option B — local server** (recommended, matches how it's hosted)

```bash
npx serve .
```

Then open the printed URL (e.g. http://localhost:3000).

## Edit your content — only touch `data.js`

Everything you'll want to change lives in **`data.js`**:

- `SITE.name`, `SITE.role`, `SITE.intro` — the hero.
- `PROJECTS[]` — your project list. Each project:
  - `title` — project name
  - `category` — short descriptor (discipline / tool)
  - `link` — URL, or `"#"` for now
  - `image` — *optional* path to a thumbnail, e.g. `"images/one.jpg"`.
    Leave it out and a clean placeholder is generated automatically.
  - `ratio` — thumbnail height ÷ width (`1.32` ≈ portrait, `0.78` ≈ wide).
    Varying these creates the masonry rhythm.
  - `pinned` — `true` shows a small star badge (use for a featured one).
- `SITE.footer` — footer meta lines and social links.

To add real thumbnails: drop images into a `portfolio/images/` folder and
set each project's `image` field to its path.

## Files

| File         | What it is                                             |
|--------------|--------------------------------------------------------|
| `index.html` | Page shell (semantic markup, font + style links)       |
| `styles.css` | Design system — tokens, layout, cards, animations      |
| `main.js`    | Renders projects from `data.js`, wires up interactions |
| `data.js`    | **Your content.** The only file you normally edit.     |

## Design notes

- **Dark by default** with a light theme toggle (remembered per browser).
- **Desktop:** two-column masonry feed; hovering a card raises it and slides
  up a pill button with the project title + arrow.
- **Mobile / touch:** single column; the title + category show as a caption
  under each card instead of the hover button.
- Colors use OKLCH; motion uses shared easing/duration tokens.
- Respects `prefers-reduced-motion`.
