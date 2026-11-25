# Operació: què està apagat i com s'encén

Tot el que toca dades reals està **desactivat per defecte**. S'activa amb variables d'entorn al
servidor (Vercel → Settings → Environment Variables), mai amb codi que arribi al navegador.

| Variable | Què fa | Per defecte |
|---|---|---|
| `CRM_TARIFF_URL` | Adreça JSON de la tarifa publicada pel CRM (`…/api/configurador/tarifa`). El servidor la llegeix; el navegador mai. | buida: no es calcula res |
| `PRICING_PUBLIC` | `true` perquè el configurador i el dossier mostrin el pressupost orientatiu. Cal també la tarifa. | apagat |
| `CRM_LEAD_URL` | Endpoint del CRM que rep els leads (vegeu `crm-integration.md`). | buida |
| `CRM_LEAD_SECRET` | Secret compartit per signar cada lead (HMAC-SHA256). | buit |
| `CRM_LEADS_ENABLED` | `true` per enviar leads de debò. Calen les dues anteriors. | apagat |
| `ADMIN_TOKEN` | Token per a `/api/admin/tariff`. Sense ell, la ruta respon 404. | buit |
| `SITE_URL` | Adreça pública (canonical, sitemap, dades estructurades). | la de Vercel |
| `SITE_INDEXABLE` | `true` només a producció: treu el `noindex` i obre `robots.txt`. | apagat |

Interruptors de contingut (no secrets) a `src/content/site.ts`: reclam de preu, logotip, WhatsApp,
àrea de clients, imatge de tancament.

## Preus: on són i on no

- La tarifa viu al CRM (Administració › Tarifes) i només hi tenen accés els usuaris de direcció.
  Aquesta web **no en té cap còpia**: ni al repositori, ni a `public/`, ni al JavaScript del client.
- `POST /api/quote` calcula al servidor i retorna només un import per concepte, l'IVA i el total.
  No retorna preus unitaris, imports abans de descompte ni percentatges (`src/server/quote.ts`).
- Administració de tarifes: es fa al CRM. `/api/admin/tariff` (amb `ADMIN_TOKEN`) només permet
  comprovar quina tarifa fa servir la web i forçar que la torni a llegir; no retorna preus.
- Proves: `npm test` (31 proves; inclou la paritat amb el motor original de ModularDom).

## Límits de peticions

`src/server/rate-limit.ts` limita per adreça IP dins de cada instància del servidor. Atura un
script insistent, però no un atac distribuït: **abans d'activar les integracions**, posa-hi un
límit durador (regles del Firewall de Vercel o un comptador en KV).

## Recursos pendents del client

Logotip vectorial · `03-mansio-nocturna.png` · fotografies d'obres reals · models MINERAL ·
text de la política de privacitat · adreça postal si s'ha de publicar.
