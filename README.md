# GigMapper

A stage-plot and mixer-aware signal-plan tool for a band that runs its own sound. Pairs a to-scale layout canvas (stage, yard/driveway, FOH position — the whole area, not just a riser) with an input list and AUX/monitor grid that know your actual mixer's port constraints, so a wrong routing decision gets flagged before showtime instead of at the venue.

Built for a Yamaha MG16XU; the mixer's ports/AUX sends are data (`src/data/mixerDefinitions.ts`), so another mixer just means adding a new entry there.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run test      # Vitest unit tests
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run test:e2e  # headless Playwright smoke test against a production build (needs Chromium; not run in CI)
```

Everything is client-side and single-user: projects live in `localStorage`, with Export/Import JSON for backup and portability. Two example projects (built from real gig facts) are available from the project list via "Load example".

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes `dist/` on every push to `main`. The **first time**, GitHub Pages needs to be pointed at Actions as its source: repo **Settings → Pages → Build and deployment → Source → GitHub Actions**. After that one-time step, every push to `main` deploys automatically.
