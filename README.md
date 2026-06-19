# NetViz

**NetViz** is a collection of beautiful, scroll-driven visualizations of how
networks really work. A home screen lists every visualization, and a pop-out left
menu lets you jump between them.

Current visualizations:

- **Network Encapsulation** — a rectangle representing your data is built up layer
  by layer as you scroll: each layer wraps the previous one in its own header (and,
  at the data-link layer, a trailer), with the newly-added part highlighted and the
  previous bundle nested inside as the payload (**Data → Segment → Packet → Frame →
  Bits**).
- **TLS 1.3 Handshake** — step through the messages that establish a secure channel
  in a single round trip, watching each one cross between client and server.
- **DNS Resolution** — follow a lookup of `www.example.com` as it walks the DNS
  hierarchy (root → TLD → authoritative) and the answer is cached and returned.
- **BGP Routing** — watch a prefix propagate between Autonomous Systems on a topology
  graph, a best path get chosen by shortest AS_PATH, then a link fail and the route
  withdraw and reconverge onto a backup path.

In every visualization you can hover (or keyboard-tab through) any field to read a
detailed explanation of what it does, shown directly under the rectangle.

## Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/) for client-side routing
- [Framer Motion](https://www.framer.com/motion/) for scroll-linked animation

## Adding a new visualization

NetViz is built to be extended. A central **page registry**
(`src/pages/registry.jsx`) is the single source of truth that drives the side menu,
the routes, and the home-screen cards. To add a visualization:

1. Create `src/pages/<Name>Page.jsx` (and optionally `src/data/<name>.js` for its
   content).
2. Add one entry to the `PAGES` array in `src/pages/registry.jsx`:
   `{ id, path, title, tagline, accent, icon, Component }`.

The menu, routing, and home cards update automatically — no other wiring needed.

Reusable building blocks you can lean on:

- `src/components/ScrollDeck.jsx` + `src/hooks/useDeck.js` — the engine behind
  every scroll-driven page: a fixed, full-viewport deck of sections (hero → steps
  → footer) where each discrete gesture (wheel/swipe/key) moves exactly one step.
  A page hands it a `stepCount` and a `renderStage` that animates on `activeIndex`.
- `src/components/PacketBlock.jsx` — a labeled, hoverable rectangle/field.
- `src/components/FieldDetail.jsx` — the explanation panel shown under the diagram.
- `src/components/StepRail.jsx` — the fixed progress rail.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Run with Docker

A multi-stage `Dockerfile` builds the static site with Node and serves it with
nginx, so it runs on any machine with Docker — no local Node install needed.

```bash
docker build -t netviz .
docker run --rm -p 8080:80 netviz
# then open http://localhost:8080
```

## Host on GitHub Pages

A workflow (`.github/workflows/deploy-pages.yml`) builds the site and deploys it to
GitHub Pages on every push to `main`. Two one-time steps:

1. In the repo, go to **Settings → Pages → Build and deployment** and set
   **Source: GitHub Actions**.
2. Merge to `main` (or run the workflow manually from the **Actions** tab).

The site will be served at `https://<user>.github.io/<repo>/` — once the repo is
named NetViz, `https://mattjhann.github.io/NetViz/`.

How it works:

- Project Pages live under a subpath, so the workflow builds with
  `VITE_BASE=/<repo>/` and the router reads `import.meta.env.BASE_URL` as its
  `basename`, so links resolve under the subpath. The default build (Docker/nginx)
  stays at `/`.
- GitHub Pages has no SPA fallback, so the workflow copies `index.html` to
  `404.html`; deep links like `/NetViz/tls` then load and the client-side router
  takes over.

### Continuous builds

`.github/workflows/docker-build.yml` builds the image on every push and pull
request. On the default branch (and version tags) it also publishes the image to
the GitHub Container Registry at `ghcr.io/<owner>/netviz`, tagged with the branch
name, short commit SHA, semver tag, and `latest`.

## How it works

- `src/data/layers.js` — the single source of truth: every layer, its header/trailer
  fields, example values, and hover explanations.
- `src/components/EncapsulationStage.jsx` — a tall scroll track with a pinned (sticky)
  stage; scroll progress is mapped to the active layer.
- `src/components/PacketAssembly.jsx` — recursively renders the concentric
  encapsulation boxes (outermost box = current layer, inner boxes = wrapped payload).
- `src/components/FieldDetail.jsx` — the explanation panel under the rectangle.

The site is a static front-end with no backend — the `dist/` output deploys to any
static host. It respects `prefers-reduced-motion`.
