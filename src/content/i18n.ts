export const LOCALES = ['ca', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** every page of the site, with a descriptive address in each language */
export const NAV = [
  { key: 'homes', slug: { ca: 'cases-a-mida', es: 'casas-a-medida' } },
  { key: 'projects', slug: { ca: 'projectes', es: 'proyectos' } },
  { key: 'systems', slug: { ca: 'sistemes-constructius', es: 'sistemas-constructivos' } },
  { key: 'configurator', slug: { ca: 'configurador', es: 'configurador' } },
  { key: 'mineral', slug: { ca: 'mineral', es: 'mineral' } },
  { key: 'process', slug: { ca: 'com-treballem', es: 'como-trabajamos' } },
  { key: 'about', slug: { ca: 'qui-som', es: 'quienes-somos' } },
  { key: 'contact', slug: { ca: 'contacte', es: 'contacto' } },
  { key: 'clients', slug: { ca: 'area-de-clients', es: 'area-de-clientes' } },
  { key: 'privacy', slug: { ca: 'privacitat', es: 'privacidad' } },
  { key: 'legal', slug: { ca: 'avis-legal', es: 'aviso-legal' } },
  { key: 'cookies', slug: { ca: 'galetes', es: 'cookies' } },
] as const;
/** pages with their own file under app/[lang]/ (the folder is the Catalan slug); the rest share the holding page */
export const BUILT: readonly string[] = ['projects', 'configurator', 'mineral', 'contact'];
/** Legal information lives in the footer, not the commercial menu. */
export const LEGAL_KEYS = ['privacy', 'legal', 'cookies'] as const;
export type LegalKey = (typeof LEGAL_KEYS)[number];
export const isLegalKey = (key: string): key is LegalKey => (LEGAL_KEYS as readonly string[]).includes(key);
export const MENU = NAV.filter((n) => !isLegalKey(n.key));
export const href = (lang: Locale, key: NavKey, query = '') => `/${lang}/${NAV.find((n) => n.key === key)!.slug[lang]}${query}`;
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
    /** ModularDom's published quality specification, verbatim from its configurator */
    spec: { title: string; items: { name: string; text: string }[] };
    groups: Record<MaterialGroupId, { name: string; samples: { name: string; where: string }[] }>;
  };
  configurator: {
    name: string; title: string[]; text: string; send: string; noPrice: string; visualNote: string;
    groups: { house: string; interior: string; equipment: string; look: string };
    surface: { label: string; unit: string; hint: string };
    floors: Choice; volume: Choice;
    bedrooms: string; bathrooms: string; suite: Choice; kitchen: Choice;
    garage: { label: string; none: string };
    climate: Choice; extras: Choice;
    system: Choice; facade: Choice; roof: Choice;
    quote: { title: string; subtotal: string; vatWorks: string; vatArch: string; total: string; note: string };
  };
  process: { name: string; title: string[]; text: string; steps: { name: string; text: string }[] };
  mineral: {
    name: string; title: string[]; text: string; audience: string; catalogue: string;
    slots: { name: string; text: string }[];
    form: { title: string; kind: Choice; units: string; submit: string };
    compare: string;
  };
  /** one line per page, for search results: only what is verifiably true */
  seo: Record<NavKey, string>;
  forms: {
    name: string; email: string; phone: string; city: string; company: string; message: string;
    plot: Choice; plotNote: string; consent: string; privacy: string; privacyInfo: string;
    required: string; invalidEmail: string; invalidPhone: string; needConsent: string;
    sending: string; sent: string; notSent: string; error: string; rate: string;
  };
  request: { title: string; text: string; submit: string; dossier: string; dossierError: string; preparing: string };
  budget: {
    download: string; visit: string; total: string; pending: string; pendingNote: string; roofHint: string;
    formTitle: string; formText: string; visitTitle: string; visitText: string; city: string; optional: string; privacyNote: string;
    submitDownload: string; submitVisit: string; preparing: string; sending: string; close: string;
    done: string; reissued: string; recoverTitle: string; recoverText: string; copy: string; copied: string;
    visitDone: string; visitAgain: string; noPrice: string; error: string;
    recovered: string; original: string; current: string; sameTariff: string; originalPdf: string; recoverFail: string;
  };
  whatsapp: { general: string; configurator: string; visit: string; mineral: string };
  projectsPage: { title: string[]; emptyTitle: string; emptyText: string; plans: string };
  closing: {
    title: string[]; text: string; showHouse: string; write: string; call: string;
    form: { title: string; motive: Choice; submit: string };
  };
  footer: { legal: string };
};

const ca: Dictionary = {
  meta: {
    title: 'Cases industrialitzades a mida | ModularDom · Lleida',
    description: 'Cases de formigó cel·lular i entramat lleuger de fusta. Configura el teu habitatge a mida, calcula un pressupost i visita la casa pilot de Bellvís (Lleida).',
  },
  nav: {
    homes: 'Cases a mida', projects: 'Projectes', systems: 'Sistemes constructius', configurator: 'Configurador',
    mineral: 'ModularDom MINERAL', process: 'Com treballem', about: 'Qui som', contact: 'Contacte', clients: 'Àrea de clients', privacy: 'Privacitat', legal: 'Avís legal', cookies: 'Política de galetes',
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
    spec: {
      title: 'Memòria de qualitats',
      items: [
        { name: 'Sistema constructiu', text: 'Formigó cel·lular o sistema d’entramat lleuger d’altes prestacions, amb aïllament gairebé Passive House.' },
        { name: 'Eficiència energètica', text: 'Qualificació energètica A garantida. Gran estalvi en climatització i confort tèrmic tot l’any.' },
        { name: 'Acabats', text: 'Terra porcelànic de gran format, fusteria d’alumini amb trencament de pont tèrmic i doble envidrament.' },
        { name: 'Instal·lacions', text: 'Il·luminació LED i instal·lacions preparades per a un habitatge eficient.' },
      ],
    },
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
    title: ['Calcula', '*el teu pressupost.*'],
    text: 'Configura casa teva i mira el preu al moment, sense registrar-te.',
    send: 'Continua al configurador',
    noPrice: 'El pressupost detallat el prepara l’equip de ModularDom a partir d’aquestes decisions.',
    visualNote: 'El sistema i la façana canvien la maqueta i es concreten al projecte.',
    groups: { house: 'La casa', interior: 'L’interior', equipment: 'Equipament', look: 'Aspecte' },
    surface: { label: 'Superfície', unit: 'm²', hint: 'Superfície construïda aproximada.' },
    floors: { label: 'Plantes', options: ['Una planta', 'Dues plantes'] },
    volume: { label: 'Volumetria', options: ['Compacta', 'En L'] },
    bedrooms: 'Habitacions',
    bathrooms: 'Banys',
    suite: { label: 'Suite principal', options: ['Sense suite', 'Suite amb bany', 'Suite amb bany i vestidor'] },
    kitchen: { label: 'Cuina', options: ['Bàsica', 'Amb illa'] },
    garage: { label: 'Garatge', none: 'Cap' },
    climate: { label: 'Climatització', options: ['Aerotèrmia', 'Aire per conductes'] },
    extras: { label: 'Extres', options: ['Safareig', 'Piscina', 'Porxo', 'Plaques solars fotovoltaiques'] },
    system: { label: 'Sistema constructiu', options: ['Formigó cel·lular', 'Entramat lleuger de fusta'] },
    facade: { label: 'Façana', options: ['Pedra', 'Pedra i fusta'] },
    roof: { label: 'Coberta', options: ['Plana', 'Inclinada d’una aigua', 'A dues aigües'] },
    quote: { title: 'Pressupost orientatiu', subtotal: 'Base imposable', vatWorks: 'IVA obra', vatArch: 'IVA honoraris', total: 'Total', note: 'Pressupost orientatiu subjecte a projecte tècnic, ubicació, accessibilitat i amidaments finals.' },
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
    catalogue: 'Catàleg',
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
      units: 'Unitats', submit: 'Sol·licita pressupost',
    },
    compare: 'Comparativa de models',
  },
  closing: {
    title: ['L’arquitectura', '*de viure.*'],
    text: 'Explica’ns com vols viure-hi. La dissenyem a mida i te l’entreguem clau en mà.',
    showHouse: 'Casa pilot visitable a Bellvís (Lleida).',
    write: 'Escriu-nos', call: 'Truca’ns',
    form: { title: 'Parlem de casa teva', motive: { label: 'Què necessites?', options: ['Informació', 'Visitar la casa pilot'] }, submit: 'Envia la sol·licitud' },
  },
  seo: {
    homes: 'Cases a mida, eficients i clau en mà.',
    projects: 'Els projectes de ModularDom.',
    systems: 'Formigó cel·lular i entramat lleuger de fusta: els dos sistemes constructius de ModularDom.',
    configurator: 'Calcula el pressupost orientatiu de casa teva: superfície, plantes, coberta, distribució, instal·lacions i extres amb maqueta 3D.',
    mineral: 'ModularDom MINERAL: bungalows de formigó cel·lular per a càmpings i complexos turístics.',
    process: 'Com treballem, del primer contacte a l’entrega de l’habitatge.',
    about: 'Coneix ModularDom, construcció d’habitatges a mida a Lleida i visita a la casa pilot de Bellvís.',
    contact: 'Contacta amb ModularDom o reserva una visita a la casa pilot de Bellvís (Lleida).',
    clients: 'Accés a l’àrea de clients de ModularDom.',
    privacy: 'Política de privacitat de ModularDom.', legal: 'Dades identificatives i condicions d’ús de ModularDom.', cookies: 'Informació sobre galetes i emmagatzematge tècnic de ModularDom.',
  },
  forms: {
    name: 'Nom i cognoms', email: 'Correu electrònic', phone: 'Telèfon', city: 'Municipi', company: 'Empresa', message: 'Observacions',
    plot: { label: 'Terreny', options: ['Ja en tinc', 'Encara no', 'En busco'] },
    plotNote: 'On és el terreny? (opcional)',
    consent: 'He llegit la', privacy: 'política de privacitat',
    privacyInfo: 'Responsable: MODULARDOM OBRAS Y REFORMAS, S.L. Finalitat: atendre la teva sol·licitud, pressupost o visita. Base: mesures precontractuals o interès legítim, segons la consulta. Pots exercir els drets a info@modulardom.com. Més informació a la política de privacitat.',
    required: 'Cal omplir aquest camp.', invalidEmail: 'Aquest correu no sembla correcte.', invalidPhone: 'Cal un telèfon de 9 xifres com a mínim.', needConsent: 'Cal confirmar que has llegit la política de privacitat.',
    sending: 'Enviant…',
    sent: 'Sol·licitud rebuda. Referència: {ref}.',
    notSent: 'Ara mateix la web encara no pot rebre sol·licituds i no s’ha enviat res. Escriu-nos a {email} o truca’ns al {phone}.',
    error: 'No s’ha pogut enviar. Torna-ho a provar o escriu-nos a {email}.',
    rate: 'Massa intents seguits. Torna-ho a provar d’aquí a uns minuts.',
  },
  budget: {
    download: 'Descarregar pressupost', visit: 'Reserva una visita a la nostra casa pilot', total: 'Total amb IVA',
    pending: 'Pendent de valorar', pendingNote: 'El total no inclou les partides pendents de valorar: les valorem en l’estudi tècnic.',
    roofHint: 'La coberta plana és l’estàndard, sense suplement. Les inclinades es calculen pels metres quadrats de coberta.',
    formTitle: 'A nom de qui fem el pressupost?', formText: 'El descarregaràs a l’instant, en PDF. No cal crear cap compte.',
    visitTitle: 'Reserva una visita a la casa pilot', visitText: 'Deixa’ns les teves dades i et trucarem per confirmar dia i hora.',
    city: 'Municipi on vols construir', optional: 'opcional',
    privacyNote: 'Responsable: MODULARDOM OBRAS Y REFORMAS, S.L. Tractem les dades per elaborar i gestionar el pressupost o la visita (mesures precontractuals), inclòs el seguiment de la sol·licitud al CRM. Drets: info@modulardom.com. No et subscrivim a publicitat. Les dades es poden recordar durant la sessió.',
    submitDownload: 'Descarregar pressupost', submitVisit: 'Sol·licitar la visita', preparing: 'Preparant el pressupost…', sending: 'Enviant…', close: 'Tanca',
    done: 'Pressupost descarregat. Referència: {ref}.', reissued: 'És el mateix pressupost que ja tenies: conserva la referència {ref}.',
    recoverTitle: 'El teu enllaç privat', recoverText: 'Desa’l per tornar a aquest pressupost durant {days} dies, canviar opcions i generar-ne un d’actualitzat. No conté cap dada personal.',
    copy: 'Copia l’enllaç', copied: 'Enllaç copiat',
    visitDone: 'Visita sol·licitada. Et contactarem per confirmar dia i hora.', visitAgain: 'Ja tenim la teva sol·licitud de visita. Et contactarem per confirmar-la.',
    noPrice: 'Ara mateix no podem calcular el pressupost i no s’ha generat cap document. Torna-ho a provar d’aquí a una estona o escriu-nos a {email}.',
    error: 'No s’ha pogut completar i no s’ha desat res a mitges. Torna-ho a provar: no es duplicarà.',
    recovered: 'Has recuperat el pressupost {ref}, del {date}.', original: 'Total del pressupost original (tarifa {n})', current: 'Aquesta configuració amb la tarifa vigent',
    sameTariff: 'La tarifa no ha canviat des de llavors.', originalPdf: 'Descarrega el PDF original', recoverFail: 'Aquest enllaç ja no és vàlid: ha caducat o s’ha revocat.',
  },
  request: {
    title: 'Rep el teu pressupost',
    text: 'Deixa’ns les teves dades i l’equip de ModularDom et prepara el pressupost d’aquesta configuració.',
    submit: 'Sol·licita el pressupost', dossier: 'Descarrega el dossier (PDF)', dossierError: 'No s’ha pogut generar el dossier. Torna-ho a provar.', preparing: 'Preparant el dossier…',
  },
  whatsapp: {
    general: 'Hola, voldria informació sobre les cases de ModularDom.',
    configurator: 'Hola, he fet una configuració a la web i voldria un pressupost.',
    visit: 'Hola, voldria visitar la casa pilot de Bellvís.',
    mineral: 'Hola, voldria informació sobre els bungalows MINERAL per al meu establiment.',
  },
  projectsPage: {
    title: ['Projectes'],
    emptyTitle: 'Aviat hi publicarem les obres de ModularDom.',
    emptyText: 'Mentrestant, pots recórrer la casa conceptual a la portada o demanar-nos informació.',
    plans: 'Plànols',
  },
  footer: { legal: 'Privacitat' },
};

const es: Dictionary = {
  meta: {
    title: 'Casas industrializadas a medida | ModularDom · Lleida',
    description: 'Casas de hormigón celular y entramado ligero de madera. Configura tu vivienda a medida, calcula un presupuesto y visita la casa piloto de Bellvís (Lleida).',
  },
  nav: {
    homes: 'Casas a medida', projects: 'Proyectos', systems: 'Sistemas constructivos', configurator: 'Configurador',
    mineral: 'ModularDom MINERAL', process: 'Cómo trabajamos', about: 'Quiénes somos', contact: 'Contacto', clients: 'Área de clientes', privacy: 'Privacidad', legal: 'Aviso legal', cookies: 'Política de cookies',
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
    spec: {
      title: 'Memoria de calidades',
      items: [
        { name: 'Sistema constructivo', text: 'Hormigón celular y sistema de entramado ligero de altas prestaciones. Aislamiento casi Passive House.' },
        { name: 'Eficiencia energética', text: 'Calificación energética A garantizada. Gran ahorro en climatización y confort térmico todo el año.' },
        { name: 'Acabados', text: 'Suelo porcelánico de gran formato, carpintería de aluminio con rotura de puente térmico y doble acristalamiento.' },
        { name: 'Instalaciones', text: 'Iluminación LED e instalaciones preparadas para una vivienda eficiente.' },
      ],
    },
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
    title: ['Calcula', '*tu presupuesto.*'],
    text: 'Configura tu casa y mira el precio al momento, sin registrarte.',
    send: 'Continúa en el configurador',
    noPrice: 'El presupuesto detallado lo prepara el equipo de ModularDom a partir de estas decisiones.',
    visualNote: 'El sistema y la fachada cambian la maqueta y se concretan en el proyecto.',
    groups: { house: 'La casa', interior: 'El interior', equipment: 'Equipamiento', look: 'Aspecto' },
    surface: { label: 'Superficie', unit: 'm²', hint: 'Superficie construida aproximada.' },
    floors: { label: 'Plantas', options: ['Una planta', 'Dos plantas'] },
    volume: { label: 'Volumetría', options: ['Compacta', 'En L'] },
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    suite: { label: 'Suite principal', options: ['Sin suite', 'Suite con baño', 'Suite con baño y vestidor'] },
    kitchen: { label: 'Cocina', options: ['Básica', 'Con isla'] },
    garage: { label: 'Garaje', none: 'Ninguno' },
    climate: { label: 'Climatización', options: ['Aerotermia', 'Aire por conductos'] },
    extras: { label: 'Extras', options: ['Lavadero', 'Piscina', 'Porche', 'Placas solares fotovoltaicas'] },
    system: { label: 'Sistema constructivo', options: ['Hormigón celular', 'Entramado ligero de madera'] },
    facade: { label: 'Fachada', options: ['Piedra', 'Piedra y madera'] },
    roof: { label: 'Cubierta', options: ['Plana', 'Inclinada a un agua', 'A dos aguas'] },
    quote: { title: 'Presupuesto orientativo', subtotal: 'Base imponible', vatWorks: 'IVA obra', vatArch: 'IVA honorarios', total: 'Total', note: 'Presupuesto orientativo sujeto a proyecto técnico, ubicación, accesibilidad y mediciones finales.' },
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
    catalogue: 'Catálogo',
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
      units: 'Unidades', submit: 'Solicita presupuesto',
    },
    compare: 'Comparativa de modelos',
  },
  closing: {
    title: ['La arquitectura', '*de vivir.*'],
    text: 'Cuéntanos cómo quieres vivir en ella. La diseñamos a medida y te la entregamos llave en mano.',
    showHouse: 'Casa piloto visitable en Bellvís (Lleida).',
    write: 'Escríbenos', call: 'Llámanos',
    form: { title: 'Hablemos de tu casa', motive: { label: '¿Qué necesitas?', options: ['Información', 'Visitar la casa piloto'] }, submit: 'Envía la solicitud' },
  },
  seo: {
    homes: 'Casas a medida, eficientes y llave en mano.',
    projects: 'Los proyectos de ModularDom.',
    systems: 'Hormigón celular y entramado ligero de madera: los dos sistemas constructivos de ModularDom.',
    configurator: 'Calcula el presupuesto orientativo de tu casa: superficie, plantas, cubierta, distribución, instalaciones y extras con maqueta 3D.',
    mineral: 'ModularDom MINERAL: bungalows de hormigón celular para campings y complejos turísticos.',
    process: 'Cómo trabajamos, del primer contacto a la entrega de la vivienda.',
    about: 'Conoce ModularDom, construcción de viviendas a medida en Lleida y visita a la casa piloto de Bellvís.',
    contact: 'Contacta con ModularDom o reserva una visita a la casa piloto de Bellvís (Lleida).',
    clients: 'Acceso al área de clientes de ModularDom.',
    privacy: 'Política de privacidad de ModularDom.', legal: 'Datos identificativos y condiciones de uso de ModularDom.', cookies: 'Información sobre cookies y almacenamiento técnico de ModularDom.',
  },
  forms: {
    name: 'Nombre y apellidos', email: 'Correo electrónico', phone: 'Teléfono', city: 'Municipio', company: 'Empresa', message: 'Observaciones',
    plot: { label: 'Terreno', options: ['Ya tengo', 'Aún no', 'Estoy buscando'] },
    plotNote: '¿Dónde está el terreno? (opcional)',
    consent: 'He leído la', privacy: 'política de privacidad',
    privacyInfo: 'Responsable: MODULARDOM OBRAS Y REFORMAS, S.L. Finalidad: atender tu solicitud, presupuesto o visita. Base: medidas precontractuales o interés legítimo, según la consulta. Puedes ejercer tus derechos en info@modulardom.com. Más información en la política de privacidad.',
    required: 'Hay que rellenar este campo.', invalidEmail: 'Este correo no parece correcto.', invalidPhone: 'Hace falta un teléfono de 9 cifras como mínimo.', needConsent: 'Hay que confirmar que has leído la política de privacidad.',
    sending: 'Enviando…',
    sent: 'Solicitud recibida. Referencia: {ref}.',
    notSent: 'Ahora mismo la web aún no puede recibir solicitudes y no se ha enviado nada. Escríbenos a {email} o llámanos al {phone}.',
    error: 'No se ha podido enviar. Inténtalo de nuevo o escríbenos a {email}.',
    rate: 'Demasiados intentos seguidos. Inténtalo de nuevo dentro de unos minutos.',
  },
  budget: {
    download: 'Descargar presupuesto', visit: 'Reserva una visita a nuestra casa piloto', total: 'Total con IVA',
    pending: 'Pendiente de valorar', pendingNote: 'El total no incluye las partidas pendientes de valorar: las valoramos en el estudio técnico.',
    roofHint: 'La cubierta plana es el estándar, sin suplemento. Las inclinadas se calculan por los metros cuadrados de cubierta.',
    formTitle: '¿A nombre de quién hacemos el presupuesto?', formText: 'Lo descargarás al instante, en PDF. No hace falta crear ninguna cuenta.',
    visitTitle: 'Reserva una visita a la casa piloto', visitText: 'Déjanos tus datos y te llamaremos para confirmar día y hora.',
    city: 'Municipio donde quieres construir', optional: 'opcional',
    privacyNote: 'Responsable: MODULARDOM OBRAS Y REFORMAS, S.L. Tratamos los datos para elaborar y gestionar el presupuesto o la visita (medidas precontractuales), incluido el seguimiento de la solicitud en el CRM. Derechos: info@modulardom.com. No te suscribimos a publicidad. Los datos pueden recordarse durante la sesión.',
    submitDownload: 'Descargar presupuesto', submitVisit: 'Solicitar la visita', preparing: 'Preparando el presupuesto…', sending: 'Enviando…', close: 'Cerrar',
    done: 'Presupuesto descargado. Referencia: {ref}.', reissued: 'Es el mismo presupuesto que ya tenías: conserva la referencia {ref}.',
    recoverTitle: 'Tu enlace privado', recoverText: 'Guárdalo para volver a este presupuesto durante {days} días, cambiar opciones y generar uno actualizado. No contiene ningún dato personal.',
    copy: 'Copiar el enlace', copied: 'Enlace copiado',
    visitDone: 'Visita solicitada. Te contactaremos para confirmar día y hora.', visitAgain: 'Ya tenemos tu solicitud de visita. Te contactaremos para confirmarla.',
    noPrice: 'Ahora mismo no podemos calcular el presupuesto y no se ha generado ningún documento. Vuelve a intentarlo en un rato o escríbenos a {email}.',
    error: 'No se ha podido completar y no se ha guardado nada a medias. Vuelve a intentarlo: no se duplicará.',
    recovered: 'Has recuperado el presupuesto {ref}, del {date}.', original: 'Total del presupuesto original (tarifa {n})', current: 'Esta configuración con la tarifa vigente',
    sameTariff: 'La tarifa no ha cambiado desde entonces.', originalPdf: 'Descarga el PDF original', recoverFail: 'Este enlace ya no es válido: ha caducado o se ha revocado.',
  },
  request: {
    title: 'Recibe tu presupuesto',
    text: 'Déjanos tus datos y el equipo de ModularDom te prepara el presupuesto de esta configuración.',
    submit: 'Solicita el presupuesto', dossier: 'Descarga el dossier (PDF)', dossierError: 'No se ha podido generar el dossier. Inténtalo de nuevo.', preparing: 'Preparando el dossier…',
  },
  whatsapp: {
    general: 'Hola, quería información sobre las casas de ModularDom.',
    configurator: 'Hola, he hecho una configuración en la web y quería un presupuesto.',
    visit: 'Hola, quería visitar la casa piloto de Bellvís.',
    mineral: 'Hola, quería información sobre los bungalows MINERAL para mi establecimiento.',
  },
  projectsPage: {
    title: ['Proyectos'],
    emptyTitle: 'Pronto publicaremos aquí las obras de ModularDom.',
    emptyText: 'Mientras tanto, puedes recorrer la casa conceptual en la portada o pedirnos información.',
    plans: 'Planos',
  },
  footer: { legal: 'Privacidad' },
};

export const dictionaries: Record<Locale, Dictionary> = { ca, es };
