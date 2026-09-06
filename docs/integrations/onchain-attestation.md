<!-- docs/integrations/onchain-attestation.md: el mecanismo load-bearing de The Graph — contrato
     AttestationRegistry + subgraph + enriquecimiento de /creva-score/verify con un trustSignal
     on-chain. Se distingue de docs/plan.md (ahí el checklist de aceptación del bloque) y de
     brainstorming.md §10.5 (ahí el porqué: por qué The Graph solo cuenta si mueve una salida real). -->

# Atestación on-chain — el dato de The Graph que mueve `/verify`

## Qué es

Tres piezas encadenadas, ninguna decorativa:

1. **`contracts/AttestationRegistry.sol`** — `attest(bytes32 folioHash)` emite
   `Attested(bytes32 indexed folioHash, address indexed attester, uint256 timestamp)`. Sin owner,
   sin fondos, sin upgrade. El valor vive en el log indexable, no en el storage.
2. **`gateway/src/arc-anchor.ts`** — el ancla ya no manda una tx valor-0 auto-dirigida con el hash
   en `data` (que no emitía log). Ahora llama `registry.attest(canonicalHash)`. La invariante dura
   se mantiene: valida `/^0x[0-9a-fA-F]{64}$/` antes de construir wallet/provider/contrato.
3. **`subgraph/`** — indexa `Attested` en `FolioAttestation { attestationCount, distinctAttesters,
   firstAttestedAt, lastAttestedAt }`. `distinctAttesters` solo crece cuando un `folioHash` es
   atestiguado por una dirección que no había firmado antes.
4. **`gateway/src/creva-proxy.ts`** — tras `/creva-score/verify`, el gateway consulta el subgraph
   por `folioHash` (derivado de `expected_digest`, 0x-prefijado y en minúsculas) y **agrega**:

   ```json
   "onchain": {
     "attestationCount": 2,
     "distinctAttesters": 2,
     "lastAttestedAt": "1788600000",
     "trustSignal": "corroborated"
   }
   ```

   `trustSignal` = `"corroborated"` si `distinctAttesters >= 2`, `"attested"` si `>= 1`,
   `"unattested"` si `0`. **Es una salida nueva que solo el dato on-chain mueve.** El veredicto de
   contenido y el de firma del core salen intactos al lado — el bloque `onchain` nunca los toca.

## La invariante que lo hace honesto

- Un folio con 0 attesters distintos on-chain **nunca** devuelve `trustSignal` distinto de
  `"unattested"` (`gateway/test/invariant/onchain-never-overrides-core-verdict.invariant.spec.ts`
  propiedad (a)).
- El veredicto de firma del core **nunca** cambia por el bloque `onchain` (propiedad (b)).
- Un subgraph caído / lento / que devuelve basura → `onchain: null` + `onchainError`, respuesta del
  core intacta, proceso vivo (propiedad (c), patrón try/catch aprendido del bug de `facilitator.ts`).

## `folioHash` — el binding entre ancla y verificación

El gateway atestigua por el **digest del reporte sellado**, 0x-prefijado y en minúsculas. La app
pasa ese mismo valor a `/creva-score/anchor` como `canonicalHash`. Los dos lados direccionan un
único `bytes32`. Para que el `trustSignal` se mueva de verdad, `REGISTRY_ADDRESS` en `gateway/.env`
debe apuntar al registry que el subgraph indexa (ver nota de red abajo).

## Despliegue (pasos externos)

### 1. Contrato

```bash
cd contracts
forge build
# Arc testnet (pista Arc) — usa ARC_SIGNER_PRIVATE_KEY del entorno:
export ARC_SIGNER_PRIVATE_KEY=<clave>        # ya está en gateway/.env
forge script script/Deploy.s.sol --rpc-url "$ARC_RPC_URL" --broadcast
# Sepolia (para que Subgraph Studio pueda indexarlo — Studio no indexa Arc testnet):
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC_URL" --broadcast
```

Anotar la dirección desplegada y el bloque en `subgraph/networks.json` y en `gateway/.env`
(`REGISTRY_ADDRESS`), y la tx de deploy en `docs/plan.md`.

### 2. Subgraph

```bash
cd subgraph
npm install
# poner address + startBlock reales en networks.json
graph auth <DEPLOY_KEY>          # del Subgraph Studio
npm run codegen
graph deploy creva-attestations --network sepolia --version-label v0.0.1
```

Copiar la query URL a `gateway/.env` como `SUBGRAPH_URL`.

### 3. Demo del mecanismo

```bash
# folioHash de un reporte real (0x + 64 hex del digest)
cast send $REGISTRY_ADDRESS "attest(bytes32)" $FOLIO --private-key <cuenta A> --rpc-url <rpc>
cast send $REGISTRY_ADDRESS "attest(bytes32)" $FOLIO --private-key <cuenta B> --rpc-url <rpc>
# esperar a que el subgraph indexe, luego POST /creva-score/verify de ese folio
# -> trustSignal pasa de "unattested" a "corroborated"
```

## Nota de red

`AttestationRegistry` se despliega en **Arc testnet** (pista Arc) y en **Sepolia**. Subgraph Studio
**no indexa Arc testnet**, así que el subgraph sigue la instancia de **Sepolia**. El `trustSignal`
del gateway se mueve con la instancia que el subgraph indexa.

## Lo que esto NO habilita

No crea superficie de swap: Uniswap sigue NO-GO. Sí deja la puerta abierta a Chainlink Automation
(disparar el radar regulatorio contra folios atestiguados) en una iteración posterior — fuera de
alcance de este bloque, pero el diseño no lo precluye.

## Decisión escogida

Atestiguar por el digest del reporte (no por un hash de la cadena `folio`) para que ancla y
verificación compartan un `bytes32` sin acoplar el gateway a internals del core. El subgraph indexa
la instancia de Sepolia porque Studio no soporta Arc testnet; el registry de Arc queda para la
narrativa de la pista Arc y para una futura corroboración cross-chain.
