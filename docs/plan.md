<!-- docs/plan.md: bloques de trabajo con criterio de aceptación, abiertos vs cerrados, para la
     preparación de ETHOnline 2026. No es la bitácora (docs/memoria.md tiene el qué-se-hizo/qué-no-
     se-verificó) ni el brainstorming (brainstorming.md tiene el análisis; aquí solo el checklist
     accionable). Se actualiza en el mismo lote que cualquier cambio de estado. -->

# Plan — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Última actualización:** 2026-09-06 (mecanismo load-bearing de The Graph: contrato AttestationRegistry + subgraph + trustSignal on-chain en `/verify` — código y VERIFY local verdes, deploy a testnet pendiente del humano)

Ver [`brainstorming.md`](../brainstorming.md) §8 y §9 para el análisis completo. Detalle de
qué-se-hizo/qué-no-se-verificó por sesión: [`docs/memoria.md`](memoria.md). Esta tabla es solo el
checklist.

## Abiertos

- [ ] **2026-09-06 — Auditoría app↔core (`feature-app-core-api-wiring`). Un solo gap real de
  endpoint + 5 métodos muertos en `app/lib/api.ts`.** Toda `app/lib/api.ts` va **directo al core**
  (`BASE = EXPO_PUBLIC_API_URL ?? http://localhost:3000`, `api.ts:7`) con el bearer de la sesión
  Clerk (`request()` en `api.ts:80-95` via `session-source`). **Ningún método de `api.ts` pasa por
  el gateway x402** — el gateway solo lo usan `QueryScreen`→`gatewayClient.ts` y
  `VerifyScreen`→`sealClient.ts` para el flujo de reporte pagado; nada personal necesita el
  gateway. Todos los controllers del core usan `JwtAuthGuard` (verificado contra
  `creva_finance/backend/src/modules/*/*.controller.ts`).
  **Tabla (método → endpoint → ¿existe en core? → estado app):**
  - `score.get` → `GET /score` → sí (`score.controller.ts:13`) → **real** (DashboardScreen; `score/`
    es de otra sesión, solo se lee, no se tocó).
  - `kyc.apply`/`kyc.status` → `POST /kyc/apply`,`GET /kyc/status` → sí (`kyc.controller.ts:22,28`)
    → **real** (KycFormScreen, CardScreen, CardCreateScreen).
  - `collateral.get` → `GET /collateral` → sí (`collateral.controller.ts:17`) → **real**
    (CollateralScreen; + DashboardScreen ahora).
  - `credit.eligibility/recommend/select/updateSelection` → `/recommendations/credit*` → sí
    (`recommendations.controller.ts:25,30,39,55`) → **real** (CreditScreen, NotificationsScreen,
    DashboardScreen).
  - `credit.selections` → `GET /recommendations/credit/selections` → sí (`:50`) → **no llamado**.
  - `recommendations.get` → `GET /recommendations` → sí (`:20`) → **no llamado**.
  - `declarations.latest/create` → `/declarations` → sí (`declarations.controller.ts:14,19`) →
    **real** (CreditRequestForm).
  - `statements.list/summary/entries/reclassify/remove/upload` → `/statements*` → sí
    (`statements.controller.ts:29-62`) → **real** (StatementsScreen, MovementsScreen,
    NotificationsScreen, DashboardScreen).
  - `transactions.list` → `GET /transactions` → sí (`transactions.controller.ts:21`) → **real**
    (MovementsScreen; + DashboardScreen ahora).
  - `calculator.get` → `GET /calculator` → sí (`calculator.controller.ts:14`) → **real**
    (CalculatorScreen).
  - `profiles.get/update/getFiscal/updateFiscal` → `/profiles[/fiscal]` → sí
    (`profiles.controller.ts:15-30`) → **real** (PersonalData, FiscalInfo, CreditRequestForm).
  - `crevaScore.radar` → `GET /creva-score/radar` → sí (`creva-score.controller.ts:26`) → **real**
    (RegulatoryScreen).
  - `crevaScore.verify` → `POST /creva-score/verification` → sí (`:32`) → **real**
    (BusinessVerificationScreen).
  - `crevaScore.report` → `POST /creva-score/report` → sí (`:40`) → **real, directo al core**
    (ReportScreen). Nota: distinto del flujo x402 de `QueryScreen`.
  - `crevaScore.disclosure` → `GET /creva-score/disclosure` → sí (`:21`) → **no llamado**.
  - `crevaScore.verifyReport` → `POST /creva-score/verify` → sí
    (`report-verification.controller.ts:16`) → **no llamado** (VerifyScreen usa `sealClient.ts` vía
    gateway x402).
  - `auth.me/forgotPassword/sendPhoneCode/verifyPhoneCode` → `/auth/*` → sí (`auth.controller.ts`)
    → **real** (CreditScreen, SecurityScreen).
  - `auth.register/login/getOAuthUrl/deleteMe` → `/auth/*` → sí → **no llamado** (mobile usa Clerk
    end-to-end para auth).
  - **`cards.list` → `GET /cards` → NO EXISTE en el core** (`cards.controller.ts` solo tiene
    `POST /cards/issue`, `GET /cards/:id`, `PATCH /cards/:id/(un)freeze`). Lo llaman `CardScreen`
    y ahora también el web-dashboard; hoy cae al `.catch` → estado "Sin tarjetas aún". Efecto
    secundario: sin `list` no hay `id`, así que `cards.get/:id`, `freeze` y `unfreeze` son
    inalcanzables para una tarjeta ya emitida.
  **Pendiente:** (1) `GET /cards` en el core — **código hecho directo en el repo `creva_finance`,
  commit listo para el humano** (`cards.service.listCards()` + `@Get()` en `cards.controller`,
  `test/unit/cards.service.spec.ts` nuevo, `tsc`+`jest cards` verdes); falta que el humano lo
  commitee/despliegue y ajustar el tipo `api.ts` `cards.list` (declara camelCase, el core devuelve
  snake_case `VirtualCardRow[]` — sin interceptor de transform en `backend/src/main.ts`).
  (2) limpiar o cablear los 5 métodos muertos de `api.ts` (`recommendations.get`,
  `credit.selections`, `crevaScore.disclosure`, `crevaScore.verifyReport`,
  `auth.register/login/getOAuthUrl`).

- [ ] **2026-09-06 — Veredicto de auth Clerk↔core (análisis estático de `creva_finance/backend`).
  El core NO aceptaría hoy el token de Clerk que manda la app; el código ya lo soporta, falta
  config de deploy.** La app manda `Authorization: Bearer <clerk session token>` (`app/lib/api.ts`
  vía `session-source`). Tres puertas en `jwt.guard.ts`, cada una un bloqueo duro:
  1. `AUTH_PROVIDER` default = `supabase` (`config/configuration.ts:15`). Con `supabase`,
     `jwt.guard.ts:56-59` manda el token a `supabase.admin.auth.getUser` → rechaza un JWT de Clerk
     → `401 "Invalid or expired token"` (`jwt.guard.ts:71`). Confirmado contra el deploy con un
     token basura (sin token real).
  2. El verifier de Clerk requiere `CLERK_SECRET_KEY` + (`CLERK_JWKS_URL`/`CLERK_ISSUER`)
     (`configuration.ts:147-161`); la factory `CLERK_TOKEN_VERIFIER` (`auth.module.ts:19-21`)
     devuelve `null` si faltan.
  3. Aun con 1+2 OK, sin fila de mapeo Clerk↔Supabase (`mapping.resolveClerkSub`, `jwt.guard.ts:117`)
     → `401 UNLINKED_CLERK_ACCOUNT` (`:118`). La fila la crea `POST /webhooks/clerk` en
     `user.created` (`clerk-webhook.controller.ts:33`).
  **Fix = config de deploy, NO código:** `AUTH_PROVIDER=both` + claves/JWKS de Clerk +
  `CLERK_AUTHORIZED_PARTY` en el core desplegado; webhook de la instancia Clerk de creva-sealpay a
  `/webhooks/clerk` con `CLERK_WEBHOOK_SECRET`; backfill de identidades.
  **Decisión escogida (humano, 2026-09-06):** mientras la config de deploy no aterrice, la app
  muestra un estado "backend pendiente" — *"Estás dentro. Tu información de Creva se conecta
  pronto."* — en cada sección que llama al core y recibe un 401 con token adjunto
  (`api.ts` `isBackendUnlinked` / `ApiError.backendUnlinked`; componente
  `app/features/shared/BackendPendingState.tsx`; wireado en Dashboard/Score/Credit/Card/Statements
  en la rama `feature-backend-pending-state`). La **confirmación en vivo de la config de auth**
  queda explícitamente diferida — sin token real de Clerk contra el deploy hasta que el humano
  decida. Mientras el deploy siga en `AUTH_PROVIDER=supabase`, todo el wiring directo-al-core está
  inerte contra el backend real y las pantallas muestran ese estado.

  **WIRE hecho (`feature-app-core-api-wiring`, ya en `main`):** `DashboardScreen` deja de usar mocks — `collateral.get()` →
  capacidad de gasto real; `credit.eligibility()` + `statements.list()`/`summary()` → inputs
  reales de `buildReminders` (la campana ya no inventa un conteo); `transactions.list({limit:3})`
  → actividad reciente real (se borró `MOCK_TRANSACTIONS`). `cardReady` queda en `false` honesto
  hasta que exista `GET /cards`. **Colisión con `feature-visual-fixes-1`:** esa rama también toca
  `DashboardScreen` (el fix `Hola,` + inputs de `buildReminders` a `null`) — este wire lo
  reemplaza con la versión real; el Solver se queda con esta al reconciliar.
- [ ] **2026-09-06 — Privy: capa de wallet aditiva para el pago x402 + `defineChain(296)`
  (worktree `sponsor-privy-wallet`, rama off `origin/main`, NO pusheada).** Slice C de §10.4.
  Cubre las 2 pistas de Privy ($2.5k B2B financial product + $2.5k best financial flow) con una
  integración. **Hecho y verificado en local:**
  - `defineChain(296)` con viem (`app/features/wallet/privyChain.ts`) + lectura on-chain real
    contra el Hedera JSON-RPC Relay (Hashio testnet, `https://testnet.hashio.io/api`). Respuesta
    real: `eth_chainId` = `0x128` (296), `eth_blockNumber` ≈ `40171461`, `eth_getBalance` de
    `0x…0002` = `33896519248405508330000000000` weibar. Script:
    `node app/features/wallet/smoke-read-chain.mjs`. Test opt-in:
    `RUN_HEDERA_RELAY_TEST=1 npx jest hedera-relay-read`.
  - `usePaymentWallet()` (`app/features/wallet/PrivyWalletProvider.tsx`) con modos `demo` | `privy`.
    `demo` delega **verbatim** en `buildSignedPaymentHeader` / `readDemoCredentialsFromEnv` sin
    tocar `hederaPayment.ts`. `privy` aplica una política de gasto (tope mensual + tope por pago,
    en tinybar) ANTES de construir cualquier header — eso es el "B2B financial product".
  - Selector de wallet en `QueryScreen` y `VerifyScreen` (default `demo`, se oculta si solo hay
    una opción). `PrivyWalletProvider` montado en `App.tsx`.
  - Tests: 7 suites nuevas en `app/test/{unit,fuzz,invariant}/wallet/**`. 3 invariantes:
    "sin `EXPO_PUBLIC_PRIVY_APP_ID` el modo privy no aparece y el demo es idéntico",
    "signPayment nunca produce header por un monto que exceda la política",
    "`hederaPayment.ts` no cambia (git diff vs origin/main vacío)".
  - VERIFY: `npx tsc --noEmit` 0 · `npx jest` 68 suites / 300 tests, 0 fallos (1 skip opt-in).
  **Decisión escogida:** NO se agregó `@privy-io/expo` a `package.json` — su set de peers nativos
  (`react-native-passkeys`, `permissionless`, `expo-crypto/linking/clipboard/application`,
  `@privy-io/expo-native-extensions`, `react-native-qrcode-styled`) es riesgo real para el
  `npm install` del path congelado de Hedera. Solo entró `viem` (que Privy ya usa). El adaptador
  del SDK (`app/features/wallet/privyEmbeddedWallet.ts`) hace `require` perezoso y defensivo: hasta
  que el humano instale el SDK, `loadPrivyExpo()` devuelve `null` y el modo privy no aparece.
  **Falta (bloqueado sin cuenta Privy real):** crear la app en el dashboard de Privy, instalar el
  SDK, y cablear `makePrivySigner` (provisión de la embedded wallet para chain 296 + firma del
  payload x402 vía el provider EIP-1193). Ver `docs/integrations/privy-hedera.md`. Env vars que
  el humano debe crear: `EXPO_PUBLIC_PRIVY_APP_ID`, `EXPO_PUBLIC_PRIVY_CLIENT_ID`,
  `EXPO_PUBLIC_PRIVY_MONTHLY_CAP_TINYBAR`, `EXPO_PUBLIC_PRIVY_PER_PAYMENT_CAP_TINYBAR`,
  `EXPO_PUBLIC_HEDERA_JSON_RPC_URL` (opcional, default Hashio). `PRIVY_APP_SECRET` es server-side y
  no se usa en este slice.

- [ ] **2026-09-06 — COORDINACIÓN: `app/features/help/**` reasignado a la sesión "1 UI/UX"
  (`feature-last-screens-parity`).** El humano lo reasignó el 2026-09-06 tras comparar las
  pantallas de Ayuda nativas contra la web y verlas a medio construir. Sale del área
  `codex/mobile-parity-help` — ese worktree Codex **no debe editar `app/features/help/**` mientras
  este bloque esté abierto** (regla §Colaboración punto 7). Se avisó al Main orchestrator por
  mensaje. Gap concreto: `HelpArticleScreen.tsx` (50 líneas) vs
  `creva_finance/frontend/app/help/[category]/[article]/page.tsx` (105) — faltan la sección "Cómo
  se hace" con `Steps`, la card "Ten en cuenta" (`surface-2`), el botón CTA `resolvedBy` (va a la
  pantalla que resuelve la duda), la lista "Otras de este tema" (`relatedArticles`), el footer, y
  usa `<View>` en vez de `<ScrollView>`. `HelpScreen`/`HelpCategoryScreen` con huecos análogos
  (tiles "Lo que más se pregunta", descripciones por tema). `app/lib/help-content.ts` ya está
  portado — es port de contenido, mismo método que las 13.
  - **`HelpArticleScreen` — hecho.** Reconstruida al nivel de
    `help/[category]/[article]/page.tsx`: `<ScrollView>` (antes `<View>`, cortaba artículos
    largos), `answer` como párrafo lead, sección "Cómo se hace" con pasos numerados en círculo,
    card "Ten en cuenta" (`tone="highlight"` = `surface-2`), botón CTA `resolvedBy`, lista "Otras
    de este tema" (`relatedArticles`), y el footer de contacto de privacidad. `App.tsx`:
    `openHelpResolve(href)` mapea los 14 `resolvedBy.href` posibles a steps/stubs del router
    nativo; `onOpenArticle` para las relacionadas. Test nuevo
    `app/test/unit/help/article-parity.spec.ts` (verifica las 6 secciones + que ningún href
    quede sin ruta). `tsc` limpio; `jest` 58 suites / 256 tests.
  - **`HelpCategoryScreen` + `HelpScreen` — hecho (un commit, cambios acoplados).**
    `HelpCategoryScreen`: `<ScrollView>`, `HelpSearch` del índice completo arriba de la lista
    (search nunca se limita a una categoría, como el frontend), y cada fila muestra
    `article.question` + `article.answer` como descripción (antes solo la pregunta). Todas las filas
    ruteadas vía `onOpenArticle(articleHref(...))` — mismo handler que el índice.
    `HelpScreen`: tiles "Lo que más se pregunta" a 4-en-fila (`flex-1`, como `<Stack columns={4}>`
    de `help/page.tsx:29`); cada fila de tema con el badge de icono `38px rounded-xl surface-2` de
    `MenuRow.tsx:33-46`. Test nuevo `app/test/unit/help/index-and-category-parity.spec.ts`.
    `tsc` limpio; `jest` 59 suites / 261 tests. **Ayuda: las 3 pantallas al nivel de la web.**

- [ ] **2026-09-06 — Migración: últimas 4 pantallas del inventario (`feature-last-screens-parity`,
  off `main` 93616fa).** Alcance aprobado por el humano el 2026-09-06 (las 4, revirtiendo la
  decisión previa de "credit/card mínimas a propósito"). Mismo método que las 13 anteriores: leer
  la fuente web, portar a RN, citas `archivo:línea`, tests, `tsc`+`jest` verde antes de entregar.
  Batch marcado **code-verified-only** — la segunda vista visual va junto con las otras 17 cuando
  la sesión 2 desbloquee el render (`react-native-web`/NativeWind).
  - **`auth` — hecho.** `SignInScreen.tsx` ya era un formulario Clerk-expo hecho a mano (la fuente
    `creva_finance/frontend/app/sign-in/[[...sign-in]]/page.tsx` envuelve el widget hosted `<SignIn>`
    de Clerk, sin build Expo). Delta real = copy del chrome Creva: título/subtítulo por modo
    alineados a `components/auth/AuthHeader.tsx:26-27` ("Iniciar sesión" / "Tu plataforma
    financiera") y `app/sign-up/[[...sign-up]]/page.tsx:11` ("Crear cuenta" / "Empieza a tomar el
    control"); cross-link del footer a `sign-in/page.tsx:33` ("Crear cuenta" / "Iniciar sesión").
    **Fuera de alcance:** el `DemoOverlay` "Ver el recorrido" (tour grabado, feature aparte) y el
    wordmark a color de Google (media de terceros, prohibido por AGENTS.md — se queda la "G" plana).
    Test nuevo `app/test/unit/auth/auth-parity.spec.ts`. `tsc` limpio; `jest` 54 suites / 240 tests
    (auth-gate.spec.ts es el flake documentado de full-run, pasa aislado). Antes: 53 / 236.
  - **`kyc` — hecho (decisión del humano 2026-09-06: portar el form, NO reemplazar World).**
    `KycFormScreen.tsx` nuevo (`app/features/onboarding/`), puerto de
    `creva_finance/frontend/app/kyc/page.tsx`: form nombre/apellido/CURP/email/teléfono →
    `kyc.apply()` de `app/lib/api.ts` (ya existía). Estados loading/form/processing/pending/verified/
    unavailable con el copy del frontend (`page.tsx:150-236`). Regex CURP y formateo de teléfono en
    `app/features/onboarding/kyc-format.ts`, portados 1:1 de `page.tsx:80` y `:90-93`.
    `authorization_url` → `WebBrowser.openBrowserAsync` (`expo-web-browser`, ya era dependencia),
    luego poll de `kyc.status()`. `App.tsx`: paso `"kyc"` nuevo, **después** de `SelfieCheckScreen`
    (`onVerified`/`onSkipped` → `setStep("kyc")` → `KycFormScreen` → `home`). **World Selfie Check
    no se tocó.** Tests unit + fuzz + invariant (`test/unit/onboarding/kyc-form.spec.ts`,
    `test/fuzz/onboarding/kyc-format.fuzz.spec.ts`,
    `test/invariant/onboarding/curp-never-false-positive.invariant.spec.ts`). `tsc` limpio; `jest`
    57 suites / 253 tests. Prefill de email/nombre desde `useUser()` de Clerk + `profiles.get()`.
    **No se verificó:** `kyc.apply`/`kyc.status` contra `/kyc/*` real (sin backend), ni el retorno
    del `WebBrowser` tras completar la verificación externa.
  - **`credit` — hecho.** `CreditScreen.tsx` reconstruida del stub mínimo ("Próximamente") al
    flujo completo de `app/credit/page.tsx`: gate de contacto (enlace de correo vía
    `auth.forgotPassword` + verificación de teléfono con código vía
    `auth.sendPhoneCode`/`verifyPhoneCode`), la petición de 4 pasos, las opciones con cada
    criterio del match visible (`FactorMark` → círculo ✓/!), y las 4 ramas de resultado
    (ok/insufficient_data/no_match/not_eligible) + la elección con gate de KYC opcional
    (`credit.select`/`updateSelection`). `CreditRequestForm.tsx` nuevo — puerto de
    `components/credit/RequestForm.tsx` (532 líneas): 4 pasos (negocio / ingresos 3 meses /
    gastos 3 meses / solicitud), prefill de `profiles.getFiscal()` + `declarations.latest()`,
    salto directo al paso 4 si la última declaración cubre los 3 meses actuales, guarda
    `profiles.updateFiscal` + `declarations.create` antes de `onSubmit`. `<Chip>` del frontend →
    `ChipRow` local (pressables redondeados en `flex-wrap`); `<Consent>` → checkbox pressable.
    `App.tsx`: `CreditScreen` ahora recibe `onOpenKyc` (→ paso `"kyc"`) y `onOpenStatements`
    (→ `openStub("statements", "credit")`); se conservó `onOpenVerify` (el puente a VerifyScreen).
    Test nuevo `app/test/unit/credit/structure.spec.ts`. `tsc` limpio; `jest` 60 suites / 270 tests.
    **Fuera de alcance:** el `DemoOverlay`, el header con barra de progreso `step 5/6` visual
    (se puso "Paso N de 6" en texto), y el `RequestForm` no usa `Field`/`FieldGroup`/`ScreenHeader`
    del frontend (no existen en la app). **No se verificó:** ninguno de los endpoints de crédito
    contra el backend real (sin credenciales).
  - **`card` — hecho (revierte la decisión "tab Tarjeta deshabilitado a propósito").**
    `CardScreen.tsx` del stub "PRONTO" (38 líneas) al puerto de `app/cards/page.tsx` +
    `app/cards/[id]/page.tsx` (el límite y el freeze se pliegan en la misma pantalla — una sola
    tarjeta, sin ruta de detalle aparte): `cards.list()` → tarjeta activa con `VirtualCard`,
    `cards.get(id)` para `spendingLimit`, `cards.freeze/unfreeze`, `transactions.list({limit:20})`,
    y estado vacío que ramifica según `kyc.status()` (→ crear tarjeta o → completar KYC).
    `CardCreateScreen.tsx` nuevo — puerto de `app/card-create/page.tsx`: emite con `cards.issue({})`
    al montar (tras confirmar KYC), estados checking/kyc-pending/creating/ready/error con las ramas
    409/400. `VirtualCard.tsx` nuevo — cara de tarjeta nativa (el gradiente CSS del web se aplana al
    token `bg-crimson`; overlay "Congelada").
    `App.tsx`: **tab "Tarjeta" habilitado** (`step: "card-info"`, sin `disabled`), paso
    `"card-create"` nuevo, `"card-info"` en `TAB_STEPS` (mantiene el bottom nav visible),
    `isTabActive` cubre `card-info`/`card-create`. `CardScreen` recibe `onOpenCreate`/`onOpenKyc`.
    Test nuevo `app/test/unit/card/structure.spec.ts`; `app/test/unit/nav/structure.spec.ts`
    actualizado (el test "Tarjeta disabled/PRONTO" ahora verifica que es ruta viva).
    `tsc` limpio; `jest` 61 suites / 276 tests. **No se verificó:** endpoints de tarjeta contra el
    backend real; que la emisión real requiera colateral/KYC aprobados (ramas 400/409 portadas de
    memoria del frontend, no probadas).
  - **`QueryScreen` business-data form (5º ítem del Main) — NO construido.** Sigue pendiente de
    confirmación explícita del humano (ver bloque arriba). El humano autorizó "seguir con las
    pantallas pendientes" pero no respondió específicamente a este ítem; se deja como estaba.
  - **Fix aparte (no era del inventario):** `MoreSheet.tsx` — `w-[calc(50%-4px)]` en la celda no lo
    evalúa NativeWind, dejaba la celda sin ancho y ocultaba la etiqueta (reportado con captura por
    el humano 2026-09-06). Cambiado a `w-[48%]`; regresión en `test/unit/more/structure.spec.ts`.
- [ ] **2026-09-06 — The Graph, forma load-bearing (slice D de §10.4): código completo, deploy a
  testnet + deploy del subgraph pendientes del humano (worktree `agent-add968ba3a6440026`).**
  Mecanismo: `contracts/AttestationRegistry.sol` (`attest(bytes32 folioHash)` → evento
  `Attested` indexable, sin owner/fondos/upgrade) + `subgraph/` (indexa `Attested` en
  `FolioAttestation { attestationCount, distinctAttesters, first/lastAttestedAt }`) +
  `gateway/src/creva-proxy.ts` agrega a `/creva-score/verify` un bloque `onchain` con
  `trustSignal` = `corroborated` (`distinctAttesters >= 2`) / `attested` (`>= 1`) / `unattested`
  (`0`). `gateway/src/arc-anchor.ts` ahora llama `registry.attest(canonicalHash)` en vez de la tx
  valor-0 sin log; invariante de validación de hash intacta. El veredicto de contenido/firma del
  core sale TAL CUAL al lado; subgraph caído → `onchain: null` + flag, core intacto, proceso vivo.
  Detalle y comandos: [`docs/integrations/onchain-attestation.md`](integrations/onchain-attestation.md).
  **VERIFY local verde:** `contracts` `forge test` 7/7 (unit+fuzz+invariant); `gateway` `tsc`/
  `eslint` limpios, `vitest` 20 archivos/56 tests; `subgraph` `graph codegen && graph build` ok;
  `app` `tsc` limpio, `jest` verify 15/15 (los 2 flakes de `auth-gate`/`help/search` bajo full-run
  ya documentados, no relacionados). Mecanismo demostrado en anvil local: 2 cuentas distintas
  atestiguan un folioHash → `attestationCount` 2, 2 logs `Attested`; e invariante del gateway
  prueba 0→`unattested`, 2→`corroborated`.
  **Pendiente del humano (no lo hace un agente local):** (1) `forge script script/Deploy.s.sol`
  a Arc testnet y a Sepolia — anotar direcciones + txs aquí; (2) poblar `REGISTRY_ADDRESS` y
  `SUBGRAPH_URL` en `gateway/.env`, y `address`/`startBlock` en `subgraph/networks.json`;
  (3) `graph deploy creva-attestations --network sepolia` con la deploy key del Studio;
  (4) demo real: 2 attests con 2 cuentas + `/verify` antes/después (evidencia a pegar aquí).
  **NO verificado:** deploy real a testnet, indexación real del subgraph, y el ciclo end-to-end
  contra el core real — todo bloqueado por no tener `.env`/claves/deploy key en el worktree del
  agente. El wiring de la app (`lib/api.ts` + `sealClient.ts` + `VerifyScreen.tsx`) **ya está
  hecho** — ver Cerrados `2026-09-06` (rama `feature-verify-onchain-wiring`).

- [ ] **2026-09-06 — Paridad móvil: segunda vista visual PENDIENTE (owner: sesión 2, "UI audit
  smoke test").** Las 13 pantallas nativas nuevas de `feature-mobile-native-parity` (datos
  personales, info fiscal, seguridad, movimientos, estados de cuenta, avisos, radar regulatorio,
  reporte, garantía, verificación de negocio, calculadora, aviso de privacidad + wiring de borrado
  de cuenta) y los 4 ajustes de paridad (`feature-nav-parity-render`, `feature-more-sheet-parity`,
  `feature-dashboard-parity`, `feature-scoregauge-parity`) están **mergeados a `main`** y
  verificados por **lectura de código + `tsc --noEmit` + `jest`/`vitest`** — ver Cerrados
  `2026-09-06`. **NO** verificados por render lado a lado contra `creva_finance/frontend`: bloqueo
  `react-native-web`/NativeWind (`TypeError: Class extends value undefined`). **No se afirma
  paridad visual en ninguna parte.** Pendiente: (1) certificación visual pantalla por pantalla
  cuando se resuelva el bloqueo de render — owner sesión 2; (2) alcance de `credit`/`card`/`kyc`/
  `auth` a decidir con el humano; (3) `kyc`/`welcome`/`auth/callback` sin evaluar contra su
  equivalente mobile. *(El sub-punto "el gateway no expone `/score`" se cerró el `2026-09-06`: el
  score es core-directo, el gateway no interviene — ver Cerrados.)*
  **Actualización 2026-09-06 — el bloqueo de render se resolvió; primera pasada visual de la
  sesión 2 hecha (~22 hallazgos).** Fixes VISIBLE + NITPICK aplicados en
  `feature-visual-fixes-1`:
  - `SelfieCheckScreen`: CTAs `bg-text` (negro) → `bg-crimson`; `BackButton` sale del contenedor
    centrado a top-left vía un helper `CenteredState` (como QueryScreen/VerifyScreen).
  - `DashboardScreen`: saludo `Hola` → `Hola,` con coma (ref `dashboard/page.tsx:199`); los inputs
    de `buildReminders` para crédito/estados de cuenta pasan de valores fabricados
    (`creditEligible: true`, `statementCount: 2`) a `null` — sin datos reales no se inventa un
    conteo, la campana no muestra badge y `mainAction` cae al fallback honesto "Mira qué mueve tu
    score" (ref `dashboard/page.tsx:188-189`).
  - `MovementsScreen` / `SegmentedField` compartido: `numberOfLines={1}` + `px-1` + `text-[13px]`
    para que las etiquetas no recorten el control a 375px.
  - `QueryScreen`: "Creva SealPay" (marca inventada) → "Creva".
  - `MoreSheet`: botón "Cerrar" nuevo (`onClose` → `home`), como el `BottomSheet` del frontend.
  - `DeleteAccountScreen`: título "Eliminar mi cuenta" → "Eliminar tu cuenta" + subtítulo del ref
    (`delete-account/page.tsx:30-31`).
  Tests: `test/unit/visual-fixes-1.spec.ts` + `test/invariant/dashboard-bell-honest.invariant.spec.ts`.
  `tsc` limpio; `jest` 66 suites / 300 tests.
  **Sigue abierto:** el render nativo lado a lado de todo (owner sesión 2); los hallazgos de sesión 2
  más allá de VISIBLE/NITPICK si los hubiera.

  **Actualización `2026-09-06` — sesión 2, worktree `audit-ui-smoke-test`: el bloqueo de render web
  ESTÁ RESUELTO; primera pasada visual hecha contra el main viejo (`8074021`); re-pasada contra el
  main nuevo bloqueada por inestabilidad de Metro en esta máquina. Findings only, ningún `.tsx`
  tocado.**

  **Render web — RESUELTO** (proof: `Web Bundled 8060ms index.ts (548 modules)`, bundle limpio, sin
  `Class extends value undefined`). El error NO era de `react-native-web`/NativeWind: era
  `@grpc/grpc-js` (arrastrado por `@hashgraph/sdk`) que referencia el módulo `events` de Node y
  truena en el runtime web de Metro. Fix en el worktree (sin commit — regla de agente local):
  - `npx expo install react-native-web react-dom` (el target web nunca se configuró).
  - `app/web-shims/hashgraph-sdk-web-stub.js` — stub que lanza; las pantallas auditadas nunca llegan
    al path de firma en web.
  - `app/web-shims/clerk-expo-web-stub.js` — el worktree no trae `app/.env`; sin
    `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` real `useAuth().isLoaded` nunca pasa a `true` y la app se
    queda en el loader de `App.tsx`. El stub reporta sesión cargada + sin autenticar.
  - `app/metro.config.js` — `resolver.resolveRequest` redirige `@hashgraph/sdk` y `@clerk/clerk-expo`
    a los stubs solo cuando `platform === "web"`; los bundles nativos no se tocan. Arrancar con
    `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<cualquier pk_test_...>` porque `ClerkAppProvider.tsx` lanza si
    la env var falta.
  - Ruido no bloqueante en web: `Cannot manually set color scheme … dark mode is type 'media'`
    (NativeWind v4); la app renderiza igual, emular `prefers-color-scheme: light` lo silencia.

  **Re-pasada contra el main nuevo — BLOQUEADA (entorno, no código).** Con `creva_finance` en `:3001`,
  el Metro de Codex en `:8081` y a ratos el de Expo Go corriendo a la vez, cada arranque de un 2º/3º
  Metro de Expo en esta máquina Windows se cuelga en "Starting Metro Bundler" indefinidamente
  (4 intentos; solo el 1er arranque en frío funcionó y dio el bundle de 548 módulos). Para la
  certificación pantalla por pantalla hace falta correr el Metro web del worktree solo.

  **Hallazgos de la 1ª pasada (contra `8074021`, pre-migración de las 13 pantallas; re-confirmar):**
  - **Icon set (`app/features/shared/icons/Icon.tsx`) RELLENO NEGRO** en toda la app (nav, MoreSheet,
    Profile, Help, Stub). La ref dibuja cada glyph como trazo (`stroke`, `fill="none"`,
    `stroke-width 1.7-1.8`) en `--cr-text-secondary` #6F675C — `components/BottomNav.tsx:24-72`,
    `components/help/HelpGlyph.tsx:6-8`, `app/profile/page.tsx:23-73`. Sistémico. (blocker)
  - Nav: glyph `score` es mancha sólida oscura (activa e inactiva); la ref es arco fino + aguja +
    punto — `components/BottomNav.tsx:39-44`. (blocker)
  - `ScoreScreen.tsx` no espeja `/score`: título "Tu score" vs "Score Creva", score hardcodeado
    `74`/"Bueno" sin sesión (ref: `0 de 100`, `app/score/page.tsx:52`), sin la lista "Sigue por
    aquí" (`app/score/page.tsx:26-50`), sin back ni botón de ayuda. (blocker)
  - `DeleteAccountScreen.tsx` no espeja `/profile/delete-account`: falta `Button href={MAILTO}`
    "Escribir el correo" (`app/profile/delete-account/page.tsx:63`) — afordancia central no
    accionable; no expone `privacidad@finarahub.mx`; título "mi" vs "tu cuenta" + subtítulo ausente
    (`delete-account/page.tsx:28-31`); paso 1 circular; falta lista "Qué se borra" y aviso
    anti-fraude. (blocker)
  - `DashboardScreen.tsx`: falta link "Ver por qué" junto a "Tu score" (`app/dashboard/page.tsx:216`);
    botón principal negro (`bg-text`) + "Ver mis opciones" donde la ref usa `Button` crimson +
    "Ver por qué" / "Mira qué mueve tu score…" (`dashboard/page.tsx:194-200`); tarjeta "Encuentra tu
    mejor opción" negra + link de texto donde la ref usa `ActionCard` con `--cr-gradient` + icono +
    chevron (`dashboard/page.tsx:233-247`); "Mis tarjetas" variante punteada donde la ref sin sesión
    muestra `tone="danger"` KYC-gate (`dashboard/page.tsx:268-273`); "Saldo disponible" caja baja +
    "— MXN" donde la ref usa versalitas + apilado; "Hola" sin coma (`dashboard/page.tsx:210`); badge
    de campana "1" inventado sin sesión. (visible)
  - Nav: badge "PRONTO" de "Tarjeta" `absolute -top-1 right-2`, se encima sobre el icono. (visible)
  - MoreSheet: pantalla completa donde la ref es bottom sheet (`BottomSheet`, asa + "Cerrar");
    títulos de grupo caja baja grande donde la ref usa versalitas gris; celdas icono-centrado-arriba
    donde la ref es fila (`NavCell`). (visible)
  - HelpScreen: "Lo que más se pregunta" grid 2 col donde la ref es `Stack columns={4}` de `Tile`
    (`app/help/page.tsx:26`); sin back (ref: `ScreenHeader backHref`). (visible)
  - `SelfieCheckScreen.tsx` (`identity_unavailable`/`idle`): CTA `bg-text` negro en vez de crimson
    (`:52`, `:72`); `SafeAreaView` raíz con `justify-center` deja el `BackButton` flotando al centro
    vertical (`:44`, `:63`). (visible)
  - Header apretado en full-screen sin tab bar (`CardScreen`, `DeleteAccountScreen`, `StubScreen`):
    círculo del `BackButton` y `<h1>` encimados; primera tarjeta pega contra el `<h1>`. (visible)
  - Falta safe-area top en `DashboardScreen`/`ScoreScreen`/`HelpScreen` — coincide con el bloque
    "Safe-area insets". (visible)
  - `QueryScreen.tsx`: "402 -> pago -> respuesta" usa `->` ASCII donde el resto usa `→`. (nitpick)
  - Profile: "Cerrar sesión" pill rosa a ancho completo donde la ref es fila `.cr-logout`; sin back.
    (nitpick)
  - "SealPay" como marca en `ScoreScreen`/`QueryScreen` — no aparece en la ref; confirmar si es
    intencional del track x402. (nitpick)

  **No verificado:** las 13 pantallas nuevas + los 4 ajustes de paridad contra su ruta de referencia
  (bloqueo de entorno); Expo Go en dispositivo físico; pantallas que exijan sesión Clerk real o
  gateway/backend real; rutas de referencia que redirigen a login sin sesión (solo `/dashboard` y
  `/score` rinden shell). Capturas en el transcript, no en disco.

  **Actualización `2026-09-06` (2ª entrada, mismo día) — re-pasada visual contra el main NUEVO
  (`7638dbb`), con el Metro del worktree corriendo solo (el `.expo/` del worktree se borra o el 2º
  arranque de Metro se cuelga — dato para el siguiente que renderice). Resultado: la migración de
  paridad móvil arregló la GRAN MAYORÍA de los hallazgos de arriba.**

  **Bug de iconos negros — RESUELTO en el main nuevo. Root cause confirmado.** El `Icon.tsx` viejo
  no ponía `fill="none"` en la raíz `<Svg>`; react-native-svg (y su shim web) por defecto rinde
  cada `<Path>`/`<Rect>` sin `fill` propio como `fill:black` → el arco del glyph `score`, el `<Rect>`
  de `card`, y cada glyph del sheet "Más" salían rellenos sólidos. El fix (`feature-nav-parity-render`,
  serie que cierra en `a8c71aa`): `const common = { viewBox: "0 0 24 24", fill: "none" }` en el `<Svg>`
  + `fill={fillColor}` explícito (`fillColor = filled ? stroke : "none"`) en los casos con primitiva
  de forma. Verificado en render: nav (`score` = arco fino + aguja + punto), MoreSheet (11 glyphs
  trazo gris `--cr-text-secondary`), campo de contraseña (`eye` trazo), Profile — todos correctos.

  **Arreglado por la migración (ya no aplica):**
  - Nav: glyph `score` fino ✓; "Tarjeta" ahora es pestaña real habilitada, sin badge "PRONTO"
    encimado ✓ (`f4b33bd`).
  - `DashboardScreen`: link "Ver por qué" junto a "Tu score" ✓; tarjeta "Encuentra tu mejor opción"
    ahora `--cr-gradient` crimson + icono a la izquierda + chevron ✓; "SALDO DISPONIBLE" en
    versalitas + unidad/valor apilados ✓; score card muestra estado de error real ("No pudimos
    cargar tu score…") en vez de spinner/número inventado ✓.
  - MoreSheet: asa de bottom-sheet ✓; títulos de grupo en versalitas gris ✓; celdas en fila
    (icono izq + label der) ✓; iconos trazo ✓.
  - `DeleteAccountScreen`: botón "Escribir el correo" → `Linking.openURL(MAILTO)` con
    `privacidad@finarahub.mx` ✓; card highlight "Ten en cuenta" ✓.
  - Header de las full-screen sin tab bar: `BackButton` y `<h1>` ya con respiro (visto en
    `KycFormScreen`, `MovementsScreen`); el apretón que vi en el main viejo ya no aparece.
  - Pantallas nuevas revisadas en render y bien construidas / on-brand: `KycFormScreen`
    (CTA crimson "Verificar identidad", form con Nombre/Apellido/CURP/Correo/Teléfono),
    `MovementsScreen` (segmented Todos/Ingresos/Gastos, empty state, copy = `app/movements/page.tsx:208-230`).

  **Sigue abierto tras la re-pasada:**
  - `ScoreScreen.tsx` NO entró en la migración (último commit `4209ea9`, pre-migración): `scoreValue
    = 74` hardcodeado como default prop; título "Tu score" vs "Score Creva"; solo el link "Consultar
    con pago (SealPay) →", sin la lista "Sigue por aquí" (`app/score/page.tsx:26-50`); sin back ni
    botón de ayuda. El gateway aún no expone `/score` — decisión de alcance pendiente con el humano.
    (blocker)
  - `SelfieCheckScreen.tsx`: CTA "Iniciar Selfie Check" / "Continuar sin verificarme" siguen en
    `bg-text` (negro) en vez de crimson; en el estado `idle` el `SafeAreaView` con `justify-center`
    aún deja el `BackButton` flotando al centro vertical. (visible)
  - `DashboardScreen`: score card body sigue "Revisa los productos compatibles con tu perfil…" /
    botón "Ver mis opciones" donde el fallback de la ref es "Mira qué mueve tu score y qué lo
    mejoraría." / "Ver por qué" (`app/dashboard/page.tsx:194-200`); "Hola" sin coma
    (`:210`); badge de campana "1" sin sesión (dato inventado). (visible + 2 nitpick)
  - `MoreSheet`: no tiene botón "Cerrar" (la ref sí); el asa es decorativa (no arrastrable). (nitpick)
  - `MovementsScreen`: el segmented "Todos/Ingresos/Gastos" se recorta en el borde derecho a 375px
    ("Gastos" queda cortado). (visible)
  - `DeleteAccountScreen`: título "Eliminar mi cuenta" vs "Eliminar tu cuenta" de la ref + subtítulo
    ausente ("Se puede, y aquí está cómo…"); la CTA de correo es un `Card` con texto crimson, no un
    `Button` crimson relleno como la ref (`app/profile/delete-account/page.tsx:63`); prop
    `onOpenPrivacy` declarada pero sin uso visible. (nitpick)
  - "SealPay" como marca visible en `ScoreScreen`/`QueryScreen` — sigue sin aparecer en la ref;
    confirmar si es intencional del track x402. (nitpick)

  **No re-verificado en esta pasada** (nav de clicks sintéticos poco fiable + presupuesto): recorrido
  completo pantalla-por-pantalla de las otras ~9 pantallas nuevas (Calculadora, Estados de cuenta,
  Tu garantía, Sello de tu negocio, Reglas que te afectan, Tu reporte, Avisos, Aviso de privacidad,
  Datos personales/Info fiscal/Seguridad) — vistas en el grid del MoreSheet, no abiertas una a una;
  `credit`/`card` nuevos; `help` x3. `ScoreGauge` como arco/ring web (`4209ea9`) sin comparar pixel
  a pixel contra el de la ref.

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
  - `2026-09-06` — **Decisión escogida (slice B de §10.4):** `wallet-cli ring` v2.1.0 es el
    backend de los secretos del gateway vía `gateway/src/key-ring.ts` (`resolveSecret`), con
    fallback a `process.env` (cero ruptura con `KEY_RING_ENABLED` ausente). `config.ts` resuelve
    `CREVA_SERVICE_REFRESH_TOKEN`, `FACILITATOR_AUTH_TOKEN`, `HEDERA_PAYER_PRIVATE_KEY`,
    `WORLD_API_KEY`, `ARC_SIGNER_PRIVATE_KEY` por ahí. Rol = custodia de secretos en reposo, NO
    una segunda wallet (respeta §8.1). Tests unit+fuzz+invariant verdes. **BLOCKED** el paso
    end-to-end: `wallet-cli ring init` exige dispositivo Ledger físico. Detalle y comando del
    humano en `docs/integrations/ledger-keyring.md`. Rama `sponsor-ledger-keyring`.

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

- [x] `2026-09-06` — **`ScoreScreen` deja de ser el stub mínimo: muestra el score real, no un
  `74` hardcodeado (`feature-scorescreen-real`, off `origin/main` `29b635f`).** El blocker
  documentado en `docs/memoria.md` (`2026-09-05`, paridad ScoreGauge) decía "necesita `score.get()`
  con factors + recommendations + `crevaScore.disclosure()`, y `/score` no está expuesto en el
  gateway". **Decisión escogida:** el score se obtiene **core-directo**, no por el gateway — es
  exactamente el patrón que `DashboardScreen.tsx` ya usa. Evidencia archivo:línea:
  `app/lib/api.ts:7` (`BASE = process.env.EXPO_PUBLIC_API_URL`, el backend Clerk del core),
  `app/lib/api.ts:312` (`score.get()` = `request<ScoreData>('/score')` → `${BASE}/score`),
  `app/lib/api.ts:89-96` (adjunta `Authorization: Bearer <clerk token>` de `sessionSource`, la
  identidad del usuario, nunca una estática), `app/features/dashboard/DashboardScreen.tsx:55-69`
  (mismo `score.get()` directo con loading/error). `gateway/src/index.ts` solo tiene
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
  `app/features/query/business-input.ts` (`isValidBusinessName`, `toStateCode`, `buildSignalInput`,
  `STATE_OPTIONS`) para poder testear unit+fuzz+invariant. **El ciclo x402, el `pay-button` y el
  sellado no se tocaron.** Tests: `test/unit/query/business-input.spec.ts`,
  `test/fuzz/query/business-input.fuzz.spec.ts`,
  `test/invariant/query/business-input-only-real-state-codes.invariant.spec.ts` (invariante:
  `requestSignal` nunca recibe un `state_code` fuera del catálogo INEGI). `tsc` limpio; `jest`
  sin regresión. **No se verificó:** el gateway real contra un `businessName`/`stateCode` variable
  (sin entorno de gateway/facilitador en esta sesión); ni el render nativo (segunda vista visual
  sigue siendo de la sesión 2). **Nota de colisión:** un agente de fondo (`sponsor-privy-wallet`)
  toca el área del `pay-button` de esta misma pantalla — este cambio se mantuvo en la sección de
  inputs para que el Solver reconcilie ambos limpio.
- [x] `2026-09-06` — **Wiring de la app para el `onchain` trust signal de `/verify`
  (`feature-verify-onchain-wiring`, off `worktree-agent-add968ba3a6440026` @ f9457c8).** El agente
  de attestation dejó el contrato + subgraph + enriquecimiento del gateway (`creva-proxy.ts` agrega
  `onchain` a la respuesta de `/creva-score/verify`) y el render en `VerifyReportCard` (ya acepta
  `onchain?`), pero sin cablear la app. Hecho aquí, **solo app**:
  - `app/lib/api.ts`: nuevos tipos `OnchainTrustSignal` + `OnchainAttestation`;
    `CertificateVerification` gana `onchain?: OnchainAttestation | null` + `onchainError?`.
  - `app/features/verify/onchain.ts` (nuevo, módulo puro): `parseOnchain(raw)` normaliza el bloque
    — `trustSignal` fuera de los 3 valores, contadores no numéricos, o input no-objeto → `null`, así
    un bloque malformado nunca llega a `VerifyReportCard` (que haría `TRUST_COPY[bad].label` → crash).
  - `app/features/verify/sealClient.ts`: la rama 200 pasa el body por `parseOnchain(body.onchain)`.
  - `app/features/verify/VerifyScreen.tsx`: `onchain={result.verification.onchain}` a `VerifyReportCard`.
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
  - `app/`: `npm install`; `npx tsc --noEmit` → **0 errores**; `npx jest unit fuzz invariant` →
    **51 suites limpias / 236 tests**; 234 pasan en la corrida completa, los 2 restantes
    (`test/unit/auth/auth-gate.spec.ts`, `test/unit/help/search.spec.ts`) hacen timeout solo bajo
    carga full-run y pasan **5/5 aislados** — flake de `act()`/timing ya documentado, reproducido y
    confirmado, no es regresión.
  - `gateway/` (sin cambios en esta integración, corrido igual): `npx tsc --noEmit` → 0;
    `npx eslint .` → 0; `npx vitest run --exclude "test/integration/**"` → **17 archivos / 44
    tests** verdes.
  **NO verificado:** render nativo / comparación visual lado a lado de las 13 pantallas + 4 ajustes
  (bloqueo `react-native-web`/NativeWind: `TypeError: Class extends value undefined`) — bloque
  abierto arriba, owner sesión 2; Expo Go en dispositivo físico real (sin hardware, igual que el
  resto del repo). Merge fast-forward a `main` sin `--amend`/`rebase`/force. Ramas de la familia
  seguras de borrar del remoto una vez confirmado el push.

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
  pasó de 2 pestañas (Inicio/Perfil) a las 5 del objetivo (Inicio, Score, Tarjeta, Crédito, Más).
  **Actualización — decisión escogida 2026-09-06 con el humano tras ver el render
  (`feature-last-screens-parity`):** la pestaña Tarjeta es tocable y abre el flujo de tarjeta
  completo (`CardScreen`: estado vacío + emisión + freeze + movimientos, gateado por KYC;
  `CardCreateScreen`; `VirtualCard`). Ya no hay badge "PRONTO" ni pestaña deshabilitada. "Más" abre
  `app/features/more/MoreSheet.tsx` ("Todo lo
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
