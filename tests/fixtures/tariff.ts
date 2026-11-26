import type { Tariff } from '@/lib/configurator/engine';

/*
  A made-up tariff for the tests. Its numbers are round and obviously not ModularDom's: they exist
  to make the arithmetic easy to check by hand, not to state any price.
*/
export const TEST_TARIFF: Tariff = {
  construccio_m2: 1000,
  fonamentacio_m2: 100,
  arquitecte_m2: 50,
  arquitecte_fix: 2000,
  escomeses: 3000,
  metres_minims: 100,
  iva_obra_pct: 10,
  iva_arquitecte_pct: 21,
  intern: { habitacio: 4000, bany: 6000, safareig: 2000, suite_bany: 8000, suite_bany_vestidor: 12000 },
  distribucio_descompte_pct: 50,
  garatge: { primer_vehicle: 10000, vehicle_addicional: 7000, max_vehicles: 4 },
  cuina: { basica: 3000, illa: 9000 },
  installacions_m2: {
    aerotermia: { nom: { ca: 'Aerotèrmia', es: 'Aerotermia' }, preu_m2: 100 },
    aireConductos: { nom: { ca: 'Aire conductes', es: 'Aire por conductos' }, preu_m2: 40 },
  },
  extres: {
    piscina: { nom: { ca: 'Piscina', es: 'Piscina' }, preu: 20000 },
    porche: { nom: { ca: 'Porxo', es: 'Porche' }, preu: 5000 },
    placasSolares: { nom: { ca: 'Plaques solars', es: 'Placas solares' }, preu: 6000 },
  },
  opcions: { habitacions: [1, 2, 3, 4, 5, 6], banys: [1, 2, 3, 4] },
};
