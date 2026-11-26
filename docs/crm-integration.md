# Integració amb el CRM de ModularDom (preparada, no activada)

Analitzat en mode lectura el repositori `ASSESSORIA30/CRM_MODULARDOM` (commit `a817df9`).
**No s'ha modificat el CRM ni s'hi ha enviat res.**

## Què hi ha avui al CRM

- **Tarifa**: `GET /api/configurador/tarifa` (JSON `{number, effectiveFrom, publishedAt, params}`)
  i `…/tarifa.js`. Pública, sense autenticació. No conté costos ni marges.
- **Leads**: el CRM **no té cap endpoint** per rebre leads de la web. La funció `create_lead`
  exigeix un usuari de direcció (`auth.uid()`), de manera que no serveix per a una crida de
  servidor a servidor; `find_client_duplicates` tampoc.
- **Àrea de clients**: `/portal` (rol client, accés per invitació). La web hi enllaça.

## Què envia la web (ja implementat, apagat)

`POST {CRM_LEAD_URL}` amb JSON, des del servidor de la web:

```
Idempotency-Key: <sha256 de correu|9 últims dígits del telèfon|tipus|dia|contingut de la sol·licitud>
X-ModularDom-Timestamp: <segons Unix>
X-ModularDom-Signature: <hex HMAC-SHA256("<timestamp>.<cos>", CRM_LEAD_SECRET)>
```

```jsonc
{
  "reference": "W261125-AB3K",          // referència web que veu el client
  "capturedAt": "2026-11-25T20:00:00Z",
  "source": "configurador",             // clients.lead_source: "web" | "configurador"
  "kind": "quote",                      // info | quote | visit | mineral
  "page": "/ca/configurador",
  "client":  { "kind": "persona", "display_name": "…", "email": "…", "phone": "…", "locale": "ca", "city": "…" },
  "project": { "municipality": "…", "plot_address": "…", "surface_m2": 180 },
  "configurator": {                     // null si no hi ha configuració
    "input":  { "metres": 180, "habitacions": 3, "banys": 2, "suite": "bano", "cuina": "isla",
                "vehicles": 1, "safareig": true, "installacions": ["aerotermia"], "extres": ["piscina"] },
    "visual": { "floors": 2, "system": "cellular", "facade": "mineral", "roof": "flat", "volume": "compact" },
    "tariff": "7", "totalCents": 12345600   // null mentre els preus estiguin apagats
  },
  "notes": "Terreny: en té (…)\nObservacions del client"
}
```

`configurator.input` és exactament el `ConfigInput` del motor del CRM, per desar-lo tal qual a
`quote_versions.configurator_input`.

La clau d'idempotència identifica una sol·licitud, no una persona: un reintent porta la mateixa
clau i el CRM el descarta; una altra sol·licitud del mateix client el mateix dia (una altra
configuració, un altre missatge) porta una clau diferent i entra com a nova. El cos pot portar
també `"visitor"`: un pseudònim de l'adreça del visitant (HMAC amb el secret, 32 hex) que el CRM
fa servir per al seu límit de peticions persistent i no desa. Si el CRM respon `429`, el
formulari diu «massa intents» i no confirma res.

## Banda del CRM (implementada, apagada)

Feta a `ASSESSORIA30/CRM_MODULARDOM`, branca `feature/web-leads-integration` (sense fusionar);
el detall és al seu `docs/09-INTEGRACIO-WEB-LEADS.md`. La web no ha canviat: el contracte és el
d'aquest document.

- `POST /api/web/leads`: signatura sobre el cos rebut, timestamp de menys de 5 minuts, clau
  d'idempotència i signatura úniques, validació estricta del cos, límit de peticions a la base
  de dades. Respon `201 {id}` o `200 {id, duplicate: true}`; la resta són errors i la web els
  tracta com a «no enviat».
- `web_create_lead` (SQL, només `service_role`): client + projecte en `lead` + titular + activitat
  en una transacció; si el correu o el telèfon ja són d'un client, s'hi afegeix; si les
  coincidències es contradiuen, no fusiona res i avisa direcció. Les visites queden pendents de
  confirmació comercial. No crea pressupostos.
- Variables: al CRM `WEB_LEADS_SECRET` i `WEB_LEADS_ENABLED`; a la web `CRM_LEAD_URL`
  (`https://<domini del CRM>/api/web/leads`), `CRM_LEAD_SECRET` (el mateix secret) i
  `CRM_LEADS_ENABLED`.

Provat de cap a cap amb dades fictícies (aquesta web → la ruta del CRM → Postgres local). Falta
la validació en un projecte de proves de Supabase; fins llavors `CRM_LEADS_ENABLED` continua
apagat i els formularis diuen al visitant que la sol·licitud **no** s'ha enviat i li donen el
correu i el telèfon.

## Observacions de seguretat sobre l'existent (no tocades)

- A la web antiga, `/presupuesto/admin.html` i `/presupuesto/README.txt` són públics.
- La web antiga envia els leads per FormSubmit sense captcha i desa dades personals al
  `localStorage` del navegador.
- Al CRM, les rutes de tarifa no tenen límit de peticions i `/api/health` és pública.
