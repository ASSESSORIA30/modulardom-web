import { describe, expect, it } from 'vitest';
import { dedupeKey, toCrm, webReference } from '@/server/leads';
import { publicQuote } from '@/server/quote';
import { _reset, allow } from '@/server/rate-limit';
import { isTariff } from '@/server/tariff';
import { parseEngineInput, parseLead, parseVisual } from '@/server/validate';
import { TEST_TARIFF as T } from './fixtures/tariff';

const config = { metres: 180, habitacions: 3, banys: 2, suite: 'bano', cuina: 'isla', vehicles: 1, safareig: true, installacions: ['aerotermia'], extres: ['piscina'] };
const now = 1_800_000_000_000;
const form = { kind: 'quote', lang: 'ca', name: 'Anna Prova', email: ' Anna@Example.com ', phone: '+34 600 11 22 33', consent: true, website: '', startedAt: now - 20_000, config, visual: { floors: 2, system: 'cellular', facade: 'mineral', roof: 'flat', volume: 'compact' } };

const q0 = (t: typeof T, metres: number) => publicQuote(t, 8, parseEngineInput({ ...config, metres })!)!;

describe('what a visitor is told about a budget', () => {
  const q = publicQuote(T, 7, parseEngineInput(config)!)!;
  it('carries one amount per concept, VAT and total', () => {
    expect(q.lines.length).toBeGreaterThan(5);
    expect(q.totalCents).toBe(q.subtotalCents + q.vatWorksCents + q.vatArchitectCents);
    expect(q.tariff).toBe('7');
  });
  it('never carries unit prices, pre-discount amounts, discount rates or the tariff itself', () => {
    const wire = JSON.stringify(q);
    for (const secret of ['unitPriceCents', 'originalCents', 'discountPct', 'quantity', 'internal', 'construccio_m2', 'intern', 'preu']) expect(wire).not.toContain(`"${secret}"`);
    for (const l of q.lines) expect(Object.keys(l).sort()).toEqual(l.detail ? ['amountCents', 'detail', 'key', 'label'] : ['amountCents', 'key', 'label']);
  });
  it('prices a pitched roof by its own square metres and says how many', () => {
    const R = { ...T, coberta: { inclinada: { preu_m2: 150, pendent_pct: 30 }, dues_aigues: { preu_m2: 180, pendent_pct: 40 }, volada_m: 0.5, proporcio: 1.5 } };
    const one = publicQuote(R, 8, parseEngineInput({ ...config, metres: 200, plantes: 1, coberta: 'inclinada' })!)!;
    const two = publicQuote(R, 8, parseEngineInput({ ...config, metres: 200, plantes: 2, coberta: 'inclinada' })!)!;
    expect(one.roof).toMatchObject({ areaM2: 240, estimated: true });
    expect(one.lines.find((l) => l.key === 'coberta')).toMatchObject({ amountCents: 3_600_000, detail: { ca: '240,0 m² de coberta (superfície estimada)' } });
    expect(two.roof!.areaM2).toBe(126.8);
    expect(one.totalCents - q0(R, 200).totalCents).toBe(3_960_000);
    expect(isTariff(R)).toBe(true);
    expect(isTariff({ ...R, coberta: { ...R.coberta, proporcio: 0 } })).toBe(false);
  });
  it('shows an option without a validated price as pending, never as free', () => {
    const noRoof = publicQuote(T, 7, parseEngineInput({ ...config, coberta: 'dues_aigues' })!)!;
    expect(noRoof.hasPending).toBe(true);
    expect(noRoof.lines.find((l) => l.key === 'coberta')).toMatchObject({ pending: true, amountCents: 0 });
    const { placasSolares: _gone, ...extres } = { placasSolares: null, ...T.extres };
    void _gone;
    const noSolar = publicQuote({ ...T, extres }, 7, parseEngineInput({ ...config, extres: ['piscina', 'placasSolares'] })!)!;
    expect(noSolar.lines.find((l) => l.key === 'extra:placasSolares')).toMatchObject({ pending: true, amountCents: 0 });
    expect(noSolar.totalCents).toBe(q.totalCents);
  });
  it('reads an older configuration as one floor and a flat roof, and refuses a measured area from a visitor', () => {
    expect(parseEngineInput(config)).toMatchObject({ plantes: 1, coberta: 'plana' });
    expect(parseEngineInput({ ...config, coberta: 'vegetal' })).toBeNull();
    expect(parseEngineInput({ ...config, coberta: 'inclinada', coberta_m2: 5 })).not.toHaveProperty('coberta_m2');
    expect(parseVisual({ floors: 1, system: 'cellular', facade: 'mineral', roof: 'green', volume: 'compact' })!.roof).toBe('flat');
  });
  it('keeps floors and roof consistent between the engine and the model', () => {
    const p = parseLead({ ...form, config: { ...config, plantes: 1, coberta: 'dues_aigues' }, visual: { ...form.visual, floors: 2, roof: 'flat' } }, now) as { lead: { config: { plantes: number }; visual: { roof: string } } };
    expect(p.lead.config.plantes).toBe(2);
    expect(p.lead.visual.roof).toBe('gable');
  });
  it('gives nothing for a configuration the tariff does not allow', () => {
    expect(publicQuote(T, 7, { ...parseEngineInput(config)!, metres: 60 })).toBeNull();
  });
});

describe('tariff shape check', () => {
  it('accepts a complete tariff and refuses a damaged one', () => {
    expect(isTariff(T)).toBe(true);
    expect(isTariff({ ...T, construccio_m2: '993' })).toBe(false);
    expect(isTariff({ ...T, intern: {} })).toBe(false);
    expect(isTariff(null)).toBe(false);
  });
});

describe('form validation', () => {
  it('accepts a complete request and normalises it', () => {
    const r = parseLead(form, now);
    expect('lead' in r && r.lead.email).toBe('anna@example.com');
  });
  it('requires the privacy consent', () => {
    const r = parseLead({ ...form, consent: false }, now);
    expect('errors' in r && r.errors).toContainEqual({ field: 'consent', code: 'consent' });
  });
  it('treats a filled honeypot or an instant submission as spam', () => {
    expect('errors' in parseLead({ ...form, website: 'http://x' }, now)).toBe(true);
    const fast = parseLead({ ...form, startedAt: now - 300 }, now);
    expect('errors' in fast && fast.errors[0].code).toBe('spam');
  });
  it('requires name and a valid e-mail, and a phone for budgets and visits', () => {
    const r = parseLead({ ...form, name: ' ', email: 'no', phone: '' }, now);
    expect('errors' in r && r.errors.map((e) => e.field).sort()).toEqual(['email', 'name', 'phone']);
    expect('lead' in parseLead({ ...form, kind: 'info', phone: '', config: null, visual: null }, now)).toBe(true);
  });
  it('refuses a configuration with values outside the options', () => {
    expect(parseEngineInput({ ...config, suite: 'penthouse' })).toBeNull();
    expect(parseEngineInput({ ...config, extres: ['piscina', 'yacht'] })).toBeNull();
    expect(parseEngineInput({ ...config, metres: 1e9 })).toBeNull();
  });
  it('strips control characters from free text', () => {
    const r = parseLead({ ...form, message: 'hola\u0000\u0007 món' }, now);
    expect('lead' in r && r.lead.message).toBe('hola món');
  });
});

describe('leads for the CRM', () => {
  const lead = (parseLead(form, now) as { lead: Parameters<typeof toCrm>[0] }).lead;
  it('maps to the CRM’s own fields', () => {
    const p = toCrm(lead, null, 'W000000-TEST', new Date(now));
    expect(p.source).toBe('configurador');
    expect(p.client).toMatchObject({ kind: 'persona', display_name: 'Anna Prova', email: 'anna@example.com', locale: 'ca' });
    expect(p.project.surface_m2).toBe(180);
    expect(p.configurator?.input.suite).toBe('bano');
    expect(p.configurator?.totalCents).toBeNull();
    expect(p.capturedAt).toBe(new Date(now).toISOString());
  });
  it('gives the same idempotency key to the same person on the same day, however the data is typed', () => {
    const day = new Date(now);
    const a = dedupeKey({ email: 'anna@example.com', phone: '+34 600 11 22 33', kind: 'quote' }, day);
    expect(dedupeKey({ email: ' ANNA@example.com', phone: '600112233', kind: 'quote' }, day)).toBe(a);
    expect(dedupeKey({ email: 'anna@example.com', phone: '600112233', kind: 'visit' }, day)).not.toBe(a);
    expect(dedupeKey({ email: 'anna@example.com', phone: '600112233', kind: 'quote' }, new Date(now + 864e5))).not.toBe(a);
  });
  it('treats a retry as the same request and a different request from the same person as a new one', () => {
    const day = new Date(now);
    const first = dedupeKey(lead, day);
    expect(dedupeKey({ ...lead, message: lead.message ? `  ${lead.message.toUpperCase()} ` : null }, day)).toBe(first);
    expect(dedupeKey({ ...lead, config: { ...lead.config!, metres: lead.config!.metres + 20 } }, day)).not.toBe(first);
    expect(dedupeKey({ ...lead, message: 'Una altra consulta, el mateix dia' }, day)).not.toBe(first);
    expect(dedupeKey({ ...lead, plotNote: 'Un altre terreny' }, day)).not.toBe(first);
  });
  it('sends the visitor tag only when there is one', () => {
    expect('visitor' in toCrm(lead, null, 'W000000-TEST', new Date(now))).toBe(false);
    expect(toCrm(lead, null, 'W000000-TEST', new Date(now), 'a'.repeat(32)).visitor).toBe('a'.repeat(32));
  });
  it('issues references that are not guessable from one another', () => {
    const refs = new Set(Array.from({ length: 200 }, () => webReference(new Date(now))));
    expect(refs.size).toBeGreaterThan(195);
    expect([...refs][0]).toMatch(/^W\d{6}-[A-Z2-9]{4}$/);
  });
});

describe('privacy gate', () => {
  it('holds production back until the policy is published, and lets previews test', async () => {
    const { privacyGate } = await import('@/server/env');
    expect(privacyGate('production', false)).toBe(false);
    expect(privacyGate('production', true)).toBe(true);
    expect(privacyGate('preview', false)).toBe(true);
    expect(privacyGate(undefined, false)).toBe(true);
  });
});

describe('rate limiter', () => {
  it('allows up to the limit in a window, then refuses, then recovers', () => {
    _reset();
    for (let i = 0; i < 5; i++) expect(allow('k', 5, 1000, 0)).toBe(true);
    expect(allow('k', 5, 1000, 500)).toBe(false);
    expect(allow('other', 5, 1000, 500)).toBe(true);
    expect(allow('k', 5, 1000, 1500)).toBe(true);
  });
});
