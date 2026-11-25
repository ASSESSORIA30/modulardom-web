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

- Tour (home): `src/components/journey/` (`timeline.ts` clock, `engine.ts` canvas + loading, `Journey.tsx` scroll + copy). Scenes: `src/content/scenes.ts`; copy CAT/ES: `src/content/i18n.ts`. Adding a scene: see README.
- `public/frames/` (1,200+ generated WebP) and `media/originals/` are binary: never list or read them; regenerate with `npm run frames`.
- Verify with `npm run build` and a Playwright run against `next start`; no test suite yet.

## Conventions

- Do not edit files under `.claude/skills/` by hand; update them with `npx skills add <source> --skill <name> -a claude-code -y` (this also refreshes `skills-lock.json`).
- Default branch: `main`.
