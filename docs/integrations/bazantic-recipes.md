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

## Corrección — qué tools existen realmente en Bazantic

El picker "Tools this Recipe can call" del dashboard **no lista el servidor MCP standalone**
(`IA Hackathon - Creva score`, el de `creva_regulatory_radar`/`creva_verify_business`/
`creva_report` descrito más abajo como contexto). Bazantic generó sus tools **auto-importando la
spec OpenAPI pública de Creva** (`/api/docs-json`, `brainstorming.md` — 46 rutas/52 operaciones).
Confirmado en pantalla el 2026-09-05: el picker trae 52 tools con prefijo `<Controller>_<método>`
(`AuthController_login`, `CardsController_issue`, etc.), y entre ellas las tres que corresponden a
este bloque:

| Tool en Bazantic | Ruta REST real | DTO |
|---|---|---|
| `CrevaScoreController_radar` | `GET /creva-score/radar` | Ninguno |
| `CrevaScoreController_verification` | `POST /creva-score/verification` | `VerifyBusinessDto` |
| `CrevaScoreController_report` | `POST /creva-score/report` | `VerifyBusinessDto` |

Fuente: `creva_finance/backend/src/modules/creva-score/creva-score.controller.ts` y
`dto/verify-business.dto.ts` (proyecto hermano, solo lectura, mismo criterio de aislamiento que el
resto de este documento).

**Diferencia real con la sección "Qué se envuelve" original (dejarla abajo como contexto de
negocio, no como fuente de los nombres de tool):** el DTO real es más angosto que el de la tool MCP
standalone — `businessName`/`stateCode` en camelCase, **sin `holderName` ni `rfc`** (el RFC se lee
del perfil fiscal guardado, nunca se acepta en el request — comentario explícito en el DTO). Y las
tres rutas están detrás de `JwtAuthGuard`: **requieren un JWT de un usuario de Creva autenticado**,
no solo la API key de Bazantic. Eso es un prerrequisito adicional sin resolver — ver §Qué falta.

Parámetros y descripciones de la tabla de negocio (cuándo usarla, prompts de ejemplo) siguen
tomados de `IA Hackathon - Creva score/src/modules/mcp/mcp.tools.ts` porque describen la misma
intención de producto — solo los nombres de tool/campo de abajo se corrigieron a los reales.

### Recipe 1 — `creva-regulatory-radar`

- **Tool en Bazantic:** `CrevaScoreController_radar` (`GET /creva-score/radar`)
- **Descripción para el dashboard:** "Revisa publicaciones recientes del Diario Oficial de la
  Federación y el catálogo de normas de la CNBV; devuelve alertas regulatorias relevantes para
  negocios pequeños. No recibe ni consulta datos de ninguna persona ni negocio — es un escaneo
  general, no una búsqueda dirigida."
- **Cuándo usarla (trigger para el agente):** antes de recomendar o avanzar una transacción con un
  negocio mexicano, para saber si hay alertas regulatorias activas que deban pesar en la decisión.
- **Ejemplos de prompt que la disparan:**
  - "¿Hay alguna alerta regulatoria reciente que afecte a negocios pequeños en México?"
  - "Antes de seguir, revisa si hay novedades del DOF o la CNBV relevantes para este caso."
- **Input:** ninguno — `GET` sin body ni query obligatoria.
- **Auth:** requiere JWT de un usuario de Creva autenticado (`JwtAuthGuard`) — ver §Qué falta.
- **Precio:** $0.00 durante pruebas → precio real antes de la demo (ver §Prerrequisito).

### Recipe 2 — `creva-verify-business`

- **Tool en Bazantic:** `CrevaScoreController_verification` (`POST /creva-score/verification`)
- **Descripción para el dashboard:** "Busca un negocio mexicano en el directorio de
  establecimientos del SIEM y, si lo identifica sin ambigüedad, devuelve un sello con fuente y
  fecha de consulta. El registro es voluntario: no aparecer no es señal de nada, y el resultado
  nunca modifica un puntaje de crédito."
- **Cuándo usarla (trigger para el agente):** el agente necesita confirmar que un negocio existe y
  está en regla antes de confiar en sus datos.
- **Ejemplos de prompt que la disparan:**
  - "Verifica si 'Panadería La Espiga' está registrada en el directorio oficial."
  - "Confirma este negocio en Jalisco antes de continuar."
- **Input schema real** (`VerifyBusinessDto`, ambos campos opcionales — sin `businessName` cae al
  nombre del perfil fiscal del usuario autenticado; **no acepta `holderName` ni `rfc`**, el RFC se
  lee del perfil guardado, nunca del request):
  | Campo | Tipo | Nota |
  |---|---|---|
  | `businessName` | string (2-200) | Nombre comercial o razón social |
  | `stateCode` | integer (1-32) | Código INEGI de la entidad federativa, acota la búsqueda |
- **Ejemplo de `requestBody`:**
  ```json
  { "businessName": "Panadería La Espiga", "stateCode": 14 }
  ```
- **Auth:** requiere JWT de un usuario de Creva autenticado — ver §Qué falta.
- **Precio:** $0.00 durante pruebas → precio real antes de la demo.

### Recipe 3 — `creva-report`

- **Tool en Bazantic:** `CrevaScoreController_report` (`POST /creva-score/report`)
- **Descripción para el dashboard:** "Reporte completo de verificación pública de un negocio
  mexicano, con su sello de integridad. No emite veredicto ni recomendación de crédito."
- **Cuándo usarla (trigger para el agente):** el agente ya decidió actuar sobre un negocio y
  necesita el reporte sellado como evidencia adjunta a esa decisión.
- **Ejemplos de prompt que la disparan:**
  - "Dame el reporte completo de este negocio para adjuntarlo a la revisión."
  - "Genera el reporte sellado de Creva para este caso."
- **Input schema real:** mismo `VerifyBusinessDto` que la Recipe 2 —
  `businessName` (opcional, string 2-200) y `stateCode` (opcional, integer 1-32). No hay `document`
  ni `embed`: esos campos son de la tool MCP standalone, no de esta ruta REST.
- **Ejemplo de `requestBody`:**
  ```json
  { "businessName": "Panadería La Espiga", "stateCode": 14 }
  ```
- **Auth:** requiere JWT de un usuario de Creva autenticado — ver §Qué falta.
- **Precio:** $0.00 durante pruebas → precio real antes de la demo.

## Primer intento real — 2026-09-05, falló, sin cobro

Las 3 Recipes ya están creadas en DRAFT en el dashboard (`creva-report`, `creva-verify-business`,
`creva-regulatory-radar`). Primera llamada real intentada, sobre `creva-report`:

```json
{
  "context": "Generating a comprehensive CREVA credit risk evaluation report for a business entity with document formatting enabled.",
  "requestBody": {
    "business_name": "Panadería La Espiga",
    "document": true,
    "embed": false,
    "state_code": 14
  }
}
```

Resultado: `tool_failed` en ~5.3s, mensaje "Tool CrevaScoreController_report on gateway
xxxtxaftnzdrdjq3r6o4tp5lwq failed the call." **Sin cobro** ("No payment occurred") — el fallo no
gastó crédito de prueba.

**Dos hipótesis sin descartar, en este orden de prioridad para el siguiente agente:**

1. **Payload incorrecto.** El `requestBody` usado (`business_name`, `document`, `embed`,
   `state_code`, todo en snake_case) es el shape de la tool MCP standalone
   (`IA Hackathon - Creva score`), **no** el de `VerifyBusinessDto` que espera la ruta REST real
   (`businessName`, `stateCode`, camelCase, sin `document` ni `embed` — ver Recipe 3 arriba). Si el
   backend de Creva usa `class-validator` con `whitelist: true` (patrón común en NestJS, no
   confirmado en este repo si está activo), campos desconocidos rechazan el request entero con 400
   antes de llegar siquiera al guard de auth. **Primer paso recomendado: reintentar con el payload
   correcto (`{"businessName": "...", "stateCode": 14}`) antes de tocar el tema de JWT** — es la
   hipótesis más barata de descartar y no consume el crédito real si vuelve a fallar sin cobro.
2. **`JwtAuthGuard` sin JWT.** Si el payload correcto también falla, la causa más probable es la
   de abajo: Bazantic llamando la ruta solo con su propia API key, sin el JWT que `JwtAuthGuard`
   exige.

## Qué falta y por qué (bloqueo real, no de alcance)

- **Creación de las 3 Recipes en el dashboard de Bazantic** — ✅ hecho 2026-09-05 (ver arriba). El
  resto de esta lista sigue abierto.
- **JWT de un usuario de Creva autenticado, descubierto el 2026-09-05 al confirmar el picker de
  tools.** Las tres rutas (`radar`, `verification`, `report`) están detrás de `JwtAuthGuard` —
  Bazantic necesita algo más que su propia API key para llamarlas: un JWT válido de una cuenta de
  Creva, o un mecanismo de servicio que emule uno. Sin resolver esto, las Recipes existen pero
  fallan con 401 en la primera llamada real. Requiere decisión del humano: qué cuenta de Creva
  presta su JWT (o si se crea una cuenta de servicio dedicada) — no es una decisión técnica que un
  agente pueda tomar sola.
- **Una llamada real pagada, confirmada** — igual de bloqueada: depende de que las Recipes existan
  y del JWT de arriba, y de que el humano decida cuándo gastar el crédito de 0.30 USDC (mismo
  criterio de cautela ya aplicado a Hedera testnet y World ID en este proyecto — no gastar cuota
  real sin pedir antes).
- **Verificación mecánica (tsc/jest) no aplica a este bloque**: no hay código nuevo del lado de
  este repo — es config de un servicio de terceros sobre rutas REST que ya existen y ya están
  probadas en `creva_finance/backend`.

Este bloque queda **abierto** en `docs/plan.md` con este archivo como referencia, hasta que el
humano cree las Recipes en el dashboard y confirme la llamada pagada.
