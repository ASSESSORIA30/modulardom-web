import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { dictionaries, type Locale } from '@/content/i18n';
import { COMPANY } from '@/content/site';
import type { EngineInput } from '@/lib/configurator/engine';
import type { PublicQuote } from './quote';
import type { VisualChoices } from './validate';

/*
  The indicative budget as a document: A4, ModularDom's navy and gold, laid out like the budgets
  the company issues (a header band with the company line, a table of concepts without VAT, the
  VAT broken down, the total; then the house, what is included, the quality specification and the
  conditions). Built on the server with pdf-lib.

  Every amount printed comes from the PublicQuote the server has just computed and registered in
  the CRM: no unit price, discount or internal figure can reach this file, and nothing is taken
  from the browser except the picture of the model.
*/

const NAVY = rgb(26 / 255, 39 / 255, 68 / 255);
const GOLD = rgb(176 / 255, 125 / 255, 43 / 255);
const INK = rgb(0.13, 0.15, 0.19);
const MUTE = rgb(0.4, 0.43, 0.48);
const RULE = rgb(0.84, 0.86, 0.89);
const BAND = rgb(0.91, 0.93, 0.96);
const W = 595.28;
const H = 841.89;
const M = 44;
const BOTTOM = 70;

const T = {
  ca: {
    doc: 'Pressupost orientatiu', docFoot: 'Pressupost orientatiu i memòria de qualitats', house: 'Habitatge de', ref: 'Ref.',
    client: 'Client', email: 'Correu', phone: 'Telèfon', town: 'Municipi on vol construir', plot: 'Terreny', plotV: { yes: 'En disposa', no: 'No en disposa', searching: 'En busca' },
    contractor: 'Emet', reference: 'Referència', date: 'Data', valid: 'Vigència', validV: (d: number, until: string) => `${d} dies (fins al ${until})`,
    concept: 'Concepte', amount: 'Import sense IVA', pending: 'Pendent de valorar', base: 'Base imposable',
    vatW: (p: string, b: string) => `IVA obra (${p} % sobre ${b})`, vatA: (p: string, b: string) => `IVA honoraris (${p} % sobre ${b})`, total: 'TOTAL IVA INCLÒS',
    pendingNote: 'Les partides «pendents de valorar» no estan incloses al total: es valoraran en l’estudi tècnic.',
    vatNote: 'Tipus d’IVA subjectes a verificació fiscal segons la naturalesa de l’operació.',
    indicative: 'Pressupost orientatiu, calculat amb la tarifa vigent de ModularDom el dia d’emissió. Està subjecte a estudi tècnic, a les característiques del terreny i al projecte definitiu. No és un contracte d’execució ni una oferta vinculant.',
    yourHouse: 'El teu habitatge', features: 'Característiques', imageNote: 'Visualització conceptual de la configuració triada. No representa el projecte definitiu.',
    surface: 'Superfície construïda', floors: 'Plantes', volume: 'Volumetria', system: 'Sistema constructiu', bedrooms: 'Habitacions', bathrooms: 'Banys', suite: 'Suite principal',
    kitchen: 'Cuina', garage: 'Garatge', climate: 'Climatització', extras: 'Extres', facade: 'Façana', roof: 'Coberta', none: 'Cap', vehicle: 'vehicle', vehicles: 'vehicles',
    roofV: { flat: 'Plana (estàndard)', mono: 'Inclinada d’una aigua', gable: 'A dues aigües' },
    roofArea: (a: string, est: boolean) => `${a} m² de coberta (${est ? 'superfície estimada, a confirmar amb el projecte' : 'superfície mesurada'})`,
    scope: 'Abast i condicions', included: 'Treballs inclosos', includedLead: 'Aquest pressupost comprèn les partides següents:',
    includedArch: 'Els honoraris tècnics inclouen el projecte d’arquitectura i la direcció d’obra.',
    spec: 'Memòria de qualitats', specRoof: 'Coberta',
    exclusions: 'Exclusions', exclusionsV: [
      'No inclou llicències ni taxes municipals, estudi geotècnic ni topogràfic, ni drets d’escomesa, tret d’indicació expressa.',
      'No inclou moviments de terres, condicionament de la parcel·la ni tancaments, que es valoren un cop conegut el terreny.',
      'Qualsevol element que no figuri a la taula de conceptes no forma part d’aquest pressupost.',
    ],
    conditions: 'Condicions comercials', conditionsV: [
      'Imports orientatius. El preu definitiu es fixa al pressupost que ModularDom prepara després de l’estudi tècnic i s’acorda per escrit.',
      'Les opcions de sistema constructiu, façana, coberta i volumetria es concreten al projecte.',
      'Aquest document no reserva data d’execució ni obliga cap de les parts.',
    ],
    contact: 'Contacte', showHouse: 'Casa pilot visitable a Bellvís (Lleida), amb cita prèvia.', tariff: 'Tarifa', page: 'Pàg.',
  },
  es: {
    doc: 'Presupuesto orientativo', docFoot: 'Presupuesto orientativo y memoria de calidades', house: 'Vivienda de', ref: 'Ref.',
    client: 'Cliente', email: 'Correo', phone: 'Teléfono', town: 'Municipio donde quiere construir', plot: 'Terreno', plotV: { yes: 'Dispone de terreno', no: 'No dispone', searching: 'Está buscando' },
    contractor: 'Emite', reference: 'Referencia', date: 'Fecha', valid: 'Vigencia', validV: (d: number, until: string) => `${d} días (hasta el ${until})`,
    concept: 'Concepto', amount: 'Importe sin IVA', pending: 'Pendiente de valorar', base: 'Base imponible',
    vatW: (p: string, b: string) => `IVA obra (${p} % sobre ${b})`, vatA: (p: string, b: string) => `IVA honorarios (${p} % sobre ${b})`, total: 'TOTAL IVA INCLUIDO',
    pendingNote: 'Las partidas «pendientes de valorar» no están incluidas en el total: se valorarán en el estudio técnico.',
    vatNote: 'Tipos de IVA sujetos a verificación fiscal según la naturaleza de la operación.',
    indicative: 'Presupuesto orientativo, calculado con la tarifa vigente de ModularDom el día de emisión. Está sujeto a estudio técnico, a las características del terreno y al proyecto definitivo. No es un contrato de ejecución ni una oferta vinculante.',
    yourHouse: 'Tu vivienda', features: 'Características', imageNote: 'Visualización conceptual de la configuración elegida. No representa el proyecto definitivo.',
    surface: 'Superficie construida', floors: 'Plantas', volume: 'Volumetría', system: 'Sistema constructivo', bedrooms: 'Habitaciones', bathrooms: 'Baños', suite: 'Suite principal',
    kitchen: 'Cocina', garage: 'Garaje', climate: 'Climatización', extras: 'Extras', facade: 'Fachada', roof: 'Cubierta', none: 'Ninguno', vehicle: 'vehículo', vehicles: 'vehículos',
    roofV: { flat: 'Plana (estándar)', mono: 'Inclinada a un agua', gable: 'A dos aguas' },
    roofArea: (a: string, est: boolean) => `${a} m² de cubierta (${est ? 'superficie estimada, a confirmar con el proyecto' : 'superficie medida'})`,
    scope: 'Alcance y condiciones', included: 'Trabajos incluidos', includedLead: 'Este presupuesto comprende las siguientes partidas:',
    includedArch: 'Los honorarios técnicos incluyen el proyecto de arquitectura y la dirección de obra.',
    spec: 'Memoria de calidades', specRoof: 'Cubierta',
    exclusions: 'Exclusiones', exclusionsV: [
      'No incluye licencias ni tasas municipales, estudio geotécnico ni topográfico, ni derechos de acometida, salvo indicación expresa.',
      'No incluye movimientos de tierras, acondicionamiento de la parcela ni cierres, que se valoran una vez conocido el terreno.',
      'Cualquier elemento que no figure en la tabla de conceptos no forma parte de este presupuesto.',
    ],
    conditions: 'Condiciones comerciales', conditionsV: [
      'Importes orientativos. El precio definitivo se fija en el presupuesto que ModularDom prepara tras el estudio técnico y se acuerda por escrito.',
      'Las opciones de sistema constructivo, fachada, cubierta y volumetría se concretan en el proyecto.',
      'Este documento no reserva fecha de ejecución ni obliga a ninguna de las partes.',
    ],
    contact: 'Contacto', showHouse: 'Casa piloto visitable en Bellvís (Lleida), con cita previa.', tariff: 'Tarifa', page: 'Pág.',
  },
};

/** the standard PDF fonts speak Windows-1252: anything else a visitor typed becomes a plain character */
const safe = (s: string) =>
  s
    .replace(/[‘’]/g, '’')
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[^ -~ -ÿ€’‘“”–—…·•]/g, '?');

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of safe(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export type BudgetContact = { name: string; email: string; phone: string | null; city: string | null; plot: 'yes' | 'no' | 'searching' | null };
export type BudgetInput = {
  lang: Locale;
  reference: string;
  contact: BudgetContact;
  config: EngineInput;
  visual: VisualChoices;
  quote: PublicQuote;
  /** JPEG bytes of the 3D model as configured */
  image: Uint8Array | null;
  /** the day the budget was issued (the original day, when the same budget is downloaded again) */
  issued: Date;
};

export async function buildBudget(d: BudgetInput): Promise<Uint8Array> {
  const t = T[d.lang];
  const dict = dictionaries[d.lang];
  const c = dict.configurator;
  const loc = d.lang === 'ca' ? 'ca-ES' : 'es-ES';
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${t.doc} · ModularDom · ${d.reference}`);
  pdf.setAuthor(COMPANY.legalName);
  pdf.setCreationDate(d.issued);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const dateFmt = new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });
  const date = dateFmt.format(d.issued);
  const until = dateFmt.format(new Date(d.issued.getTime() + d.quote.validDays * 864e5));
  const money = (cents: number) => safe(new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100).replace(/[  ]/g, ' '));
  const pctText = (p: number) => String(p).replace('.', ',');
  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    logo = await pdf.embedPng(await readFile(path.join(process.cwd(), 'public', 'brand', 'modulardom-200.png')));
  } catch {
    /* the wordmark alone is enough */
  }

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;
  const newPage = () => {
    page = pdf.addPage([W, H]);
    pages.push(page);
    // header band: the company, as on ModularDom's own budgets
    const x0 = logo ? M + 30 : M;
    if (logo) page.drawImage(logo, { x: M, y: H - 52, width: 22, height: 22 });
    page.drawText('MODULARDOM', { x: x0, y: H - 46, size: 12, font: bold, color: NAVY });
    const line = safe(`${COMPANY.taxId}  |  ${COMPANY.email}  |  ${COMPANY.phoneLabel}`);
    page.drawText(line, { x: W - M - sans.widthOfTextAtSize(line, 8), y: H - 45, size: 8, font: sans, color: MUTE });
    page.drawRectangle({ x: M, y: H - 60, width: W - 2 * M, height: 1.4, color: GOLD });
    y = H - 100;
  };
  const room = (needed: number) => {
    if (y - needed < BOTTOM) newPage();
  };
  const title = (s: string) => {
    room(60);
    page.drawText(safe(s), { x: M + 6, y, size: 22, font: bold, color: NAVY });
    y -= 30;
  };
  const sub = (s: string, size = 13) => {
    room(40);
    page.drawText(safe(s), { x: M + 6, y, size, font: bold, color: GOLD });
    y -= size + 9;
  };
  const para = (s: string, o: { size?: number; color?: ReturnType<typeof rgb>; gap?: number; font?: PDFFont } = {}) => {
    const size = o.size ?? 9.5;
    const lines = wrap(s, o.font ?? sans, size, W - 2 * M - 12);
    room(lines.length * (size + 4.5) + 6);
    for (const l of lines) {
      page.drawText(l, { x: M + 6, y, size, font: o.font ?? sans, color: o.color ?? INK });
      y -= size + 4.5;
    }
    y -= o.gap ?? 6;
  };
  /** "Label: value" on one line, the label in bold */
  const pair = (k: string, v: string) => {
    room(16);
    const label = safe(`${k}: `);
    page.drawText(label, { x: M + 6, y, size: 9.5, font: bold, color: INK });
    const lines = wrap(v, sans, 9.5, W - 2 * M - 12 - bold.widthOfTextAtSize(label, 9.5));
    lines.forEach((l, i) => page.drawText(l, { x: M + 6 + bold.widthOfTextAtSize(label, 9.5), y: y - i * 14, size: 9.5, font: sans, color: INK }));
    y -= 14 * Math.max(1, lines.length);
  };
  /** a two-column table row; `strong` for the totals */
  const cols = { a: M + 8, b: W - M - 8 };
  const tableHead = (a: string, b: string) => {
    room(60);
    page.drawRectangle({ x: M, y: y - 9, width: W - 2 * M, height: 24, color: BAND });
    page.drawText(safe(a), { x: cols.a, y, size: 9.5, font: bold, color: NAVY });
    page.drawText(safe(b), { x: cols.b - bold.widthOfTextAtSize(safe(b), 9.5), y, size: 9.5, font: bold, color: NAVY });
    y -= 26;
  };
  const tableRow = (a: string, b: string, o: { strong?: boolean; note?: string; muted?: boolean } = {}) => {
    const f = o.strong ? bold : sans;
    const lines = wrap(a, f, 9.5, W - 2 * M - 16 - 130);
    const noteLines = o.note ? wrap(o.note, sans, 8, W - 2 * M - 16 - 130) : [];
    room(lines.length * 13 + noteLines.length * 11 + 14);
    lines.forEach((l, i) => page.drawText(l, { x: cols.a, y: y - i * 13, size: 9.5, font: f, color: o.strong ? NAVY : INK }));
    const vb = safe(b);
    page.drawText(vb, { x: cols.b - f.widthOfTextAtSize(vb, 9.5), y, size: 9.5, font: f, color: o.muted ? MUTE : o.strong ? NAVY : INK });
    y -= 13 * lines.length;
    for (const l of noteLines) {
      page.drawText(l, { x: cols.a, y: y - 1, size: 8, font: sans, color: MUTE });
      y -= 11;
    }
    y -= 6;
    page.drawRectangle({ x: M, y: y + 5, width: W - 2 * M, height: 0.5, color: RULE });
    y -= 9;
  };

  /* —— 1. the budget —— */
  newPage();
  title(t.doc);
  sub(`${t.house} ${d.config.metres} m² · ${t.ref} ${d.reference}`);
  y -= 2;
  pair(t.client, d.contact.name);
  pair(t.email, d.contact.email);
  if (d.contact.phone) pair(t.phone, d.contact.phone);
  if (d.contact.city) pair(t.town, d.contact.city);
  if (d.contact.plot) pair(t.plot, t.plotV[d.contact.plot]);
  y -= 6;
  pair(t.contractor, `${COMPANY.legalName} · CIF ${COMPANY.taxId}`);
  pair(t.date, date);
  pair(t.valid, t.validV(d.quote.validDays, until));
  y -= 12;

  tableHead(t.concept, t.amount);
  for (const l of d.quote.lines) {
    tableRow(l.label[d.lang], l.pending ? t.pending : money(l.amountCents), { note: l.detail?.[d.lang], muted: l.pending });
  }
  const archBase = d.quote.lines.filter((l) => l.key === 'arquitecte').reduce((s, l) => s + l.amountCents, 0);
  const worksBase = d.quote.subtotalCents - archBase;
  tableRow(t.base, money(d.quote.subtotalCents), { strong: true });
  tableRow(t.vatW(pctText(d.quote.vatWorksPct), money(worksBase)), money(d.quote.vatWorksCents));
  tableRow(t.vatA(pctText(d.quote.vatArchitectPct), money(archBase)), money(d.quote.vatArchitectCents));
  tableRow(t.total, money(d.quote.totalCents), { strong: true });
  if (d.quote.hasPending) para(t.pendingNote, { size: 8.5, color: GOLD, gap: 2, font: bold });
  para(`${t.vatNote} ${t.tariff} ${d.quote.tariff}.`, { size: 8, color: MUTE, gap: 8 });
  para(t.indicative, { size: 9 });

  /* —— 2. the house —— */
  newPage();
  title(t.yourHouse);
  if (d.image) {
    try {
      const img = await pdf.embedJpg(d.image);
      const w = W - 2 * M;
      const h = Math.min(300, (w * img.height) / img.width);
      const wFit = (h * img.width) / img.height;
      page.drawRectangle({ x: M, y: y - h + 14, width: w, height: h, color: rgb(13 / 255, 21 / 255, 32 / 255) });
      page.drawImage(img, { x: M + (w - wFit) / 2, y: y - h + 14, width: wFit, height: h });
      y -= h - 2;
      para(t.imageNote, { size: 8, color: MUTE, gap: 10 });
    } catch {
      /* an image that is not a JPEG is simply left out */
    }
  }
  sub(t.features);
  const names = (keys: string[], all: readonly string[], labels: string[]) => keys.map((k) => labels[all.indexOf(k)]).filter(Boolean);
  const extras = [...(d.config.safareig ? [c.extras.options[0]] : []), ...names(d.config.extres, ['piscina', 'porche', 'placasSolares'], c.extras.options.slice(1))];
  const climate = names(d.config.installacions, ['aerotermia', 'aireConductos'], c.climate.options);
  const areaText = d.quote.roof?.priced ? t.roofArea(d.quote.roof.areaM2.toFixed(1).replace('.', ','), d.quote.roof.estimated) : null;
  const roofText = t.roofV[d.visual.roof] + (areaText ? ` · ${areaText}` : '');
  tableHead(t.features, '');
  const feature: [string, string][] = [
    [t.surface, `${d.config.metres} m²`],
    [t.floors, c.floors.options[d.visual.floors - 1]],
    [t.volume, c.volume.options[d.visual.volume === 'L' ? 1 : 0]],
    [t.system, c.system.options[d.visual.system === 'timber' ? 1 : 0]],
    [t.facade, c.facade.options[d.visual.facade === 'wood' ? 1 : 0]],
    [t.roof, roofText],
    [t.bedrooms, String(d.config.habitacions)],
    [t.bathrooms, String(d.config.banys)],
    [t.suite, c.suite.options[['sin', 'bano', 'bano_vestidor'].indexOf(d.config.suite)]],
    [t.kitchen, c.kitchen.options[d.config.cuina === 'isla' ? 1 : 0]],
    [t.garage, d.config.vehicles ? `${d.config.vehicles} ${d.config.vehicles === 1 ? t.vehicle : t.vehicles}` : t.none],
    [t.climate, climate.join(', ') || t.none],
    [t.extras, extras.join(', ') || t.none],
  ];
  for (const [k, v] of feature) {
    const lines = wrap(v, sans, 9.5, W - 2 * M - 16 - 170);
    room(lines.length * 13 + 14);
    page.drawText(safe(k), { x: cols.a, y, size: 9.5, font: sans, color: MUTE });
    lines.forEach((l, i) => page.drawText(l, { x: cols.a + 170, y: y - i * 13, size: 9.5, font: sans, color: INK }));
    y -= 13 * lines.length + 6;
    page.drawRectangle({ x: M, y: y + 5, width: W - 2 * M, height: 0.5, color: RULE });
    y -= 9;
  }

  /* —— 3. scope, quality specification, conditions —— */
  newPage();
  title(t.scope);
  sub(t.included);
  para(`${t.includedLead} ${d.quote.lines.filter((l) => !l.pending).map((l) => l.label[d.lang] + (l.detail ? ` (${l.detail[d.lang]})` : '')).join('; ')}.`);
  para(t.includedArch, { gap: 10 });
  sub(t.spec);
  for (const it of dict.materials.spec.items) {
    room(30);
    pair(it.name, it.text);
    y -= 4;
  }
  pair(t.specRoof, roofText);
  y -= 12;
  sub(t.exclusions);
  for (const s of t.exclusionsV) para(s, { gap: 3 });
  y -= 8;
  sub(t.conditions);
  for (const s of [t.indicative, ...t.conditionsV]) para(s, { gap: 3 });
  y -= 8;
  sub(t.contact);
  para(`${COMPANY.legalName} · CIF ${COMPANY.taxId}`, { gap: 0 });
  para(`${COMPANY.email} · ${COMPANY.phoneLabel}`, { gap: 0 });
  para(t.showHouse);

  // footers, once the number of pages is known
  pages.forEach((p, i) => {
    p.drawRectangle({ x: M, y: 52, width: W - 2 * M, height: 0.6, color: RULE });
    p.drawText(safe(`${d.reference}  |  ${t.docFoot}  |  ${date}`), { x: M, y: 38, size: 7.5, font: sans, color: MUTE });
    const n = `${t.page} ${i + 1} / ${pages.length}`;
    p.drawText(n, { x: W - M - sans.widthOfTextAtSize(n, 7.5), y: 38, size: 7.5, font: sans, color: MUTE });
  });
  return pdf.save();
}
