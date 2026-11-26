# Operació: què està apagat i com s'encén

Tot el que toca dades reals està **desactivat per defecte**. S'activa amb variables d'entorn al
servidor (Vercel → Settings → Environment Variables), mai amb codi que arribi al navegador.

| Variable | Què fa | Per defecte |
|---|---|---|
| `CRM_TARIFF_URL` | Adreça JSON de la tarifa publicada pel CRM (`…/api/configurador/tarifa`). El servidor la llegeix; el navegador mai. | buida: no es calcula res |
| `PRICING_PUBLIC` | `true` perquè el configurador mostri el pressupost orientatiu i es pugui descarregar. Cal també la tarifa. | apagat |
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
  de pagament. `/api/quote` no recull dades personals i només té el
  límit per instància; si mai se n'abusa, s'hi pot afegir una regla al Firewall de Vercel.

## Descàrrega del pressupost

Calen les tres coses alhora: tarifa publicada (`CRM_TARIFF_URL`), `PRICING_PUBLIC=true` i la recepció
de leads activa. Si en falta cap, el botó no lliura cap PDF i el visitant veu que no s'ha enviat res.
A producció, a més, cal la política de privacitat publicada (vegeu a sota). Les rutes del CRM
(`/api/web/quotes`, `/pdf`, `/recover`, `/visit`) es dedueixen de `CRM_LEAD_URL`: no hi ha cap variable nova.

## Privacitat

Les pàgines de privacitat, avís legal i galetes són a `src/content/legal.ts` (CA/ES), accessibles
al peu i als formularis. Mentre `PRIVACY_POLICY.published` sigui `false` a `src/content/site.ts`,
**producció no envia cap formulari al CRM**, encara que les variables estiguin posades. Les
previsualitzacions sí, amb dades fictícies. Abans d'activar l'interruptor, direcció ha de validar
els textos, els contractes d'encàrrec amb Vercel i Supabase, els mecanismes de transferència,
els criteris de conservació i el procediment d'exercici de drets i supressió. Verificar també
els accessos dels rols i el comportament real de galetes/emmagatzematge al domini final.
No activar Analytics, píxels ni altres tecnologies no necessàries fins que hi hagi un gestor
que bloquegi aquestes tecnologies abans del consentiment, amb acceptació i rebuig equivalents.
Fonts: BORME-A-2026-62-25 (31/03/2026), RGPD art. 13, LSSI art. 10 i 22 i Guia de galetes AEPD.

## Recursos pendents del client

Logotip vectorial · fotografies d'obres reals · models MINERAL ·
validació dels textos legals i dels tractaments efectius abans de l'activació a producció.
