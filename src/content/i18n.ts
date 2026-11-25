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
export type SystemId = 'cellular' | 'timber';
export type LayerId = 'foundation' | 'structure' | 'envelope' | 'insulation' | 'services' | 'roof' | 'finishes';
export type MaterialGroupId = 'woods' | 'stone' | 'floors' | 'cladding' | 'joinery' | 'interiors';

type Choice = { label: string; options: string[] };

export type Dictionary = {
  meta: { title: string; description: string };
  nav: Record<NavKey, string>;
  ui: {
    menu: string; close: string; skip: string; language: string; tour: string; scroll: string;
    configure: string; configureShort: string; projects: string; contact: string; contactShort: string;
    info: string; visit: string; whatsapp: string; more: string; drag: string; concept: string;
    soonTitle: string; soonText: string; back: string; rights: string; from: string; pending: string;
  };
  /** a title is one or more lines; *asterisks* mark the line set in italic */
  stations: Record<StationId, { name: string; title: string[]; text: string }>;
  values: string[];
  projects: {
    name: string; title: string[]; text: string; conceptNote: string;
    spaces: Record<SpaceId, string>;
    fields: { location: string; surface: string; year: string; system: string };
  };
  systems: {
    name: string; title: string[]; text: string; hint: string; note: string; fallback: string;
    items: Record<SystemId, { name: string; text: string }>;
    layers: Record<LayerId, { name: string; text: string; cellular?: string; timber?: string }>;
  };
  materials: {
    name: string; title: string[]; text: string; note: string; sample: string;
    groups: Record<MaterialGroupId, { name: string; samples: { name: string; where: string }[] }>;
  };
  configurator: {
    name: string; title: string[]; text: string; step: string; summary: string; send: string; noPrice: string;
    surface: { label: string; unit: string; hint: string };
    floors: Choice; bedrooms: Choice; system: Choice; style: Choice; finishes: Choice;
    extras: Choice & { hint: string };
    none: string;
  };
  process: { name: string; title: string[]; text: string; steps: { name: string; text: string }[] };
  mineral: {
    name: string; title: string[]; text: string; audience: string;
    slots: { name: string; text: string }[];
    form: {
      title: string; kind: Choice; units: string; name: string; company: string; email: string; phone: string;
      message: string; submit: string; ready: string; error: string; required: string;
    };
  };
  closing: { title: string[]; text: string };
};

const ca: Dictionary = {
  meta: {
    title: 'ModularDom · La vida que imagines comença aquí',
    description: 'Cases a mida, eficients i clau en mà. Recorre una casa ModularDom i comença a configurar la teva.',
  },
  nav: {
    homes: 'Cases a mida', projects: 'Projectes', systems: 'Sistemes constructius', configurator: 'Configurador',
    mineral: 'ModularDom MINERAL', process: 'Com treballem', about: 'Qui som', contact: 'Contacte', clients: 'Àrea de clients',
  },
  ui: {
    menu: 'Menú', close: 'Tanca', skip: 'Vés al contingut', language: 'Idioma', tour: 'Recorregut per la casa',
    scroll: 'Desplaça’t per entrar-hi', configure: 'Configura la teva casa', configureShort: 'Configurador',
    projects: 'Veure projectes', contact: 'Parla amb nosaltres', contactShort: 'Contacte',
    info: 'Sol·licita informació', visit: 'Reserva una visita', whatsapp: 'Escriu-nos per WhatsApp',
    more: 'Saber-ne més', drag: 'Arrossega', concept: 'Visualització conceptual',
    soonTitle: 'Estem preparant aquesta pàgina.', soonText: 'Mentrestant, pots recórrer la casa o escriure’ns.',
    back: 'Torna a l’inici', rights: 'Tots els drets reservats.', from: 'des de', pending: 'En preparació',
  },
  stations: {
    exterior: { name: 'Exterior', title: ['La vida que imagines', '*comença aquí.*'], text: 'Cases a mida, eficients i clau en mà.' },
    entrada: { name: 'Entrada', title: ['Redefinim la manera', '*de construir.*'], text: 'Arquitectura, innovació i eficiència.' },
    interior: { name: 'Interior', title: ['Una casa tan única', '*com tu.*'], text: 'Habitatges completament personalitzats.' },
    cuina: { name: 'Cuina', title: ['Cada detall.', 'Cada decisió.', '*Teva.*'], text: 'Qualitats, materials, acabats i personalització.' },
  },
  values: ['A mida', 'Eficients', 'Clau en mà'],
  projects: {
    name: 'Projectes',
    title: ['No construïm', '*dues cases iguals.*'],
    text: 'Aquí publicarem les obres de ModularDom. Mentrestant, torna a mirar espai a espai la casa que acabes de recórrer.',
    conceptNote: 'Casa conceptual. És una visualització, no una obra construïda.',
    spaces: { facana: 'Façana', acces: 'Accés', llindar: 'Llindar', sala: 'Sala', escala: 'Escala', cuina: 'Cuina' },
    fields: { location: 'Ubicació', surface: 'Superfície', year: 'Any', system: 'Sistema' },
  },
  systems: {
    name: 'Sistemes constructius',
    title: ['Una casa,', '*capa a capa.*'],
    text: 'Dos sistemes per construir la mateixa idea: formigó cel·lular o entramat lleuger de fusta. Desmunta la casa i mira què hi ha a dins.',
    hint: 'Continua baixant per desmuntar-la',
    note: 'Representació conceptual. No reflecteix gruixos, composicions ni prestacions.',
    fallback: 'La visualització 3D no està disponible en aquest dispositiu.',
    items: {
      cellular: { name: 'Formigó cel·lular', text: 'Murs de blocs minerals.' },
      timber: { name: 'Entramat lleuger de fusta', text: 'Estructura de muntants i bigues de fusta.' },
    },
    layers: {
      foundation: { name: 'Fonamentació', text: 'La base sobre la qual s’aixeca la casa.' },
      structure: { name: 'Estructura', text: 'El que aguanta la casa.', cellular: 'Murs de blocs de formigó cel·lular.', timber: 'Entramat de muntants i bigues de fusta.' },
      envelope: { name: 'Tancaments', text: 'La pell que tanca l’estructura.' },
      insulation: { name: 'Aïllaments', text: 'La capa que protegeix l’interior del fred i de la calor.' },
      services: { name: 'Instal·lacions', text: 'Aigua, electricitat i climatització, integrades abans dels acabats.' },
      roof: { name: 'Coberta', text: 'El pla que cobreix i protegeix la casa.' },
      finishes: { name: 'Acabats', text: 'El que es veu i es toca: revestiments, fusteria i vidre.' },
    },
  },
  materials: {
    name: 'Qualitats i acabats',
    title: ['El luxe és', '*poder escollir.*'],
    text: 'Fusta, pedra, vidre. Cada superfície de casa teva es tria amb tu.',
    note: 'Mostres conceptuals, extretes de la visualització. Els materials de cada casa es defineixen al seu projecte.',
    sample: 'Mostra conceptual',
    groups: {
      woods: { name: 'Fustes', samples: [{ name: 'Roure', where: 'Porta d’entrada' }, { name: 'Lamel·les de roure', where: 'Parament de l’escala' }] },
      stone: { name: 'Pedra', samples: [{ name: 'Travertí', where: 'Façana' }, { name: 'Pedra amb veta', where: 'Illa de la cuina' }] },
      floors: { name: 'Paviments', samples: [{ name: 'Pedra polida', where: 'Sala' }, { name: 'Graons il·luminats', where: 'Accés' }] },
      cladding: { name: 'Revestiments', samples: [{ name: 'Panells de roure', where: 'Cuina' }, { name: 'Pedra clara', where: 'Mur de la llar de foc' }] },
      joinery: { name: 'Fusteria', samples: [{ name: 'Tancaments de terra a sostre', where: 'Sala' }, { name: 'Porta pivotant', where: 'Entrada' }] },
      interiors: { name: 'Acabats interiors', samples: [{ name: 'Llum integrada', where: 'Sostres i sòcols' }, { name: 'Tèxtils naturals', where: 'Sala' }] },
    },
  },
  configurator: {
    name: 'Configurador',
    title: ['Dissenya-la', '*al teu gust.*'],
    text: 'Set decisions per començar a donar forma a casa teva. La resta, la definim plegats.',
    step: 'Pas', summary: 'La teva casa', send: 'Continua al configurador',
    noPrice: 'El pressupost el prepara l’equip de ModularDom a partir d’aquestes decisions.',
    surface: { label: 'Superfície', unit: 'm²', hint: 'Superfície construïda aproximada.' },
    floors: { label: 'Plantes', options: ['Una planta', 'Dues plantes'] },
    bedrooms: { label: 'Habitacions', options: ['2', '3', '4', '5 o més'] },
    system: { label: 'Sistema constructiu', options: ['Formigó cel·lular', 'Entramat lleuger de fusta', 'Aconselleu-me'] },
    style: { label: 'Estil arquitectònic', options: ['Contemporani', 'Mediterrani', 'Encara no ho sé'] },
    finishes: { label: 'Acabats', options: ['Clars i minerals', 'Càlids, amb fusta', 'Ho decidim junts'] },
    extras: { label: 'Extres', options: ['Piscina', 'Porxo', 'Garatge', 'Domòtica', 'Plaques solars'], hint: 'Tria tot el que t’agradaria tenir.' },
    none: 'Sense extres',
  },
  process: {
    name: 'Procés constructiu',
    title: ['De la primera conversa', '*a les claus.*'],
    text: 'Sis passos, sempre en el mateix ordre i sempre amb tu.',
    steps: [
      { name: 'Primer contacte', text: 'Ens expliques com vols viure i on.' },
      { name: 'Disseny i avantprojecte', text: 'Donem forma a la casa: distribució, volums i materials.' },
      { name: 'Pressupost', text: 'Un pressupost detallat abans de comprometre’t.' },
      { name: 'Projecte i llicència', text: 'Redactem el projecte i tramitem la llicència.' },
      { name: 'Construcció', text: 'Construïm amb el sistema que hem triat plegats.' },
      { name: 'Entrega de l’habitatge', text: 'La casa acabada, clau en mà.' },
    ],
  },
  mineral: {
    name: 'ModularDom MINERAL',
    title: ['Bungalows de', 'formigó cel·lular.'],
    text: 'La línia de ModularDom per a càmpings i complexos turístics.',
    audience: 'Per a professionals',
    slots: [
      { name: 'Models', text: 'La gamma de bungalows.' },
      { name: 'Plànols', text: 'Plantes i alçats de cada model.' },
      { name: 'Distribucions', text: 'Opcions d’interior.' },
      { name: 'Superfícies', text: 'Mides de cada model.' },
      { name: 'Acabats i extres', text: 'Opcions d’equipament.' },
    ],
    form: {
      title: 'Sol·licita un pressupost professional',
      kind: { label: 'Establiment', options: ['Càmping', 'Complex turístic', 'Altres'] },
      units: 'Unitats', name: 'Nom i cognoms', company: 'Empresa', email: 'Correu electrònic', phone: 'Telèfon',
      message: 'Explica’ns el projecte', submit: 'Sol·licita pressupost',
      ready: 'Sol·licitud preparada. L’enviament s’activarà quan connectem el CRM; ara no s’ha enviat res.',
      error: 'No s’ha pogut enviar. Torna-ho a provar.', required: 'Cal omplir aquest camp.',
    },
  },
  closing: { title: ['L’arquitectura', '*de viure.*'], text: 'Explica’ns com vols viure-hi. La dissenyem a mida i te l’entreguem clau en mà.' },
};

const es: Dictionary = {
  meta: {
    title: 'ModularDom · La vida que imaginas empieza aquí',
    description: 'Casas a medida, eficientes y llave en mano. Recorre una casa ModularDom y empieza a configurar la tuya.',
  },
  nav: {
    homes: 'Casas a medida', projects: 'Proyectos', systems: 'Sistemas constructivos', configurator: 'Configurador',
    mineral: 'ModularDom MINERAL', process: 'Cómo trabajamos', about: 'Quiénes somos', contact: 'Contacto', clients: 'Área de clientes',
  },
  ui: {
    menu: 'Menú', close: 'Cerrar', skip: 'Ir al contenido', language: 'Idioma', tour: 'Recorrido por la casa',
    scroll: 'Desplázate para entrar', configure: 'Configura tu casa', configureShort: 'Configurador',
    projects: 'Ver proyectos', contact: 'Habla con nosotros', contactShort: 'Contacto',
    info: 'Solicita información', visit: 'Reserva una visita', whatsapp: 'Escríbenos por WhatsApp',
    more: 'Saber más', drag: 'Arrastra', concept: 'Visualización conceptual',
    soonTitle: 'Estamos preparando esta página.', soonText: 'Mientras tanto, puedes recorrer la casa o escribirnos.',
    back: 'Volver al inicio', rights: 'Todos los derechos reservados.', from: 'desde', pending: 'En preparación',
  },
  stations: {
    exterior: { name: 'Exterior', title: ['La vida que imaginas', '*empieza aquí.*'], text: 'Casas a medida, eficientes y llave en mano.' },
    entrada: { name: 'Entrada', title: ['Redefinimos la manera', '*de construir.*'], text: 'Arquitectura, innovación y eficiencia.' },
    interior: { name: 'Interior', title: ['Una casa tan única', '*como tú.*'], text: 'Viviendas completamente personalizadas.' },
    cuina: { name: 'Cocina', title: ['Cada detalle.', 'Cada decisión.', '*Tuya.*'], text: 'Calidades, materiales, acabados y personalización.' },
  },
  values: ['A medida', 'Eficientes', 'Llave en mano'],
  projects: {
    name: 'Proyectos',
    title: ['No construimos', '*dos casas iguales.*'],
    text: 'Aquí publicaremos las obras de ModularDom. Mientras tanto, vuelve a mirar espacio a espacio la casa que acabas de recorrer.',
    conceptNote: 'Casa conceptual. Es una visualización, no una obra construida.',
    spaces: { facana: 'Fachada', acces: 'Acceso', llindar: 'Umbral', sala: 'Salón', escala: 'Escalera', cuina: 'Cocina' },
    fields: { location: 'Ubicación', surface: 'Superficie', year: 'Año', system: 'Sistema' },
  },
  systems: {
    name: 'Sistemas constructivos',
    title: ['Una casa,', '*capa a capa.*'],
    text: 'Dos sistemas para construir la misma idea: hormigón celular o entramado ligero de madera. Desmonta la casa y mira qué hay dentro.',
    hint: 'Sigue bajando para desmontarla',
    note: 'Representación conceptual. No refleja espesores, composiciones ni prestaciones.',
    fallback: 'La visualización 3D no está disponible en este dispositivo.',
    items: {
      cellular: { name: 'Hormigón celular', text: 'Muros de bloques minerales.' },
      timber: { name: 'Entramado ligero de madera', text: 'Estructura de montantes y vigas de madera.' },
    },
    layers: {
      foundation: { name: 'Cimentación', text: 'La base sobre la que se levanta la casa.' },
      structure: { name: 'Estructura', text: 'Lo que sostiene la casa.', cellular: 'Muros de bloques de hormigón celular.', timber: 'Entramado de montantes y vigas de madera.' },
      envelope: { name: 'Cerramientos', text: 'La piel que cierra la estructura.' },
      insulation: { name: 'Aislamientos', text: 'La capa que protege el interior del frío y del calor.' },
      services: { name: 'Instalaciones', text: 'Agua, electricidad y climatización, integradas antes de los acabados.' },
      roof: { name: 'Cubierta', text: 'El plano que cubre y protege la casa.' },
      finishes: { name: 'Acabados', text: 'Lo que se ve y se toca: revestimientos, carpintería y vidrio.' },
    },
  },
  materials: {
    name: 'Calidades y acabados',
    title: ['El lujo es', '*poder elegir.*'],
    text: 'Madera, piedra, vidrio. Cada superficie de tu casa se elige contigo.',
    note: 'Muestras conceptuales, extraídas de la visualización. Los materiales de cada casa se definen en su proyecto.',
    sample: 'Muestra conceptual',
    groups: {
      woods: { name: 'Maderas', samples: [{ name: 'Roble', where: 'Puerta de entrada' }, { name: 'Lamas de roble', where: 'Paramento de la escalera' }] },
      stone: { name: 'Piedra', samples: [{ name: 'Travertino', where: 'Fachada' }, { name: 'Piedra con veta', where: 'Isla de la cocina' }] },
      floors: { name: 'Pavimentos', samples: [{ name: 'Piedra pulida', where: 'Salón' }, { name: 'Peldaños iluminados', where: 'Acceso' }] },
      cladding: { name: 'Revestimientos', samples: [{ name: 'Paneles de roble', where: 'Cocina' }, { name: 'Piedra clara', where: 'Muro de la chimenea' }] },
      joinery: { name: 'Carpintería', samples: [{ name: 'Cerramientos de suelo a techo', where: 'Salón' }, { name: 'Puerta pivotante', where: 'Entrada' }] },
      interiors: { name: 'Acabados interiores', samples: [{ name: 'Luz integrada', where: 'Techos y zócalos' }, { name: 'Textiles naturales', where: 'Salón' }] },
    },
  },
  configurator: {
    name: 'Configurador',
    title: ['Diséñala', '*a tu gusto.*'],
    text: 'Siete decisiones para empezar a dar forma a tu casa. El resto lo definimos juntos.',
    step: 'Paso', summary: 'Tu casa', send: 'Continúa en el configurador',
    noPrice: 'El presupuesto lo prepara el equipo de ModularDom a partir de estas decisiones.',
    surface: { label: 'Superficie', unit: 'm²', hint: 'Superficie construida aproximada.' },
    floors: { label: 'Plantas', options: ['Una planta', 'Dos plantas'] },
    bedrooms: { label: 'Habitaciones', options: ['2', '3', '4', '5 o más'] },
    system: { label: 'Sistema constructivo', options: ['Hormigón celular', 'Entramado ligero de madera', 'Aconsejadme'] },
    style: { label: 'Estilo arquitectónico', options: ['Contemporáneo', 'Mediterráneo', 'Aún no lo sé'] },
    finishes: { label: 'Acabados', options: ['Claros y minerales', 'Cálidos, con madera', 'Lo decidimos juntos'] },
    extras: { label: 'Extras', options: ['Piscina', 'Porche', 'Garaje', 'Domótica', 'Placas solares'], hint: 'Elige todo lo que te gustaría tener.' },
    none: 'Sin extras',
  },
  process: {
    name: 'Proceso constructivo',
    title: ['De la primera conversación', '*a las llaves.*'],
    text: 'Seis pasos, siempre en el mismo orden y siempre contigo.',
    steps: [
      { name: 'Primer contacto', text: 'Nos cuentas cómo quieres vivir y dónde.' },
      { name: 'Diseño y anteproyecto', text: 'Damos forma a la casa: distribución, volúmenes y materiales.' },
      { name: 'Presupuesto', text: 'Un presupuesto detallado antes de comprometerte.' },
      { name: 'Proyecto y licencia', text: 'Redactamos el proyecto y tramitamos la licencia.' },
      { name: 'Construcción', text: 'Construimos con el sistema que hemos elegido juntos.' },
      { name: 'Entrega de la vivienda', text: 'La casa terminada, llave en mano.' },
    ],
  },
  mineral: {
    name: 'ModularDom MINERAL',
    title: ['Bungalows de', 'hormigón celular.'],
    text: 'La línea de ModularDom para campings y complejos turísticos.',
    audience: 'Para profesionales',
    slots: [
      { name: 'Modelos', text: 'La gama de bungalows.' },
      { name: 'Planos', text: 'Plantas y alzados de cada modelo.' },
      { name: 'Distribuciones', text: 'Opciones de interior.' },
      { name: 'Superficies', text: 'Medidas de cada modelo.' },
      { name: 'Acabados y extras', text: 'Opciones de equipamiento.' },
    ],
    form: {
      title: 'Solicita un presupuesto profesional',
      kind: { label: 'Establecimiento', options: ['Camping', 'Complejo turístico', 'Otros'] },
      units: 'Unidades', name: 'Nombre y apellidos', company: 'Empresa', email: 'Correo electrónico', phone: 'Teléfono',
      message: 'Cuéntanos el proyecto', submit: 'Solicita presupuesto',
      ready: 'Solicitud preparada. El envío se activará cuando conectemos el CRM; ahora no se ha enviado nada.',
      error: 'No se ha podido enviar. Inténtalo de nuevo.', required: 'Hay que rellenar este campo.',
    },
  },
  closing: { title: ['La arquitectura', '*de vivir.*'], text: 'Cuéntanos cómo quieres vivir en ella. La diseñamos a medida y te la entregamos llave en mano.' },
};

export const dictionaries: Record<Locale, Dictionary> = { ca, es };
