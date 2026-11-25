# Integració amb el CRM de ModularDom (proposta, no activada)

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
Idempotency-Key: <sha256 de correu|9 últims dígits del telèfon|tipus|dia>
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

## Què ha de fer el CRM (pendent, a càrrec de qui el manté)

1. Una ruta `POST /api/web/leads` que:
   - comprovi la signatura i que el timestamp tingui menys de 5 minuts;
   - rebutgi una `Idempotency-Key` ja vista (taula amb clau única);
   - validi el cos amb Zod;
   - amb la clau de servei, creï client + projecte (estat `lead`) + titular, o afegeixi una
     activitat al client existent si el correu o el telèfon coincideixen (mateixes regles que
     `find_client_duplicates`);
   - respongui `201 {id}` o `200 {id, duplicate: true}`.
2. Una funció SQL nova per a aquest ús (per exemple `web_create_lead`), perquè `create_lead`
   exigeix un usuari de direcció.
3. Generar `CRM_LEAD_SECRET` i donar-lo a les dues bandes com a variable d'entorn.

Fins que això existeixi i s'hagi provat en un entorn de proves del CRM, `CRM_LEADS_ENABLED`
ha de continuar apagat. Mentrestant els formularis diuen al visitant que la sol·licitud **no**
s'ha enviat i li donen el correu i el telèfon.

## Observacions de seguretat sobre l'existent (no tocades)

- A la web antiga, `/presupuesto/admin.html` i `/presupuesto/README.txt` són públics.
- La web antiga envia els leads per FormSubmit sense captcha i desa dades personals al
  `localStorage` del navegador.
- Al CRM, les rutes de tarifa no tenen límit de peticions i `/api/health` és pública.
