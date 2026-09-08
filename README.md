# Hanumant Kulkarni — Interaction Design Portfolio

A static, editorial portfolio for Hanumant Kulkarni. The visual system pairs a responsive dot-field hero with two interaction-design case studies and one graphic-design work experience.

## Run locally

There is no build step. Serve the repository root with any static server, for example:

```bash
npx serve .
```

Opening `index.html` directly also works, although a local server more closely matches production.

## Content

Homepage copy, links, project titles, categories, cover paths, and footer links live in `data.js`. The same essential content is also present in `index.html` as a resilient no-JavaScript first frame; keep the two in sync when changing public copy.

Case-study summaries and image sequences live in:

- `onetheracure.html`
- `insti-app.html`
- `recoup-health.html`
- `assets/images/case-studies/`

The resume viewer is in `resume.html`. It uses `assets/images/resume/resume-page.png` for the smooth in-page preview and keeps `resume.pdf` as the selectable source document.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Semantic homepage shell, metadata, and static fallback content |
| `data.js` | Homepage content source |
| `styles.css` | Homepage tokens, layout, themes, and responsive states |
| `main.js` | Homepage rendering, theme switch, dot field, transitions, and motion |
| `detail.css` | Shared case-study and resume presentation |
| `detail.js` | Shared case-study progress, Lenis integration, return state, and resume loading state |
| `robots.txt` / `sitemap.xml` | Search-engine discovery |

## Interaction system

- Self-hosted GSAP 3.13 and ScrollTrigger provide the primary entrance and scroll choreography.
- Self-hosted Lenis 1.3.26 is the only smooth-scroll engine and runs on the long case-study and resume pages. Its case-study frame loop is synchronized with GSAP.
- The theme choice persists in `localStorage`; the saved theme is applied before paint.
- Project and resume return links skip the branded loader and restore the saved homepage viewport.
- Reduced-motion, keyboard focus, browser zoom, safe-area insets, and no-JavaScript states are supported.

The existing GitHub-connected production workflow deploys updates pushed to the canonical repository.
