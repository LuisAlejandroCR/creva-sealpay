// help-content.ts: the help centre's only source — every category, every question and the screen
// that answers it. An article never writes a threshold, a ratio or a formula: that is business
// logic, and copying it here would publish it (rule #1). It says where to look, not what the rule is.

/** Icon key resolved to a glyph by the screen; the content module stays free of JSX. */
export type HelpIcon =
  | 'key'
  | 'card'
  | 'gauge'
  | 'credit'
  | 'statement'
  | 'seal'
  | 'registry'
  | 'shield'

export interface HelpArticle {
  slug: string
  question: string
  /** The answer in one line — what she reads before deciding to open anything. */
  answer: string
  /** The path inside the app, one action per step. */
  steps?: string[]
  /** The caveat that keeps the answer honest. */
  note?: string
  /** The screen that actually resolves it. */
  resolvedBy?: { href: string; label: string }
  /** What she would type, not what we called it. */
  keywords?: string[]
}

export interface HelpCategory {
  slug: string
  title: string
  lead: string
  icon: HelpIcon
  articles: HelpArticle[]
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: 'entrar',
    title: 'Entrar a Creva',
    lead: 'Tu correo, tu contraseña y los mensajes que Creva te manda.',
    icon: 'key',
    articles: [
      {
        slug: 'no-puedo-entrar',
        question: '¿No puedes entrar a tu cuenta?',
        answer:
          'Casi siempre es el correo o la contraseña. Creva no cierra tu cuenta por intentos fallidos, así que puedes seguir intentando.',
        steps: [
          'Revisa que sea el mismo correo con el que te registraste.',
          'En la pantalla de entrar, toca «¿Olvidaste tu contraseña?»: te mandamos un enlace para entrar sin escribirla.',
          'Si el correo no llega en unos minutos, búscalo en spam o en correo no deseado.',
          'Ya dentro, cambia tu contraseña desde Seguridad.',
        ],
        note: 'Creva nunca te pide tu contraseña por correo ni por mensaje. Si alguien te la pide, no somos nosotros.',
        resolvedBy: { href: '/login', label: 'Ir a entrar' },
        keywords: ['contraseña', 'password', 'clave', 'olvide', 'acceso', 'bloqueada', 'no abre'],
      },
      {
        slug: 'cambiar-contrasena',
        question: '¿Cómo cambio mi contraseña?',
        answer: 'Desde Seguridad. Creva no cambia tu contraseña por ti: te manda un enlace y tú la escribes.',
        steps: [
          'Entra a tu perfil.',
          'Toca «Seguridad».',
          'Toca «Enviarme el enlace» y ábrelo desde tu correo.',
        ],
        note: 'El enlace vence solo y nadie más puede usarlo. Si vence, pide otro desde la misma pantalla.',
        resolvedBy: { href: '/profile/security', label: 'Ir a Seguridad' },
        keywords: ['contraseña', 'cambiar', 'seguridad', 'password'],
      },
      {
        slug: 'enlace-magico',
        question: '¿Qué es el enlace para entrar sin contraseña?',
        answer:
          'Un correo con un enlace que te deja entrar sin escribir nada. Sirve cuando no recuerdas tu contraseña.',
        steps: [
          'En la pantalla de entrar, toca «¿Olvidaste tu contraseña?».',
          'Escribe tu correo y espera el mensaje.',
          'Abre el enlace desde el mismo dispositivo donde vas a usar Creva.',
        ],
        note: 'El enlace es de un solo uso. Si lo abres en otro dispositivo, la sesión se abre ahí y no aquí.',
        resolvedBy: { href: '/login', label: 'Ir a entrar' },
        keywords: ['enlace', 'magico', 'correo', 'sin contraseña', 'link'],
      },
      {
        slug: 'otro-dispositivo',
        question: '¿Puedo entrar desde otro dispositivo?',
        answer: 'Sí. Creva guarda tu sesión en cada dispositivo por separado, así que en el nuevo tendrás que entrar otra vez.',
        note: 'Al cerrar sesión aquí no se cierra allá. Si perdiste un dispositivo, cambia tu contraseña: eso invalida lo que quedó abierto.',
        resolvedBy: { href: '/profile/security', label: 'Ir a Seguridad' },
        keywords: ['dispositivo', 'celular', 'otro telefono', 'sesion', 'computadora'],
      },
    ],
  },
  {
    slug: 'tarjeta',
    title: 'Tu tarjeta',
    lead: 'Qué puedes gastar, qué está encendido y qué todavía no.',
    icon: 'card',
    articles: [
      {
        slug: 'por-que-dice-pronto',
        question: '¿Por qué mi tarjeta dice PRONTO?',
        answer:
          'Porque emitir una tarjeta exige verificar tu identidad, y Creva no tiene hoy un proveedor conectado para hacerlo.',
        note: 'Mientras tanto el camino de crédito funciona completo y no depende de esa verificación. Cuando la tarjeta se encienda, la pestaña dejará de decir PRONTO sola.',
        resolvedBy: { href: '/credit', label: 'Ver opciones de crédito' },
        keywords: ['tarjeta', 'pronto', 'no disponible', 'apagada', 'emitir'],
      },
      {
        slug: 'cuanto-puedo-gastar',
        question: '¿Cómo veo cuánto puedo gastar?',
        answer:
          'En la pantalla de tu garantía. Ahí está lo que la respalda y la capacidad de gasto que sale de ella.',
        steps: [
          'Abre «Más» en la barra de abajo.',
          'Toca «Tu garantía».',
          'Mira «capacidad de gasto»: ese es el monto disponible, no el saldo.',
        ],
        note: 'Tu garantía y tu capacidad de gasto no son el mismo número, y quien decide la proporción entre las dos es Creva, no la pantalla. Si cambia, cambia ahí.',
        resolvedBy: { href: '/collateral', label: 'Ver mi garantía' },
        keywords: ['limite', 'topes', 'cupo', 'cuanto puedo gastar', 'disponible', 'garantia', 'colateral'],
      },
      {
        slug: 'congelar-tarjeta',
        question: '¿Cómo congelo mi tarjeta?',
        answer:
          'Con el interruptor de la pantalla de tu tarjeta. Congelarla rechaza los cobros nuevos sin cancelarla.',
        steps: [
          'Abre la pestaña «Tarjeta».',
          'Toca tu tarjeta para ver su detalle.',
          'Usa el interruptor «Congelar». Se descongela igual, con el mismo interruptor.',
        ],
        note: 'Congelada, tu tarjeta sigue existiendo y conserva su número. Es distinto de cancelarla.',
        resolvedBy: { href: '/cards', label: 'Ir a mi tarjeta' },
        keywords: ['congelar', 'bloquear', 'robaron', 'perdi', 'desactivar'],
      },
      {
        slug: 'numero-y-cvv',
        question: '¿Por qué no veo el número completo ni el CVV?',
        answer:
          'Porque Creva no los guarda. El número completo y el código de seguridad los custodia el emisor de la tarjeta.',
        note: 'Por eso la pantalla muestra solo los últimos dígitos: no hay nada más que Creva pueda enseñarte, y prometer lo contrario sería inventar un dato.',
        resolvedBy: { href: '/cards', label: 'Ir a mi tarjeta' },
        keywords: ['numero', 'cvv', 'copiar', 'ver tarjeta', 'digitos'],
      },
    ],
  },
  {
    slug: 'score',
    title: 'Tu score',
    lead: 'De dónde sale tu puntaje, qué lo mueve y qué no promete.',
    icon: 'gauge',
    articles: [
      {
        slug: 'como-se-calcula',
        question: '¿Cómo se calcula mi score?',
        answer:
          'Con lo que Creva puede observar de tu actividad, repartido en cuatro factores. Cada factor trae su máximo y la suma es tu puntaje.',
        steps: [
          'Abre la pestaña «Score».',
          'Toca cualquier factor para abrirlo.',
          'Lee «qué mide», «cómo vas» y «qué lo movería»: eso es exactamente lo que cuenta.',
        ],
        note: 'La escala y el peso de cada factor los manda Creva junto con tu puntaje, así que lo que ves en pantalla es lo que se usó para calcularlo — no una versión simplificada.',
        resolvedBy: { href: '/score', label: 'Ver mi score' },
        keywords: ['score', 'puntaje', 'calificacion', 'factores', 'como se calcula'],
      },
      {
        slug: 'por-que-cambio',
        question: '¿Por qué cambió mi score?',
        answer:
          'Porque cambió alguno de los cuatro factores. Cada uno dice en su detalle qué lo movería, y ahí se ve cuál se movió.',
        steps: [
          'Abre la pestaña «Score».',
          'Compara los factores: el que bajó o subió es el que explica el cambio.',
          'Si acabas de subir un estado de cuenta, el score se recalcula con lo nuevo.',
        ],
        note: 'Lo que declaras en el diagnóstico **no** entra al score. Solo lo observable lo mueve, y esa es la razón por la que el score le sirve a quien lo recibe.',
        resolvedBy: { href: '/score', label: 'Ver mi score' },
        keywords: ['bajo', 'subio', 'cambio', 'score', 'puntaje'],
      },
      {
        slug: 'que-no-estima',
        question: '¿Qué NO estima mi score?',
        answer:
          'Creva publica la lista completa en la ficha de declaración de tu score: lo que el puntaje no intenta predecir.',
        steps: ['Abre la pestaña «Score».', 'Baja hasta la ficha de declaración y ábrela.'],
        note: 'No es una advertencia legal de relleno: es lo que impide que alguien use tu puntaje para algo que no mide.',
        resolvedBy: { href: '/score', label: 'Ver la ficha' },
        keywords: ['no estima', 'declaracion', 'limitaciones', 'que no hace'],
      },
    ],
  },
  {
    slug: 'credito',
    title: 'Crédito',
    lead: 'Cómo empata Creva tu perfil con los productos, y qué pasa si no empata.',
    icon: 'credit',
    articles: [
      {
        slug: 'creva-me-presta',
        question: '¿Creva me presta el dinero?',
        answer:
          'No. Creva compara tu perfil contra un catálogo de productos de otras instituciones y te dice cuáles te quedan y por qué.',
        note: 'Quien presta, aprueba y cobra es la institución que ofrece el producto. Creva no decide por ella ni te promete un monto.',
        resolvedBy: { href: '/credit', label: 'Ver opciones de crédito' },
        keywords: ['prestamo', 'credito', 'quien presta', 'monto', 'cuanto me prestan'],
      },
      {
        slug: 'no-aparezco-candidata',
        question: '¿Por qué no aparezco como candidata a un producto?',
        answer:
          'Porque alguno de los criterios de ese producto no se cumple todavía. La pantalla te dice cuál, criterio por criterio.',
        steps: [
          'Abre la pestaña «Crédito».',
          'Abre el producto que te interesa.',
          'Lee los criterios: los que no se cumplen están marcados, y ahí está lo que falta.',
        ],
        note: 'Los criterios son de cada institución, no de Creva. Si uno depende de un dato que no tenemos, se resuelve subiendo un estado de cuenta o completando tu perfil.',
        resolvedBy: { href: '/credit', label: 'Ver mis criterios' },
        keywords: ['rechazada', 'no califico', 'no aparece', 'requisitos', 'criterios'],
      },
      {
        slug: 'que-pasa-al-elegir',
        question: '¿Qué pasa cuando elijo un producto?',
        answer:
          'Creva guarda tu elección y te lleva al siguiente paso de esa institución. La verificación de identidad, si la pide, es opcional y va después.',
        note: 'Elegir un producto no es solicitarlo ni comprometerte a nada. Puedes cambiar de opción.',
        resolvedBy: { href: '/credit', label: 'Ver opciones de crédito' },
        keywords: ['elegir', 'solicitar', 'aplicar', 'siguiente paso'],
      },
      {
        slug: 'falta-verificar-contacto',
        question: '¿Por qué me piden verificar mi correo antes de ver productos?',
        answer:
          'Porque el catálogo se arma contra un contacto real. Sin un canal verificado, la lista sería para nadie.',
        steps: ['Abre la pestaña «Crédito».', 'Sigue el aviso que dice qué canal falta.'],
        note: 'Hoy Creva solo pide el correo. No se pide verificación de identidad para ver las opciones.',
        resolvedBy: { href: '/credit', label: 'Ir a Crédito' },
        keywords: ['verificar correo', 'telefono', 'contacto', 'elegibilidad'],
      },
    ],
  },
  {
    slug: 'cifras',
    title: 'Tus cifras y tus estados de cuenta',
    lead: 'De dónde sale cada número de tu perfil y cómo mejorarlo.',
    icon: 'statement',
    articles: [
      {
        slug: 'de-donde-salen-las-cifras',
        question: '¿De dónde salen las cifras de mi perfil?',
        answer:
          'De tres fuentes, en este orden: tus estados de cuenta, lo que declaraste en el diagnóstico y, al final, tu garantía.',
        note: 'Lo declarado nunca desplaza a lo observable: si subes un estado de cuenta, tus cifras pasan a salir de ahí. Cada pantalla dice cuál de las tres está usando.',
        resolvedBy: { href: '/statements', label: 'Subir un estado de cuenta' },
        keywords: ['cifras', 'ingresos', 'de donde salen', 'declarado', 'origen', 'fuente'],
      },
      {
        slug: 'subir-estado-de-cuenta',
        question: '¿Cómo subo un estado de cuenta?',
        answer: 'Desde la pantalla de estados de cuenta. Creva acepta CSV, XLSX y PDF de tu banco.',
        steps: [
          'Abre «Más» en la barra de abajo.',
          'Toca «Estados de cuenta».',
          'Elige tus archivos y espera a que terminen de leerse.',
        ],
        note: 'Un PDF con contraseña no se puede leer: quítasela antes de subirlo. Si subes varios y uno falla, los demás sí se guardan.',
        resolvedBy: { href: '/statements', label: 'Ir a estados de cuenta' },
        keywords: ['subir', 'estado de cuenta', 'pdf', 'excel', 'csv', 'banco'],
      },
      {
        slug: 'movimiento-sin-categoria',
        question: '¿Por qué un movimiento aparece sin categoría?',
        answer:
          'Porque Creva no reconoció de qué es. Pasa con comercios poco comunes o con descripciones que el banco abrevia.',
        steps: [
          'Abre «Más» y toca «Movimientos».',
          'Busca el movimiento sin categoría.',
          'Elige la categoría correcta: se guarda y Creva la usa desde ahí.',
        ],
        note: 'La corrección solo está en los movimientos que vienen de estados de cuenta. Los de tarjeta llegan ya clasificados por el emisor y no se pueden editar.',
        resolvedBy: { href: '/movements', label: 'Ver mis movimientos' },
        keywords: ['categoria', 'sin clasificar', 'clasificacion', 'movimiento', 'corregir'],
      },
      {
        slug: 'personal-o-negocio',
        question: '¿Cómo separa Creva lo personal de lo del negocio?',
        answer:
          'Cada movimiento se marca como de negocio, personal o mixto, y tu resumen se arma con esa separación.',
        steps: ['Abre «Más» y toca «Estados de cuenta».', 'Mira el porcentaje de gasto de negocio del periodo.'],
        note: 'Si la separación no te cuadra, corrige la categoría del movimiento: eso es lo que la mueve.',
        resolvedBy: { href: '/statements', label: 'Ir a estados de cuenta' },
        keywords: ['personal', 'negocio', 'mixto', 'separar', 'gasto'],
      },
      {
        slug: 'diagnostico',
        question: '¿Para qué sirve el diagnóstico?',
        answer:
          'Para que Creva tenga cifras tuyas aunque todavía no hayas subido un estado de cuenta. Son tres meses de ingresos y gastos, declarados por ti.',
        steps: [
          'Abre la pestaña «Crédito»: los cuatro pasos son la solicitud.',
          'Llena tu negocio, tus ingresos y tus gastos de los últimos tres meses.',
          'En el cuarto dices cuánto necesitas, para qué y en cuánto tiempo lo pagarías.',
        ],
        note: 'No es una pantalla aparte: **es** el formulario del crédito. Lo declarado se guarda etiquetado como tal: sirve para el crédito y para la calculadora, pero **no** toca tu score.',
        resolvedBy: { href: '/credit', label: 'Ir a Crédito' },
        keywords: ['diagnostico', 'declarar', 'ingresos', 'gastos', 'tres meses'],
      },
    ],
  },
  {
    slug: 'reporte',
    title: 'Tu reporte sellado',
    lead: 'El documento que entregas cuando alguien te pide comprobar tu actividad.',
    icon: 'seal',
    articles: [
      {
        slug: 'que-es-el-reporte',
        question: '¿Qué es el reporte sellado?',
        answer:
          'Un documento con tus señales, un folio y una firma. Quien lo recibe puede comprobar que es auténtico sin tener cuenta en Creva.',
        steps: ['Abre «Más» y toca «Tu reporte».', 'Toca el botón para generarlo.'],
        note: 'El reporte no se genera solo al abrir la pantalla: se genera cuando lo pides, porque consultar registros de gobierno tiene un costo.',
        resolvedBy: { href: '/report', label: 'Generar mi reporte' },
        keywords: ['reporte', 'certificado', 'constancia', 'documento', 'sello'],
      },
      {
        slug: 'compartir-y-comprobar',
        question: '¿Cómo lo comparto y cómo lo comprueban?',
        answer:
          'Se descarga como un archivo con dos mitades —el reporte y su sello— y quien lo recibe lo sube a la pantalla pública de comprobación.',
        steps: [
          'Genera tu reporte y toca «Descargar reporte y sello».',
          'Manda ese archivo a quien te lo pidió.',
          'Esa persona lo sube en la pantalla de comprobar, sin cuenta y sin registrarse.',
        ],
        note: 'Si el archivo se altera aunque sea en una letra, la comprobación lo dice. Ese es el punto del sello.',
        resolvedBy: { href: '/report', label: 'Ir a mi reporte' },
        keywords: ['compartir', 'enviar', 'comprobar', 'verificar', 'auténtico'],
      },
      {
        slug: 'guardar-en-pdf',
        question: '¿Cómo lo guardo en PDF?',
        answer: 'Con la opción de imprimir de tu navegador, que Creva ya preparó para que salga limpio.',
        steps: ['Genera tu reporte.', 'Toca «Imprimir o guardar como PDF».', 'Elige «Guardar como PDF».'],
        note: 'El PDF es para leerlo. Para que alguien lo compruebe hace falta el archivo con el sello, que es otro botón.',
        resolvedBy: { href: '/report', label: 'Ir a mi reporte' },
        keywords: ['pdf', 'imprimir', 'guardar', 'descargar'],
      },
      {
        slug: 'que-no-acredita',
        question: '¿Qué NO acredita el reporte?',
        answer:
          'El propio reporte lo dice al final, con todas sus letras. Es lo primero que conviene leer antes de entregarlo.',
        note: 'La firma cubre el sello, no el contenido: acredita que el documento no se alteró, no que un tercero apruebe lo que dice.',
        resolvedBy: { href: '/report', label: 'Ir a mi reporte' },
        keywords: ['no acredita', 'limitaciones', 'firma', 'que significa'],
      },
    ],
  },
  {
    slug: 'gobierno',
    title: 'Sello del directorio y reglas',
    lead: 'Lo que los registros públicos dicen de tu negocio y de tu giro.',
    icon: 'registry',
    articles: [
      {
        slug: 'no-listado',
        question: '¿Por qué mi negocio sale «no listado»?',
        answer:
          'Porque no aparece en el directorio oficial con el nombre que buscamos. Es un estado válido, no un error tuyo ni de la app.',
        note: 'Estar en el directorio es voluntario y su cobertura cambia muchísimo entre estados. Por eso el sello **no suma ni resta puntos** a tu score: no estar ahí nunca cuenta en tu contra.',
        resolvedBy: { href: '/business-verification', label: 'Ver el sello de mi negocio' },
        keywords: ['no listado', 'sello', 'directorio', 'negocio', 'verificacion'],
      },
      {
        slug: 'varios-parecidos',
        question: '¿Por qué dice que hay «varios parecidos»?',
        answer:
          'Porque más de un negocio se llama igual que el tuyo y Creva no puede saber cuál eres. En ese caso no emite sello.',
        steps: ['Abre «Más» y toca «Sello de tu negocio».', 'Agrega tu estado para acotar la búsqueda.'],
        note: 'Entregarte el sello de otro negocio sería justo lo que este producto promete no hacer. Ante la duda, no emite.',
        resolvedBy: { href: '/business-verification', label: 'Ir al sello' },
        keywords: ['ambiguo', 'varios', 'mismo nombre', 'estado', 'parecidos'],
      },
      {
        slug: 'reglas-que-me-afectan',
        question: '¿Qué son las «reglas que me afectan»?',
        answer:
          'Novedades del diario oficial que tocan a tu giro, con su fuente y su fecha, separadas de las reglas ya vigentes.',
        note: 'Ese radar **no consulta ningún dato tuyo**: busca por tema, no por persona. Nada de lo tuyo sale de Creva para armarlo.',
        resolvedBy: { href: '/regulatory', label: 'Ver las reglas' },
        keywords: ['reglas', 'regulatorio', 'diario oficial', 'normas', 'radar'],
      },
    ],
  },
  {
    slug: 'datos',
    title: 'Tus datos y tu privacidad',
    lead: 'Qué guardamos, cómo lo corriges y cómo lo borras.',
    icon: 'shield',
    articles: [
      {
        slug: 'cambiar-mis-datos',
        question: '¿Cómo cambio mis datos?',
        answer: 'Tus datos personales y los fiscales se editan por separado, cada uno en su pantalla del perfil.',
        steps: [
          'Abre tu perfil.',
          'Toca «Datos personales» o «Información fiscal», según lo que quieras cambiar.',
          'Guarda al terminar.',
        ],
        note: 'Cambiar tu información fiscal puede cambiar el sello de tu negocio, porque es con esos datos que se busca en el directorio.',
        resolvedBy: { href: '/profile/details', label: 'Ir a mis datos' },
        keywords: ['cambiar', 'correo', 'datos', 'rfc', 'direccion', 'actualizar'],
      },
      {
        slug: 'borrar-mi-cuenta',
        question: '¿Cómo borro mi cuenta?',
        answer:
          'Se pide por correo, no con un botón: borrar es permanente, así que la solicitud pasa por un canal que puede responderte.',
        steps: [
          'Abre tu perfil y toca «Eliminar mi cuenta».',
          'Ahí está el paso a paso y el botón que abre tu correo con el mensaje listo.',
          'Mándalo desde el mismo correo con el que entras a Creva.',
        ],
        note: 'Es permanente: no hay copia que podamos devolverte después. Tus estados de cuenta, tu diagnóstico y tus reportes se van con ella. Si solo quieres pausar, cierra sesión.',
        resolvedBy: { href: '/profile/delete-account', label: 'Ver cómo se pide' },
        keywords: ['borrar', 'eliminar', 'cerrar cuenta', 'darme de baja', 'cancelar'],
      },
      {
        slug: 'quien-ve-mi-informacion',
        question: '¿Quién puede ver mi información?',
        answer:
          'Solo tú, y quien tú decidas al entregarle un reporte. El aviso de privacidad dice exactamente qué se guarda y con quién se comparte.',
        note: 'Creva no guarda el número completo de tu tarjeta ni su código de seguridad: eso lo custodia el emisor.',
        resolvedBy: { href: '/privacy', label: 'Leer el aviso de privacidad' },
        keywords: ['privacidad', 'quien ve', 'datos personales', 'comparten', 'seguridad'],
      },
    ],
  },
]

/** The four the audit says carry most of the demand — the first thing the index offers. */
export const MOST_ASKED: { category: string; article: string; short: string; icon: HelpIcon }[] = [
  { category: 'entrar', article: 'no-puedo-entrar', short: 'No puedo entrar', icon: 'key' },
  { category: 'tarjeta', article: 'cuanto-puedo-gastar', short: 'Cuánto puedo gastar', icon: 'card' },
  { category: 'score', article: 'como-se-calcula', short: 'Cómo sale mi score', icon: 'gauge' },
  { category: 'credito', article: 'no-aparezco-candidata', short: 'Por qué no califico', icon: 'credit' },
]

export function categoryHref(category: HelpCategory | string): string {
  return `/help/${typeof category === 'string' ? category : category.slug}`
}

export function articleHref(categorySlug: string, articleSlug: string): string {
  return `/help/${categorySlug}/${articleSlug}`
}

export function findCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find(category => category.slug === slug)
}

export function findArticle(
  categorySlug: string,
  articleSlug: string,
): { category: HelpCategory; article: HelpArticle } | undefined {
  const category = findCategory(categorySlug)
  const article = category?.articles.find(item => item.slug === articleSlug)
  return category && article ? { category, article } : undefined
}

export interface HelpHit {
  category: HelpCategory
  article: HelpArticle
}

/** Accents and case are how a search misses the answer it has; both go before comparing. */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function searchHelp(query: string): HelpHit[] {
  const terms = fold(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const hits: HelpHit[] = []
  for (const category of HELP_CATEGORIES) {
    for (const article of category.articles) {
      const haystack = fold(
        [category.title, article.question, article.answer, ...(article.keywords ?? [])].join(' '),
      )
      if (terms.every(term => haystack.includes(term))) hits.push({ category, article })
    }
  }
  return hits
}

/** Same category, minus the one being read — what she tries next when this was not it. */
export function relatedArticles(categorySlug: string, articleSlug: string): HelpHit[] {
  const category = findCategory(categorySlug)
  if (!category) return []
  return category.articles
    .filter(article => article.slug !== articleSlug)
    .map(article => ({ category, article }))
}
