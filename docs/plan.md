<!-- docs/plan.md: bloques de trabajo con criterio de aceptación, abiertos vs cerrados, para la
     preparación de ETHOnline 2026. No es la bitácora (docs/memoria.md tiene el qué-se-hizo/qué-no-
     se-verificó) ni el brainstorming (brainstorming.md tiene el análisis; aquí solo el checklist
     accionable). Se actualiza en el mismo lote que cualquier cambio de estado. -->

# Plan — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Última actualización:** 2026-09-06

Ver [`brainstorming.md`](../brainstorming.md) §8 y §9 para el análisis completo detrás de cada
bloque. Esta tabla es solo el checklist.

## Abiertos

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
  BlockyDevs o Bazantic), grabada como evidencia.

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
- [ ] **Pantalla de query pagada + reporte sellado: falta prueba contra gateway/facilitador real.**
  `2026-09-04` — `app/features/query/**` y `app/features/verify/**` construidos: ciclo
  402→pago→200 contra un cliente de gateway mockeado, pantalla de reporte sellado con los cinco
  veredictos y qué NO certifica (`brainstorming.md` §0.2). **Actualización 2026-09-06:** el shape
  del mock ya fue reconciliado por el Solver contra los tipos reales del gateway y vive en `main`.
  Pendiente real: ejercerlo contra un gateway corriendo con facilitador vivo y probar haptics en
  dispositivo físico. Detalle en `docs/memoria.md` 2026-09-04 y 2026-09-06.
- [ ] **Publicación en App Store / Play Store — después del evento, no durante.** `2026-09-04`
  Decisión escogida, respaldada: la revisión de iOS puede consumir sola la ventana que queda
  (judging el 09/14, corte el 09/16). Durante el evento se demuestra con Expo Go + el video.
  Criterio de aceptación: `eas submit` corrido después del 2026-09-16; no bloquea la entrega.
- [ ] **Tests de `feature-agent-loop` sin mover a la convención `test/{unit,fuzz,invariant}`.**
  `2026-09-04` — quedaron en `app/features/query/__tests__/` y `app/features/verify/__tests__/`
  en vez de `app/test/unit/**`, a diferencia de `feature-selfie-check` y `feature-logic-port` que
  sí siguen la convención de `AGENTS.md` §Tests. El `jest.config.js` unificado por el Solver los
  sigue corriendo igual (`testMatch` ampliado, ver `docs/memoria.md` 2026-09-04), así que no
  bloquea nada hoy — pero es deuda de convención, no de funcionalidad. Criterio de aceptación:
  movidos a `app/test/{unit,fuzz,invariant}/query|verify/` y `testMatch` recortado de vuelta a
  solo esa carpeta.
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
  antes del corte del evento (16 sep 2026).

- [ ] **Evaluar `codegraph` para el repo público.** Ya hay repo de código real con `app/` y
  `gateway/`, así que la razón anterior para no indexar dejó de aplicar. Criterio de aceptación:
  decidir si se instala/indexa para esta fase del hackathon o marcarlo como no necesario con el
  repo actual.
- [ ] **Instalar el CLI de Codex, si se va a usar.** No está instalado en esta máquina. `engram
  setup codex` ya dejó la config MCP y los archivos de instrucciones listos en
  `%APPDATA%\codex\` — falta el plugin/hooks, que requiere el CLI real. Comando de instalación
  manual anotado en `docs/memoria.md` 2026-09-04.

## Cerrados

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
- [x] `2026-09-06` — **README público reescrito para Creva SealPay.** Ya no describe la carpeta de
  preparación privada: explica `app/`, `gateway/`, verificación actual y pendientes reales. Inglés
  solo aquí; el resto de `.md` sigue en español.
- [x] `2026-09-06` — **Decisión pública de docs mantenida.** El repo ya publica `AGENTS.md`,
  `docs/`, `brainstorming.md` y `LEARNINGS.md` como artefacto SDD. Límite: lógica privada de Creva,
  fórmulas, credenciales e infraestructura interna siguen fuera del repo público.
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
  **Actualización 2026-09-06:** la integración de `@clerk/clerk-expo` y el merge a `main` ya viven
  en el árbol integrado. Pendiente real: prueba con credenciales y dispositivo.
- [x] `2026-09-04` — **Roles Solver/Auditor definidos y primera tanda reconciliada.** El Solver
  integró las cuatro ramas `feature-*`, corrigió 7 gaps, ensambló `App.tsx`, unificó Jest y pusheó
  a `main`. VERIFY documentado: `app/` 16 suites/100 tests; `gateway/` 3 suites/9 tests.
- [x] `2026-09-04` — **Dispatch paralelo corregido por integración.** El problema de haber lanzado
  prompts casi a la vez quedó absorbido por el Solver: `scaffold-monorepo` y las ramas `feature-*`
  relevantes ya están integradas en `main`.
- [x] `2026-09-04` — **Estructura `unit` + `fuzz` + `invariant` aplicada al árbol integrado.**
  `app/test/` y `gateway/test/` existen con los tres tipos. La deuda de convención de
  `features/**/__tests__` queda en su bloque abierto.
- [x] `2026-09-04` — **Prompts de subagente ejecutados y absorbidos.** Los bloques de scaffold,
  gateway, Selfie Check, lógica de cliente, loop del agente y Solver ya produjeron código en
  `main`; los pendientes se rastrean por capacidad no verificada.

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en
   `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo — revisar contra `git status` del repo
   de submission una vez exista.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
