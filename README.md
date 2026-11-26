# ModularDom — web corporativa (V5)

Next.js (App Router) · TypeScript · Tailwind CSS 4 · GSAP ScrollTrigger · Lenis · three.js.

```bash
npm install
npm run dev        # http://localhost:3000  →  /ca, /es
npm run build
npm test           # motor de pressupost (paritat amb l'original) i regles del servidor
```

## Estructura de la portada

1. **Recorregut** (exterior → entrada → interior → cuina): 550 fotogrames lligats al scroll.
2. **Projectes**: galeria horitzontal. Mostra les obres de `src/content/projects.ts`; mentre és buit, la casa conceptual, etiquetada com a visualització.
3. **Sistemes constructius**: maqueta 3D que es descompon en set capes.
4. **Qualitats i acabats**: catàleg de mostres conceptuals i la memòria de qualitats publicada.
5. **Configurador**: la maqueta respon a cada decisió. Sense preus.
6. **Procés**: sis passos amb un alçat que es dibuixa.
7. **MINERAL**: línia de bungalows, registre B2B.
8. **Tancament i contacte**.

| Què | On |
|---|---|
| Textos CAT / ES | `src/content/i18n.ts` |
| Dades de l'empresa i interruptors pendents del client | `src/content/site.ts` |
| Obres reals · models MINERAL | `src/content/projects.ts` · `src/content/mineral.ts` |
| Motor del recorregut | `src/components/tour/engine.ts` |
| Maqueta 3D: geometria i estat · llum i materials | `src/components/house3d/scene.ts` · `materials.ts` |
| Motor de pressupost · tarifa | `src/lib/configurator/engine.ts` · `tariff.ts` |
| Sortida de formularis (CRM desactivat) | `src/lib/crm.ts` |
| Vídeos originals 4K (intactes, a l'arrel) i muntatge | `*.mp4`, `media/tour.json` |

## Dades verificades (de www.modulardom.com)

Raó social, CIF, correu, telèfon, WhatsApp, Lleida i casa pilot a Bellvís: `COMPANY` a `site.ts`.
Memòria de qualitats: text publicat al configurador actual. Paleta: blau marí, crema i daurat de la web actual.
Logotip: l'únic fitxer publicat és un PNG de 200 px (`public/brand/`), usat a la icona i al peu.
Els «proyectos realizados» de la web actual semblen renders i **no** s'utilitzen com a obres reals.

## Configurador, pressupost, formularis i dossier

- Pàgines pròpies: `/configurador`, `/projectes` (`/es/proyectos`), `/mineral`, `/contacte` (`/es/contacto`).
- Les preguntes són les del configurador actual de ModularDom; `src/lib/configurator/engine.ts` és el seu
  motor, portat línia per línia i provat contra l'original (`tests/engine.test.ts`).
- **Cap preu al repositori ni al navegador.** El servidor llegeix la tarifa del CRM i `POST /api/quote`
  només retorna imports finals. `POST /api/lead` valida, filtra spam i signa; `POST /api/dossier` fa el PDF.
- Tot està apagat per defecte. Com s'activa: `docs/operations.md`. Contracte amb el CRM: `docs/crm-integration.md`.

## Interruptors de contingut (`src/content/site.ts`)

Reclam de preu («des de 993 €/m²») · logotip vectorial · WhatsApp (número verificat, botó apagat) ·
àrea de clients (enllaç al portal del CRM, apagat). La imatge nocturna definitiva ja és al tancament (`media/03-mansio-nocturna.png`).
Obres reals: `src/content/projects.ts`. Models MINERAL: `src/content/mineral.ts`.

## El muntatge del recorregut

`media/tour.json` defineix quins fotogrames de cada clip s'utilitzen. El clip 1 acaba amb 4 fotogrames
que salten enrere a una imatge fixa, i el clip 2 comença amb aquesta mateixa imatge: s'exclouen
(`to: 356`, `from: 1`) i el moviment queda continu amb un tall directe.

```bash
npm run tour             # fotogrames (AVIF) + mapa de moviment + retalls; cal ffmpeg (~25 min)
npm run tour -- --stills # només els retalls de les seccions
npm run tour -- --map    # només el mapa de moviment
```

Si es regeneren fotogrames, incrementa `TOUR_VERSION` a `src/content/tour.ts` (memòria cau d'un any).

## Desplegament

Vercel detecta Next.js sense configuració. Les pàgines porten `noindex` fins al llançament
(`src/app/[lang]/layout.tsx`). Branques: `main` = V1, `redesign/cinematic-v2`, `-v3` (base aprovada), `-v4`.
