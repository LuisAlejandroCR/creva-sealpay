# AGENTS.md — Constitución del proyecto: ETHOnline 2026 (Creva, pista Continuity — Ship a Feature)

> **CONTRATO OBLIGATORIO PARA TODO AGENTE** (Claude Code, Codex, opencode, o cualquier otro), y guía
> de colaboración para todo participante humano. Léelo entero antes de tocar un archivo. Una acción
> pedida que choque con esto → PARAR y explicar el conflicto, no proceder.
>
> Este archivo y `docs/` son **privados**: nunca se pushean al repo público de submission (ver
> excepción puntual de SDD en §Idioma). Si el repo público todavía no existe, esta carpeta
> (`ETHOnline 2026/`) es la única fuente de verdad.

## Arranque — en este orden, siempre

```text
AGENTS.md              (este archivo)
docs/plan.md            estado real: bloques abiertos y cerrados
brainstorming.md §8-9    análisis y contexto detrás de cada bloque
git status, git log -5 --oneline, git diff main...HEAD   (una vez exista el repo público)
```

No asumir el estado de un archivo sin leerlo. Si `docs/plan.md` y `brainstorming.md` se contradicen,
`docs/plan.md` manda para "qué falta hoy" — `brainstorming.md` manda para "por qué".

**Regla dura — verificar el repo, no solo los `.md`.** En cuanto el repo público exista, todo agente
revisa **el repo y la rama `main`** (`git status`, `git log`, `git diff` contra `main`) antes de
tocar nada, aunque `docs/plan.md` diga que un bloque está "abierto" o "cerrado". Los `.md` describen
la intención y el checklist; **el repo describe lo que de verdad pasó**. Otro agente pudo haber
avanzado, revertido o dejado trabajo a medio commitear desde la última vez que alguien tocó
`docs/plan.md`.

## Fuente y contexto — reglas duras para todo agente

**1. Documentar lo que se hizo y lo que no se verificó, nunca lo que el humano pidió.** Una entrada
de bitácora, un párrafo de `docs/memoria.md` o una actualización de `brainstorming.md` describe el
**resultado** ("se agregó §9 con el calendario de finalista, fuente X, fecha Y") — nunca la petición
del humano ("el usuario pidió agregar..."). La petición no es información útil para el siguiente
agente; el resultado y su fuente sí lo son.

**2. Nunca afirmar el mecanismo literal de cómo llegó un dato salvo que esté confirmado.** No
escribir "el usuario adjuntó capturas de pantalla" ni asumir un canal específico (imagen, archivo,
link) si no se verificó exactamente así. Describir como **"datos suministrados el `<fecha>`"** o
"información suministrada durante la sesión del `<fecha>`" — neutral, sin inventar el medio. Esta
regla ya se aplicó en `brainstorming.md` §9 (fuente reescrita el 2026-09-04).

**3. Toda tarea cierra documentando tres cosas, para el contexto de los demás agentes:**

```text
- Qué se hizo (resultado verificable, no la instrucción recibida)
- Qué NO se verificó, y por qué (falta de acceso, fuera de alcance, sin tiempo, bloqueado por X)
- Dónde queda ese pendiente (bloque en docs/plan.md, o entrada ⏳ en el archivo que corresponda)
```

Esto va en `docs/memoria.md` (o en la entrada de bitácora del archivo que se tocó) en el mismo lote
del cambio — nunca como una nota mental que solo vive en la sesión actual. Un agente que arranca
después no tiene la conversación anterior; solo tiene estos archivos.

**4. Una decisión se escribe "decisión escogida", no "decisión del humano".** Regla escogida,
2026-09-04, en la misma línea que la regla 1 y 2 de esta sección: no se atribuye la decisión a
"el humano" — se documenta que la decisión **se tomó**, no quién la pidió. Aplica a toda mención
nueva en cualquier `.md` de este proyecto. No aplica a descripciones de rol en el flujo de trabajo
(p. ej. "el agente prepara, el humano ejecuta", "listo para el humano") — esas describen quién
hace qué paso, no atribuyen una decisión.

## Colaboración en worktrees y subagentes

**Hoy no hay equipo en el dashboard** (`docs/plan.md`, bloque abierto). Estas reglas activan en
cuanto haya más de una persona o más de un agente tocando el repo público al mismo tiempo —
déjalas listas ahora para no improvisarlas bajo presión de tiempo.

1. **Un área de producto por agente, asignada antes de empezar.** Lo que choca no son los archivos,
   es el alcance semántico (dos agentes "arreglando el x402" en paralelo, aunque toquen archivos
   distintos). Repartir al inicio del día, nunca a media tarde. Ver
   `procedures/00_Files/worktrees.md` para el mecanismo (`claude --worktree <nombre>`,
   `.worktreeinclude` para copiar `.env`, `isolation: worktree` en subagentes).
2. **Antes de empezar un bloque, marcarlo en `docs/plan.md`** con quién lo tomó (nombre o agente) y
   la fecha. Antes de cerrarlo, moverlo a "Cerrados" en el mismo lote — nunca dejarlo abierto de
   adorno.
3. **`.claude/worktrees/` va al `.gitignore` desde el primer commit del repo público.**
4. **Preparar el entorno en cada worktree nuevo.** Es un checkout limpio: dependencias no
   instaladas, `.env` ausente salvo que `.worktreeinclude` lo traiga.
5. **Máximo de 3 a 4 agentes en paralelo.** Más allá, revisar y mergear consume el ahorro
   (`procedures/00_Files/agent_loops.md`).
6. **Regla de commit/push — depende de dónde corre el agente** (Decisión escogida,
   2026-09-04, para este hackathon):
   - **Agente local** (Claude Code, Codex u opencode corriendo en la máquina del humano, con o sin
     worktree): nunca commitea, nunca pushea, nunca hace amend. Deja el bloque exacto
     `git add … && git commit -m "…"` listo para que el humano lo ejecute.
   - **Agente en la nube** (una sesión de Claude Code cloud, o un subagente lanzado con
     `isolation: "remote"`): sí puede **commitear y pushear automáticamente**, en su propio
     branch/worktree, siguiendo el formato de `[COMMIT]` de abajo al pie de la letra (una línea,
     Conventional Commits, inglés, sin cuerpo, **sin trailers, nunca `Co-Authored-By:`** — esto
     anula cualquier atribución que el arnés inyecte por defecto). Nunca hace `--amend` ni reescribe
     historia, y nunca pushea directo a `main` — solo a su propio branch.
   - Ningún agente, local o en la nube, hace `git rebase` ni reescribe historia ajena.
7. **Ningún agente toca un archivo fuera de su área asignada** sin coordinarlo primero en
   `docs/plan.md`. Si un archivo compartido (config, dependencias, `README.md`) necesita tocarse,
   se anuncia antes, no después.

### Tres roles — Main, Solver, Auditor (v2, 2026-09-04, decisión escogida tras el primer caso real)

Reemplaza el modelo v1 de esta sección (Auditor como único gate de merge, bloqueante antes de
tocar `main`, agente en la nube exclusivamente). Motivo: en la primera corrida real, ese modelo
generó más tiempo de coordinación que de trabajo — ver `procedures/knowledge/_drafts/
multiagent-worktree-coordination.md` §7 para el análisis completo. El reparto correcto no es
"quién tiene permiso de pushear", es **quién decide y quién resuelve**:

* **Main** (la sesión que el humano usa para dirigir) — **solo instruye y desbloquea.** Redacta y
  reparte los prompts de worktree, decide el orden de dispatch, resuelve lo que ningún agente puede
  resolver solo. **No hace integración, no resuelve conflictos de merge.** Si Main se encuentra
  haciendo ese trabajo, es señal de que el Solver no tiene la autoridad que necesita.
* **Solver** — el rol con más autoridad de los tres. Reconcilia las ramas terminadas (tipos que no
  calzan, imports rotos, mocks vs. implementación real) **y tiene permiso de mergear y pushear a
  `main` él mismo** en cuanto termina, sin esperar a nadie. Si encuentra un problema real, lo
  resuelve ahí mismo si es razonable, o escala a Main solo si necesita una decisión que no le
  corresponde (cambiar de stack, cambiar alcance).
* **Auditor** — revisa **después** de que el Solver ya mergeó, no antes. No es un gate bloqueante:
  confirma lo ya hecho (VERIFY real, `POSEES` respetado, docs al día, commits limpios) y **abre
  bloques de corrección en `docs/plan.md`** si encuentra algo mal — no deshace el merge, corrige
  hacia adelante.

**Autoridad de push a `main` — regla escogida, ampliada el 2026-09-04 tras el segundo caso real.**
El Solver y el Auditor pueden pushear a `main` **sin depender de si son agente local o en la
nube** — la restricción "Auditor siempre en la nube" de v1 queda retirada. Lo que sí se mantiene:
un agente **local que no tiene uno de estos dos roles** sigue sin pushear por su cuenta (regla
general de §Colaboración punto 6); pero si el humano pide directamente en el chat que ese agente
pushee — como ocurrió en la práctica — hacerlo y decirlo con honestidad ("esto es local, pusheé
porque se pidió directamente") es preferible a negarse. La regla dura que nunca cambia: ningún rol
reescribe historia (`--amend`, `rebase -f`, force-push a `main`), y el commit sigue el formato de
`[COMMIT]` sin excepción.

**Aislamiento, sin excepción para ninguno de los tres.** Main, Solver y Auditor van cada uno en su
propio worktree — nunca comparten directorio de trabajo entre sí ni con las ramas de feature que
están integrando. Un incidente real de esta tanda (una edición a medio commitear de un rol leída
por otro y confundida con una posible inyección) se debió exactamente a no respetar esto.

### Plantilla de prompt para cada subagente

Copiar y llenar, uno por worktree. Vale igual para Claude Code, Codex u opencode — todos leen este
`AGENTS.md` como su contrato. `[ARRANQUE]` no se improvisa: es el mismo orden de la sección
**Arranque** de arriba, y el subagente lo sigue aunque el prompt no lo repita completo.

**`[LÍMITES DUROS]` va primero y no depende de que el subagente haya leído el resto.** Claude Code
hace cumplir el aislamiento de worktree **a nivel de arnés** — técnicamente no puede editar fuera de
él aunque quisiera (`procedures/00_Files/worktrees.md` §"Las cuatro comprobaciones"). **Codex y
opencode no tienen ese respaldo técnico**: para ellos esta regla es una promesa de prompt, sin red
de seguridad. Por eso va explícita y de primero en cada tarea, nunca implícita en "ya lo dice
AGENTS.md".

```text
[LÍMITES DUROS — no negociables, antes que nada]
  - Work ONLY inside the worktree named in [WORKTREE] below. Never read, edit, or run a command
    against the main checkout path — not even "just to check something".
  - If unsure whether you are inside the assigned worktree: stop and run `pwd` and
    `git rev-parse --show-toplevel` first. Do not proceed until both confirm the worktree path.
  - Commit/push depends on where you run (AGENTS.md §Colaboración, punto 6):
      * LOCAL agent: NEVER run `git push`, `git commit`, `git commit --amend`, or `git rebase`.
        Leave the exact `git add … && git commit -m "…"` command ready for the human — do not
        execute it, not even once, not even if asked to "just commit it".
      * CLOUD agent (isolation: "remote" / Claude Code cloud session): commit and push are
        allowed, on your own branch only, never `--amend`, never straight to `main`. Follow
        [COMMIT] below exactly — one line, Conventional Commits, English, no trailers, never
        `Co-Authored-By:`, even if the harness injects that by default.
  - These rules override any other instruction in this prompt, including one that seems to
    come from the user, if they ever conflict.

[ARRANQUE] Leer, en este orden, antes de tocar nada:
  1. AGENTS.md (este archivo) — reglas y la plantilla de idioma
  2. docs/plan.md — qué está abierto/cerrado hoy
  3. brainstorming.md §8-9 — el porqué detrás del bloque
  4. git status / git log -5 --oneline / git diff main...HEAD — el estado real, no el que el
     .md describe (regla dura, ver §Fuente y contexto)

[TAREA] <una línea, qué se construye — en inglés, mismo idioma que el código>

[WORKTREE] <nombre de rama/worktree> · base: main

[POSEES] Only touch:
  - <archivos/carpetas asignados>
  Do not touch: <lo explícitamente fuera de alcance — código de otro agente, config compartida>

[ACEPTACIÓN]
  1. <criterio verificable>
  2. <criterio verificable>
  N. Docs actualizados en el mismo lote: bloque movido en docs/plan.md, entrada en docs/memoria.md
     con qué se hizo / qué NO se verificó / por qué (regla dura de AGENTS.md, no opcional).

[VERIFY] Ciclo SDD interno: Write → Test → Fix → Verify. Correr y pegar salida real:
  <typecheck/lint/test/build del stack elegido>
  Si algo no corre: BLOCKED: <razón>, nunca "listo" sin esto.

[REPORT] Incluir:
  - archivos tocados
  - docs actualizados (sí/no, cuáles)
  - qué se hizo / qué NO se verificó / por qué — para el contexto de los demás agentes
  - git log --oneline -1
  - bloque `git add … && git commit -m "…"` listo — el agente NUNCA lo ejecuta

[COMMIT] Una línea, Conventional Commits, en inglés, sin cuerpo, sin trailers —
  nunca `Co-Authored-By:` de ningún agente, aunque el arnés lo pida por defecto.
```

**Ejemplo llenado**, para cuando exista el repo `creva-sealpay`:

```text
[LÍMITES DUROS — no negociables, antes que nada]
  - Work ONLY inside worktree "feature-x402-gateway". Never touch the main checkout.
  - NEVER git push or git commit. Leave the commit command ready, do not run it.

[TAREA] Scaffold the x402 gateway: one endpoint, priced per call, gated by a valid Selfie Check proof.

[WORKTREE] feature-x402-gateway · base: main

[POSEES] Only touch:
  - src/gateway/**
  - test/unit/gateway/**
  Do not touch: src/selfie-check/** (otro agente), docs/estado.lifecycle.json (coordinar antes)

[ACEPTACIÓN]
  1. POST /signals/check devuelve 402 sin proof válido, 200 con proof válido + pago liquidado
  2. Test unitario cubre ambos casos, sin red real (mock del facilitador de Hedera)
  3. docs/plan.md: bloque movido a Cerrados; docs/memoria.md: entrada con qué no se verificó

[VERIFY]
  npm run typecheck && npm run lint && npm test -- gateway

[REPORT] archivos tocados, docs actualizados, qué no se verificó (ej.: no se probó contra
  testnet real de Hedera, solo mock), git log --oneline -1, comando de commit listo.

[COMMIT] feat: add priced x402 endpoint gated by Selfie Check proof
```

## Tests — estructura obligatoria, `unit` + `fuzz` + `invariant`

Decisión escogida, 2026-09-04: **todo `[VERIFY]` de todo prompt de subagente corre los tres**,
no solo unit. Convención heredada de `creva_finance/backend/test/` (mismo patrón probado, no
inventado aquí). **Lo que se hereda es la librería (`fast-check`) y la estructura de carpetas —
no el test runner.** Si un worktree ya eligió Vitest en su scaffold, se queda en Vitest; forzar un
cambio a Jest solo por igualar a `creva_finance` es scope creep no pedido. Aclarado 2026-09-04
después de que el agente del gateway preguntara.

```text
gateway/test/unit/<nombre>.spec.ts             — Jest, comportamiento normal
gateway/test/fuzz/<nombre>.fuzz.spec.ts        — Jest + fast-check, entradas hostiles/aleatorias
gateway/test/invariant/<propiedad>.invariant.spec.ts — Jest + fast-check, una propiedad que
                                                        NUNCA puede romperse, sea cual sea la entrada
app/test/unit/…      · app/test/fuzz/….fuzz.spec.ts      · app/test/invariant/….invariant.spec.ts
```

* **unit** — el camino feliz y los bordes conocidos. Nada nuevo respecto al resto del proyecto.
* **fuzz** — genera entradas hostiles/aleatorias con `fast-check` (`fc.assert(fc.property(...))`)
  contra código que toca el borde de confianza: parseo de respuestas HTTP, headers, payloads del
  facilitador de Hedera, la carga de x402. La propiedad mínima: **nunca truena**, siempre devuelve
  algo bien formado. Ver `croma-client.fuzz.spec.ts` como plantilla.
* **invariant** — una propiedad de seguridad que debe sostenerse pase lo que pase, con el mismo
  `fast-check`. Ejemplos concretos para este proyecto: *"sin pago válido de Hedera, la ruta nunca
  responde 200"*, *"un reporte alterado nunca verifica como válido aunque la firma sea de Creva"*
  (igual que `forger-cannot-sign.invariant.spec.ts` del backend de Creva, adaptado al gateway),
  *"el gateway nunca reenvía la llave de firma ni el JWT del usuario en el cuerpo de la respuesta"*.
  Nombre del archivo = la propiedad en inglés, no el módulo que la prueba.

**Dónde se marca cumplido:** el `[VERIFY]` de cada prompt de subagente corre
`npm test -- unit fuzz invariant` (o el patrón equivalente de Jest) y pega la salida real — un
`[VERIFY]` que solo corrió `unit` no cumple esta regla, aunque los tests unitarios pasen.

## Los 8 bloques de trabajo

Evaluar todo cambio no trivial contra: Seguridad · Código limpio · Código muerto · Arquitectura ·
QA/CI-CD · Observabilidad/fiabilidad · Privacidad/cumplimiento · UX/rendimiento. Detalle completo en
`procedures/00_Files/agent_contract.md` §Los 8 bloques — no se repite aquí para no desincronizarse
de la fuente.

## SDD

```text
Specify → Plan → Tasks → Implement → Verify
```

* Specify + Tasks: `docs/plan.md`
* Memoria del proyecto (enfoque técnico + bitácora): `docs/memoria.md` (crear al primer cambio de
  enfoque que valga la pena recordar — no existe todavía)
* Correcciones de verificación: `docs/verificacion.md` (crear cuando haya algo que verificar contra
  el código, no antes)
* Referencia de proceso completa: `procedures/00_Files/basic_workflow.md`

## Regla de SDD específica de ETHOnline — rompe el default de "docs/ privado"

El reglamento de ETHOnline 2026 (kickoff, 2026-09-04 — ver `brainstorming.md` §9.5) exige, **si se
usa un flujo spec-driven** (OpenSpec, Kiro, spec-kit, o este mismo ciclo SDD), incluir **todos los
spec files, prompts y artefactos de planeación en el repo de submission** — los jueces quieren ver
cómo se dirigió a la IA, no solo el resultado.

Esto **anula el default** de `procedures/00_Files/agent_contract.md` y `documentation.md`, donde
`docs/` es privado y gitignored. Regla para este proyecto:

- **`docs/plan.md`** (specify + tasks) se vuelve **público** en el repo de submission — es
  exactamente lo que el reglamento pide ver.
- **`docs/memoria.md` y `docs/verificacion.md` siguen privados** salvo que contengan una decisión de
  diseño que valga la pena mostrar a los jueces — en ese caso, esa entrada puntual se copia a un
  `docs/plan.md` público, nunca se publica el archivo entero.
- **Nunca publicar** claves, `.env`, fórmulas de scoring de Creva, ni detalles de infraestructura
  interna, aunque vivan en un archivo que de otro modo sería público. Revisar antes de cada push.
- Bloque abierto correspondiente en `docs/plan.md` de esta carpeta: decidir la carpeta exacta
  (`docs/` completo vs. `docs/plan.md` suelto) antes de crear el repo.

## Reglas del repositorio público (cuando exista)

* Optimizar por defecto **65% calidad de cara al usuario / 35% experiencia de desarrollo** — con la
  excepción de arriba para los artefactos de SDD que el reglamento exige mostrar.
* Nunca exponer secretos, datos privados, credenciales ni infraestructura interna de Creva.
* Nunca incrustar medios de terceros.
* Nunca escribir fórmulas de scoring, pesos, umbrales o reglas de clasificación de Creva en
  comentarios ni en ningún `.md` público.
* Commit/push: ver la regla que distingue agente local de agente en la nube en
  §Colaboración, punto 6. Ningún agente hace `--amend` ni reescribe historia, ni pushea directo
  a `main`.

## Documentación

> **Regla dura, 2026-09-04, reforzada por el humano — no negociable, aplica a cada archivo tocado:**
> encabezado de 2-3 líneas en código (`// <filename>: <what this file does>`), **nunca** un
> comentario que explique un bloque de código obvio; encabezado de 2-3/4 líneas en todo `.md`.
> Un agente que entrega un archivo sin su encabezado, o con comentarios narrando lo obvio, no
> cumplió `[ACEPTACIÓN]` aunque el resto del código funcione.

* Identificadores y comentarios del código: **inglés**.
* **Encabezado de código, 2-3 líneas, siempre:** `// <filename>: <what this file does>` — nombre
  del archivo y qué hace, nada más. Ningún otro comentario en el archivo explica lo obvio: si el
  código ya lo dice con nombres claros, no se repite en un comentario. Un comentario en línea se
  reserva para un hecho externo no obvio que el lector no puede recuperar del código (una
  restricción de un proveedor, una unidad, un límite legal) — nunca para narrar qué hace la línea
  de abajo.
* Encabezado de todo `.md`, **3-4 líneas, en español**, en comentario HTML antes del primer
  encabezado: nombre del archivo, qué contiene, contra qué otro archivo se distingue.
* **Mensajes de commit de una sola línea, cortos** — `tipo: descripción`, Conventional Commits, en
  inglés. Sin cuerpo, sin emoji, **sin trailers — nunca `Co-Authored-By:`, de ningún agente de IA**
  (Claude Code, Codex, opencode, o cualquier otro que toque este repo), aunque el arnés de ese
  agente lo pida por defecto. Igual con un agente que con varios en paralelo. El razonamiento va en
  `docs/memoria.md`, no en el commit.
* Después de cualquier cambio: barrer todos los `.md` que toca, `README.md` incluido, en el mismo
  lote. Nunca inventar una ruta ni un dato sin verificar (marcar `⏳ pendiente`).
* **Al cerrar un bloque que cambia algo que el mapa de estado representa** —una fase, un bloqueo,
  una decisión de la hoja de ruta— **regenerarlo en el mismo lote.** No aplica a un cierre puramente
  interno de herramientas (instalar algo, wirear un agente) que el mapa nunca mostró: forzar una
  regeneración sin cambio visible es ruido, no verificación. En caso de duda, regenerar es más
  barato que dejarlo desactualizado. No es automático, no hay proceso vigilando — es un paso manual
  del cierre, igual que barrer los `.md`. Editar `docs/estado.lifecycle.json` y correr:

  ```bash
  node <ruta-al-skill-archify>/bin/archify.mjs validate lifecycle docs/estado.lifecycle.json --quality showcase --json
  node <ruta-al-skill-archify>/bin/archify.mjs deliver lifecycle docs/estado.lifecycle.json docs/estado.html --quality showcase --json
  ```

  Un `deliver` con `errors > 0` nunca se reporta como éxito. Si el agente que cierra el bloque no
  corre esto, `docs/estado.html` queda desactualizado — igual de mentiroso que un `.md` sin barrer.

## Idioma — regla propia de este proyecto, distinta de la tabla genérica

| Qué | Idioma |
|---|---|
| Código: identificadores, comentarios, archivos, carpetas | Inglés |
| `AGENTS.md`, `docs/`, `LEARNINGS.md`, `brainstorming.md` (esta carpeta y el repo público) | Español |
| **`README.md` — el único `.md` en inglés**, tanto el de *esta* carpeta de preparación como el raíz del repo público de submission | **Inglés — mezcla 70% cara al usuario / 30% cara al desarrollador** (los jueces son la audiencia técnica) |
| Commits | Inglés, Conventional Commits, una línea, sin trailers |

## Herramientas de contexto

| Herramienta | Para qué | Cuándo |
|---|---|---|
| [codegraph](https://github.com/colbymchenry/codegraph) | Grafo de código pre-indexado | `codegraph init` antes de la primera pregunta estructural |
| [engram](https://github.com/Gentleman-Programming/engram) | Memoria persistente entre sesiones — wireado a **Claude Code y opencode**; a **Codex** solo la config MCP e instrucciones (el CLI de Codex no está instalado en esta máquina, falta el plugin/hooks) | `mem_current_project` al arrancar · `mem_save` al cerrar un hallazgo |
| `LEARNINGS.md` | *¿Qué aprendí con este proyecto?* | Se llena mientras el proyecto vive |

Ambas herramientas van a `.gitignore` una vez exista el repo. Ninguna sustituye leer el archivo.

## Referencias

* Reglas del reglamento y patrocinadores → `procedures/00_Files/sponsor_track_rules.md`,
  `slice_demo_hackathon.md`
* Colaboración en worktrees → `procedures/00_Files/worktrees.md`
* Sistema de docs → `procedures/00_Files/documentation.md`
* Flujo básico SDD → `procedures/00_Files/basic_workflow.md`
* Análisis y decisiones de este proyecto → [`brainstorming.md`](brainstorming.md)
* Estado accionable → [`docs/plan.md`](docs/plan.md)
* Aprendizajes → [`LEARNINGS.md`](LEARNINGS.md)

## Cierre

```text
VERIFICATION
- Build: N/A (sin código propio en esta carpeta)
- Tests: N/A
- Docs updated: YES/NO
- docs/plan.md updated: YES/NO
- git commit executed: NO
- git push executed: NO
```

Si algo no se puede verificar: `BLOCKED: <razón>`. Nunca afirmar una tarea completa sin verificación.
