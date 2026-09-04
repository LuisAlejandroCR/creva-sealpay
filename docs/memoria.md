<!-- docs/memoria.md: bitácora de enfoque técnico y qué-se-hizo/qué-no-se-verificó por sesión. No es
     el checklist (docs/plan.md tiene bloques abiertos/cerrados) ni el análisis (brainstorming.md
     tiene el porqué) — aquí solo el registro de lo que pasó, en orden cronológico. -->

# Memoria — ETHOnline 2026

## 2026-09-04 — Revisión del repo público recién creado

**Qué se hizo:**
- Repo público confirmado en https://github.com/LuisAlejandroCR/creva-sealpay, rama `main`,
  commit `244c36e "agents updated"`.
- Clonado y revisado: contiene el contenido completo de esta carpeta privada
  (`AGENTS.md`, `LEARNINGS.md`, `README.md`, `brainstorming.md`, `docs/` completo incluyendo
  `estado.html`, `estado.lifecycle.json`, capturas de `estado.visual-check.*`, `memoria.md`,
  `plan.md`). `.gitignore` de 4 bytes, sin exclusiones.
- Grep dirigido + un subagente de lectura completa sobre `brainstorming.md` buscando: valores de
  secretos, fórmulas de scoring, pesos, umbrales o reglas de clasificación de Creva (la lista
  explícita de `AGENTS.md` §Reglas del repositorio público que nunca debe salir).
- Resultado del grep de secretos: sin coincidencias de valores reales — solo nombres de variables
  de entorno (`CREVA_SIGNING_KEY`, `CROMA_API_KEY`, `BANXICO_SIE_TOKEN`,
  `CREVA_SIGNING_PUBLIC_KEY`) mencionados por nombre y longitud en bytes, nunca con su valor. `.env`
  no está en el repo.
- Resultado del subagente sobre fórmulas/pesos/umbrales: ninguno encontrado. Una línea borderline:
  `brainstorming.md` línea 136 — "`GET /score` devuelve banda, máximos y banda por factor; el
  cliente no inventa cortes" — describe la *forma* del modelo de score (bandas + máximos por
  factor) sin números concretos. Reportada al humano; decisión pendiente de si se redacta.

**Qué NO se verificó, y por qué:**
- No se revisó `LEARNINGS.md` ni `docs/estado.*` con el mismo detalle línea por línea que
  `brainstorming.md` — el pedido del humano fue específico a fórmulas/pesos en `brainstorming.md`.
  Si se quiere la misma pasada sobre esos archivos, es trabajo pendiente.
- No se decidió si la línea 136 de `brainstorming.md` se redacta o se deja — el humano no ha
  respondido esa pregunta todavía.
- No se verificó si algún archivo binario (los PNG de `estado.visual-check.*`) contiene datos
  sensibles en metadata — solo se revisó contenido de texto.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque "Repo público creado, pero no cumple el criterio de aceptación todavía"
  (README público con mezcla 70/30, no el README de esta carpeta privada).
- Decisión sobre la línea 136 de `brainstorming.md`: sin bloque propio todavía — anotar en
  `docs/plan.md` si el humano confirma que quiere redactarla.

## 2026-09-04 — Decisión: equipo humano + IA, y orden de arranque

**Qué se hizo:**
- Decisión tomada por el humano: el proyecto va con **equipo humano + agentes de IA**, no solo.
  Reflejado en `docs/plan.md` (bloque cerrado) y en `brainstorming.md` §8 (línea de "decisiones
  abiertas" actualizada).
- Decisión tomada por el humano sobre el orden de arranque: **scaffold primero, reparto de
  worktrees después** — no repartir los 4 pasos de la rebanada (`brainstorming.md` §6) en paralelo
  sobre un repo público que hoy solo tiene `.md`s, sin código. Nuevo bloque abierto en
  `docs/plan.md`.

**Qué NO se verificó, y por qué:**
- La composición exacta del equipo (nombres) no se confirmó — el humano dijo "equipo humano" sin
  listar quiénes. `brainstorming.md` §7 mencionaba candidatos (Soho, Majo, Tam, Ale, Alejo) de una
  sesión anterior, pero eso no es una confirmación de esta decisión, solo un candidato razonable a
  verificar.
- No se empezó el scaffold todavía — es el siguiente bloque abierto, no ejecutado en esta sesión.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque "Confirmar en el dashboard de ETHGlobal quién entra al equipo" (stake
  individual por persona).
- `docs/plan.md` — bloque "Scaffold del repo público antes de repartir worktrees" (siguiente paso
  accionable, sin empezar).

## 2026-09-04 — Spec OpenAPI de Creva revisada antes del scaffold

**Qué se hizo:**
- URL base del backend de Creva localizada en `creva_finance/frontend/.env.example`
  (`NEXT_PUBLIC_API_URL`) — no vivía en esta carpeta, no estaba en ningún `.md` de aquí.
- `GET /api/docs-json` descargado y leído completo: NestJS, 46 rutas, JWT Bearer en casi todas.
  Confirmado desde la fuente viva, no desde la cifra ya citada en `brainstorming.md` §8.
- Identificadas las dos rutas candidatas a quedar detrás de x402 (paso 2 de la rebanada,
  `brainstorming.md` §6): `POST /creva-score/report` (consulta de señales, paga) y
  `POST /creva-score/verify` (verificación del sello, hoy deliberadamente sin auth — es la que un
  tercero sin cuenta usa). Ninguna auth de World/Selfie Check existe todavía en `/auth/*`.

**Qué NO se verificó, y por qué:**
- Los DTOs de request/response salen vacíos en el spec (Nest no expone las formas de
  class-validator en `docs-json`) — falta leer los DTOs fuente en `creva_finance/backend/src/` o
  hacer una llamada real para conocer el payload exacto antes de integrar.
- No se probó ningún endpoint en vivo en esta sesión, solo se leyó el spec estático.

**Dónde queda el pendiente:**
- Bloque de scaffold en `docs/plan.md` — el stack del repo `creva-sealpay` todavía no está
  decidido; esta revisión es insumo para esa decisión, no la decisión en sí.

## 2026-09-04 — Stack decidido: React Native + Expo, con gateway aparte

**Qué se hizo:**
- Hallazgo que corrige un supuesto de las sesiones anteriores: **esta carpeta local ES el repo
  `creva-sealpay`** — `git remote -v` apunta a `https://github.com/LuisAlejandroCR/creva-sealpay.git`.
  No son dos carpetas (privada de preparación vs. repo público): es una sola, y todo commit aquí va
  a un repo público. Los `.md` anteriores lo describían como si fueran dos cosas separadas.
- Decisión del humano: la entrega es una **app móvil React Native + Expo**, publicable en App Store
  y Play Store **después** del evento; durante el hackathon se demuestra en **Expo Go**.
- Arquitectura recomendada y aceptada: **dos piezas**, app Expo + gateway Node en Cloud Run. La
  capa de pago no va en el dispositivo: `@hashgraph/sdk` en RN exige polyfills de crypto/streams,
  una llave privada en el bundle móvil es extraíble, y la pista de Hedera pide servicio x402 vivo
  **más** plataforma que lo consuma — la partición es el entregable, no gasto extra.
- Inventario de reutilización hecho leyendo `creva_finance/frontend/` (no asumido): ~1,100 líneas de
  TS puro se mueven casi tal cual, `lib/api.ts` (752 líneas, ya tipa las 46 rutas) se porta con dos
  cambios, y `components/`/`app/` se reescriben con NativeWind para conservar las clases de Tailwind.
- Haptics pedidos por el humano: `expo-haptics`, tres puntos definidos en `docs/plan.md`.

**Qué NO se verificó, y por qué:**
- No se probó que `@clerk/clerk-expo` cubra el patrón `SessionSource` de `lib/api.ts` — se sabe que
  el SDK de Expo existe, no que la migración sea de dos líneas. Riesgo abierto.
- No se probó nada en Expo Go todavía: ni Selfie Check por WebView, ni deep link a World App, ni
  `expo-haptics` en dispositivo real. Todo el análisis de "funciona sin Dev Client" es lectura, no
  ejecución — bloque de riesgo explícito en `docs/plan.md`.
- No se escribió una sola línea de código de la app ni del gateway en esta sesión.

**Dónde queda el pendiente:**
- `docs/plan.md` — cinco bloques nuevos: scaffold con el stack ya decidido, reutilización de la capa
  de lógica, haptics, publicación post-evento, y el riesgo de Expo Go / Dev Client.
## 2026-09-04 — Dispatch salió de orden, corregido en vivo

**Qué se hizo:**
- Los 6 prompts (scaffold, 4 worktrees paralelos, Solver, Auditor) se lanzaron casi simultáneos
  en vez de en cascada. `git fetch origin && git branch -r` confirmó el estado real: solo
  `origin/main` y `origin/scaffold-monorepo` existen, ningún `feature-*` todavía.
- Agente 3 (`feature-logic-port`) preguntó su base al no encontrar `app/` en `main` — confirmado
  basar en `scaffold-monorepo`.
- Agente 5 (Solver) arrancó sin que existiera ninguna rama `feature-*` — indicado detenerse.

**Qué NO se verificó, y por qué:** no se confirmó el estado de los agentes 1, 2 y 4 en esta
sesión — solo se corrigió a los que preguntaron (3 y 5). Si están corriendo con la misma base
equivocada (`main` en vez de `scaffold-monorepo`), van a tener el mismo problema sin preguntar.

**Dónde queda el pendiente:** `docs/plan.md` — bloque "Corrección de orden de dispatch".

## 2026-09-04 — Estado real de las 4 ramas, `feature-gateway-x402` pusheada

**Qué se hizo:**
- Verificado el estado real con `git fetch` + `git branch -r` + `git status` en cada worktree
  local: `feature-selfie-check` ya estaba pusheada (el humano la pusheó tras la guía anterior),
  `feature-gateway-x402` tenía commits locales sin pushear — **pusheada en este lote**
  (`origin/feature-gateway-x402` ahora existe).
- Encontrado: `feature-agent-loop` está basada en `b70dace` (commit de docs, anterior al scaffold
  real `f8b751d`), con un `app/` propio sin trackear en vez del scaffold. Mismo síntoma que el
  problema original de agente 3, pero sin que el agente lo haya preguntado — se detectó por
  inspección, no porque el agente lo reportara.
- `feature-logic-port` (agente 3) no tiene worktree local en esta máquina — corre en otra sesión/
  entorno, no inspeccionable desde aquí.

**Qué NO se verificó, y por qué:**
- No se corrió el rebase de `feature-agent-loop` — se dejó documentado como bloque abierto con el
  procedimiento exacto, a la espera de que el humano confirme qué hay en el `app/` sin trackear
  antes de tocarlo (podría ser trabajo real, no descartar a ciegas).
- No se verificó el estado de `feature-logic-port` (agente 3) más allá de lo que mostró su propia
  captura de pantalla — sin acceso a su entorno desde esta sesión.

**Dónde queda el pendiente:** `docs/plan.md` — bloque "`feature-agent-loop` con base rota".

- **Conflicto resuelto.** El humano confirmó la excepción: `AGENTS.md` §Colaboración punto 6 ahora
  distingue agente local (nunca commitea/pushea, deja el comando listo) de agente en la nube
  (`isolation: "remote"` / sesión de Claude Code cloud — sí commitea y pushea, en su propio branch,
  nunca a `main`, nunca `--amend`, formato de `[COMMIT]` sin excepción). Reflejado también en la
  plantilla `[LÍMITES DUROS]` y en §Reglas del repositorio público.

## 2026-09-04 — Bloque 0: scaffold del monorepo (rama `scaffold-monorepo`, agente local)

**Qué se hizo:**
- Rama `scaffold-monorepo` creada desde `main` en el mismo checkout (esta carpeta es la raíz del
  repo público).
- `app/` — Expo SDK 57 + TypeScript, generado con `create-expo-app@latest --template
  blank-typescript`. NativeWind 4.2.6 configurado: `tailwind.config.js` (preset `nativewind/preset`),
  `global.css`, `babel.config.js` (`babel-preset-expo` con `jsxImportSource: nativewind` +
  `nativewind/babel`), `metro.config.js` (`withNativeWind`), `nativewind-env.d.ts`, `css.d.ts`
  (declaración de módulo para el import de `global.css`). `App.tsx` reescrito con una `View`/`Text`
  usando clases Tailwind (`className`) para probar que NativeWind funciona. `babel-preset-expo` no
  quedó como dependencia explícita tras `expo install nativewind tailwindcss ...` — se agregó a mano
  (`npm install --save-dev babel-preset-expo`) porque Metro fallaba con `Cannot find module
  'babel-preset-expo'` al arrancar sin ella.
- `gateway/` — servicio Node + TypeScript nuevo (Express), una sola ruta `GET /health` devolviendo
  `{ status: "ok" }`. `tsx watch` para dev, `tsc` para build, `tsconfig.json` con `NodeNext`.
- `.env.example` en ambas carpetas: `app/.env.example` con `EXPO_PUBLIC_API_URL` y
  `EXPO_PUBLIC_GATEWAY_URL`; `gateway/.env.example` con `CREVA_API_URL`, `HEDERA_ACCOUNT_ID`,
  `HEDERA_PRIVATE_KEY` — todos valores placeholder, ninguno real.
- `.gitignore` raíz ampliado: `node_modules/`, `app/.expo/`, `app/dist/`, `app/.env`,
  `gateway/dist/`, `gateway/.env`. `gateway/.gitignore` propio con lo mismo para esa carpeta.
- Archivos ruido del scaffolder de Expo eliminados: `app/CLAUDE.md`, `app/AGENTS.md` (ambos
  redundantes con el `AGENTS.md` raíz que ya gobierna todo el repo), `app/LICENSE`.
- `npm run typecheck` (`tsc --noEmit`) verde en ambas carpetas.
- `gateway`: `npm run dev` levantado, `curl http://localhost:8787/health` devolvió
  `{"status":"ok"}`, servidor detenido después (puerto liberado, verificado con `netstat`).
- `app`: `npx expo start` levantado, Metro bundleó `index.ts` sin errores (1132 módulos), bundle
  iOS pedido por HTTP devolvió 200. Servidor detenido después (puerto liberado, verificado con
  `netstat`).

**Qué NO se verificó, y por qué:**
- **No se probó en un dispositivo real vía Expo Go** — solo se verificó que Metro bundlea sin
  error y sirve el bundle por HTTP (`curl` al puerto de Metro). No hay dispositivo/emulador
  disponible en esta sesión. Queda como pendiente explícito del criterio de aceptación #1.
- No se instalaron `react-dom`/`react-native-web` — el criterio de aceptación pide Expo Go, no
  soporte web; se dejó fuera para no agregar dependencias sin uso planeado.
- No se corrió `npm audit fix` sobre las vulnerabilidades moderadas reportadas por `npm install`
  (10 en `app/`, 3 en `gateway/`) — fuera de alcance de este bloque, quedan como ruido normal de
  scaffolding reciente de Expo/Express, revisar antes de shippear si importa.
- No se tocó `README.md` — su reescritura (mezcla 70/30) es un bloque abierto propio en
  `docs/plan.md`, distinto del scaffold.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque "Scaffold del repo público antes de repartir worktrees" movido a
  Cerrados, con la prueba real de Expo Go marcada `⏳` dentro del mismo bloque.
- `docs/plan.md` — bloque abierto de README público sigue abierto, sin tocar en este lote.
