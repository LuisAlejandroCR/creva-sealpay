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

- [ ] **Repo público creado, pero no cumple el criterio de aceptación todavía.**
  `2026-09-04` — repo creado en https://github.com/LuisAlejandroCR/creva-sealpay, pero con **todo**
  el contenido de esta carpeta privada pusheado tal cual (`AGENTS.md`, `docs/` completo,
  `brainstorming.md`, `LEARNINGS.md`), no solo `docs/plan.md`. Decisión escogida el
  mismo día: exposición intencional, "para dar contexto a los agentes" — no es un accidente a
  revertir. Revisado por secretos: limpio, ningún valor de key/token expuesto (ver
  `docs/memoria.md`). Pendiente real: `README.md` público sigue siendo el README de esta carpeta
  privada (habla de "Preparation lives here", termina con un encabezado `# creva-sealpay` suelto) —
  no cumple la mezcla 70/30 cara al usuario / cara al desarrollador que pide `AGENTS.md` §Idioma.
  Criterio de aceptación pendiente: `README.md` público reescrito para describir el producto de
  submission, no esta carpeta de preparación.
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
  archivos de la lista viven en el repo nuevo y su suite de tests pasa ahí.
- [ ] **Haptics con `expo-haptics`.** `2026-09-04` — decisión escogida. Tres puntos:
  `ImpactFeedbackStyle.Medium` en el botón de pago, `NotificationFeedbackType.Success` cuando el 402
  liquida y llega el reporte firmado, `NotificationFeedbackType.Error` en verificación de sello
  inválida — el veredicto del sello es el producto, y el haptic lo entrega antes de que se lea el
  texto. Criterio de aceptación: los tres estados se sienten en un dispositivo real vía Expo Go, no
  solo en simulador.
- [ ] **Publicación en App Store / Play Store — después del evento, no durante.** `2026-09-04`
  Decisión escogida, respaldada: la revisión de iOS puede consumir sola la ventana que queda
  (judging el 09/14, corte el 09/16). Durante el evento se demuestra con Expo Go + el video.
  Criterio de aceptación: `eas submit` corrido después del 2026-09-16; no bloquea la entrega.
- [ ] **Dos roles nuevos definidos: Auditor y Solver.** `2026-09-04` — `AGENTS.md` §Roles
  especiales. Solver reconcilia las 4 ramas paralelas (worktree `integration-solver`), corre
  primero. Auditor —**siempre agente en la nube, nunca local**— es la única excepción a "nadie
  pushea a `main`" de todo el documento: verifica 4 condiciones él mismo (VERIFY real, `POSEES`
  respetado, docs actualizados, sin `Co-Authored-By:`) y solo mergea/pushea si las cuatro se
  cumplen; si alguna falla, no mergea y reporta. Prompts 5 (Solver) y 6 (Auditor) redactados,
  sin ejecutar todavía — dependen de que los 4 worktrees paralelos (bloque de arriba) terminen
  primero.
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
  que el Auditor mergee cualquier `feature-*`. **Cumplido el 2026-09-04** — mergeado a `main` vía
  PR #1 (`9ae8452`), ejecutado por un humano tras descubrirse que ninguna de las sesiones 0/5/6
  era en realidad un agente en la nube (todas locales) y por lo tanto ninguna tenía autoridad real
  de push a `main` bajo la regla de `AGENTS.md` §Colaboración punto 6.
- [ ] **Estructura de tests obligatoria: `unit` + `fuzz` + `invariant`.** `2026-09-04` — decisión
  escogida, aplicada en `AGENTS.md` §Tests. Convención heredada de
  `creva_finance/backend/test/{unit,fuzz,invariant}` (Jest + `fast-check`), replicada en
  `gateway/test/` y `app/test/`. Relayado a los 4 agentes de worktree activos (1-4) con un target
  concreto de fuzz/invariant por área. Pendiente: agentes 1 y 2 ya habían pusheado antes de este
  mensaje — necesitan un commit de seguimiento, no reescribir el suyo. Criterio de aceptación:
  cada rama `feature-*` tiene las tres carpetas con al menos un archivo antes de que el Auditor
  la mergee.
- [ ] **`feature-agent-loop` con base rota — necesita rebase.** `2026-09-04` — su worktree local
  quedó en el commit `b70dace` (uno de docs, previo a que el scaffold real `f8b751d` existiera),
  con un `app/` propio sin trackear en vez del scaffold real. Diverge de `feature-gateway-x402` y
  `feature-selfie-check`, que sí parten de `f8b751d` — riesgo de conflicto grande al integrar.
  Corrección: `git status --short` primero para ver qué hay en ese `app/` sin trackear (no
  descartarlo a ciegas), `git stash -u` si hay algo que vale la pena conservar, después
  `git rebase scaffold-monorepo`, reaplicar el stash y resolver a mano. Criterio de aceptación:
  `feature-agent-loop` contiene el commit `f8b751d` en su historia antes de seguir trabajando ahí.
- [ ] **Riesgo Expo Go: módulo nativo no soportado.** En cuanto haga falta un módulo nativo que
  Expo Go no trae, hay que pasar a **Dev Client** (`eas build --profile development`). Mitigación:
  medio día presupuestado para eso, y descubrirlo temprano — no el 09/13. Criterio de aceptación:
  probado en Expo Go que Selfie Check (WebView), deep link a World App y `expo-haptics` funcionan
  sin Dev Client, antes del día 3.
- [ ] **Guion y grabación del video demo.** Debe caber en 3 minutos (el límite más estricto, el
  Q&A en vivo del 09/14) y servir también para el rango de 2–5 min que piden los patrocinadores
  (`brainstorming.md` §9.6). Criterio de aceptación: guion escrito, cronometrado, y video grabado
  antes del corte del evento (16 sep 2026).

- [ ] **`codegraph` no instalado — no aplica todavía.** No hay Go ni un repo de código real que
  indexar (esta carpeta tiene 6 `.md`, sin repo público). Su propia regla ("Cuándo no",
  `procedures/00_Files/codegraph.md`) dice que un repo de menos de ~20 archivos no compensa
  indexarlo. Revisar `codegraph init` recién exista el repo público con código.
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
- [x] `2026-09-04` — **Scaffold del repo público (bloque 0), rama `scaffold-monorepo`, agente
  local, sin commitear.** `app/` (Expo SDK 57 + TypeScript + NativeWind 4, `App.tsx` con clases
  Tailwind probadas) y `gateway/` (Node + TypeScript + Express, `GET /health`) creados. Ambos con
  `.env.example` (valores placeholder), `typecheck` verde, y servidor levantado y probado por HTTP
  (`curl /health` → `{"status":"ok"}`; Metro bundleó `index.ts` sin error, bundle iOS devolvió
  200) — detalle completo en `docs/memoria.md` 2026-09-04. **⏳ pendiente dentro de este mismo
  bloque:** prueba real en dispositivo físico vía Expo Go — esta sesión solo verificó que Metro
  bundlea y sirve por HTTP, sin emulador ni dispositivo disponible. Comando de commit dejado listo
  para el humano, no ejecutado (regla de agente local, `AGENTS.md` §Colaboración punto 6).

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en
   `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo — revisar contra `git status` del repo
   de submission una vez exista.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
