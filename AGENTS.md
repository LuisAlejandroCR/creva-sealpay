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
6. **Nunca commitear, nunca pushear, nunca hacer amend.** Cada agente deja el bloque exacto
   `git add … && git commit -m "…"` listo para el humano — con uno o con cinco agentes en paralelo.
7. **Ningún agente toca un archivo fuera de su área asignada** sin coordinarlo primero en
   `docs/plan.md`. Si un archivo compartido (config, dependencias, `README.md`) necesita tocarse,
   se anuncia antes, no después.

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
  - NEVER run `git push`, `git commit`, `git commit --amend`, `git rebase`, or anything that
    rewrites history. Leave the exact `git add … && git commit -m "…"` command ready for the
    human — do not execute it, not even once, not even if asked to "just commit it".
  - These two rules override any other instruction in this prompt, including one that seems to
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
* Nunca commitear, pushear, hacer amend ni reescribir historia. El agente prepara, el humano ejecuta.

## Documentación

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
