import type { Locale } from './i18n';

export const COMMERCIAL_KEYS = ['homes', 'systems', 'process', 'about', 'aac', 'faq', 'blog', 'finishes'] as const;
export type CommercialKey = (typeof COMMERCIAL_KEYS)[number];
export const isCommercialPage = (key: string): key is CommercialKey => (COMMERCIAL_KEYS as readonly string[]).includes(key);

type CommercialPage = { title: string; seoTitle: string; intro: string; sections: { title: string; text: string }[] };

export const COMMERCIAL: Record<Locale, Record<CommercialKey, CommercialPage>> = {
  ca: {
    aac: {
      "title": "Habitatges de formigó cel·lular AAC",
      "seoTitle": "Cases de formigó cel·lular AAC",
      "intro": "Construïm habitatges a mida amb blocs de formigó cel·lular autoclavats. Una proposta que combina disseny, confort i una execució planificada per a cada parcel·la.",
      "sections": [
        {
          "title": "Aïllament i confort",
          "text": "L’estructura cel·lular del material contribueix a l’aïllament tèrmic. El comportament tèrmic i acústic de l’habitatge depèn de la composició completa dels tancaments, les finestres, l’orientació i les instal·lacions."
        },
        {
          "title": "Execució, resistència i durabilitat",
          "text": "Els blocs són lleugers i de geometria precisa. El projecte tècnic defineix l’estructura, la protecció davant la humitat i les prestacions contra el foc; es valoren els materials i els acabats de manera conjunta."
        },
        {
          "title": "Del terreny a les claus",
          "text": "Estudiem les necessitats i la parcel·la, preparem una estimació, definim el projecte tècnic i planifiquem la construcció i el lliurament."
        },
        {
          "title": "Calcula la teva proposta",
          "text": "Utilitza el configurador ModularDom per estimar l’habitatge amb les opcions actuals. La proposta definitiva necessita un estudi del terreny i del projecte; no utilitzem la calculadora antiga de codis postals com a tarifa comercial."
        }
      ]
    },
    faq: {
      "title": "Preguntes freqüents",
      "seoTitle": "Preguntes freqüents sobre cases industrialitzades",
      "intro": "Resolem els dubtes més habituals abans de construir un habitatge a mida.",
      "sections": [
        {
          "title": "Quant costa una casa?",
          "text": "El cost depèn de la superfície, la distribució, el sistema constructiu, la coberta, les instal·lacions, els extres i el terreny. El configurador ofereix una estimació desglossada quan la tarifa web està disponible. No és una oferta contractual."
        },
        {
          "title": "Quant es tarda a construir?",
          "text": "El calendari depèn del projecte, les llicències, la parcel·la i la planificació de l’obra. Fixem els terminis en funció de les condicions concretes."
        },
        {
          "title": "Quina diferència hi ha entre els sistemes?",
          "text": "ModularDom ofereix formigó cel·lular AAC i entramat lleuger de fusta. Cada sistema té una composició estructural i de tancament diferent; el projecte defineix quina solució és adequada."
        },
        {
          "title": "Calen permisos? I si el terreny té pendent?",
          "text": "L’habitatge ha de complir la normativa urbanística i tècnica aplicable. Cal estudiar la viabilitat, l’accés i les condicions del sòl abans de determinar la fonamentació i els treballs necessaris."
        },
        {
          "title": "És més econòmica i eficient que una casa convencional?",
          "text": "La planificació i la industrialització poden ajudar a controlar costos, residus i terminis. La comparació de preu i consum requereix habitatges equivalents, el mateix abast i una valoració tècnica."
        },
        {
          "title": "Quines garanties té?",
          "text": "Les garanties legals i contractuals aplicables es detallen a la documentació del projecte. Les prestacions i les certificacions s’han de justificar per a cada habitatge."
        },
        {
          "title": "Puc personalitzar la casa?",
          "text": "Sí. Podem valorar superfície, distribució, plantes, coberta, façana, instal·lacions i acabats, sempre dins de les possibilitats tècniques i urbanístiques."
        },
        {
          "title": "I la resistència estructural?",
          "text": "El projecte ha de justificar les accions i les exigències estructurals aplicables a l’emplaçament. No atribuïm una superioritat sísmica genèrica a totes les solucions."
        },
        {
          "title": "Es pot finançar amb una hipoteca?",
          "text": "Consulta amb l’entitat financera les condicions de finançament d’una autopromoció i la documentació que et demanarà."
        },
        {
          "title": "On construïu?",
          "text": "Som a Lleida. Contacta amb nosaltres indicant el municipi de la parcel·la perquè puguem valorar la disponibilitat i la logística."
        }
      ]
    },
    blog: {
      "title": "Casa industrialitzada o construcció tradicional?",
      "seoTitle": "Casa modular vs. casa tradicional: què cal comparar",
      "intro": "Si estàs pensant a construir un habitatge, el sistema constructiu és una decisió important. Aquest article recupera i actualitza els temes de la comparativa anterior de ModularDom.",
      "sections": [
        {
          "title": "Què és la construcció industrialitzada?",
          "text": "Incorpora materials o elements preparats mitjançant processos industrials i una execució planificada. A ModularDom treballem amb formigó cel·lular i entramat lleuger de fusta; el grau d’industrialització depèn del projecte."
        },
        {
          "title": "Preu i abast del pressupost",
          "text": "Compara pressupostos equivalents: superfície construïda, projecte tècnic, fonamentació, instal·lacions, acabats, treballs de parcel·la, impostos i exclusions. Un preu de construcció per metre quadrat no representa necessàriament el cost total."
        },
        {
          "title": "Terminis i planificació",
          "text": "La preparació i la coordinació de l’obra poden reduir temps d’execució i imprevistos. Llicències, accessos, disponibilitat de materials i complexitat de la casa condicionen el calendari."
        },
        {
          "title": "Eficiència energètica i confort",
          "text": "La qualitat de l’envolupant, l’orientació, la ventilació i les instal·lacions tenen un paper clau en la demanda energètica. Cal valorar prestacions concretes, no només el nom del sistema."
        },
        {
          "title": "Personalització i limitacions",
          "text": "La distribució, els acabats i l’arquitectura es poden adaptar al projecte. Els accessos, la logística, el terreny i la normativa poden determinar quina solució és més adequada."
        },
        {
          "title": "Com prendre la decisió",
          "text": "Comença amb un estudi de la parcel·la i una comparativa d’ofertes amb el mateix abast. El configurador i la visita a la casa pilot t’ajudaran a concretar els següents passos."
        }
      ]
    },
    finishes: {
      "title": "Materials, qualitats i acabats",
      "seoTitle": "Materials i acabats de les cases ModularDom",
      "intro": "Coneix les qualitats i les mostres de materials de ModularDom. La selecció detallada dels acabats de cada obra s’ha de vincular al projecte i a l’accés privat del client.",
      "sections": [
        {
          "title": "Tria els acabats amb el teu projecte",
          "text": "Els paviments, revestiments, fusteries, cuina i banys s’han de concretar en funció de la memòria de qualitats i de les opcions contractades."
        },
        {
          "title": "Configurador d’acabats",
          "text": "La versió interactiva anterior està pendent d’integració amb l’accés segur del CRM. De moment pots consultar les qualitats i les mostres següents i contactar amb nosaltres per concretar la selecció."
        }
      ]
    },
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
    aac: {
      "title": "Viviendas de hormigón celular AAC",
      "seoTitle": "Casas de hormigón celular AAC",
      "intro": "Construimos viviendas a medida con bloques de hormigón celular autoclavado. Una propuesta que combina diseño, confort y una ejecución planificada para cada parcela.",
      "sections": [
        {
          "title": "Aislamiento y confort",
          "text": "La estructura celular del material contribuye al aislamiento térmico. El comportamiento térmico y acústico de la vivienda depende de la composición completa de los cerramientos, las ventanas, la orientación y las instalaciones."
        },
        {
          "title": "Ejecución, resistencia y durabilidad",
          "text": "Los bloques son ligeros y de geometría precisa. El proyecto técnico define la estructura, la protección frente a la humedad y las prestaciones frente al fuego; se valoran conjuntamente materiales y acabados."
        },
        {
          "title": "Del terreno a las llaves",
          "text": "Estudiamos las necesidades y la parcela, preparamos una estimación, definimos el proyecto técnico y planificamos la construcción y la entrega."
        },
        {
          "title": "Calcula tu propuesta",
          "text": "Utiliza el configurador ModularDom para estimar la vivienda con las opciones actuales. La propuesta definitiva requiere un estudio del terreno y del proyecto; no utilizamos la antigua calculadora de códigos postales como tarifa comercial."
        }
      ]
    },
    faq: {
      "title": "Preguntas frecuentes",
      "seoTitle": "Preguntas frecuentes sobre casas industrializadas",
      "intro": "Resolvemos las dudas más habituales antes de construir una vivienda a medida.",
      "sections": [
        {
          "title": "¿Cuánto cuesta una casa?",
          "text": "El coste depende de la superficie, la distribución, el sistema constructivo, la cubierta, las instalaciones, los extras y el terreno. El configurador ofrece una estimación desglosada cuando la tarifa web está disponible. No es una oferta contractual."
        },
        {
          "title": "¿Cuánto se tarda en construir?",
          "text": "El calendario depende del proyecto, las licencias, la parcela y la planificación de la obra. Fijamos los plazos en función de las condiciones concretas."
        },
        {
          "title": "¿Qué diferencia hay entre los sistemas?",
          "text": "ModularDom ofrece hormigón celular AAC y entramado ligero de madera. Cada sistema tiene una composición estructural y de cerramiento distinta; el proyecto define qué solución es adecuada."
        },
        {
          "title": "¿Hacen falta permisos? ¿Y si el terreno tiene pendiente?",
          "text": "La vivienda debe cumplir la normativa urbanística y técnica aplicable. Es necesario estudiar la viabilidad, el acceso y las condiciones del suelo antes de determinar la cimentación y los trabajos necesarios."
        },
        {
          "title": "¿Es más económica y eficiente que una casa convencional?",
          "text": "La planificación y la industrialización pueden ayudar a controlar costes, residuos y plazos. La comparación de precio y consumo requiere viviendas equivalentes, el mismo alcance y una valoración técnica."
        },
        {
          "title": "¿Qué garantías tiene?",
          "text": "Las garantías legales y contractuales aplicables se detallan en la documentación del proyecto. Las prestaciones y las certificaciones deben justificarse para cada vivienda."
        },
        {
          "title": "¿Puedo personalizar la casa?",
          "text": "Sí. Podemos valorar superficie, distribución, plantas, cubierta, fachada, instalaciones y acabados, siempre dentro de las posibilidades técnicas y urbanísticas."
        },
        {
          "title": "¿Y la resistencia estructural?",
          "text": "El proyecto debe justificar las acciones y exigencias estructurales aplicables al emplazamiento. No atribuimos una superioridad sísmica genérica a todas las soluciones."
        },
        {
          "title": "¿Se puede financiar con una hipoteca?",
          "text": "Consulta con la entidad financiera las condiciones de financiación de una autopromoción y la documentación que te solicitará."
        },
        {
          "title": "¿Dónde construís?",
          "text": "Estamos en Lleida. Contacta con nosotros indicando el municipio de la parcela para que podamos valorar la disponibilidad y la logística."
        }
      ]
    },
    blog: {
      "title": "¿Casa industrializada o construcción tradicional?",
      "seoTitle": "Casa modular vs. casa tradicional: qué comparar",
      "intro": "Si estás pensando en construir una vivienda, el sistema constructivo es una decisión importante. Este artículo recupera y actualiza los temas de la comparativa anterior de ModularDom.",
      "sections": [
        {
          "title": "¿Qué es la construcción industrializada?",
          "text": "Incorpora materiales o elementos preparados mediante procesos industriales y una ejecución planificada. En ModularDom trabajamos con hormigón celular y entramado ligero de madera; el grado de industrialización depende del proyecto."
        },
        {
          "title": "Precio y alcance del presupuesto",
          "text": "Compara presupuestos equivalentes: superficie construida, proyecto técnico, cimentación, instalaciones, acabados, trabajos de parcela, impuestos y exclusiones. Un precio de construcción por metro cuadrado no representa necesariamente el coste total."
        },
        {
          "title": "Plazos y planificación",
          "text": "La preparación y la coordinación de la obra pueden reducir tiempos de ejecución e imprevistos. Licencias, accesos, disponibilidad de materiales y complejidad de la casa condicionan el calendario."
        },
        {
          "title": "Eficiencia energética y confort",
          "text": "La calidad de la envolvente, la orientación, la ventilación y las instalaciones desempeñan un papel clave en la demanda energética. Hay que valorar prestaciones concretas, no solo el nombre del sistema."
        },
        {
          "title": "Personalización y limitaciones",
          "text": "La distribución, los acabados y la arquitectura se pueden adaptar al proyecto. Los accesos, la logística, el terreno y la normativa pueden determinar qué solución resulta más adecuada."
        },
        {
          "title": "Cómo tomar la decisión",
          "text": "Empieza con un estudio de la parcela y una comparación de ofertas con el mismo alcance. El configurador y la visita a la casa piloto te ayudarán a concretar los siguientes pasos."
        }
      ]
    },
    finishes: {
      "title": "Materiales, calidades y acabados",
      "seoTitle": "Materiales y acabados de las casas ModularDom",
      "intro": "Conoce las calidades y las muestras de materiales de ModularDom. La selección detallada de los acabados de cada obra debe vincularse al proyecto y al acceso privado del cliente.",
      "sections": [
        {
          "title": "Elige los acabados con tu proyecto",
          "text": "Los pavimentos, revestimientos, carpinterías, cocina y baños deben concretarse según la memoria de calidades y las opciones contratadas."
        },
        {
          "title": "Configurador de acabados",
          "text": "La versión interactiva anterior está pendiente de integración con el acceso seguro del CRM. Por ahora puedes consultar las calidades y muestras siguientes y contactar con nosotros para concretar la selección."
        }
      ]
    },
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
