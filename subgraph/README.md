<!-- subgraph/README.md: cómo se compila y despliega el subgraph que indexa AttestationRegistry.
     No es la doc de diseño del mecanismo (esa vive en docs/integrations/onchain-attestation.md);
     aquí solo van los comandos exactos de codegen/build/deploy y qué variable poner dónde. -->

# Creva attestation subgraph

Indexes `AttestationRegistry.Attested(bytes32 folioHash, address attester, uint256 timestamp)` into
a `FolioAttestation` aggregate. The gateway queries it by folio hash and turns `distinctAttesters`
into the `/creva-score/verify` trust signal (`unattested` / `attested` / `corroborated`).

## Build (no key needed)

```bash
cd subgraph
npm install
# 1. put the deployed registry address + start block into networks.json (sepolia block)
npm run codegen
npm run build            # graph build --network sepolia (reads networks.json)
```

`codegen` + `build` are what the gateway CI runs — they need no Studio key.

## Deploy to Subgraph Studio (needs the deploy key)

1. Create a subgraph named `creva-attestations` at https://thegraph.com/studio/ and copy its deploy key.
2. Fill `networks.json` with the real registry address and the block it was deployed at.
3. Run:

```bash
cd subgraph
graph auth <DEPLOY_KEY>
npm run codegen
graph deploy creva-attestations --network sepolia --version-label v0.0.1
```

4. Copy the resulting query URL (`https://api.studio.thegraph.com/query/<id>/creva-attestations/<version>`)
   into `gateway/.env` as `SUBGRAPH_URL`.

## Network note

The `AttestationRegistry` is deployed on **Arc testnet** for the Arc track and (optionally) on
**Sepolia**. Subgraph Studio does not index Arc testnet, so the subgraph tracks the **Sepolia**
deployment. `arc-anchor.ts` writes to whichever registry `REGISTRY_ADDRESS` points at; for the
subgraph-backed trust signal to move, that must be the Sepolia registry the subgraph indexes.
