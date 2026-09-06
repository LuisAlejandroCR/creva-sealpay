<!-- contracts/README.md: cómo compilar, testear y desplegar los contratos Foundry del proyecto
     (AttestationRegistry y RegulatoryAlertRegistry). El diseño y el porqué de cada mecanismo viven
     en docs/integrations/*.md; aquí solo comandos. Se distingue de subgraph/README.md, que cubre
     el indexado de los eventos, no los contratos. -->

# AttestationRegistry (Foundry)

Minimal on-chain attestation log for sealed Creva report hashes. `attest(bytes32 folioHash)` emits
an indexable `Attested` event; a subgraph turns the distinct-attester count into the
`/creva-score/verify` trust signal.

## Setup

`lib/` is gitignored — install forge-std on a fresh checkout:

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit    # or: git clone --depth 1 https://github.com/foundry-rs/forge-std lib/forge-std
forge build
forge test
```

## Deploy

```bash
export ARC_SIGNER_PRIVATE_KEY=<key>               # already in gateway/.env
forge script script/Deploy.s.sol --rpc-url "$ARC_RPC_URL" --broadcast        # Arc testnet
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC_URL" --broadcast    # Sepolia (subgraph-indexed)
```

Record the deployed address + deploy tx in `docs/plan.md`, and set `REGISTRY_ADDRESS` in
`gateway/.env` plus `address`/`startBlock` in `subgraph/networks.json`.

# RegulatoryAlertRegistry (Foundry)

On-chain log of regulatory changes that hit already-anchored folios. A Chainlink CRE workflow (or
an Automation custom-logic upkeep) calls `checkUpkeep`/`performUpkeep`; `performUpkeep` emits
`RegulatoryFlag` and marks the norm handled — the on-chain state change the $500 Chainlink Upgrade
track requires. Full design, the CRE workflow, and the Upkeep registration steps are in
`docs/integrations/chainlink-automation.md`.

```bash
forge test --match-contract RegulatoryAlertRegistry           # unit + fuzz + invariant
export ARC_SIGNER_PRIVATE_KEY=<key>                           # already in gateway/.env
export REGULATORY_REPORTER=<chainlink functions consumer>     # optional; defaults to the signer
forge script script/DeployRegulatoryAlertRegistry.s.sol --rpc-url "$SEPOLIA_RPC_URL" --broadcast
```

Set `REGULATORY_ALERT_REGISTRY_ADDRESS` in `gateway/.env` after deploy.
