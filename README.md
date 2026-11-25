# ModularDom — web corporativa (V3)

Next.js (App Router) · TypeScript · Tailwind CSS 4 · GSAP ScrollTrigger · Lenis.

```bash
npm install
npm run dev        # http://localhost:3000  →  /ca, /es
npm run build
```

## Estructura de## Estructura de la portada

1. **Recorregut** (exterior → entrada → interior → cuina): una seqüència de 550 fotogrames lligada al scroll.
2. **Projectes**: galeria de desplaçament horitzontal. Mostra les obres de `src/content/projects.ts`; mentre és buit, la casa conceptual, etiquetada com a visualització.
3. **Sistemes constructius**: casa 3D (three.js) que es descompon en set capes amb el scroll.
4. **Qualitats i acabats**: catàleg de mostres conceptuals per famílies.
5. **Configurador**: set decisions amb el model 3D responent. Sense preus ni fórmules.
6. **Procés**: sis passos amb un alçat que es dibuixa.
7. **MINERAL**: línia de bungalows, registre B2B, sol·licitud de pressupost per unitats.
8. **Tancament**.

| Què | On |
|---|---|
| Textos CAT / ES | `src/content/i18n.ts` |
| Interruptors pendents del client (preu, logotip, WhatsApp, CRM, imatge final) | `src/content/site.ts` |
| Obres reals | `src/content/projects.ts` |
| Estacions del recorregut | `src/content/tour.ts` |
| Motor del recorregut (càmera, càrrega, descodificació, mides) | `src/components/tour/engine.ts` |
| Escena 3D (geometria, capes, configuració) | `src/components/house3d/scene.ts` |
| Seccions | `src/components/sections/` |
| Sortida de formularis (CRM desactivat) | `src/lib/crm.ts` |
| Vídeos originals 4K (intactes, a l'arrel) i muntatge | `*.mp4`, `media/tour.json` |

### Coses a activar quan hi hagi dades

- **Reclam de preu** («des de 993 €/m²»): `PRICE_CLAIM.enabled` a `site.ts`. Ja està maquetat a la portada.
- **Logotip**: copia el fitxer a `public/brand/` i posa'n la ruta a `LOGO.src`.
- **WhatsApp**: `WHATSAPP` amb el número verificat.
- **CRM**: `CRM.endpoint` + `CRM.enabled`; tots els formularis passen per `submitLead()`.
- **Imatge nocturna**: `public/stills/closing.webp` i `CLOSING` a `site.ts`.

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

## Desplegament

Vercel detecta Next.js sense configuració. Les pàgines porten `noindex` fins al llançament
(`src/app/[lang]/layout.tsx`).
