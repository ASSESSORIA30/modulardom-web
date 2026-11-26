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
| `CRM_PROTECTION_BYPASS` | Només per a proves contra una previsualització del CRM protegida per Vercel (capçalera `x-vercel-protection-bypass`). | buit |
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

## Límits de peticions i antispam

- Cada formulari porta un camp trampa i un temps mínim d'ompliment; només s'accepten peticions
  des de les pàgines de la mateixa web.
- `src/server/rate-limit.ts` limita per adreça dins de cada instància del servidor (atura un
  script insistent).
- El límit **durador** dels formularis és al CRM, a la seva base de dades: per visitant (la web
  hi envia un pseudònim de l'adreça, mai l'adreça), per servidor i global. No cal cap servei
  de pagament. `/api/quote` i `/api/dossier` no recullen dades personals i només tenen el
  límit per instància; si mai se n'abusa, s'hi pot afegir una regla al Firewall de Vercel.

## Privacitat

La pàgina de la política de privacitat encara és buida («Estem preparant aquesta pàgina»).
Mentre `PRIVACY_POLICY.published` sigui `false` a `src/content/site.ts`, **producció no envia cap
formulari al CRM**, encara que les variables estiguin posades. Les previsualitzacions sí, per
poder fer la validació amb dades fictícies.

## Recursos pendents del client

Logotip vectorial · fotografies d'obres reals · models MINERAL ·
text de la política de privacitat · adreça postal si s'ha de publicar.
