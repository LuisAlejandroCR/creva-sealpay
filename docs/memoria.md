<!-- docs/memoria.md: enfoque técnico + bitácora de sesión de la preparación de ETHOnline 2026. No es
     el checklist (docs/plan.md) ni el análisis (brainstorming.md): aquí va qué se hizo, qué no se
     verificó y por qué — el contexto que necesita el siguiente agente que no vivió esta sesión. -->

# Memoria — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

## Bitácora

### 2026-09-04 (hueco cerrado: la plantilla de subagente no garantizaba worktree ni "nunca push")

**Qué se hizo:** el usuario preguntó si los subagentes realmente sabían que debían trabajar en su
worktree y nunca pushear a `main`. Revisando la plantilla agregada en el lote anterior, la respuesta
era **no de forma confiable**: el aislamiento y la prohibición de push vivían en `§Colaboración`
(reglas 1 y 6) y se asumía que `[ARRANQUE]` (leer `AGENTS.md` primero) bastaba para que el subagente
las absorbiera. Eso es débil para Codex y opencode: **Claude Code hace cumplir el aislamiento de
worktree a nivel de arnés** (técnicamente no puede editar fuera de él); Codex y opencode no tienen
ese respaldo — para ellos la regla es solo una promesa de prompt. Se agregó un bloque
`[LÍMITES DUROS]` al principio de la plantilla (antes de `[ARRANQUE]`), independiente de que el
subagente lea o no el resto, con instrucción explícita de verificar `pwd` / `git rev-parse
--show-toplevel` si hay duda, y la aclaración de que estas dos reglas ganan sobre cualquier otra
instrucción del prompt si llegan a chocar. Se actualizó el ejemplo llenado para incluirlo.

**Qué NO se verificó:** no se probó el prompt actualizado contra una sesión real de Codex u
opencode — no hay ninguna corriendo en este proyecto todavía (sigue sin repo público, sin equipo).
Es una mejora de diseño del prompt, no algo confirmado en la práctica.

**Dónde queda el pendiente:** cuando exista el repo y el primer subagente real, confirmar que el
bloque `[LÍMITES DUROS]` efectivamente se respeta antes de confiar la regla a un segundo agente en
paralelo.

### 2026-09-04 (engram para Codex/opencode; reglas de comentarios y commits reforzadas)

**Qué se hizo:** se corrió `engram setup opencode` (plugin instalado limpio, 3 archivos en
`~/.config/opencode/plugins`, más `opencode-subagent-statusline` habilitado) y `engram setup codex`
— este último escribió la config MCP y los archivos de instrucciones en `%APPDATA%\codex\`, pero
avisó que el CLI de Codex no está en el `PATH` de esta máquina, así que el plugin/hooks no se
instaló. Se verificó con `which codex` / `codex --version`: en efecto no está instalado — no se
inventó que quedó completo. Se dejó el comando manual de instalación (`codex plugin marketplace
add ... && codex plugin add engram@engram`) anotado en `docs/plan.md` para cuando el CLI exista.

Se reforzaron en `AGENTS.md` dos reglas que ya existían pero quedaban implícitas: (1) "sin
`Co-Authored-By`" ahora nombra explícitamente a los tres agentes (Claude Code, Codex, opencode) en
vez de decir "el arnés" en genérico — importante porque cada CLI tiene su propio default de
atribución y ahora hay tres wireados a este repo; (2) se agregó la regla explícita de evitar
comentarios obvios en el código, que antes vivía solo en el `CLAUDE.md` global de Claude Code y por
lo tanto no la veían Codex ni opencode al leer `AGENTS.md` como su propio contrato.

También se ajustó la regla de regenerar `docs/estado.html` al cerrar un bloque: se acotó a bloques
que cambian algo que el mapa representa (fases, bloqueos, decisiones de hoja de ruta), no a cierres
puramente internos de herramientas — este mismo lote (wirear engram, reforzar reglas de docs) es un
ejemplo de cierre que **no** regenera el mapa, porque nunca lo mostró.

**Qué NO se verificó:** no se confirmó que `engram setup opencode` realmente registró el MCP
correctamente (no hay sesión de opencode corriendo en esta máquina para probarlo); se confía en el
`✓ Installed` del propio instalador. Tampoco se instaló el CLI de Codex — eso no se pidió, solo
wirear engram.

**Dónde queda el pendiente:** bloque abierto en `docs/plan.md` — instalar el CLI de Codex y correr
el comando manual del plugin, si se llega a usar Codex en este proyecto.

### 2026-09-04 (Bazantic confirmado — cierre de bloque + regeneración del mapa)

**Qué se hizo:** el usuario reportó que el acceso a Bazantic ya llegó, y compartió el dato del
patrocinador: ~0.30 USDC de crédito al crear el primer gateway, con dos formas de no gastarlo en
pruebas (JWT que bypassea x402/MPP, o precio $0.00 por método). Se actualizó `brainstorming.md` §8
(ítem 6 de ⏳ a ✅, con el detalle del crédito), se cerró el bloque correspondiente en `docs/plan.md`,
se agregó la entrada a `LEARNINGS.md` §1, y — siguiendo la regla que se agregó a `AGENTS.md` en el
lote anterior ("al cerrar un bloque, regenerar el mapa de estado en el mismo lote") — se editó
`docs/estado.lifecycle.json`: se quitó el nodo/carril de bloqueo de Bazantic (ya no bloquea nada) y
se movió su información a la tarjeta "Hecho hasta hoy". `validate --quality showcase` y
`visual-check` pasaron limpios en el primer intento (el diagrama quedó más simple que antes, no más
complejo, así que no repitió el problema de desborde del lote anterior).

**Qué NO se verificó:** el monto exacto (~0.30 USDC) y el mecanismo de bypass (JWT o precio $0) se
tomaron tal como los reportó el usuario — no se abrió el dashboard de Bazantic para confirmarlos
independientemente. Quedan como dato de patrocinador, no como cifra verificada en fuente primaria
propia.

**Dónde queda el pendiente:** ninguno nuevo — si el monto o el mecanismo resultan distintos al usar
el gateway de verdad, se corrige con fecha en `brainstorming.md` §8, no en silencio.

### 2026-09-04 (mapa de estado con archify, y decisión sobre "start from scratch")

**Qué se hizo:** se instaló el skill `archify` (`npx skills add tt-a1i/archify --agent claude-code
--global`, confirmado antes de correrlo) y se construyó `docs/estado.lifecycle.json` →
`docs/estado.html`, un diagrama de tipo `lifecycle` con las cinco fases del proyecto (solicitud →
prep → build → judging prep → entrega) y el bloqueo de Bazantic como rama lateral, más tres tarjetas
resumen (hecho / por hacer / bloqueo). Pasó las 9 comprobaciones de `validate --quality showcase`
(0 errores, 0 warnings) en el primer intento. `visual-check` sí falló al principio — el artefacto
desbordaba el viewport en 1440×900 y mayores (scrollHeight hasta 1437px). Se corrigió en tres pasos
verificados empíricamente: recortar las tarjetas, quitar el carril `terminal` (innecesario una vez
se resolvió el riesgo de abajo) y sobre todo **bajar `meta.viewBox` de `[980,660]` a `[980,566]`**
— el mínimo del schema — una vez el contenido ya no necesitaba la banda terminal. `visual-check`
final: `status: pass`, sin diagnósticos.

Aparte, el usuario señaló que el nodo "¿Start from scratch?" era incorrecto — la entrada es por
Continuity. Se tomó como decisión (no confirmación externa): la regla del track, citada con fuente
en §0.1 de `brainstorming.md`, manda sobre la línea genérica de la diapositiva. Se quitó el nodo del
diagrama, se reescribió `brainstorming.md` §9.2 como decisión fechada, se agregó la fila
correspondiente a la tabla de decisiones de `LEARNINGS.md` §3, y se cerró el bloque abierto
equivalente en `docs/plan.md`. Se agregó a `AGENTS.md` la regla de que regenerar
`docs/estado.html` es un paso manual del cierre de cualquier bloque, no un proceso automático.

**Qué NO se verificó, y por qué:** no se confirmó con ETHGlobal que "start from scratch" en efecto
no aplica a Continuity — es una decisión del equipo basada en qué regla es más específica, marcada
como tal en los tres archivos que la registran, no como un hecho verificado externamente. Tampoco se
corrió `archify doctor` ni se leyó `references/viewer-runtime.md`, porque el flujo básico de
`validate`/`deliver`/`visual-check` fue suficiente sin tocar esas rutas opcionales.

**Dónde queda el pendiente:** si la sesión de feedback (09/08 o 09/10) o el Q&A (09/14) contradicen
la decisión de "start from scratch", se revierte con fecha y fuente en `brainstorming.md` §9.2,
`LEARNINGS.md` §3 y — si cambia el estado del proyecto — en `docs/estado.lifecycle.json`.

### 2026-09-04 (README.md de esta carpeta traducido a inglés)

**Qué se hizo:** se tradujo `README.md` de esta carpeta a inglés completo — deja de ser la
excepción que `AGENTS.md` describía. Se actualizó la tabla de idioma de `AGENTS.md`: ahora
`README.md` es el único `.md` en inglés en todo el proyecto (esta carpeta y el futuro repo
público), el resto sigue en español.

**Qué NO se verificó:** no se retradujo `docs/plan.md` ni ningún otro `.md` — la instrucción fue
específica a `README.md`. No se verificó si el `README.md` del futuro repo público necesitará
contenido distinto al de esta carpeta (esta versión describe la preparación, no el producto
entregado) — queda igual que antes, sin bloque nuevo porque ya existía la distinción conceptual.

### 2026-09-04 (engram instalado y wireado a Claude Code)

**Qué se hizo:** ni `engram` ni `codegraph` estaban presentes (sin binario, sin servidor MCP, sin
rastro en `.claude/`) — se verificó con `which`, búsqueda de archivos y `ToolSearch` antes de asumir
nada. Se instaló `engram` v1.20.0 para Windows: se listaron los assets del release v1.20.0 con
`gh release view/download` (no había Go 1.24+ para `go install`), se descargó
`engram_1.20.0_windows_amd64.zip`, se comparó su `sha256sum` contra `checksums.txt` del mismo
release **antes de extraer nada**, y se extrajo a `~/bin` (ya estaba en `PATH`). Se confirmó con
`engram version` → `1.20.0`. Se corrió `claude plugin marketplace add Gentleman-Programming/engram`
y `claude plugin install engram` para wirearlo como servidor MCP de Claude Code. `codegraph` se dejó
sin instalar — ver el bloque correspondiente en `docs/plan.md`.

**Qué NO se verificó, y por qué:** las cuatro herramientas MCP (`mem_current_project`, `mem_search`,
`mem_save`, `mem_session_summary`) **no se probaron en esta sesión** — un plugin de Claude Code se
carga al arrancar la sesión, y esta ya estaba corriendo cuando se instaló. Hace falta una sesión
nueva para confirmar que aparecen. Tampoco se corrió `engram setup <agente>` para Codex u opencode —
solo se confirmó el wireo a Claude Code, que fue lo que se pidió explícitamente.

**Dónde queda el pendiente:** bloques abiertos en `docs/plan.md` — verificar las cuatro herramientas
MCP en una sesión nueva, y wirear `engram` para el resto de agentes cuando haga falta.

### 2026-09-04 (reglas duras de documentación y verificación de repo)

**Qué se hizo:** se agregaron dos reglas duras a `AGENTS.md`: (1) toda entrada de bitácora describe
el resultado y su fuente, nunca la petición del humano que lo originó, y nunca afirma un canal de
entrega de datos (imagen, archivo) sin confirmarlo — se usa "datos suministrados el `<fecha>`"; (2)
todo agente revisa el repo público y la rama `main` (`git status`, `git log`, `git diff` contra
`main`) antes de tocar nada, aunque `docs/plan.md` diga otra cosa, y cierra documentando qué hizo,
qué no verificó y por qué. Se corrigió `brainstorming.md` §9 ("capturas... revisadas por el
usuario" → "datos suministrados el 2026-09-04") para cumplir la regla nueva desde el primer caso.

**Qué NO se verificó, y por qué:** el contenido factual de `brainstorming.md` §9 (cupos de
finalista, paquete, fechas de check-in y feedback, regla de SDD) sigue **sin contrastar contra una
URL pública de ethglobal.com** — la sesión que lo originó no incluyó un enlace, solo datos
suministrados directamente. Ya está marcado así en la propia §9 ("No es una URL pública..."). No se
buscó la página equivalente en este lote porque no se pidió y no era el foco del cambio.

**Dónde queda el pendiente:** sin bloque nuevo en `docs/plan.md` — ya existe el bloque abierto
"Confirmar si 'start from scratch' aplica a Continuity", que cubre la misma necesidad de contrastar
§9 contra una fuente pública antes de depender de ella para una decisión grande.

## Verify

1. `AGENTS.md` tiene las dos reglas duras, en su propia sección, no mezcladas con otra.
2. Ningún `.md` de esta carpeta describe el canal literal de entrega de un dato sin haberlo
   confirmado.
3. Esta entrada existe en el mismo lote que el cambio a `AGENTS.md`.
