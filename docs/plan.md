<!-- docs/plan.md: bloques de trabajo con criterio de aceptación, abiertos vs cerrados, para la
     preparación de ETHOnline 2026. No es la bitácora (docs/memoria.md tiene el qué-se-hizo/qué-no-
     se-verificó) ni el brainstorming (brainstorming.md tiene el análisis; aquí solo el checklist
     accionable). Se actualiza en el mismo lote que cualquier cambio de estado. -->

# Plan — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Última actualización:** 2026-09-06 (rename de carpetas top-level: `app/` → `frontend/`, `gateway/` → `backend/`)

> **Nota histórica (rename 2026-09-06):** las carpetas top-level `app/` y `gateway/` pasaron a
> llamarse `frontend/` y `backend/`. Las rutas de este archivo se actualizaron al nombre nuevo;
> alguna mención suelta de `app/` o `gateway/` en registros de verificación viejos se refiere a lo
> que hoy es `frontend/` / `backend/`. Las rutas `creva_finance/frontend/app/…` (proyecto hermano,
> Next.js) NO cambian. La palabra "gateway" como nombre del servicio x402 se mantiene.

Ver [`brainstorming.md`](../brainstorming.md) §8 y §9 para el análisis completo. Detalle de
qué-se-hizo/qué-no-se-verificó por sesión: [`docs/memoria.md`](memoria.md). Esta tabla es solo el
checklist.

## Abiertos

- [ ] **2026-09-06 — Auditoría app↔core (`feature-app-core-api-wiring`).** `frontend/lib/api.ts`
  va directo al core con Clerk; el gateway x402 queda solo para report/verify pagados.
  Gap real: `GET /cards` no existe en el core, aunque la app lo llama; hay fix preparado en
  `creva_finance`, falta deploy y ajustar el tipo de `cards.list`.
  También quedan 5 métodos sin uso por limpiar o cablear: `recommendations.get`,
  `credit.selections`, `crevaScore.disclosure`, `crevaScore.verifyReport`, `auth.register/login/getOAuthUrl`.

- [ ] **2026-09-06 — Auth Clerk↔core.** El core desplegado sigue configurado como Supabase; con
  tokens Clerk, `JwtAuthGuard` responde 401 hasta activar `AUTH_PROVIDER=both`, Clerk JWKS/secret,
  webhook `/webhooks/clerk` y backfill de identidades.
  Decisión escogida: mientras esa config no aterrice, la app muestra `BackendPendingState` en las
  secciones core-directas en vez de spinner/error crudo.
  Pendiente: verificar con sesión Clerk real contra el deploy configurado.
- [ ] **2026-09-06 — Privy wallet aditiva para x402.** Hecho local: `defineChain(296)` con `viem`,
  lectura real al Hedera JSON-RPC Relay, selector demo/privy y política de gasto antes de firmar.
  Decisión escogida: no agregar `@privy-io/expo` todavía; queda adaptador perezoso para no romper
  el path Hedera congelado.
  Pendiente: crear app Privy, instalar SDK, configurar env vars y cablear `makePrivySigner`.
  VERIFY registrado: `tsc` limpio; Jest 68 suites / 300 tests.

- [ ] **2026-09-06 — Coordinación de Ayuda (`frontend/features/help/**`).** Decisión tomada:
  Ayuda sale del worktree `codex/mobile-parity-help` y queda en la sesión UI/UX.
  Hecho: `HelpArticleScreen`, `HelpCategoryScreen` y `HelpScreen` reconstruidas al nivel web con
  búsqueda, pasos, CTA, relacionadas y rutas nativas.
  Pendiente: cerrar el bloque cuando la rama UI/UX se integre o se descarte.
  VERIFY registrado: `tsc` limpio; Jest 59 suites / 261 tests.

- [ ] **2026-09-06 — Migración: últimas 4 pantallas (`feature-last-screens-parity`).** Decisión
  tomada: portar `auth`, `kyc`, `credit` y `card` completos, no mantener stubs mínimos.
  Hecho: `SignInScreen`, `KycFormScreen`, flujo completo de crédito, tarjeta virtual/creación y
  fix de ancho en `MoreSheet`.
  Pendiente: endpoints reales de KYC/crédito/tarjeta, segunda vista visual, y definir si
  `QueryScreen` necesita formulario de datos del negocio.
  VERIFY registrado: `tsc` limpio; Jest hasta 61 suites / 276 tests.
- [ ] **2026-09-06 — The Graph load-bearing.** Código completo: `AttestationRegistry`, subgraph
  y enriquecimiento `onchain.trustSignal` en `/creva-score/verify`; la app ya consume el campo.
  Local verificado: `forge test`, `graph build`, backend `tsc`/`eslint`/Vitest y tests de verify.
  Pendiente operativo: deploy a Arc/Sepolia, configurar `REGISTRY_ADDRESS`/`SUBGRAPH_URL`, desplegar
  subgraph y grabar demo real con 2 attests + `/verify`.

- [ ] **2026-09-06 — Paridad móvil: segunda vista visual pendiente.** Las pantallas y fixes de
  paridad ya están mergeados a `main` y verificados por código/tests.
  Primera pasada visual resolvió CTAs, back button, saludo, campana honesta, segmentados,
  marca "Creva", cierre de `MoreSheet` y copy de borrado.
  Pendiente: segunda vista pantalla por pantalla y Expo Go físico; no afirmar paridad visual final
  hasta cerrar esa revisión.

- [ ] **2026-09-06 — AUDIT app↔core de `frontend/lib/api.ts`.** Duplicado del bloque superior,
  conservado como recordatorio compacto: la mayoría de métodos ya apunta a endpoints reales del
  core; `GET /cards` falta, varios métodos no se usan, y los shapes requieren prueba con sesión
  Clerk real.
  Cambio aplicado: `CardScreen` muestra estado honesto si `cards.list` falla.
  Pendiente: deploy/config de auth y prueba runtime contra el core.

- [ ] **2026-09-06 — Diseño gateway para endpoints personales.** Hoy el gateway usa identidad de
  servicio; eso sirve para rutas públicas o reportes con sujeto explícito.
  Si un endpoint personal pasa por x402 después, debe reenviar el `Authorization` del usuario con
  un proxy separado; no tocar `creva-auth`, `x402-gate` ni `facilitator` por este punto.

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

- [ ] **2026-09-05 — Paridad móvil, revisión Codex (`codex/mobile-parity-*`): sin mergear.**
  Worktrees Codex separados de la familia ya integrada: Navegación
  `codex/mobile-parity-foundation`, Ayuda `codex/mobile-parity-help`, Inicio
  `codex/mobile-parity-dashboard`, coordinación en `codex/mobile-parity-audit`. Todos en un commit
  viejo (`83092cd`), sin avance sobre `main`. Pendiente: decidir si su trabajo se retoma o se
  descarta ahora que `feature-mobile-native-parity` + las 4 ramas de ajuste cubren el sheet "Más",
  el dashboard y los primitivos (ver Cerrados `2026-09-06`). No re-tomar un módulo Codex sin
  coordinarlo aquí primero (regla de §Colaboración punto 7). Nota de contexto que sigue vigente:
  para datos personales debe conservarse la identidad Clerk del solicitante (la identidad de
  servicio devolvería el score de otra cuenta). El gateway no expone `/score` ni hace falta: el
  score se consume core-directo con la sesión Clerk (cerrado `2026-09-06`, ver Cerrados).

- [ ] **2026-09-05 — `claude/bazantic-sponsor-block-6s1iv6`: no mergear, descartar.** Solo añade
  +32 líneas a `docs/plan.md` documentando un bloqueo de `JwtAuthGuard` de Bazantic que **ya está
  resuelto** en `main` vía `feature-creva-service-identity` (identidad de servicio con refresh
  token, ver Cerrados). Da conflicto de merge y mergearla reabriría un bloque cerrado. Segura de
  borrar del remoto.

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

- [ ] **Selfie Check: nonce server-side cerrado en código contra la spec v4; falta ejercer contra
  sandbox real.** `backend/src/world-verify.ts` llama a la Developer Portal API de World con
  `WORLD_API_KEY`; el WebView ya no decide `verified` por su cuenta.
  **Actualización `2026-09-06` (rama `sponsor-world-nonce`):** el gap del `nonce` se cerró en
  código. **Decisión escogida:** nonce emitido por el gateway (espeja `rp_context.nonce` de World
  ID 4.0 — `signRequest(signingKeyHex, action)` → `{ sig, nonce, createdAt, expiresAt }`, doc
  `docs.world.org/world-id/idkit/integrate`). Flujo: `GET /onboarding/world-id/session` acuña un
  nonce de un solo uso con TTL 10 min y lo ata a la `action`; el cliente abre el WebView con ese
  nonce; en el callback el cliente reenvía **solo** el nonce emitido (nunca uno inyectado en la
  URL); `POST /onboarding/verify-world-id` valida el nonce contra el ledger en memoria (existe /
  no gastado / no expirado / action coincide) **antes** de tocar la API de World, lo marca usado,
  y arma el body v4 `protocol_version:"3.0"` (`{ nonce, action, allow_legacy_proofs:true,
  responses:[{ identifier, merkle_root, nullifier, proof, signal_hash? }] }`, doc
  `docs.world.org/api-reference/developer-portal/verify`). Se descartó el flujo de redirect
  `id.worldcoin.org/verify` clásico porque no transporta ni devuelve un nonce; el URL hospedado
  con params `nonce/signature/created_at/expires_at` es la variante más simple que Expo soporta
  (solo WebView, sin Dev Client). **Firma del nonce:** hoy es un HMAC propio (sin deps nuevas)
  porque sin Sandbox no hay `WORLD_RP_SIGNING_KEY` ni `rp_id` reales — `mintNonceSignature` es el
  costurón para cambiar a `@worldcoin/idkit-core/signing` cuando lleguen. Tests: `gateway` unit +
  fuzz + invariant (2 invariantes duras: el cliente/WebView nunca marca `verified` por su cuenta;
  un nonce que no coincide con el emitido siempre se rechaza y nunca llega a World) y `app`
  unit + invariant equivalentes. **Qué NO se pudo verificar sin el Sandbox:** el round-trip real
  del proof contra `developer.world.org/api/v4/verify/{rp_id}` (shape de `proof`/`identifier`
  exactos, si `allow_legacy_proofs` basta, si el hosted flow acepta esos param names). Script de
  humo listo: `node scripts/world-verify-smoke.mjs [proof.json]` con el gateway corriendo — paso 1
  (sesión) siempre corre, paso 2 (verificación + replay) corre con un proof real de IDKit.
  **Actualización `2026-09-05`:** enrollment al World ID Sandbox solicitado para
  `bankingluisalejandro@gmail.com`, iOS (TestFlight) y Android (Google Play internal test) — ambas
  solicitudes en estado "pending", aprobación por correo de Tools for Humanity todavía no llega.
  Primer intento de contacto rebotó (`sandbox.access@toolsforhumanity.org` no resuelve; dominio
  real es `toolsforhumanity.com`), reenviado a la dirección correcta. Bloquea el cierre final de
  este bloque y el de "Riesgo Expo Go" de abajo hasta que llegue la aprobación — con el nonce ya
  en código, lo único que falta aquí es correr el script de humo. Vars nuevas en
  `backend/.env`: `WORLD_RP_ID`, `WORLD_RP_SIGNING_KEY`, `WORLD_ENVIRONMENT` (ver
  `backend/.env.example`).

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
  para no violar el descalificador #2. Formas candidatas a validar con el equipo antes de tocar
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
  confirme con el equipo como real (no hipotética) y se re-puntúe en `brainstorming.md` §4.

- [ ] **Ledger — $5,000, 2 pistas (AI Agents x Ledger $3.5k + Continuity $1.5k).** Prerrequisito:
  **Ledger Key Ring CLI** (`wallet-cli ring`) del Ledger Agent Stack, publicado 2026-09-03 en
  developers.ledger.com/ethonline — instalar y generar/importar una cuenta de firma dedicada a este
  track. Regla dura ya anotada: el Key Ring **no puede competir** con la wallet del facilitador de
  Hedera x402 (`brainstorming.md` línea 443) — necesita un rol de firma distinto y real (ej. firmar
  el lado Arc/on-chain del respaldo), no una segunda wallet decorativa. **Si esto no se resuelve
  (CLI instalado + rol de firma no-conflictivo definido), no podemos avanzar** con este bloque —
  se descarta antes que forzar una integración pegada que viole el descalificador #2.
  - `2026-09-06` — **Decisión escogida (slice B de §10.4):** `wallet-cli ring` v2.1.0 es el
    backend de los secretos del gateway vía `backend/src/key-ring.ts` (`resolveSecret`), con
    fallback a `process.env` (cero ruptura con `KEY_RING_ENABLED` ausente). `config.ts` resuelve
    `CREVA_SERVICE_REFRESH_TOKEN`, `FACILITATOR_AUTH_TOKEN`, `HEDERA_PAYER_PRIVATE_KEY`,
    `WORLD_API_KEY`, `ARC_SIGNER_PRIVATE_KEY` por ahí. Rol = custodia de secretos en reposo, NO
    una segunda wallet (respeta §8.1). Tests unit+fuzz+invariant verdes. **BLOCKED** el paso
    end-to-end: `wallet-cli ring init` exige dispositivo Ledger físico. Detalle operativo en
    `docs/integrations/ledger-keyring.md`. Rama `sponsor-ledger-keyring`.

- [ ] **Privy — $5,000, 2 pistas (B2B financial product $2.5k + Best financial flow $2.5k).**
  Prerrequisito: cuenta Privy + `defineChain` de viem con chain ID **296** (Hedera) y su JSON-RPC
  Relay, porque Privy no trae Hedera preconfigurada (`brainstorming.md` línea 336-337). Depende de
  que el bloque Arc/wallet-layer de arriba exista primero — no tiene sentido antes. **Si el chain
  296 custom no queda configurado y probado contra el Hedera JSON-RPC Relay real, no podemos
  avanzar** con este bloque.


## Variables de entorno por patrocinador — falta configurar

Checklist de cuentas/API keys que hay que crear y meter en el `.env` correspondiente antes de que
cualquier bloque de arriba pueda ejecutarse. `backend/.env.example` y `frontend/.env.example` ya
declaran las de Hedera/World actuales; lo nuevo por patrocinador:

| Patrocinador | Variable(s) nuevas | Dónde | Fuente/cómo se obtiene |
|---|---|---|---|
| Hedera *(ya existe, confirmar valor real)* | `HEDERA_PAYER_ACCOUNT_ID`, `HEDERA_PAYER_PRIVATE_KEY`, `FACILITATOR_AUTH_TOKEN`, `FACILITATOR_FEE_PAYER`, `PAY_TO_ADDRESS` | `backend/.env` | Cuenta testnet ya creada en `portal.hedera.com` (`brainstorming.md:396`) — la private key se coloca directo en `.env`, nunca por chat |
| World *(ya existe, pendiente sandbox)* | `WORLD_API_KEY`, `WORLD_APP_ID`, `EXPO_PUBLIC_WORLD_APP_ID` | `backend/.env`, `frontend/.env` | Developer Portal de World — bloqueado por aprobación de Tools for Humanity (ver bloque de arriba) |
| Arc (Circle) | `ARC_RPC_URL`, `ARC_NETWORK` (testnet/mainnet), `CIRCLE_AGENT_STACK_API_KEY`, cuenta/wallet de firma para el evento de respaldo | por definir (`backend/.env` o nuevo `arc/.env`) | Cuenta Circle Developer + Arc testnet faucet |
| Uniswap Foundation | Ninguna API key — es contribución al stack, no runtime | — | Repo del stack de Uniswap a definir |
| Bazantic | `BAZANTIC_GATEWAY_URL`, `BAZANTIC_MCP_TOKEN` | `backend/.env` | Signup en Bazantic — **confirmar que existe**, no está indexado públicamente hoy |
| Ledger | Config del Key Ring CLI (no es una env var de app, es estado local del CLI: `~/.ledger/` o similar) | Máquina del agente que firma, no `.env` del repo | `wallet-cli ring` del Ledger Agent Stack |
| Privy | `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, RPC URL de Hedera para `defineChain(296, ...)` | `backend/.env` o `frontend/.env` | Dashboard de Privy |
| Chainlink | `REGULATORY_ALERT_REGISTRY_ADDRESS`, `REGULATORY_REPORTER` (opcional) | `backend/.env` | `REGULATORY_ALERT_REGISTRY_ADDRESS` sale del deploy de `RegulatoryAlertRegistry`; `REGULATORY_REPORTER` es la dirección del consumer de Chainlink Functions (default: el signer). El Upkeep se registra en automation.chain.link — pasos en `docs/integrations/chainlink-automation.md` |

**Ninguna de estas API keys/private keys se pega en el chat** — se colocan directo en el
`.env` que corresponda; una dirección pública o un tx hash sí son seguros de compartir por chat.

## Cerrados

- [x] `2026-09-06` — **`ScoreScreen` deja de ser el stub mínimo: muestra el score real, no un
  `74` hardcodeado (`feature-scorescreen-real`, off `origin/main` `29b635f`).** El blocker
  documentado en `docs/memoria.md` (`2026-09-05`, paridad ScoreGauge) decía "necesita `score.get()`
  con factors + recommendations + `crevaScore.disclosure()`, y `/score` no está expuesto en el
  gateway". **Decisión escogida:** el score se obtiene **core-directo**, no por el gateway — es
  exactamente el patrón que `DashboardScreen.tsx` ya usa. Evidencia archivo:línea:
  `frontend/lib/api.ts:7` (`BASE = process.env.EXPO_PUBLIC_API_URL`, el backend Clerk del core),
  `frontend/lib/api.ts:312` (`score.get()` = `request<ScoreData>('/score')` → `${BASE}/score`),
  `frontend/lib/api.ts:89-96` (adjunta `Authorization: Bearer <clerk token>` de `sessionSource`, la
  identidad del usuario, nunca una estática), `frontend/features/dashboard/DashboardScreen.tsx:55-69`
  (mismo `score.get()` directo con loading/error). `backend/src/index.ts` solo tiene
  `/creva-score/{report,verify,anchor}` (x402 + identidad de servicio) — no hay `/score` ni hace
  falta: el score es por-cuenta y necesita la identidad Clerk del solicitante, que en core-directo
  se conserva. **No se tocó el gateway.** `ScoreScreen.tsx` reconstruida contra
  `creva_finance/frontend/app/score/page.tsx`: título "Score Creva" (`page.tsx:97`), gauge `ring`
  con el valor real (`page.tsx:106`), factores "De dónde sale tu score" (`page.tsx:110-154`),
  "Qué puedes hacer" (recomendaciones, `page.tsx:156-168`), "Sigue por aquí" (`NEXT_STOPS`,
  `page.tsx:170-176`), disclosure "qué no hace este puntaje" (`page.tsx:180-210`), back + "Ayuda
  sobre tu score" (`page.tsx:95-102`). Estados loading (spinner, `testID="score-loading"`) y error
  (mensaje visible, `testID="score-error"`, nunca un número inventado) igual que `DashboardScreen`.
  `App.tsx` cablea `onBack`→home y `onOpenHelp`→`/help/score/como-se-calcula`.
  **Verify:** `npx tsc --noEmit` limpio; `npx jest` → 68 suites / 309 tests verdes (antes 64/295;
  +5 suites nuevas en `test/{unit,fuzz,invariant}/score/`, +14 tests: render real, loading/error,
  invariante "core-directo, nunca identidad de servicio", fuzz "pinta exactamente el score de la
  API, nunca un número en el error"). **Falta:** render lado a lado real (mismo bloqueo
  `react-native-web` del resto del repo); score real contra un core desplegado con sesión Clerk
  real (sin backend en esta sesión — los tests mockean `score.get()` en la frontera de red).

- [x] `2026-09-06` — **`QueryScreen` ya recoge los datos del negocio del usuario, se acabó el
  `BUSINESS_NAME` hardcodeado (`feature-query-business-form`, off `main` 7638dbb).** El flujo
  "Consulta pagada" tenía `const BUSINESS_NAME = "Panaderia La Espiga"` y lo mandaba a
  `requestSignal` en el trigger y en el reintento de pago. Ahora la fase `idle` muestra un campo
  de nombre (`TextField`) + selector de estado (`SelectField` con el catálogo INEGI de
  `mx-states.ts`), prefill desde `profiles.getFiscal()` igual que
  `creva_finance/frontend/app/business-verification/page.tsx:63-72`; validación de nombre
  (trim > 1, como `page.tsx:236`); el botón de consulta se deshabilita sin nombre válido.
  `requestSignal({ businessName, stateCode })` recibe lo que escribió el usuario
  (`gatewayClient.ts` `RequestSignalInput` ya lo aceptaba). Módulo puro nuevo
  `frontend/features/query/business-input.ts` (`isValidBusinessName`, `toStateCode`, `buildSignalInput`,
  `STATE_OPTIONS`) para poder testear unit+fuzz+invariant. **El ciclo x402, el `pay-button` y el
  sellado no se tocaron.** Tests: `test/unit/query/business-input.spec.ts`,
  `test/fuzz/query/business-input.fuzz.spec.ts`,
  `test/invariant/query/business-input-only-real-state-codes.invariant.spec.ts` (invariante:
  `requestSignal` nunca recibe un `state_code` fuera del catálogo INEGI). `tsc` limpio; `jest`
  sin regresión. **No se verificó:** el gateway real contra un `businessName`/`stateCode` variable
  (sin entorno de backend/facilitador en esta sesión); ni el render nativo (segunda vista visual
  sigue siendo de la sesión 2). **Nota de colisión:** un agente de fondo (`sponsor-privy-wallet`)
  toca el área del `pay-button` de esta misma pantalla — este cambio se mantuvo en la sección de
  inputs para que el Solver reconcilie ambos limpio.
- [x] `2026-09-06` — **Wiring de la app para el `onchain` trust signal de `/verify`
  (`feature-verify-onchain-wiring`, off `worktree-agent-add968ba3a6440026` @ f9457c8).** El agente
  de attestation dejó el contrato + subgraph + enriquecimiento del gateway (`creva-proxy.ts` agrega
  `onchain` a la respuesta de `/creva-score/verify`) y el render en `VerifyReportCard` (ya acepta
  `onchain?`), pero sin cablear la app. Hecho aquí, **solo app**:
  - `frontend/lib/api.ts`: nuevos tipos `OnchainTrustSignal` + `OnchainAttestation`;
    `CertificateVerification` gana `onchain?: OnchainAttestation | null` + `onchainError?`.
  - `frontend/features/verify/onchain.ts` (nuevo, módulo puro): `parseOnchain(raw)` normaliza el bloque
    — `trustSignal` fuera de los 3 valores, contadores no numéricos, o input no-objeto → `null`, así
    un bloque malformado nunca llega a `VerifyReportCard` (que haría `TRUST_COPY[bad].label` → crash).
  - `frontend/features/verify/sealClient.ts`: la rama 200 pasa el body por `parseOnchain(body.onchain)`.
  - `frontend/features/verify/VerifyScreen.tsx`: `onchain={result.verification.onchain}` a `VerifyReportCard`.
  - Tests: `test/unit/verify/onchain-wiring.spec.ts`, `test/fuzz/verify/onchain.fuzz.spec.ts`,
    `test/invariant/verify/onchain-never-fabricates-trust.invariant.spec.ts` (invariante espejo del
    `onchain-never-overrides-core-verdict` del gateway: la app nunca sube la confianza desde un
    bloque ausente/malformado).
  - **No se tocó** contrato, subgraph ni gateway. `tsc` limpio; `jest` full-run 255/255 en la
    corrida limpia (los 2 flakes `auth-gate`/`help-search` aparecen bajo carga, pasan aislados; las
    4 suites de `verify` verdes: 22/22). Base de la rama antes del cambio: ~54 suites.
  - **No verificado:** el `/verify` real enriquecido contra un subgraph indexado (mismo bloqueo de
    deploy que el bloque abierto de attestation); render nativo (sesión 2). La rama de attestation
    está basada en `9dfdd57`, `main` en `7638dbb` — el Solver reconcilia la divergencia al mergear
    ambas juntas.
- [x] `2026-09-06` — **Chainlink — GO. `RegulatoryAlertRegistry` + `/regulatory/pending` + workflow
  CRE que produce cambio de estado on-chain (pista Upgrade $500).** El prerrequisito ("un contrato
  on-chain real de Creva") lo resolvió el bloque de attestation (`AttestationRegistry`, `f9457c8`).
  Entregado: contrato `contracts/src/RegulatoryAlertRegistry.sol` con `checkUpkeep`/`performUpkeep`
  (interfaz Automation) + suite Foundry unit+fuzz+invariant verde (12 tests nuevos, 19 en total, sin
  regresión en `AttestationRegistry`); invariante clave "performUpkeep solo cambia estado si
  checkUpkeep devolvió true con ese mismo payload". Endpoint read-only `GET /regulatory/pending` en
  `backend/src/regulatory.ts` (radar del core + folios del subgraph, try/catch total) + tests
  unit/fuzz/invariant. Demo local anvil del ciclo `reportPending → checkUpkeep → performUpkeep` con
  los eventos `RegulatoryFlag` y `normFlagged=true` verificados on-chain — evidencia en
  `docs/integrations/chainlink-automation.md`. Decisión escogida: **CRE Confidential Workflows ($2k)
  evaluado y descartado sin forzar** — el path de datos radar→folios es deliberadamente no sensible
  (invariante `radar-carries-no-personal-data` en el core), un TEE handler ahí sería teatro.
  Pendiente operativo: desplegar a Sepolia, registrar el Upkeep en automation.chain.link,
  fijar el forwarder (pasos exactos en el doc de integración). NO verificado: el workflow CRE real
  contra Chainlink (necesita cuenta del humano); el endpoint contra el `/creva-score/radar` real
  (probado solo con radar mockeado — el token de servicio puede no satisfacer el `JwtAuthGuard` del
  core, degradaría a `radarError` sin tumbar nada).

- [x] `2026-09-06` — **Integración de la familia de paridad móvil a `main` (Solver, worktree
  `integration-mobile-parity`): 5 ramas mergeadas `--no-ff`, VERIFY completo verde. Verificado por
  lectura de código + compilación + tests; NO por comparación visual (ver bloque abierto de arriba,
  owner sesión 2).** Ramas integradas en este orden: `feature-mobile-native-parity` (13 commits, 13
  pantallas reales que reemplazan `StubScreen`: datos personales, info fiscal, seguridad,
  movimientos, estados de cuenta, avisos, radar regulatorio, reporte, garantía, verificación de
  negocio, calculadora, aviso de privacidad + wiring de borrado de cuenta), `feature-nav-parity-render`,
  `feature-more-sheet-parity`, `feature-dashboard-parity`, `feature-scoregauge-parity`.
  **Descartada:** `codex/mobile-parity-delete-account` — solo aportaba la dependencia
  `react-native-web` (+ un pin de `react-dom`) y docs de auditoría no load-bearing, con conflicto en
  `docs/memoria.md`; se deja fuera para que la decisión sobre `react-native-web` en `main` se tome
  aparte (afecta a la rama en vuelo de la sesión 2). **`react-native-web` NO queda en `main`.**
  **Conflictos resueltos a mano** (el resto auto-merge, incluido `App.tsx`, `package.json` y
  `package-lock.json`): `Icon.tsx` — las 3 ramas que tocaban la misma línea `const common`
  triplicaron su comentario de `fill="none"`; se dejó uno (el código era idéntico en las tres).
  `VisualPrimitives.tsx` — `Card` quedó duplicada: `feature-mobile-native-parity` añadía
  `tone?: "default"|"highlight"`, `feature-dashboard-parity` añadía `size?: "sm"|"md"|"lg"` +
  `border-border`; fusionadas en una sola `Card` con ambos props (`fix: reconcile Card tone+size`).
  `docs/plan.md`/`docs/memoria.md` reconciliados a la unión de todas las ramas; los ~17 bloques
  por-incremento que vivían en §Abiertos se consolidan en esta entrada (el detalle por pantalla —
  qué NO se verificó de cada una — queda en `docs/memoria.md`).
  **VERIFY (árbol integrado, worktree fresco):**
  - `frontend/`: `npm install`; `npx tsc --noEmit` → **0 errores**; `npx jest unit fuzz invariant` →
    **51 suites limpias / 236 tests**; 234 pasan en la corrida completa, los 2 restantes
    (`test/unit/auth/auth-gate.spec.ts`, `test/unit/help/search.spec.ts`) hacen timeout solo bajo
    carga full-run y pasan **5/5 aislados** — flake de `act()`/timing ya documentado, reproducido y
    confirmado, no es regresión.
  - `backend/` (sin cambios en esta integración, corrido igual): `npx tsc --noEmit` → 0;
    `npx eslint .` → 0; `npx vitest run --exclude "test/integration/**"` → **17 archivos / 44
    tests** verdes.
  **NO verificado:** render nativo / comparación visual lado a lado de las 13 pantallas + 4 ajustes
  (bloqueo `react-native-web`/NativeWind: `TypeError: Class extends value undefined`) — bloque
  abierto arriba, owner sesión 2; Expo Go en dispositivo físico real (sin hardware, igual que el
  resto del repo). Merge fast-forward a `main` sin `--amend`/`rebase`/force. Ramas de la familia
  seguras de borrar del remoto una vez confirmado el push.

- [x] `2026-09-05` — **Wallet Hedera de demo cableada en `QueryScreen.tsx` (worktree/branch
  `feature-hedera-mobile-signer`): decisión tomada con el equipo, opción (b) — signer
  demo-scoped, no wallet real por usuario.** Investigación previa a tocar código, según
  `brainstorming.md`/`docs/plan.md`: se confirmó que `@hashgraph/sdk` publica un build oficial
  para React Native (`package.json`'s campo `"react-native"` → `lib/native.js`, `NativeClient` +
  `NativeChannel`) — la hipótesis inicial de que el SDK Node-oriented no correría en Expo era
  parcialmente incorrecta para el caso real que hacía falta: **congelar y firmar una
  `TransferTransaction` nunca abre una conexión de red** (`.execute()` sí, `.freeze()`/`.sign()`
  no), y la liquidación real ya la hace el facilitador vía HTTP (`backend/src/facilitator.ts`'s
  `/verify`/`/settle`), no la app — así que el riesgo de gRPC/Dev Client que motivó rechazar la
  opción (a) (wallet real por usuario) no aplicaba al alcance real de este bloque, solo a
  `execute()`, que este bloque nunca llama.
  **Opción elegida y por qué:** (b) — un keypair de testnet demo-scoped vía
  `EXPO_PUBLIC_HEDERA_DEMO_ACCOUNT_ID`/`EXPO_PUBLIC_HEDERA_DEMO_PRIVATE_KEY`, documentado como
  clave de demo compartida, nunca la wallet real de una usuaria — decisión tomada, con la
  razón explícita de que (a) hubiera arriesgado días de trabajo de Dev Client tan cerca del Q&A
  del 09/14, y (b) ya entrega el ciclo x402 real completo con el mismo criterio de disciplina de
  gasto que Arc-anchor y el facilitador de Hedera.
  **Nuevo `frontend/features/query/hederaPayment.ts`:** `buildSignedPaymentHeader(requirements,
  credentials)` espeja `backend/src/hedera-signer.ts`'s `buildSignedPaymentHeader` pero sin
  `Client`/red — construye la `TransferTransaction`, la congela con `setNodeAccountIds([0.0.3])`
  y `TransactionId.generate(payerId)` (sin necesitar un `Client` conectado), la firma, y arma el
  payload x402 v2 (`accepted`/`payload.transaction`) igual que el lado gateway.
  `readDemoCredentialsFromEnv()` lee las dos env vars nuevas, `undefined` si falta cualquiera.
  **`QueryScreen.tsx`'s `pay()` reescrito:** ya no reintenta ciegamente sin `X-PAYMENT` — llama
  `buildSignedPaymentHeader` con `pendingPayment.accepts[0]` y las credenciales del entorno, y
  adjunta el header real a `requestSignal`. Si las credenciales no están configuradas, muestra ese
  gap real ("No hay una billetera Hedera de demo configurada"), nunca un pago simulado.
  **Polyfills nuevos** (`frontend/polyfills.ts`, importado primero en `index.ts`): `Buffer` global y
  `react-native-get-random-values`, ambos ya dependencias transitivas de
  `@hiero-ledger/cryptography` (dependencia real de `@hashgraph/sdk`) — se promovieron a
  dependencias directas del `frontend/package.json` en vez de dejarlas implícitas.
  **`jest.config.js`:** `transformIgnorePatterns` extendido (no reemplazado) para incluir
  `@hashgraph`/`@hiero-ledger`, porque su build de React Native se publica como ESM sin
  transformar en `node_modules`, igual que el resto del ecosistema RN que el preset de
  `jest-expo` ya cubre.
  **Verify:** `tsc --noEmit` limpio. `npx jest unit fuzz invariant` → **41 suites/176 tests**
  verdes (antes 37/165; +3 suites nuevas: unit + fuzz + invariant de `hederaPayment`, siguiendo el
  mismo patrón que `backend/test/unit/hedera-signer.spec.ts` — keypair generado en el test, nunca
  contra red real). `npx expo export --platform ios` bundló limpio con el SDK real incluido
  (**1764 módulos**, antes 1345–1516 en los cierres previos — el salto viene de
  `@hashgraph/sdk`+`@hiero-ledger/cryptography`), un solo warning benigno de resolución de
  subpath de `@noble/hashes` (fallback a resolución por archivo, sin error). `dist/` del export
  borrado tras verificar; sin servidor Metro corriendo al terminar (`netstat` confirma sin puertos
  8081/8098 en `LISTENING`).
  **Actualización `2026-09-05` (segunda pasada) — credenciales colocadas por el humano en
  `frontend/.env`, ciclo ejercido contra el gateway real: firma correcta, liquidación bloqueada por un
  gap de configuración pre-existente del gateway, no del signer nuevo.** `jest`/`jest-expo` resultó
  no servir para esta verificación: su `fetch` global (implementación nativa de RN, sin runtime
  nativo real bajo Jest) nunca completa una petición de red real — `.status` vuelve `undefined` —
  así que `frontend/test/integration/live-app-payment.spec.ts` se escribió, se confirmó inútil para
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
     `facilitator.ts` de `backend/src/config.ts:8` cae a ese default porque **`FACILITATOR_URL` no
     está seteada en `backend/.env`** (sí está declarada en `backend/.env.example` con
     `https://api.testnet.blocky402.com`, pero el `.env` real no la tiene). El rechazo de red no
     estaba en un `try/catch` en `backend/src/facilitator.ts`'s `verifyPayment`, así que se
     propagó como unhandled rejection y **tumbó el proceso del gateway entero** — no solo esa
     request. Confirmado reproducible: reinicié el gateway (`npx tsx src/index.ts`, capturando
     log) y crasheó exactamente igual en el mismo punto.
  **Diagnóstico, no arreglado:** esto es un gap de configuración/hardening del **gateway
  existente** (`FACILITATOR_URL` sin valor real + falta de manejo de error en
  `facilitator.ts`), no del bloque de signer de esta sesión — el signer cumplió su parte (firma
  válida, 402→firma correcta). No se tocó `backend/.env` (el humano coloca esa URL, no un agente)
  ni se cambió `facilitator.ts` sin permiso explícito, para no ensanchar el alcance de este bloque.
  **Actualización `2026-09-05` (tercera pasada) — `FACILITATOR_URL`/`FACILITATOR_FEE_PAYER`/
  `X402_VERSION` colocados por el humano en `backend/.env`, ciclo completo verificado en vivo con
  liquidación real, más dos bugs reales de `hederaPayment.ts` encontrados y corregidos en el
  camino.** Con `FACILITATOR_URL` real, el `/verify` empezó a devolver errores de validación
  concretos del facilitador en vez de crashear — cada uno diagnosticado con el mismo script suelto
  contra el gateway real más un segundo script que replica `facilitator.ts` directo para aislar
  gateway vs facilitador:
  1. `extra should not be null or undefined` — `hederaPayment.ts`'s `accepted` payload nunca
     incluía `extra`, a diferencia de `backend/src/hedera-signer.ts`'s
     `toV2PaymentRequirements`, que siempre sintetiza uno. Corregido: `accepted.extra:
     requirements.extra ?? {}`.
  2. Con `FACILITATOR_FEE_PAYER` configurado, `accepted_payment_requirements_mismatch` — el 402
     real de `backend/src/index.ts` nunca exponía `extra.feePayer` en el `accepts[]` que el
     cliente recibe, así que la app no tenía forma de saber qué `extra` firmar. **Fix real en el
     gateway** (`backend/src/index.ts`, `facilitatorExtra()`): `reportRequirements`/
     `verifyRequirements` ahora incluyen `extra: { feePayer }` en el propio reto 402, para que
     cualquier cliente que firma su propio pago pueda leerlo y devolverlo tal cual.
  3. `invalid_exact_hedera_payload_fee_payer_mismatch` — `hederaPayment.ts` generaba el
     `TransactionId` con la cuenta del **pagador** (`payerId`), pero el facilitador exige que sea
     la cuenta del **fee-payer** (`backend/src/hedera-signer.ts` ya hacía esto bien con
     `config.facilitatorFeePayer`). Corregido: `TransactionId.generate(feePayer ?? payerId)`,
     leyendo `feePayer` del `extra` que ahora llega en la requirement (punto 2).
  4. Faltaban tres variables en `backend/.env` que sí estaban en `.env.example` pero nunca se
     habían poblado: `FACILITATOR_URL`, `FACILITATOR_FEE_PAYER`, `X402_VERSION` (sin la última,
     `facilitatorRequirements()` mandaba forma v1 — `maxAmountRequired` en vez de `amount` — al
     facilitador, que exige v2). El humano las colocó directamente en `backend/.env`.
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
  **Verify final:** `tsc --noEmit` limpio en `frontend/` y `backend/`; `npx jest unit fuzz invariant`
  en `frontend/` → 41/176 verdes (sin cambio de conteo, los fixes no agregaron casos nuevos, ya
  cubiertos por el fixture existente que sí incluye `extra`); `npx vitest run --exclude
  "test/integration/**"` en `backend/` → 16 suites/41 tests verdes (una corrida aislada mostró el
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
  serializa en la llamada. Nuevo `backend/src/creva-auth.ts` (`getCrevaAccessToken()`): cachea el
  access token en memoria (nunca en disco), decodifica su `exp` para saber cuándo caducó, y lo
  renueva vía `POST /auth/refresh` contra `config.crevaApiUrl` usando `CREVA_SERVICE_REFRESH_TOKEN`
  (nueva env var, placeholder en `backend/.env.example`) — rota el refresh token en cada llamada.
  `backend/src/creva-proxy.ts` adjunta `Authorization: Bearer <access token>` a toda request
  reenviada a Creva y responde 502 sin llamar a `fetch` si el token no se puede obtener (nunca
  reenvía sin auth). La cuenta de servicio la registró el humano directamente contra el backend real
  (producción, `https://creva-backend-c7as7id5jq-pv.a.run.app`) — ningún agente creó la cuenta ni la
  contraseña; solo se manejó el `refreshToken` ya emitido, pegado directo en `backend/.env`, nunca en
  el chat. Nota para la próxima sesión: el primer valor pegado en `CREVA_SERVICE_REFRESH_TOKEN` era
  en realidad el `accessToken` (JWT largo, ~826 caracteres) por error de copiado, no el `refreshToken`
  real (opaco, ~12 caracteres) — `/auth/refresh` lo rechazaba con 401 "Invalid or expired refresh
  token"; verificado aislando la llamada fuera de `creva-auth.ts` (curl directo) antes de asumir el
  código propio como culpable. **Verify:** `tsc --noEmit` limpio, `eslint` limpio, 40/41 tests pasan
  (unit + fuzz + invariant nuevos en `backend/test/{unit,fuzz,invariant}/creva-auth*` y
  `creva-proxy-always-authenticated.invariant.spec.ts`, más las suites preexistentes actualizadas
  para mockear `creva-auth.js`; el test #41 que falla intermitentemente — "Worker exited unexpectedly"
  de tinypool — ya fallaba igual en `main` sin tocar, confirmado corriendo la suite base). **Llamada
  real confirmada** vía `mcp__creva-score__creva_report` (`business_name: "Panadería La Espiga"`,
  `state_code: 14`, `document: true`, `embed: false`): folio
  `47AFE663-69F31F42-5D886F7A-3A89A4AC`, huella de integridad
  `e3983b07d610908e47dfdecc1300f1e350d02ee59085860bb7c5e3d406cb8dc9`, generado
  `2026-09-05T20:06:51.769Z`, PDF + HTML entregados en Descargas — sin error, sin necesidad de
  reintentos adicionales sobre el crédito de 0.30 USDC.

- [x] `2026-09-05` — **Web/mobile parity, pasada parcial (worktree `feature-web-parity-port`): sesión Clerk real cableada a `frontend/lib/api.ts`, score y nombre de usuario del dashboard ya no son hardcode. Deja abierto el resto del alcance grande de este bloque — ver detalle abajo.**
  Hallazgo de auditoría (no reportado en cierres previos): `frontend/lib/api.ts` exporta
  `setSessionSource`/`useClerkSessionSource` (`frontend/features/auth/session-source.ts`) desde el
  worktree `feature-ui-port-core-screens`, pero **nada en código de producción los llamaba** —
  solo los tests los invocaban directamente. Toda llamada real a `score.get()`/`crevaScore.*`
  habría salido sin `Authorization`, y el backend la habría respondido con 401. Corregido en
  `frontend/App.tsx`'s `AppFlow`: nuevo `useEffect` que registra `useClerkSessionSource()` vía
  `setSessionSource()` cuando `isSignedIn` es true, y lo limpia (`null`) en caso contrario —
  corre una sola vez en la raíz, cubre todas las pantallas sin duplicar el wiring por pantalla.
  **Ítem 3 del bloque original (score hardcodeado) resuelto:**
  `frontend/features/dashboard/DashboardScreen.tsx` ya no usa `useState(74)`; ahora llama
  `score.get()` de `frontend/lib/api.ts` (`GET /score`) en un `useEffect`, con estados reales de
  `scoreLoading` (spinner, `testID="dashboard-score-loading"`) y `scoreError` (mensaje visible,
  `testID="dashboard-score-error"`, nunca cae a un número inventado) — el `ScoreGauge` solo se
  renderiza con un valor real. **Ítem 4 (username hardcodeado "Ana") resuelto:** ya no recibe
  `userName` por prop con default `"Ana"`; usa `useUser()` de `@clerk/clerk-expo` directo
  (mismo patrón que `ProfileScreen.tsx:53-56`) y el saludo cae a `"Hola"` sin nombre cuando
  `firstName` es null, sin placeholder de persona.
  **Confirmado, no se encontró (ítem 7):** re-auditado `frontend/App.tsx` y `frontend/features/**` con
  grep de `gear|FAB|position.*absolute|zIndex` — cero resultados de un botón flotante de
  engranaje. Coincide con lo ya documentado en el cierre `feature-ui-audit-fix` (línea de abajo):
  no vive en este branch. Nada que remover.
  **Ítems 1/2 (iconos, estados de nav) no re-auditados icono-por-icono en esta pasada** — el set
  de `frontend/features/shared/icons/Icon.tsx` (21 glyphs) y el nav de 5 pestañas ya cerrados en
  `feature-nav-icon-fix` (ver más abajo) se dejaron como están; no se verificó de nuevo cada
  `d=` contra `creva_finance/frontend/components/BottomNav.tsx`/`HelpGlyph.tsx` línea por línea
  en esta sesión — pendiente para confirmar la cita exacta de cada glyph, en particular los 9
  ítems del sheet "Más" que el bloque original pedía citar uno por uno.
  **Ítems 5 y 6 NO abordados en esta pasada — quedan abiertos, con alcance real identificado:**
  `frontend/features/query/gatewayClient.ts` y `frontend/features/query/components/ReportPreviewCard.tsx`
  siguen usando datos mock (confirmado por grep), no `crevaScore.report()/.verify()/.radar()/
  .verification()/.disclosure()` de `frontend/lib/api.ts`; `frontend/features/help/HelpScreen.tsx` no tiene
  ningún `onChangeText`/filtro conectado a la caja de búsqueda — sigue inerte. Cablear ambos es
  trabajo real de UI + backend, no una corrección de una línea; no había presupuesto en esta
  sesión para hacerlo con el mismo estándar de "sin mock" que el resto del bloque exige.
  **Verify real de esta pasada:** `cd app && npm install` (worktree fresco, sin `node_modules`),
  `npm run typecheck` limpio, `npx jest test/unit test/fuzz test/invariant` → 36 suites/157 tests
  verdes (una corrida aislada mostró 1 falla transitoria en `test/unit/auth/auth-gate.spec.ts`
  con "render function has not been called" bajo carga de la suite completa; reproducido dos
  veces más y pasó las dos — flake de act()/timing bajo test-renderer, no relacionado con el
  cambio, coincide con el flake de `tinypool`/Jest ya documentado en el cierre de
  `feature-creva-service-identity`). `grep -rn "#[0-9A-Fa-f]\{3,6\}" frontend/features/` vacío.
  `npx expo export --platform ios` bundleó 1345 módulos sin error (4.2MB); Metro quedó corriendo
  en el puerto 8081 tras el export (proceso PID detectado con `netstat`), matado explícitamente y
  puerto confirmado libre. **No se corrió lint** — `frontend/package.json` no define un script `lint`.
  **Sin commitear ni pushear todavía la cobertura de tests nueva para este cambio puntual** — los
  36 suites existentes cubren el flujo de auth-gate que ya ejercía `DashboardScreen`, pero no hay
  un test nuevo que aserte específicamente el estado de loading/error del score ni que
  `setSessionSource` se registre al iniciar sesión; queda como deuda para el siguiente agente
  junto con los ítems 1/2/5/6 de arriba. **Sin verificar, como el resto del repo:** Expo Go en
  dispositivo físico real (sin hardware disponible en esta sesión).

- [x] `2026-09-05` — **Comprobar un reporte, cableado real (worktree `feature-report-wiring`):
  `frontend/features/query/**` y `frontend/features/verify/**` ya no usan datos mock — cierra los ítems 5/6
  dejados abiertos en el bloque anterior, con un ajuste de alcance real encontrado en el camino.**
  **Hallazgo previo a tocar código:** `frontend/lib/api.ts` ya tenía `crevaScore.{report,verify,
  verification,radar,disclosure}` completo y correcto como espejo de
  `creva_finance/frontend/lib/api.ts:726-752` — pero apuntan a `BASE` (`EXPO_PUBLIC_API_URL`, el
  backend principal con auth Clerk), y en este repo `/creva-score/report` y `/creva-score/verify`
  **no viven ahí**: viven en el gateway (`backend/src/index.ts:66-82`), gateados por x402
  (`backend/src/x402-gate.ts`), sin Clerk. `/creva-score/verification`, `/creva-score/radar` y
  `/creva-score/disclosure` **no existen en el gateway en absoluto** — solo report/verify están
  proxied (`backend/src/creva-proxy.ts`, autenticado server-side vía `getCrevaAccessToken()`, nunca
  un JWT estático). Cablear "Comprobar un reporte" contra `crevaScore.*` de `frontend/lib/api.ts` habría
  llamado un endpoint que no existe en este backend real; se optó por el mismo patrón ya usado por
  `frontend/features/onboarding/world-verify-client.ts` (cliente feature-local que habla directo con
  `EXPO_PUBLIC_GATEWAY_URL`, sin pasar por `request()` de `lib/api.ts`) en vez de forzar el atajo
  de Clerk sobre un endpoint x402. `frontend/lib/api.ts` no se tocó — sus tipos (`SealedReport`,
  `CertificateVerification`, etc.) sí se reutilizan desde los nuevos clientes.
  **`frontend/features/query/gatewayClient.ts` reescrito:** `requestSignal(input, paymentHeader?)`
  hace `POST ${EXPO_PUBLIC_GATEWAY_URL}/creva-score/report` real; sin `paymentHeader` el gateway
  real siempre responde 402 con `accepts` real (`backend/src/x402-gate.ts:16-27`); con un
  `X-PAYMENT` responde el `SealedReport` real y el settlement de `X-PAYMENT-RESPONSE` si viene.
  **`frontend/features/query/components/ReportPreviewCard.tsx` reescrito** para el `SealedReport` real
  en vez del mock `{businessName, signalsFound, sources}`: layout calca
  `frontend/components/report/ReportPaper.tsx:35-51` (fila de KPIs: señales / señales propias del
  negocio / fuentes), `ReportPaper.tsx:62-79` (chip de tono por señal) y
  `ReportPaper.tsx:108-115` (bloque "qué NO acredita" = `certificate.does_not_prove` +
  `disclosure.does_not_estimate`) — condensado para tarjeta de teléfono, no la hoja completa de
  impresión.
  **`frontend/features/verify/sealClient.ts` reescrito por completo:** el mock anterior simulaba un
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
  producir un `X-PAYMENT` real — eso requiere una billetera Hedera firmando (`backend/src/
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
  `backend/.env`. Nuevo `backend/src/arc-anchor.ts`: `anchorReportHash(canonicalHash, signer, rpcUrl,
  network)` valida el hash contra `/^0x[0-9a-fA-F]{64}$/` (nunca construye wallet/provider si es
  inválido — esa es la invariante dura) y envía una transacción de valor cero, auto-dirigida, con
  el hash como `data`, firmada con `ARC_SIGNER_PRIVATE_KEY` (el mismo rol de "quien paga el gas" que
  el facilitador de Hedera). Nueva ruta `POST /creva-score/anchor` en `backend/src/index.ts`
  (`{ canonicalHash }` → `{ anchored, txHash, explorerUrl, network }`, 400 si el hash es inválido,
  503 si el signer no está configurado). **Verify:** `tsc --noEmit` limpio; 34/34 tests pasan
  (unit + fuzz + invariant nuevos en `backend/test/{unit,fuzz,invariant}/arc-anchor*`, más las 11
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
  `feature-nav-icon-fix`): 15 hallazgos de la auditoría UI cerrados.** `frontend/App.tsx`'s `TabBar`
  pasó de 2 pestañas (Inicio/Perfil) a las 5 del objetivo (Inicio, Score, Tarjeta, Crédito, Más).
  **Actualización — decisión escogida 2026-09-06 con el equipo tras ver el render
  (`feature-last-screens-parity`):** la pestaña Tarjeta es tocable y abre el flujo de tarjeta
  completo (`CardScreen`: estado vacío + emisión + freeze + movimientos, gateado por KYC;
  `CardCreateScreen`; `VirtualCard`). Ya no hay badge "PRONTO" ni pestaña deshabilitada. "Más" abre
  `frontend/features/more/MoreSheet.tsx` ("Todo lo
  demás"), 11 ítems: Mi perfil/Ayuda navegan a `ProfileScreen`/`HelpScreen` existentes sin
  duplicarlas, los otros 9 (Movimientos, Calculadora, Estados de cuenta, Tu garantía, Sello de tu
  negocio, Reglas que te afectan, Tu reporte, Avisos, Aviso de privacidad) van a `StubScreen.tsx`
  genérico con copy tomado de `frontend/lib/help-content.ts` donde existe artículo. Set de iconos SVG
  compartido en `frontend/features/shared/icons/Icon.tsx` (21 glyphs, `react-native-svg` recién
  instalado vía `npx expo install`), paths copiados de
  `creva_finance/frontend/components/BottomNav.tsx`/`components/help/HelpGlyph.tsx` donde existían;
  colores resueltos desde `tailwind.config.js` (`theme-colors.ts`), cero hex nuevo en
  `frontend/features/`. **Decisión escogida:** Score y Crédito son pantallas mínimas reales nuevas
  (`ScoreScreen.tsx`/`CreditScreen.tsx`) que enlazan a `QueryScreen`/`VerifyScreen` respectivamente
  sin repurposearlas — ambas mantienen su identidad y entradas actuales. Los 9 callbacks no-op que
  la auditoría encontró (Dashboard: notificaciones/crédito/tarjeta; Profile: 5 filas de menú; Help:
  artículo/categoría) quedan todos cableados a una pantalla real. `DeleteAccountScreen.tsx` dedicado
  para "Eliminar mi cuenta" (no borra nada real, solo explica el canal de correo de
  `help-content.ts`). **Verify:** `tsc --noEmit` limpio; `jest unit+fuzz+invariant` → 36 suites/157
  tests verdes (antes 33/147, +10 tests nuevos: `test/unit/nav/structure.spec.ts`,
  `test/unit/more/structure.spec.ts`, `test/unit/shared/no-emoji.spec.ts`); `grep` de hex y de
  emoji sobre `frontend/features/` ambos vacíos; `npx expo start` bundleó `ios` sin error (CI mode,
  HTTP 200, ~9.7MB), servidor detenido y puerto confirmado libre con `netstat`. **Falta:** Expo Go
  en dispositivo físico real, mismo motivo que el resto del repo (sin hardware disponible). Detalle
  completo, incluida la lista de los 15 hallazgos y su resolución uno a uno: `docs/memoria.md`.

- [x] `2026-09-05` — **Auditoría UI/UX completa (worktree `feature-ui-audit-fix`): 6 hallazgos
  cerrados en el mismo lote.** (1) Bug de auth en reload corregido: `App.tsx`'s `AppFlow` ahora
  gatea la pantalla inicial en `useAuth()` real de Clerk (`isLoaded`/`isSignedIn`) en vez de
  `useState<Step>("sign-in")` fijo — una sesión activa + reload va directo a `home`, nunca vuelve a
  mostrar sign-in. (2) Paleta unificada: `frontend/tailwind.config.js` gana los 10 grupos de color
  `--cr-*` de `creva_finance/frontend/app/globals.css` (valores del `:root` claro, hardcodeados
  porque NativeWind no soporta custom properties CSS); los ~168 literales hex que había en
  `frontend/features/**` quedaron reemplazados 1:1 por esos tokens — `grep -rn
  "#[0-9A-Fa-f]\{3,6\}" frontend/features/` da vacío, sin excepciones. (3) Back button: `frontend/features/
  shared/BackButton.tsx` (nuevo, recreando `components/BackControl.tsx` de creva_finance) agregado
  a `SelfieCheckScreen`, `QueryScreen` y `VerifyScreen` — las tres pantallas sin tab bar; `SignInScreen`
  se deja sin back a propósito (pantalla de entrada, sin "antes" al que volver). (4) **Decisión
  bottom-nav-scope, reafirmada:** onboarding/query/verify se quedan de pantalla completa sin tab
  bar (flujos secuenciales de una sola tarea, no se quiere permitir saltar a Perfil a medio Selfie
  Check o a medio pago x402); dashboard/profile/help mantienen la tab bar mínima que ya tenían.
  (5) Afordancia "(?)": auditoría completa con `grep -rn "❓" frontend/features/` — un solo resultado
  (`ProfileScreen.tsx:68`), ya cableado a `onOpenHelp`/`setStep("help")`, confirmado funcionando,
  no se tocó. Ningún otro hallazgo. (6) Español: único archivo con copy en inglés real era
  `SelfieCheckScreen.tsx` (estados `identity_unavailable`/`idle`/`failed`/`verifying`) — traducido;
  sanity-check final con grep de palabras inglesas comunes sobre todo `frontend/features/**/*.tsx` no
  encontró copy visible restante (solo identificadores de código). Test de regresión real
  (no source-regex, a diferencia del resto de `test/unit/**`) en
  `frontend/test/unit/auth/auth-gate.spec.ts`: renderiza `App.tsx` completo con Clerk mockeado en sesión
  activa, confirma que `SignInScreen` nunca se monta. **Verify:** `tsc --noEmit` limpio;
  `jest unit fuzz invariant` → 33 suites/147 tests (antes 32/146) verdes; `grep` de hex vacío;
  `npx expo start` bundleó `ios` sin error (1332 módulos, HTTP 200), servidor detenido y puerto
  liberado (confirmado con `netstat` tras matar el proceso Node hijo, no solo el shell). **Falta:**
  Expo Go en dispositivo físico real — sin hardware disponible en esta sesión, mismo motivo que el
  resto del repo. Detalle completo, incluida la lista exacta de literales hex reemplazados y un
  incidente de git ajeno a este bloque (resuelto sin dejar rastro): `docs/memoria.md`.

- [x] `2026-09-05` — **Dashboard/Profile/Help Center screens ported, real Clerk sign-in screen
  added (worktree `feature-ui-port-core-screens`).** `frontend/features/dashboard/DashboardScreen.tsx`,
  `frontend/features/profile/ProfileScreen.tsx` y `frontend/features/help/HelpScreen.tsx` portan la
  estructura visual NativeWind de `creva_finance/frontend/app/{dashboard,profile,help}/page.tsx`
  (score primero + una sola acción siguiente en dashboard, menú de configuración en profile,
  buscador + más-preguntado + temas en help), reusando `frontend/features/query/components/
  VisualPrimitives.tsx` y `ScoreGauge.tsx` en vez de duplicarlos, y `frontend/lib/{help-content,
  reminders,format-money,score-display}.ts` ya portados. `frontend/features/help/components/
  {HelpGlyph,HelpSearch}.tsx` recrean los equivalentes de `components/help/*` con emoji en vez de
  SVG (mismo criterio que `ScoreGauge` de no añadir dependencia SVG nueva). Dashboard y Profile
  usan datos mock/estado local (igual que `QueryScreen`), no llaman a `frontend/lib/api.ts` — cablear
  datos reales queda fuera de este bloque. `frontend/features/auth/SignInScreen.tsx` es construcción
  nueva (no un port 1:1, porque `/login` de creva_finance solo redirige al formulario alojado por
  Clerk en web, sin equivalente en Expo): usa `useSignIn`/`useSignUp`/`useSSO` reales de
  `@clerk/clerk-expo` contra el contexto que ya monta `ClerkAppProvider.tsx` (no tocado), con
  estilo NativeWind recreando el lenguaje visual de `components/auth/*` (marca, GoogleButton,
  AuthDivider, campo de contraseña con ojo). Tests nuevos en `frontend/test/unit/{dashboard,profile,
  help,auth}/**` (10 specs, 146 tests totales en el repo tras el cambio) — mismo patrón de
  inspección de fuente por regex que `frontend/test/unit/query/safe-area.spec.ts`, porque
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

- [x] `2026-09-04` — **Scaffold monorepo + 4 ramas feature + integración + roles v2.** `frontend/`
  (Expo/NativeWind) y `backend/` (Node/Express) creados, mergeados a `main`; las 4 ramas
  (`feature-gateway-x402`, `feature-selfie-check`, `feature-agent-loop`, `feature-logic-port`)
  reconciliadas por el Solver en `integration-solver` y mergeadas a `main`. Modelo de roles
  actualizado a v2 (Main instruye, Solver mergea/pushea él mismo, Auditor revisa después) —
  `AGENTS.md` §Colaboración. Detalle completo: `docs/memoria.md`.

- [x] `2026-09-04` — **Estructura de tests `unit`+`fuzz`+`invariant` en `frontend/` y `backend/`.**
  Aplicada a las 4 ramas y a `feature-agent-loop`'s tests movidos de `__tests__/` legacy. Estado
  final: `frontend/` 20 suites/104 tests, `backend/` 7 suites/18 tests.

- [x] `2026-09-04` — **Puerto de la capa de lógica de `creva_finance` a `frontend/lib/`.** 9 archivos
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
  (`backend/test/integration/create-payto-account.spec.ts`), usada como `PAY_TO_ADDRESS` —
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
  filtrado en sí (`searchHelp` en `frontend/lib/help-content.ts:490-504`) ya existía y ya estaba
  probado a nivel de contenido (`frontend/test/unit/help-content.spec.ts`); lo que faltaba era prueba
  de que el componente `HelpSearch`/`HelpScreen` realmente lo conecta al input. Coincidencia con
  la referencia: `creva_finance/frontend/components/help/HelpSearch.tsx` filtra en cada
  `onChangeText` (sin debounce) contra `title + question + answer + keywords`, resultado como
  `MenuRow href=...` (líneas 83-88); el puerto usa la misma función `searchHelp` (AND de términos,
  normaliza acentos/mayúsculas con `fold()`) y ahora los resultados son `Pressable` que navegan
  con `onOpenArticle`, igual que el `href` de la referencia. Estado vacío ya existía
  ("No encontramos nada con esas palabras."). Se corrigió `frontend/test/unit/help/structure.spec.ts`
  (buscaba el string literal `<HelpSearch>`, que dejó de existir al agregarse la prop
  `onOpenArticle`) y se agregó `frontend/test/unit/help/search.spec.ts` con render real de `HelpScreen`
  (palabra conocida filtra, gibberish muestra vacío, borrar restaura la lista, tocar un resultado
  llama a `onOpenArticle`). Se descubrió en el camino que `@testing-library/react-native@14` volvió
  `render` async — no documentado en ningún test existente del repo, ahora sí en este. Verify:
  `npm run typecheck` limpio; `npm test -- unit fuzz invariant` en 37 suites/161 tests (antes
  36/157), todo verde incluida `auth-gate.spec.ts` que fallaba de forma intermitente en el mismo
  arranque en frío. `npx expo export --platform ios` empaqueta limpio (1345 módulos, 4.2MB);
  dispositivo físico sigue pendiente por lo ya documentado (Expo Go no probado en hardware real).

- [x] `2026-09-05` — **Auditoría de citación del set de iconos (`frontend/features/shared/icons/Icon.tsx`)
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
    `frontend/profile/page.tsx:43-49` tiene su propio escudo-outline sin check ni candado → nuevo icono
    `security` con ese path exacto.
  - `ProfileScreen.tsx` fila "Información fiscal": usaba `statement` (documento con líneas) pero
    `frontend/profile/page.tsx:33-40` usa un documento de esquina doblada sin líneas → nuevo icono
    `fiscal` con ese path exacto.

  **Sin cambio (ya citaban exacto):** `home`, `score`, `card`, `credit`, `more`, `bell` (todos
  `BottomNav.tsx`, tabs principales), `profile` (`BottomNav.tsx:94`), `statement`
  (`NAV_GLYPHS['/statements']`, `BottomNav.tsx:89`), `key`/`seal`/`registry`/`shield` (post-fix)
  (`HelpGlyph.tsx`), `back-chevron` (`components/BackControl.tsx:20-29`), `collateral`
  (`BottomNav.tsx:90`), `calculator` (`NAV_GLYPHS['/calculator']`, `BottomNav.tsx:88`).

  **Sin referencia en creva_finance (documentado, no inventado):** `logout` en
  `ProfileScreen.tsx:107` sí tiene contraparte — el botón "Cerrar sesión" de
  `frontend/profile/page.tsx:123-132` (path+polyline+line consolidados en un solo `<Path>` equivalente,
  ya coincidía). Ningún icono del set quedó sin cita tras esta pasada.

  **Fix de estado activo del nav** (`frontend/App.tsx`, `TabBar`): antes solo cambiaba el color del
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
  - `grep -rn "#[0-9A-Fa-f]\{3,6\}" frontend/features/` — vacío.
  - `npx expo start --port 8098` + `curl .../index.bundle?platform=ios&dev=true` → HTTP 200,
    log del bundler: `iOS Bundled 16192ms index.ts (1516 modules)`, `hasError: false`. Sin
    dispositivo físico disponible (pendiente, igual que el resto del port — ver `docs/memoria.md`).
    Puerto 8098 liberado y confirmado con `netstat` tras `taskkill` tras la verificación.

  Archivos tocados: `frontend/features/shared/icons/Icon.tsx`, `frontend/features/more/stub-topics.ts`,
  `frontend/features/profile/ProfileScreen.tsx`, `frontend/App.tsx`, `frontend/test/unit/nav/structure.spec.ts`,
  `frontend/test/unit/icons/citation.spec.ts` (nuevo).

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
