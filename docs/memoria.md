<!-- docs/memoria.md: bitácora de enfoque técnico y qué-se-hizo/qué-no-se-verificó por sesión. No es
     el checklist (docs/plan.md tiene bloques abiertos/cerrados) ni el análisis (brainstorming.md
     tiene el porqué) — aquí solo el registro de lo que pasó, en orden cronológico. -->

# Memoria — ETHOnline 2026

## 2026-09-04 — Worktree `feature-agent-loop`: pantallas de query pagada y sello verificado

**Qué se hizo:**
- Worktree `feature-agent-loop` creado desde `main` (`git worktree add`). `main` todavía no
  tiene el scaffold Expo — sigue solo en la rama `scaffold-monorepo`, sin commitear (regla de
  agente local, `AGENTS.md` §Colaboración punto 6). Para no bloquear la tarea, se copió `app/`
  (sin `node_modules`, `.expo`, `dist`) al worktree; queda pendiente de reconciliar cuando el
  bloque 0 (scaffold) se commitee y mergee a `main` de verdad.
- `app/features/query/gatewayClient.ts` + `QueryScreen.tsx`: mock tipado del endpoint de señales
  pagadas — primera llamada devuelve 402 con términos de pago (monto, asset, red `hedera-testnet`,
  facilitador), la app paga (haptic `ImpactFeedbackStyle.Medium`) y reintenta, recibe 200 con las
  señales y el hash de la transacción. Forma basada en `brainstorming.md` §1 y §8 (x402 sobre
  Hedera vía Bazantic); el gateway real (bloque 1, worktree paralelo) todavía no define el shape
  exacto — este mock es el contrato a reconciliar por el Solver.
- `app/features/verify/sealClient.ts` + `VerifyScreen.tsx`: mock tipado del reporte sellado —
  folio, firma Ed25519, cinco veredictos (`DOF`, `CNBV`, `SAT`, dirección, beneficiario final) y
  la lista explícita de qué NO certifica (`brainstorming.md` §0.2). Haptic `Success` si la firma
  valida, `Error` si no.
- `App.tsx` reescrito como selector simple entre las dos pantallas (sin librería de navegación,
  para no sumar una dependencia que el resto del equipo no pidió).
- `expo-haptics`, `jest`, `jest-expo`, `@types/jest` agregados a `app/package.json`; `tsconfig.json`
  con `"types": ["jest"]` para que `tsc --noEmit` no choque con los globals de test.
- Tests unitarios de las dos funciones mock (`__tests__/gatewayClient.test.ts`,
  `__tests__/sealClient.test.ts`): ciclo 402→pago→200, y que el reporte trae exactamente cinco
  veredictos más la lista de qué no certifica.

**Qué NO se verificó, y por qué:**
- Haptics no se sintieron en dispositivo real vía Expo Go — sin dispositivo disponible en esta
  sesión. Solo se verificó que las tres llamadas (`impactAsync`/`notificationAsync` con los
  valores pedidos) están en el código, en los tres puntos exactos (pagar, reporte firmado
  recibido, verificación inválida).
- El gateway es un mock tipado, no la integración real (bloque 1 de `docs/plan.md` sigue sin
  ejecutar) — el shape puede cambiar cuando ese worktree termine; el Solver deberá reconciliar.
- No se corrió `expo start` ni se probó el bundle en Metro esta sesión — solo `tsc --noEmit` y
  `jest`.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque de haptics: agregar la nota de "sentido en Expo Go real" como pendiente
  explícito, no cerrar el bloque todavía.
- Reconciliación del `app/` copiado al worktree vs. el scaffold real de `main` una vez el humano
  commitee el bloque 0 — tarea del Solver, no de este worktree.

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
  factor) sin números concretos. Reportado; decisión pendiente de si se redacta.

**Qué NO se verificó, y por qué:**
- No se revisó `LEARNINGS.md` ni `docs/estado.*` con el mismo detalle línea por línea que
  `brainstorming.md` — el pedido fue específico a fórmulas/pesos en `brainstorming.md`.
  Si se quiere la misma pasada sobre esos archivos, es trabajo pendiente.
- No se decidió si la línea 136 de `brainstorming.md` se redacta o se deja — no se ha
  respondido esa pregunta todavía.
- No se verificó si algún archivo binario (los PNG de `estado.visual-check.*`) contiene datos
  sensibles en metadata — solo se revisó contenido de texto.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque "Repo público creado, pero no cumple el criterio de aceptación todavía"
  (README público con mezcla 70/30, no el README de esta carpeta privada).
- Decisión sobre la línea 136 de `brainstorming.md`: sin bloque propio todavía — anotar en
  `docs/plan.md` si se confirma que se quiere redactar.

## 2026-09-04 — Decisión: equipo humano + IA, y orden de arranque

**Qué se hizo:**
- Decisión escogida: el proyecto va con **equipo humano + agentes de IA**, no solo.
  Reflejado en `docs/plan.md` (bloque cerrado) y en `brainstorming.md` §8 (línea de "decisiones
  abiertas" actualizada).
- Decisión escogida sobre el orden de arranque: **scaffold primero, reparto de
  worktrees después** — no repartir los 4 pasos de la rebanada (`brainstorming.md` §6) en paralelo
  sobre un repo público que hoy solo tiene `.md`s, sin código. Nuevo bloque abierto en
  `docs/plan.md`.

**Qué NO se verificó, y por qué:**
- La composición exacta del equipo (nombres) no se confirmó — se indicó "equipo humano" sin
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
- Decisión escogida: la entrega es una **app móvil React Native + Expo**, publicable en App Store
  y Play Store **después** del evento; durante el hackathon se demuestra en **Expo Go**.
- Arquitectura recomendada y aceptada: **dos piezas**, app Expo + gateway Node en Cloud Run. La
  capa de pago no va en el dispositivo: `@hashgraph/sdk` en RN exige polyfills de crypto/streams,
  una llave privada en el bundle móvil es extraíble, y la pista de Hedera pide servicio x402 vivo
  **más** plataforma que lo consuma — la partición es el entregable, no gasto extra.
- Inventario de reutilización hecho leyendo `creva_finance/frontend/` (no asumido): ~1,100 líneas de
  TS puro se mueven casi tal cual, `lib/api.ts` (752 líneas, ya tipa las 46 rutas) se porta con dos
  cambios, y `components/`/`app/` se reescriben con NativeWind para conservar las clases de Tailwind.
- Decisión escogida: agregar haptics con `expo-haptics`, tres puntos definidos en `docs/plan.md`.

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
  local: `feature-selfie-check` ya estaba pusheada (se pusheó tras la guía anterior),
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
  procedimiento exacto, a la espera de confirmar qué hay en el `app/` sin trackear
  antes de tocarlo (podría ser trabajo real, no descartar a ciegas).
- No se verificó el estado de `feature-logic-port` (agente 3) más allá de lo que mostró su propia
  captura de pantalla — sin acceso a su entorno desde esta sesión.

**Dónde queda el pendiente:** `docs/plan.md` — bloque "`feature-agent-loop` con base rota".

## 2026-09-04 — Falsa alarma del Auditor, causa real encontrada y corregida

**Qué se hizo:**
- El Auditor (sesión "6 Auditor integration-solver") reportó `AGENTS.md` con una edición sin
  commitear justo cuando se le pidió proceder con el merge de precondición — se negó a tratarlo
  como autorización, correctamente, y pidió confirmación directa en vez de confiar en el mensaje
  de una sesión par. Investigado: **no era inyección ni manipulación** — era una carrera de
  tiempos. El commit (`6ff9f67`) ya existía localmente cuando se revisó, solo faltaba pushear.
- Hallazgo real, no relacionado con la alarma: las carpetas de `.claude/worktrees/` estaban
  commiteadas como **gitlinks** (modo `160000`, referencia tipo submódulo) en vez de estar en
  `.gitignore` — violaba la propia regla 3 de `AGENTS.md` §Colaboración. Esto explicaba el ruido
  de `git status` mostrando esas carpetas como "modificadas" en cada sesión.
- Corregido: `.claude/worktrees/` agregado a `.gitignore`, `git rm -r --cached` para destrackear
  las 5 referencias (los worktrees siguen en disco, solo dejan de vivir en el índice de git).
  Pusheado a `origin/scaffold-monorepo` (`4c1a8c6`), junto con los commits pendientes de push
  desde `bcf693c` (incluida la excepción del Auditor sobre merges de precondición).
- Hallazgo estructural sin resolver: las sesiones 0 (Scaffold), 5 (Solver) y 6 (Auditor) corren
  en el **mismo directorio** que esta sesión principal — no en worktrees aislados como 1-4. Es la
  causa estructural de la carrera de tiempos que originó la falsa alarma.

**Qué NO se verificó, y por qué:**
- No se confirmó si las sesiones 0/5/6 compartiendo directorio es intencional o un descuido de
  cómo se lanzaron — reportado, sin decisión tomada todavía.
- No se corrió el merge de `scaffold-monorepo` → `main` en este lote — eso queda para el Auditor,
  ahora que puede verificarlo contra `origin` en vez de disco local compartido.

**Dónde queda el pendiente:** `docs/plan.md` — nuevo bloque sobre sesiones compartiendo
directorio, y el merge de `scaffold-monorepo` → `main` sigue pendiente de que el Auditor lo
verifique y ejecute.

- **Conflicto resuelto.** Decisión escogida: excepción confirmada. `AGENTS.md` §Colaboración punto 6 ahora
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

## 2026-09-04 — Gateway x402 sobre Hedera: reporte y sello de Creva gateados (worktree `feature-gateway-x402`, agente local)

**Qué se hizo:**
- Worktree `feature-gateway-x402` creado manualmente con `git worktree add`, en lugar de
  `EnterWorktree name:` directo, porque el `worktree.baseRef` por defecto ("fresh") habría
  ramificado desde `origin/main` — que todavía no tiene el scaffold (`gateway/**` no existiría
  ahí). Se ramificó explícitamente desde `scaffold-monorepo` en su commit `f8b751d` (el que
  agrega `gateway/`), siguiendo el mismo patrón que el worktree `feature-agent-loop` ya presente.
  `main` sigue sin el merge del scaffold — bloque abierto correspondiente en `docs/plan.md`.
- `gateway/src/x402-gate.ts`: middleware Express que gatea una ruta con HTTP 402. Sin header
  `X-PAYMENT` → 402 con `PaymentRequirements` (`scheme: "exact"`, `network: "hedera-testnet"`,
  `resource`, `payTo`, `asset`, montos en unidades atómicas vía `.env`). Con header → llama
  `verifyPayment` y `settlePayment` del facilitador; si ambos aprueban, deja pasar la request y
  agrega `X-PAYMENT-RESPONSE`.
- `gateway/src/facilitator.ts`: cliente HTTP puro hacia `FACILITATOR_URL` (`/verify`, `/settle`) —
  sin SDK de Hedera embebido, el facilitador es quien firma/liquida. Placeholder apuntando a
  `http://localhost:4020` en `.env.example`; el facilitador real (BlockyDevs open source o
  Bazantic, ver `brainstorming.md` §5/§8) no se conectó ni se probó contra testnet en esta sesión.
- `gateway/src/creva-proxy.ts`: reenvía la request ya pagada a `CREVA_API_URL` (default
  `https://creva-backend-c7as7id5jq-pv.a.run.app`, la URL real dada en el prompt) y relay del
  body/status/content-type tal cual, sin transformar la respuesta.
- Rutas conectadas en `gateway/src/index.ts`: `POST /creva-score/report` y
  `POST /creva-score/verify`, ambas detrás de `createX402Gate`.
- Tests (`gateway/test/x402-gate.test.ts`, Vitest + Supertest): mockea el módulo
  `facilitator.ts` completo (`vi.mock`) — cero llamadas de red reales a Hedera. Cubre, para
  ambas rutas: 402 sin pago, 402 cuando el facilitador rechaza (`invalidReason`), y 200 con el
  body de Creva reenviado tal cual cuando el facilitador aprueba y liquida (mockeando también
  `global.fetch` para simular la respuesta de Creva, sin llamar la API real).
- `package.json` del gateway: agregados `test` (Vitest) y `lint` (ESLint flat config,
  `typescript-eslint` recomendado) — no existían antes de este bloque. `"type": "module"` agregado
  para que `NodeNext` + imports con `.js` no generen warning de Node.

**Qué NO se verificó, y por qué:**
- **Sin transacción real contra Hedera testnet** — el criterio de aceptación #2 (liquidación con
  pago real) no se ejecutó. No hay facilitador corriendo en esta sesión (ni local ni Bazantic
  configurado con credenciales reales) — fuera de alcance de un agente local sin acceso a esas
  credenciales.
- No se probó el proxy contra la API real de Creva (`creva-backend-c7as7id5jq-pv.a.run.app`) — el
  test mockea `fetch`, nunca llamó al backend real. Los DTOs exactos de `/creva-score/report` y
  `/creva-score/verify` tampoco se verificaron contra el spec OpenAPI real en esta sesión (ver
  bloque previo de 2026-09-04 sobre el spec — sigue con el mismo pendiente de DTOs vacíos).
- `npm audit` reportó vulnerabilidades (mismo patrón que el bloque de scaffold) — no revisadas,
  fuera de alcance.
- No se corrió `git add`/`git commit` — agente local, según `[LÍMITES DUROS]` del prompt. Comando
  dejado listo en el reporte de esta tarea.

**Dónde queda el pendiente:**
- `docs/plan.md` — nuevo bloque abierto: "Gateway x402/Hedera: falta pago real en testnet y
  conexión a un facilitador vivo" (ver bloque agregado en el mismo lote).
- `docs/plan.md` — bloque existente "Scaffold del repo público antes de repartir worktrees" sigue
  sin el merge a `main`; este worktree se creó igual, ramificando de `scaffold-monorepo`
  directamente (mismo patrón ya usado por `feature-agent-loop`), no un cambio de política nuevo.

## 2026-09-04 — World Selfie Check en el onboarding (worktree `feature-selfie-check`)

**Qué se hizo:**
- `app/features/onboarding/` — flujo de Selfie Check por `WebView` (`react-native-webview`)
  contra `id.worldcoin.org/verify`, sin exigir Orb ni Dev Client. Estados manejados:
  `idle → in_progress → verified | failed`, y degradación a `identity_unavailable` cuando
  `EXPO_PUBLIC_WORLD_APP_ID` no está seteada (sin crashear).
- `app/features/auth/session-source.ts` — adapta `@clerk/clerk-expo`'s `useAuth()`/`useUser()`
  a la forma `SessionSource` (`getToken`, `userId`) que ya usa
  `creva_finance/frontend/lib/api.ts:17-25`, para que el port futuro de `lib/api.ts` (bloque
  aparte en `docs/plan.md`) pueda registrar la sesión sin conocer Clerk directamente.
- `app/features/auth/ClerkAppProvider.tsx` — wrapper de `ClerkProvider` con `token-cache` de
  Expo SecureStore, listo para que el paso de integración lo monte en `App.tsx` (no se tocó
  `App.tsx` aquí — fuera de `[POSEES]` de este bloque).
- Dependencias agregadas a `app/package.json`: `@clerk/clerk-expo` (nota: paquete marcado
  deprecated por Clerk a favor de `@clerk/expo`, se usó el nombre pedido explícitamente en la
  tarea), `react-native-webview`, `expo-secure-store`, y devDependencies de test
  (`jest`, `jest-expo`, `@testing-library/react-native`, `react-test-renderer`, `@types/jest`,
  `@react-native/jest-preset@0.86.3` — pineado porque la versión `^0.87` no calza con
  `react-native@0.86.3` instalado, rompía `setup-env.js` — y `test-renderer`, peer nuevo de
  `@testing-library/react-native` distinto de `react-test-renderer`).
- `app/tsconfig.json` — se le agregó `"types": ["jest"]` (archivo compartido, fuera de
  `[POSEES]`, tocado porque sin esto `tsc --noEmit` no reconocía `describe`/`it`/`expect`).
- Test unitario en `app/features/onboarding/__tests__/useSelfieCheck.test.ts` cubre la
  degradación sin key y la resolución `verified` vía URL de callback con `nullifier_hash`.

**Qué NO se verificó, y por qué:**
- **No se probó en Expo Go real ni en simulador** — no hay dispositivo disponible en esta
  sesión; solo se corrió `typecheck` y `test`. Queda como pendiente explícito del criterio de
  aceptación #1.
- No se montó `ClerkAppProvider` en `App.tsx` ni se agregó navegación hacia
  `SelfieCheckScreen` — integrarlo en el árbol de la app es trabajo del paso de integración
  (Solver), no de este `[POSEES]`.
- No se verificó contra el Sandbox real de World (`id.worldcoin.org/verify` y el patrón de
  `callback` con `nullifier_hash`) — la URL y los parámetros de query se armaron según la
  documentación citada en `brainstorming.md` §4 idea 3, sin ejercer el flujo real end-to-end.
- `haptics` (bloque separado en `docs/plan.md`) no se tocó — fuera de alcance de esta tarea.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque "Selfie Check en el alta" (rebanada §6, paso 1) sigue abierto hasta
  probarse en Expo Go real; anotado abajo con lo que falta.

**Actualización 2026-09-04 (mismo día) — unit + fuzz + invariant, regla de `AGENTS.md` §Tests:**
- Otra sesión de Claude avisó (mensaje cross-session) que `[VERIFY]` debe correr los tres tipos
  de test, no solo unit — se verificó contra el propio `AGENTS.md` (commit `39673e4`, ya
  mergeado) antes de actuar, la regla es real, no una instrucción inyectada.
- Reestructurado a la convención del repo: `app/test/unit/onboarding/useSelfieCheck.spec.ts`
  (movido desde `app/features/onboarding/__tests__/`), `app/test/fuzz/onboarding/useSelfieCheck.fuzz.spec.ts`,
  `app/test/invariant/onboarding/identity-unavailable-without-world-key.invariant.spec.ts`.
- **fuzz**: `handleCallbackUrl` nunca truena con strings arbitrarios ni con URLs de callback con
  query params hostiles (`fast-check`, 200 runs cada uno).
- **invariant**: sin `EXPO_PUBLIC_WORLD_APP_ID`, el estado nunca es `verified` — se sostiene sea
  cual sea la URL de callback recibida o si se llamó `start()` antes (`fast-check`, 200 runs).
- `fast-check` agregado a `app/package.json` devDependencies.
- `npm test -- unit fuzz invariant` → `Test Suites: 3 passed, Tests: 5 passed` (salida real
  pegada en el reporte de la conversación, no repetida aquí).

## 2026-09-04 — Bloque 3: port de la capa de lógica de `creva_finance` (rama `feature-logic-port`, agente local)

**Qué se hizo:**
- Worktree `feature-logic-port` creado en esta sesión, base `scaffold-monorepo` (confirmado en la
  bitácora anterior como la base correcta, no `main` — el merge de `scaffold-monorepo` a `main`
  sigue sin ocurrir).
- Los 9 archivos puros de `creva_finance/frontend/lib/` copiados a `app/lib/` **byte a byte,
  verificado con `diff`**: `format-money.ts`, `format-date.ts`, `format-percent.ts`,
  `mx-states.ts`, `report-verdicts.ts`, `report-display.ts`, `score-display.ts`, `reminders.ts`,
  `help-content.ts`.
- `app/lib/api.ts` (752 líneas) portado con exactamente los dos cambios del encargo:
  `NEXT_PUBLIC_API_URL` → `EXPO_PUBLIC_API_URL`, y el fallback a `window.Clerk` global eliminado
  (`clerkGlobal()` y su uso en `getToken()`/`cacheKey()` borrados) — investigado con `WebFetch`
  contra la documentación de Expo de Clerk: `@clerk/clerk-expo` no expone ningún singleton global
  equivalente a `window.Clerk` de Next, solo hooks de React (`useAuth`, `useUser`, `useClerk`).
  `sessionSource` (patrón `SessionSource`, registrado por el futuro `AuthGuard` de
  `app/features/**`) queda como única fuente de token; sin sesión registrada, sin encabezado — el
  mismo comportamiento de "sesión muerta → 401", solo sin el atajo pre-mount que Next necesitaba y
  RN no tiene.
- `app/tsconfig.json`: agregado `"paths": { "@/*": ["./*"] }` (sin `baseUrl`, deprecado en TS 6) y
  `"types": ["jest", "node"]` — el primero para que `report-verdicts.ts` importe `@/lib/api` sin
  tocarlo (import no listado entre los dos cambios permitidos), el segundo porque sin él `tsc
  --noEmit` no resolvía los globals de Jest en los `.test.ts` pese a tener `@types/jest` instalado.
- Infraestructura de test añadida (no existía en el scaffold): `jest` + `ts-jest` + `@types/jest`
  como devDependencies, `app/jest.config.js` (`testEnvironment: 'node'`, sin renderer de RN — todo
  lo portado es TS puro), script `test` en `app/package.json`.
- 9 suites de test portadas de `creva_finance/frontend/test/lib/`, adaptadas donde el código que
  cubrían no existe en este port:
  - `api.test.ts`: se quitaron los casos de `window.Clerk` global y de purga de `localStorage`
    (`creva_token`) — no hay navegador ni `lib/legacy-session.ts` en este repo. La cobertura de
    `SessionSource` y aislamiento de caché por usuaria quedó intacta.
  - `format-money.test.ts` y `format-date.test.ts`: se quitó el escaneo cruzado de
    `app/`+`components/`+`lib/` buscando formateadores duplicados — `app/features` (las pantallas)
    no existe todavía, es de otro agente.
  - `score-display.test.ts`: el test "sin cortes de negocio" ahora lee `lib/score-display.ts` de
    este repo en vez de `../../lib/score-display.ts` del original.
  - `help-content.test.ts`: se quitó la verificación de rutas contra `app/<href>/page.tsx`
    (convención de Next App Router) — Expo no sigue esa convención y las pantallas no existen aún.
- `npm run typecheck` y `npm test -- lib` corridos de verdad, salida real pegada en el reporte de
  cierre de esta sesión (no "debería pasar").

**Qué NO se verificó, y por qué:**
- El swap de Clerk es una eliminación de código, no una integración probada: no se instaló
  `@clerk/clerk-expo` ni se escribió el futuro `AuthGuard` que llama `setSessionSource()` — eso es
  de `app/features/**`, fuera de este bloque. Lo que sí se confirmó contra la documentación oficial
  es que no existe un `window.Clerk` equivalente que reemplazar por otra cosa: simplemente no hay
  fallback global en RN.
- Los tests portados no corrieron nunca en Expo Go ni en ningún entorno RN real — son Node puro vía
  `ts-jest`, coherente con que las 9 funciones portadas son TS sin DOM.
- No se corrió `npm audit` sobre las nuevas devDependencies (`jest`, `ts-jest`, `@types/jest`).
- El merge de `scaffold-monorepo` a `main` sigue sin ocurrir — este worktree se basó directamente en
  `scaffold-monorepo` (rama viva en este momento: commit con "docs: log dispatch fixes..."), no en
  `main`. Si `main` avanza distinto antes del merge, este branch necesitará rebase.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque "Reutilizar la capa de lógica de `creva_finance`" movido a Cerrados.
- Integración real de `@clerk/clerk-expo` (instalar el paquete, escribir `AuthGuard`, llamar
  `setSessionSource`) queda para el agente/bloque de `app/features/**`, no de este.

## 2026-09-04 — Bloque 3 (continuación): estructura de tests `unit`+`fuzz`+`invariant` aplicada

**Qué se hizo:**
- Un peer (sesión `feature-agent-loop`, `local_960e6f4a...`) reportó por mensaje cruzado una nueva
  regla en `AGENTS.md` §Tests que este worktree no tenía porque se creó antes de que existiera. Se
  verificó la afirmación **antes de actuar** en vez de tomarla como cierta: no estaba en el
  `AGENTS.md` local ni en `origin/main`, pero sí en `origin/scaffold-monorepo` (commits `83ec9e1` y
  `bcf693c`) — confirmado con `git show origin/scaffold-monorepo:AGENTS.md`. Traído a este worktree
  con `git stash -u` + `git merge origin/scaffold-monorepo --no-edit` (fast-forward limpio) +
  `git stash pop`, sin perder el trabajo local ya hecho.
- Reestructurado según la convención (`AGENTS.md` §Tests): los 9 `.test.ts` que vivían junto a su
  módulo en `app/lib/` se movieron a `app/test/unit/*.spec.ts` (imports reescritos a
  `../../lib/<módulo>`; el test de `score-display` que lee su propio fuente por `readFileSync`
  también se ajustó a la ruta nueva).
- `fast-check` agregado como devDependency de `app/`.
- `app/test/invariant/no-stale-authorization-header.invariant.spec.ts` — la propiedad que el peer
  pidió explícitamente: para cualquier secuencia arbitraria de transiciones de sesión (token
  válido, sesión registrada con token muerto, o sin sesión), el header `Authorization` nunca lleva
  un token que no sea el de la sesión activa en ese paso — ni el de una sesión anterior, ni uno
  inventado cuando no hay token.
- `app/test/fuzz/response-parsing.fuzz.spec.ts` — fuzz sobre el borde de confianza real de
  `lib/api.ts`: el parseo de la respuesta del backend. Encontró un defecto real (ver abajo), no
  solo pasó en verde.
- **Defecto real encontrado por el fuzz test y corregido**: `request()` y `requestMultipart()` en
  `lib/api.ts` hacían `body.message ?? 'Error'` sobre el cuerpo de una respuesta no-ok. Si el
  backend responde con un cuerpo JSON que parsea a `null` (JSON válido, no un fallo de parseo), el
  `.catch(() => ({}))` no lo intercepta — `null` no lanza al parsear — y `body.message` revienta
  con `TypeError: Cannot read properties of null`. Corregido a `body?.message` en los dos sitios.
  **Esto es una desviación del alcance original de "portar sin tocar salvo los dos cambios
  acordados"**, deliberada y documentada aquí: el defecto ya existe en
  `creva_finance/frontend/lib/api.ts` (no lo introdujo el port), y dejarlo sin corregir haría que
  el propio test mandatado por la nueva regla de `AGENTS.md` fallara — el punto de un fuzz test es
  exactamente encontrar esto. No se tocó nada más de la lógica.
- `npm run typecheck` y `npm test -- unit fuzz invariant` (patrón exacto de `AGENTS.md` §Tests)
  corridos de verdad: 11 suites, 88 tests, todos verdes.

**Qué NO se verificó, y por qué:**
- El mismo defecto (`body.message` sin optional chaining) sigue sin corregirse en
  `creva_finance/frontend/lib/api.ts` — ese repo es solo de lectura para este worktree
  (`[LÍMITES DUROS]` del prompt), no se tocó.
- No se le devolvió el hallazgo al backend de Creva ni se abrió ticket — fuera del alcance de este
  worktree; queda anotado aquí para quien decida si vale la pena reportarlo río arriba.
- El resto de los agentes de worktree (1, 2, 4) mencionados en el mensaje del peer como
  necesitando "un commit de seguimiento" no se verificaron desde esta sesión — cada uno resuelve
  su propio bloque.

**Dónde queda el pendiente:**
- `docs/plan.md` — bloque "Estructura de tests obligatoria: `unit` + `fuzz` + `invariant`":
  la parte de `feature-logic-port` queda cumplida; los otros 3 worktrees siguen su propio bloque.

## 2026-09-04 — Bloque 3 (continuación): auditoría de encabezados de archivo

**Qué se hizo:**
- Un peer reportó que `AGENTS.md` §Documentación (regla de encabezado de 2-3 líneas,
  `// <filename>: <what this file does>`) queda marcada no-negociable, y pidió verificar los
  archivos de este port. Verificado: la regla ya existía en `AGENTS.md` (y en el `CLAUDE.md` global
  de este agente) antes de este mensaje — no es una regla nueva, solo reforzada.
- Auditados los 21 archivos tocados en este bloque (`app/lib/*.ts`, `app/test/{unit,fuzz,invariant}/*.ts`,
  `app/jest.config.js`). Dos defectos reales encontrados y corregidos:
  - `lib/reminders.ts` traía el encabezado del original de `creva_finance`
    (`// [Library]: This is the reminder builder...`), que nunca cumplió el formato — nombra
    "Library", no el archivo. Corregido a `// reminders.ts: ...`. Es la única desviación de
    "byte-idéntico" en los 9 archivos puros, y es solo el comentario de cabecera, no lógica.
  - Los 9 tests movidos de `app/lib/*.test.ts` a `app/test/unit/*.spec.ts` (bloque anterior de esta
    misma bitácora) se renombraron de archivo pero no de encabezado — seguían diciendo
    `// <nombre>.test.ts:` apuntando a un nombre de archivo que ya no existe. Corregidos los 9 a
    `// <nombre>.spec.ts:`.
- `npm run typecheck` y `npm test -- unit fuzz invariant` re-corridos tras los cambios: siguen en
  verde (11 suites, 88 tests) — son cambios de comentario, no de código.

**Qué NO se verificó, y por qué:**
- No se auditaron encabezados fuera de este bloque (`app/App.tsx`, `gateway/`, etc.) — fuera de
  `[POSEES]` de este worktree.
- No se corrigió el encabezado del archivo fuente en `creva_finance/frontend/lib/reminders.ts` —
  ese repo es de solo lectura para este worktree.

**Dónde queda el pendiente:** ninguno propio de este hallazgo — cerrado en el mismo lote.
