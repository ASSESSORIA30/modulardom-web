import type { Locale } from './i18n';

export const COMMERCIAL_KEYS = ['homes', 'systems', 'process', 'about'] as const;
export type CommercialKey = (typeof COMMERCIAL_KEYS)[number];
export const isCommercialPage = (key: string): key is CommercialKey => (COMMERCIAL_KEYS as readonly string[]).includes(key);

type CommercialPage = { title: string; seoTitle: string; intro: string; sections: { title: string; text: string }[] };

export const COMMERCIAL: Record<Locale, Record<CommercialKey, CommercialPage>> = {
  ca: {
    homes: {
      title: 'Cases industrialitzades a mida a Catalunya',
      seoTitle: 'Cases industrialitzades a mida a Catalunya',
      intro: 'Dissenya el teu habitatge amb ModularDom: cases de formigó cel·lular i d’entramat lleuger de fusta, amb projecte personalitzat i opció clau en mà. Visita la nostra casa pilot a Bellvís, Lleida, per conèixer la proposta de prop.',
      sections: [
        { title: 'Una casa adaptada al teu terreny i a la teva vida', text: 'Comença per la superfície, el nombre de plantes i la distribució que necessites. El projecte tècnic definirà la implantació al terreny, l’orientació, l’accessibilitat i les solucions que permeti la normativa urbanística.' },
        { title: 'Quant costa construir una casa?', text: 'El configurador et permet veure un pressupost orientatiu segons els metres quadrats, el tipus de coberta, la distribució, la climatització i els extres. Quan el servei de pressupostos està actiu, pots descarregar el document amb el desglossament d’imports i impostos. L’oferta definitiva depèn de l’estudi tècnic i de la parcel·la.' },
        { title: 'Formigó cel·lular o entramat lleuger de fusta', text: 'Treballem amb aquests dos sistemes constructius. La tria depèn de les característiques del projecte i dels teus objectius de disseny i confort. Consulta els sistemes i les qualitats abans de decidir.' },
        { title: 'Puc començar si encara no tinc terreny?', text: 'Sí: pots utilitzar el configurador com a primera orientació i contactar amb nosaltres. Abans de definir l’oferta caldrà estudiar el terreny, les condicions urbanístiques i els treballs necessaris.' },
      ],
    },
    systems: {
      title: 'Formigó cel·lular i entramat lleuger de fusta',
      seoTitle: 'Cases de formigó cel·lular i entramat lleuger de fusta',
      intro: 'Coneix els dos sistemes de construcció que ofereix ModularDom i les capes que formen un habitatge.',
      sections: [
        { title: 'Construcció amb formigó cel·lular', text: 'Un sistema amb murs de blocs minerals de formigó cel·lular. El projecte defineix la composició dels murs, l’estructura, els aïllaments i els acabats d’acord amb la normativa aplicable.' },
        { title: 'Construcció amb entramat lleuger de fusta', text: 'Una estructura de muntants i bigues de fusta integrada amb les capes d’aïllament, tancaments i acabats. Les dimensions i les prestacions es determinen al projecte tècnic.' },
        { title: 'Quin sistema és més adequat per a la meva casa?', text: 'Depèn del disseny, la parcel·la, els requeriments estructurals i les prestacions que es vulguin assolir. Valorem les opcions amb tu sense atribuir una certificació energètica concreta a totes les cases.' },
      ],
    },
    process: {
      title: 'Com construïm la teva casa, pas a pas',
      seoTitle: 'Procés de construcció d’una casa clau en mà',
      intro: 'De la primera conversa al lliurament: definim el projecte, el pressupost i l’execució amb tu. El calendari concret es determina en funció del projecte, el terreny i les llicències.',
      sections: [
        { title: 'Primer, la viabilitat', text: 'Si tens terreny, facilita’ns el municipi i les dades disponibles. L’estudi de les condicions urbanístiques i tècniques permet valorar l’habitatge que vols construir.' },
        { title: 'Pressupost i projecte', text: 'La simulació web és el punt de partida. Les condicions, les inclusions i els amidaments finals queden definits a l’oferta i al projecte corresponents.' },
      ],
    },
    about: {
      title: 'ModularDom, construcció a mida des de Lleida',
      seoTitle: 'ModularDom | Construcció d’habitatges a mida a Lleida',
      intro: 'Som ModularDom, una empresa de construcció d’habitatges amb sistemes de formigó cel·lular i entramat lleuger de fusta. El nostre objectiu és unir personalització, claredat en el pressupost i eficiència constructiva.',
      sections: [
        { title: 'Coneix la casa pilot a Bellvís', text: 'La casa pilot és a Bellvís, a la província de Lleida. Sol·licita una visita per parlar del teu projecte, conèixer els materials i valorar les opcions de construcció. La visita queda pendent de confirmació.' },
        { title: 'Comença pel teu pressupost', text: 'El configurador permet plantejar una primera proposta segons les necessitats de la teva família. Si vols avançar, el nostre equip t’ajudarà a concretar el projecte i el seu abast.' },
      ],
    },
  },
  es: {
    homes: {
      title: 'Casas industrializadas a medida en Cataluña',
      seoTitle: 'Casas industrializadas a medida en Cataluña',
      intro: 'Diseña tu vivienda con ModularDom: casas de hormigón celular y entramado ligero de madera, con proyecto personalizado y opción llave en mano. Visita nuestra casa piloto en Bellvís, Lleida, para conocer la propuesta de cerca.',
      sections: [
        { title: 'Una casa adaptada a tu terreno y a tu vida', text: 'Empieza por la superficie, el número de plantas y la distribución que necesitas. El proyecto técnico definirá la implantación en el terreno, la orientación, la accesibilidad y las soluciones que permita la normativa urbanística.' },
        { title: '¿Cuánto cuesta construir una casa?', text: 'El configurador te permite consultar un presupuesto orientativo según los metros cuadrados, el tipo de cubierta, la distribución, la climatización y los extras. Cuando el servicio de presupuestos está activo, puedes descargar el documento con el desglose de importes e impuestos. La oferta definitiva depende del estudio técnico y de la parcela.' },
        { title: 'Hormigón celular o entramado ligero de madera', text: 'Trabajamos con estos dos sistemas constructivos. La elección depende de las características del proyecto y de tus objetivos de diseño y confort. Consulta los sistemas y las calidades antes de decidir.' },
        { title: '¿Puedo empezar si todavía no tengo terreno?', text: 'Sí: puedes utilizar el configurador como primera orientación y contactar con nosotros. Antes de definir la oferta será necesario estudiar el terreno, las condiciones urbanísticas y los trabajos necesarios.' },
      ],
    },
    systems: {
      title: 'Hormigón celular y entramado ligero de madera',
      seoTitle: 'Casas de hormigón celular y entramado ligero de madera',
      intro: 'Conoce los dos sistemas de construcción que ofrece ModularDom y las capas que forman una vivienda.',
      sections: [
        { title: 'Construcción con hormigón celular', text: 'Un sistema con muros de bloques minerales de hormigón celular. El proyecto define la composición de los muros, la estructura, los aislamientos y los acabados conforme a la normativa aplicable.' },
        { title: 'Construcción con entramado ligero de madera', text: 'Una estructura de montantes y vigas de madera integrada con las capas de aislamiento, cerramientos y acabados. Las dimensiones y prestaciones se determinan en el proyecto técnico.' },
        { title: '¿Qué sistema es más adecuado para mi casa?', text: 'Depende del diseño, la parcela, los requisitos estructurales y las prestaciones que se quieran alcanzar. Valoramos las opciones contigo sin atribuir una certificación energética concreta a todas las casas.' },
      ],
    },
    process: {
      title: 'Cómo construimos tu casa, paso a paso',
      seoTitle: 'Proceso de construcción de una casa llave en mano',
      intro: 'De la primera conversación a la entrega: definimos el proyecto, el presupuesto y la ejecución contigo. El calendario concreto se determina en función del proyecto, el terreno y las licencias.',
      sections: [
        { title: 'Primero, la viabilidad', text: 'Si tienes terreno, facilítanos el municipio y los datos disponibles. El estudio de las condiciones urbanísticas y técnicas permite valorar la vivienda que quieres construir.' },
        { title: 'Presupuesto y proyecto', text: 'La simulación web es el punto de partida. Las condiciones, inclusiones y mediciones finales quedan definidas en la oferta y el proyecto correspondientes.' },
      ],
    },
    about: {
      title: 'ModularDom, construcción a medida desde Lleida',
      seoTitle: 'Construcción de viviendas a medida en Lleida',
      intro: 'Somos ModularDom, una empresa de construcción de viviendas con sistemas de hormigón celular y entramado ligero de madera. Nuestro objetivo es unir personalización, claridad en el presupuesto y eficiencia constructiva.',
      sections: [
        { title: 'Conoce la casa piloto en Bellvís', text: 'La casa piloto está en Bellvís, en la provincia de Lleida. Solicita una visita para hablar de tu proyecto, conocer los materiales y valorar las opciones de construcción. La visita queda pendiente de confirmación.' },
        { title: 'Empieza por tu presupuesto', text: 'El configurador permite plantear una primera propuesta según las necesidades de tu familia. Si quieres avanzar, nuestro equipo te ayudará a concretar el proyecto y su alcance.' },
      ],
    },
  },
};
