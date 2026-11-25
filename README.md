# ModularDom — web corporativa (V2 cinematogràfica)

Next.js (App Router) · TypeScript · Tailwind CSS 4 · GSAP ScrollTrigger · Lenis.

```bash
npm install
npm run dev        # http://localhost:3000  →  /ca, /es
npm run build
```

## Estructura de la portada

1. **Recorregut** (exterior → entrada → interior → cuina): una sola seqüència de 550 fotogrames lligada al scroll.
2. **Projectes**: el fotograma final es contrau en una làmina i dona pas a la galeria arrossegable.
3. **Sistemes constructius** · 4. **Qualitats i acabats** · 5. **Configurador** · 6. **Procés** · 7. **MINERAL** · 8. **Tancament**.

| Què | On |
|---|---|
| Textos CAT / ES | `src/content/i18n.ts` |
| Estacions del recorregut (quin text surt a quins fotogrames) | `src/content/tour.ts` |
| Motor: càrrega, memòria, inèrcia de càmera, dibuix | `src/components/tour/engine.ts` |
| Scroll, text, indicador, pas a làmina | `src/components/tour/Tour.tsx` |
| Seccions editorials | `src/components/sections/` |
| Vídeos originals 4K (intactes, a l'arrel) i configuració del muntatge | `*.mp4`, `media/tour.json` |
| Fotogrames i retalls generats | `public/tour/{md,sm,hd}/`, `public/stills/` |

## El muntatge

`media/tour.json` defineix quins fotogrames de cada clip s'utilitzen. El clip 1 acaba amb 4 fotogrames
que salten enrere a una imatge fixa, i el clip 2 comença amb aquesta mateixa imatge: s'exclouen
(`to: 356`, `from: 1`) i el moviment queda continu amb un tall directe, sense cap transició.

```bash
npm run tour             # fotogrames (AVIF) + mapa de moviment + retalls; cal ffmpeg (~25 min)
npm run tour -- --stills # només els retalls de les seccions
npm run tour -- --map    # només el mapa de moviment
```

- **md** 1920×1080 per a pantalles horitzontals, **sm** 864×1536 per a mòbils (retall que segueix el
  subjecte, `focus`), **hd** 2560×1440 que només es demana per al fotograma on la càmera s'atura.
- **Mapa de moviment**: reparteix el scroll segons el desplaçament real de la càmera, perquè no hi hagi
  trams lents. `evenness` (0 = ritme original, 1 = totalment uniforme).
- Si es regeneren fotogrames, incrementa `TOUR_VERSION` a `src/content/tour.ts` (memòria cau d'un any).

Per allargar el recorregut: afegeix el clip a `clips`, torna a generar i afegeix una estació a `STATIONS`.

## Imatge de tancament

`03-mansio-nocturna.png` no era al repositori. Mentrestant s'utilitza un fotograma de l'exterior
enfosquit. Per posar la definitiva: desa-la com `public/stills/closing.webp` i canvia `src/content/site.ts`.

## Desplegament

Vercel detecta Next.js sense configuració. Les pàgines porten `noindex` fins al llançament
(`src/app/[lang]/layout.tsx`).
