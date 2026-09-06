<!-- docs/integrations/chainlink-automation.md: diseño y operación de la integración Chainlink —
     RegulatoryAlertRegistry + el endpoint /regulatory/pending + el workflow CRE que produce el
     cambio de estado on-chain que exige la pista Upgrade ($500). Se distingue de
     onchain-attestation.md: ese cubre AttestationRegistry (que un reporte existió); este cubre que
     las reglas bajo un reporte se movieron después de anclarlo. -->

# Chainlink — el radar regulatorio dispara un cambio de estado on-chain

**Veredicto: GO** (2026-09-06). El prerrequisito que bloqueaba esta pista —"que exista un contrato
on-chain real de Creva que Chainlink pueda leer o disparar" (`docs/plan.md`)— quedó resuelto por el
bloque de attestation (`AttestationRegistry`, commit `f9457c8`). Con eso, hay una forma honesta y
load-bearing para la pista **Best Chainlink-Powered Upgrade ($500, solo Continuity)**.

## Qué exige la pista y cómo se cumple

> "The Chainlink integration must contribute to a state change on a blockchain. Simply displaying
> Chainlink data in a frontend is not sufficient." — y usar al menos un servicio Chainlink de la
> lista: **CRE**, Price Feeds, Data Streams, PoR o VRF.

- **Servicio usado:** Chainlink **CRE** (Chainlink Runtime Environment) — un workflow con trigger de
  cron. CRE está en la lista textual de la pista; su cron/log trigger sustituye a lo que antes se
  llamaba Automation.
- **Cambio de estado on-chain:** `RegulatoryAlertRegistry.performUpkeep()` emite `RegulatoryFlag`
  por cada folio afectado y marca `normFlagged[normId] = true`. No es "mostrar un dato": es una
  escritura de estado que solo el workflow de Chainlink dispara.
- **Cómo mejora el proyecto:** hoy el sello (`AttestationRegistry`) certifica que un reporte
  existió en un momento. No dice nada si, semanas después, cambia la norma que ese reporte asumía.
  Esta integración cierra ese hueco: cuando el radar regulatorio del core detecta una norma nueva
  que toca crédito PyME, el folio anclado queda marcado on-chain como "revisar contra norma NNNN".

## Arquitectura

```
core: GET /creva-score/radar ──► gateway: GET /regulatory/pending?since=<cursor>
                                        │  (radar alerts filtrados por fecha + folios del subgraph)
                                        ▼
        Chainlink CRE workflow (cron)  ── lee el endpoint
                                        │  si hay norma nueva y hay folios anclados:
                                        ▼
        tx: RegulatoryAlertRegistry.reportPending(normId, folios[])   (cuenta reporter)
                                        ▼
        Chainlink upkeep: checkUpkeep() == true  ──►  performUpkeep(performData)
                                        ▼
        eventos RegulatoryFlag(folioHash, normId, ts)  +  normFlagged[normId] = true
```

### El contrato — `contracts/src/RegulatoryAlertRegistry.sol`

- `reporter` (immutable): la única cuenta que puede publicar una norma pendiente. En producción es
  el consumer de Chainlink Functions; en el demo local es el signer del gateway.
- `forwarder`: lo escribe el `reporter` una sola vez con la dirección del Automation forwarder que
  Chainlink entrega **después** de registrar el Upkeep. `address(0)` = cualquiera puede
  `performUpkeep` (así corren el demo y los tests).
- `reportPending(normId, folios[])`: fija la única norma pendiente y su set de folios.
- `checkUpkeep(bytes)`: view. Devuelve `(pendingNormId != 0 && !normFlagged[pendingNormId],
  abi.encode(pendingNormId, pendingFolios))`.
- `performUpkeep(performData)`: revierte salvo que `performData` sea **exactamente** lo que
  `checkUpkeep` devolvería ahora mismo (compara `keccak256`). Si pasa: emite un `RegulatoryFlag`
  por folio, marca la norma, y limpia el slot pendiente.

**Invariante probada** (`contracts/test/RegulatoryAlertRegistry.t.sol`, sección invariant):
`performUpkeep` solo cambia estado si `checkUpkeep` devolvió `true` con ese mismo payload — un
payload viejo o fabricado revierte y no escribe nada. Además: toda norma marcada pasó antes por
`reportPending`, y el nº de `performUpkeep` exitosos nunca supera el nº de normas distintas
reportadas.

### El endpoint — `gateway/src/regulatory.ts`

`GET /regulatory/pending?since=<block|fecha ISO|timestamp unix>`

- `since` fecha/timestamp → filtra las alertas del radar por `published_at >= since`.
- `since` como entero pequeño → se trata como altura de bloque y solo pasa como cursor (mapear
  bloque→fecha necesitaría un archive node; el workflow CRE, que sí conoce el bloque de anclaje, lo
  resuelve de su lado o usa `latestAttestationBlock` de la respuesta).
- `normId = keccak256("<radar source>|<external_id>")` — determinista, para que workflow y contrato
  direccionen el mismo `bytes32`.
- `folios`: todos los `FolioAttestation.id` del subgraph. El radar es un escaneo global por diseño
  (misma respuesta para todo usuario, sin datos personales — `creva_finance` tiene un invariante
  `radar-carries-no-personal-data`), así que una norma nueva aplica por igual a todos los folios
  anclados.
- Try/catch en todo: radar caído o subgraph roto → `pending: null` + `radarError`/`subgraphError`,
  nunca un throw ni un 5xx.

**Costura honesta documentada:** el core NO liga una norma a un folio concreto — no expone esa
señal. El diseño la asume: norma global → marca sobre el conjunto de folios anclados. Y el puente
off-chain→on-chain (`reportPending`) lo hace un job de Chainlink Functions o el signer del gateway,
no el `checkUpkeep` (que no puede hacer HTTP). Ninguna de las dos cosas es invención: son la forma
estándar de CRE/Functions + Automation.

## Demo local (anvil) — ciclo completo, evidencia real 2026-09-06

```
registry deploy         → 0x5FbDB2315678afecb367f032d93F642f64180aa3  (constructor: reporter = signer)
normId                  → 0x4133ffae80f52a7e17533d9f20272a6356754dbd39bbfac7746ac4faffcd8f39
folios                  → [0xbad55c…48af7, 0x949eaa…70116]

reportPending(...)      → status 0x1, evento RegulatoryPending(normId, folioCount=2)   [bloque 2]
normFlagged  BEFORE     → false
checkUpkeep  BEFORE     → true, performData = 0x4133ffae…(normId)+offset+len2+folioA+folioB

performUpkeep(performData) → status 0x1                                                [bloque 3]
   log 0  RegulatoryFlag(folioHash=0xbad55c…, normId=0x4133ffae…)   topic0 0x3fc1af39…
   log 1  RegulatoryFlag(folioHash=0x949eaa…, normId=0x4133ffae…)   topic0 0x3fc1af39…
   log 2  RegulatoryCleared(normId=0x4133ffae…)                     topic0 0xa47ccf49…

normFlagged  AFTER            → true          ← el cambio de estado on-chain
folioFlagged[norm][folioA]    → true
pendingNormId AFTER           → 0x00…00
checkUpkeep  AFTER            → false

replay del mismo performData  → revert  NothingPending() (0x175c1aea)   ← no re-dispara
```

## Registro del Upkeep en Chainlink — pasos externos

Se hace con su cuenta; el agente no crea cuenta Chainlink.

1. **Desplegar el contrato** a una red que Chainlink Automation soporte (Sepolia recomendado, es la
   que ya indexa el subgraph):
   ```bash
   cd contracts
   export ARC_SIGNER_PRIVATE_KEY=<key>          # ya está en gateway/.env
   forge script script/DeployRegulatoryAlertRegistry.s.sol --rpc-url "$SEPOLIA_RPC_URL" --broadcast
   ```
   Anotar la dirección en `docs/plan.md` y en `gateway/.env` como
   `REGULATORY_ALERT_REGISTRY_ADDRESS`.
2. **CRE / Functions — publicar la norma pendiente.** Crear un workflow CRE con trigger de cron
   (p. ej. cada 6 h) que:
   - haga `GET https://<gateway>/regulatory/pending?since=<último bloque visto>`;
   - si `pending != null` y `folios.length > 0`, envíe una tx a
     `reportPending(pending.normId, folios)` firmada por la cuenta `reporter`.
   Registrar la dirección de ese consumer como `REGULATORY_REPORTER` **antes** de desplegar el
   contrato (o desplegar con el signer como reporter para el demo y redeployar después).
3. **Registrar el Upkeep** en [automation.chain.link](https://automation.chain.link):
   - "Register new Upkeep" → **Custom logic**.
   - Target contract address: la del paso 1.
   - Gas limit: 500000 es holgado (el demo gastó ~0x18ab2 ≈ 101k con 2 folios).
   - Check data: `0x` (el contrato ignora `checkData`).
   - Fondear el Upkeep con LINK.
4. **Fijar el forwarder.** Tras registrar, Chainlink asigna una dirección de forwarder al Upkeep
   (visible en la UI del Upkeep, campo "Forwarder address"). Desde la cuenta `reporter`:
   ```bash
   cast send $REGULATORY_ALERT_REGISTRY_ADDRESS "setForwarder(address)" <forwarder> \
     --rpc-url "$SEPOLIA_RPC_URL" --private-key $ARC_SIGNER_PRIVATE_KEY
   ```
   A partir de ahí solo el forwarder de Chainlink puede llamar `performUpkeep`.
5. **Verificar en vivo:** disparar una norma de prueba con `reportPending`, esperar a que el Upkeep
   la recoja, y confirmar el `RegulatoryFlag` en el explorador + `normFlagged(normId) == true`.

## CRE Confidential Workflows ($2k) — estado

Requisitos **publicados** (revisado 2026-09-06):

> "Build a CRE Workflow that uses the Confidential Workflows to execute a meaningful part of the
> application… must register and use a confidential TEE handler… the confidential portion must
> process at least one sensitive input, secret, confidential API response, private parameter, or
> intermediate value inside the enclave."

**Encaje: débil — no se persigue.** El path de datos de esta integración (radar → folios anclados)
es deliberadamente **no sensible**: el radar es idéntico para todo usuario y `creva_finance` tiene
un invariante que prohíbe datos personales ahí. Meter un TEE handler en este flujo sería teatro, no
uso significativo. El scoring del core sí procesa insumos sensibles y encajaría, pero el scoring
vive en `creva_finance` (solo lectura) y moverlo a un workflow CRE está fuera del alcance de este
repo y del eje del proyecto (§10.5 brainstorming). Se registra como evaluado y descartado sin
forzar (descalificador #2).
