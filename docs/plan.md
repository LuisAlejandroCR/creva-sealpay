<!-- docs/plan.md: bloques de trabajo con criterio de aceptación, abiertos vs cerrados, para la
     preparación de ETHOnline 2026. No es la bitácora (docs/memoria.md tiene el qué-se-hizo/qué-no-
     se-verificó) ni el brainstorming (brainstorming.md tiene el análisis; aquí solo el checklist
     accionable). Se actualiza en el mismo lote que cualquier cambio de estado. -->

# Plan — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Última actualización:** 2026-09-04

Ver [`brainstorming.md`](../brainstorming.md) §8 y §9 para el análisis completo detrás de cada
bloque. Esta tabla es solo el checklist.

## Abiertos

- [ ] **Corrección — dos commits de merge en `main` con mensaje multi-línea, viola regla de
  cabecera de commits.** `2026-09-04` — auditoría post-merge de `integration-solver` (rol
  Auditor, condición 4). `main` en `9cda6ac` tiene dos commits de merge con cuerpo multi-línea
  generado automáticamente por Git al resolver conflictos: `931b4dfc` ("Merge remote-tracking
  branch 'origin/feature-logic-port' into integration-solver" + `# Conflicts: app/package-lock.json,
  app/package.json, app/tsconfig.json, docs/memoria.md`) y `2d73650` ("Merge remote-tracking
  branch 'origin/main' into integration-solver" + `# Conflicts: docs/plan.md`). Ningún trailer
  `Co-Authored-By` encontrado — eso sí pasa. No se deshace el merge (regla del rol Auditor v2):
  esto es deuda de higiene de commits, no un problema funcional — VERIFY (tsc/eslint/jest/vitest
  en `app/` y `gateway/`, todo verde, re-corrido por el Auditor) y POSEES (diff de 59 archivos,
  todos dentro del alcance de las 4 ramas + trabajo de reconciliación del Solver) pasaron limpio.
  Criterio de aceptación: el próximo agente que toque `git merge` en este repo evita el mensaje
  por defecto de Git en merges con conflicto (`git commit` explícito de una sola línea después de
  resolver, en vez de aceptar el template). No aplica a estos dos commits ya en `main` — quedan
  como está, documentados aquí.

- [ ] **Gateway x402/Hedera: falta pago real en testnet y conexión a un facilitador vivo.**
  `2026-09-04` — worktree `feature-gateway-x402`, agente local. `POST /creva-score/report` y
  `POST /creva-score/verify` quedaron gateados por HTTP 402 (`gateway/src/x402-gate.ts`),
  liquidando contra un facilitador vía HTTP (`gateway/src/facilitator.ts`, `FACILITATOR_URL`) y
  proxyando sin modificar a la API real de Creva (`gateway/src/creva-proxy.ts`). Tests unitarios
  cubren ambas rutas (402 sin pago, 402 rechazado, 200 con proxy) mockeando el facilitador — cero
  llamadas reales a Hedera. Pendiente: no hay facilitador vivo conectado (ni local ni Bazantic con
  credenciales reales), así que el criterio "una petición pagada real" que pide la pista de Hedera
  (`brainstorming.md` §9) sigue sin ejercerse. Ver `docs/memoria.md` para el detalle completo.
  Criterio de aceptación: una request real liquidada contra Hedera testnet (vía facilitador
  BlockyDevs o Bazantic), grabada como evidencia. **Actualización `2026-09-04`, worktree
  `feature-hedera-facilitator`:** el cliente del facilitador ya habla con el formato vivo de
  BlockyDevs testnet (`https://api.testnet.blocky402.com`, `x402Version: 2`, `hedera:testnet`,
  `amount`, `extra.feePayer=0.0.7162784`) sin cambiar la interfaz pública de `x402-gate.ts`; la
  prueba real sigue pendiente porque no hay `.env` con llave pagadora ni gateway/JWT de Bazantic
  creado en este worktree. No hay tx hash todavía. **Actualización `2026-09-04` (rol Auditor):**
  agente 13 (`feature-hedera-facilitator`, prueba de pago real) reportó el bloqueo exacto —
  ninguna parte del repo construía ni firmaba un `X-PAYMENT` real, `PaymentPayload` era solo
  `unknown`, y no había SDK de Hedera instalado. Añadido `gateway/src/hedera-signer.ts`
  (`@hashgraph/sdk`, `buildSignedPaymentHeader`): arma y firma una `TransferTransaction` real en
  HBAR desde `HEDERA_PAYER_ACCOUNT_ID`/`HEDERA_PAYER_PRIVATE_KEY` (nunca leídas ni logueadas por
  este agente), codificada como el payload `{x402Version, scheme: "exact", network, payload:
  {transaction}}` — `PaymentPayload` en `types.ts` ya tipa esta forma en vez de `unknown`. Test
  unitario (`gateway/test/unit/hedera-signer.spec.ts`) firma con una llave de prueba generada al
  vuelo — freeze/sign no toca la red, así que sigue siendo rápido. `tsc`/`eslint`/`vitest` en
  verde (5 suites, 13 tests, `--cache=false` por el mismo `EPERM` de Vite ya documentado arriba).
  Sigue pendiente, y sigue siendo bloqueo real, no de este cambio: nadie ha corrido esto contra el
  facilitador vivo con credenciales pagadoras de verdad — eso requiere que un humano provea
  `HEDERA_PAYER_ACCOUNT_ID`/`HEDERA_PAYER_PRIVATE_KEY` con HBAR de testnet y ejecute la request,
  guardando el tx hash / link de HashScan como evidencia.

- [x] **Repo público creado, README público reescrito.**
  `2026-09-04` — repo creado en https://github.com/LuisAlejandroCR/creva-sealpay, con **todo**
  el contenido de esta carpeta privada pusheado tal cual (`AGENTS.md`, `docs/` completo,
  `brainstorming.md`, `LEARNINGS.md`), no solo `docs/plan.md`. Decisión escogida el
  mismo día: exposición intencional, "para dar contexto a los agentes" — no es un accidente a
  revertir. Revisado por secretos: limpio, ningún valor de key/token expuesto (ver
  `docs/memoria.md`). `README.md` público reescrito en el worktree `feature-public-readme`
  (rama `feature-public-readme` sobre `main`, sin commitear todavía) para describir el producto
  de submission — onboarding con Selfie Check, query pagada vía x402, verificación de reporte
  sellado — en vez de esta carpeta de preparación, con la mezcla 70/30 cara al usuario / cara al
  desarrollador que pide `AGENTS.md` §Idioma. Pendiente: mergear ese worktree a `main` y pushear.
- [ ] **Decidir qué parte de `docs/` se vuelve pública por la regla de SDD.** Superado en la
  práctica — ya se pusheó `docs/` completo el `2026-09-04` (ver bloque de arriba), no solo
  `docs/plan.md` como preveía este ítem. Queda abierto para decidir si eso se mantiene así o se
  poda luego; no hay decisión formal todavía, solo el hecho consumado.
- [ ] **Responder los dos check-ins de la semana del 09/07** en el hacker dashboard. Criterio de
  aceptación: ambos respondidos — el stake en ETH solo se devuelve si se responde y se entrega
  proyecto (`brainstorming.md` §9.4).
- [ ] **Asistir a las sesiones de feedback.** Martes 09/08 2–4 PM ET y jueves 09/10 9–11 AM ET.
  Criterio de aceptación: al menos una sesión asistida.
- [x] `2026-09-04` — **Decisión: va con equipo humano + agentes de IA**, no solo. Composición
  exacta del equipo (¿Soho, Majo, Tam, Ale, Alejo — brainstorming.md §7 — todos confirman?)
  **sigue sin confirmarse en el dashboard de ETHGlobal** — cada integrante necesita stake propio.
  Bloque de dashboard reabierto abajo hasta que eso se confirme.
- [ ] **Confirmar en el dashboard de ETHGlobal quién entra al equipo, con stake propio cada
  quien.** Decisión de "equipo vs. solo" ya tomada (ver arriba); falta el trámite. Criterio de
  aceptación: cada integrante aparece en el dashboard con su stake pagado.
- [ ] **Reutilizar la capa de lógica de `creva_finance`, no la de UI.** `2026-09-04` — inventario
  hecho leyendo `creva_finance/frontend/`. Reutilizable casi tal cual (TS puro, sin DOM, ~1,100
  líneas): `lib/format-money.ts`, `format-date.ts`, `format-percent.ts`, `mx-states.ts`,
  `report-verdicts.ts`, `report-display.ts`, `score-display.ts`, `reminders.ts`, `help-content.ts`.
  Se porta con dos cambios: `lib/api.ts` (752 líneas, ya tipa las 46 rutas) — `NEXT_PUBLIC_API_URL`
  → `EXPO_PUBLIC_API_URL`, y el acceso al global `window.Clerk` → `@clerk/clerk-expo`. Se reescribe:
  todo `components/` y `app/` (JSX de Next con `div` + Tailwind → `View`/`StyleSheet`), mitigado con
  **NativeWind** para conservar los nombres de clase de Tailwind. Criterio de aceptación: los
  archivos de la lista viven en el repo nuevo y su suite de tests pasa ahí. **Actualización
  `2026-09-04`: puerto commiteado (`feature-logic-port`, `8e48bb0`), mergeado en
  `integration-solver` — `app/lib/**` completo, tests en verde. Ver `docs/memoria.md` 2026-09-04
  (entrada del Solver) para el detalle de integración.**
- [ ] **Haptics con `expo-haptics`.** `2026-09-04` — decisión escogida. Tres puntos:
  `ImpactFeedbackStyle.Medium` en el botón de pago, `NotificationFeedbackType.Success` cuando el 402
  liquida y llega el reporte firmado, `NotificationFeedbackType.Error` en verificación de sello
  inválida — el veredicto del sello es el producto, y el haptic lo entrega antes de que se lea el
  texto. Criterio de aceptación: los tres estados se sienten en un dispositivo real vía Expo Go, no
  solo en simulador. **Actualizado 2026-09-04, worktree `feature-agent-loop`:** los tres puntos
  quedan escritos en código (`app/features/query/QueryScreen.tsx`,
  `app/features/verify/VerifyScreen.tsx`), `tsc --noEmit` y `jest` pasan. **⏳ pendiente real:**
  sentirlos en un dispositivo físico vía Expo Go — sin dispositivo disponible en esa sesión, no
  se cierra el bloque todavía. Ver `docs/memoria.md` 2026-09-04.
- [ ] **Pantalla de query pagada + reporte sellado (bloque 4, worktree `feature-agent-loop`).**
  `2026-09-04` — `app/features/query/**` y `app/features/verify/**` construidos: ciclo
  402→pago→200 contra un cliente de gateway mockeado (tipado, no el gateway real todavía — bloque
  1 sigue sin terminar), pantalla de reporte sellado con los cinco veredictos y qué NO certifica
  (`brainstorming.md` §0.2). Tests unitarios de ambos mocks pasan. Criterio de aceptación
  pendiente: reconciliar el shape del mock contra el gateway real cuando el bloque 1 termine (rol
  Solver), y probar los haptics en dispositivo físico. Detalle en `docs/memoria.md` 2026-09-04.
- [ ] **Publicación en App Store / Play Store — después del evento, no durante.** `2026-09-04`
  Decisión escogida, respaldada: la revisión de iOS puede consumir sola la ventana que queda
  (judging el 09/14, corte el 09/16). Durante el evento se demuestra con Expo Go + el video.
  Criterio de aceptación: `eas submit` corrido después del 2026-09-16; no bloquea la entrega.
- [ ] **Dos roles nuevos definidos: Auditor y Solver.** `2026-09-04` — `AGENTS.md` §Roles
  especiales. Solver reconcilia las 4 ramas paralelas (worktree `integration-solver`), corre
  primero. Auditor —**siempre agente en la nube, nunca local**— es la única excepción a "nadie
  pushea a `main`" de todo el documento: verifica 4 condiciones él mismo (VERIFY real, `POSEES`
  respetado, docs actualizados, sin `Co-Authored-By:`) y solo mergea/pushea si las cuatro se
  cumplen; si alguna falla, no mergea y reporta. **Actualización `2026-09-04`: Solver corrido,
  las 4 ramas mergeadas.** `feature-gateway-x402`, `feature-selfie-check`, `feature-agent-loop`
  y (después de que se pusheó, `8e48bb0`) `feature-logic-port` — todas mergeadas en
  `integration-solver`. 6 gaps de integración encontrados y fijados (shape del mock de gateway,
  `SessionSource` verificado sin cambios, dependencias de `app/package.json` en conflicto entre
  ramas, dependencias nativas de Clerk sin declarar, `tsconfig.json` unido, **dos configuraciones
  de Jest en conflicto** — `package.json` inline vs. `jest.config.js` de `feature-logic-port`,
  unificadas en un solo `jest.config.js`) — detalle completo en `docs/memoria.md` 2026-09-04
  (dos entradas, una por tanda de merges). `App.tsx` ensamblado con las 3 pantallas.
  `tsc`/`jest` (16 suites, 100 tests) / `vitest` en verde; `expo export` bundlea sin error.
  Sigue bloqueado: prueba en Expo Go real (sin dispositivo ni credenciales de Clerk/World en
  esta sesión). **Actualización `2026-09-04` (roles v2):** gap 7 cerrado —
  `gateway/test/` no tenía la estructura `unit`/`fuzz`/`invariant`, movido y completado (ver
  bloque "Estructura de tests obligatoria" abajo, cerrado para `gateway/`). VERIFY final:
  `app/` 16 suites/100 tests, `gateway/` 3 suites/9 tests, ambos `tsc`+`lint` limpios, `expo
  export` bundlea. **Mergeado y pusheado a `main` por el Solver mismo**, bajo el modelo de roles
  v2 (`AGENTS.md` §Colaboración) — sin esperar Auditor. El Auditor revisa después, no antes; ver
  `docs/memoria.md` 2026-09-04 (entrada "Solver (roles v2)") para el detalle completo y para la
  nota sobre los `git commit` que el Solver corrió para completar merges con conflicto real.
- [ ] **Corrección de orden de dispatch — los 6 prompts se lanzaron casi a la vez, no en
  cascada.** `2026-09-04` — el plan original decía "0 corre y mergea a `main`, después 1-4 en
  paralelo, después 5, después 6". En la práctica se dispararon casi todos juntos:
  `scaffold-monorepo` existe en `origin` pero **no mergeado a `main`** (`git branch -r` confirma
  solo `origin/main` y `origin/scaffold-monorepo`, ningún `feature-*` todavía). Consecuencia
  observada:
  - Agente 3 (`feature-logic-port`) preguntó su base al no encontrar `app/` en `main` — se
    confirmó basar en `scaffold-monorepo`, no en `main` (correcto: `main` no tiene código todavía).
  - Agente 5 (Solver) arrancó sin que existiera ninguna de las 4 ramas `feature-*` — se le indicó
    **detenerse y esperar** a que existan y estén pusheadas antes de reconciliar nada.
  **Corrección para el resto de la tanda:** cualquier `feature-*` que arranque ahora debe basarse
  en `origin/scaffold-monorepo`, no en `main`. El Solver (prompt 5) y el Auditor (prompt 6) no
  arrancan hasta que las 4 ramas `feature-*` existan en `origin` con su `[REPORT]` completo.
  Criterio de aceptación: `scaffold-monorepo` mergeado a `main` (vía Auditor o humano) antes de
  que el Auditor mergee cualquier `feature-*`.
- [ ] **Estructura de tests obligatoria: `unit` + `fuzz` + `invariant`.** `2026-09-04` — decisión
  escogida, aplicada en `AGENTS.md` §Tests. Convención heredada de
  `creva_finance/backend/test/{unit,fuzz,invariant}` (Jest + `fast-check`), replicada en
  `gateway/test/` y `app/test/`. Relayado a los 4 agentes de worktree activos (1-4) con un target
  concreto de fuzz/invariant por área. Pendiente: agentes 1 y 2 ya habían pusheado antes de este
  mensaje — necesitan un commit de seguimiento, no reescribir el suyo. Criterio de aceptación:
  cada rama `feature-*` tiene las tres carpetas con al menos un archivo antes de que el Auditor
  la mergee. **`feature-logic-port` cumplido** — `app/test/{unit,fuzz,invariant}` con 11 suites,
  `npm test -- unit fuzz invariant` verde (detalle en el bloque cerrado de arriba y en
  `docs/memoria.md`). **`gateway/` (rama 1) cumplido por el Solver `2026-09-04`** — no lo tenía
  al pushear, cerrado en el merge a `integration-solver`/`main`:
  `gateway/test/{unit,fuzz,invariant}`, 3 suites / 9 tests, `fast-check` agregado. `feature-selfie-
  check` (rama 2) y `feature-agent-loop` (rama 4) sin verificar desde esta sesión — ver bloque
  siguiente para el caso puntual de `feature-agent-loop`.
- [ ] **`feature-agent-loop` con base rota — necesita rebase.** `2026-09-04` — su worktree local
  quedó en el commit `b70dace` (uno de docs, previo a que el scaffold real `f8b751d` existiera),
  con un `app/` propio sin trackear en vez del scaffold real. Diverge de `feature-gateway-x402` y
  `feature-selfie-check`, que sí parten de `f8b751d` — riesgo de conflicto grande al integrar.
  Corrección: `git status --short` primero para ver qué hay en ese `app/` sin trackear (no
  descartarlo a ciegas), `git stash -u` si hay algo que vale la pena conservar, después
  `git rebase scaffold-monorepo`, reaplicar el stash y resolver a mano. Criterio de aceptación:
  `feature-agent-loop` contiene el commit `f8b751d` en su historia antes de seguir trabajando ahí.
- [ ] **5 prompts de subagente redactados y listos para dispatch.** `2026-09-04` — 0)
  scaffold monorepo (secuencial, bloqueante), 1) gateway x402+Hedera, 2) Selfie Check onboarding,
  3) port de lógica de `creva_finance`, 4) loop del agente + haptics. Los 4 últimos son worktrees
  paralelos, dentro del máximo de `AGENTS.md` §Colaboración punto 5. Prompts completos en la
  bitácora de conversación — pendiente: nadie los ha ejecutado todavía. Criterio de aceptación:
  bloque 0 corrido y mergeado a `main` antes de dispatch de 1-4.
- [ ] **Selfie Check en el alta (rebanada §6, paso 1) — implementado, falta probar en
  dispositivo real.** `2026-09-04` — worktree `feature-selfie-check`. `app/features/onboarding/`
  (flujo `WebView` contra `id.worldcoin.org/verify`, degrada a `identity_unavailable` sin
  `EXPO_PUBLIC_WORLD_APP_ID`) y `app/features/auth/` (`session-source.ts` con la forma
  `SessionSource` de `creva_finance/frontend/lib/api.ts:17-25`, `ClerkAppProvider.tsx`).
  `npm run typecheck` y `npm test -- onboarding` pasan. Criterio de aceptación pendiente:
  probarlo en Expo Go real (no hay dispositivo en esta sesión), montar `ClerkAppProvider` +
  `SelfieCheckScreen` en `App.tsx` (paso de integración, no de este bloque), y ejercer el
  Sandbox real de World en vez de solo la forma de la URL. Detalle completo en
  `docs/memoria.md` 2026-09-04. **Actualización:** `unit`+`fuzz`+`invariant` agregados por
  `AGENTS.md` §Tests (`app/test/{unit,fuzz,invariant}/onboarding/`), `npm test -- unit fuzz
  invariant` pasa (3 suites, 5 tests) — sigue faltando solo la prueba en Expo Go real.
- [ ] **Riesgo Expo Go: módulo nativo no soportado.** En cuanto haga falta un módulo nativo que
  Expo Go no trae, hay que pasar a **Dev Client** (`eas build --profile development`). Mitigación:
  medio día presupuestado para eso, y descubrirlo temprano — no el 09/13. Criterio de aceptación:
  probado en Expo Go que Selfie Check (WebView), deep link a World App y `expo-haptics` funcionan
  sin Dev Client, antes del día 3.
- [ ] **Guion y grabación del video demo.** Debe caber en 3 minutos (el límite más estricto, el
  Q&A en vivo del 09/14) y servir también para el rango de 2–5 min que piden los patrocinadores
  (`brainstorming.md` §9.6). Criterio de aceptación: guion escrito, cronometrado, y video grabado
  antes del corte del evento (16 sep 2026). **Guion escrito 2026-09-04** —
  [`docs/video-script.md`](video-script.md), armado con el framework Pitch Deck (jurado como quien
  decide, no la usuaria como cliente). Pendiente: cronometrar contra reloj real, verificar la
  sección 1:45–2:05 contra el estado real de Hedera el día de grabar (no overclaim de una tx que
  no exista todavía), y grabar.
- [ ] **`slides.html` — outline escrito, falta construir el artefacto.** `2026-09-04` —
  [`docs/slides-outline.md`](slides-outline.md), Pitch Deck de 10 slides, mapeado 1:1 contra
  `video-script.md` (misma fuente para cada cifra). Criterio de aceptación: `slides.html`
  construido a partir de este outline, cifras revisadas contra `docs/plan.md` el día de presentar.

- [ ] **`codegraph` no instalado — no aplica todavía.** No hay Go ni un repo de código real que
  indexar (esta carpeta tiene 6 `.md`, sin repo público). Su propia regla ("Cuándo no",
  `procedures/00_Files/codegraph.md`) dice que un repo de menos de ~20 archivos no compensa
  indexarlo. Revisar `codegraph init` recién exista el repo público con código.
- [ ] **Instalar el CLI de Codex, si se va a usar.** No está instalado en esta máquina. `engram
  setup codex` ya dejó la config MCP y los archivos de instrucciones listos en
  `%APPDATA%\codex\` — falta el plugin/hooks, que requiere el CLI real. Comando de instalación
  manual anotado en `docs/memoria.md` 2026-09-04.

## Cerrados

- [x] `2026-09-04` — **Tests de `feature-agent-loop` movidos a la convención `app/test/{unit,fuzz,invariant}`.**
  Los tests legacy de `app/features/query/__tests__/` y `app/features/verify/__tests__/` quedaron
  movidos a `app/test/unit/query/` y `app/test/unit/verify/`; no queda ningún test bajo
  `app/features/**/__tests__/`. Se agregaron suites `fuzz` e `invariant` para query y verify:
  query nunca entrega un reporte pagado sin el challenge x402 previo; verify rechaza como inválido
  un reporte cuyo folio fue eliminado después de obtenerse. `app/jest.config.js` volvió a mirar
  solo `app/test/{unit,fuzz,invariant}`. VERIFY: `npm run typecheck` limpio y
  `npm test -- unit fuzz invariant` → 20 suites / 104 tests, todos pasan; antes del movimiento el
  estado documentado era 16 suites / 100 tests.

- [x] `2026-09-01` — Aplicación a Continuity enviada, con ENS incluido.
- [x] `2026-09-03` — Stake de 0.025 ETH pagado.
- [x] `2026-09-01` — Spec OpenAPI pública desplegada (`/api/docs`, `/api/docs-json`).
- [x] `2026-09-04` — Reglas de finalista, checkpoints y regla de SDD del kickoff, incorporadas a
  `brainstorming.md` §9.
- [x] `2026-09-04` — `engram` v1.20.0 instalado (binario Windows, checksum verificado) y wireado
  como plugin MCP de Claude Code.
- [x] `2026-09-04` — Decisión: "start from scratch" no aplica a Continuity — ver `LEARNINGS.md` §3
  y `brainstorming.md` §9.2. Decisión del equipo, no confirmación de ETHGlobal.
- [x] `2026-09-04` — `README.md` de esta carpeta traducido a inglés — es el único `.md` en inglés
  del proyecto (`AGENTS.md` §Idioma).
- [x] `2026-09-04` — Mapa de estado y hoja de ruta publicado con `archify`:
  [`docs/estado.html`](estado.html) (fuente en [`docs/estado.lifecycle.json`](estado.lifecycle.json)).
- [x] `2026-09-04` — Acceso a Bazantic confirmado. Crédito de prueba ~0.30 USDC por gateway;
  bypass de x402/MPP vía JWT o métodos en $0.00 para desarrollo — ver `brainstorming.md` §8.
- [x] `2026-09-04` — `engram` wireado para **opencode** (plugin instalado, listo). Wireado para
  **Codex** solo en config MCP + instrucciones — el plugin/hooks queda como bloque abierto porque
  el CLI de Codex no está instalado aquí.
- [x] `2026-09-04` — **Scaffold del repo público (bloque 0), rama `scaffold-monorepo`, agente
  local, sin commitear.** `app/` (Expo SDK 57 + TypeScript + NativeWind 4, `App.tsx` con clases
  Tailwind probadas) y `gateway/` (Node + TypeScript + Express, `GET /health`) creados. Ambos con
  `.env.example` (valores placeholder), `typecheck` verde, y servidor levantado y probado por HTTP
  (`curl /health` → `{"status":"ok"}`; Metro bundleó `index.ts` sin error, bundle iOS devolvió
  200) — detalle completo en `docs/memoria.md` 2026-09-04. **⏳ pendiente dentro de este mismo
  bloque:** prueba real en dispositivo físico vía Expo Go — esta sesión solo verificó que Metro
  bundlea y sirve por HTTP, sin emulador ni dispositivo disponible. Comando de commit dejado listo
  para el humano, no ejecutado (regla de agente local, `AGENTS.md` §Colaboración punto 6).
- [x] `2026-09-04` — **Bloque 3: port de la capa de lógica de `creva_finance` a `app/lib/`, rama
  `feature-logic-port`, agente local.** Los 9 archivos puros portados byte a byte (verificado con
  `diff`); `lib/api.ts` (752 líneas, 46 rutas) portado con los dos cambios del encargo
  (`NEXT_PUBLIC_API_URL` → `EXPO_PUBLIC_API_URL`, fallback `window.Clerk` eliminado — no existe
  equivalente en `@clerk/clerk-expo`, confirmado contra su documentación). 9 suites de test
  portadas y adaptadas donde cubrían código que no existe en este repo (fallback de Clerk,
  `localStorage`, escaneo de `app/`+`components/`, rutas de Next App Router). `npm run typecheck`
  y `npm test -- lib` verdes: 85/85 tests, salida real en `docs/memoria.md`. Infra de test
  (`jest`+`ts-jest`) agregada porque el scaffold no la traía. **Actualizado en el mismo bloque**
  tras traer la regla de `AGENTS.md` §Tests (`unit`+`fuzz`+`invariant`, ver bloque de abajo):
  tests reestructurados a `app/test/{unit,fuzz,invariant}`, `fast-check` agregado,
  `no-stale-authorization-header.invariant.spec.ts` y `response-parsing.fuzz.spec.ts` escritos —
  el fuzz encontró y se corrigió un `TypeError` real en `lib/api.ts` (`body.message` sobre un
  cuerpo JSON `null`), detalle en `docs/memoria.md`. `npm test -- unit fuzz invariant` verde:
  11 suites, 88 tests. Comando de commit dejado listo para el humano, no ejecutado.
  **⏳ pendiente:** integración real de `@clerk/clerk-expo` (paquete + `AuthGuard` +
  `setSessionSource`) es de `app/features/**`, no de este bloque; merge de `scaffold-monorepo` a
  `main` sigue sin ocurrir, este branch se basó directo en `scaffold-monorepo`.

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en
   `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo — revisar contra `git status` del repo
   de submission una vez exista.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
