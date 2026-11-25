export const LOCALES = ['ca', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

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

export type StationId = 'exterior' | 'entrada' | 'interior' | 'cuina';
export type SpaceId = 'facana' | 'acces' | 'llindar' | 'sala' | 'escala' | 'cuina';
export type MaterialId = 'traverti' | 'roure' | 'vidre' | 'pedra';
export type SystemId = 'cellular' | 'timber';

export type Dictionary = {
  meta: { title: string; description: string };
  nav: Record<NavKey, string>;
  ui: {
    menu: string; close: string; skip: string; language: string; tour: string; scroll: string;
    configure: string; projects: string; contact: string; more: string; drag: string;
    soonTitle: string; soonText: string; back: string; rights: string;
  };
  stations: Record<StationId, { name: string; title: string; text: string }>;
  values: string[];
  projects: { name: string; title: string; text: string; spaces: Record<SpaceId, string> };
  systems: { name: string; title: string; text: string; items: Record<SystemId, { name: string; text: string; points: string[] }> };
  materials: { name: string; title: string; text: string; items: Record<MaterialId, { name: string; text: string }> };
  configurator: {
    name: string; title: string; text: string;
    floors: { label: string; options: string[] };
    bedrooms: { label: string; options: string[] };
    system: { label: string; options: string[] };
    /** {floors} {bedrooms} {system} are replaced with the phrases below */
    summary: string;
    floorsPhrase: string[]; bedroomsPhrase: string[]; systemPhrase: string[];
  };
  process: { name: string; title: string; steps: { name: string; text: string }[] };
  mineral: { title: string; text: string };
  closing: { title: string; text: string };
};

const ca: Dictionary = {
  meta: {
    title: 'ModularDom · Cases a mida, eficients i clau en mà',
    description: 'Construïm la casa que imagines. Cases a mida, eficients i clau en mà.',
  },
  nav: {
    homes: 'Cases a mida', projects: 'Projectes', systems: 'Sistemes constructius', configurator: 'Configurador',
    mineral: 'ModularDom MINERAL', process: 'Com treballem', about: 'Qui som', contact: 'Contacte', clients: 'Àrea de clients',
  },
  ui: {
    menu: 'Menú', close: 'Tancar', skip: 'Vés al contingut', language: 'Idioma', tour: 'Recorregut per la casa',
    scroll: 'Desplaça’t per entrar', configure: 'Configura la teva casa', projects: 'Veure projectes',
    contact: 'Parla amb nosaltres', more: 'Saber-ne més', drag: 'Arrossega',
    soonTitle: 'Estem preparant aquesta pàgina.', soonText: 'Mentrestant, pots recórrer la casa o escriure’ns.',
    back: 'Torna a l’inici', rights: 'Tots els drets reservats.',
  },
  stations: {
    exterior: { name: 'Exterior', title: 'Construïm la casa que imagines.', text: 'Cases a mida, eficients i clau en mà.' },
    entrada: { name: 'Entrada', title: 'Una nova manera de construir.', text: 'Arquitectura, innovació i eficiència.' },
    interior: { name: 'Interior', title: 'La teva casa. Les teves decisions.', text: 'Habitatges completament personalitzats.' },
    cuina: { name: 'Cuina', title: 'El luxe és poder escollir.', text: 'Qualitats, materials, acabats i personalització.' },
  },
  values: ['A mida', 'Eficients', 'Clau en mà'],
  projects: {
    name: 'Projectes',
    title: 'Cada casa, una història diferent.',
    text: 'Aquí presentarem les cases de ModularDom. Mentrestant, torna a mirar, espai a espai, la casa conceptual que acabes de recórrer.',
    spaces: { facana: 'Façana', acces: 'Accés', llindar: 'Llindar', sala: 'Sala', escala: 'Escala', cuina: 'Cuina' },
  },
  systems: {
    name: 'Sistemes constructius',
    title: 'Dos sistemes per construir la mateixa idea.',
    text: 'Formigó cel·lular o entramat lleuger de fusta. Triem el sistema amb tu, segons la casa i el lloc.',
    items: {
      cellular: {
        name: 'Formigó cel·lular',
        text: 'Blocs minerals lleugers que fan alhora de mur i d’aïllament.',
        points: ['Material mineral', 'Aïllament dins el mateix mur', 'No combustible'],
      },
      timber: {
        name: 'Entramat lleuger de fusta',
        text: 'Una estructura de muntants de fusta, lleugera i de construcció en sec.',
        points: ['Fusta estructural', 'Construcció en sec', 'Aïllament dins el gruix del mur'],
      },
    },
  },
  materials: {
    name: 'Qualitats i acabats',
    title: 'Qualitats, materials i acabats.',
    text: 'Pedra, fusta, vidre. Tu tries com ha de ser cada superfície de casa teva. Aquests són els de la casa del recorregut.',
    items: {
      traverti: { name: 'Travertí', text: 'A la façana, als graons i al paviment.' },
      roure: { name: 'Roure', text: 'A la porta d’entrada i als panells de la cuina.' },
      vidre: { name: 'Vidre', text: 'Tancaments de terra a sostre, oberts a la piscina.' },
      pedra: { name: 'Pedra natural', text: 'A l’illa i al frontal de la cuina.' },
    },
  },
  configurator: {
    name: 'Configurador',
    title: 'Comença pel que ja saps.',
    text: 'Tres decisions per començar. La resta, la definim plegats.',
    floors: { label: 'Plantes', options: ['Una', 'Dues'] },
    bedrooms: { label: 'Dormitoris', options: ['2', '3', '4', '5 o més'] },
    system: { label: 'Sistema', options: ['Formigó cel·lular', 'Entramat de fusta', 'Encara no ho sé'] },
    summary: 'Una casa {floors}, {bedrooms}, {system}.',
    floorsPhrase: ['d’una planta', 'de dues plantes'],
    bedroomsPhrase: ['amb dos dormitoris', 'amb tres dormitoris', 'amb quatre dormitoris', 'amb cinc dormitoris o més'],
    systemPhrase: ['en formigó cel·lular', 'en entramat lleuger de fusta', 'amb el sistema que triem plegats'],
  },
  process: {
    name: 'Procés constructiu',
    title: 'De la primera conversa a les claus.',
    steps: [
      { name: 'Escoltem', text: 'Ens expliques com vols viure i on.' },
      { name: 'Projectem', text: 'Dissenyem la casa a mida i tanquem cada decisió amb tu.' },
      { name: 'Construïm', text: 'Amb el sistema constructiu que hem triat plegats.' },
      { name: 'Entreguem', text: 'La casa acabada, clau en mà.' },
    ],
  },
  mineral: { title: 'ModularDom MINERAL', text: 'Una línia pròpia de ModularDom. En presentarem els detalls aquí.' },
  closing: { title: 'La propera casa pot ser la teva.', text: 'Explica’ns com vols viure-hi. La dissenyem a mida i te l’entreguem clau en mà.' },
};

const es: Dictionary = {
  meta: {
    title: 'ModularDom · Casas a medida, eficientes y llave en mano',
    description: 'Construimos la casa que imaginas. Casas a medida, eficientes y llave en mano.',
  },
  nav: {
    homes: 'Casas a medida', projects: 'Proyectos', systems: 'Sistemas constructivos', configurator: 'Configurador',
    mineral: 'ModularDom MINERAL', process: 'Cómo trabajamos', about: 'Quiénes somos', contact: 'Contacto', clients: 'Área de clientes',
  },
  ui: {
    menu: 'Menú', close: 'Cerrar', skip: 'Ir al contenido', language: 'Idioma', tour: 'Recorrido por la casa',
    scroll: 'Desplázate para entrar', configure: 'Configura tu casa', projects: 'Ver proyectos',
    contact: 'Habla con nosotros', more: 'Saber más', drag: 'Arrastra',
    soonTitle: 'Estamos preparando esta página.', soonText: 'Mientras tanto, puedes recorrer la casa o escribirnos.',
    back: 'Volver al inicio', rights: 'Todos los derechos reservados.',
  },
  stations: {
    exterior: { name: 'Exterior', title: 'Construimos la casa que imaginas.', text: 'Casas a medida, eficientes y llave en mano.' },
    entrada: { name: 'Entrada', title: 'Una nueva manera de construir.', text: 'Arquitectura, innovación y eficiencia.' },
    interior: { name: 'Interior', title: 'Tu casa. Tus decisiones.', text: 'Viviendas completamente personalizadas.' },
    cuina: { name: 'Cocina', title: 'El lujo es poder elegir.', text: 'Calidades, materiales, acabados y personalización.' },
  },
  values: ['A medida', 'Eficientes', 'Llave en mano'],
  projects: {
    name: 'Proyectos',
    title: 'Cada casa, una historia diferente.',
    text: 'Aquí presentaremos las casas de ModularDom. Mientras tanto, vuelve a mirar, espacio a espacio, la casa conceptual que acabas de recorrer.',
    spaces: { facana: 'Fachada', acces: 'Acceso', llindar: 'Umbral', sala: 'Salón', escala: 'Escalera', cuina: 'Cocina' },
  },
  systems: {
    name: 'Sistemas constructivos',
    title: 'Dos sistemas para construir la misma idea.',
    text: 'Hormigón celular o entramado ligero de madera. Elegimos el sistema contigo, según la casa y el lugar.',
    items: {
      cellular: {
        name: 'Hormigón celular',
        text: 'Bloques minerales ligeros que hacen a la vez de muro y de aislamiento.',
        points: ['Material mineral', 'Aislamiento en el propio muro', 'No combustible'],
      },
      timber: {
        name: 'Entramado ligero de madera',
        text: 'Una estructura de montantes de madera, ligera y de construcción en seco.',
        points: ['Madera estructural', 'Construcción en seco', 'Aislamiento en el grosor del muro'],
      },
    },
  },
  materials: {
    name: 'Calidades y acabados',
    title: 'Calidades, materiales y acabados.',
    text: 'Piedra, madera, vidrio. Tú eliges cómo debe ser cada superficie de tu casa. Estos son los de la casa del recorrido.',
    items: {
      traverti: { name: 'Travertino', text: 'En la fachada, los peldaños y el pavimento.' },
      roure: { name: 'Roble', text: 'En la puerta de entrada y los paneles de la cocina.' },
      vidre: { name: 'Vidrio', text: 'Cerramientos de suelo a techo, abiertos a la piscina.' },
      pedra: { name: 'Piedra natural', text: 'En la isla y el frente de la cocina.' },
    },
  },
  configurator: {
    name: 'Configurador',
    title: 'Empieza por lo que ya sabes.',
    text: 'Tres decisiones para empezar. El resto lo definimos juntos.',
    floors: { label: 'Plantas', options: ['Una', 'Dos'] },
    bedrooms: { label: 'Dormitorios', options: ['2', '3', '4', '5 o más'] },
    system: { label: 'Sistema', options: ['Hormigón celular', 'Entramado de madera', 'Aún no lo sé'] },
    summary: 'Una casa {floors}, {bedrooms}, {system}.',
    floorsPhrase: ['de una planta', 'de dos plantas'],
    bedroomsPhrase: ['con dos dormitorios', 'con tres dormitorios', 'con cuatro dormitorios', 'con cinco dormitorios o más'],
    systemPhrase: ['en hormigón celular', 'en entramado ligero de madera', 'con el sistema que elijamos juntos'],
  },
  process: {
    name: 'Proceso constructivo',
    title: 'De la primera conversación a las llaves.',
    steps: [
      { name: 'Escuchamos', text: 'Nos cuentas cómo quieres vivir y dónde.' },
      { name: 'Proyectamos', text: 'Diseñamos la casa a medida y cerramos cada decisión contigo.' },
      { name: 'Construimos', text: 'Con el sistema constructivo que hemos elegido juntos.' },
      { name: 'Entregamos', text: 'La casa terminada, llave en mano.' },
    ],
  },
  mineral: { title: 'ModularDom MINERAL', text: 'Una línea propia de ModularDom. Presentaremos aquí sus detalles.' },
  closing: { title: 'La próxima casa puede ser la tuya.', text: 'Cuéntanos cómo quieres vivir en ella. La diseñamos a medida y te la entregamos llave en mano.' },
};

export const dictionaries: Record<Locale, Dictionary> = { ca, es };
