<!-- docs/integrations/bazantic-recipes.md: qué Recipes crear en el dashboard de Bazantic para
     envolver el servidor MCP de creva-score. Se distingue de docs/plan.md (ahí vive el checklist
     de aceptación del bloque completo) y de brainstorming.md §"Bazantic — el hallazgo de la rev. 5"
     (ahí vive el porqué de la integración). -->

# Bazantic — Recipes sobre el servidor MCP de creva-score

## Prerrequisito — confirmado

- Cuenta de Bazantic activa desde 2026-09-04 (`docs/plan.md`, checklist de finalista).
- `gateway/.env` tiene `BAZANTIC_GATEWAY_URL` y `BAZANTIC_MCP_TOKEN` con valores reales (no
  placeholders vacíos como en `gateway/.env.example`).
- Crédito de prueba ~0.30 USDC en el primer gateway creado (`brainstorming.md`, 2026-09-04).

## Qué se envuelve

El servidor MCP de `creva-score` **ya existe fuera de este repo** (proyecto hermano, no tocado
aquí por regla de aislamiento de `AGENTS.md` §Colaboración punto 7 — no está en el área asignada
a este bloque). Expone tres tools:

| Tool MCP | Qué hace |
|---|---|
| `creva_regulatory_radar` | Señales regulatorias mexicanas (Croma/SIEM/DOF/CNBV/Banxico SIE) |
| `creva_verify_business` | Verificación de negocio mexicano |
| `creva_report` | Reporte de sello/score de Creva |

Bazantic **no requiere plomería nueva de este lado** (`docs/plan.md`, bloque Bazantic): su propio
gateway x402/MPP se para frente al servidor MCP existente y las Recipes son metadata de uso, no
código. Este documento es la especificación de esas Recipes para cuando se creen en el dashboard.

## Recipes a crear en el dashboard de Bazantic

1. **`creva-regulatory-radar`** → tool `creva_regulatory_radar`. Cuándo usarla: el agente necesita
   saber si un negocio mexicano tiene alertas regulatorias activas antes de recomendarlo o de
   avanzar una transacción con él.
2. **`creva-verify-business`** → tool `creva_verify_business`. Cuándo usarla: el agente necesita
   confirmar que un negocio mexicano existe y está en regla antes de confiar en sus datos.
3. **`creva-report`** → tool `creva_report`. Cuándo usarla: el agente ya decidió actuar y necesita
   el reporte de sello/score completo como evidencia adjunta a esa decisión.

Cada Recipe debe describir, en el formato que pida el dashboard: la tool que invoca, un ejemplo de
prompt de agente que la dispara, y el precio por llamada (usar $0.00 durante pruebas, subir el
precio real antes de la demo — mismo mecanismo que evita gastar el crédito de prueba, documentado
en `brainstorming.md`).

## Qué falta y por qué (bloqueo real, no de alcance)

- **Creación de las 3 Recipes en el dashboard de Bazantic** — acción de UI autenticada con la
  cuenta personal de Bazantic; ningún agente de este repo tiene esa sesión ni debe tenerla
  (credenciales de terceros no se pegan en el chat, `docs/plan.md` tabla de credenciales).
- **Una llamada MCP real pagada, confirmada** — igual de bloqueada: depende de que las Recipes
  existan primero, y de que el humano decida cuándo gastar el crédito de 0.30 USDC (mismo criterio
  de cautela ya aplicado a Hedera testnet y World ID en este proyecto — no gastar cuota real sin
  pedir antes).
- **Verificación mecánica (tsc/jest) no aplica a este bloque**: no hay código nuevo del lado de
  este repo — es config de un servicio de terceros sobre un servidor MCP que vive en otro proyecto.

Este bloque queda **abierto** en `docs/plan.md` con este archivo como referencia, hasta que el
humano cree las Recipes en el dashboard y confirme la llamada pagada.
