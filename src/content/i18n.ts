export const LOCALES = ['ca', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

export type SceneCopy = {
  label: string;
  /** *asterisks* mark the words set in italic */
  title: string;
  text: string;
};

export type Dictionary = {
  meta: { title: string; description: string };
  nav: Record<NavKey, string>;
  ui: {
    menu: string;
    close: string;
    skip: string;
    scroll: string;
    tour: string;
    language: string;
    configure: string;
    projects: string;
    contact: string;
    soonTitle: string;
    soonText: string;
    back: string;
    rights: string;
  };
  scenes: Record<string, SceneCopy>;
  kitchenList: string[];
  closing: { title: string; text: string };
};

export const NAV = [
  { key: 'homes', slug: 'cases-a-mida' },
  { key: 'projects', slug: 'projectes' },
  { key: 'systems', slug: 'sistemes-constructius' },
  { key: 'configurator', slug: 'configurador' },
  { key: 'mineral', slug: 'mineral' },
  { key: 'process', slug: 'com-treballem' },
  { key: 'about', slug: 'qui-som' },
  { key: 'contact', slug: 'contacte' },
  { key: 'clients', slug: 'area-de-clients' },
] as const;
export type NavKey = (typeof NAV)[number]['key'];

const ca: Dictionary = {
  meta: {
    title: 'ModularDom — Cases a mida, eficients i clau en mà',
    description: 'Construïm la casa que imagines. Cases a mida, eficients i clau en mà.',
  },
  nav: {
    homes: 'Cases a mida',
    projects: 'Projectes',
    systems: 'Sistemes constructius',
    configurator: 'Configurador',
    mineral: 'ModularDom MINERAL',
    process: 'Com treballem',
    about: 'Qui som',
    contact: 'Contacte',
    clients: 'Àrea de clients',
  },
  ui: {
    menu: 'Menú',
    close: 'Tancar',
    skip: 'Vés al contingut',
    scroll: 'Desplaça’t per entrar',
    tour: 'Recorregut per la casa',
    language: 'Idioma',
    configure: 'Configura la teva casa',
    projects: 'Veure projectes',
    contact: 'Parla amb nosaltres',
    soonTitle: 'Estem preparant aquesta pàgina.',
    soonText: 'Mentrestant, pots recórrer la casa o escriure’ns.',
    back: 'Torna a l’inici',
    rights: 'Tots els drets reservats.',
  },
  scenes: {
    exterior: { label: 'Exterior', title: 'Construïm la casa que *imagines.*', text: 'Cases a mida, eficients i clau en mà.' },
    entrada: { label: 'Entrada', title: 'Una nova manera de *construir.*', text: 'Arquitectura, innovació i eficiència.' },
    rebedor: { label: 'Rebedor', title: 'La teva casa. *Les teves decisions.*', text: 'Habitatges completament personalitzats.' },
    salo: { label: 'Saló', title: 'Cada casa, una història *diferent.*', text: 'Presentació de projectes.' },
    cuina: { label: 'Cuina', title: 'El luxe és poder *escollir.*', text: 'Qualitats, materials, acabats i personalització.' },
  },
  kitchenList: ['Qualitats', 'Materials', 'Acabats', 'Personalització'],
  closing: {
    title: 'La propera casa del recorregut pot ser *la teva.*',
    text: 'Explica’ns com vols viure-hi. La dissenyem a mida i te l’entreguem clau en mà.',
  },
};

const es: Dictionary = {
  meta: {
    title: 'ModularDom — Casas a medida, eficientes y llave en mano',
    description: 'Construimos la casa que imaginas. Casas a medida, eficientes y llave en mano.',
  },
  nav: {
    homes: 'Casas a medida',
    projects: 'Proyectos',
    systems: 'Sistemas constructivos',
    configurator: 'Configurador',
    mineral: 'ModularDom MINERAL',
    process: 'Cómo trabajamos',
    about: 'Quiénes somos',
    contact: 'Contacto',
    clients: 'Área de clientes',
  },
  ui: {
    menu: 'Menú',
    close: 'Cerrar',
    skip: 'Ir al contenido',
    scroll: 'Desplázate para entrar',
    tour: 'Recorrido por la casa',
    language: 'Idioma',
    configure: 'Configura tu casa',
    projects: 'Ver proyectos',
    contact: 'Habla con nosotros',
    soonTitle: 'Estamos preparando esta página.',
    soonText: 'Mientras tanto, puedes recorrer la casa o escribirnos.',
    back: 'Volver al inicio',
    rights: 'Todos los derechos reservados.',
  },
  scenes: {
    exterior: { label: 'Exterior', title: 'Construimos la casa que *imaginas.*', text: 'Casas a medida, eficientes y llave en mano.' },
    entrada: { label: 'Entrada', title: 'Una nueva manera de *construir.*', text: 'Arquitectura, innovación y eficiencia.' },
    rebedor: { label: 'Recibidor', title: 'Tu casa. *Tus decisiones.*', text: 'Viviendas completamente personalizadas.' },
    salo: { label: 'Salón', title: 'Cada casa, una historia *diferente.*', text: 'Presentación de proyectos.' },
    cuina: { label: 'Cocina', title: 'El lujo es poder *elegir.*', text: 'Calidades, materiales, acabados y personalización.' },
  },
  kitchenList: ['Calidades', 'Materiales', 'Acabados', 'Personalización'],
  closing: {
    title: 'La próxima casa del recorrido puede ser *la tuya.*',
    text: 'Cuéntanos cómo quieres vivir en ella. La diseñamos a medida y te la entregamos llave en mano.',
  },
};

export const dictionaries: Record<Locale, Dictionary> = { ca, es };
