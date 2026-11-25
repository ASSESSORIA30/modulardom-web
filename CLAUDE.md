# ModularDom web

Corporate website for ModularDom (Next.js). Project-level skills live in `.claude/skills/`; sources and pinned commits are in `skills-lock.json`.

## Token budget rules

- **Load only the skills the task needs.** Never invoke several overlapping skills "just in case". Pick by task:
  - New page/section visual design: `design-taste-frontend` (primary) **or** `frontend-design`, not both.
  - React/Next.js code, data fetching, performance: `vercel-react-best-practices`.
  - Building motion: `animate`. Reviewing motion: `review-animations`. Gesture/spring/material feel: `apple-design`.
  - Component polish and interaction details: `emil-design-eng`.
  - Mobile behaviour (100vh, tap states, notch, PWA): `mobile-native`.
  - Edge-case stress test of a component: `break-ui`.
  - Browser checks and screenshots: `webapp-testing`.
- **design-taste-frontend is large (~1,600 files).** Read its `SKILL.md`, then only the specific `references/*.md` or `assets/<folder>/` it points to for the current step. Never list, grep or read `assets/` wholesale (icons, photos and objects are thousands of files).
- **No bulk reads.** Search with targeted Grep/Glob before opening files; read files in ranges when they are long. Do not read `node_modules/`, `.next/`, lockfiles or generated output.
- **Don't repeat checks.** Don't re-run builds, tests, installs or file reads whose result is already known and unaffected by later changes. Re-verify only after a relevant edit.
- **Delegate wide searches** to a subagent only when they would otherwise pull many files into context.
- Keep answers and reports short; no restating of file contents already shown.

## Project map

- Home = scroll-driven tour + editorial sections. Tour: `src/components/tour/` (`engine.ts` camera/loading/decoding, `Tour.tsx` scroll, copy, plate hand-over). 3D house: `src/components/house3d/` (`scene.ts` geometry/state, `materials.ts` generated environment and textures; plain three.js, lazy chunk; used by Systems and Configurator; `?house3d=hq` pins quality for screenshots). Budget engine: `src/lib/configurator/` (ported from ModularDom's own; ships with no tariff). Sections: `src/components/sections/`. Copy CAT/ES: `src/content/i18n.ts`. Client-pending switches: `src/content/site.ts`.
- `public/tour/` (1,650 generated AVIF), `public/stills/` and the root `*.mp4` sources are binary: never list or read them. Rebuild with `npm run tour` (see README); `src/content/tour.json` and `stills.json` are generated too.
- Verify with `npm run build` and a Playwright run against `next start` (WebGL needs `--use-angle=swiftshader --enable-unsafe-swiftshader`); no test suite yet.
- Branches: `main` = V1, `redesign/cinematic-v2` = V2, `redesign/cinematic-v3` = V3 (approved base), `redesign/cinematic-v4` = V4 (awaiting client approval; do not merge).
- No invented data: no prices, projects, models, certifications or deadlines. Company facts come only from www.modulardom.com (`COMPANY` in `site.ts`); its "proyectos realizados" look like renders and are NOT used as built work. Concept images are labelled as such.

## Conventions

- Do not edit files under `.claude/skills/` by hand; update them with `npx skills add <source> --skill <name> -a claude-code -y` (this also refreshes `skills-lock.json`).
- Default branch: `main`.
