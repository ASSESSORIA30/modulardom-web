import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { calculate, validateInput, type EngineInput } from '@/lib/configurator/engine';
import { TEST_TARIFF as T } from './fixtures/tariff';

const base: EngineInput = { metres: 100, habitacions: 1, banys: 1, suite: 'sin', cuina: 'basica', vehicles: 0, safareig: false, installacions: [], extres: [] };
const eur = (n: number) => n * 100;
const line = (q: ReturnType<typeof calculate>, key: string) => q.lines.find((l) => l.key === key);

describe('budget engine: each concept', () => {
  const q = calculate(T, base);

  it('prices construction and foundation per square metre', () => {
    expect(line(q, 'construccio')!.amountCents).toBe(eur(100 * 1000));
    expect(line(q, 'fonamentacio')!.amountCents).toBe(eur(100 * 100));
  });
  it('prices the architect per square metre plus a fixed fee', () => {
    expect(line(q, 'arquitecte')!.amountCents).toBe(eur(100 * 50 + 2000));
  });
  it('adds the connections once', () => {
    expect(line(q, 'escomeses')!.amountCents).toBe(eur(3000));
  });
  it('discounts the interior distribution by the tariff percentage', () => {
    // 1 bedroom + 1 bathroom = 4000 + 6000, at 50 %
    expect(line(q, 'distribucio')).toMatchObject({ originalCents: eur(10000), discountPct: 50, amountCents: eur(5000) });
  });
  it('counts suite and laundry inside the interior distribution', () => {
    const a = calculate(T, { ...base, suite: 'bano', safareig: true });
    expect(line(a, 'distribucio')!.amountCents).toBe(eur((4000 + 6000 + 8000 + 2000) / 2));
    const b = calculate(T, { ...base, suite: 'bano_vestidor' });
    expect(line(b, 'distribucio')!.amountCents).toBe(eur((4000 + 6000 + 12000) / 2));
  });
  it('prices the kitchen by type', () => {
    expect(line(q, 'cuina')!.amountCents).toBe(eur(3000));
    expect(line(calculate(T, { ...base, cuina: 'isla' }), 'cuina')!.amountCents).toBe(eur(9000));
  });
  it('prices climate systems per square metre, added together', () => {
    const a = calculate(T, { ...base, metres: 150, installacions: ['aerotermia', 'aireConductos'] });
    expect(line(a, 'installacions')!.amountCents).toBe(eur(150 * (100 + 40)));
    expect(line(q, 'installacions')).toBeUndefined();
  });
  it('prices the garage: a first vehicle, then each additional one', () => {
    expect(line(q, 'garatge')).toBeUndefined();
    expect(line(calculate(T, { ...base, vehicles: 1 }), 'garatge')!.amountCents).toBe(eur(10000));
    expect(line(calculate(T, { ...base, vehicles: 3 }), 'garatge')!.amountCents).toBe(eur(10000 + 2 * 7000));
  });
  it('adds each chosen extra at its fixed price', () => {
    const a = calculate(T, { ...base, extres: ['piscina', 'placasSolares'] });
    expect(line(a, 'extra:piscina')!.amountCents).toBe(eur(20000));
    expect(line(a, 'extra:placasSolares')!.amountCents).toBe(eur(6000));
    expect(line(a, 'extra:porche')).toBeUndefined();
  });
});

describe('budget engine: totals', () => {
  it('applies 10 % VAT to works and 21 % to the architect, separately', () => {
    const q = calculate(T, base);
    const works = eur(100000 + 10000 + 3000 + 5000 + 3000);
    const arch = eur(7000);
    expect(q.baseObraCents).toBe(works);
    expect(q.baseArqCents).toBe(arch);
    expect(q.ivaObraCents).toBe(works * 0.1);
    expect(q.ivaArqCents).toBe(arch * 0.21);
    expect(q.subtotalCents).toBe(works + arch);
    expect(q.totalCents).toBe(works + arch + works * 0.1 + arch * 0.21);
  });
  it('is the sum of its lines plus both VATs, for any configuration', () => {
    for (const metres of [100, 137, 250, 400])
      for (const vehicles of [0, 2, 4]) {
        const q = calculate(T, { ...base, metres, vehicles, habitacions: 4, banys: 3, suite: 'bano_vestidor', cuina: 'isla', safareig: true, installacions: ['aerotermia'], extres: ['piscina', 'porche'] });
        const sum = q.lines.reduce((s, l) => s + l.amountCents, 0);
        expect(q.subtotalCents).toBe(sum);
        expect(q.totalCents).toBe(sum + q.ivaObraCents + q.ivaArqCents);
        expect(Number.isInteger(q.totalCents)).toBe(true);
      }
  });
  it('works in whole cents with prices that are not round', () => {
    const odd = { ...T, construccio_m2: 993.33, iva_obra_pct: 10 };
    const q = calculate(odd, { ...base, metres: 101 });
    expect(line(q, 'construccio')!.amountCents).toBe(101 * 99333);
    expect(Number.isInteger(q.ivaObraCents)).toBe(true);
  });
});

describe('budget engine: validation', () => {
  it('accepts a valid configuration', () => expect(validateInput(T, base)).toEqual([]));
  it('refuses a surface under the minimum or not whole', () => {
    expect(validateInput(T, { ...base, metres: 99 })).toEqual([{ field: 'metres', code: 'min' }]);
    expect(validateInput(T, { ...base, metres: 120.5 })[0].field).toBe('metres');
  });
  it('refuses options the tariff does not offer', () => {
    expect(validateInput(T, { ...base, habitacions: 7 })[0].field).toBe('habitacions');
    expect(validateInput(T, { ...base, banys: 0 })[0].field).toBe('banys');
    expect(validateInput(T, { ...base, vehicles: 5 })[0].field).toBe('vehicles');
    expect(validateInput(T, { ...base, installacions: ['geotermia'] })[0]).toEqual({ field: 'installacions', code: 'unknown' });
    expect(validateInput(T, { ...base, extres: ['sauna'] })[0]).toEqual({ field: 'extres', code: 'unknown' });
  });
});

/*
  The port must compute exactly what ModularDom's own engine computes. The original file (as
  served by modulardom.com, "generat des del CRM") is kept as a fixture and run here side by side
  with the TypeScript port over a few hundred configurations.
*/
describe('budget engine: parity with ModularDom’s original motor.js', () => {
  const sandbox: { window: { ModulardomMotor?: { calculate: typeof calculate; validateInput: typeof validateInput } } } = { window: {} };
  vm.runInNewContext(readFileSync(path.join(import.meta.dirname, 'fixtures', 'motor.original.js'), 'utf8'), sandbox);
  const original = sandbox.window.ModulardomMotor!;
  let seed = 42;
  const rnd = (n: number) => (seed = (seed * 16807) % 2147483647) % n;
  const pickSome = (keys: string[]) => keys.filter(() => rnd(2) === 1);

  it('gives the same lines, bases, VAT and total', () => {
    for (let i = 0; i < 400; i++) {
      const input: EngineInput = {
        metres: 100 + rnd(400),
        habitacions: 1 + rnd(6),
        banys: 1 + rnd(4),
        suite: (['sin', 'bano', 'bano_vestidor'] as const)[rnd(3)],
        cuina: (['basica', 'isla'] as const)[rnd(2)],
        vehicles: rnd(5),
        safareig: rnd(2) === 1,
        installacions: pickSome(['aerotermia', 'aireConductos']),
        extres: pickSome(['piscina', 'porche', 'placasSolares']),
      };
      const a = calculate(T, input);
      const b = JSON.parse(JSON.stringify(original.calculate(T, input)));
      expect(JSON.parse(JSON.stringify(a.lines))).toEqual(b.lines);
      for (const k of ['baseObraCents', 'baseArqCents', 'subtotalCents', 'ivaObraCents', 'ivaArqCents', 'totalCents'] as const) expect(a[k]).toBe(b[k]);
    }
  });
  it('rejects the same inputs', () => {
    for (const bad of [{ metres: 50 }, { habitacions: 9 }, { suite: 'x' }, { cuina: 'y' }, { vehicles: 9 }, { extres: ['z'] }]) {
      const input = { ...base, ...bad } as EngineInput;
      expect(validateInput(T, input)).toEqual(JSON.parse(JSON.stringify(original.validateInput(T, input))));
    }
  });
});
