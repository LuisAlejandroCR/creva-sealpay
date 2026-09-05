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

- [ ] **Gateway x402/Hedera: falta una request real liquidada en testnet.** El cliente ya habla el
  formato vivo de BlockyDevs (`gateway/src/facilitator.ts`, `X402_VERSION=2`), pero falta `.env`
  con llave pagadora o JWT de Bazantic para ejercer un 402→settle→200 real y guardar el tx hash.
  Detalle: `docs/memoria.md` 2026-09-04 ("Gateway conectado al formato vivo de BlockyDevs").
  Criterio de aceptación: una request real liquidada contra Hedera testnet, con evidencia.

- [ ] **Decidir si `docs/` completo sigue público o se poda.** Ya se pusheó `docs/` entero al repo
  de submission (más allá de lo que exige la regla de SDD, que solo pide `docs/plan.md`) —
  decisión de hecho consumado, sin decisión formal sobre si se mantiene así.

- [ ] **Responder los dos check-ins de la semana del 09/07** en el hacker dashboard. El stake en
  ETH solo se devuelve si se responde y se entrega proyecto (`brainstorming.md` §9.4).

- [ ] **Asistir a las sesiones de feedback.** Martes 09/08 2–4 PM ET y jueves 09/10 9–11 AM ET.

- [ ] **Confirmar en el dashboard de ETHGlobal quién entra al equipo, con stake propio cada
  quien.** Decisión de "equipo vs. solo" ya tomada (Cerrados); falta el trámite individual.

- [ ] **Haptics (`expo-haptics`) — código completo, falta sentirlos en dispositivo real.** Los tres
  puntos (pago, reporte firmado, sello inválido) están escritos y verificados por `tsc`/`jest`
  (`app/features/query/QueryScreen.tsx`, `app/features/verify/VerifyScreen.tsx`). Sin dispositivo
  disponible todavía. Detalle: `docs/memoria.md` 2026-09-04.

- [ ] **Pantalla de query pagada + reporte sellado — falta prueba en dispositivo real.** El shape
  del mock ya se reconcilió contra el gateway real (Gap 1, Solver) y está mergeado a `main`.
  Pendiente real: probar los haptics y el flujo completo en Expo Go físico. Detalle:
  `docs/memoria.md` 2026-09-04.

- [ ] **Publicación en App Store / Play Store — después del evento, no durante.** Decisión
  escogida: la revisión de iOS consumiría la ventana que queda antes del judging (09/14, corte
  09/16). Durante el evento se demuestra con Expo Go + video. Criterio: `eas submit` corrido
  después del 2026-09-16.

- [ ] **Selfie Check en el alta — falta prueba en dispositivo real y Sandbox de World.** Código y
  tests (`unit`+`fuzz`+`invariant`) completos y en verde. Falta: probarlo en Expo Go físico,
  montar `ClerkAppProvider` + `SelfieCheckScreen` en `App.tsx` (ya hecho por el Solver, ver
  Cerrados), y ejercer el Sandbox real de World en vez de solo la forma de la URL. Detalle:
  `docs/memoria.md` 2026-09-04.

- [ ] **Riesgo Expo Go: módulo nativo no soportado.** En cuanto haga falta un módulo nativo que
  Expo Go no trae, hay que pasar a Dev Client (`eas build --profile development`). Mitigación:
  medio día presupuestado, descubrirlo temprano. Criterio de aceptación: confirmado en dispositivo
  real (no solo `expo export`) que Selfie Check (WebView), deep link a World App y `expo-haptics`
  funcionan sin Dev Client, antes del día 3.

- [ ] **Guion y grabación del video demo.** Debe caber en 3 minutos (límite del Q&A en vivo del
  09/14) y servir también para el rango 2–5 min de los patrocinadores (`brainstorming.md` §9.6).
  Criterio: guion escrito, cronometrado, video grabado antes del corte (16 sep 2026).

- [ ] **`codegraph` no instalado — no aplica todavía.** Repo de submission sigue por debajo del
  umbral que justifica indexarlo (`procedures/00_Files/codegraph.md`). Revisar cuando crezca.

- [ ] **Instalar el CLI de Codex, si se va a usar.** `engram setup codex` ya dejó config MCP e
  instrucciones listas en `%APPDATA%\codex\`; falta el CLI real para el plugin/hooks. Comando
  anotado en `docs/memoria.md` 2026-09-04.

## Cerrados

- [x] `2026-09-04` — **Roles v2 (Main/Solver/Auditor) definidos, implementados y en `main`.**
  Reemplaza el modelo v1 (Auditor único gate, agente en la nube exclusivo). Solver reconcilió las
  4 ramas paralelas y mergeó/pusheó a `main` él mismo bajo el nuevo modelo; 7 gaps de integración
  cerrados (shape del gateway mock, dependencias en conflicto, Jest unificado, estructura de tests
  del gateway). Detalle completo: `docs/memoria.md` 2026-09-04 (entradas "Solver (roles v2)" y
  las dos entradas de reconciliación).

- [x] `2026-09-04` — **`scaffold-monorepo` mergeado a `main`** (PR #1, commit `9ae8452`),
  corrigiendo el orden de dispatch fuera de cascada del bloque original de 6 prompts. `app/`
  (Expo+NativeWind) y `gateway/` (Node+Express) verificados con `tsc`, Metro bundle y `curl
  /health`. Detalle: `docs/memoria.md` 2026-09-04 ("Bloque 0" y "Dispatch salió de orden").

- [x] `2026-09-04` — **Estructura de tests `unit`+`fuzz`+`invariant` completa en `app/`,
  `gateway/` y `feature-agent-loop`.** Última pieza (tests de query/verify movidos desde
  `__tests__/` legacy) mergeada en `main` (`9881bfc`): 20 suites / 104 tests en `app/`, 3 suites /
  9 tests en `gateway/`. Detalle: `docs/memoria.md` 2026-09-04.

- [x] `2026-09-04` — **`feature-agent-loop` con base rota — corregida.** El worktree divergía de
  `f8b751d` (scaffold real); reconciliado durante el merge del Solver, confirmado por la
  integración final en `main` sin conflicto de scaffold.

- [x] `2026-09-04` — **Reutilizar la capa de lógica de `creva_finance` — portada y mergeada.**
  `app/lib/**` (9 archivos puros + `api.ts` de 46 rutas) portado, reestructurado a
  `unit`/`fuzz`/`invariant`, mergeado a `main` vía `feature-logic-port` (`8e48bb0`). Detalle:
  `docs/memoria.md` 2026-09-04.

- [x] `2026-09-04` — **5 prompts de subagente redactados y dispatchados** (scaffold, gateway
  x402+Hedera, Selfie Check, port de lógica, agent-loop+haptics) — las 4 ramas paralelas existen y
  están mergeadas (ver bloques de arriba).

- [x] `2026-09-04` — **Corrección de higiene de commits — documentada, no revertida.** Auditoría
  post-merge encontró dos commits de merge en `main` con mensaje multi-línea generado por Git
  (`931b4df`, `2d73650`). Sin `Co-Authored-By`, VERIFY y POSEES limpios — deuda de higiene, no
  funcional; queda como está. Regla para el futuro: `git commit` explícito de una línea al resolver
  conflictos de merge, no aceptar el template de Git. Detalle: `docs/memoria.md` 2026-09-04.

- [x] `2026-09-04` — **README público reescrito y mergeado a `main`** (`979f94d`), describiendo el
  producto de submission (onboarding Selfie Check, query pagada x402, verificación de sello) con
  la mezcla 70/30 de `AGENTS.md` §Idioma.

- [x] `2026-09-04` — **Repo público creado**, `docs/` completo pusheado — decisión escogida de
  exposición intencional, revisado sin secretos expuestos.

- [x] `2026-09-01` — Aplicación a Continuity enviada, con ENS incluido.
- [x] `2026-09-03` — Stake de 0.025 ETH pagado.
- [x] `2026-09-01` — Spec OpenAPI pública desplegada (`/api/docs`, `/api/docs-json`).
- [x] `2026-09-04` — Reglas de finalista, checkpoints y regla de SDD del kickoff, incorporadas a
  `brainstorming.md` §9.
- [x] `2026-09-04` — `engram` v1.20.0 instalado y wireado como plugin MCP de Claude Code (y para
  opencode); para Codex solo config MCP + instrucciones, CLI pendiente (ver Abiertos).
- [x] `2026-09-04` — Decisión: "start from scratch" no aplica a Continuity — ver `LEARNINGS.md` §3
  y `brainstorming.md` §9.2.
- [x] `2026-09-04` — `README.md` de esta carpeta traducido a inglés (único `.md` en inglés del
  proyecto).
- [x] `2026-09-04` — Mapa de estado publicado con `archify`: [`docs/estado.html`](estado.html).
- [x] `2026-09-04` — Acceso a Bazantic confirmado: crédito de prueba ~0.30 USDC por gateway.
- [x] `2026-09-04` — Decisión: equipo humano + agentes de IA, no solo — y orden scaffold primero,
  reparto de worktrees después.

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en
   `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo — revisar contra `git status` del repo
   de submission una vez exista.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
