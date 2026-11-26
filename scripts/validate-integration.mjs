// Validació integral web → CRM amb dades fictícies, contra una previsualització real.
// Ús: WEB_URL=https://<previsualització de la web> [WEB_BYPASS=<secret de Vercel>] node scripts/validate-integration.mjs
// Envia sis formularis pel mateix camí que un visitant (/api/lead). No imprimeix cap secret.
// Què s'ha de veure després al CRM: docs/10-ACTIVACIO-WEB-CRM.md del repositori del CRM, fase 3.
import { randomUUID } from 'node:crypto';

const web = (process.env.WEB_URL || '').replace(/\/$/, '');
if (!/^https:\/\/|^http:\/\/localhost/.test(web)) { console.error('Cal WEB_URL (la previsualització de la web).'); process.exit(2); }
if (/modulardom\.com/.test(web)) { console.error('Això és per a previsualitzacions, no per al domini públic.'); process.exit(2); }
const run = randomUUID().slice(0, 6);
const headers = { 'Content-Type': 'application/json', Origin: web, ...(process.env.WEB_BYPASS ? { 'x-vercel-protection-bypass': process.env.WEB_BYPASS } : {}) };
const config = { metres: 180, habitacions: 3, banys: 2, suite: 'bano', cuina: 'isla', vehicles: 1, safareig: true, installacions: ['aerotermia'], extres: ['piscina'] };
const visual = { floors: 2, system: 'cellular', facade: 'mineral', roof: 'flat', volume: 'compact' };
const base = (o) => ({ lang: 'ca', consent: true, website: '', startedAt: Date.now() - 10_000, city: 'Bellvís', ...o });
const anna = { name: `PROVA Anna Fictícia ${run}`, email: `prova-anna-${run}@example.com`, phone: '600 000 101' };
const second = base({ ...anna, kind: 'quote', page: '/ca/configurador', config: { ...config, metres: 220, habitacions: 4 }, visual: { ...visual, roof: 'green' }, message: 'PROVA: segona configuració, el mateix dia' });
const cases = [
  ['1 pressupost amb configuració', base({ ...anna, kind: 'quote', page: '/ca/configurador', config, visual, plot: 'yes', plotNote: 'PROVA Partida fictícia 3', message: 'PROVA: primera configuració' })],
  ['2 visita (mateix client)', base({ ...anna, kind: 'visit', page: '/ca/contacte' })],
  ['3 informació (una altra persona)', base({ kind: 'info', page: '/ca/contacte', name: `PROVA Bernat Fictici ${run}`, email: `prova-bernat-${run}@example.com`, phone: '600 000 202', message: 'PROVA: informació' })],
  ['4 MINERAL', base({ kind: 'mineral', page: '/ca/mineral', name: `PROVA Carme Fictícia ${run}`, email: `prova-carme-${run}@example.com`, phone: '600 000 303', company: `PROVA Hotel Fictici ${run} SL`, establishment: 'hotel', units: 12 })],
  ['5 segon pressupost del client 1, una altra configuració', second],
  ['6 reintent exacte del 5 (no ha de crear res de nou)', { ...second, startedAt: Date.now() - 9_000 }],
];
let failed = 0;
for (const [label, body] of cases) {
  let line;
  try {
    const r = await fetch(`${web}/api/lead`, { method: 'POST', headers, body: JSON.stringify(body), redirect: 'manual' });
    const j = await r.json().catch(() => null);
    const ok = r.status === 200 && j?.delivered === true;
    if (!ok) failed++;
    line = `${ok ? 'OK ' : 'NO '} ${r.status} ${j ? JSON.stringify(j) : '(resposta no JSON: protecció de Vercel?)'}`;
  } catch (e) { failed++; line = `NO  ${e.message}`; }
  console.log(label.padEnd(58), line);
}
console.log(failed ? `\n${failed} enviament(s) no lliurat(s).` : `\nTot lliurat (sèrie ${run}). Al CRM hi ha d'haver 3 clients, 3 projectes i 5 sol·licituds: comproveu-ho amb la llista de docs/10, fase 3.`);
process.exit(failed ? 1 : 0);
