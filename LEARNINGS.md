<!-- LEARNINGS.md: la respuesta de este proyecto a una sola pregunta fija. -->
<!-- Plantilla: procedures/templates/LEARNINGS.md · Procedimiento: procedures/project_learnings.md -->

# ¿Qué aprendí con este proyecto?

> **Regla dura de todo agente — ver [`AGENTS.md`](AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

> Este archivo se llena mientras el proyecto vive, no el día que muere. Una línea el día que algo
> cuesta caro vale más que una retro de una hora seis meses después.
>
> Puede nombrar cliente, evento, cifras y rutas: es privado y vive en este repositorio. Lo que suba a
> `procedures/knowledge/` va anonimizado.

**Proyecto:** `ETHOnline 2026`
**Arrancó:** `2026-08-31` · **Última actividad:** `2026-09-04` · **Estado:** ⏳ activo — solicitud enviada, en revisión
**Fecha límite:** `2026-09-16` (evento: 4–16 sep 2026)
**Alias calendario:** ETHOnline, ETHGlobal
**URL:** <https://ethglobal.com/events/ethonline2026>
**Última actualización de este archivo:** `2026-09-04`

---

## 0. Qué es este proyecto

Entrada a ETHOnline 2026 por una pista de **Continuity**, extendiendo Creva. El eje es de pagos:
Selfie Check de World para el alta, x402 sobre Hedera para cobrar cada consulta, y el reporte sellado
que ya existe como respuesta firmada. Ver [brainstorming.md](brainstorming.md).

## 1. ¿Qué aprendí que no sabía antes de empezarlo?

- `2026-08-31` — **No existe un reglamento universal de hackathon, y suponerlo cuesta la estrategia.**
  El hackathon de Midnight prohibía el código previo; ETHOnline lo **permite y hasta lo premia** en
  las pistas Continuity. La misma organización, dos meses de diferencia, reglas opuestas. Leer el
  reglamento **antes** de elegir el stack, no después.
- `2026-09-01` — **Dos pistas del mismo patrocinador pueden tener puertas distintas.** World tenía
  AgentKit y Selfie Check, las dos de $3.5k. La primera exige World ID **de Orb**, que no existe en
  Colombia; la segunda no exige nada. La diferencia era **quién** tiene que estar verificado: en
  AgentKit el desarrollador, en Selfie Check la usuaria. Perder eso costó $3.5k del plan.
- `2026-09-01` — **Un requisito de un tercero puede destapar deuda propia.** Bazantic pedía una spec
  OpenAPI; Creva no tenía. Montarla reveló que la referencia escrita a mano listaba 22 endpoints
  contra 46 reales. El trámite externo pagó por sí solo, aunque el acceso no llegue.
- `2026-09-04` — **Una diapositiva de kickoff puede contradecir el reglamento ya citado con fuente.**
  "How to be a Finalist" dice "your project must start from scratch"; §0.1 de `brainstorming.md`,
  con fuente y fecha, dice que Continuity permite extender código privado existente. No se resolvió
  en la sesión — queda como riesgo abierto en `docs/plan.md` en vez de elegir una lectura a ciegas.
  Una cifra sin fuente clara se marca `⏳`, no se decide por conveniencia. *Seguimiento, mismo día:*
  se decidió tratarlo como no aplicable — ver la fila de §3 más abajo y `brainstorming.md` §9.2.
- `2026-09-04` — **Un sponsor puede dar presupuesto de prueba sin que nadie lo pida.** Bazantic
  acredita **~0.30 USDC al crear el primer gateway**, y ofrece dos formas de no gastarlo de más:
  un JWT que bypassea x402/MPP, o poner cada método en $0.00 durante el desarrollo. Vale la pena
  preguntarle a cada patrocinador por su presupuesto de testing en vez de asumir que hay que pagar
  desde el primer request — ver `brainstorming.md` §8.
- `2026-09-04` — **Un flujo SDD puede obligar a publicar lo que por defecto es privado.** El
  reglamento exige incluir specs, prompts y artefactos de planeación en el repo de submission si se
  usa spec-driven development — rompe la regla genérica de `procedures/00_Files/agent_contract.md`
  de que `docs/` siempre es privado. Documentado como excepción explícita en `AGENTS.md` de esta
  carpeta en vez de dejarlo como una contradicción implícita entre dos documentos.

## 2. ¿Qué costó más de lo esperado, y por qué?

- `2026-09-01` — **Verificar el estado real de Creva.** Tres piezas que los `.md` daban por activas
  —respaldo, KYC y ZK— no existen, y la primera versión del brainstorming construyó sobre las tres.
  La causa no fue descuido: fue **confiar en la documentación en vez del código**. Se arregló
  leyendo módulos y sondeando producción, y de ahí salió el inventario de tres estados de §2.
- `2026-09-01` — **El acceso a Bazantic es beta cerrada**, y sus tres premios exigen cuenta. Un
  patrocinador puede tener una puerta con lista de espera y el reglamento no lo dice: eso se
  descubre entrando al sitio, no leyendo la página de premios.

## 3. ¿Qué se decidió, y por qué?

| Fecha | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| `2026-09-01` | Pausar el ZK | Retomar `creva-zk` como eje | ETHOnline **no publicó ninguna pista de ZK**: pausarlo no cuesta premio alcanzable, y el sello firmado ya sostiene el relato de portabilidad |
| `2026-09-01` | Eje sobre señales + sello | Colateral on-chain en Arc | Señales y sello están vivos; el colateral **nunca existió** y ya falló con dos proveedores. Un hackathon de 12 días no es donde eso se cierra |
| `2026-09-01` | Abandonar AgentKit | Buscar un Orb | Sin Orbs en Colombia; el pasaporte NFC no sustituye. x402 nunca dependió de AgentKit |
| `2026-09-01` | Enviar la solicitud con ENS incluido | Quitar la mención | Decisión del humano. Consecuencia asumida: **ENS pasa a ser obligatorio de entregar** |
| `2026-09-04` | Tratar "start from scratch" como no aplicable a Continuity | Dejarlo como riesgo abierto hasta confirmación externa | Decisión del humano: la regla del track (§0.1, con fuente) es más específica que la línea genérica de la diapositiva de kickoff. **No es una confirmación de ETHGlobal** — se revierte si la sesión de feedback o el Q&A dicen lo contrario |

## 4. ¿Qué se volvería a hacer igual?

- Sondear producción en vez de creerle a los `.md`. Una petición al endpoint público probó en diez
  segundos lo que un pendiente afirmaba mal desde hacía once días.
- Puntuar las ideas por **carga** —si borras la integración, ¿se rompe el producto?— antes que por
  premio. Eliminó cuatro ideas de siete sin discusión.

## 5. ¿Qué no se volvería a hacer?

- Escribir un plan sobre un inventario sin verificar. La rev. 1 del brainstorming recomendaba tres
  pistas apoyadas en piezas inexistentes.
- Dar por buena la disponibilidad de una tecnología de patrocinador sin abrir su puerta de acceso.
  AgentKit y Bazantic fallaron por eso, los dos el mismo día.

---

## Listas para destilar

- [ ] Leer el reglamento antes de elegir el stack: dos hackathons seguidos, reglas opuestas sobre
      código previo → tema propuesto: ya cubierto por `sponsor_track_rules.md`, ampliar con el caso
- [ ] Dos pistas del mismo patrocinador pueden tener prerrequisitos distintos; el gate es *quién*
      debe estar verificado → tema propuesto: `sponsor_gate_check.md`
- [ ] Un requisito externo como detector de deuda documental propia → tema propuesto:
      `external_ask_audit.md`

## Verify

- Cada viñeta lleva fecha: PASS
- Cada causa es una causa, no un síntoma: PASS
- Ninguna viñeta contiene el valor de una key o un secreto: SÍ
- Lo marcado como "listo para destilar" existe en `procedures/knowledge/`: FAIL — pendiente
