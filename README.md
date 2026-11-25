# ModularDom — web corporativa

Next.js (App Router) · TypeScript · Tailwind CSS 4 · GSAP ScrollTrigger · Lenis.

```bash
npm install
npm run dev        # http://localhost:3000  →  /ca, /es
npm run build
```

## El recorregut

La portada és un recorregut per la casa lligat al scroll: cada escena és una seqüència de
fotogrames dibuixada en un `<canvas>`, endavant i enrere.

| Què | On |
|---|---|
| Llista d'escenes, ordre, posició del text | `src/content/scenes.ts` |
| Textos CAT / ES i menú | `src/content/i18n.ts` |
| Rellotge del recorregut i solapament de les transicions | `src/components/journey/timeline.ts` |
| Càrrega progressiva, memòria i dibuix | `src/components/journey/engine.ts` |
| Scroll, animació del text, indicador | `src/components/journey/Journey.tsx` |
| Vídeos originals (intactes) | `media/originals/` |
| Fotogrames generats | `public/frames/<escena>/{lg,sm}/` |

### Afegir una escena (suite, bany, despatx, terrassa, exterior nocturn)

1. Copia el vídeo a `media/originals/` i afegeix-lo a `media/scenes.json` (`focusX` és el punt
   horitzontal que es conserva en pantalles verticals).
2. `npm run frames` (cal `ffmpeg`): genera els fotogrames i actualitza `src/content/frames.json`.
3. Afegeix l'escena a `SCENES` (`src/content/scenes.ts`) i els seus textos a `i18n.ts`.

La llargada del scroll, l'indicador i les transicions s'ajusten sols. Si es regeneren fotogrames
d'una escena existent, incrementa `FRAMES_VERSION`.

## Desplegament

Vercel detecta Next.js sense configuració. Les pàgines porten `noindex` fins al llançament
(`src/app/[lang]/layout.tsx`).
