<!-- docs/plan.md: bloques de trabajo con criterio de aceptación, abiertos vs cerrados, para la
     preparación de ETHOnline 2026. No es la bitácora (docs/memoria.md tiene el qué-se-hizo/qué-no-
     se-verificó) ni el brainstorming (brainstorming.md tiene el análisis; aquí solo el checklist
     accionable). Se actualiza en el mismo lote que cualquier cambio de estado. -->

# Plan — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Última actualización:** 2026-09-05 (barra de navegación inferior — paridad de iconos, sexto intento)

Ver [`brainstorming.md`](../brainstorming.md) §8 y §9 para el análisis completo. Detalle de
qué-se-hizo/qué-no-se-verificó por sesión: [`docs/memoria.md`](memoria.md). Esta tabla es solo el
checklist.

## Abiertos

- [ ] **2026-09-05 — Migración de PWA a app nativa (iOS/Android): replicar cada pantalla y acción
  de `creva_finance/frontend` en `app/`, uno por uno.** Decisión escogida: **no** un lote — se
  sigue la misma disciplina que "Paridad móvil, tercera revisión" de abajo (una pantalla por pasada,
  documentada, sin autocertificar cierre). Worktree/rama: `feature-mobile-native-parity`.
  **Backlog de rutas del frontend (`creva_finance/frontend/app/**/page.tsx`) contra su pantalla
  mobile**, para ir tomando una a la vez:
  - `profile/delete-account` → `DeleteAccountScreen.tsx` — **primer incremento hecho 2026-09-05**
    (ver más abajo), pendiente de segunda vista.
  - `credit` → `CreditScreen.tsx` — mobile es intencionalmente mínima (decisión ya registrada,
    "Crédito son pantallas mínimas reales nuevas"); no replicar el flujo completo de 6 pasos sin
    reconfirmar que ese es el alcance querido para la migración nativa.
  - `cards` / `card-create` → `CardScreen.tsx` — mobile es un stub "PRONTO"; mismo caso que Crédito.
  - `score` → `ScoreScreen.tsx`, `dashboard` → `DashboardScreen.tsx`, `help`/`help/[category]` →
    `HelpScreen.tsx`/`HelpCategoryScreen.tsx`/`HelpArticleScreen.tsx` — cubiertos por los worktrees
    Codex activos (`codex/mobile-parity-dashboard`, `codex/mobile-parity-help`), no re-tomar sin
    coordinar (regla de §Colaboración punto 7).
  - **Todos los stubs de "Más" ya tienen pantalla real** (incrementos 1-13 de abajo):
    `profile/details`, `profile/fiscal`, `profile/security`, `movements`, `statements`,
    `notifications`, `regulatory`, `report`, `collateral`, `business-verification`, `calculator` y
    `privacy`. `StubScreen.tsx` ya no se monta para ninguna clave del backlog original — queda como
    fallback genérico sin usar. Pendiente de este bloque: la segunda vista visual de las 13
    pantallas (bloqueo `react-native-web`/NativeWind) y decidir el alcance de `credit`/`card`/`kyc`/
    `auth` con el humano.
  - `kyc`/`kyc/success`, `login`/`register`/`sign-in`/`sign-up`, `welcome`, `auth/callback` — no
    evaluados todavía contra su equivalente mobile (`SignInScreen.tsx`, `SelfieCheckScreen.tsx`).

- [ ] **2026-09-05 — Segundo incremento de la migración: `PersonalDataScreen.tsx` nueva, reemplaza
  el `StubScreen` genérico de "Datos personales" (`profile/details`).** Puerto real de
  `creva_finance/frontend/app/profile/details/page.tsx`: nombres/apellidos/teléfono editables vía
  `profiles.get()`/`profiles.update()` de `app/lib/api.ts` (ya existía el cliente, no se tocó);
  correo de solo lectura desde la sesión de Clerk (`useUser().primaryEmailAddress`), mismo criterio
  que el frontend — el backend todavía acepta tokens pre-Clerk que devolverían el correo de otra
  cuenta. Estados de carga (`ActivityIndicator`), error y "Cambios guardados" replicados. Sin
  componente `Button` compartido en el proyecto — se siguió la convención ya existente
  (`Pressable` + `bg-crimson`, ver `QueryScreen.tsx`) en vez de crear una abstracción nueva.
  `App.tsx`: `step === "profile-details"` ahora monta `PersonalDataScreen` en vez de `StubScreen`.
  Test nuevo `app/test/unit/profile/personal-data.spec.ts` (mismo patrón de aserciones por fuente
  que `profile/structure.spec.ts`, sin montar Clerk). `tsc --noEmit` limpio, `npx jest` verde
  (42/42 suites, 179/179 tests — antes 41/176).
  **No se verificó:** el resultado nativo/visual — mismo bloqueo de `react-native-web` vs.
  NativeWind que el resto de esta migración; tampoco se probó el guardado contra un backend real
  (no hay credenciales/entorno de backend de Creva disponibles desde esta sesión de agente, distinto
  del frontend Next.js que sí se pudo autenticar). **No autocertificada como cerrada** — falta
  segunda vista.

- [ ] **2026-09-05 — Tercer incremento de la migración: `FiscalInfoScreen.tsx` nueva, reemplaza el
  `StubScreen` genérico de "Información fiscal" (`profile/fiscal`).** Puerto real de
  `creva_finance/frontend/app/profile/fiscal/page.tsx`: tipo de persona (Física/Moral), RFC, razón
  social, régimen fiscal, estado (catálogo INEGI, `app/lib/mx-states.ts`, ya portado, no se tocó),
  código postal y dirección — todo vía `profiles.getFiscal()`/`profiles.updateFiscal()` de
  `app/lib/api.ts` (ya existía, no se tocó). Mismo disclosure "no es asesoría fiscal" que el
  frontend. **Nuevo:** `app/features/profile/components/FormField.tsx` — `TextField`,
  `SelectField` y `SegmentedField` compartidos, extraídos porque ya son 2 pantallas (Datos
  personales y esta) usando el mismo patrón de campo; `PersonalDataScreen.tsx` se refactorizó para
  reusar `TextField` en vez de mantener su copia local. React Native no tiene `<select>` nativo:
  `SelectField` es un `Pressable` que expande una lista de opciones en línea — no se agregó ninguna
  dependencia de picker. `App.tsx`: `step === "profile-fiscal"` ahora monta `FiscalInfoScreen` en
  vez de `StubScreen`. Test nuevo `app/test/unit/profile/fiscal-info.spec.ts` (mismo patrón de
  aserciones por fuente). `tsc --noEmit` limpio, `npx jest` verde (43/43 suites, 183/183 tests).
  **No se verificó:** el resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind) ni
  el guardado contra el backend real de Creva (sin credenciales de ese backend). El `SelectField`
  en particular no se probó interactivamente — es una lista expandible simple, no se descarta que
  necesite ajuste de UX una vez visible (scroll dentro de la lista si el catálogo de estados es
  largo, por ejemplo) — anotado para la segunda vista. **No autocertificada como cerrada.**

- [ ] **2026-09-05 — Cuarto incremento de la migración: `SecurityScreen.tsx` nueva, reemplaza el
  `StubScreen` genérico de "Seguridad" (`profile/security`).** Puerto real de
  `creva_finance/frontend/app/profile/security/page.tsx`: tres cards (cambiar contraseña, tu sesión,
  tus datos), la primera con acción real vía `auth.forgotPassword()` (`app/lib/api.ts`, ya existía).
  **Desviación deliberada del "as is" literal:** el frontend lee el correo con `auth.me()` (backend
  pre-Clerk); esta pantalla lo lee de la sesión de Clerk (`useUser().primaryEmailAddress`), mismo
  criterio ya aplicado en `PersonalDataScreen.tsx` — un token pre-Clerk puede devolver el correo de
  otra cuenta, y enviar un enlace de reseteo a la cuenta equivocada es justo el tipo de bug que ese
  criterio existe para evitar. Test nuevo `app/test/unit/profile/security.spec.ts`. `tsc --noEmit`
  limpio, `npx jest` verde (44/44 suites, 187/187 tests).
  **No se verificó:** resultado nativo/visual (mismo bloqueo ya documentado) ni que
  `auth.forgotPassword()` realmente dispare un correo para una cuenta creada vía Clerk (el endpoint
  es pre-Clerk; si Clerk gestiona su propio flujo de contraseña por separado, este botón podría no
  tener efecto real para usuarios Clerk-only — no se investigó más a fondo, es una pregunta de
  arquitectura de auth más grande que esta sola pantalla). **No autocertificada como cerrada.**

- [ ] **2026-09-05 — Quinto incremento de la migración: `MovementsScreen.tsx` nueva, reemplaza el
  stub genérico de "Movimientos" en "Más".** Puerto real de
  `creva_finance/frontend/app/movements/page.tsx`: mezcla movimientos de tarjeta
  (`transactions.list()`) y de estados de cuenta (`statements.list()` + `statements.entries()`),
  agrupados por "Hoy/Ayer/Esta semana/Antes", filtrables (Todos/Ingresos/Gastos), con modal de
  detalle que permite corregir la categoría solo de los movimientos de estado de cuenta
  (`statements.reclassify()`) y compartir el texto del movimiento (sin datos de cuenta) vía la hoja
  nativa `Share.share()` de React Native — sin dependencia nueva, es API del framework. Toda la
  lógica de bucketing/formateo/share-text es la misma del frontend, portada literalmente (mismo
  criterio "as is" pedido). `App.tsx`: la clave de stub `"movements"` ahora se intercepta antes del
  `StubScreen` genérico y monta `MovementsScreen`. El modal de detalle usa `Modal` nativo de React
  Native (no `BottomSheet` del frontend, que es un componente web) — mismo contenido y acciones,
  presentación adaptada al framework. `SegmentedField`/`SelectField` reusados de
  `app/features/profile/components/FormField.tsx` para el filtro y el selector de categoría — son
  controles genéricos, no específicos de perfil, así que reusarlos entre features es la decisión
  correcta en vez de duplicar. Test nuevo `app/test/unit/more/movements.spec.ts`. `tsc --noEmit`
  limpio, `npx jest` verde (45/45 suites, 191/191 tests).
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind), ni el
  modal/share/reclasificación contra datos reales (sin backend de Creva disponible desde esta
  sesión). El modal usa `rounded-t-3xl` con `bg-bg` — no se confirmó que el contraste sobre
  `bg-black/40` de fondo se vea bien en modo oscuro, si el proyecto llegara a soportarlo (hoy no lo
  soporta, ver tema de esta app). **No autocertificada como cerrada.**

- [ ] **2026-09-05 — Sexto incremento de la migración: `StatementsScreen.tsx` nueva, reemplaza el
  stub genérico de "Estados de cuenta" en "Más". Primera pantalla de esta migración que necesitó
  dependencias nativas nuevas — confirmado con el humano antes de instalar.** Puerto real de
  `creva_finance/frontend/app/statements/page.tsx`: gate de términos (una vez, persistido),
  selector de archivos CSV/Excel/PDF, subida, resultado por archivo, historial con
  revisar/quitar-con-confirmación, y corrección de categoría por movimiento — todo vía
  `statements.list()/summary()/entries()/reclassify()/remove()` (`app/lib/api.ts`, ya existían).
  **Dependencias nuevas instaladas** (`npx expo install`, aprobadas explícitamente en el chat antes
  de tocar `package.json`): `expo-document-picker` (reemplaza el `<input type="file">` del
  frontend — no hay equivalente nativo) y `@react-native-async-storage/async-storage` (reemplaza
  `localStorage` para el flag de términos aceptados).
  **Nuevo en `app/lib/api.ts`:** `statements.uploadNative()` — variante de `statements.upload()`
  para el objeto `{uri, name, mimeType}` que devuelve `expo-document-picker`, ya que React Native no
  tiene `File`/`Blob` de un picker; reusa el mismo `requestMultipart` interno, no se duplicó lógica
  HTTP. `statements.upload()` original queda intacto para no romper el frontend.
  **Infraestructura de test nueva:** `app/jest.config.js` ganó `setupFiles`, y `app/jest.setup.js`
  (nuevo) mockea `@react-native-async-storage/async-storage` con su propio mock oficial de Jest —
  sin esto, cualquier test que importe algo que toque `AsyncStorage` truena con
  `NativeModule: AsyncStorage is null` (Jest corre en Node, no en un dispositivo). Esto beneficia a
  cualquier pantalla futura que use `AsyncStorage`, no solo esta.
  `StackedBar` del frontend (SVG/CSS) se tradujo a una barra simple con `flex` proporcional — sin
  librería de gráficos nueva. Test nuevo `app/test/unit/more/statements.spec.ts`. `tsc --noEmit`
  limpio, `npx jest` verde (46/46 suites, 196/196 tests — un fallo de timeout intermitente en
  `auth-gate.spec.ts`/`help/search.spec.ts` bajo carga completa, confirmado no relacionado: pasa
  aislado y en un segundo full-run).
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind), la
  subida real de un archivo contra el backend de Creva (sin credenciales de ese backend), ni que
  `expo-document-picker` funcione igual en iOS vs. Android (el picker del sistema difiere entre
  plataformas — no hay dispositivo/simulador disponible desde esta sesión para confirmarlo).
  **No autocertificada como cerrada.**

- [ ] **2026-09-05 — Decimotercer incremento de la migración: `PrivacyScreen.tsx` nueva, reemplaza
  el `StubScreen` genérico de "Aviso de privacidad" (`privacy`). Último stub del backlog original.**
  Puerto real de `creva_finance/frontend/app/privacy/page.tsx`: el aviso de privacidad que exige la
  LFPDPPP. **Sin API detrás — es texto legal**, caso explícitamente permitido por el criterio de
  aceptación (documentar por qué no hay API real). El copy va 1:1: las 9 secciones
  (responsable, datos recopilados, finalidades, transferencia a terceros —Dynerox/Reap/Supabase—,
  derechos ARCO, seguridad, cookies, cambios, contacto) con las frases enfatizadas conservadas como
  runs en negrita (`Esa información de identidad nunca se almacena`, `privacidad@finarahub.mx`).
  `App.tsx`: rama nueva `activeStub === "privacy"` monta `PrivacyScreen`; las entradas que ya
  llamaban `openStub("privacy", …)` (DeleteAccountScreen, MoreSheet) caen en la pantalla real.
  Sin dependencias nuevas. Test nuevo `app/test/unit/more/privacy.spec.ts` (verifica que no importa
  `lib/api` ni usa `useState`/`useEffect`). `tsc --noEmit` limpio; `npx jest` verde (53/53 suites,
  236/236 tests — antes 52/231).
  **Desviación deliberada del "as is":** el layout `<section>`/`<h2>`/`<p>`/`<ul>` HTML se tradujo a
  una estructura de datos (`SECTIONS`) renderizada con `Text`/`View`; el `<strong>` inline se
  conserva como `<Text className="font-bold">` anidado. `ScreenHeader backToPrevious` → `BackButton`
  al `previousStep` (mismo patrón que el resto de la migración).
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind), ni que
  el texto legal esté vigente/actualizado — se copió tal cual del frontend, que es la fuente de
  verdad. **No autocertificada como cerrada — falta segunda vista.**

- [ ] **2026-09-05 — Duodécimo incremento de la migración: `CalculatorScreen.tsx` nueva, reemplaza
  el `StubScreen` genérico de "Calculadora" (`calculator`).** Confirmado que **sí tiene API real
  detrás** (`calculator.get(income?)` de `app/lib/api.ts` → `CalculatorData`, ya existía, no se
  tocó), a diferencia de lo que anotaba el backlog. Puerto real de
  `creva_finance/frontend/app/calculator/page.tsx`: utilidad del periodo, barra ingresos/gastos
  (traducción de `DonutChart` a un `flex` proporcional, sin librería de gráficos), la división
  sugerida (Salario/Ahorro/Reinversión) con `splitPercent()` sobre los montos que devuelve la API —
  **nunca se recalcula el porcentaje en el cliente**, es lógica de negocio del backend — y el campo
  "Prueba otro ingreso" que reenvía `?income=` como override y puede volver a las cifras reales.
  Sección "De dónde sale cada cifra" con `incomeSources`/`monthlyMargin`. `Progress` de
  `VisualPrimitives.tsx` reusado para las tres barras; `TextField` compartido para el input.
  `App.tsx`: rama nueva `activeStub === "calculator"` monta `CalculatorScreen` antes del
  `StubScreen` genérico. Sin dependencias nuevas. Test nuevo
  `app/test/unit/more/calculator.spec.ts`. `tsc --noEmit` limpio; `npx jest` verde (52/52 suites,
  231/231 tests — antes 51/226).
  **Desviación deliberada del "as is":** `DonutChart` (SVG web) → barra `flex` de dos segmentos;
  `SPLIT_COLORS` (`var(--cr-*)`) → clases `bg-crimson`/`bg-warning-text`/`bg-success-text`; el
  `<form onSubmit>` → un botón "Calcular" (no hay submit de formulario nativo).
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind), ni
  `calculator.get()` contra `/calculator` real (sin credenciales del backend de Creva — forma de la
  respuesta, y si el override `?income=` se comporta igual, sin confirmar). **No autocertificada
  como cerrada — falta segunda vista.**

- [ ] **2026-09-05 — Undécimo incremento de la migración: `BusinessVerificationScreen.tsx` nueva,
  reemplaza el `StubScreen` genérico de "Sello de tu negocio" (`business-verification`).** Puerto
  real de `creva_finance/frontend/app/business-verification/page.tsx`: busca el negocio en el
  directorio oficial vía `crevaScore.verify()` de `app/lib/api.ts` (ya existía, no se tocó) — es un
  POST que gasta cuota, y **como el frontend, busca al abrir cuando el perfil fiscal
  (`profiles.getFiscal()`) ya tiene nombre + estado**; si no, muestra los campos. `STATUS_COPY`
  completo (verified/not_listed/ambiguous/unavailable), la frase "Tu puntaje no depende de esto",
  las filas de procedencia del sello (`badge`), y las notas `matchedBy`/`searchedAs`/`rfcNote`.
  Campos con `TextField`/`SelectField` compartidos de `app/features/profile/components/FormField.tsx`
  (estado = catálogo `MX_STATES` ya portado). `App.tsx`: rama nueva
  `activeStub === "business-verification"` monta la pantalla real antes del `StubScreen` genérico.
  Sin dependencias nuevas. Test nuevo `app/test/unit/more/business-verification.spec.ts`.
  `tsc --noEmit` limpio; `npx jest` verde (51/51 suites, 226/226 tests — antes 50/220).
  **Desviación deliberada del "as is":** los avisos de estado usan tokens `success-*`/`info-*`/
  `warning-*`/`danger-*` de `tailwind.config.js` en vez de las clases `.alert-*` del frontend (no
  existen en la app). El enlace final "Ver reglas que te afectan" no se portó — cablear esa
  navegación cruzada desde un stub necesita plomería en `App.tsx` fuera del alcance de una pantalla.
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind), ni
  `crevaScore.verify()` / `profiles.getFiscal()` contra el backend real de Creva (sin credenciales —
  forma de la respuesta y ramas de estado sin confirmar). **No autocertificada como cerrada — falta
  segunda vista.**

- [ ] **2026-09-05 — Décimo incremento de la migración: `CollateralScreen.tsx` nueva, reemplaza el
  `StubScreen` genérico de "Tu garantía" (`collateral`).** Puerto real de
  `creva_finance/frontend/app/collateral/page.tsx`: estado de la garantía, monto confirmado/
  pendiente, capacidad de gasto y la CLABE SPEI para depósito — todo vía `collateral.get()` de
  `app/lib/api.ts` (ya existía, no se tocó). Mapa `STATUS_LABELS` y agrupado de CLABE
  (`formatClabe`) idénticos al frontend. Estado de carga (`ActivityIndicator`), error, y el caso sin
  `deposit_account` con su empty state y el `authorization_url` externo. `App.tsx`: rama nueva
  `activeStub === "collateral"` monta `CollateralScreen` antes del `StubScreen` genérico. Sin
  dependencias nuevas. Test nuevo `app/test/unit/more/collateral.spec.ts`. `tsc --noEmit` limpio;
  `npx jest` verde (50/50 suites, 220/220 tests — antes 49/214).
  **Desviaciones deliberadas del "as is":** (1) sin `KycGate` — no existe ese componente en mobile;
  la app ya enruta por Clerk/SelfieCheck, así que la pantalla se muestra directo (anotado para la
  segunda vista: confirmar si hace falta un gate equivalente). (2) La CLABE se entrega por
  `Share.share({ message })` en vez de `navigator.clipboard.writeText` — sin dependencia de
  portapapeles nueva (no se instaló `expo-clipboard`). (3) "Iniciar verificación" sin
  `authorization_url` es texto guía en vez de un enlace a `/kyc` — cablear esa ruta desde un stub
  necesitaría plomería en `App.tsx` fuera del alcance. (4) Avisos con tokens `warning-*`/`danger-*`
  en vez de `.alert-*`.
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind), ni
  `collateral.get()` contra `/collateral` real (sin credenciales del backend de Creva — forma de la
  respuesta y estados posibles sin confirmar). **No autocertificada como cerrada — falta segunda
  vista.**

- [ ] **2026-09-05 — Noveno incremento de la migración: `ReportScreen.tsx` nueva, reemplaza el
  `StubScreen` genérico de "Tu reporte" (`report`).** Puerto real de
  `creva_finance/frontend/app/report/page.tsx`: el reporte se arma con `crevaScore.report()` de
  `app/lib/api.ts` (ya existía, no se tocó) — **es un POST que gasta cuota de proveedor, así que
  igual que el frontend está detrás de un botón explícito "Generar mi reporte", nunca se dispara al
  montar.** Vista previa con el aviso de que consulta el perfil fiscal, vista de resultado con
  sujeto + fecha, la frase "N de estas M señales son sobre tu negocio", las categorías
  (`REPORT_CATEGORIES`/`CATEGORY_TITLES`/`CATEGORY_HINTS`/`TONE_LABELS` de `app/lib/report-display.ts`,
  ya portado, sin tocar), notas, "Qué se consultó", "Lo que este reporte NO dice"
  (`disclosure.does_not_estimate`) y la card de sello (folio, línea de firma, `does_not_prove`).
  `App.tsx`: rama nueva `activeStub === "report"` monta `ReportScreen` antes del `StubScreen`
  genérico. Sin dependencias nuevas. Test nuevo `app/test/unit/more/report.spec.ts`. `tsc --noEmit`
  limpio; `npx jest` verde (49/49 suites, 214/214 tests — antes 48/208).
  **Desviaciones deliberadas del "as is":** (1) no se portó `ReportPaper` (la hoja imprimible) ni
  `window.print()` — son web-only, no hay equivalente nativo sin dependencia nueva; (2) la entrega
  del archivo sellado va por `Share.share()` con el JSON como `message` en vez de la descarga por
  `Blob`/`<a download>` del navegador — sin dependencia nueva (no `expo-file-system`); (3)
  `TONE_COLORS` de `report-display.ts` son strings `var(--cr-*)` inservibles en RN, se mapeó tono →
  clase Tailwind localmente en la pantalla; (4) los avisos usan tokens `info-*`/`warning-*`/
  `danger-*` en vez de `.alert-*` del frontend.
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind), ni el
  POST real contra `/creva-score/report` (sin credenciales del backend de Creva — no se confirmó la
  forma de la respuesta, ni que `Share.share` con un JSON grande sea utilizable en la práctica en
  iOS/Android). **No autocertificada como cerrada — falta segunda vista.**

- [ ] **2026-09-05 — Octavo incremento de la migración: `RegulatoryScreen.tsx` nueva, reemplaza el
  `StubScreen` genérico de "Reglas que te afectan" (`regulatory`).** Puerto real de
  `creva_finance/frontend/app/regulatory/page.tsx`: el radar regulatorio se lee de
  `crevaScore.radar()` de `app/lib/api.ts` (ya existía, no se tocó) — `SourceResult<RegulatoryRadar>`,
  con `radar?.available ? radar.data : null` igual que el frontend. Las alertas se parten en
  "Novedades publicadas" (`kind === "publication"`) y "Reglas que ya estaban vigentes"
  (`kind === "standing_rule"`), cada una con su fuente oficial (mapa `SOURCE_LABELS` idéntico),
  agencia, fecha (`formatLongDay`, ya portado) y `EvidenceLink` al documento. Estado de carga
  (`ActivityIndicator`), fallback "Revisión no disponible" cuando `data === null`, y pie con fuentes
  consultadas / fechas no leídas. Se conserva la frase de privacidad "Esta revisión no consulta
  ningún dato tuyo". `App.tsx`: rama nueva `activeStub === "regulatory"` monta `RegulatoryScreen`
  antes del `StubScreen` genérico (mismo patrón que Movimientos/Estados de cuenta/Avisos). Sin
  dependencias nuevas. Test nuevo `app/test/unit/more/regulatory.spec.ts` (aserciones por fuente,
  patrón de `more/notifications.spec.ts`). `tsc --noEmit` limpio; `npx jest` verde (48/48 suites,
  208/208 tests — antes 47/202).
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind ya
  documentado en los incrementos anteriores), ni el radar contra el backend real de Creva /
  `/creva-score/radar` (sin credenciales de ese backend desde esta sesión — no se confirmó la forma
  exacta de la respuesta ni que `alert.kind` venga poblado). El banner de privacidad y el fallback
  usan tokens `info-*`/`warning-*` de `tailwind.config.js` en vez de las clases `.alert-info`/
  `.alert-warning` del frontend (no existen en la app). **No autocertificada como cerrada — falta
  segunda vista.**

- [ ] **2026-09-05 — Séptimo incremento de la migración: `NotificationsScreen.tsx` nueva, reemplaza
  el `StubScreen` genérico de "Avisos" (`notifications`).** Puerto real de
  `creva_finance/frontend/app/notifications/page.tsx`: la lista de "Avisos" se arma con
  `buildReminders()` de `app/lib/reminders.ts` (ya portado, no se tocó) alimentado por cuatro APIs
  reales vía `Promise.allSettled` — `score.get()`, `credit.eligibility()`, `statements.list()` y
  `statements.summary()` de `app/lib/api.ts` (ya existían, no se tocaron). Subtítulo por conteo de
  pendientes, estado de carga (`ActivityIndicator`), estado vacío y el bloque "Beneficios y
  recompensas / Próximamente" con los cuatro socios de lealtad, todo con el mismo copy del frontend.
  `App.tsx`: nueva rama `activeStub === "notifications"` monta `NotificationsScreen` antes del
  `StubScreen` genérico (mismo patrón que Movimientos y Estados de cuenta); las tres entradas que ya
  abrían `openStub("notifications", …)` (Dashboard, Perfil, Más) caen en la pantalla real sin más
  cableado. Sin dependencias nuevas. Test nuevo `app/test/unit/more/notifications.spec.ts` (mismo
  patrón de aserciones por fuente que `more/movements.spec.ts`). `tsc --noEmit` limpio; `npx jest`
  47/47 suites, 202/202 tests aislado — en el full-run bajo carga fallan por timeout
  `auth/auth-gate.spec.ts` y `help/search.spec.ts` (flakiness ya documentada en el sexto
  incremento, pasan aisladas: 3/3 suites, 11/11 tests). Antes: 46 suites / 196 tests.
  **Desviación deliberada del "as is":** (1) las tarjetas de recordatorio son de solo lectura — el
  frontend las envuelve en `<Link href={reminder.href}>`, pero la app no tiene router de deep-link
  para seguir esas rutas desde una pantalla de stub; se muestra el CTA como texto. (2) los mosaicos
  de socios usan el token `surface-2`/`crimson` de Creva en vez del hex de marca de cada socio que
  el frontend incrusta inline — regla dura de "cero hex nuevo" + "no incrustar medios de terceros".
  **No se verificó:** resultado nativo/visual (mismo bloqueo `react-native-web`/NativeWind ya
  documentado en los incrementos anteriores), ni el armado de la lista contra datos reales del
  backend de Creva (sin credenciales de ese backend desde esta sesión). **No autocertificada como
  cerrada — falta segunda vista.**

- [ ] **2026-09-05 — Primer incremento de la migración: `DeleteAccountScreen.tsx` ganó paridad real
  con `/profile/delete-account`, confirmado visualmente vía sesión autenticada real en el
  frontend.** Screenshots reales tomados a 375×812 con la cuenta de prueba del frontend (login
  persistido en el navegador, sesión ya autenticada). **Cambios:**
  - Botón real "Escribir el correo" (`Linking.openURL(mailto:...)`) — mismo `MAILBOX`/`SUBJECT`/
    `BODY` que `creva_finance/frontend/app/profile/delete-account/page.tsx`, antes la pantalla no
    tenía ningún canal para iniciar la solicitud (hueco documentado en la auditoría anterior de
    esta misma pantalla, ver bloque de arriba de "Paridad móvil").
  - Card "Ten en cuenta" con la advertencia de permanencia (mismo texto que el `note` de
    `borrar-mi-cuenta` en `help-content.ts`, que ya existía pero no se mostraba en esta pantalla).
  - Enlace "Aviso de privacidad" que abre el stub `privacy` (`stub-topics.ts`), cableado en
    `App.tsx` vía `openStub("privacy", "profile-delete-account")` — mismo patrón que el resto de la
    navegación de `Más`.
  - `VisualPrimitives.tsx`'s `Card` ganó un prop `tone?: "default" | "highlight"` (usa el token
    `surface-2` ya existente en `tailwind.config.js`) para la card destacada — no se inventó ningún
    color nuevo.
  - `tsc --noEmit` y `npx jest` verdes (41/41 suites, 176/176 tests) después del cambio.
  **No se verificó:** el resultado nativo (Expo Go / simulador) — sigue bloqueado por el conflicto
  de versión `react-native-web`/NativeWind ya documentado arriba (`TypeError: Class extends value
  undefined`), así que no se pudo confirmar visualmente en `app/` mismo, solo por lectura de código
  y por paridad de texto/wiring contra el frontend ya screenshoteado. **No autocertificada como
  cerrada** — falta segunda vista antes de mover a Cerrados.

- [ ] **2026-09-05 — `facilitator.ts` no envuelve su `fetch` en try/catch: un facilitador
  caído tumba el proceso del gateway entero, no solo la request.** Sobrevive del bloque de abajo
  (ya resuelto el gap de config que lo disparó): con `FACILITATOR_URL` apuntando a
  `http://localhost:4020` (default sin nada corriendo ahí) el `ECONNREFUSED` de
  `verifyPayment`/`settlePayment` sale como unhandled rejection y mata el proceso Node completo
  (reproducido dos veces, mismo punto, antes de configurar `FACILITATOR_URL` real). **No se tocó**
  para no ensanchar el alcance del bloque de signer — sigue como hardening pendiente: que un
  facilitador caído devuelva 402 `settlement_failed`/`facilitator_verify_http_*` en vez de
  tumbar el proceso, para cualquier despliegue futuro donde `FACILITATOR_URL` vuelva a
  desconfigurarse o el facilitador externo caiga en medio del evento.

- [ ] **2026-09-05 — Paridad móvil, tercera revisión; coordinación Codex en
  `codex/mobile-parity-audit`.** Navegación: `codex/mobile-parity-foundation`;
  Ayuda: `codex/mobile-parity-help`; Inicio: `codex/mobile-parity-dashboard`.
  Cada módulo conserva su worktree y una trazabilidad de archivo/línea del frontend.
  Pendientes: todas las rutas restantes, integración, typecheck/lint y suites
  unit/fuzz/invariant, ejecución autenticada real y comparación visual por pantalla.
  Hallazgo confirmado: SVG nativo sin `fill="none"` en la raíz; Movimientos y
  Reporte usan paths distintos a `BottomNav.tsx`. El gateway solo expone reporte,
  verificación y anclaje; `/score` todavía no está expuesto. Para datos personales
  debe conservarse la identidad Clerk del solicitante: la identidad de servicio
  devolvería el score de otra cuenta. No se ha verificado una sesión real.

- [ ] **2026-09-05 — Corrida de integración (Solver v2): auditadas las 26 ramas remotas, 0
  mergeadas, 7 en HOLD.** 13 ramas ya están en `main` (ancestro directo, sin patch pendiente):
  `feature-arc-anchor`, `feature-bazantic-recipes`, `feature-creva-service-identity`,
  `feature-gateway-x402`, `feature-help-search`, `feature-icon-audit`, `feature-logic-port`,
  `feature-nav-icon-fix`, `feature-report-wiring`, `feature-selfie-check`, `feature-ui-audit-fix`,
  `feature-ui-port-core-screens`, `feature-web-parity-port` — seguras de borrar del remoto.
  6 ramas de mecanismo/tooling ignoradas (`codegraph-init`, `feature-agent-loop`,
  `scaffold-monorepo`, `docs-plan-cleanup`, `worktree-agent-afdbf7b00fe421686`,
  `claude/magical-taussig-*`). **HOLD, ninguna con bloque "Cerrados" que la respalde** (regla dura
  de la corrida: solo se pushea lo ya documentado como cerrado/verificado):
  - `feature-mobile-native-parity` — 9 commits, +2940 líneas (7 pantallas nuevas + 10 suites de
    test + deps `react-native-web`/otras + 230 líneas de `docs/plan.md` propio). Merge-tree limpio,
    pero es trabajo grande sin VERIFY de Solver ni bloque cerrado; cae bajo el bloque abierto de
    "Paridad móvil, tercera revisión". HOLD-no-plan-block.
  - `feature-dashboard-parity` (`7927d11`), `feature-more-sheet-parity` (`475a997`),
    `feature-nav-parity-render` (`fa7e3a7`), `feature-scoregauge-parity` (`4209ea9`) — cada una 1
    commit de ajuste visual de paridad web/móvil (primitivas de dashboard, tarjetas del sheet
    "Más", `fill="none"` en la raíz del SVG + espaciado del bottom nav, `ScoreGauge` como
    arco/anillo). Merge-tree limpio. Todas modifican `docs/plan.md`/`docs/memoria.md` dentro de su
    propio commit — se auto-documentan, no corresponden a un bloque cerrado preexistente en `main`.
    Pertenecen al bloque abierto de paridad móvil. HOLD-no-plan-block.
  - `codex/mobile-parity-delete-account` (`3660ffb`) — agrega `react-native-web` a
    `app/package.json` + lockfile, docs de auditoría de `DeleteAccountScreen`. Merge-tree limpio.
    WIP del bloque abierto de paridad Codex. HOLD-no-plan-block.
  - `claude/bazantic-sponsor-block-6s1iv6` (`fe0fe75`) — solo +32 líneas a `docs/plan.md`
    documentando un bloqueo de `JwtAuthGuard` de Bazantic. **Conflicto de merge en `docs/plan.md`**
    y además superseded: Bazantic ya está cerrado en `main` vía `feature-creva-service-identity`
    (identidad de servicio con refresh token). Mergearla reabriría un bloque resuelto.
    HOLD-conflict + superseded.
  Cero push, cero merge, cero reescritura de historia en esta corrida. `git merge-tree` se usó en
  vez de un worktree de integración descartable (no había nada que mergear). Para avanzar las 5
  ramas de paridad hace falta: integrarlas juntas en un worktree, `tsc`/lint/`jest`
  unit+fuzz+invariant verdes, y comparación visual por pantalla — exactamente los pendientes que ya
  lista el bloque abierto de paridad móvil de arriba.
  **Actualización `2026-09-05` (sexto intento — barra de navegación inferior, worktree
  `feature-nav-parity-render`, render-vs-render real: `creva_finance/frontend` en `localhost:3001`
  y `app/` vía Expo web `react-native-web` en `localhost:8090`, ambos a 375×812).** Causa raíz
  del "parecido pero no igual" en los iconos, confirmada visualmente: `Icon.tsx` no ponía
  `fill="none"` en la raíz `<Svg>`, y `react-native-svg` (nativo **y** web) rellena de negro
  por defecto todo `<Path>`/`<Rect>` sin `fill` — el arco del icono **Score** salía como medio
  disco negro y el de **Tarjeta** como un bloque relleno, mientras que la web hereda `fill="none"`
  del `<svg fill="none">` de `BottomNav.tsx:25,40,51`. Arreglos aplicados, cada uno con su
  atributo exacto (`app/features/shared/icons/Icon.tsx` y `app/App.tsx` `TabBar`):
  1. `Icon.tsx` `common` → `{ viewBox, fill: "none" }` — cubre los 26 glyphs de una vez; los que
     sí se rellenan mantienen su `fill={stroke}`/`fill={fillColor}` propio.
  2. `TabBar` icono `size={20}` → `22` (la web usa `width="22"` en `BottomNav.tsx`).
  3. "PRONTO": era un badge flotante absoluto (`bg-inactive`, `-top-1 right-2`, pill); la web
     (`globals.css` `.cr-nav-pending`) es texto plano bajo la etiqueta — ahora `<Text>` normal
     `text-[8px] font-bold tracking-[0.04em] text-text-subtle`.
  4. Pestaña deshabilitada: se quitó `opacity-40` (la web no atenúa el `/cards`).
  5. Etiqueta `text-xs` (12px) → `text-[10px]`; `gap-1` → `gap-[3px]`; `py-3` → `py-[9px]`
     (valores de `.cr-nav-item`).
  Diferencia menor restante, **no** arreglada: `.cr-nav` de la web lleva
  `box-shadow: 0 -1px 20px rgba(0,0,0,0.06)` — la barra RN no; efecto casi invisible, sin
  equivalente RN fiable. **Verify:** `tsc --noEmit` limpio; `jest unit fuzz invariant` → 41
  suites/176 tests verdes (una corrida bajo carga mostró el flake ya documentado de
  `auth-gate.spec.ts` — timeout de act(), reproducido y confirmado no relacionado; verde en
  reruns aislados). **Falta:** certificación visual del par de screenshots (antes/después) por
  humano o Auditor antes de mover esta pantalla a Cerrados — no se autocertifica. Expo Go en
  dispositivo físico real tampoco verificado (sin hardware; el render fue Expo web
  `react-native-web`, que reproduce el default `fill` de `react-native-svg` pero no es idéntico
  a Hermes/nativo). Resto del bloque (otras pantallas, gateway `/score`, sesión real) sigue
  abierto.

- [ ] **Decidir qué parte de `docs/` se vuelve pública.** Ya se pusheó `docs/` completo (más allá
  de lo que exige SDD), revisado por secretos — limpio. Falta decisión formal de mantenerlo así.

- [ ] **Responder los dos check-ins de la semana del 09/07** en el hacker dashboard — el stake se
  devuelve solo si se responde y se entrega proyecto.

- [ ] **Asistir a las sesiones de feedback.** Martes 09/08 2–4 PM ET, jueves 09/10 9–11 AM ET.

- [ ] **Confirmar en el dashboard de ETHGlobal quién entra al equipo**, con stake propio cada
  quien — decisión de equipo ya tomada, falta el trámite.

- [ ] **Safe-area insets: código listo, falta confirmar en Expo Go real.** Bug reportado desde
  Expo Go en iPhone físico: el status bar (reloj/señal/batería) se solapaba con el header y los
  títulos de sección en `SelfieCheckScreen.tsx`, `QueryScreen.tsx` y `VerifyScreen.tsx` porque
  ninguna pantalla usaba `SafeAreaView`/`useSafeAreaInsets`. `App.tsx` ahora envuelve todo en
  `SafeAreaProvider`, y las tres pantallas envuelven su contenedor raíz (todas las ramas de
  estado, incluida `identity_unavailable`) en `SafeAreaView` con `edges={['top','bottom']}`.
  `react-native-safe-area-context` ya era dependencia (`~5.7.0`), no hizo falta instalar nada.
  `tsc`/`jest` pasan (98/98, una suite falla por un `EPERM` de caché de Jest preexistente y no
  relacionado). No se encontró en el código ningún botón flotante de engranaje/ajustes — si existe,
  vive en una rama o worktree que no llegó a este branch. **Falta:** confirmar visualmente en Expo
  Go sobre el iPhone físico donde se vio el bug — no hay simulador/dispositivo disponible desde esta
  sesión de agente.

- [ ] **Selfie Check: verificación server-side real agregada, falta confirmar el payload v4 contra
  sandbox real.** `gateway/src/world-verify.ts` llama a la Developer Portal API de World con
  `WORLD_API_KEY`; el WebView ya no decide `verified` por su cuenta. Bloqueo preciso: la API v4
  espera un `nonce` que el flujo de redirect WebView no produce — el mapeo a `protocol_version:
  "3.0"` es mejor esfuerzo, sin ejercer contra sandbox real (mismo criterio que Hedera: no gastar
  cuota real sin confirmar con el humano). Falta también Expo Go real en dispositivo físico.
  **Actualización `2026-09-05`:** enrollment al World ID Sandbox solicitado para
  `bankingluisalejandro@gmail.com`, iOS (TestFlight) y Android (Google Play internal test) — ambas
  solicitudes en estado "pending", aprobación por correo de Tools for Humanity todavía no llega.
  Primer intento de contacto rebotó (`sandbox.access@toolsforhumanity.org` no resuelve; dominio
  real es `toolsforhumanity.com`), reenviado a la dirección correcta. Bloquea este bloque y el de
  "Riesgo Expo Go" de abajo hasta que llegue la aprobación — nada más que avanzar aquí mientras se
  espera.

- [ ] **Publicación en App Store / Play Store — después del evento.** Decisión escogida: la
  revisión de iOS consumiría la ventana que queda. Se demuestra con Expo Go + video durante el
  evento. `eas submit` corre después del 2026-09-16.

- [ ] **Riesgo Expo Go: módulo nativo no soportado.** Si hace falta uno que Expo Go no trae, pasar
  a Dev Client (`eas build --profile development`) — medio día presupuestado, descubrirlo temprano.

- [ ] **Video demo: cronometrar y grabar.** Guion listo en
  [`docs/video-script.md`](video-script.md) (framework Pitch Deck, ≤3 min). Falta cronometrar,
  verificar la sección de Hedera contra el estado real el día de grabar, y grabar.

- [ ] **`slides.html` — outline listo, falta construir el artefacto.** Ver
  [`docs/slides-outline.md`](slides-outline.md), mapeado 1:1 contra `video-script.md`.

- [ ] **Instalar el CLI de Codex, si se va a usar.** `engram setup codex` ya dejó la config MCP
  lista en `%APPDATA%\codex\`; falta el plugin/hooks, que requiere el CLI real.

- [ ] **Uniswap Foundation — contribución al stack + `FEEDBACK.md`.** $5k, lift bajo: no exige
  producto nuevo, exige una contribución real (código o documentación) al stack de Uniswap más un
  `FEEDBACK.md` describiendo la experiencia de integrarlo. **Criterio de aceptación:** PR o commit
  mergeable en un repo del stack de Uniswap (a definir cuál según lo que Creva realmente toca, si
  es que toca algo — si no hay superficie de contacto real, esta pista se descarta en vez de
  forzarla) + `FEEDBACK.md` en este repo. **Secuencia:** en paralelo a Arc, es la más barata de
  ejecutar mientras se espera World ID.

- [ ] **The Graph y 1inch — evaluar después de cerrar Hedera + World + ENS + Arc + Uniswap.**
  Ninguna de las dos tiene hoy una forma de producto *load-bearing* en Creva (`brainstorming.md`
  §1 y §4 no las mapea a ninguna idea con encaje ≥3) — no se agregan sin antes construir esa forma,
  para no violar el descalificador #2. Formas candidatas a validar con el humano antes de tocar
  código:
  - **The Graph ($15k, pista Continuity $5k):** un subgraph que indexe los eventos on-chain que
    Creva ya emite (registro `negocio.creva.eth` en ENSv2/Sepolia del bloque 28dbcde, y el evento
    de respaldo de Arc de arriba si ese bloque cierra primero), y que el score-agent consulte en
    vivo como una señal más del radar regulatorio — ej. "cuántas verificaciones externas ha tenido
    este folio" vía `report-verification.controller.ts`. Se vuelve load-bearing solo si el score
    real cambia cuando ese dato cambia, no si es un panel decorativo.
  - **1inch ($7k):** el facilitador de x402 (Hedera) liquida hoy en la moneda que ya tiene; si en
    algún punto necesita convertir (ej. USDC recibido → moneda nativa para gas), esa conversión es
    candidata a ejecutarse vía Aqua/SwapVM de 1inch en vivo durante la demo. Solo tiene sentido si
    existe esa necesidad real de conversión — si el facilitador nunca convierte, no hay pista que
    integrar y se descarta.
  Ninguna de las dos entra al roadmap como bloque de trabajo hasta que una de estas formas se
  confirme con el humano como real (no hipotética) y se re-puntúe en `brainstorming.md` §4.

- [ ] **Ledger — $5,000, 2 pistas (AI Agents x Ledger $3.5k + Continuity $1.5k).** Prerrequisito:
  **Ledger Key Ring CLI** (`wallet-cli ring`) del Ledger Agent Stack, publicado 2026-09-03 en
  developers.ledger.com/ethonline — instalar y generar/importar una cuenta de firma dedicada a este
  track. Regla dura ya anotada: el Key Ring **no puede competir** con la wallet del facilitador de
  Hedera x402 (`brainstorming.md` línea 443) — necesita un rol de firma distinto y real (ej. firmar
  el lado Arc/on-chain del respaldo), no una segunda wallet decorativa. **Si esto no se resuelve
  (CLI instalado + rol de firma no-conflictivo definido), no podemos avanzar** con este bloque —
  se descarta antes que forzar una integración pegada que viole el descalificador #2.

- [ ] **Privy — $5,000, 2 pistas (B2B financial product $2.5k + Best financial flow $2.5k).**
  Prerrequisito: cuenta Privy + `defineChain` de viem con chain ID **296** (Hedera) y su JSON-RPC
  Relay, porque Privy no trae Hedera preconfigurada (`brainstorming.md` línea 336-337). Depende de
  que el bloque Arc/wallet-layer de arriba exista primero — no tiene sentido antes. **Si el chain
  296 custom no queda configurado y probado contra el Hedera JSON-RPC Relay real, no podemos
  avanzar** con este bloque.

- [ ] **Chainlink — $3,000, 2 pistas (Confidential Workflows CRE $2k + Upgrade $500).** Encaje
  débil, solo vigilar (`brainstorming.md` líneas 113-116): la pista de $500 exige que la
  integración **produzca un cambio de estado onchain** — *"simply displaying Chainlink data in a
  frontend is not sufficient"* — y Creva hoy no tiene contratos propios (el bloque Arc de arriba
  cambiaría eso). La de $2k (Confidential Workflows, CRE) todavía no publica requisitos.
  Prerrequisito antes de comprometer: (1) que el bloque Arc cierre y deje un contrato/evento
  onchain real que Chainlink pueda leer o disparar, y (2) que CRE publique los requisitos de
  Confidential Workflows y se confirmen compatibles con la tesis de privacidad de Creva. **Si
  ninguno de los dos prerrequisitos se cumple para el 09/14 (ver Q&A del dashboard), no podemos
  avanzar** con Chainlink y el bloque se descarta sin penalidad — es el fit más débil del lote.

## Variables de entorno por patrocinador — falta configurar

Checklist de cuentas/API keys que hay que crear y meter en el `.env` correspondiente antes de que
cualquier bloque de arriba pueda ejecutarse. `gateway/.env.example` y `app/.env.example` ya
declaran las de Hedera/World actuales; lo nuevo por patrocinador:

| Patrocinador | Variable(s) nuevas | Dónde | Fuente/cómo se obtiene |
|---|---|---|---|
| Hedera *(ya existe, confirmar valor real)* | `HEDERA_PAYER_ACCOUNT_ID`, `HEDERA_PAYER_PRIVATE_KEY`, `FACILITATOR_AUTH_TOKEN`, `FACILITATOR_FEE_PAYER`, `PAY_TO_ADDRESS` | `gateway/.env` | Cuenta testnet ya creada en `portal.hedera.com` (`brainstorming.md:396`) — el humano coloca la private key directo, nunca por chat |
| World *(ya existe, pendiente sandbox)* | `WORLD_API_KEY`, `WORLD_APP_ID`, `EXPO_PUBLIC_WORLD_APP_ID` | `gateway/.env`, `app/.env` | Developer Portal de World — bloqueado por aprobación de Tools for Humanity (ver bloque de arriba) |
| Arc (Circle) | `ARC_RPC_URL`, `ARC_NETWORK` (testnet/mainnet), `CIRCLE_AGENT_STACK_API_KEY`, cuenta/wallet de firma para el evento de respaldo | por definir (`gateway/.env` o nuevo `arc/.env`) | Cuenta Circle Developer + Arc testnet faucet |
| Uniswap Foundation | Ninguna API key — es contribución al stack, no runtime | — | Repo del stack de Uniswap a definir |
| Bazantic | `BAZANTIC_GATEWAY_URL`, `BAZANTIC_MCP_TOKEN` | `gateway/.env` | Signup en Bazantic — **confirmar que existe**, no está indexado públicamente hoy |
| Ledger | Config del Key Ring CLI (no es una env var de app, es estado local del CLI: `~/.ledger/` o similar) | Máquina del agente que firma, no `.env` del repo | `wallet-cli ring` del Ledger Agent Stack |
| Privy | `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, RPC URL de Hedera para `defineChain(296, ...)` | `gateway/.env` o `app/.env` | Dashboard de Privy |
| Chainlink | Por definir — CRE aún no publica requisitos de Confidential Workflows | — | Vigilar publicación, no crear cuenta todavía |

**Ninguna de estas API keys/private keys se pega en el chat** — el humano las coloca directo en el
`.env` que corresponda; una dirección pública o un tx hash sí son seguros de compartir por chat.

## Cerrados

- [x] `2026-09-05` — **Wallet Hedera de demo cableada en `QueryScreen.tsx` (worktree/branch
  `feature-hedera-mobile-signer`): decisión tomada con el humano, opción (b) — signer
  demo-scoped, no wallet real por usuario.** Investigación previa a tocar código, según
  `brainstorming.md`/`docs/plan.md`: se confirmó que `@hashgraph/sdk` publica un build oficial
  para React Native (`package.json`'s campo `"react-native"` → `lib/native.js`, `NativeClient` +
  `NativeChannel`) — la hipótesis inicial de que el SDK Node-oriented no correría en Expo era
  parcialmente incorrecta para el caso real que hacía falta: **congelar y firmar una
  `TransferTransaction` nunca abre una conexión de red** (`.execute()` sí, `.freeze()`/`.sign()`
  no), y la liquidación real ya la hace el facilitador vía HTTP (`gateway/src/facilitator.ts`'s
  `/verify`/`/settle`), no la app — así que el riesgo de gRPC/Dev Client que motivó rechazar la
  opción (a) (wallet real por usuario) no aplicaba al alcance real de este bloque, solo a
  `execute()`, que este bloque nunca llama.
  **Opción elegida y por qué:** (b) — un keypair de testnet demo-scoped vía
  `EXPO_PUBLIC_HEDERA_DEMO_ACCOUNT_ID`/`EXPO_PUBLIC_HEDERA_DEMO_PRIVATE_KEY`, documentado como
  clave de demo compartida, nunca la wallet real de una usuaria — decisión del humano, con la
  razón explícita de que (a) hubiera arriesgado días de trabajo de Dev Client tan cerca del Q&A
  del 09/14, y (b) ya entrega el ciclo x402 real completo con el mismo criterio de disciplina de
  gasto que Arc-anchor y el facilitador de Hedera.
  **Nuevo `app/features/query/hederaPayment.ts`:** `buildSignedPaymentHeader(requirements,
  credentials)` espeja `gateway/src/hedera-signer.ts`'s `buildSignedPaymentHeader` pero sin
  `Client`/red — construye la `TransferTransaction`, la congela con `setNodeAccountIds([0.0.3])`
  y `TransactionId.generate(payerId)` (sin necesitar un `Client` conectado), la firma, y arma el
  payload x402 v2 (`accepted`/`payload.transaction`) igual que el lado gateway.
  `readDemoCredentialsFromEnv()` lee las dos env vars nuevas, `undefined` si falta cualquiera.
  **`QueryScreen.tsx`'s `pay()` reescrito:** ya no reintenta ciegamente sin `X-PAYMENT` — llama
  `buildSignedPaymentHeader` con `pendingPayment.accepts[0]` y las credenciales del entorno, y
  adjunta el header real a `requestSignal`. Si las credenciales no están configuradas, muestra ese
  gap real ("No hay una billetera Hedera de demo configurada"), nunca un pago simulado.
  **Polyfills nuevos** (`app/polyfills.ts`, importado primero en `index.ts`): `Buffer` global y
  `react-native-get-random-values`, ambos ya dependencias transitivas de
  `@hiero-ledger/cryptography` (dependencia real de `@hashgraph/sdk`) — se promovieron a
  dependencias directas del `app/package.json` en vez de dejarlas implícitas.
  **`jest.config.js`:** `transformIgnorePatterns` extendido (no reemplazado) para incluir
  `@hashgraph`/`@hiero-ledger`, porque su build de React Native se publica como ESM sin
  transformar en `node_modules`, igual que el resto del ecosistema RN que el preset de
  `jest-expo` ya cubre.
  **Verify:** `tsc --noEmit` limpio. `npx jest unit fuzz invariant` → **41 suites/176 tests**
  verdes (antes 37/165; +3 suites nuevas: unit + fuzz + invariant de `hederaPayment`, siguiendo el
  mismo patrón que `gateway/test/unit/hedera-signer.spec.ts` — keypair generado en el test, nunca
  contra red real). `npx expo export --platform ios` bundló limpio con el SDK real incluido
  (**1764 módulos**, antes 1345–1516 en los cierres previos — el salto viene de
  `@hashgraph/sdk`+`@hiero-ledger/cryptography`), un solo warning benigno de resolución de
  subpath de `@noble/hashes` (fallback a resolución por archivo, sin error). `dist/` del export
  borrado tras verificar; sin servidor Metro corriendo al terminar (`netstat` confirma sin puertos
  8081/8098 en `LISTENING`).
  **Actualización `2026-09-05` (segunda pasada) — credenciales colocadas por el humano en
  `app/.env`, ciclo ejercido contra el gateway real: firma correcta, liquidación bloqueada por un
  gap de configuración pre-existente del gateway, no del signer nuevo.** `jest`/`jest-expo` resultó
  no servir para esta verificación: su `fetch` global (implementación nativa de RN, sin runtime
  nativo real bajo Jest) nunca completa una petición de red real — `.status` vuelve `undefined` —
  así que `app/test/integration/live-app-payment.spec.ts` se escribió, se confirmó inútil para
  esto, y **se borró** (no se deja un test roto en el repo). En su lugar se ejecutó un script
  suelto con `tsx` (Node real, mismo `hederaPayment.ts` sin modificar) contra el gateway real ya
  corriendo en `192.168.68.52:8787`:
  1. `POST /creva-score/report` sin pago → **402 real**, `payTo` viene como dirección EVM
     (`0x9ac5EA59E6f68Ef3bfc8c29FA2bb2F9b71B5Bf93`), no `0.0.x` — `AccountId.fromString` de
     `@hashgraph/sdk` la acepta igual, sin cambios necesarios en `hederaPayment.ts`.
  2. `buildSignedPaymentHeader` con las credenciales reales del humano → **header X-PAYMENT válido
     generado** (682 caracteres) sin error — confirma que el signer de la app firma correctamente
     contra un reto 402 real, no solo contra el fixture del test unitario.
  3. Retry con `X-PAYMENT` → el gateway **crasheó** (`ECONNRESET` del lado del cliente). Log del
     proceso: `TypeError: fetch failed` → `ECONNREFUSED` conectando a `localhost:4020` — el
     `facilitator.ts` de `gateway/src/config.ts:8` cae a ese default porque **`FACILITATOR_URL` no
     está seteada en `gateway/.env`** (sí está declarada en `gateway/.env.example` con
     `https://api.testnet.blocky402.com`, pero el `.env` real no la tiene). El rechazo de red no
     estaba en un `try/catch` en `gateway/src/facilitator.ts`'s `verifyPayment`, así que se
     propagó como unhandled rejection y **tumbó el proceso del gateway entero** — no solo esa
     request. Confirmado reproducible: reinicié el gateway (`npx tsx src/index.ts`, capturando
     log) y crasheó exactamente igual en el mismo punto.
  **Diagnóstico, no arreglado:** esto es un gap de configuración/hardening del **gateway
  existente** (`FACILITATOR_URL` sin valor real + falta de manejo de error en
  `facilitator.ts`), no del bloque de signer de esta sesión — el signer cumplió su parte (firma
  válida, 402→firma correcta). No se tocó `gateway/.env` (el humano coloca esa URL, no un agente)
  ni se cambió `facilitator.ts` sin permiso explícito, para no ensanchar el alcance de este bloque.
  **Actualización `2026-09-05` (tercera pasada) — `FACILITATOR_URL`/`FACILITATOR_FEE_PAYER`/
  `X402_VERSION` colocados por el humano en `gateway/.env`, ciclo completo verificado en vivo con
  liquidación real, más dos bugs reales de `hederaPayment.ts` encontrados y corregidos en el
  camino.** Con `FACILITATOR_URL` real, el `/verify` empezó a devolver errores de validación
  concretos del facilitador en vez de crashear — cada uno diagnosticado con el mismo script suelto
  contra el gateway real más un segundo script que replica `facilitator.ts` directo para aislar
  gateway vs facilitador:
  1. `extra should not be null or undefined` — `hederaPayment.ts`'s `accepted` payload nunca
     incluía `extra`, a diferencia de `gateway/src/hedera-signer.ts`'s
     `toV2PaymentRequirements`, que siempre sintetiza uno. Corregido: `accepted.extra:
     requirements.extra ?? {}`.
  2. Con `FACILITATOR_FEE_PAYER` configurado, `accepted_payment_requirements_mismatch` — el 402
     real de `gateway/src/index.ts` nunca exponía `extra.feePayer` en el `accepts[]` que el
     cliente recibe, así que la app no tenía forma de saber qué `extra` firmar. **Fix real en el
     gateway** (`gateway/src/index.ts`, `facilitatorExtra()`): `reportRequirements`/
     `verifyRequirements` ahora incluyen `extra: { feePayer }` en el propio reto 402, para que
     cualquier cliente que firma su propio pago pueda leerlo y devolverlo tal cual.
  3. `invalid_exact_hedera_payload_fee_payer_mismatch` — `hederaPayment.ts` generaba el
     `TransactionId` con la cuenta del **pagador** (`payerId`), pero el facilitador exige que sea
     la cuenta del **fee-payer** (`gateway/src/hedera-signer.ts` ya hacía esto bien con
     `config.facilitatorFeePayer`). Corregido: `TransactionId.generate(feePayer ?? payerId)`,
     leyendo `feePayer` del `extra` que ahora llega en la requirement (punto 2).
  4. Faltaban tres variables en `gateway/.env` que sí estaban en `.env.example` pero nunca se
     habían poblado: `FACILITATOR_URL`, `FACILITATOR_FEE_PAYER`, `X402_VERSION` (sin la última,
     `facilitatorRequirements()` mandaba forma v1 — `maxAmountRequired` en vez de `amount` — al
     facilitador, que exige v2). El humano las colocó directamente en `gateway/.env`.
  **Ciclo real confirmado, extremo a extremo:** `POST /creva-score/report` sin pago → 402 real con
  `extra.feePayer` incluido; `hederaPayment.ts` firma con las credenciales de demo reales; retry
  con `X-PAYMENT` → **201 real**, `X-PAYMENT-RESPONSE`:
  `{"success":true,"transaction":"0.0.7162784@1788644546.956204030","network":"hedera:testnet",
  "payer":"0.0.10320624"}`, reporte sellado real en el cuerpo. **Verificado en el mirror node de
  Hedera testnet** (no solo confiado a la respuesta del facilitador):
  `GET /api/v1/transactions/0.0.7162784-1788644546-956204030?nonce=0` → `name: CRYPTOTRANSFER`,
  `result: SUCCESS`, transferencia exacta `-10000000`/`+10000000` tinybars entre
  `0.0.10320624` (el signer de demo de la app) y `0.0.10383638` (cuenta auto-creada por Hedera
  para el alias EVM `0x9ac5EA59E6f68Ef3bfc8c29FA2bb2F9b71B5Bf93` de `payTo` — comportamiento real
  de Hedera al transferir a una dirección EVM sin cuenta asociada todavía, no un bug), con
  `0.0.7162784` (el fee-payer) pagando el gas por separado. Un solo pago real, no un loop de
  reintentos.
  **Verify final:** `tsc --noEmit` limpio en `app/` y `gateway/`; `npx jest unit fuzz invariant`
  en `app/` → 41/176 verdes (sin cambio de conteo, los fixes no agregaron casos nuevos, ya
  cubiertos por el fixture existente que sí incluye `extra`); `npx vitest run --exclude
  "test/integration/**"` en `gateway/` → 16 suites/41 tests verdes (una corrida aislada mostró el
  flake ya documentado de `tinypool`/Jest — "Worker exited unexpectedly" —, reproducido y
  confirmado no relacionado, igual que en cierres anteriores). Gateway de verificación (`npx tsx
  src/index.ts`) detenido explícitamente al terminar, puerto 8787 confirmado libre con `netstat`.
  Scripts sueltos de diagnóstico (`live-app-payment-check.ts`, `facilitator-debug*.ts`) vivieron
  en el directorio de scratchpad de la sesión, nunca en el repo, y se borraron al terminar.
  **Sigue sin probarse:** Expo Go en dispositivo físico real — mismo motivo que el resto del repo
  (sin hardware disponible en esta sesión). **Bloquea, hasta que se ejerza:** re-verificar en
  dispositivo físico real los haptics de Success/Error de `VerifyScreen.tsx` contra el flujo
  pagado real (el cierre de haptics de abajo solo cubrió el mock anterior). Hardening pendiente
  anotado como bloque abierto separado arriba (`facilitator.ts` sin try/catch de red).
  Trabajo hecho en la rama `feature-hedera-mobile-signer`, mergeada a `main` (fast-forward) durante
  la sesión; los fixes de esta tercera pasada se commitearon directo sobre `main`.

- [x] `2026-09-05` — **Haptics verificados en dispositivo físico (Expo Go, iPhone) contra el
  flujo mockeado previo (antes de `feature-report-wiring`).** Confirmados los 3 puntos:
  `ImpactFeedbackStyle.Medium` en el botón de pago (`QueryScreen.tsx`), `NotificationFeedbackType
  .Success` al validar un sello válido y `.Error` al invalidarlo (`VerifyScreen.tsx`, este último
  probado con edición temporal de `folio=""` en `App.tsx`, revertida después). No re-verificado
  contra el gateway real — ver ítem abierto de wallet Hedera arriba, que bloquea llegar al estado
  pagado real desde la UI.

- [x] `2026-09-05` — **Bloqueo de arriba resuelto: haptics de Success/Error de `VerifyScreen.tsx`
  re-verificados en dispositivo físico contra el gateway real.** Dos hallazgos en vivo (Expo Go,
  iPhone) sobre la wallet de demo recién cableada:
  1. `hederaPayment.ts:82` usaba `Buffer.from(...).toString('base64url')` — el polyfill de
     `buffer` bajo Hermes/Metro no implementa esa codificación (Node sí), y el pago fallaba con
     "unknown encoding base64url". Reemplazado por codificar en base64 y convertir a base64url a
     mano (reemplazo de caracteres + recorte de `=`). Los tests (`hederaPayment.spec.ts`,
     `.fuzz.spec.ts`) siguen en verde porque decodifican con Node, que sí soporta `base64url`.
  2. `VerifyScreen.tsx` nunca intentaba pagar: mostraba el 402 y el mensaje de "no hay wallet
     conectada" sin botón de reintento, aunque `sealClient.ts` ya aceptaba `paymentHeader` desde
     antes. Cableado el mismo patrón de `QueryScreen.tsx` (`buildSignedPaymentHeader` +
     `readDemoCredentialsFromEnv`, estado `paying`, botón "Pagar y continuar").
  Verificado end-to-end en el dispositivo: pago real liquidado, "Reporte auténtico" con firma y
  contenido válidos, haptic de Success sentido. `tsc --noEmit` limpio, `jest` en
  `test/unit/verify`, `test/fuzz/verify`, `test/invariant/verify` → 10/10 verdes.

- [x] `2026-09-05` — **Bazantic — $3,000, 3 pistas: identidad de servicio con refresh token
  desbloquea la llamada real (worktree `feature-creva-service-identity`).** Diagnóstico previo
  (`docs/integrations/bazantic-recipes.md` §"Primer intento real") tenía dos hipótesis para el
  `tool_failed`/"No payment occurred" del primer intento; resultó ser la (b): `JwtAuthGuard` de
  `creva_finance/backend` valida contra Supabase (`AUTH_PROVIDER=supabase` por defecto) y no había
  JWT válido — un `CREVA_SERVICE_JWT` estático tampoco habría servido, porque los access tokens de
  Supabase expiran en menos de una hora. La hipótesis (a) (camelCase vs snake_case) resultó
  irrelevante: el schema real de la Recipe de Bazantic (`mcp__creva-score__creva_report`) usa
  snake_case (`business_name`, `state_code`), no el DTO REST crudo — eso es lo que de verdad se
  serializa en la llamada. Nuevo `gateway/src/creva-auth.ts` (`getCrevaAccessToken()`): cachea el
  access token en memoria (nunca en disco), decodifica su `exp` para saber cuándo caducó, y lo
  renueva vía `POST /auth/refresh` contra `config.crevaApiUrl` usando `CREVA_SERVICE_REFRESH_TOKEN`
  (nueva env var, placeholder en `gateway/.env.example`) — rota el refresh token en cada llamada.
  `gateway/src/creva-proxy.ts` adjunta `Authorization: Bearer <access token>` a toda request
  reenviada a Creva y responde 502 sin llamar a `fetch` si el token no se puede obtener (nunca
  reenvía sin auth). La cuenta de servicio la registró el humano directamente contra el backend real
  (producción, `https://creva-backend-c7as7id5jq-pv.a.run.app`) — ningún agente creó la cuenta ni la
  contraseña; solo se manejó el `refreshToken` ya emitido, pegado directo en `gateway/.env`, nunca en
  el chat. Nota para la próxima sesión: el primer valor pegado en `CREVA_SERVICE_REFRESH_TOKEN` era
  en realidad el `accessToken` (JWT largo, ~826 caracteres) por error de copiado, no el `refreshToken`
  real (opaco, ~12 caracteres) — `/auth/refresh` lo rechazaba con 401 "Invalid or expired refresh
  token"; verificado aislando la llamada fuera de `creva-auth.ts` (curl directo) antes de asumir el
  código propio como culpable. **Verify:** `tsc --noEmit` limpio, `eslint` limpio, 40/41 tests pasan
  (unit + fuzz + invariant nuevos en `gateway/test/{unit,fuzz,invariant}/creva-auth*` y
  `creva-proxy-always-authenticated.invariant.spec.ts`, más las suites preexistentes actualizadas
  para mockear `creva-auth.js`; el test #41 que falla intermitentemente — "Worker exited unexpectedly"
  de tinypool — ya fallaba igual en `main` sin tocar, confirmado corriendo la suite base). **Llamada
  real confirmada** vía `mcp__creva-score__creva_report` (`business_name: "Panadería La Espiga"`,
  `state_code: 14`, `document: true`, `embed: false`): folio
  `47AFE663-69F31F42-5D886F7A-3A89A4AC`, huella de integridad
  `e3983b07d610908e47dfdecc1300f1e350d02ee59085860bb7c5e3d406cb8dc9`, generado
  `2026-09-05T20:06:51.769Z`, PDF + HTML entregados en Descargas — sin error, sin necesidad de
  reintentos adicionales sobre el crédito de 0.30 USDC.

- [x] `2026-09-05` — **Web/mobile parity, pasada parcial (worktree `feature-web-parity-port`): sesión Clerk real cableada a `app/lib/api.ts`, score y nombre de usuario del dashboard ya no son hardcode. Deja abierto el resto del alcance grande de este bloque — ver detalle abajo.**
  Hallazgo de auditoría (no reportado en cierres previos): `app/lib/api.ts` exporta
  `setSessionSource`/`useClerkSessionSource` (`app/features/auth/session-source.ts`) desde el
  worktree `feature-ui-port-core-screens`, pero **nada en código de producción los llamaba** —
  solo los tests los invocaban directamente. Toda llamada real a `score.get()`/`crevaScore.*`
  habría salido sin `Authorization`, y el backend la habría respondido con 401. Corregido en
  `app/App.tsx`'s `AppFlow`: nuevo `useEffect` que registra `useClerkSessionSource()` vía
  `setSessionSource()` cuando `isSignedIn` es true, y lo limpia (`null`) en caso contrario —
  corre una sola vez en la raíz, cubre todas las pantallas sin duplicar el wiring por pantalla.
  **Ítem 3 del bloque original (score hardcodeado) resuelto:**
  `app/features/dashboard/DashboardScreen.tsx` ya no usa `useState(74)`; ahora llama
  `score.get()` de `app/lib/api.ts` (`GET /score`) en un `useEffect`, con estados reales de
  `scoreLoading` (spinner, `testID="dashboard-score-loading"`) y `scoreError` (mensaje visible,
  `testID="dashboard-score-error"`, nunca cae a un número inventado) — el `ScoreGauge` solo se
  renderiza con un valor real. **Ítem 4 (username hardcodeado "Ana") resuelto:** ya no recibe
  `userName` por prop con default `"Ana"`; usa `useUser()` de `@clerk/clerk-expo` directo
  (mismo patrón que `ProfileScreen.tsx:53-56`) y el saludo cae a `"Hola"` sin nombre cuando
  `firstName` es null, sin placeholder de persona.
  **Confirmado, no se encontró (ítem 7):** re-auditado `app/App.tsx` y `app/features/**` con
  grep de `gear|FAB|position.*absolute|zIndex` — cero resultados de un botón flotante de
  engranaje. Coincide con lo ya documentado en el cierre `feature-ui-audit-fix` (línea de abajo):
  no vive en este branch. Nada que remover.
  **Ítems 1/2 (iconos, estados de nav) no re-auditados icono-por-icono en esta pasada** — el set
  de `app/features/shared/icons/Icon.tsx` (21 glyphs) y el nav de 5 pestañas ya cerrados en
  `feature-nav-icon-fix` (ver más abajo) se dejaron como están; no se verificó de nuevo cada
  `d=` contra `creva_finance/frontend/components/BottomNav.tsx`/`HelpGlyph.tsx` línea por línea
  en esta sesión — pendiente para confirmar la cita exacta de cada glyph, en particular los 9
  ítems del sheet "Más" que el bloque original pedía citar uno por uno.
  **Ítems 5 y 6 NO abordados en esta pasada — quedan abiertos, con alcance real identificado:**
  `app/features/query/gatewayClient.ts` y `app/features/query/components/ReportPreviewCard.tsx`
  siguen usando datos mock (confirmado por grep), no `crevaScore.report()/.verify()/.radar()/
  .verification()/.disclosure()` de `app/lib/api.ts`; `app/features/help/HelpScreen.tsx` no tiene
  ningún `onChangeText`/filtro conectado a la caja de búsqueda — sigue inerte. Cablear ambos es
  trabajo real de UI + backend, no una corrección de una línea; no había presupuesto en esta
  sesión para hacerlo con el mismo estándar de "sin mock" que el resto del bloque exige.
  **Verify real de esta pasada:** `cd app && npm install` (worktree fresco, sin `node_modules`),
  `npm run typecheck` limpio, `npx jest test/unit test/fuzz test/invariant` → 36 suites/157 tests
  verdes (una corrida aislada mostró 1 falla transitoria en `test/unit/auth/auth-gate.spec.ts`
  con "render function has not been called" bajo carga de la suite completa; reproducido dos
  veces más y pasó las dos — flake de act()/timing bajo test-renderer, no relacionado con el
  cambio, coincide con el flake de `tinypool`/Jest ya documentado en el cierre de
  `feature-creva-service-identity`). `grep -rn "#[0-9A-Fa-f]\{3,6\}" app/features/` vacío.
  `npx expo export --platform ios` bundleó 1345 módulos sin error (4.2MB); Metro quedó corriendo
  en el puerto 8081 tras el export (proceso PID detectado con `netstat`), matado explícitamente y
  puerto confirmado libre. **No se corrió lint** — `app/package.json` no define un script `lint`.
  **Sin commitear ni pushear todavía la cobertura de tests nueva para este cambio puntual** — los
  36 suites existentes cubren el flujo de auth-gate que ya ejercía `DashboardScreen`, pero no hay
  un test nuevo que aserte específicamente el estado de loading/error del score ni que
  `setSessionSource` se registre al iniciar sesión; queda como deuda para el siguiente agente
  junto con los ítems 1/2/5/6 de arriba. **Sin verificar, como el resto del repo:** Expo Go en
  dispositivo físico real (sin hardware disponible en esta sesión).

- [x] `2026-09-05` — **Comprobar un reporte, cableado real (worktree `feature-report-wiring`):
  `app/features/query/**` y `app/features/verify/**` ya no usan datos mock — cierra los ítems 5/6
  dejados abiertos en el bloque anterior, con un ajuste de alcance real encontrado en el camino.**
  **Hallazgo previo a tocar código:** `app/lib/api.ts` ya tenía `crevaScore.{report,verify,
  verification,radar,disclosure}` completo y correcto como espejo de
  `creva_finance/frontend/lib/api.ts:726-752` — pero apuntan a `BASE` (`EXPO_PUBLIC_API_URL`, el
  backend principal con auth Clerk), y en este repo `/creva-score/report` y `/creva-score/verify`
  **no viven ahí**: viven en el gateway (`gateway/src/index.ts:66-82`), gateados por x402
  (`gateway/src/x402-gate.ts`), sin Clerk. `/creva-score/verification`, `/creva-score/radar` y
  `/creva-score/disclosure` **no existen en el gateway en absoluto** — solo report/verify están
  proxied (`gateway/src/creva-proxy.ts`, autenticado server-side vía `getCrevaAccessToken()`, nunca
  un JWT estático). Cablear "Comprobar un reporte" contra `crevaScore.*` de `app/lib/api.ts` habría
  llamado un endpoint que no existe en este backend real; se optó por el mismo patrón ya usado por
  `app/features/onboarding/world-verify-client.ts` (cliente feature-local que habla directo con
  `EXPO_PUBLIC_GATEWAY_URL`, sin pasar por `request()` de `lib/api.ts`) en vez de forzar el atajo
  de Clerk sobre un endpoint x402. `app/lib/api.ts` no se tocó — sus tipos (`SealedReport`,
  `CertificateVerification`, etc.) sí se reutilizan desde los nuevos clientes.
  **`app/features/query/gatewayClient.ts` reescrito:** `requestSignal(input, paymentHeader?)`
  hace `POST ${EXPO_PUBLIC_GATEWAY_URL}/creva-score/report` real; sin `paymentHeader` el gateway
  real siempre responde 402 con `accepts` real (`gateway/src/x402-gate.ts:16-27`); con un
  `X-PAYMENT` responde el `SealedReport` real y el settlement de `X-PAYMENT-RESPONSE` si viene.
  **`app/features/query/components/ReportPreviewCard.tsx` reescrito** para el `SealedReport` real
  en vez del mock `{businessName, signalsFound, sources}`: layout calca
  `frontend/components/report/ReportPaper.tsx:35-51` (fila de KPIs: señales / señales propias del
  negocio / fuentes), `ReportPaper.tsx:62-79` (chip de tono por señal) y
  `ReportPaper.tsx:108-115` (bloque "qué NO acredita" = `certificate.does_not_prove` +
  `disclosure.does_not_estimate`) — condensado para tarjeta de teléfono, no la hoja completa de
  impresión.
  **`app/features/verify/sealClient.ts` reescrito por completo:** el mock anterior simulaba un
  "fetch por folio" que **no existe en la API real** — el único endpoint real
  (`POST /creva-score/verify`, también x402-gated) recibe el `{report, certificate}` que ya tienes
  y devuelve `CertificateVerification` (`frontend/lib/api.ts:711-718`: un veredicto de contenido +
  uno de firma, no los "cinco veredictos" que inventaba el mock). `VerifyReportCard.tsx` y
  `VerifyScreen.tsx` reescritos para esa forma real; `VerifyScreen` ahora recibe `sealedReport:
  SealedReport | null` (no `folio: string`) — si es `null` (p. ej. el atajo desde `CreditScreen`
  sin haber generado un reporte) muestra un estado vacío real, nunca datos inventados.
  `App.tsx`: nuevo estado `sealedReport` en `AppFlow` que `QueryScreen` llena al pagar y
  `VerifyScreen` consume; ruta `"verify"` ya no hardcodea `folio="mock-folio"`.
  **Gap real, documentado en vez de inventado:** ni `gatewayClient.ts` ni `sealClient.ts` pueden
  producir un `X-PAYMENT` real — eso requiere una billetera Hedera firmando (`gateway/src/
  facilitator.ts`), y no hay ningún signer client-side en este repo (confirmado por grep). El
  botón "Pagar y continuar" de `QueryScreen` y el paso de verificación de `VerifyScreen` golpean el
  gateway real y, contra un gateway real, legítimamente vuelven a responder 402 hasta que exista
  un signer — se muestra ese 402 real con un mensaje explícito ("no hay billetera conectada"), no
  un pago simulado. Cerrar esto de verdad es un bloque de trabajo propio (integración de wallet
  Hedera), fuera de alcance de esta pasada.
  **Verify real de esta pasada:** `cd app && npm install` (worktree fresco, sin `node_modules`),
  `npm run typecheck` limpio. `npx jest unit fuzz invariant` → 36 suites/159 tests verdes (subió de
  157 a 159: +1 test neto en `gatewayClient.spec.ts`, -2/+4 en `sealClient.spec.ts` al adaptar los
  mocks de folio-fetch a verificación real, +2 nuevos). Los tests mockean `global.fetch`
  (siguiendo el patrón de `test/unit/api.spec.ts`), nunca la lógica de negocio; cubren 402 sin
  pago, 200 con reporte/verificación real, adjunto de `X-PAYMENT` cuando se provee, tolerancia a
  `X-PAYMENT-RESPONSE` malformado, y que un veredicto "altered"/"unsigned" del gateway nunca se
  reporta como válido. Una corrida aislada de la suite completa mostró la misma falla transitoria
  de `test/unit/auth/auth-gate.spec.ts` ya documentada en el cierre anterior (flake de act()/timing,
  reproducido y confirmado no relacionado: pasa solo, y confirmado con `git stash` que la rama base
  sin estos cambios también puede mostrarlo bajo la suite completa) — tres corridas consecutivas
  después de eso, 159/159 verdes. `npx expo start` con Metro real: pedí `GET /index.bundle?
  platform=ios&dev=true` por HTTP y bundleó 200 OK (~9.7MB) sin error de compilación; puerto
  matado explícitamente y confirmado libre con `netstat` (`LISTENING` ausente, solo `TIME_WAIT`
  residual de la conexión ya cerrada). **No hay backend/gateway real corriendo en esta sesión** —
  correcto por diseño (aislado a mocks de `global.fetch`), no un truco: nada en la app cae a datos
  inventados cuando ese backend real no responde, incluyendo el gap de la billetera de arriba.
  **Sin verificar, como el resto del repo:** Expo Go en dispositivo físico real, y el flujo pagado
  end-to-end contra un gateway real desplegado (bloqueado por el gap de wallet documentado arriba).

- [x] `2026-09-05` — **Arc (Circle) — idea 8, "el respaldo nace on-chain" (worktree
  `feature-arc-anchor`): reporte sellado ancla su hash canónico on-chain en Arc testnet.**
  Prerrequisito confirmado antes de tocar código: `ARC_RPC_URL`, `ARC_NETWORK`,
  `ARC_SIGNER_ADDRESS`, `ARC_SIGNER_PRIVATE_KEY`, `CIRCLE_AGENT_STACK_API_KEY` ya poblados en
  `gateway/.env`. Nuevo `gateway/src/arc-anchor.ts`: `anchorReportHash(canonicalHash, signer, rpcUrl,
  network)` valida el hash contra `/^0x[0-9a-fA-F]{64}$/` (nunca construye wallet/provider si es
  inválido — esa es la invariante dura) y envía una transacción de valor cero, auto-dirigida, con
  el hash como `data`, firmada con `ARC_SIGNER_PRIVATE_KEY` (el mismo rol de "quien paga el gas" que
  el facilitador de Hedera). Nueva ruta `POST /creva-score/anchor` en `gateway/src/index.ts`
  (`{ canonicalHash }` → `{ anchored, txHash, explorerUrl, network }`, 400 si el hash es inválido,
  503 si el signer no está configurado). **Verify:** `tsc --noEmit` limpio; 34/34 tests pasan
  (unit + fuzz + invariant nuevos en `gateway/test/{unit,fuzz,invariant}/arc-anchor*`, más las 11
  suites preexistentes sin regresión); **una acción real on-chain confirmada** —
  tx `0x285ea670c9fe31f06d90daeed15b3ec76b0253ca22783b6cfcff1756e15e6014`, `chainId 5042002`,
  `status: 1`, bloque `60605019` (confirmado vía `eth_getTransactionReceipt` contra el RPC real de
  Arc testnet, no simulado). Pendiente de menor prioridad: el dominio público del explorer de Arc
  testnet no está confirmado (candidatos probados el 2026-09-05 no resolvieron) — `buildExplorerUrl`
  queda documentado como convención best-effort a corregir cuando Arc publique su explorer; no
  bloquea el criterio de aceptación, que se cumple con el recibo minado real. Circle Agent Stack
  (`CIRCLE_AGENT_STACK_API_KEY`) queda anotado para la capa de wallet-as-a-service del facilitador
  en una iteración posterior — esta entrega usa la firma directa de `ARC_SIGNER_PRIVATE_KEY`, que
  ya satisface el criterio de aceptación (evento on-chain real atado al hash canónico).

- [x] `2026-09-05` — **Nav de 5 pestañas + sheet "Más" + set de iconos SVG (worktree
  `feature-nav-icon-fix`): 15 hallazgos de la auditoría UI cerrados.** `app/App.tsx`'s `TabBar`
  pasó de 2 pestañas (Inicio/Perfil) a las 5 del objetivo (Inicio, Score, Tarjeta, Crédito, Más);
  Tarjeta queda visiblemente deshabilitada con badge "PRONTO", no tocable
  (`disabled`/`accessibilityState`). "Más" abre `app/features/more/MoreSheet.tsx` ("Todo lo
  demás"), 11 ítems: Mi perfil/Ayuda navegan a `ProfileScreen`/`HelpScreen` existentes sin
  duplicarlas, los otros 9 (Movimientos, Calculadora, Estados de cuenta, Tu garantía, Sello de tu
  negocio, Reglas que te afectan, Tu reporte, Avisos, Aviso de privacidad) van a `StubScreen.tsx`
  genérico con copy tomado de `app/lib/help-content.ts` donde existe artículo. Set de iconos SVG
  compartido en `app/features/shared/icons/Icon.tsx` (21 glyphs, `react-native-svg` recién
  instalado vía `npx expo install`), paths copiados de
  `creva_finance/frontend/components/BottomNav.tsx`/`components/help/HelpGlyph.tsx` donde existían;
  colores resueltos desde `tailwind.config.js` (`theme-colors.ts`), cero hex nuevo en
  `app/features/`. **Decisión escogida:** Score y Crédito son pantallas mínimas reales nuevas
  (`ScoreScreen.tsx`/`CreditScreen.tsx`) que enlazan a `QueryScreen`/`VerifyScreen` respectivamente
  sin repurposearlas — ambas mantienen su identidad y entradas actuales. Los 9 callbacks no-op que
  la auditoría encontró (Dashboard: notificaciones/crédito/tarjeta; Profile: 5 filas de menú; Help:
  artículo/categoría) quedan todos cableados a una pantalla real. `DeleteAccountScreen.tsx` dedicado
  para "Eliminar mi cuenta" (no borra nada real, solo explica el canal de correo de
  `help-content.ts`). **Verify:** `tsc --noEmit` limpio; `jest unit+fuzz+invariant` → 36 suites/157
  tests verdes (antes 33/147, +10 tests nuevos: `test/unit/nav/structure.spec.ts`,
  `test/unit/more/structure.spec.ts`, `test/unit/shared/no-emoji.spec.ts`); `grep` de hex y de
  emoji sobre `app/features/` ambos vacíos; `npx expo start` bundleó `ios` sin error (CI mode,
  HTTP 200, ~9.7MB), servidor detenido y puerto confirmado libre con `netstat`. **Falta:** Expo Go
  en dispositivo físico real, mismo motivo que el resto del repo (sin hardware disponible). Detalle
  completo, incluida la lista de los 15 hallazgos y su resolución uno a uno: `docs/memoria.md`.

- [x] `2026-09-05` — **Auditoría UI/UX completa (worktree `feature-ui-audit-fix`): 6 hallazgos
  cerrados en el mismo lote.** (1) Bug de auth en reload corregido: `App.tsx`'s `AppFlow` ahora
  gatea la pantalla inicial en `useAuth()` real de Clerk (`isLoaded`/`isSignedIn`) en vez de
  `useState<Step>("sign-in")` fijo — una sesión activa + reload va directo a `home`, nunca vuelve a
  mostrar sign-in. (2) Paleta unificada: `app/tailwind.config.js` gana los 10 grupos de color
  `--cr-*` de `creva_finance/frontend/app/globals.css` (valores del `:root` claro, hardcodeados
  porque NativeWind no soporta custom properties CSS); los ~168 literales hex que había en
  `app/features/**` quedaron reemplazados 1:1 por esos tokens — `grep -rn
  "#[0-9A-Fa-f]\{3,6\}" app/features/` da vacío, sin excepciones. (3) Back button: `app/features/
  shared/BackButton.tsx` (nuevo, recreando `components/BackControl.tsx` de creva_finance) agregado
  a `SelfieCheckScreen`, `QueryScreen` y `VerifyScreen` — las tres pantallas sin tab bar; `SignInScreen`
  se deja sin back a propósito (pantalla de entrada, sin "antes" al que volver). (4) **Decisión
  bottom-nav-scope, reafirmada:** onboarding/query/verify se quedan de pantalla completa sin tab
  bar (flujos secuenciales de una sola tarea, no se quiere permitir saltar a Perfil a medio Selfie
  Check o a medio pago x402); dashboard/profile/help mantienen la tab bar mínima que ya tenían.
  (5) Afordancia "(?)": auditoría completa con `grep -rn "❓" app/features/` — un solo resultado
  (`ProfileScreen.tsx:68`), ya cableado a `onOpenHelp`/`setStep("help")`, confirmado funcionando,
  no se tocó. Ningún otro hallazgo. (6) Español: único archivo con copy en inglés real era
  `SelfieCheckScreen.tsx` (estados `identity_unavailable`/`idle`/`failed`/`verifying`) — traducido;
  sanity-check final con grep de palabras inglesas comunes sobre todo `app/features/**/*.tsx` no
  encontró copy visible restante (solo identificadores de código). Test de regresión real
  (no source-regex, a diferencia del resto de `test/unit/**`) en
  `app/test/unit/auth/auth-gate.spec.ts`: renderiza `App.tsx` completo con Clerk mockeado en sesión
  activa, confirma que `SignInScreen` nunca se monta. **Verify:** `tsc --noEmit` limpio;
  `jest unit fuzz invariant` → 33 suites/147 tests (antes 32/146) verdes; `grep` de hex vacío;
  `npx expo start` bundleó `ios` sin error (1332 módulos, HTTP 200), servidor detenido y puerto
  liberado (confirmado con `netstat` tras matar el proceso Node hijo, no solo el shell). **Falta:**
  Expo Go en dispositivo físico real — sin hardware disponible en esta sesión, mismo motivo que el
  resto del repo. Detalle completo, incluida la lista exacta de literales hex reemplazados y un
  incidente de git ajeno a este bloque (resuelto sin dejar rastro): `docs/memoria.md`.

- [x] `2026-09-05` — **Dashboard/Profile/Help Center screens ported, real Clerk sign-in screen
  added (worktree `feature-ui-port-core-screens`).** `app/features/dashboard/DashboardScreen.tsx`,
  `app/features/profile/ProfileScreen.tsx` y `app/features/help/HelpScreen.tsx` portan la
  estructura visual NativeWind de `creva_finance/frontend/app/{dashboard,profile,help}/page.tsx`
  (score primero + una sola acción siguiente en dashboard, menú de configuración en profile,
  buscador + más-preguntado + temas en help), reusando `app/features/query/components/
  VisualPrimitives.tsx` y `ScoreGauge.tsx` en vez de duplicarlos, y `app/lib/{help-content,
  reminders,format-money,score-display}.ts` ya portados. `app/features/help/components/
  {HelpGlyph,HelpSearch}.tsx` recrean los equivalentes de `components/help/*` con emoji en vez de
  SVG (mismo criterio que `ScoreGauge` de no añadir dependencia SVG nueva). Dashboard y Profile
  usan datos mock/estado local (igual que `QueryScreen`), no llaman a `app/lib/api.ts` — cablear
  datos reales queda fuera de este bloque. `app/features/auth/SignInScreen.tsx` es construcción
  nueva (no un port 1:1, porque `/login` de creva_finance solo redirige al formulario alojado por
  Clerk en web, sin equivalente en Expo): usa `useSignIn`/`useSignUp`/`useSSO` reales de
  `@clerk/clerk-expo` contra el contexto que ya monta `ClerkAppProvider.tsx` (no tocado), con
  estilo NativeWind recreando el lenguaje visual de `components/auth/*` (marca, GoogleButton,
  AuthDivider, campo de contraseña con ojo). Tests nuevos en `app/test/unit/{dashboard,profile,
  help,auth}/**` (10 specs, 146 tests totales en el repo tras el cambio) — mismo patrón de
  inspección de fuente por regex que `app/test/unit/query/safe-area.spec.ts`, porque
  `jest.config.js` solo matchea `*.spec.ts` y JSX en un test requeriría `.tsx`. **`tsc --noEmit`**
  y **`jest` (unit+fuzz+invariant)** verdes: 32 suites / 146 tests. `npx expo start` verificado
  bundleando para `ios` (CI mode, 1321 módulos, HTTP 200 en `/index.bundle`) — el bundle `web`
  falla por falta de `react-native-web` (dependencia preexistente, no instalada, fuera de alcance
  de este bloque: la app nunca se configuró para el target web). Servidor Metro detenido al
  terminar, puertos verificados libres con `netstat` tras `taskkill`. **Actualización `2026-09-05`:
  las cuatro pantallas ya están cableadas en `App.tsx`** — flujo `sign-in → onboarding → home
  (dashboard) ↔ profile → help`, más `query`/`verify` alcanzables desde `home` (`onOpenScore`).
  Tab bar mínima (Inicio/Perfil) agregada directamente en `App.tsx`, sin tocar las pantallas, para
  moverse entre `home`/`profile`/`help`; `query`, `verify`, `onboarding` y `sign-in` siguen de
  pantalla completa sin tab bar, igual que antes. Callbacks sin destino real todavía
  (`onOpenCredit`/`onOpenCard`/`onOpenNotifications`/`onOpenDetails`/`onOpenFiscal`/
  `onOpenSecurity`/`onOpenDeleteAccount`/`onOpenArticle`/`onOpenCategory`) quedan sin conectar a
  propósito — no hay pantalla destino todavía. `tsc`/`jest` (32 suites/146 tests) y bundle `ios`
  de Metro (CI mode, HTTP 200) verificados de nuevo tras el wiring, servidor detenido y puerto
  liberado. Falta, como en el resto del repo: Expo Go en dispositivo físico real (sin hardware
  disponible en esta sesión).

- [x] `2026-09-05` — **`negocio.creva.eth` registrado en Sepolia (ENSv2), folio sellado en el
  resolver.** `creva.eth` registrado vía el `ETHRegistrar` de ENSv2 (pagado en Sepolia USDC del
  faucet de Circle, no en ETH — la ruta ENSv1 documentada por ENS Labs para Sepolia está muerta,
  ver `docs/memoria.md` 2026-09-05 para la investigación completa). `negocio.creva.eth` creado bajo
  un `PermissionedRegistry` propio desplegado como subregistro de `creva.eth`, con un
  `PermissionedResolver` (clon EIP-1167) inicializado y record de texto
  `creva.report.folio = "SP-2026-000123"` — verificado con lectura on-chain (`text()` devuelve el
  valor exacto) y con la cadena completa registry→subregistry→resolver confirmada por separado.
  Evidencia (tx reales, Sepolia):
  - Registro `creva.eth`: commit `0x1e1c6370fd7842ec478b77f185d613ebb61c4655c9a1542e4bc2f2032fce344b`,
    approve USDC `0x14ce0d8c1386d91f99038a04965fc342aa58a6df6e909f3e3b0dd72308e20150`,
    register `0x84c7f6c0596a3e5bf034cf7a82dc02ed76149d7b260c7af01c7d137f14ee106c`.
  - Subregistro de `creva.eth`: deploy `0x5fbeb7a22ef310d42e62406ad3c8eea10aba5a8102f157795a607f1b0f1ea836`
    (dirección `0xe8FB3c870cAf02362Aba74EB0Bf81373B4C0FF37`), `setSubregistry`
    `0x3ca11cd18c6ae52b8240c242d87067aef6defa17c1eae45f20a6b0aa32e754ca`.
  - Registro `negocio`: `0xa31acb51c6bcda51485f321d6c91565a224e9f879806dd27225502ae6af4b03c`.
  - Resolver de `negocio.creva.eth`: deploy del clon
    `0x6aebd901d21bf1b1321f7883d6a6fe28a070e39d281791fff6ecfa16e21c2cfe` (dirección
    `0x9Ed7fF67BAb3f8fF254D0a966CFd1F94997B7E9E`), `initialize`
    `0x4547c16113a393b744e2c82874bdff1cff048ad28ebaf5d984f682008ea239ce`, `setResolver`
    `0x20f8e4ab13437b5e9040e2bae71592b5256a2aeca857e91329fa1b555a208250`, `setText`
    `0x24a736bef485cefbb61db2481ac94339c24f93d4a6ad947a92df2c9e6509f6a9`.
  - Explorer: https://sepolia.app.ens.domains/negocio.creva.eth
  Detalle completo (incluidos dos intentos previos que fallaron por bitmaps de rol incompletos, ya
  corregidos): `docs/memoria.md`.

- [x] `2026-09-04` — **Scaffold monorepo + 4 ramas feature + integración + roles v2.** `app/`
  (Expo/NativeWind) y `gateway/` (Node/Express) creados, mergeados a `main`; las 4 ramas
  (`feature-gateway-x402`, `feature-selfie-check`, `feature-agent-loop`, `feature-logic-port`)
  reconciliadas por el Solver en `integration-solver` y mergeadas a `main`. Modelo de roles
  actualizado a v2 (Main instruye, Solver mergea/pushea él mismo, Auditor revisa después) —
  `AGENTS.md` §Colaboración. Detalle completo: `docs/memoria.md`.

- [x] `2026-09-04` — **Estructura de tests `unit`+`fuzz`+`invariant` en `app/` y `gateway/`.**
  Aplicada a las 4 ramas y a `feature-agent-loop`'s tests movidos de `__tests__/` legacy. Estado
  final: `app/` 20 suites/104 tests, `gateway/` 7 suites/18 tests.

- [x] `2026-09-04` — **Puerto de la capa de lógica de `creva_finance` a `app/lib/`.** 9 archivos
  puros portados byte a byte, `lib/api.ts` adaptado a Expo. Un `TypeError` real encontrado por
  fuzz y corregido. 88/85 tests verdes.

- [x] `2026-09-04` — **UI visual de query/verify portada de `creva_finance`.** `QueryScreen`/
  `VerifyScreen` con secciones, score gauge, preview de reporte sellado y disclosure de qué NO
  certifica. Mock de gateway sigue mockeado; Expo Go físico pendiente aparte.

- [x] `2026-09-04` — **Gateway hardening: body cap, rate limit, helmet, replay protection.**
  `express.json` a 100kb, `helmet()`, `express-rate-limit` (120/min), replay de `X-PAYMENT` vía
  hash SHA-256 en memoria (limitación conocida: no distribuido, suficiente para una instancia).

- [x] `2026-09-05` — **Gateway x402/Hedera: pago real liquidado en testnet — criterio de la pista
  cumplido.** Cuatro intentos reales hasta cerrar: (1) `facilitator_verify_http_500` — hipótesis
  `TransactionId`=fee-payer descartada (coincide con `@x402/hedera` oficial); (2) mismo 500 tras
  agregar `dotenv`/corregir defaults de `config.ts` (`hedera-testnet`→`hedera:testnet`,
  `HBAR`→`0.0.0`) — tampoco era la causa; causa real: `paymentPayload` con forma v1 pero
  `x402Version: 2`, corregido en `hedera-signer.ts`/`facilitator.ts` con el campo `accepted` que
  exige el schema v2 real de `@x402/core`; (3) ya sin 500, nuevo error
  `invalid_exact_hedera_payload_amount_mismatch` probando autopago (`payTo`=mismo payer) — causa
  confirmada en el propio código de `@x402/hedera`: el autopago cancela a neto 0, matemáticamente
  incompatible con el chequeo `netToPayTo`, no un bug nuestro; (4) creada una segunda cuenta real
  de testnet (`0.0.10374017`) fondeada por el payer vía `AccountCreateTransaction`
  (`gateway/test/integration/create-payto-account.spec.ts`), usada como `PAY_TO_ADDRESS` —
  **liquidación real exitosa**. Tx: `0.0.7162784-1788585962-768194628`, `result: SUCCESS`
  confirmado en el mirror node de Hedera testnet, transferencia exacta
  `0.0.10119469 → 0.0.10374017` por `10000000` tinybars (`REPORT_PRICE_ATOMIC`). HashScan:
  https://hashscan.io/testnet/transaction/0.0.7162784-1788585962-768194628. Detalle completo de
  los cuatro intentos: `docs/memoria.md`.

- [x] `2026-09-04` — **Repo público + README reescrito.** `README.md` describe el producto de
  submission, no la carpeta de preparación.

- [x] `2026-09-04` — **`codegraph init` corrido contra el repo real.** 59 archivos indexados,
  telemetría apagada, `.codegraph/` en `.gitignore`.

- [x] `2026-09-04` — **Corrección de higiene de commits post-merge.** Dos merge commits con
  mensaje multi-línea (auto-generado por Git en conflicto) detectados por el Auditor — deuda
  documentada, no revertida (no es problema funcional).

- [x] `2026-09-04` — **Mapa de estado regenerado con `archify`.**
  [`docs/estado.html`](estado.html) refleja el estado actual (roles v2, 4 ramas mergeadas, Hedera/
  Selfie Check/Expo Go pendientes por credenciales/hardware, no por trabajo faltante).
  **Regenerado de nuevo `2026-09-05`** (worktree `docs-estado-audit`) tras auditar `docs/plan.md`
  y el repo real: el bloqueo de Selfie Check pasó de "faltan credenciales" genérico a la razón
  precisa — enrollment al World ID Sandbox pendiente de aprobación de Tools for Humanity. Cierres
  internos de esta tanda (gateway hardening, `codegraph init`, higiene de commits) no se muestran
  en el mapa por ser deuda de herramientas sin cambio visible para el lector del mapa. `archify
  validate` y `visual-check`: 0 errores.

- [x] `2026-09-01` — Aplicación a Continuity enviada, con ENS incluido.
- [x] `2026-09-03` — Stake de 0.025 ETH pagado.
- [x] `2026-09-01` — Spec OpenAPI pública desplegada (`/api/docs`, `/api/docs-json`).
- [x] `2026-09-04` — Reglas de finalista, checkpoints y regla de SDD incorporadas a `brainstorming.md` §9.
- [x] `2026-09-04` — `engram` instalado y wireado (Claude Code + opencode; Codex solo config MCP).
- [x] `2026-09-04` — Decisión: "start from scratch" no aplica a Continuity — `LEARNINGS.md` §3.
- [x] `2026-09-04` — `README.md` de esta carpeta privada traducido a inglés.
- [x] `2026-09-04` — Acceso a Bazantic confirmado, crédito de prueba ~0.30 USDC.
- [x] `2026-09-04` — Decisión: equipo humano + agentes de IA, no solo — falta trámite de dashboard (ver bloque abierto).

- [x] `2026-09-05` — **Búsqueda real en la pantalla de Ayuda.** Encontrado un intento previo sin
  commitear (worktree `feature-help-search`, murió a mitad de trabajo por rate limit): añadía
  navegación al tocar un resultado (`onOpenArticle`) y un live-region de accesibilidad anunciando
  el conteo de resultados — se conservó porque es trabajo correcto y completo, no a medias. El
  filtrado en sí (`searchHelp` en `app/lib/help-content.ts:490-504`) ya existía y ya estaba
  probado a nivel de contenido (`app/test/unit/help-content.spec.ts`); lo que faltaba era prueba
  de que el componente `HelpSearch`/`HelpScreen` realmente lo conecta al input. Coincidencia con
  la referencia: `creva_finance/frontend/components/help/HelpSearch.tsx` filtra en cada
  `onChangeText` (sin debounce) contra `title + question + answer + keywords`, resultado como
  `MenuRow href=...` (líneas 83-88); el puerto usa la misma función `searchHelp` (AND de términos,
  normaliza acentos/mayúsculas con `fold()`) y ahora los resultados son `Pressable` que navegan
  con `onOpenArticle`, igual que el `href` de la referencia. Estado vacío ya existía
  ("No encontramos nada con esas palabras."). Se corrigió `app/test/unit/help/structure.spec.ts`
  (buscaba el string literal `<HelpSearch>`, que dejó de existir al agregarse la prop
  `onOpenArticle`) y se agregó `app/test/unit/help/search.spec.ts` con render real de `HelpScreen`
  (palabra conocida filtra, gibberish muestra vacío, borrar restaura la lista, tocar un resultado
  llama a `onOpenArticle`). Se descubrió en el camino que `@testing-library/react-native@14` volvió
  `render` async — no documentado en ningún test existente del repo, ahora sí en este. Verify:
  `npm run typecheck` limpio; `npm test -- unit fuzz invariant` en 37 suites/161 tests (antes
  36/157), todo verde incluida `auth-gate.spec.ts` que fallaba de forma intermitente en el mismo
  arranque en frío. `npx expo export --platform ios` empaqueta limpio (1345 módulos, 4.2MB);
  dispositivo físico sigue pendiente por lo ya documentado (Expo Go no probado en hardware real).

- [x] `2026-09-05` — **Auditoría de citación del set de iconos (`app/features/shared/icons/Icon.tsx`)
  y corrección de estado activo del nav.** Worktree `feature-icon-audit`. Un intento previo (con
  rate limit) ya había confirmado que la señal de estado activo del nav en creva_finance vive en
  `frontend/app/globals.css:176-199` (`.cr-nav-item` → `[aria-current='page']`): borde superior
  `3px solid transparent → var(--cr-crimson)`, `font-weight 600 → 800`, y el icono mismo cambia
  fill/stroke (no solo color). Este bloque completa la auditoría línea-por-línea contra
  `creva_finance/frontend` y corrige lo que encontró.

  **Bugs de citación encontrados y corregidos** (path exacto copiado del archivo:línea citado, sin
  redondear ni aproximar):
  - `eye` / `eye-off`: paths inventados → copiados exactos de
    `components/auth/PasswordField.tsx:46-47` y `:43`.
  - `search` / `close`: paths inventados → copiados exactos de
    `components/help/HelpSearch.tsx:31-32` y `:67`.
  - `movements`: compartía el glyph de documento de `statement` → ahora usa las flechas de
    intercambio exactas de `BottomNav.tsx:87` (`NAV_GLYPHS['/movements']`), un glyph distinto.
  - `stub-topics.ts` — `business-verification` usaba el icono `registry` (edificio) y `regulatory`
    usaba `seal` (sello circular): estaban **cruzados** respecto a `BottomNav.tsx:91-92`
    (`/business-verification` es el sello, `/regulatory` es el edificio) → corregidos.
  - `report` (stub "Tu reporte"): usaba `seal`, una forma completamente distinta → nuevo caso
    `report` con el path exacto de `BottomNav.tsx:93` (documento + círculo, no líneas ni cinta).
  - `shield`: el caso combinaba `shield`+`privacy` en un solo candado-sobre-rect, pero
    `HelpGlyph.tsx:49-54` define `shield` como el escudo-con-check (mismo glyph que `collateral`,
    `BottomNav.tsx:90`) — se separaron en dos casos: `shield` (check) y `privacy` (candado,
    `BottomNav.tsx:97`).
  - `ProfileScreen.tsx` fila "Seguridad": usaba `shield` (candado) pero
    `app/profile/page.tsx:43-49` tiene su propio escudo-outline sin check ni candado → nuevo icono
    `security` con ese path exacto.
  - `ProfileScreen.tsx` fila "Información fiscal": usaba `statement` (documento con líneas) pero
    `app/profile/page.tsx:33-40` usa un documento de esquina doblada sin líneas → nuevo icono
    `fiscal` con ese path exacto.

  **Sin cambio (ya citaban exacto):** `home`, `score`, `card`, `credit`, `more`, `bell` (todos
  `BottomNav.tsx`, tabs principales), `profile` (`BottomNav.tsx:94`), `statement`
  (`NAV_GLYPHS['/statements']`, `BottomNav.tsx:89`), `key`/`seal`/`registry`/`shield` (post-fix)
  (`HelpGlyph.tsx`), `back-chevron` (`components/BackControl.tsx:20-29`), `collateral`
  (`BottomNav.tsx:90`), `calculator` (`NAV_GLYPHS['/calculator']`, `BottomNav.tsx:88`).

  **Sin referencia en creva_finance (documentado, no inventado):** `logout` en
  `ProfileScreen.tsx:107` sí tiene contraparte — el botón "Cerrar sesión" de
  `app/profile/page.tsx:123-132` (path+polyline+line consolidados en un solo `<Path>` equivalente,
  ya coincidía). Ningún icono del set quedó sin cita tras esta pasada.

  **Fix de estado activo del nav** (`app/App.tsx`, `TabBar`): antes solo cambiaba el color del
  texto/icono. Ahora reproduce las tres señales de `globals.css:176-199`: `filled={active}` en el
  `<Icon>` (fill/stroke, igual que las funciones `icon(active)` de `BottomNav.tsx`), peso de texto
  `font-semibold → font-extrabold` (600→800), y borde superior `border-t-[3px]`
  `border-transparent → border-crimson` (indicador de canto).

  **Verify:**
  - `npm run typecheck` — limpio (0 errores).
  - `npm test -- unit fuzz invariant` — **37 suites / 165 tests**, todos verdes (baseline previo:
    36 suites / 157 tests; +1 suite `test/unit/icons/citation.spec.ts` con 8 tests nuevos que
    fijan los paths corregidos, +2 asserts nuevos en `test/unit/nav/structure.spec.ts` para el fix
    de estado activo). Un test de `test/unit/auth/auth-gate.spec.ts` había fallado en una corrida
    junto a `nav/structure.spec.ts` antes del fix de ese archivo — confirmado no relacionado
    (pasa solo, y sigue pasando en la corrida completa post-fix): flake de orden/act(), no
    regresión de este cambio.
  - `grep -rn "#[0-9A-Fa-f]\{3,6\}" app/features/` — vacío.
  - `npx expo start --port 8098` + `curl .../index.bundle?platform=ios&dev=true` → HTTP 200,
    log del bundler: `iOS Bundled 16192ms index.ts (1516 modules)`, `hasError: false`. Sin
    dispositivo físico disponible (pendiente, igual que el resto del port — ver `docs/memoria.md`).
    Puerto 8098 liberado y confirmado con `netstat` tras `taskkill` tras la verificación.

  Archivos tocados: `app/features/shared/icons/Icon.tsx`, `app/features/more/stub-topics.ts`,
  `app/features/profile/ProfileScreen.tsx`, `app/App.tsx`, `app/test/unit/nav/structure.spec.ts`,
  `app/test/unit/icons/citation.spec.ts` (nuevo).

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
