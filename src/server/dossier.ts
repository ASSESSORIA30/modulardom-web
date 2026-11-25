import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { dictionaries, type Locale } from '@/content/i18n';
import { COMPANY } from '@/content/site';
import type { EngineInput } from '@/lib/configurator/engine';
import type { PublicQuote } from './quote';
import type { VisualChoices } from './validate';

/*
  The commercial dossier: two A4 pages in the site's own register (navy, cream, gold, a serif for
  what is said and a grotesque for what is listed). Built on the server with pdf-lib, the library
  the CRM uses for its own quotes.

  It prints what the visitor chose, ModularDom's published quality specification and conditions,
  and, only when prices are switched on, the public budget (one amount per concept). No unit
  price, discount or internal figure can reach it: it is given a PublicQuote, never the tariff.
*/

const NAVY = rgb(13 / 255, 21 / 255, 32 / 255);
const CREAM = rgb(242 / 255, 238 / 255, 229 / 255);
const GOLD = rgb(201 / 255, 168 / 255, 76 / 255);
const INK = rgb(0.1, 0.13, 0.17);
const MUTE = rgb(0.38, 0.4, 0.43);
const RULE = rgb(0.78, 0.75, 0.69);
const W = 595.28;
const H = 841.89;
const M = 48;

const T = {
  ca: {
    title: 'Dossier de configuració', for: 'Preparat per a', ref: 'Referència', date: 'Data', valid: 'Vigència', days: 'dies', house: 'La teva casa',
    surface: 'Superfície', floors: 'Plantes', system: 'Sistema constructiu', bedrooms: 'Habitacions', bathrooms: 'Banys', suite: 'Suite principal', kitchen: 'Cuina',
    garage: 'Garatge', climate: 'Climatització', extras: 'Extres', facade: 'Façana', roof: 'Coberta', volume: 'Volumetria', none: 'Cap', vehicles: 'vehicles', vehicle: 'vehicle',
    spec: 'Memòria de qualitats', budget: 'Pressupost orientatiu', subtotal: 'Base imposable', vatWorks: 'IVA obra', vatArch: 'IVA honoraris d’arquitecte', total: 'Total',
    noPrice: 'El pressupost detallat el prepara l’equip de ModularDom a partir d’aquesta configuració.', tariff: 'Tarifa',
    conditions: 'Condicions i exclusions',
    cond: [
      'Pressupost orientatiu subjecte a projecte tècnic, ubicació, accessibilitat i amidaments finals.',
      'Inclou projecte d’arquitectura i direcció d’obra. No inclou llicències ni taxes municipals tret d’indicació expressa.',
      'Les opcions de sistema constructiu, façana, coberta i volumetria es concreten al projecte.',
    ],
    concept: 'Visualització conceptual de la configuració. No representa el projecte definitiu.',
    showHouse: 'Casa pilot visitable a Bellvís (Lleida).',
  },
  es: {
    title: 'Dossier de configuración', for: 'Preparado para', ref: 'Referencia', date: 'Fecha', valid: 'Vigencia', days: 'días', house: 'Tu casa',
    surface: 'Superficie', floors: 'Plantas', system: 'Sistema constructivo', bedrooms: 'Habitaciones', bathrooms: 'Baños', suite: 'Suite principal', kitchen: 'Cocina',
    garage: 'Garaje', climate: 'Climatización', extras: 'Extras', facade: 'Fachada', roof: 'Cubierta', volume: 'Volumetría', none: 'Ninguno', vehicles: 'vehículos', vehicle: 'vehículo',
    spec: 'Memoria de calidades', budget: 'Presupuesto orientativo', subtotal: 'Base imponible', vatWorks: 'IVA obra', vatArch: 'IVA honorarios de arquitecto', total: 'Total',
    noPrice: 'El presupuesto detallado lo prepara el equipo de ModularDom a partir de esta configuración.', tariff: 'Tarifa',
    conditions: 'Condiciones y exclusiones',
    cond: [
      'Presupuesto orientativo sujeto a proyecto técnico, ubicación, accesibilidad y mediciones finales.',
      'Incluye proyecto de arquitectura y dirección de obra. No incluye licencias ni tasas municipales salvo indicación expresa.',
      'Las opciones de sistema constructivo, fachada, cubierta y volumetría se concretan en el proyecto.',
    ],
    concept: 'Visualización conceptual de la configuración. No representa el proyecto definitivo.',
    showHouse: 'Casa piloto visitable en Bellvís (Lleida).',
  },
};

/** the standard PDF fonts speak Windows-1252: anything else a visitor typed becomes a plain character */
const safe = (s: string) =>
  s
    .replace(/[‘’]/g, '’')
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[^ -~ -ÿ€’‘“”–—…·•]/g, '?');

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

export type DossierInput = {
  lang: Locale;
  reference: string;
  name: string | null;
  city: string | null;
  config: EngineInput;
  visual: VisualChoices;
  quote: PublicQuote | null;
  /** JPEG bytes of the 3D model as configured */
  image: Uint8Array | null;
  now?: Date;
};

export async function buildDossier(d: DossierInput): Promise<Uint8Array> {
  const t = T[d.lang];
  const dict = dictionaries[d.lang];
  const c = dict.configurator;
  const now = d.now ?? new Date();
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${t.title} · ModularDom · ${d.reference}`);
  pdf.setAuthor(COMPANY.legalName);
  pdf.setCreationDate(now);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const date = new Intl.DateTimeFormat(d.lang === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const money = (cents: number) => safe(new Intl.NumberFormat(d.lang === 'ca' ? 'ca-ES' : 'es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100).replace(/ | /g, ' '));

  /* —— page 1: the cover —— */
  const p1 = pdf.addPage([W, H]);
  p1.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });
  try {
    const logo = await pdf.embedPng(await readFile(path.join(process.cwd(), 'public', 'brand', 'modulardom-200.png')));
    p1.drawImage(logo, { x: M, y: H - M - 62, width: 62, height: 62 });
  } catch {
    p1.drawText('ModularDom', { x: M, y: H - M - 24, size: 20, font: serif, color: CREAM });
  }
  const meta: [string, string][] = [[t.ref, d.reference], [t.date, date], [t.valid, `${d.quote?.validDays ?? 30} ${t.days}`]];
  meta.forEach(([k, v], i) => {
    const y = H - M - 12 - i * 22;
    p1.drawText(safe(k), { x: W - M - 150, y, size: 8, font: sans, color: GOLD });
    p1.drawText(safe(v), { x: W - M - 150 + 62, y, size: 9.5, font: sans, color: CREAM });
  });
  p1.drawText(safe(t.title), { x: M, y: H - 188, size: 34, font: serif, color: CREAM });
  if (d.name) {
    p1.drawText(safe(t.for), { x: M, y: H - 222, size: 9, font: sans, color: GOLD });
    p1.drawText(safe(d.name + (d.city ? ` · ${d.city}` : '')), { x: M, y: H - 244, size: 17, font: italic, color: CREAM });
  }
  let y = H - 290;
  if (d.image) {
    try {
      const img = await pdf.embedJpg(d.image);
      const w = W - 2 * M;
      const h = Math.min(340, (w * img.height) / img.width);
      p1.drawImage(img, { x: M, y: y - h, width: w, height: h });
      y -= h + 14;
      p1.drawText(safe(t.concept), { x: M, y, size: 7.5, font: sans, color: rgb(0.62, 0.65, 0.7) });
      y -= 34;
    } catch {
      /* an image that is not a JPEG is simply left out */
    }
  }
  const floors = c.floors.options[d.visual.floors - 1];
  const system = c.system.options[d.visual.system === 'timber' ? 1 : 0];
  for (const line of wrap(`${d.config.metres} m² · ${floors} · ${system}`, serif, 22, W - 2 * M)) {
    p1.drawText(line, { x: M, y, size: 22, font: serif, color: CREAM });
    y -= 28;
  }
  p1.drawRectangle({ x: M, y: 74, width: W - 2 * M, height: 0.6, color: GOLD });
  p1.drawText(safe(`${COMPANY.email}   ·   ${COMPANY.phoneLabel}   ·   ${t.showHouse}`), { x: M, y: 54, size: 9, font: sans, color: CREAM });

  /* —— page 2 onwards: the sheet —— */
  const footer = (page: PDFPage) => {
    page.drawRectangle({ x: M, y: 62, width: W - 2 * M, height: 0.5, color: RULE });
    page.drawText(safe(`${COMPANY.legalName} · CIF ${COMPANY.taxId} · ${COMPANY.email} · ${COMPANY.phoneLabel}`), { x: M, y: 46, size: 7.5, font: sans, color: MUTE });
    page.drawText(safe(`${d.reference} · ${date}`), { x: M, y: 34, size: 7.5, font: sans, color: MUTE });
  };
  const sheet = () => {
    const page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
    footer(page);
    y = H - M - 20;
    return page;
  };
  let p2 = sheet();
  /** start a new sheet if what comes next would run into the footer */
  const room = (needed: number) => {
    if (y - needed < 84) p2 = sheet();
  };
  const heading = (_page: PDFPage, s: string) => {
    const page = p2;
    page.drawText(safe(s), { x: M, y, size: 19, font: serif, color: INK });
    y -= 12;
    page.drawRectangle({ x: M, y, width: W - 2 * M, height: 0.8, color: INK });
    y -= 20;
  };
  const row = (k: string, v: string) => {
    p2.drawText(safe(k), { x: M, y, size: 9, font: sans, color: MUTE });
    const lines = wrap(v, sans, 10, W - 2 * M - 170);
    lines.forEach((l, i) => p2.drawText(l, { x: M + 170, y: y - i * 13, size: 10, font: sans, color: INK }));
    y -= 13 * lines.length + 5;
    p2.drawRectangle({ x: M, y: y + 4, width: W - 2 * M, height: 0.4, color: RULE });
    y -= 9;
  };
  heading(p2, t.house);
  const names = (keys: string[], all: readonly string[], labels: string[]) => keys.map((k) => labels[all.indexOf(k)]).filter(Boolean);
  const extras = [...(d.config.safareig ? [c.extras.options[0]] : []), ...names(d.config.extres, ['piscina', 'porche', 'placasSolares'], c.extras.options.slice(1))];
  const climate = names(d.config.installacions, ['aerotermia', 'aireConductos'], c.climate.options);
  row(t.surface, `${d.config.metres} m²`);
  row(t.floors, floors);
  row(t.volume, c.volume.options[d.visual.volume === 'L' ? 1 : 0]);
  row(t.system, system);
  row(t.bedrooms, String(d.config.habitacions));
  row(t.bathrooms, String(d.config.banys));
  row(t.suite, c.suite.options[['sin', 'bano', 'bano_vestidor'].indexOf(d.config.suite)]);
  row(t.kitchen, c.kitchen.options[d.config.cuina === 'isla' ? 1 : 0]);
  row(t.garage, d.config.vehicles ? `${d.config.vehicles} ${d.config.vehicles === 1 ? t.vehicle : t.vehicles}` : t.none);
  row(t.climate, climate.join(', ') || t.none);
  row(t.extras, extras.join(', ') || t.none);
  row(t.facade, c.facade.options[d.visual.facade === 'wood' ? 1 : 0]);
  row(t.roof, c.roof.options[d.visual.roof === 'green' ? 1 : 0]);

  y -= 10;
  room(d.quote ? 60 + d.quote.lines.length * 15 + 110 : 90);
  heading(p2, t.budget);
  if (d.quote) {
    for (const l of d.quote.lines) {
      p2.drawText(safe(l.label[d.lang] + (l.detail ? ` · ${l.detail[d.lang]}` : '')), { x: M, y, size: 9.5, font: sans, color: INK });
      const v = money(l.amountCents);
      p2.drawText(v, { x: W - M - sans.widthOfTextAtSize(v, 9.5), y, size: 9.5, font: sans, color: INK });
      y -= 15;
    }
    y -= 3;
    for (const [k, v] of [[t.subtotal, d.quote.subtotalCents], [t.vatWorks, d.quote.vatWorksCents], [t.vatArch, d.quote.vatArchitectCents]] as const) {
      p2.drawText(safe(k), { x: M, y, size: 9, font: sans, color: MUTE });
      const s = money(v);
      p2.drawText(s, { x: W - M - sans.widthOfTextAtSize(s, 9), y, size: 9, font: sans, color: MUTE });
      y -= 14;
    }
    p2.drawRectangle({ x: M, y: y + 6, width: W - 2 * M, height: 0.8, color: INK });
    y -= 16;
    p2.drawText(safe(t.total), { x: M, y, size: 11, font: bold, color: INK });
    const tot = money(d.quote.totalCents);
    p2.drawText(tot, { x: W - M - serif.widthOfTextAtSize(tot, 22), y: y - 3, size: 22, font: serif, color: INK });
    y -= 22;
    p2.drawText(safe(`${t.tariff} ${d.quote.tariff}`), { x: M, y, size: 7.5, font: sans, color: MUTE });
    y -= 22;
  } else {
    for (const l of wrap(t.noPrice, italic, 12, W - 2 * M)) {
      p2.drawText(l, { x: M, y, size: 12, font: italic, color: INK });
      y -= 16;
    }
    y -= 12;
  }

  room(50 + dict.materials.spec.items.length * 34);
  heading(p2, t.spec);
  for (const it of dict.materials.spec.items) {
    p2.drawText(safe(it.name), { x: M, y, size: 9, font: bold, color: INK });
    const lines = wrap(it.text, sans, 9, W - 2 * M - 170);
    lines.forEach((l, i) => p2.drawText(l, { x: M + 170, y: y - i * 12, size: 9, font: sans, color: INK }));
    y -= 12 * lines.length + 7;
  }
  y -= 8;
  room(30 + t.cond.length * 26);
  p2.drawText(safe(t.conditions), { x: M, y, size: 9, font: bold, color: INK });
  y -= 14;
  for (const cnd of t.cond) {
    for (const l of wrap(cnd, sans, 8, W - 2 * M)) {
      p2.drawText(l, { x: M, y, size: 8, font: sans, color: MUTE });
      y -= 10.5;
    }
    y -= 2;
  }
  return pdf.save();
}
