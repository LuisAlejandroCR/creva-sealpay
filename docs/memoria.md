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
- **Conflicto resuelto.** El humano confirmó la excepción: `AGENTS.md` §Colaboración punto 6 ahora
  distingue agente local (nunca commitea/pushea, deja el comando listo) de agente en la nube
  (`isolation: "remote"` / sesión de Claude Code cloud — sí commitea y pushea, en su propio branch,
  nunca a `main`, nunca `--amend`, formato de `[COMMIT]` sin excepción). Reflejado también en la
  plantilla `[LÍMITES DUROS]` y en §Reglas del repositorio público.
