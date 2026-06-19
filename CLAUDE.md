# CLAUDE.md

Guidance for AI agents working in this repo. Keep it accurate — fix it when the code drifts.

## What this is

NetViz: a static React + Vite front-end of scroll-driven network visualizations
(Encapsulation, TLS 1.3, DNS, BGP). No backend; `dist/` deploys to any static host.

## Commands

```bash
npm install
npm run dev      # dev server
npm run build    # production build into dist/ (use this to verify changes compile)
npm run preview  # preview the production build
```

There is **no test or lint script**. Verify changes with `npm run build`. The app
is visual and can't be eyeballed in a headless environment — call out any change
whose look/timing you couldn't confirm.

## Architecture

- **Page registry** (`src/pages/registry.jsx`) is the single source of truth: the
  `PAGES` array (`{ id, path, title, tagline, accent, icon, Component }`) drives the
  side menu, routes, and home cards. Add a visualization by adding one entry +
  `src/pages/<Name>Page.jsx` (+ optional `src/data/<name>.js`). Nothing else to wire.
- **Scroll engine** = `src/components/ScrollDeck.jsx` + `src/hooks/useDeck.js`. It is
  a discrete full-viewport *deck* (no native scrolling): each wheel/swipe/key gesture
  moves exactly one section (hero → steps → footer). Pages pass `stepCount` and a
  `renderStage` that animates its content as `activeIndex` changes.
- **Content is data-driven**: per-viz field definitions, example values, and hover
  explanations live in `src/data/*.js`, not in components.
- Shared UI: `PacketBlock` (hoverable field), `FieldDetail` (explanation panel),
  `StepRail` (progress rail).

## Animation gotchas

- The encapsulation packet (`PacketAssembly.jsx`) uses Framer Motion **`layoutId`
  shared-layout morphs** to shrink/move/zoom pieces between layers. **Never put a
  `transform: scale` (or other transform) on an ancestor of those elements** — it
  silently breaks Framer's layout projection and the morph "goes funny." Fit narrow
  screens with CSS instead (smaller blocks, wrapped `header-group__fields`).
- Respect `prefers-reduced-motion` (via `useReducedMotion`) — animations should
  degrade to quick opacity changes.

## Conventions

- Match the surrounding style; components are commented with intent. Keep comments
  meaningful, not narration.
- Deploy paths: GitHub Pages builds under a subpath via `VITE_BASE`; the default
  (Docker/nginx) build stays at `/`. See README for the Pages/Docker workflows.
