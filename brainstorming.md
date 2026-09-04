<!-- brainstorming.md: opciones de proyecto para ETHOnline 2026 sobre Creva. Qué permite el
     reglamento, qué está construido de verdad, ocho ideas puntuadas y la recomendación.
     Revisión 2 (2026-08-31): el inventario de la §2 se corrigió leyendo el código, no los .md.
     Tres piezas que la revisión 1 daba por activo no existen. Eso movió el eje entero. -->

# ETHOnline 2026 — brainstorming

> **Regla dura de todo agente — ver [`AGENTS.md`](AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Fecha del documento:** 2026-08-31 (rev. 2) · **Evento:** 4–16 sep 2026, online, asíncrono
**Fuente principal:** [ethglobal.com/events/ethonline2026/prizes](https://ethglobal.com/events/ethonline2026/prizes) (leído 2026-08-31)

---

## 0. Los dos hallazgos que mandan

### 0.1 · Puedes traer Creva

**ETHOnline tiene pistas de *Continuity*: se permite extender un producto privado o comercial existente.**

> *"In those tracks you can bring an existing open-source repository or extend an existing
> private/commercial product, but the work submitted for judging must include new features or
> functionality developed during the hackathon."*
> — [ETHGlobal, reglas ETHOnline](https://ethglobal.com/events/ethonline/info/start) (leído 2026-08-31)

Es **lo contrario** al reglamento de Midnight/MLH de la semana pasada, donde el código previo estaba
prohibido y `creva-zk` tuvo que nacer vacío. Aquí `creva_finance` **puede ser la base declarada**.

No elijas idea antes de elegir **pool**: casi todos los patrocinadores publican la misma pista dos
veces (Start Fresh / Continuity), con premio menor en la segunda. Continuity con Creva es más premio
esperado por hora que competir desde cero.

### 0.2 · El sello ya es el producto — y no necesita ZK

La revisión 1 de este documento trataba el ZK, el respaldo y el KYC como activos. **No lo son**
(§2). Pero al leer el código apareció algo que ningún `.md` presenta como lo que es:

```ts
// report-verification.controller.ts: the route a bank uses to check a report it was handed.
// Deliberately unauthenticated: whoever receives the report has no Creva account, and requiring
// one would make the seal useless to the only person who needs it.
```

**Creva ya entrega una atestación portátil que un tercero verifica sin cuenta.** Compromiso al
contenido canónico, firma Ed25519, folio legible en voz alta, cinco veredictos, una pantalla pública
`/verify`, y el reporte dice explícitamente **qué NO acredita**. Está construido, probado y
desplegado (bloques G.1, H, I, J, X6 de `docs/plan.md`).

> Eso no es conocimiento cero. Es algo más simple y ya terminado: **una prueba firmada**.
> El relato de portabilidad —*"la emprendedora comparte un desenlace verificable, no sus datos"*—
> **ya lo sostiene el sello**. ZK sería un *upgrade* del sello, no su cimiento.

Y como **ETHOnline 2026 no publicó ninguna pista de ZK** (ver la tabla de §1: The Graph, Hedera, Arc,
World, 1inch, ENS, Uniswap, y cuatro sin detallar), **pausar el ZK no cuesta un solo dólar de premio
alcanzable.** Es la decisión barata que pedías, y la evidencia la respalda.

---

## 1. El reglamento, en corto

| Dato | Valor |
|---|---|
| Ventana | 4–16 sep 2026 (≈12 días, asíncrono) |
| Bolsa | $100k+ · 11 patrocinadores anunciados |
| Equipo | hasta 5 personas, cada quien aceptado y con stake propio |
| Entrada | **stake en ETH**, devuelto al entregar (~3 semanas después) |
| Criterios | creatividad, funcionalidad, dificultad técnica, impacto |
| Entregable típico | repo público + README + demo en video (2–5 min según patrocinador) |

**Arquetipo:** sprint open source **con excepción declarada** (Continuity). Aplica entero
`procedures/00_Files/sponsor_track_rules.md`: nada de integración pegada en paralelo, permalinks a la
integración, README que solo afirme lo que el código hace.

| Patrocinador | Total | Lo que pide, en una línea |
|---|---|---|
| **The Graph** | $15,000 | The Graph como infraestructura *load-bearing* de un agente/IA, con datos vivos. Pista Continuity de $5k. |
| **Hedera** | $15,000 | Servicio vivo *gated* por **x402** en Hedera + plataforma que lo consume + **una petición pagada real**. $6k. |
| **Arc (Circle)** | $10,000 | Pool DeFi stablecoin-native · **Circle Agent Stack** · Arc testnet → mainnet ($5k). |
| **World** | $7,000 | **AgentKit Continuity** ($3.5k) · **Selfie Check** ($3.5k). Ambas piden documento de feedback. |
| **1inch** | $7,000 | App sobre Aqua/SwapVM, ejecución onchain durante la demo. |
| **ENS** | $5,000 | ENSv2 en **Sepolia**. Pista de integración a proyecto existente: $500. |
| **Uniswap Foundation** | $5,000 | Contribución al stack + `FEEDBACK.md`. |
| **Privy** | $5,000 | **B2B financial product** ($2.5k) · **Best financial flow** ($2.5k) — ver rev. 4 en §5. |
| **Bazantic** | $3,000 | Gateway **x402/MPP** + servidor MCP + *Recipes* para tu API. Tres pistas de $1k. La primera es **solo Continuity**. |
| **Chainlink** | $3,000 | **Confidential Workflows** en CRE ($2k, requisitos por publicar) · **Upgrade** ($500, solo Continuity, exige cambio de estado onchain). |
| **Ledger** | $5,000 | **AI Agents x Ledger** ($3.5k, start-fresh) + **Continuity** ($1.5k, extender proyecto). Debe usarse el **Ledger Key Ring CLI** (`wallet-cli ring`) del Ledger Agent Stack. Publicado 2026-09-03, [developers.ledger.com/ethonline](https://developers.ledger.com/ethonline) |

> Corregido contra el dashboard el 2026-09-01: **Bazantic son $3,000, no $5,000**, y no es pista de ZK.

### Bazantic — el hallazgo de la rev. 5

Bazantic hace **exactamente** lo que el eje necesitaba construir a mano: convierte una API en un
servicio que un agente entiende, usa y **paga**. Despliega el gateway x402, despliega un servidor MCP,
y las *Recipes* le explican al agente cuándo, por qué y cómo usar el servicio.

**Por qué es el mejor encaje del tablero, y no una pista más:**

1. **Elimina el mayor riesgo técnico.** Al caer AgentKit, x402 pasaba a implementarse a mano contra un
   facilitador de Hedera. Bazantic lo despliega. El paso 3 de la rebanada vuelve a bajar.
2. **Creva ya tiene servidor MCP** — el de `creva-score`, con `creva_regulatory_radar`,
   `creva_verify_business` y `creva_report`. Es trabajo previo declarable, no algo por inventar.
3. **Las tres pistas se alcanzan con casi el mismo trabajo**, y la #1 es **solo para Continuity** —
   menos competencia, y tú ya estás en ese pool.

| Pista | $ | Encaje con Creva |
|---|---|---|
| **Help an Agent Use Your Project** (solo Continuity) | $1,000 · 2×$500 | A/B con el mismo modelo y prompt: agente evaluando un negocio mexicano **sin** Recipe vs **con** Recipe. La mejora se mide, que es como se juzga |
| **Best Recipe usando APIs de patrocinadores** | $1,000 | Señales de Creva + otra API de patrocinador en un solo flujo |
| **Agentify a new API** | $1,000 | **El más fuerte.** Croma/SIEM/DOF/CNBV y Banxico SIE no están en Bazantic ni son de otro patrocinador: meter los registros de gobierno mexicanos al ecosistema de agentes es novedoso y reutilizable, que es justo lo que la pista premia |

**Chainlink, en cambio, encaja mal.** La pista de $500 es Continuity pero exige que la integración
**produzca un cambio de estado onchain** — *"simply displaying Chainlink data in a frontend is not
sufficient"*—, y Creva no tiene contratos. La de $2k (Confidential Workflows, CRE) es la más cercana
a la tesis de privacidad, pero **sus requisitos aún no se publican**. Vigilar, no comprometer.

> **Ninguna pista de ZK.** Bazantic no aparece indexado en ninguna fuente pública (buscado
> 2026-08-31) — es el único comodín que podría cambiar esto. Releer la página el 4 de septiembre.
>
> Tres pistas piden **feedback al patrocinador** (World ×2, Uniswap): puntaje barato y honesto.

---

## 2. Inventario corregido — leído del código, no de los `.md`

Tres estados, y la diferencia importa porque el descalificador #3 de `sponsor_track_rules.md` es
*"un README que describe funcionalidades que no están ahí"*.

### ✅ Vivo y verificado

| Pieza | Evidencia |
|---|---|
| **Reporte sellado + `/verify` público** | Ed25519, compromiso canónico, folio, 5 veredictos, throttle propio, sin sesión. Bloques G.1 · H · I · J · X6 |
| **Señales de registros de gobierno** | `creva-score/`: SIEM, DOF, CNBV, Banxico. Una factory, un cliente HTTP, una caché, cuota de organización |
| **Score explicable** | `GET /score` devuelve banda, máximos y banda por factor; el cliente no inventa cortes (bloque V6) |
| **Estados de cuenta** | Parser PDF, normalizador, matcher de identidad, movimientos |
| **Declaraciones + recomendación de crédito** | `declarations/` con procedencia `declared`, `recommendations/credit/` |
| **Frontend** | 23+ componentes, responsive 320→1440, accesibilidad medida, backend en Cloud Run |

### ⚠️ Construido pero apagado

| Pieza | Qué falta |
|---|---|
| **Clerk (auth)** | Todo el camino escrito, nadie lo ha corrido contra la cuenta del demo (C2) |

> **Corrección del 2026-08-31 — la rev. 2 se equivocó, y a favor.** Daba por apagadas la firma y las
> llaves de gobierno, citando `docs/plan.md` (abiertos de humano #3 y #4). **Los dos pendientes
> estaban obsoletos once días**: los cerró `ac9d64c` el 2026-08-20. Comprobado contra el servicio vivo:
>
> - Los cuatro secretos existen **con valor** y están montados en `creva-backend`: `CREVA_SIGNING_KEY`
>   (120 bytes), `CREVA_SIGNING_PUBLIC_KEY` (114), `CROMA_API_KEY` (43), `BANXICO_SIE_TOKEN` (64).
> - Una sonda a `/creva-score/verify` respondió `signature: "invalid"` —no `no_key`, ni desajuste de
>   `key_id`—, lo que prueba que la llave de confianza está cargada y es **el mismo par** que está en
>   disco (`key_id 7a17c9236a687c23`).
>
> **Lo que no está probado y no se va a afirmar:** que la llave privada firme (se infiere del par y
> del montaje) y que Croma y Banxico **acepten** sus llaves. Ejercer cualquiera de las dos gasta cuota
> de organización. *Que la llave llegue no es que el proveedor la acepte.*
>
> Corregido en el repo de Creva en el mismo lote: `docs/plan.md` (bloques AA y AB),
> `docs/memoria.md`, `docs/verificacion.md`, `docs/despliegue-cloud-run.md` y `LEARNINGS.md`.

### ❌ No existe

| Pieza | Realidad |
|---|---|
| **Respaldo / colateral** | **Nunca existió.** Se pensó con Reap y no ocurrió. El "camino A" está apagado |
| **KYC / on-ramp / off-ramp** | Dynerox desconectado el 2026-08-20; el KYC en casa está **decidido, no construido** |
| **Zero-knowledge** | Incompleto. `creva-zk` compila circuitos y mide latencia, pero no está integrado a Creva |

**La consecuencia:** Creva **no es hoy un producto de tarjeta**. Es un producto de **señales,
diagnóstico y atestación verificable**. Toda idea que dependa de mover colateral, emitir una tarjeta
o completar un KYC está construyendo sobre algo que ha fallado dos veces con dos proveedores
distintos. Un hackathon de 12 días no es donde eso se cierra.

---

## 3. La tesis frente a Pierre

Pierre corre sobre **Open Finance de Brasil, regulado por el Bacen**: 100+ instituciones, permiso de
solo lectura otorgado dentro de la app del banco ([lp.pierre.finance](https://lp.pierre.finance/),
leído 2026-08-31). Sus agentes con nombre viven **encima** de un río de datos que el Estado les
garantiza.

**México no tiene ese río.** El artículo 76 de la Ley Fintech (2018) ordenó las APIs estandarizadas;
la CNBV publicó en 2020 solo las disposiciones de **datos abiertos**. Las de **datos agregados y
transaccionales** —las que habilitan compartir la información de una persona— **siguen sin
publicarse**, con más de 2,170 días de retraso, y hay un amparo de finales de 2025 por omisión
regulatoria
([ArmorAML](https://armor-aml.com/que-viene-para-la-ley-fintech-en-el-2026-cuando-open-finance-y-el-sandbox-siguen-pendientes/) ·
[Finerio Connect](https://blog.finerioconnect.com/open-banking-y-su-regulacion-en-mexico/), leídos 2026-08-31).

> **Fuente primaria, y salió del propio producto.** Al ejercer el radar regulatorio el 2026-09-01
> —la sonda del paso 0— devolvió el documento exacto: *"Disposiciones de carácter general relativas
> a las interfaces de programación de aplicaciones informáticas estandarizadas a que hace referencia
> la Ley para Regular las Instituciones de Tecnología Financiera"*, CNBV, **2020-06-04**. Es la única
> disposición del artículo 76 publicada, y por eso la tesis no depende de un blog.
>
> Que el radar de Creva encuentre solo, sin que nadie se lo pida, la norma que sostiene la tesis del
> proyecto **es material de demo**: 15 segundos del video de 60.

> **La tesis, corregida por §0.2:**
> donde no hay un regulador que garantice el flujo del dato, la portabilidad sale de la
> **criptografía**. Pierre tiene el río; Creva tiene **el sello**. Y el sello viaja donde el río no
> llega.
>
> La versión anterior decía *"la prueba"* pensando en ZK. Decir *"el sello"* es más pequeño, más
> honesto y **ya está construido** — que es exactamente lo que un jurado puede abrir y correr.

---

## 4. Las ocho ideas

**Carga** = si borras la integración, ¿se rompe el producto? (descalificador #2 de
`sponsor_track_rules.md`). Las tachadas murieron con el inventario corregido de §2.

| # | Idea | Pistas | Encaje | Carga | Riesgo | Veredicto |
|---|---|---|---|---|---|---|
| 1 | **Agentes que pagan por dato** (x402 sobre las señales + el sello) | Hedera $6k | 5 | **5** | 3 | ✅ **Eje** |
| 3 | **Identidad sin proveedor** (World ID) | World $7k | **5** | **5** | 2 | ✅ **Eje** |
| 5 | **`negocio.creva.eth`** | ENS $500 | 3 | 2 | **1** | 🟡 Día 10 |
| 8 | **El respaldo nace on-chain** (Arc, greenfield) | Arc $10k | 4 | 5 | **5** | 🟡 Apuesta B |
| 2 | ~~Pasaporte de crédito ZK~~ | — | — | — | — | ❌ Sin pista de ZK; el sello ya da el relato |
| 4 | ~~Migrar el colateral a Arc~~ | — | — | — | — | ❌ No hay colateral que migrar → ver 8 |
| 6 | ~~Agentes Pierre sobre datos vivos~~ | — | — | — | — | ❌ Dependía de 4 |
| 7 | ~~Bóveda con rendimiento~~ | — | — | — | — | ❌ Cambia el perfil de riesgo de un colateral que no existe |

### 1 · Agentes que pagan por dato — x402 sobre las señales y el sello ✅

Creva consulta registros oficiales bajo una **cuota diaria de toda la organización** (regla #19). Hoy
es una restricción que obliga a cachear. Conviértela en **producto**: el servicio de señales y la
verificación del sello quedan *gated* por **HTTP 402**; un agente que evalúa a una proveedora paga
0.01 USDC por consulta, el facilitador liquida en Hedera, y la respuesta sale firmada.

**Por qué carga peso:** la cuota deja de ser de Creva y pasa a ser de quien pregunta. Borras x402 y
vuelve el problema económico original. Es lo contrario de una integración pegada.

**Por qué es el eje ahora y no lo era antes:** las dos piezas que consume —señales y sello— son las
dos que §2 confirma **vivas**. Cero dependencia de tarjeta, colateral o KYC.

Hedera pide, textual: servicio x402 vivo, plataforma que lo consuma, y **una petición pagada real**.
Su esquema usa transacciones parcialmente firmadas donde **el facilitador paga el gas**
([Hedera](https://hedera.com/blog/hedera-and-the-x402-payment-standard/), leído 2026-08-31) — menos
fricción de wallet en la demo.

### 3 · Identidad sin proveedor — World ID ✅

El hueco es **más grande** de lo que decía la revisión 1: no es que el proveedor se desconectó, es
que **el KYC nunca llegó a producción** y el que iba en casa está decidido, no construido. World
publica las dos piezas:

- **Selfie Check** — vivacidad y unicidad de baja fricción para el alta; World pide tratarla como
  **señal de riesgo/elegibilidad**, no como identidad completa. Encaja literal con la regla #20 de
  Creva: *un dato declarado se etiqueta, no se disfraza*.
- ❌ **AgentKit — bloqueado, comprobado el 2026-09-01.** El agente se registraba en **AgentBook**,
  registro onchain en World Chain, con `createAgentkitHooks` como middleware. Pero el prerrequisito
  que publica World es literal: *"A verified World ID ([find an Orb here](https://world.org/find-orb))"*
  ([world.org](https://world.org/blog/product/how-to-create-verified-ai-agents-agentkit)), y
  TechCrunch lo confirma al cubrir el lanzamiento: hace falta un World ID **derivado de un escaneo de
  Orb**. **No hay Orbs en Colombia** — World App lo dice al intentarlo. La credencial de pasaporte NFC
  existe y Colombia está en su lista, pero **no sustituye al Orb para este registro**.

**Las dos pistas de World tienen puertas distintas, y esa es la diferencia que salva la mitad:**
Selfie Check no exige Orb —*"anyone with World App can complete the flow — no Orb or document
credential is required"*— y además trae un Sandbox para probar la integración de punta a punta. La
que exige Orb es AgentKit, porque ahí el verificado tiene que ser **el desarrollador**; en Selfie
Check el verificado es **la usuaria de tu app**.

Queda entonces una pista de $3.5k, no dos. Sigue tapando un hueco real y sigue pidiendo documento de
feedback. **Lo que se pierde es el puente gratis con x402**: sin AgentKit, el x402 de la idea 1 se
implementa directo contra un facilitador de Hedera — BlockyDevs publica uno open source con soporte
de Hedera testnet — que es más trabajo, pero no está bloqueado.

### 5 · `negocio.creva.eth` 🟡

Subnombres ENSv2 con el resolver guardando el folio del reporte sellado. Registries jerárquicos, en
**Sepolia** ([ENS](https://ens.domains/blog/post/ens-app-alpha)); ENS Labs **canceló Namechain** y v2
va sobre mainnet ([The Block](https://www.theblock.co/post/388932/ens-labs-scraps-namechain-l2-shifts-ensv2-fully-ethereum-mainnet), leídos 2026-08-31).
Carga baja — si lo borras, Creva sigue. Candidato a la pista de **$500**: barato el día 10, peligroso
como eje.

### 8 · El respaldo nace on-chain — la idea que nace de la corrección 🟡

Nueva, y la única buena noticia de que el colateral no exista: **no hay nada que migrar**. Un respaldo
en USDC sobre Arc es *greenfield*, y —el punto de verdad interesante— **no tiene dependencia de
proveedor**, que es exactamente lo que hundió a Reap y a Dynerox. Arc: testnet pública desde
oct-2025, ~244M transacciones a may-2026, liquidación <0.5 s, **mainnet el 16 de septiembre de 2026**
—el último día del hackathon—
([Circle](https://www.circle.com/pressroom/circle-launches-arc-public-testnet) ·
[PYMNTS](https://www.pymnts.com/earnings/2026/circle-chases-agentic-growth-scale-stablecoin-infrastructure/), leídos 2026-08-31).

**Y aun así no la recomiendo como eje.** Tres razones: es la pieza que ya falló dos veces, un
respaldo que toca dinero real de una usuaria no es lo que se prototipa en 12 días asíncronos, y la
pista 3 de Arc pide compromiso de **mainnet antes del 30 de septiembre** — obligación que sobrevive
al evento.

Si aun así la quieres, es una **apuesta B completa y excluyente**: eje Arc + The Graph leyendo el
colateral vivo, con World de complemento. **No se mezcla con la apuesta A.**

---

## 5. Recomendación

**Un producto, dos patrocinadores, un solo relato — y todo sobre piezas que ya corren.**

> **Creva Agentes** — la emprendedora prueba que es humana una vez, y de ahí en adelante **cada
> consulta y cada verificación de sello se paga**, en vez de gastar la cuota de Creva.

```text
Selfie Check (World)  →  el alta, donde nunca hubo KYC
       ↓
x402 en Hedera        →  cada consulta de señales y cada verificación de sello se paga y se liquida
       ↓
El sello (ya vivo)    →  la respuesta sale firmada, y dice qué NO acredita
```

**Pistas objetivo:** World Selfie Check ($3.5k) + Hedera AI & Agentic Payments ($6k). Techo teórico
**$9,500**; expectativa realista, una.

> **Rev. 3, 2026-09-01 — cayó AgentBook.** El plan tenía tres pistas y $13,000 de techo. AgentKit
> exige World ID de Orb y **no hay Orbs en Colombia** (§4, idea 3), así que se van $3.5k y el paso de
> registro onchain. El eje **no cambia**: x402 sobre Hedera nunca dependió de AgentKit, solo iba a
> heredar su middleware. Se implementa contra un facilitador de Hedera y sigue en pie.
>
> **Rev. 4, 2026-09-01 — el hueco lo llena Privy, y con ventaja.** Publicó sus dos pistas de $2,500:
> **Best B2B financial product** y **Best financial flow**. La primera describe a Creva casi
> literalmente —cuentas de negocio, gestión de gasto, wallets de organización— y pide *un control de
> Privy*: políticas, firmantes, quórums o intents. La segunda pide **un flujo financiero funcional**,
> y acepta transferencias.
>
> Lo elegante: **una sola integración cubre las dos.** La wallet de Privy es la que paga el x402
> —eso es la transferencia de la pista 2— y la política de gasto que la limita es el control de
> negocio de la pista 1. No son dos trabajos, es uno contado dos veces.
>
> ⚠️ **Privy no trae Hedera preconfigurada.** Soporta cualquier cadena EVM vía `supportedChains` con
> `defineChain` de viem: hace falta chain ID **296**, el JSON-RPC Relay de Hedera, moneda nativa y
> explorador. Es media hora si sale bien y una tarde si no. Verificarlo el día 1, no el día 8.

**Por qué esta y no otra:**

1. **Solo toca lo que existe.** Señales y sello están vivos; ni tarjeta, ni colateral, ni ZK.
2. Las integraciones tapan huecos reales — bórralas y el producto se rompe.
3. Ninguna de las dos exige Orb, credencial ni trámite con espera.
4. Las dos piden documento de feedback: puntaje barato.
5. El video de 60 s se cuenta solo: *"probó que era humana, su agente pagó un centavo, y la respuesta
   llegó firmada — y el reporte dice qué no acredita."*

**Dónde queda el ZK:** **pausado, y como la última frase del video** ("en qué se convierte después",
`slice_demo_hackathon.md`). El sello firmado y el sello de conocimiento cero son el mismo puerto con
distinta implementación — `creva-zk` ya tiene los circuitos y la latencia medida. Retomarlo cuando
haya una pista que lo pague, o cuando un tercero real pida no ver el insumo.

---

## 6. La rebanada

Un solo camino vertical, de más fácil a más difícil. **El paso 0 se cayó entero**: la firma y las
llaves de gobierno ya están vivas en producción (§2). Queda una sola comprobación antes de arrancar.

0. ✅ **Croma acepta la llave** — ejercido el 2026-09-01: el radar respondió `sources_unavailable: []`
   y `failed_dates: []` sobre siete días, y la llave que lo consiguió es **la misma** que tiene
   producción (huella `80a1aa1e9347` en los dos lados). Falta ejercer **Banxico SIE** y la ruta
   **SIEM** del directorio, que son otro proveedor y otra ruta → `docs/verificacion.md`.
1. **Selfie Check en el alta** — degradando a `identity_unavailable` sin key. (½ día)
2. **Señales y `/verify` detrás de 402** — los endpoints ya existen; se les pone el header de pago. (1 día)
3. **Facilitador de Hedera + una petición pagada real**, grabada. (2–3 días — subió al caer AgentKit,
   que traía el middleware hecho)
4. **El agente cierra el ciclo**: consulta, paga, verifica el sello y devuelve una recomendación
   explicable. (2 días)

El paso de **AgentBook salió** — exigía World ID de Orb, y no hay Orbs en Colombia (§4, idea 3).

Cuatro artefactos: app corriendo · `index.html` de pitch · `slides.html` · video de 60 s grabado por
script. Última media jornada **solo** para el envío: permalinks, versiones, clon limpio, `.env.example`.

---

## 7. Riesgos y lo que falta verificar

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | **Banxico SIE y la ruta SIEM siguen sin ejercerse** — Croma ya respondió (DOF + CNBV), pero son otro proveedor y otra ruta | Ejercer las dos antes del día 3; es la mercancía que se vende por x402 |
| 2 | **Stake en ETH** — monto no confirmado | Confirmarlo en el dashboard antes de aceptar |
| 3 | ~~AgentKit exige World ID verificado~~ — **materializado el 2026-09-01**: exige Orb, y no hay Orbs en Colombia | Pista abandonada. El eje sobrevive porque x402 no dependía de ella; queda $3.5k por reasignar → §5 |
| 4 | El servicio x402 debe seguir **vivo durante la evaluación** | Ya está en Cloud Run; desplegar el día 3, no el 15 |
| 5 | Regla #1 de Creva: **no exponer business logic** | El repo del hackathon consume Creva por API, como hizo `creva-zk` |

**Pendientes de verificar (⏳ — nada de esto está comprobado):**

- Monto del stake y hora exacta de cierre de entregas.
- Qué es **Bazantic** — único patrocinador sin rastro público, y el único que podría traer pista de ZK.
- Si entra el equipo (Soho, Majo, Tam, Ale, Alejo) o vas solo — cada quien necesita stake propio.
- ✅ **Selfie Check no exige Orb** — *"anyone with World App can complete the flow"*, y tiene Sandbox
  para probar la integración. Falta confirmar qué documentos acepta en México.
- ✅ **Hedera testnet abierta, sin lista de espera** — cuenta creada el 2026-09-01 en `portal.hedera.com`.
- ✅ **World ID verificado con pasaporte NFC** (2026-09-01). No desbloquea AgentBook —eso pide Orb—
  pero permite ejercer el flujo de Selfie Check como usuaria, que es lo que se va a integrar.
- Precio por consulta que haría rentable el metering (hoy la cuota es un techo, no un precio).

## 8. Estado del arranque — 2026-09-03

| # | Qué | Estado |
|---|---|---|
| 1 | **Aplicación a Continuity** | ✅ **enviada el 2026-09-01, con ENS incluido** — en revisión |
| 2 | **Stake en ETH** | ✅ **0.025 ETH pagado el 2026-09-03** |
| 3 | **Repo público nuevo** | ⏳ no existe |
| 4 | World ID (pasaporte NFC) | ✅ |
| 5 | Cuenta de Hedera testnet | ✅ ECDSA, dirección EVM |
| 6 | **Acceso a Bazantic** | ✅ **confirmado el 2026-09-04** — cuenta creada, dashboard con Gateways/Recipes/API Keys |
| 7 | **Spec OpenAPI pública** | ✅ desplegada el 2026-09-01 — requisito del formulario de Bazantic |

**Bazantic confirmó el acceso el 2026-09-04**, antes del SLA de 2 días hábiles anunciado. Cuenta
personal activa, sin JWT ni gateway creados todavía.

**Presupuesto de prueba, según Bazantic (2026-09-04):** el primer gateway creado da de crédito
**~0.30 USDC**, suficiente para las pruebas. Dos formas de no gastarlo de más mientras se prueba:
crear un JWT que **bypassea x402/MPP**, o poner cada método del gateway en **$0.00** durante el
desarrollo y subir el precio real recién antes de la demo/entrega.

**Lo que destapó ese trámite** (y se queda, con acceso o sin él): el formulario pedía una spec, Creva
no tenía, y montarla con `@nestjs/swagger` reveló **46 rutas y 52 operaciones** frente a las 22 que
la referencia escrita a mano listaba. Vive en `/api/docs` y `/api/docs-json`, bilingüe, desplegada.
Es trabajo **previo** —no cuenta para el juicio— y sirve a los tres frentes: Bazantic, los jueces y
el propio gateway x402.

**ENS quedó comprometido.** La solicitud se envió nombrándolo, así que ahora **hay que entregarlo** —
no es opcional. Es la pista de $500 de integración a proyecto existente; barata, pero prometida.

**Decisiones abiertas:** ¿equipo o solo? (hoy sin equipo en el dashboard) · si Bazantic no contesta a
tiempo, x402 vuelve a implementarse a mano contra un facilitador de Hedera.

### Ledger, publicado el 2026-09-03 — encaje débil con el eje actual

Las cuatro direcciones que pide Ledger (§ tabla de arriba) son: secretos de agente que nunca salen del
Key Ring, enrolar un host sin USB (VPS/CI) al Key Ring, pagos de agente vía Ledger, y aprobación
humana antes de mover fondos o escalar permisos. **Todas exigen el Ledger Key Ring CLI
(`wallet-cli ring`)** como pieza central, no accesoria.

El eje recomendado en §5 ya tiene su capa de pago resuelta con **Privy** (wallet + política de gasto,
rev. 4) y su liquidación con **Hedera x402**. Meter el Key Ring ahí sería una segunda wallet compitiendo
por el mismo rol — carga sin necesidad, el descalificador #2 de nuevo. El encaje honesto sería distinto:
usar `wallet-cli ring` como el backend de llaves que hoy son variables de entorno planas en
`creva-backend` (`CREVA_SIGNING_KEY`, `CROMA_API_KEY`, `BANXICO_SIE_TOKEN`, `CREVA_SIGNING_PUBLIC_KEY`,
§2) — eso calza con **Continuity** ("make `wallet-cli ring` the key backend for the `.env` ... files
your repo already has") sin tocar el eje de pagos. Sigue siendo una **quinta pista** además de las dos
ya elegidas, y compite por el mismo tiempo de los 12 días.

**No entra a la rebanada de §6 por ahora.** Se marca como pista oportunista de día 10+ si sobra tiempo,
igual que ENS — con la diferencia de que ENS ya está prometido y Ledger no.

---

## 9. Calendario y reglas de finalista — kickoff, 2026-09-04

**Fuente:** datos del kickoff de ETHOnline 2026 suministrados el 2026-09-04. No es una URL pública —
si algo de aquí necesita citarse hacia afuera, buscar la página equivalente en ethglobal.com antes
de repetirlo.

### 9.1 · Los dos starting points, con nombre propio

El deck nombra dos tarjetas que antes este documento agrupaba bajo "Continuity":

| Tarjeta | Starting point | Qué es |
|---|---|---|
| 02 · **Extend Open Source** | `your-repo → +new feature` | Traer un repo que ya mantienes, u contribuir a OSS existente |
| 03 · **Ship a Feature** | `private → public` | Construir una funcionalidad nueva sobre un producto **privado** existente, y publicarla como open source |

**Creva es privado**, así que el encaje real es **03 · Ship a Feature**, no 02. Vale la pena que la
solicitud y el README del repo público lo digan con ese nombre exacto si el dashboard lo pide así.

### 9.2 · "Start from scratch" — decisión, no confirmación externa

La diapositiva **"How to be a Finalist"** lista, entre los cuatro requisitos, **"Your project must
start from scratch"** — junto a "repo auditable", "open source, deployed, and live" y "judging en
vivo". A primera lectura choca con §0.1 de este documento, citado con fuente: Continuity permite
explícitamente extender un producto privado existente.

**Decisión (2026-09-04):** se trata como no aplicable a esta entrada. **Aplicamos por Continuity**,
y la regla del track (§0.1, con fuente y fecha) es más específica que una línea genérica de una
diapositiva de kickoff — la más específica manda. **Esto es una decisión del equipo, no una
confirmación de ETHGlobal**: si en la sesión de feedback (9.4) o el Q&A del 09/14 sale información
que la contradiga, se revierte aquí con fecha y fuente, como cualquier corrección documentada.

### 9.3 · Cupos de finalista y premio

Hasta **10 equipos finalistas**: **7** en From Scratch Track, **3** en Continuity Track. Los premios
de patrocinador (tabla de §1) **no afectan** ser o no finalista — son ejes independientes.

**Paquete de finalista:** ETHGlobal Plus 12 meses · **1,000 USDC por integrante del equipo** · $500 de
crédito de vuelo al próximo hackathon · Pro Pass gratis a ETHConf 2027 · eventos privados con
founders · $15,000+ en créditos de desarrollador.

### 9.4 · Checkpoints — de aquí al final

| Cuándo | Qué | Nota |
|---|---|---|
| Próxima semana (semana del 09/07) | **Check-in 2x**, vía el hacker dashboard | El stake se devuelve solo si se responde a los check-ins **y** se entrega el proyecto |
| Martes 09/08, 2:00–4:00 PM ET | Sesión de feedback 1 | Con mentores de ETHOnline 2026 |
| Jueves 09/10, 9:00–11:00 AM ET | Sesión de feedback 2 | Con mentores de ETHOnline 2026 |
| Domingo 09/14 | **Q&A en vivo, 3 minutos** | Formato de judging en vivo — preparar el pitch a esa duración exacta |

### 9.5 · SDD y el repo de submission — regla que cambia lo privado

> *"If you use [spec-driven workflows like OpenSpec, Kiro, spec-kit], you must include all spec
> files, prompts, and planning artifacts in your submission repository. Judges need to see the full
> picture of how you directed the AI, not just the generated output."*

Esto **contradice el default** de este flujo de trabajo, donde `docs/` es privado y gitignored
(`agent_contract.md`, `documentation.md`). Si el repo de submission usa el ciclo SDD de
`procedures/00_Files/basic_workflow.md`, hay que decidir **qué parte de `docs/` se vuelve pública**
en vez de asumir que todo se queda oculto por default. Pendiente de decisión — ver bloque en
`docs/plan.md` de esta carpeta.

### 9.6 · Video demo

Nota propia: **el video tiene que ser bueno**, no solo cumplir el tiempo. Cae dentro del rango de
2–5 min que ya pide cada patrocinador (§1) y alimenta también el Q&A de 3 minutos del 09/14 — un
mismo guion corto sirve para ambos si se escribe pensando en el más estricto (3 min).

---

## Verify

- [ ] Cada cifra de este documento tiene fuente y fecha
- [ ] El arquetipo (Continuity) está escrito donde el equipo lo vea
- [ ] Ninguna integración elegida se puede borrar sin romper el producto
- [ ] **Ninguna idea recomendada depende de tarjeta, colateral, KYC o ZK**
- [ ] Los pendientes están marcados como pendientes, no afirmados
