<!-- creva-core-migration-plan.md: plan de migración de lo reutilizable de creva_finance/backend
     (core privado, NestJS en Cloud Run) hacia creva-sealpay/backend (público). Clasifica módulo por
     módulo qué puede venir y qué nunca, propone arquitectura, árbol objetivo, secuencia de slices y
     el checklist de regla #5. Se distingue de docs/plan.md (estado vivo de bloques) en que esto es
     un plan de una sola migración, no la bitácora del proyecto. -->

# Plan de migración del core reutilizable de Creva hacia `backend/`

**Fecha:** 2026-09-06 · **Rama:** `docs-creva-core-migration-plan` (local, no pusheada)
**Alcance:** solo este documento. Cero código movido o copiado. Otra sesión renombra
`app/`→`frontend/` y `gateway/`→`backend/`; aquí solo se decide **qué entra a `backend/` y cómo**.

**Fuentes leídas:** `AGENTS.md` (§Reglas del repositorio público, §Documentación), `brainstorming.md`
§2, §7 (regla #5), §10; `docs/plan.md`; recorrido completo de `creva_finance/backend/src` (148
archivos, 16 módulos). `creva_finance/AGENTS.md` reglas críticas #1, #7, #8 y hermanas de #15/#16.

> **Regla que manda sobre todo lo demás (regla #5, `AGENTS.md` §Reglas del repositorio público):**
> el repo público **nunca** puede contener fórmulas de scoring, pesos, umbrales ni reglas de
> clasificación de Creva. Cuando "traerlo todo" choca con esto, gana esto. En caso de duda, un
> módulo se queda en el core y `backend/` lo consume por API.

---

## 1. Clasificación módulo por módulo

Tres categorías:

- **REUTILIZABLE-SEGURO** — infraestructura sin lógica de negocio. Puede copiarse/vendorizarse al
  repo público. Auth, guards, verificación de webhooks, caché, cliente HTTP, logger con redacción,
  interceptores, filtros, firma Ed25519 y digest canónico, boilerplate de config y base de datos.
- **SOLO-FORMA** — DTOs de entrada y tipos de respuesta. La *forma* del contrato de API puede vivir
  en `backend/` para tipar el proxy; la *lógica* que los llena, no.
- **LÓGICA-DE-NEGOCIO** — fórmulas, pesos, umbrales, reglas de clasificación, reglas de
  elegibilidad/matching. **No puede entrar al repo público en ninguna forma** (ni código, ni
  comentario, ni `.md`, ni test con los números). `backend/` la consume por proxy autenticado.

### 1.1 · `common/**` y raíz

| Carpeta / archivo | Categoría | Justificación (archivo:línea) |
|---|---|---|
| `main.ts` | REUTILIZABLE-SEGURO | Bootstrap NestJS, helmet, CORS, Sentry, Swagger. Sin negocio. `main.ts:1-11,23-36` |
| `app.module.ts` | REUTILIZABLE-SEGURO (boilerplate) | Registro de módulos + `ThrottlerModule` con límites genéricos anti-abuso `app.module.ts:71-73` (`10 req/s`, `200 req/min` son defensa, no reglas de negocio). Al vendorizar se recorta a los módulos que `backend/` realmente tenga. |
| `config/configuration.ts` | REUTILIZABLE-SEGURO (esquema) / revisar 1 knob | Esquema Zod validado al arranque `configuration.ts:76-108`. `AUTH_PROVIDER`, `CLERK_*`, `IDENTITY_PROVIDER` son infra. **Ojo:** `SCORE_PERIOD_DAYS`, `COLLATERAL_RATIO` son knobs que alimentan fórmulas — si `backend/` no calcula score ni capacidad, **no se traen esas líneas**. |
| `database/supabase.service.ts` · `supabase.module.ts` | REUTILIZABLE-SEGURO | Wrapper del cliente, `admin` vs `freshAuthClient()` `supabase.service.ts:119-148`. Patrón de conexión, sin negocio. Solo se trae si `backend/` va a tener DB propia (hoy no la tiene). |
| `common/http/croma.client.ts` | REUTILIZABLE-SEGURO | Cliente HTTP con reintentos, polling de job 202, degradación a `unavailable` `croma.client.ts:162-171`. Sin negocio; solo útil si `backend/` llama proveedores directo (no en la opción recomendada). |
| `common/http/validated-call.ts` | REUTILIZABLE-SEGURO | Valida forma de respuesta con Zod, degrada `validated-call.ts:205-224`. Genérico. |
| `common/cache/memory-cache.ts` · `supabase-cache.ts` | REUTILIZABLE-SEGURO | Puerto de caché + impl; digest de la llave porque "a raw key carries the business name" `supabase-cache.ts:264-266`. Patrón, no negocio. |
| `common/integrity/signature.ts` | REUTILIZABLE-SEGURO | Ed25519, `keyId()` como huella pública, "trusted key is always the verifier's own" `signature.ts:301-335`. Cripto pura. **Alto valor**: es lo que el `gateway/` ya necesita para el sello. |
| `common/integrity/signing-key.ts` | REUTILIZABLE-SEGURO | Carga de PEM desde archivo o env sin filtrarlo a logs `signing-key.ts:337-365`. Infra de secretos. |
| `common/integrity/report-digest.ts` | REUTILIZABLE-SEGURO | `canonicalJson()` ordena llaves para digest estable; folio SHA-256 `report-digest.ts:367-399`. Formato canónico, sin negocio. |
| `common/logger/source-logger.ts` | REUTILIZABLE-SEGURO | Puerto de log con redacción de secretos y PII por patrón `source-logger.ts:423-440`. |
| `common/utils/redact-pii.ts` | REUTILIZABLE-SEGURO | Redacción profunda por stems de llave `redact-pii.ts:561-585`. |
| `common/interceptors/correlation-id.interceptor.ts` · `logging.interceptor.ts` | REUTILIZABLE-SEGURO | Correlation-id y timing de request `correlation-id.interceptor.ts:454-465`, `logging.interceptor.ts:482-499`. |
| `common/filters/global-exception.filter.ts` | REUTILIZABLE-SEGURO | Normaliza errores a HTTP + Sentry para 5xx `global-exception.filter.ts:518-540`. |
| `common/decorators/current-user.decorator.ts` | REUTILIZABLE-SEGURO | Extrae `request.user` `current-user.decorator.ts:546-551`. |
| `common/swagger.ts` | REUTILIZABLE-SEGURO | Setup de `@nestjs/swagger`. |
| `common/types/source-result.types.ts` | SOLO-FORMA | Envelope `SourceResult<T>` + helpers `sourceOk/sourceUnavailable` `source-result.types.ts:593-611`. Tipo, sin negocio. |
| `common/types/internal.types.ts` | SOLO-FORMA / **revisar** | Tipos compartidos. Traer solo `AuthUser`, tipos de transacción y de respuesta; **no** los tipos que enumeran factores/bandas si su nombre revela la regla (`ScoreFactor.name`, `ScoreBand`). |
| `common/http/` (nada más) | — | — |

### 1.2 · `modules/auth/**` — REUTILIZABLE-SEGURO (bloque entero)

| Archivo | Categoría | Justificación (archivo:línea) |
|---|---|---|
| `guards/jwt.guard.ts` | REUTILIZABLE-SEGURO | Resuelve el Bearer contra Supabase y, si `AUTH_PROVIDER` lo permite, contra Clerk; adjunta el UUID de `auth.users` `jwt.guard.ts:613-616`. **Es la pieza que resuelve el hallazgo de §10.2 (World): traerla a `backend/` deja que la puerta valide Clerk ella misma.** |
| `clerk/clerk-token-verifier.ts` | REUTILIZABLE-SEGURO | Verifica el JWT de Clerk contra el JWKS, cachea llaves en proceso, distingue "no es token de Clerk" de "es y está mal" `clerk-token-verifier.ts:724-756`. Cripto + JWKS, sin negocio. |
| `clerk/clerk-identity-mapping.adapter.ts` · `clerk-user-mapping.port.ts` · `clerk-verifier.token.ts` · `unlinked-clerk-account.ts` | REUTILIZABLE-SEGURO | Puertos y tokens de DI del puente Clerk↔fila Creva. |
| `clerk-identity.service.ts` · `clerk-identity.module.ts` | REUTILIZABLE-SEGURO | Mapea sujeto Clerk → fila `auth.users`, paginación acotada del listado `clerk-identity.service.ts:687-719`. Solo si `backend/` tiene DB propia; si no, se queda del lado del core y `backend/` solo verifica el token (`clerk-token-verifier.ts`). |
| `auth.service.ts` | REUTILIZABLE-SEGURO | Alta/login/refresh sobre Supabase Auth `auth.service.ts:650-685`. |
| `auth.controller.ts` | SOLO-FORMA + infra | Rutas `register/login/refresh/oauth/me` `auth.controller.ts:22-84`. **`POST /auth/refresh` (`:45`) es exactamente lo que `gateway/src/creva-auth.ts` ya consume** — la forma del contrato importa, la implementación puede quedarse en el core. |
| `dto/login.dto.ts` · `register.dto.ts` · `verify-phone.dto.ts` | SOLO-FORMA | Validación de entrada, sin negocio. |

### 1.3 · `modules/webhooks/**` — REUTILIZABLE-SEGURO

| Archivo | Categoría | Justificación (archivo:línea) |
|---|---|---|
| `clerk-webhook.service.ts` | REUTILIZABLE-SEGURO | Verificación Svix (HMAC-SHA256 a mano), ventana anti-replay de 5 min, claim idempotente con tope de reintentos `clerk-webhook.service.ts:761-794`. Patrón de webhook, sin negocio. |
| `reap-webhook.service.ts` | REUTILIZABLE-SEGURO | Verifica firma RSA + tolerancia de timestamp `reap-webhook.service.ts:798-833`. La *forma* del evento Reap es SOLO-FORMA. |
| `third-party-webhook.handler.ts` · `webhooks.controller.ts` | REUTILIZABLE-SEGURO / SOLO-FORMA | Ruta `POST /webhooks/onramp` `webhooks.controller.ts:31`. El on-ramp está apagado (§2 brainstorming); traer solo si se reactiva. |
| `*-webhook.module.ts` · `*-webhook.controller.ts` | REUTILIZABLE-SEGURO | Wiring. |

### 1.4 · SOLO-FORMA — DTOs y tipos de respuesta

| Módulo | Qué se puede traer | Qué NO | Evidencia |
|---|---|---|---|
| `cards/` | `dto/issue-card.dto.ts`, `providers/reap.types.ts` (forma del proveedor) | `cards.service.ts` (orquesta emisión real) | `transaction-normalizer.ts:1-18` consume `ReapTransaction` |
| `kyc/` | `dto/apply-kyc.dto.ts`, `providers/provider.ports.ts` (puerto `IdentityProvider`) | providers concretos | KYC "decidido, no construido" (§2 brainstorming) |
| `profiles/` | `dto/update-profile.dto.ts`, `dto/update-fiscal.dto.ts` | `profiles.service.ts` (lee/escribe `user_profiles`) | `creva-score.service.ts:205-224` lee el perfil fiscal |
| `statements/` | `dto/reclassify-entry.dto.ts`, la *forma* `NormalizedTransaction` | `statement-parser.ts`, `statement-normalizer.ts`, `statement-identity-matcher.ts` (reglas de matching de identidad → ADR-008) | `transaction-normalizer.ts:1-3` |
| `transactions/` | tipos `CardTransaction`, `TransactionType`, `TransactionStatus` | `transactions.service.ts` (`CLASSIFICATION_VERSION='1.0'` `transactions.service.ts:10`, sincroniza + clasifica) | — |
| `creva-score/creva-report.types.ts` | la forma `CrevaReport`/`ReportSignal`/`ReportSource` (el móvil ya la renderiza) | `creva-report.builder.ts` (ver 1.5) | `creva-report.builder.ts:3-9` |
| `creva-score/score-disclosure/` | la forma `ScoreDisclosure` y el texto de descargo (`DOES_NOT_ESTIMATE`, niveles de procedencia) `score-disclosure.service.ts:29-51` | nada más — no hay fórmula aquí, es texto | es descriptivo puro (`kind: 'descriptive'` `:58`) |

> El descargo (`score-disclosure`) es el único sub-módulo de `creva-score/` que es texto sin
> fórmula. Aun así conviene **servirlo por API** (`GET /creva-score/disclosure`
> `creva-score.controller.ts:21`) para que una sola fuente lo edite, no copiarlo.

### 1.5 · LÓGICA-DE-NEGOCIO — nunca al repo público

Cada fila lleva la evidencia del número/regla que la descalifica.

| Módulo / archivo | Qué contiene que no puede salir | Evidencia (archivo:línea) |
|---|---|---|
| `score/factors/business-ratio.factor.ts` | Peso del factor = **35** | `business-ratio.factor.ts:6` `const MAX_SCORE = 35` |
| `score/factors/consistency.factor.ts` | Peso = **25**, fórmula `activeWeeks/totalWeeks` | `consistency.factor.ts:5,13` |
| `score/factors/collateral-usage.factor.ts` | Peso = **25**, umbrales **0.6 / 0.8**, escalones **25 / 15 / 5** | `collateral-usage.factor.ts:6,32-40` |
| `score/factors/category-diversity.factor.ts` | Peso = **15**, objetivo = **4** categorías | `category-diversity.factor.ts:5-6` |
| `score/score-band.ts` | Cortes de banda **0.8 / 0.6 / 0.4** sobre el ratio | `score-band.ts:7-11` `CUTS` |
| `score/score.service.ts` | Composición de los 4 factores, `MIN_TRANSACTIONS = 3`, suma de pesos, `SCORE_VERSION` | `score.service.ts:18,57-65` |
| `classification/mcc-catalog.service.ts` | Mapa MCC → `business/personal/mixed` (regla de clasificación de Creva) | `mcc-catalog.service.ts:17-21` `classify()` |
| `classification/sat-mapping.service.ts` | Sugerencia SAT curada + `confidence` por MCC | `sat-mapping.service.ts:5-13,25-31` |
| `classification/statement-keyword.service.ts` | Patrones de keyword → clasificación + `priority` + categoría FINARA | `statement-keyword.service.ts:7-12,61-78` |
| `calculator/calculator.service.ts` | Ratios de reparto **0.30 / 0.15 / 0.55** (salario/ahorro/reinversión) | `calculator.service.ts:7-9` |
| `collateral/collateral.service.ts` | Fórmula de capacidad de gasto `confirmed_amount × collateral_ratio` | `collateral.service.ts:46-48,95-98` |
| `declarations/declarations.service.ts` | El servicio es almacenamiento (append-only), **pero** la política de procedencia (`declared` nunca desplaza lo observado, orden estados→declarado→colateral) es regla de negocio → regla #17 de `creva_finance/AGENTS.md` | `declarations.service.ts:1-2`; la regla vive en `credit-profile.ts:101-118` |
| `recommendations/rules/drip-spending.rule.ts` | `DRIP_THRESHOLD = 150`, `MIN_OCCURRENCES = 3`, `WINDOW_DAYS = 7` | `drip-spending.rule.ts:7-9` |
| `recommendations/rules/high-refund-rate.rule.ts` | `REFUND_THRESHOLD = 0.2` | `high-refund-rate.rule.ts:7` |
| `recommendations/rules/business-ratio-alert.rule.ts` | `ALERT_THRESHOLD = 0.4` | `business-ratio-alert.rule.ts:7` |
| `recommendations/rules/score-improvement.rule.ts` | `MIN_DELTA = 5` | `score-improvement.rule.ts:6` |
| `recommendations/rules/{savings-alert,inactivity-alert,invoice-reminder,collateral-utilization,finara-recommendations}.rule.ts` | Cada una lleva su `RULE_VERSION` y sus umbrales; mismo patrón que las de arriba | `recommendations.service.ts:7-15,54-64` |
| `recommendations/credit/credit-eligibility.ts` | Reglas de la puerta de elegibilidad (qué falta bloquea) | `credit-eligibility.ts:16-37` |
| `recommendations/credit/credit-matching.rule.ts` | 5 gates numéricos (`minScore`, `minMonthlyIncome`, `maxSpendVolatility`, `minSavingsRate`, `minObservedDays`), cálculo de `fitScore` por headroom, `RULE_VERSION = '1.0'` | `credit-matching.rule.ts:12,29-90,98-153` |
| `recommendations/credit/credit-profile.ts` | Precedencia de fuente de ingreso, `coefficientOfVariation` como volatilidad, `impliedSavingsRate`, `businessSpendRatio` (solo cuenta gasto clasificado) | `credit-profile.ts:57-66,101-155` |
| `recommendations/credit/lender-catalog.ts` · `lender-catalog.service.ts` | `CATALOG_VERSION`, umbrales por producto (`requirements.minScore` etc.), qué productos están activos | `credit-recommendations.service.ts:14,99`; `credit-matching.rule.ts:57-89` |
| `recommendations/credit/providers/{banxico,lender-catalog,reference-catalog}.provider.ts` | Catálogo de oferta y su normalización — reglas de negocio del lado supply | `credit-recommendations.service.ts:143-144` |
| `creva-score/creva-report.builder.ts` | Mapeo señal→`tone` (`positive/neutral/unavailable`), qué se convierte en nota, wording de veredicto | `creva-report.builder.ts:34-114,116-138` |
| `creva-score/business-verification/verify-subject.ts` · `business-verification.service.ts` · `business-verification.badge.ts` · `rfc.ts` | Reglas de match del directorio, política "un sello ambiguo no se emite", "el sello nunca mueve el score" (regla #15 de `creva_finance/AGENTS.md`), inspección offline de RFC | `business-verification.badge.ts:1-2` ("carries no score contribution, and nothing here may add one"); `creva-score.service.ts:96-135` |
| `creva-score/regulatory-radar/regulatory-radar.service.ts` (+ providers CNBV/DOF) | Matching por keyword con límite de palabra, dedup, ranking `byKindThenDate`, `maxAlerts` | `regulatory-radar.service.ts:49-79,171-210` |
| `creva-score/reference-rates/` (+ Banxico SIE provider) | Selección de series, unidades, TTL | `creva-report.builder.ts:90-104` |
| `creva-score/creva-score.factory.ts` | Composition root que cablea todo lo anterior — no es fórmula, pero importa cada pieza de negocio; **no se trae, se deja como el ensamblado del core** | `creva-score.service.ts:9,57-81` |

**Conteo:** de 16 módulos de negocio —
- **REUTILIZABLE-SEGURO:** `auth`, `webhooks`, `health` + todo `common/**`, `config`, `database` (≈ 3 módulos + toda la infra transversal).
- **SOLO-FORMA:** aportan DTOs/tipos pero no lógica — `cards`, `kyc`, `profiles`, `statements`, `transactions` (5 módulos).
- **LÓGICA-DE-NEGOCIO (bloqueada):** `score`, `creva-score`, `classification`, `recommendations`, `collateral`, `calculator`, `declarations` (7 módulos).
- `creva-score/score-disclosure` es el único sub-árbol de un módulo bloqueado que es texto sin fórmula (SOLO-FORMA), y aun así se sirve por API.

---

## 2. Arquitectura propuesta para `backend/`

**Punto de partida (§10.1 brainstorming):** `backend/` (hoy `gateway/`) es un Express que ya es la
única puerta entre el móvil y el core. Ya hace proxy autenticado (`creva-proxy.ts`), ya refresca un
token de servicio (`creva-auth.ts`), ya gatea con x402 (`x402-gate.ts`), ya verifica World
(`world-verify.ts`) y ancla en Arc (`arc-anchor.ts`). El core sigue en Cloud Run
(`config.ts:6` `https://creva-backend-...run.app`).

### Restricción que decide todo

La LÓGICA-DE-NEGOCIO (sección 1.5) **no puede estar en el repo público** en ninguna forma. Entonces
`backend/` **nunca** contiene score, clasificación, recomendaciones ni el builder del reporte: los
**consume por HTTP contra el core desplegado**, que es justo lo que `creva-zk` ya hizo (§7 riesgo 5).
Eso está fuera de debate. Lo que sí se decide es **cómo entra lo REUTILIZABLE-SEGURO** y **cómo se
resuelve la auth Clerk**.

### Opción A — Proxy puro (estado actual, sin cambios)

`backend/` no trae nada del core. Sigue como Express con su propio mini-stack (`helmet`,
`express-rate-limit`, `fetch`). Toda ruta protegida = proxy al core, que valida el token.

- **Pro:** cero superficie nueva, cero riesgo de regla #5, ya funciona y ya está en `main`.
- **Contra:** el hallazgo de §10.2 sigue abierto — el core rechaza el token Clerk del móvil, y
  `backend/` no puede validarlo él mismo porque no tiene `clerk-token-verifier.ts`. `backend/`
  reimplementa a mano cosas que el core ya tiene bien (redacción de PII en logs, verificación de
  webhooks, digest canónico para el sello).
- **Contra:** duplicación silenciosa. `creva-auth.ts` ya reinventó el manejo de expiry de JWT que
  `clerk-token-verifier.ts` hace mejor.

### Opción B — Proxy + paquete de workspace `@creva/core-safe` (RECOMENDADA)

`backend/` sigue siendo el proxy de la opción A, **pero** lo REUTILIZABLE-SEGURO entra como un
paquete del monorepo, copiado (vendorizado) una sola vez con su procedencia anotada:

```
creva-sealpay/
├── packages/core-safe/        # vendored desde creva_finance/backend/src/common + auth/clerk
│   ├── integrity/             # signature.ts, signing-key.ts, report-digest.ts
│   ├── clerk/                 # clerk-token-verifier.ts (+ puertos)
│   ├── logging/               # source-logger.ts, redact-pii.ts
│   ├── http/                  # croma.client.ts, validated-call.ts (opcional)
│   └── PROVENANCE.md          # de qué commit de creva_finance salió cada archivo
├── backend/                    # ex-gateway: Express, importa @creva/core-safe
└── frontend/                   # ex-app: Expo
```

- **Auth Clerk:** `backend/` importa `@creva/core-safe/clerk` y valida el token Clerk del móvil
  **antes** de proxiar. Al core le manda el token de servicio (ya lo hace, `creva-proxy.ts:18-24`).
  **Esto cierra el hallazgo de §10.2**: el móvil se autentica contra `backend/` con Clerk, y el core
  nunca ve el token del móvil. `world-verify.ts` deja de ser el único punto de identidad.
- **El sello:** `backend/` usa el mismo `report-digest.ts`/`signature.ts` que el core → el folio que
  `backend/` calcula y el que el core firma son bit a bit el mismo (hoy es un riesgo latente).
- **Regla #5:** `packages/core-safe/` se audita una vez con el grep de la sección 5; como es
  infra sin números de negocio, pasa. `PROVENANCE.md` deja el rastro para re-auditar en cada
  actualización.
- **Contra:** hay que mantener el vendor al día a mano. Mitigación: es poco código y casi nunca
  cambia (cripto y verificación de tokens son estables).
- **Contra:** `@nestjs/*` no aplica en Express — hay que traer las versiones *framework-agnósticas*
  de cada archivo (la mayoría ya lo son: `signature.ts`, `report-digest.ts`, `redact-pii.ts`,
  `clerk-token-verifier.ts` no importan Nest). Los interceptores/filtros/guard de Nest **no** se
  traen; su equivalente Express se escribe nuevo y chico.

### Opción C — Core como submódulo privado gitignoreado

`creva_finance` entra como submódulo git en `creva-sealpay/core/`, en `.gitignore` del repo público,
y `backend/` lo importa en local / en el deploy.

- **Pro:** cero copia, una sola fuente.
- **Contra grave:** frágil para los jueces — clonan el repo público y `backend/` no compila porque
  falta el submódulo privado. Rompe "open source, deployed, and live" (§9.2 brainstorming).
- **Contra:** un `git submodule update` distraído puede exponer el core. La regla #5 pasa a depender
  de `.gitignore`, no de que el secreto no esté.
- **Descartada.**

### Recomendación

**Opción B.** En 3 líneas: `backend/` sigue siendo el proxy autenticado que ya es; se le agrega un
paquete `@creva/core-safe` con solo la infra sin negocio (cripto del sello, verificador de token
Clerk, redacción de logs), copiada con procedencia anotada; la LÓGICA-DE-NEGOCIO nunca se copia y se
sigue consumiendo por HTTP contra el core en Cloud Run. Trade-off aceptado: mantener el vendor a
mano, a cambio de cerrar el hallazgo Clerk de §10.2 y de que `backend/` firme/verifique el sello con
exactamente el mismo código que el core.

**Regla dura sobre el eje congelado (§10.3 brainstorming):** `x402-gate.ts`, `hedera-signer.ts`,
`facilitator.ts` y el sellado **no los toca esta migración**. `@creva/core-safe` se introduce como
capa aditiva; la primera vez que se use en el path del sello es un slice propio con su `[VERIFY]`.

---

## 3. Jerarquía de carpetas objetivo

```
creva-sealpay/
├── frontend/                     # ex-app/  (Expo — otra sesión hace el rename)
│   ├── App.tsx
│   ├── features/
│   │   ├── auth/  onboarding/  score/  credit/  verify/  query/  dashboard/  more/  help/  profile/  card/  shared/
│   ├── lib/
│   ├── test/{unit,fuzz,invariant}/
│   └── assets/
│
├── backend/                      # ex-gateway/  (Express — la única puerta al core)
│   ├── src/
│   │   ├── index.ts              # entry; monta rutas
│   │   ├── config.ts             # env del gateway (sin knobs de fórmula del core)
│   │   ├── middleware/
│   │   │   ├── clerk-auth.ts     # NUEVO: valida token Clerk del móvil vía @creva/core-safe/clerk
│   │   │   ├── x402-gate.ts      # CONGELADO
│   │   │   └── rate-limit.ts
│   │   ├── payments/
│   │   │   ├── hedera-signer.ts  # CONGELADO
│   │   │   └── facilitator.ts    # CONGELADO
│   │   ├── creva/
│   │   │   ├── creva-auth.ts     # token de servicio (podría usar core-safe para el expiry)
│   │   │   └── creva-proxy.ts    # proxy autenticado al core en Cloud Run
│   │   ├── onboarding/world-verify.ts
│   │   ├── anchor/arc-anchor.ts
│   │   └── types.ts
│   └── test/{unit,fuzz,invariant}/
│
├── packages/
│   └── core-safe/                # vendored REUTILIZABLE-SEGURO — sin lógica de negocio
│       ├── integrity/{signature,signing-key,report-digest}.ts
│       ├── clerk/{clerk-token-verifier,clerk-user-mapping.port,clerk-verifier.token}.ts
│       ├── logging/{source-logger,redact-pii}.ts
│       ├── http/{croma-client,validated-call}.ts        # opcional (solo si backend llama proveedores)
│       ├── PROVENANCE.md                                 # commit de origen por archivo
│       └── package.json
│
├── scripts/ens/                  # register-subname.mjs (ya existe)
├── docs/
│   ├── plan.md                   # público (regla SDD de ETHOnline §9.5)
│   └── migration/creva-core-migration-plan.md
├── package.json                  # workspaces: ["frontend", "backend", "packages/*"]
└── README.md                     # inglés
```

El core (`creva_finance`) **no aparece** en este árbol. Vive en su propio repo privado y su propio
deploy (Cloud Run), y `backend/` lo alcanza por URL.

---

## 4. Secuencia de slices mergeables

Cada slice = una rama off `main`, con `[VERIFY]` propio (`unit + fuzz + invariant`, `AGENTS.md`
§Tests), independiente. Ninguno toca el eje congelado (§10.3). Orden por riesgo ascendente y por
desbloqueo.

| # | Slice | Qué entra | Depende de | Riesgo |
|---|---|---|---|---|
| **0** | **Rename estructural** (otra sesión) | `app/`→`frontend/`, `gateway/`→`backend/`, `package.json` workspaces | — | 🟡 imports masivos, pero mecánico |
| **1** | **`packages/core-safe/` con solo `integrity/`** | `signature.ts`, `signing-key.ts`, `report-digest.ts` + `PROVENANCE.md`. Nadie lo importa todavía. | Slice 0 | 🟢 código nuevo aislado, sin consumidor |
| **2** | **`core-safe/clerk/` + middleware `clerk-auth.ts` en `backend/`** | verificador de token Clerk; una ruta nueva `POST /auth/session` que valida y devuelve el sujeto. **No** se mete aún en las rutas gateadas. | Slice 1 | 🟡 auth — pero aditiva, las rutas viejas siguen igual |
| **3** | **`clerk-auth` delante de `/onboarding/*` y las rutas no-x402** | el middleware pasa a exigirse en las rutas de identidad; `world-verify.ts` queda como señal, no como única puerta | Slice 2 + aprobación Sandbox de World (§10.4 slice A, bloqueo externo) | 🟠 cambia el flujo de onboarding |
| **4** | **`core-safe/logging/` en `backend/`** | `redact-pii.ts` + `source-logger.ts` reemplazan el logging ad-hoc del gateway | Slice 1 | 🟢 observabilidad, no cambia respuestas |
| **5** | **`backend/` usa `report-digest.ts` de `core-safe` para el folio** | unifica el cálculo del folio entre `backend/` y core. **Primer toque al path del sello** → `[VERIFY]` estricto, invariante "un reporte alterado nunca verifica" | Slice 1 | 🟠 toca sellado (antes congelado) — slice deliberado y chico |
| **6** | **DTOs SOLO-FORMA en `backend/src/types.ts`** | tipos `CrevaReport`, `CardTransaction`, DTOs de auth — solo para tipar el proxy, sin lógica | Slice 0 | 🟢 solo tipos |

**Qué va primero:** auth (slices 1→3), porque es lo que desbloquea el hallazgo de §10.2 y no toca
nada congelado. **Qué va después:** la unificación del sello (slice 5), que sí toca el path
congelado y por eso va sola, tarde, y con invariante. Los slices 4 y 6 pueden entrar en cualquier
momento tras el 1.

**Qué NO rompe la demo:** ninguno de estos slices toca `x402-gate.ts`, `hedera-signer.ts`,
`facilitator.ts` ni `arc-anchor.ts`. El x402 congelado sigue liquidando en Hedera testnet igual que
hoy.

---

## 5. Riesgos regla #5 — archivos y strings que nunca pueden aparecer en un commit público

### 5.1 · Lista de bloqueo (nunca copiar al repo público, ni su contenido, ni sus números en un test)

```
creva_finance/backend/src/modules/score/**
creva_finance/backend/src/modules/creva-score/creva-report.builder.ts
creva_finance/backend/src/modules/creva-score/creva-score.factory.ts
creva_finance/backend/src/modules/creva-score/business-verification/**
creva_finance/backend/src/modules/creva-score/regulatory-radar/**
creva_finance/backend/src/modules/creva-score/reference-rates/**
creva_finance/backend/src/modules/classification/**
creva_finance/backend/src/modules/recommendations/**
creva_finance/backend/src/modules/collateral/collateral.service.ts
creva_finance/backend/src/modules/calculator/calculator.service.ts
creva_finance/backend/src/modules/declarations/declarations.service.ts
```

### 5.2 · Strings / valores que delatan una fórmula (grep antes de cada push)

Números y símbolos concretos de la lógica actual (sección 1.5). Si aparecen en un `.ts`/`.md` del
repo público **fuera de un test que los genera aleatoriamente**, es una fuga:

- Pesos de factor: `35`, `25`, `15` junto a `MAX_SCORE` / `maxScore` / `factor`
- Cortes de banda: `0.8`, `0.6`, `0.4` junto a `band` / `CUTS` / `ratio`
- Ratios del calculador: `0.30`, `0.15`, `0.55` / `SALARY_RATIO` / `SAVINGS_RATIO` / `REINVESTMENT_RATIO`
- Umbrales de reglas: `DRIP_THRESHOLD`, `REFUND_THRESHOLD`, `ALERT_THRESHOLD`, `MIN_DELTA`, `MIN_OCCURRENCES`, `WINDOW_DAYS`, `TARGET_CATEGORIES`
- Gates de crédito: `minScore`, `minMonthlyIncome`, `maxSpendVolatility`, `minSavingsRate`, `minObservedDays`, `fitScore`, `headroom`
- Identificadores de versión de regla: `RULE_VERSION`, `SCORE_VERSION`, `CATALOG_VERSION`, `CLASSIFICATION_VERSION`, `CREDIT_MATCHING_RULE_VERSION`
- Nombres de factor: `business_ratio_score`, `consistency_score`, `collateral_usage_score`, `category_diversity_score`
- `collateral_ratio`, `SCORE_PERIOD_DAYS`, `COLLATERAL_RATIO` con un valor por defecto numérico al lado

### 5.3 · Check ejecutable antes de cada push

```bash
# Corre desde la raíz del repo público. Falla (exit 1) si algo de la lista aparece.
cd "<repo-publico>"
PATTERN='business_ratio_score|consistency_score|collateral_usage_score|category_diversity_score'
PATTERN+='|SALARY_RATIO|SAVINGS_RATIO|REINVESTMENT_RATIO|DRIP_THRESHOLD|REFUND_THRESHOLD'
PATTERN+='|ALERT_THRESHOLD|MIN_DELTA|TARGET_CATEGORIES|RULE_VERSION|SCORE_VERSION|CATALOG_VERSION'
PATTERN+='|CLASSIFICATION_VERSION|minSpendVolatility|maxSpendVolatility|minSavingsRate|minObservedDays'
PATTERN+='|minMonthlyIncome|fitScore|collateral_ratio'
if git grep -nE "$PATTERN" -- ':!docs/migration/creva-core-migration-plan.md' ; then
  echo "REGLA #5: patrón de lógica de negocio detectado — revisar antes de pushear" ; exit 1
fi

# Segundo pase: ninguna ruta de la lista de bloqueo fue vendorizada
if git ls-files | grep -E 'modules/(score|classification|recommendations|creva-score/(creva-report\.builder|business-verification|regulatory-radar|reference-rates))' ; then
  echo "REGLA #5: archivo de la lista de bloqueo presente en el repo" ; exit 1
fi
```

Este check debería quedar como hook de pre-push y/o paso de CI en `backend/` una vez exista.
Este mismo documento se excluye del primer grep porque cita los nombres para poder bloquearlos.

### 5.4 · Riesgo residual

- **`packages/core-safe/` mal auditado.** Mitigación: `PROVENANCE.md` + el segundo pase del check +
  revisión humana de cada archivo vendorizado la primera vez (son < 10).
- **Un DTO SOLO-FORMA que enumera factores.** `ScoreFactor.name` como unión de strings
  (`'business_ratio_score' | ...`) **sí** delata la estructura del score. Al traer tipos, esos
  campos se reducen a `string`.
- **Tests que copian números.** Los `fuzz`/`invariant` de `backend/` generan entradas aleatorias;
  ningún test del repo público debe *afirmar* un número de negocio esperado — si necesita uno, es
  señal de que la lógica se coló.

---

## Verificación

- **Build/tests:** N/A — este entregable es solo documentación.
- **Clasificación LÓGICA-DE-NEGOCIO respaldada por archivo:línea real** (no suposición): sí — cada
  fila de la sección 1.5 cita el archivo y la línea del número/regla, leídos del código de
  `creva_finance/backend/src` en esta sesión.
- **Cero código movido/copiado:** sí — solo se creó este `.md` en el worktree.
- **La opción recomendada (B) no viola la regla #5:** sí — solo vendoriza infra sin números de
  negocio; la LÓGICA-DE-NEGOCIO se consume por HTTP, nunca se copia.
- **Rama `docs-creva-core-migration-plan` off `origin/main`, commiteada en el worktree, NO
  pusheada:** pendiente del commit (bloque abajo) — agente local, no pushea.
