import type { EngineInput } from '@/lib/configurator/engine';

/* Hand-written validation: every field is checked and rebuilt, nothing a client sends is passed on as it came. */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const int = (v: unknown, min: number, max: number): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null);
const oneOf = <T extends string>(v: unknown, opts: readonly T[]): T | null => (typeof v === 'string' && (opts as readonly string[]).includes(v) ? (v as T) : null);
/** trimmed text without control characters, or null if empty or too long */
export const text = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const t = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  return t.length > 0 && t.length <= max ? t : null;
};
const keys = (v: unknown, allowed: readonly string[]): string[] | null =>
  Array.isArray(v) && v.length <= allowed.length && v.every((k) => typeof k === 'string' && allowed.includes(k)) ? [...new Set(v as string[])] : null;

export const CLIMATE_KEYS = ['aerotermia', 'aireConductos'] as const;
export const EXTRA_KEYS = ['piscina', 'porche', 'placasSolares'] as const;

/** the visitor's choices that the budget engine prices */
export function parseEngineInput(v: unknown): EngineInput | null {
  if (!isObj(v)) return null;
  const metres = int(v.metres, 1, 2000);
  const habitacions = int(v.habitacions, 1, 12);
  const banys = int(v.banys, 1, 12);
  const suite = oneOf(v.suite, ['sin', 'bano', 'bano_vestidor'] as const);
  const cuina = oneOf(v.cuina, ['basica', 'isla'] as const);
  const vehicles = int(v.vehicles, 0, 8);
  const installacions = keys(v.installacions, CLIMATE_KEYS);
  const extres = keys(v.extres, EXTRA_KEYS);
  if (metres === null || habitacions === null || banys === null || !suite || !cuina || vehicles === null || typeof v.safareig !== 'boolean' || !installacions || !extres) return null;
  // floors and roof arrived later: absent in an older configuration, which then means one floor and a flat roof.
  // A measured roof area is never taken from a visitor: that is entered in the CRM.
  const plantes = v.plantes === undefined ? 1 : (int(v.plantes, 1, 2) as 1 | 2 | null);
  const coberta = v.coberta === undefined ? 'plana' : oneOf(v.coberta, ['plana', 'inclinada', 'dues_aigues'] as const);
  if (!plantes || !coberta) return null;
  return { metres, habitacions, banys, suite, cuina, vehicles, safareig: v.safareig, installacions, extres, plantes, coberta };
}

/** choices that shape the model but are not priced by the engine: settled in the project */
export type VisualChoices = { floors: 1 | 2; system: 'cellular' | 'timber'; facade: 'mineral' | 'wood'; roof: 'flat' | 'mono' | 'gable'; volume: 'compact' | 'L' };
export function parseVisual(v: unknown): VisualChoices | null {
  if (!isObj(v)) return null;
  const floors = int(v.floors, 1, 2) as 1 | 2 | null;
  const system = oneOf(v.system, ['cellular', 'timber'] as const);
  const facade = oneOf(v.facade, ['mineral', 'wood'] as const);
  // 'green' (the planted roof, withdrawn) may still arrive in an old link: it reads as flat
  const roof = v.roof === 'green' ? 'flat' : oneOf(v.roof, ['flat', 'mono', 'gable'] as const);
  const volume = oneOf(v.volume, ['compact', 'L'] as const);
  return floors && system && facade && roof && volume ? { floors, system, facade, roof, volume } : null;
}

export type LeadKind = 'info' | 'quote' | 'visit' | 'mineral';
export type LeadInput = {
  kind: LeadKind;
  lang: 'ca' | 'es';
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  company: string | null;
  plot: 'yes' | 'no' | 'searching' | null;
  plotNote: string | null;
  message: string | null;
  config: EngineInput | null;
  visual: VisualChoices | null;
  establishment: string | null;
  units: number | null;
  page: string | null;
};
export type LeadError = { field: string; code: 'required' | 'invalid' | 'consent' | 'spam' };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
export const phoneDigits = (p: string) => p.replace(/\D/g, '');

/**
 * A form submission. Besides the fields: the privacy consent must be given, the honeypot field
 * must be empty, and the form must have been open for a human amount of time.
 */
export function parseLead(v: unknown, now = Date.now()): { lead: LeadInput } | { errors: LeadError[] } {
  if (!isObj(v)) return { errors: [{ field: 'form', code: 'invalid' }] };
  const errors: LeadError[] = [];
  if (typeof v.website === 'string' && v.website.length > 0) errors.push({ field: 'form', code: 'spam' });
  if (typeof v.startedAt !== 'number' || now - v.startedAt < 2500 || now - v.startedAt > 1000 * 60 * 60 * 6) errors.push({ field: 'form', code: 'spam' });
  if (v.consent !== true) errors.push({ field: 'consent', code: 'consent' });
  const kind = oneOf(v.kind, ['info', 'quote', 'visit', 'mineral'] as const);
  const lang = oneOf(v.lang, ['ca', 'es'] as const);
  if (!kind || !lang) errors.push({ field: 'form', code: 'invalid' });
  const name = text(v.name, 120);
  if (!name || name.length < 2) errors.push({ field: 'name', code: 'required' });
  const email = text(v.email, 254)?.toLowerCase() ?? null;
  if (!email) errors.push({ field: 'email', code: 'required' });
  else if (!EMAIL.test(email)) errors.push({ field: 'email', code: 'invalid' });
  let phone = text(v.phone, 32);
  if (phone && phoneDigits(phone).length < 9) {
    errors.push({ field: 'phone', code: 'invalid' });
    phone = null;
  }
  // a budget or a visit needs a number to call back
  if (!phone && (kind === 'quote' || kind === 'visit') && !errors.some((e) => e.field === 'phone')) errors.push({ field: 'phone', code: 'required' });
  const config = v.config == null ? null : parseEngineInput(v.config);
  const visual = v.visual == null ? null : parseVisual(v.visual);
  if ((v.config != null && !config) || (v.visual != null && !visual)) errors.push({ field: 'config', code: 'invalid' });
  // floors and roof are said twice (to the engine and to the model): the engine's word is the one that counts
  if (config && visual) {
    config.plantes = visual.floors;
    visual.roof = ({ plana: 'flat', inclinada: 'mono', dues_aigues: 'gable' } as const)[config.coberta ?? 'plana'];
  }
  if (kind === 'quote' && !config) errors.push({ field: 'config', code: 'required' });
  const units = v.units == null ? null : int(v.units, 1, 500);
  if (v.units != null && units === null) errors.push({ field: 'units', code: 'invalid' });
  if (errors.length || !kind || !lang || !name || !email) return { errors };
  return {
    lead: {
      kind, lang, name, email, phone,
      city: text(v.city, 120),
      company: text(v.company, 160),
      plot: oneOf(v.plot, ['yes', 'no', 'searching'] as const),
      plotNote: text(v.plotNote, 300),
      message: text(v.message, 2000),
      config, visual,
      establishment: text(v.establishment, 60),
      units,
      page: text(v.page, 200),
    },
  };
}
