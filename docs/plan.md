<!-- docs/plan.md: bloques de trabajo con criterio de aceptación, abiertos vs cerrados, para la
     preparación de ETHOnline 2026. No es la bitácora (docs/memoria.md tiene el qué-se-hizo/qué-no-
     se-verificó) ni el brainstorming (brainstorming.md tiene el análisis; aquí solo el checklist
     accionable). Se actualiza en el mismo lote que cualquier cambio de estado. -->

# Plan — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Última actualización:** 2026-09-04

Ver [`brainstorming.md`](../brainstorming.md) §8 y §9 para el análisis completo detrás de cada
bloque. Esta tabla es solo el checklist.

## Abiertos

- [ ] **Crear el repo público de submission.** Todavía no existe (`brainstorming.md` §8, ítem 3).
  Criterio de aceptación: repo creado, `AGENTS.md`/`CLAUDE.md`/`docs/` gitignored desde el primer
  commit, `README.md` en inglés con mezcla 70% cara al usuario / 30% cara al desarrollador (regla
  nueva de este proyecto — ver `AGENTS.md` §Idioma, distinta de la tabla genérica de
  `procedures/00_Files/agent_contract.md`).
- [ ] **Decidir qué parte de `docs/` se vuelve pública por la regla de SDD.** El reglamento exige
  incluir specs, prompts y artefactos de planeación en el repo de submission si se usa un flujo SDD
  (`brainstorming.md` §9.5). Criterio de aceptación: una carpeta explícita (p. ej.
  `docs/publico/` o `research/`) documentada en `AGENTS.md` como la única parte de `docs/` que se
  commitea, sin lógica de negocio de Creva adentro.
- [ ] **Responder los dos check-ins de la semana del 09/07** en el hacker dashboard. Criterio de
  aceptación: ambos respondidos — el stake en ETH solo se devuelve si se responde y se entrega
  proyecto (`brainstorming.md` §9.4).
- [ ] **Asistir a las sesiones de feedback.** Martes 09/08 2–4 PM ET y jueves 09/10 9–11 AM ET.
  Criterio de aceptación: al menos una sesión asistida.
- [ ] **Armar equipo o confirmar que va solo.** Hoy sin equipo en el dashboard
  (`brainstorming.md` §8). Criterio de aceptación: decisión tomada antes de repartir áreas de
  worktree (ver `AGENTS.md` §Colaboración).
- [ ] **Guion y grabación del video demo.** Debe caber en 3 minutos (el límite más estricto, el
  Q&A en vivo del 09/14) y servir también para el rango de 2–5 min que piden los patrocinadores
  (`brainstorming.md` §9.6). Criterio de aceptación: guion escrito, cronometrado, y video grabado
  antes del corte del evento (16 sep 2026).

- [ ] **`codegraph` no instalado — no aplica todavía.** No hay Go ni un repo de código real que
  indexar (esta carpeta tiene 6 `.md`, sin repo público). Su propia regla ("Cuándo no",
  `procedures/00_Files/codegraph.md`) dice que un repo de menos de ~20 archivos no compensa
  indexarlo. Revisar `codegraph init` recién exista el repo público con código.
- [ ] **Instalar el CLI de Codex, si se va a usar.** No está instalado en esta máquina. `engram
  setup codex` ya dejó la config MCP y los archivos de instrucciones listos en
  `%APPDATA%\codex\` — falta el plugin/hooks, que requiere el CLI real. Comando de instalación
  manual anotado en `docs/memoria.md` 2026-09-04.

## Cerrados

- [x] `2026-09-01` — Aplicación a Continuity enviada, con ENS incluido.
- [x] `2026-09-03` — Stake de 0.025 ETH pagado.
- [x] `2026-09-01` — Spec OpenAPI pública desplegada (`/api/docs`, `/api/docs-json`).
- [x] `2026-09-04` — Reglas de finalista, checkpoints y regla de SDD del kickoff, incorporadas a
  `brainstorming.md` §9.
- [x] `2026-09-04` — `engram` v1.20.0 instalado (binario Windows, checksum verificado) y wireado
  como plugin MCP de Claude Code.
- [x] `2026-09-04` — Decisión: "start from scratch" no aplica a Continuity — ver `LEARNINGS.md` §3
  y `brainstorming.md` §9.2. Decisión del equipo, no confirmación de ETHGlobal.
- [x] `2026-09-04` — `README.md` de esta carpeta traducido a inglés — es el único `.md` en inglés
  del proyecto (`AGENTS.md` §Idioma).
- [x] `2026-09-04` — Mapa de estado y hoja de ruta publicado con `archify`:
  [`docs/estado.html`](estado.html) (fuente en [`docs/estado.lifecycle.json`](estado.lifecycle.json)).
- [x] `2026-09-04` — Acceso a Bazantic confirmado. Crédito de prueba ~0.30 USDC por gateway;
  bypass de x402/MPP vía JWT o métodos en $0.00 para desarrollo — ver `brainstorming.md` §8.
- [x] `2026-09-04` — `engram` wireado para **opencode** (plugin instalado, listo). Wireado para
  **Codex** solo en config MCP + instrucciones — el plugin/hooks queda como bloque abierto porque
  el CLI de Codex no está instalado aquí.

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en
   `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo — revisar contra `git status` del repo
   de submission una vez exista.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
