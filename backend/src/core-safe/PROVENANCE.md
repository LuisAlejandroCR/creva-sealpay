<!-- backend/src/core-safe/PROVENANCE.md: rastro de procedencia de la infraestructura vendorizada
     desde el core privado (creva_finance/backend). Distinto de docs/migration/creva-core-migration-plan.md
     (que decide QUÉ entra y por qué); esto registra el commit exacto de cada archivo copiado y por qué
     es REUTILIZABLE-SEGURO — sin fórmulas, pesos, umbrales ni reglas de clasificación (regla #5). -->

# Procedencia de `backend/src/core-safe/`

Todo lo de esta carpeta se copió **una sola vez**, con adaptación mínima (ESM `.js` en imports
relativos, cero dependencia de NestJS), desde el repo privado `creva_finance` (solo lectura).

**Commit de origen:** `1c7c399deb3fce1b9cf9c7ea76d980d0200d6570` (2026-09-01)
**Fecha de la copia:** 2026-09-06 · **Slice:** `feature-backend-core-infra`

| Archivo aquí | Origen en `creva_finance/backend/src` | Categoría (plan §1) | Adaptación |
|---|---|---|---|
| `clerk/clerk-token-verifier.ts` | `modules/auth/clerk/clerk-token-verifier.ts` | REUTILIZABLE-SEGURO | ninguna — ya era `node:crypto` puro, sin imports Nest |
| `clerk/clerk-user-mapping.port.ts` | `modules/auth/clerk/clerk-user-mapping.port.ts` | REUTILIZABLE-SEGURO | `AuthUser` inline; ruta de import ESM |
| `clerk/unlinked-clerk-account.ts` | `modules/auth/clerk/unlinked-clerk-account.ts` | REUTILIZABLE-SEGURO | ninguna |
| `integrity/report-digest.ts` | `common/integrity/report-digest.ts` | REUTILIZABLE-SEGURO | ninguna — `node:crypto` puro |
| `integrity/signature.ts` | `common/integrity/signature.ts` | REUTILIZABLE-SEGURO | ninguna — `node:crypto` puro |
| `integrity/signing-key.ts` | `common/integrity/signing-key.ts` | REUTILIZABLE-SEGURO | ninguna — `node:fs` puro |
| `logging/redact-pii.ts` | `common/utils/redact-pii.ts` | REUTILIZABLE-SEGURO | ninguna |
| `logging/source-logger.ts` | `common/logger/source-logger.ts` | REUTILIZABLE-SEGURO | se quitó el adaptador NestJS `createNestSourceLogger`; se agregó `createConsoleSourceLogger` |
| `types/source-result.ts` | `common/types/source-result.types.ts` | SOLO-FORMA | ninguna |
| `types/auth-user.ts` | `common/types/internal.types.ts` (solo `AuthUser`) | SOLO-FORMA | se extrajo únicamente `AuthUser`; ningún tipo que enumere factores/bandas |

## Regla #5 — por qué esto pasa el grep

Ninguno de estos archivos contiene una fórmula de scoring, un peso, un umbral, un corte de banda,
una regla de clasificación MCC/SAT ni una regla de elegibilidad/matching de crédito. Son:
verificación de un JWT contra un JWKS, hash canónico SHA-256, firma/verificación Ed25519, carga de
un PEM sin filtrarlo a logs, redacción de PII y secretos, y el envelope `SourceResult<T>`. La
LÓGICA-DE-NEGOCIO (score, creva-score, classification, recommendations, collateral, calculator,
declarations) **nunca** se copia: `backend/` la consume por HTTP contra `creva-business-logic`
(ver `../business-logic-client.ts`).

## Cómo re-auditar al actualizar

1. `git -C ../creva_finance log --oneline <commit-de-arriba>..HEAD -- <ruta origen>` para ver qué cambió.
2. Releer el diff completo del archivo — sigue sin números de negocio.
3. Actualizar el commit de origen y la fecha en la tabla.
4. Correr el grep de `docs/migration/creva-core-migration-plan.md` §5.3 antes de commitear.
