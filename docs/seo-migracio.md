# SEO i migració del domini — ModularDom V5

## Canvis en aquesta branca

- Portada CA/ES amb títol i descripció descriptius (cases industrialitzades, Lleida), sense garanties de preu ni d'eficiència no verificades.
- Pàgines reals de cases a mida, sistemes constructius, procés i empresa. Enllaços cap al configurador i la visita.
- Canonicals i hreflang CA/ES + x-default. Sitemap només amb pàgines amb contingut públic preparat.
- Noindex dels catàlegs buits, l'accés privat i la informació legal en esborrany. Totes les previsualitzacions continuen amb noindex independentment de SITE_INDEXABLE.
- Enllaç de contacte de la secció final corregit.
- Redireccions permanents de l'antic configurador i aliases tècnics:

| Origen | Destinació |
| --- | --- |
| /presupuesto | /es/configurador |
| /presupuesto/index.html | /es/configurador |
| /es/presupuesto | /es/configurador |
| /ca/pressupost | /ca/configurador |
| /index.html | /ca |

La portada antiga és una pàgina amb seccions de tecnologia, procés, projectes i contacte. La nova porta també ancoratges de compatibilitat amb aquests noms en castellà. No s'aplica cap redirecció genèrica per a totes les URL desconegudes.

## Abans de canviar DNS

1. Exportar arxius originals d'IONOS (incloent fitxers ocults, configurador, regles de servidor) i fer inventari de les URL i recursos. Verificar una restauració. Exportar o documentar TOTS els registres DNS actuals, especialment MX, SPF, DKIM i DMARC, que no s'han de tocar.
2. Revisar Search Console (si existeix): exportar pàgines indexades i enllaços, contrastar-los amb el sitemap antic i el contingut de l'allotjament. L'inventari actual s'ha fet amb la portada pública i la ruta /presupuesto; el sitemap antic no ha estat accessible. Completar el mapa amb la resta de rutes reals abans de publicar.
3. Validar la tarifa comercial definitiva, els formularis i PDF de punta a punta i els textos/tractaments de privacitat. Fer còpia del CRM i planificar migracions en producció separadament. No moure clients de proves.
4. Configurar SITE_URL=https://www.modulardom.com exclusivament per producció i preparar la release amb SITE_INDEXABLE desactivat. Comprovar TLS, metadades, rutes, enllaços, PDF, rendiment mòbil i errors abans d'activar la indexació.
5. Amb autorització de publicació, associar www i apex al projecte web correcte, escollir www com a canònic i aplicar només els registres web A/CNAME que Vercel indiqui en aquell moment. No canviar nameservers ni registres de correu. Conservar IONOS i els registres originals per al rollback.
6. Després de validar el desplegament final, activar SITE_INDEXABLE=true només en producció, desplegar i comprovar robots.txt, sitemap.xml, canonicals i redireccions HTTP. Enviar sitemap a Search Console. Revisar 404, cobertura, clics i conversions. Com que es manté el mateix domini, no cal sol·licitar un canvi d'adreça a Search Console.
7. No activar Analytics, Ads ni píxels abans del gestor de consentiment i la revisió de privacitat. Search Console no requereix instal·lar un script de seguiment als visitants.

No s'ha modificat cap DNS, domini, hosting o entorn de producció en aquesta branca.

Referència: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes


## Inventari IONOS verificat el 26/11/2026

Arxiu `ModularDom_backup_2026-11-26.zip` (729 fitxers, CRC correcte). A la branca V5 es recuperen els temes originals de FAQ, article de comparació i AAC amb contingut CA/ES actualitzat i enllaços al configurador únic. No es reprodueixen promeses genèriques d'estalvi, certificacions, testimonis no verificats o el preu per codi postal d'EKOHUS. `public/llms.txt` incorpora les noves rutes.

- `/imperia` → `/ca/configurador` (permanent).
- `/imperia/index.html` → `/ca/configurador` (permanent).
- `/velaris` → `/ca/formigo-cellular` (permanent).
- `/velaris/index.html` → `/ca/formigo-cellular` (permanent).
- `/faq.html` → `/es/preguntas-frecuentes` (permanent).
- `/articulo-blog.html` → `/es/casa-modular-vs-tradicional` (permanent).
- `/contacto` → `/es/contacto` (permanent).
- `/acabados` → `/es/acabados` (temporal).
- `/acabados/index.html` → `/es/acabados` (temporal).

Acabats: 638 JPG, un HTML i una còpia .bak. L'HTML original fa una identificació per DNI al navegador amb una taula de clients de demostració incrustada i carrega imatges externes de mostra; no és un control d'accés. No es copia al directori públic, ni es publica el fitxer .bak, l'administració o enviar.php. La pàgina V5 mostra les qualitats disponibles i explica que la selecció interactiva està pendent. Abans del canvi definitiu del domini, integrar el catàleg real amb autenticació i permisos per projecte al CRM, importar les imatges revisades i verificar la selecció i els extres. No és una recuperació funcional completa del configurador antic.

La calculadora antiga Velaris/EKOHUS queda arxivada: la nova proposta de ModularDom usa una sola font de tarifa, el CRM. No es publica cap formulari antic ni enviament a serveis externs.
